#!/usr/bin/env bash
# Verify an interactive note in a real browser and capture a screenshot.
#
# Usage:
#   ./verify_desktop.sh /abs/path/note.html [out.png] [--scroll N] [--close]
#
# Opens the note in a visible browser window on the current desktop session,
# matches the window title against the note's <title>, and captures the window.
# It works on X11 and Wayland, never uses root, and never stops the desktop.
#
# Exit codes: 0 PASS/PARTIAL, 2 usage, 3 blocked (no session or no browser),
# 4 no window appeared, 5 a capture tool exists but failed.
#
# Environment:
#   BROWSER            browser command to use (extra args allowed)
#   FIREFOX_WRAPPER    explicit launcher override, optional
#   NOTE_EVIDENCE_DIR  screenshot directory when out.png is omitted
#   DISPLAY, WAYLAND_DISPLAY, XAUTHORITY  taken from the session as-is; when
#                      they are unset, DISPLAY/WAYLAND_DISPLAY are read from a
#                      running compositor instead of assuming :0
#
# Why `import -window` first: on Xwayland, Wayland screenshot tools (Spectacle,
# grim) often capture an Xwayland window as black while the page is rendered.
# Capturing the X11 window directly returns the real page. Wayland and
# desktop-wide tools are the fallback here, not the default.

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

