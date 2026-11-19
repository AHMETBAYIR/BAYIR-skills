#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
YTT="${YTT:-$ROOT/bin/ytt}"

echo "== doctor"
"$YTT" doctor --json | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d["ok"], d; print("doctor ok")'

echo "== metadata"
"$YTT" info jNQXAC9IVRw --json | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d["chosen_track"], d; print(d["title"], d["chosen_track"]["kind"], d["chosen_track"]["lang"])'

echo "== manual captions"
"$YTT" get jNQXAC9IVRw --json | python3 -c 'import json,sys; d=json.load(sys.stdin); t=d["transcript"]; assert t["source"]=="manual", t["source"]; assert "elephants" in t["text"]; print(t["source"], t["language"], t["word_count"], "words")'

echo "== auto captions + cleaning"
"$YTT" get JciVReJs8hc --no-asr --json | python3 -c 'import json,sys; d=json.load(sys.stdin); t=d["transcript"]; assert t["source"]=="auto", t["source"]; assert "Snapdragon" in t["text"]; print(t["source"], t["language"], t["word_count"], "words")'

echo "== corpus integration (optional)"
if command -v rk >/dev/null 2>&1; then
  rk fetch jNQXAC9IVRw >/dev/null
  rk grep 'elephants' -n 1 | head -4
else
  echo "skip: rk not on PATH"
fi

echo "PASS"
