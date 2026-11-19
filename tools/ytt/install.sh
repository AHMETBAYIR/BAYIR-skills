#!/usr/bin/env bash
# Install the ytt launcher: ~/.local/bin on Linux/macOS, $PREFIX/bin on Termux.
#
#   ./install.sh
#   YTT_BIN_DIR=/usr/local/bin ./install.sh
#
# The optional Qualcomm QNN runner is only built when you point
# YTT_ORT_INCLUDE and YTT_ORT_LIB at an ONNX Runtime build with the QNN EP.
set -eu
ROOT="$(cd "$(dirname "$0")" && pwd)"

BIN_DIR="${YTT_BIN_DIR:-}"
if [ -z "$BIN_DIR" ]; then
  if [ -n "${TERMUX_VERSION:-}" ] || [ -d /data/data/com.termux/files/usr ]; then
    BIN_DIR="${PREFIX:-/data/data/com.termux/files/usr}/bin"
  else
    BIN_DIR="$HOME/.local/bin"
  fi
fi

echo "yt-transcript installer"
echo "  root: $ROOT"
echo "  bin:  $BIN_DIR"

mkdir -p "$BIN_DIR"
chmod +x "$ROOT/bin/ytt"
ln -sfn "$ROOT/bin/ytt" "$BIN_DIR/ytt"

if command -v python3 >/dev/null 2>&1; then
  python3 -m compileall -q "$ROOT/yt_transcript" 2>/dev/null || true
else
  echo "  ! python3 not found; install it before running ytt" >&2
fi

# Optional: build the QNN runner for Snapdragon HTP (Android only).
ORT_INC="${YTT_ORT_INCLUDE:-}"
ORT_LIB="${YTT_ORT_LIB:-}"
if [ -n "$ORT_INC" ] && [ -n "$ORT_LIB" ] &&
   [ -f "$ORT_INC/onnxruntime_cxx_api.h" ] && [ -f "$ORT_LIB/libonnxruntime.so" ]; then
  echo "  building whisper_qnn_runner…"
  "${CXX:-c++}" -O2 -std=c++17 "$ROOT/src/whisper_qnn_runner.cc" \
    -I"$ORT_INC" -L"$ORT_LIB" -lonnxruntime \
    -o "$ROOT/bin/whisper_qnn_runner"
else
  echo "  QNN runner skipped (set YTT_ORT_INCLUDE/YTT_ORT_LIB to build it; Android only)"
fi

echo
"$BIN_DIR/ytt" doctor || true

case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *) echo; echo "note: $BIN_DIR is not on PATH" >&2 ;;
esac
