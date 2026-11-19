#!/usr/bin/env bash
# Install ytc into an isolated virtualenv and link the launcher.
#
#   ./install.sh
#   YTC_VENV=~/.venvs/ytcomments YTC_BIN_DIR=/usr/local/bin ./install.sh
#
# Defaults: venv at ${XDG_DATA_HOME:-~/.local/share}/ytc/venv,
# launcher in ~/.local/bin (Linux/macOS) or $PREFIX/bin (Termux).
set -eu
ROOT="$(cd "$(dirname "$0")" && pwd)"

VENV="${YTC_VENV:-${XDG_DATA_HOME:-$HOME/.local/share}/ytc/venv}"
BIN_DIR="${YTC_BIN_DIR:-}"
if [ -z "$BIN_DIR" ]; then
  if [ -n "${TERMUX_VERSION:-}" ] || [ -d /data/data/com.termux/files/usr ]; then
    BIN_DIR="${PREFIX:-/data/data/com.termux/files/usr}/bin"
  else
    BIN_DIR="$HOME/.local/bin"
  fi
fi

echo "yt-comments installer"
echo "  root:  $ROOT"
echo "  venv:  $VENV"
echo "  bin:   $BIN_DIR"

mkdir -p "$(dirname "$VENV")"
if [ ! -x "$VENV/bin/python" ]; then
  python3 -m venv "$VENV"
fi
"$VENV/bin/python" -m pip -q install --disable-pip-version-check --upgrade pip >/dev/null 2>&1 || true
"$VENV/bin/python" -m pip -q install --disable-pip-version-check -r "$ROOT/requirements.txt"

chmod +x "$ROOT/bin/ytc"
mkdir -p "$BIN_DIR"
ln -sfn "$ROOT/bin/ytc" "$BIN_DIR/ytc"
python3 -m compileall -q "$ROOT/yt_comments" 2>/dev/null || true

echo
YTC_PYTHON="$VENV/bin/python" "$BIN_DIR/ytc" doctor || true

case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *) echo; echo "note: $BIN_DIR is not on PATH" >&2 ;;
esac
