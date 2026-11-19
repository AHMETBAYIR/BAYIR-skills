#!/data/data/com.termux/files/usr/bin/bash
# Verify an interactive note in the live Plasma/Firefox session.
#
# Usage:
#   ./verify_desktop.sh /abs/path/note.html [out.png] [--scroll N] [--close]
#
# Requires the bionic-runtime session (Plasma/Wayland + Xwayland), the
# Firefox wrapper and ImageMagick `import`. It does not use root, chroot or
# proot, and it does not stop the desktop.
#
# Why `import -window` and not Spectacle: on this runtime, Spectacle captured
# Xwayland windows (Firefox) as black while the page was rendered. Capturing
# the X11 window directly with ImageMagick produced the real page. Keep the
# wayland-screenshot.sh path for Wayland-native apps.

set -u

HTML="${1:-}"
OUT=""
SCROLL=0
CLOSE=0
if [ $# -ge 2 ] && [ "${2#--}" = "$2" ]; then
  OUT="$2"
  shift 2
else
  shift 1
fi
while [ $# -gt 0 ]; do
  case "$1" in
    --scroll) SCROLL="${2:-0}"; shift 2 2>/dev/null || shift 1 ;;
    --close) CLOSE=1; shift ;;
    *) shift ;;
  esac
done

if [ -z "$HTML" ] || [ ! -f "$HTML" ]; then
  echo "usage: verify_desktop.sh /abs/path/note.html [out.png] [--scroll N] [--close]" >&2
  exit 2
fi
HTML="$(readlink -f "$HTML")"

export DISPLAY="${DISPLAY:-:0}"
if [ -z "${XAUTHORITY:-}" ]; then
  PID="$(pgrep -f '[p]lasmashell' | head -1)"
  if [ -n "$PID" ] && [ -r "/proc/$PID/environ" ]; then
    XAUTHORITY="$(tr '\0' '\n' < "/proc/$PID/environ" | sed -n 's/^XAUTHORITY=//p' | head -1)"
    export XAUTHORITY
  fi
fi
if [ -z "${XAUTHORITY:-}" ] || [ ! -r "${XAUTHORITY:-/nonexistent}" ]; then
  echo "BLOCKED: no XAUTHORITY; is the Plasma session running?" >&2
  exit 3
fi

for bin in xdotool import; do
  command -v "$bin" >/dev/null 2>&1 || { echo "BLOCKED: missing $bin" >&2; exit 3; }
done

FF="$HOME/Apps/glibc/launch/firefox.sh"
[ -x "$FF" ] || { echo "BLOCKED: Firefox wrapper not found at $FF" >&2; exit 3; }

[ -n "$OUT" ] || OUT="$HOME/notes/evidence/desktop-$(date +%Y%m%d-%H%M%S).png"
mkdir -p "$(dirname "$OUT")"

EXPECT="$(sed -n 's:.*<title>\(.*\)</title>.*:\1:p' "$HTML" | head -1 | cut -c1-36)"
BEFORE="$(xdotool search --class firefox 2>/dev/null | sort || true)"
"$FF" --new-window "file://$HTML" >/dev/null 2>&1 &
LAUNCH_PID=$!

WID=""
MATCH=0
for _ in $(seq 1 25); do
  sleep 1
  AFTER="$(xdotool search --class firefox 2>/dev/null | sort || true)"
  if [ -n "$BEFORE" ]; then
    NEW="$(comm -13 <(printf '%s\n' "$BEFORE") <(printf '%s\n' "$AFTER") 2>/dev/null | tail -1)"
  else
    NEW="$(printf '%s\n' "$AFTER" | tail -1)"
  fi
  [ -n "$NEW" ] && WID="$NEW"
  [ -z "$WID" ] && WID="$(printf '%s\n' "$AFTER" | tail -1)"
  if [ -n "$WID" ]; then
    NAME="$(xdotool getwindowname "$WID" 2>/dev/null || true)"
    case "$NAME" in
      *Firefox*)
        if [ -z "$EXPECT" ] || [ "${NAME#*$EXPECT}" != "$NAME" ]; then MATCH=1; break; fi
        ;;
    esac
  fi
done

if [ -z "$WID" ]; then
  echo "BLOCKED: Firefox window did not appear (launcher pid $LAUNCH_PID)" >&2
  exit 4
fi

xdotool windowactivate --sync "$WID" >/dev/null 2>&1 || true
xdotool windowfocus --sync "$WID" >/dev/null 2>&1 || true
xdotool windowsize "$WID" 1000 1300 >/dev/null 2>&1 || true
xdotool windowmove "$WID" 20 20 >/dev/null 2>&1 || true
sleep 2

if [ "$SCROLL" -gt 0 ] 2>/dev/null; then
  xdotool key --window "$WID" ctrl+Home >/dev/null 2>&1 || true
  i=0
  while [ "$i" -lt "$SCROLL" ]; do
    xdotool key --window "$WID" Page_Down >/dev/null 2>&1 || true
    sleep 0.7
    i=$((i + 1))
  done
  sleep 1
fi

import -window "$WID" "$OUT" 2>/dev/null || { echo "BLOCKED: import failed" >&2; exit 5; }
TITLE="$(xdotool getwindowname "$WID" 2>/dev/null || echo '?')"
BYTES="$(wc -c < "$OUT" | tr -d ' ')"
if [ "$MATCH" = "1" ]; then
  echo "PASS wid=$WID bytes=$BYTES title=$TITLE"
else
  echo "PARTIAL wid=$WID bytes=$BYTES title=$TITLE expected=$EXPECT"
fi
echo "shot=$OUT"

if [ "$CLOSE" = "1" ]; then
  xdotool windowclose "$WID" >/dev/null 2>&1 || true
fi
