# interactive-med-notes

A reusable kit for university medical school study notes: one self-contained HTML file, 1–3 interactive labs, a print fallback, a retrieval quiz, and an independent number checker.

## Quick start

```bash
SKILL=~/.agents/skills/interactive-med-notes

# 1. Check the engines
python3 "$SKILL/scripts/check_med.py" selftest
node --check "$SKILL/assets/med-labs.js"

# 2. Build the starter gallery (all ten labs)
python3 "$SKILL/scripts/build_note.py" \
  --content "$SKILL/assets/note.content.html" \
  --meta "$SKILL/assets/note.meta.json" \
  --out ~/notes/tip/galeri.html

# 3. Open it in a browser (Android/Termux: $HOME/Apps/glibc/launch/firefox.sh)
"${BROWSER:-firefox}" "file://$HOME/notes/tip/galeri.html"

# 4. Smoke-test a note (starts Firefox with Marionette if needed)
python3 "$SKILL/scripts/verify_page.py" ~/notes/tip/galeri.html \
  --start --exercise --shot ~/notes/tip/evidence/galeri.png

# 5. Validate the structure
python3 "$SKILL/scripts/validate_note.py" ~/notes/tip/galeri.html

# 6. Export a quiz to Anki
python3 "$SKILL/scripts/export_anki.py" ~/notes/tip/kardiyovaskuler.html \
  --from-html --out ~/notes/tip/evidence/kardiyo.tsv --deck "Tıp::Kardiyovasküler"
```

## What is inside

| Path | Purpose |
|---|---|
| `SKILL.md` | Full workflow, pedagogy, accuracy rules, limits |
| `assets/med-labs.js` | Ten engines + quiz + theme/resize hooks |
| `assets/med-labs.css` | Lab shell, readout, quiz, safety band, print |
| `assets/note.content.html` | Starter gallery with all ten labs |
| `scripts/build_note.py` | Wraps `html-study-notes`, injects the medical layer |
| `scripts/check_med.py` | Independent calculations + self-test |
| `scripts/validate_note.py` | Structural/accessibility/print checks |
| `scripts/export_anki.py` | Quiz JSON/HTML → Anki TSV |
| `scripts/verify_page.py` | Firefox Marionette smoke test, screenshot, PDF |
| `scripts/md_to_html.py` | Research Markdown → HTML dossier |
| `scripts/make_starter.py` | Regenerates the ten-lab gallery |
| `references/research/` | 14 full research dossiers |

## The ten engines

`ecg`, `pvloop`, `oxygen`, `acidbase`, `pk`, `pd`, `epi`, `visualfield`, `ct`, `brachial`.

Every lab follows **predict → manipulate → check → explain** and has a print fallback.

## Safety

Teaching models only. Not for diagnosis, dosing, or treatment. No patient data. Check every license and every guideline version before publishing.

## Base skill

Requires `html-study-notes` at `~/.agents/skills/html-study-notes` (or pass `--base-skill`). The base supplies the A4 design system, TOC, KaTeX, and print CSS.
