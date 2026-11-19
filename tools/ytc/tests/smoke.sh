#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
YTC="${YTC:-$ROOT/bin/ytc}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "== doctor"
"$YTC" doctor --json | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d["ok"], d; print("doctor ok")'

echo "== full fetch (cached or live)"
"$YTC" fetch JciVReJs8hc --all --quiet > $TMP/ytc-smoke.json
python3 - "$TMP/ytc-smoke.json" <<'PY'
import json, sys
s=json.load(open(__import__('sys').argv[1]))
c=s['comments']
assert c['total'] > 0, c
assert c['total'] == c['top_level'] + c['replies'], c
assert c['missing_reason'] in ('none','unavailable','limit','scope'), c
print('comments', c['total'], 'top', c['top_level'], 'replies', c['replies'],
      'complete', c['complete'])
PY

echo "== exact jsonl limit"
"$YTC" fetch JciVReJs8hc --limit 10 --format jsonl > $TMP/ytc-smoke.jsonl 2>/dev/null
[ "$(wc -l < $TMP/ytc-smoke.jsonl)" = "10" ]
echo "10 lines"

echo "== grep"
"$YTC" grep JciVReJs8hc --text snapdragon --min-likes 10 --limit 3 --format jsonl > $TMP/ytc-grep.jsonl
[ "$(wc -l < $TMP/ytc-grep.jsonl)" -ge 1 ]
echo "grep ok"

echo "== top"
"$YTC" top JciVReJs8hc -n 3 > $TMP/ytc-top.txt
grep -q 'likes' $TMP/ytc-top.txt
echo "top ok"

echo "PASS"
