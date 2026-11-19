#!/usr/bin/env bash
# Validate the 12-note EE core and run the 18-engine numeric oracle.
set -u
SKILL="${SKILL:-$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/.." && pwd)}"
ROOT="${EE_NOTES_ROOT:-$HOME/notes/electronics}"
TMP="${TMPDIR:-$HOME/.tmp}"
mkdir -p "$TMP" 2>/dev/null || true
SLUGS=(
  ac-devre-analizi
  elektronik-i-diyot-bjt
  sayisal-devreler
  sinyaller-ve-sistemler-i
  elektronik-ii-mosfet
  em-alanlar-ve-dalgalar
  kontrol-sistemleri
  mikroislemciler
  haberlesme-i
  elektrik-makinalari
  dsp
  guc-elektronigi
)
fail=0
for slug in "${SLUGS[@]}"; do
  note="$ROOT/courses/$slug/index.html"
  if [ ! -f "$note" ]; then
    echo "MISSING $note"
    fail=1
    continue
  fi
  if python3 "$SKILL/scripts/validate_note.py" "$note" --strict >/dev/null; then
    printf 'PASS  %-30s %s\n' "$slug" "$(du -h "$note" | cut -f1)"
  else
    echo "FAIL  $slug"
    fail=1
  fi
done

if python3 "$SKILL/scripts/check_ee.py" selftest >"$TMP/ee-check-$$.txt" 2>&1; then
  echo "PASS  numeric oracle: $(grep -c 'SELFTEST OK' "$TMP/ee-check-$$.txt")/18 engines"
else
  echo "FAIL  numeric oracle"
  tail -20 "$TMP/ee-check-$$.txt"
  fail=1
fi
rm -f "$TMP/ee-check-$$.txt"
exit "$fail"