# Absolute path without assuming GNU readlink (macOS BSD readlink has no -f).
abspath() {
  if command -v readlink >/dev/null 2>&1 && readlink -f "$1" >/dev/null 2>&1; then
    readlink -f "$1" 2>/dev/null
  elif command -v realpath >/dev/null 2>&1 && realpath -- "$1" >/dev/null 2>&1; then
    realpath -- "$1" 2>/dev/null
  else
    case "$1" in /*) printf '%s\n' "$1" ;; *) printf '%s/%s\n' "$PWD" "$1" ;; esac
  fi
}
HTML="$(abspath "$HTML")"

# --- session -------------------------------------------------------------
# Use the session the caller is already in. Nothing is forced: a hard-coded
# DISPLAY breaks Wayland sessions and multi-seat X11 alike.
#
# When the caller has no session variables at all (a bare shell, an agent
# process, a cron job), look them up in a running compositor instead of
# guessing :0. Only the first process that reports one wins.
if [ -z "${DISPLAY:-}" ] && [ -z "${WAYLAND_DISPLAY:-}" ] && command -v pgrep >/dev/null 2>&1; then
  for PROC in '[p]lasmashell' '[k]win_wayland' '[k]win_x11' '[X]org' '[X]wayland' '[s]way' '[l]abwc'; do
    PID="$(pgrep -f "$PROC" 2>/dev/null | head -1 || true)"
    [ -n "${PID:-}" ] && [ -r "/proc/$PID/environ" ] || continue
    ENVD="$(tr '\0' '\n' < "/proc/$PID/environ" 2>/dev/null || true)"
    if [ -z "${DISPLAY:-}" ]; then
      D="$(printf '%s\n' "$ENVD" | sed -n 's/^DISPLAY=//p' | head -1)"
      [ -n "$D" ] && export DISPLAY="$D"
    fi
    if [ -z "${WAYLAND_DISPLAY:-}" ]; then
      W="$(printf '%s\n' "$ENVD" | sed -n 's/^WAYLAND_DISPLAY=//p' | head -1)"
      [ -n "$W" ] && export WAYLAND_DISPLAY="$W"
    fi
    [ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ] && break
  done
fi

if [ -z "${DISPLAY:-}" ] && [ -z "${WAYLAND_DISPLAY:-}" ]; then
  echo "BLOCKED: no DISPLAY or WAYLAND_DISPLAY; run from inside the desktop session" >&2
  exit 3
fi

if [ -z "${XAUTHORITY:-}" ] && [ -r "$HOME/.Xauthority" ]; then
  export XAUTHORITY="$HOME/.Xauthority"
fi

# Fallback for sessions started by another process, where the cookie path only
# exists in the compositor's environment (typical on Android/Termux Xwayland).
# This is the only branch that reads another process; a normal desktop never
# reaches it.
if [ -z "${XAUTHORITY:-}" ] && [ -n "${DISPLAY:-}" ] && command -v pgrep >/dev/null 2>&1; then
  for PROC in '[p]lasmashell' '[k]win_x11' '[k]win_wayland' '[X]org' '[X]wayland'; do
    PID="$(pgrep -f "$PROC" 2>/dev/null | head -1 || true)"
    if [ -n "${PID:-}" ] && [ -r "/proc/$PID/environ" ]; then
      XAUTHORITY="$(tr '\0' '\n' < "/proc/$PID/environ" | sed -n 's/^XAUTHORITY=//p' | head -1)"
      [ -n "${XAUTHORITY:-}" ] && { export XAUTHORITY; break; }
    fi
  done
fi

# X11 is only usable if the server accepts us; probe instead of assuming.
if command -v xdotool >/dev/null 2>&1 && xdotool getdisplaygeometry >/dev/null 2>&1; then
  X11=1
else
  X11=0
fi

# --- browser -------------------------------------------------------------
# First match wins: explicit wrapper, $BROWSER, PATH install, Termux wrapper
# path. The Termux wrapper is one candidate among others, never a requirement.
find_browser() {
  if [ -n "${FIREFOX_WRAPPER:-}" ] && [ -x "${FIREFOX_WRAPPER}" ]; then
    printf '%s\n' "$FIREFOX_WRAPPER"
    return 0
  fi
  if [ -n "${BROWSER:-}" ]; then
    set -- $BROWSER
    if command -v "$1" >/dev/null 2>&1; then
      printf '%s\n' "$BROWSER"
      return 0
    fi
  fi
  for CAND in firefox chromium chromium-browser google-chrome brave-browser; do
    if command -v "$CAND" >/dev/null 2>&1; then
      printf '%s\n' "$CAND"
      return 0
    fi
  done
  for CAND in "$HOME/Apps/glibc/launch/firefox.sh"; do
    if [ -x "$CAND" ]; then
      printf '%s\n' "$CAND"
      return 0
    fi
  done
  return 1
}

if ! BROWSER_CMD="$(find_browser)"; then
  echo "BLOCKED: no browser found; set \$BROWSER or install firefox/chromium" >&2
  exit 3
fi

# The wrapper and $BROWSER may carry arguments, so launch unquoted there.
launch() {
  case "$BROWSER_CMD" in
    *" "*) $BROWSER_CMD --new-window "$1" >/dev/null 2>&1 & ;;
    *) "$BROWSER_CMD" --new-window "$1" >/dev/null 2>&1 & ;;
  esac
}

# --- capture -------------------------------------------------------------
have_capture() {
  for TOOL in import grim gnome-screenshot spectacle xwd; do
    command -v "$TOOL" >/dev/null 2>&1 && return 0
  done
  return 1
}

CAPTURE_TOOL=""
capture() {
  WID_ARG="${1:-}"
  DEST="$2"
  if [ -n "$WID_ARG" ] && command -v import >/dev/null 2>&1; then
    import -window "$WID_ARG" "$DEST" 2>/dev/null && { CAPTURE_TOOL=import; return 0; }
  fi
  if command -v grim >/dev/null 2>&1; then
    grim "$DEST" 2>/dev/null && { CAPTURE_TOOL=grim; return 0; }
  fi
  if command -v gnome-screenshot >/dev/null 2>&1; then
    gnome-screenshot -f "$DEST" 2>/dev/null && { CAPTURE_TOOL=gnome-screenshot; return 0; }
  fi
  if command -v spectacle >/dev/null 2>&1; then
    spectacle -b -n -o "$DEST" 2>/dev/null && { CAPTURE_TOOL=spectacle; return 0; }
  fi
  if [ -n "$WID_ARG" ] && command -v xwd >/dev/null 2>&1; then
    if command -v convert >/dev/null 2>&1; then
      xwd -id "$WID_ARG" -silent 2>/dev/null | convert xwd:- "$DEST" 2>/dev/null \
        && { CAPTURE_TOOL=xwd; return 0; }
    fi
    xwd -id "$WID_ARG" -silent -out "$DEST" 2>/dev/null && { CAPTURE_TOOL=xwd-raw; return 0; }
  fi
  return 1
}

[ -n "$OUT" ] || OUT="${NOTE_EVIDENCE_DIR:-$HOME/notes/evidence}/desktop-$(date +%Y%m%d-%H%M%S).png"
mkdir -p "$(dirname "$OUT")" 2>/dev/null || true
OUT="$(abspath "$OUT")"

EXPECT="$(sed -n 's:.*<title>\(.*\)</title>.*:\1:p' "$HTML" | head -1 | cut -c1-36)"

list_windows() {
  xdotool search --onlyvisible --name '.*' 2>/dev/null | sort -u || true
}

WID=""
MATCH=0
if [ "$X11" = "1" ]; then
  BEFORE="$(list_windows)"
  launch "file://$HTML"
  LAUNCH_PID=$!

  for _ in $(seq 1 25); do
    sleep 1
    AFTER="$(list_windows)"
    if [ -n "$BEFORE" ]; then
      NEW="$(comm -13 <(printf '%s\n' "$BEFORE") <(printf '%s\n' "$AFTER") 2>/dev/null | tail -1)"
    else
      NEW="$(printf '%s\n' "$AFTER" | tail -1)"
    fi
    [ -n "$NEW" ] && WID="$NEW"
    [ -z "$WID" ] && WID="$(printf '%s\n' "$AFTER" | tail -1)"
    [ -n "$WID" ] || continue
    NAME="$(xdotool getwindowname "$WID" 2>/dev/null || true)"
    if [ -n "$EXPECT" ] && [ "${NAME#*$EXPECT}" != "$NAME" ]; then
      MATCH=1
      break
    fi
  done
  [ -z "$EXPECT" ] && [ -n "$WID" ] && MATCH=1

  if [ -z "$WID" ]; then
    echo "BLOCKED: browser window did not appear (launcher pid $LAUNCH_PID)" >&2
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
else
  # No X11 (pure Wayland, or no xdotool): there is no window id to match, so
  # the title check degrades to "the page was opened".
  echo "note: no X11 window control; capturing the screen instead of the window" >&2
  launch "file://$HTML"
  LAUNCH_PID=$!
  sleep 6
fi

# Without X11 there is no window id to match, so nothing was verified against
# the title: that mode is always PARTIAL, never PASS.
window_title() {
  [ -n "$WID" ] || { printf '%s\n' '?'; return 0; }
  TITLE="$(xdotool getwindowname "$WID" 2>/dev/null || true)"
  printf '%s\n' "${TITLE:-?}"
}

report() {
  BYTES="$1"
  TITLE="$(window_title)"
  if [ "$MATCH" = "1" ]; then
    echo "PASS wid=${WID:-none} bytes=$BYTES title=$TITLE"
  else
    echo "PARTIAL wid=${WID:-none} bytes=$BYTES title=$TITLE expected=$EXPECT"
  fi
}

if ! have_capture; then
  # The render check still counts; the screenshot is optional evidence.
  echo "BLOCKED: no screenshot tool (install imagemagick, grim, gnome-screenshot, spectacle or xwd)" >&2
  report 0
  echo "shot=none"
  exit 0
fi

capture "$WID" "$OUT" || { echo "BLOCKED: capture failed ($OUT)" >&2; exit 5; }
report "$(wc -c < "$OUT" | tr -d ' ')"
echo "shot=$OUT"
[ "$CAPTURE_TOOL" = "xwd-raw" ] && echo "note: $OUT is raw XWD; convert it with ImageMagick for sharing"

if [ "$CLOSE" = "1" ] && [ -n "$WID" ]; then
  xdotool windowclose "$WID" >/dev/null 2>&1 || true
fi
exit 0
