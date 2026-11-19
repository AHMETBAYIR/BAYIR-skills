# interactive-ee-notes v0.2

Interactive, printable HTML study notes for electrical, electronics and
communications engineering. One self-contained file; 1–3 vanilla-JS labs;
independent Python/ngspice verification; offline build.

## Quick start

```bash
SKILL=~/.agents/skills/interactive-ee-notes
cp "$SKILL/assets/note.content.html" ./note.content.html
cp "$SKILL/assets/note.meta.json" ./note.meta.json
# edit both, then:
python3 "$SKILL/scripts/build_note.py" \
  --content note.content.html --meta note.meta.json \
  --out ~/notes/electronics/courses/<course>/<topic>.html --offline
python3 "$SKILL/scripts/validate_note.py" <note.html> --strict
python3 "$SKILL/scripts/check_ee.py" selftest
# or validate the full 12-note core + 18 engines:
bash "$SKILL/scripts/check_all_notes.sh"
```

Open it in a browser and append `?selftest=1`:

```bash
"${BROWSER:-firefox}" "file:///<abs>/<note>.html?selftest=1"
# Android/Termux: $HOME/Apps/glibc/launch/firefox.sh "file:///<abs>/<note>.html?selftest=1"
```

Details: [references/desktop-verification.md](references/desktop-verification.md).

## What is in the box

| Path | Purpose |
|---|---|
| `SKILL.md` | operating contract, router, workflow, quality rules |
| `references/` | curriculum, domains, lab anatomy, markup, tooling, accuracy, prompts, gates |
| `assets/ee-labs.js` | shared canvas/axes/gate/quiz/selftest core |
| `assets/labs/` | 18 engines: dc, transient, bode, bjt, logic, sampling, am, constellation, link, three-phase, diode, fourier, mosfet, txline, control, transformer, dft, power |
| `scripts/build_note.py` | wraps `html-study-notes`, injects only used engines, `--offline` |
| `scripts/validate_note.py` | static contract/print/a11y/size validator (`--gallery` for a lab index) |
| `scripts/check_ee.py` | independent numeric oracle for all 18 engines, `SELFTEST OK` |
| `scripts/check_all_notes.sh` | validate the 12-note core + 18-engine oracle in one command |

## Verified examples

- `~/notes/electronics/courses/elm225-devre-teorisi-i/rc-filtre.html`
  — 3 labs, 9 sections, 119 KB, 14/14 selftests, no overflow at 360 px.
- `~/notes/electronics/courses/haberlesme-i/ornekleme-am.html`
  — 3 labs, 9 sections, 113 KB, 14/14 selftests.
- `~/notes/electronics/labs/ee-lab-gallery.html`
  — all 9 original engines, 134 KB, 32/32 selftests (gallery mode).

## 12-note core

| Course | Labs | Checks |
|---|---|---|
| AC Devre Analizi | `bode`, `three-phase` | 11/11 |
| Elektronik I: Diyot ve BJT | `diode`, `bjt` | 11/11 |
| Sayısal Devreler | `logic` | 8/8 |
| Sinyaller ve Sistemler I | `fourier`, `sampling` | 11/11 |
| Elektronik II: MOSFET | `mosfet` | 8/8 |
| EM Alanlar ve Dalgalar | `txline`, `link` | 11/11 |
| Kontrol Sistemleri | `control`, `bode` | 11/11 |
| Mikroişlemciler | `logic` | 12/12 |
| Haberleşme I | `am`, `sampling` | 11/11 |
| Elektrik Makinaları | `transformer`, `three-phase` | 11/11 |
| DSP | `sampling`, `dft` | 11/11 |
| Güç Elektroniği | `power` | 8/8 |

All are under `~/notes/electronics/courses/<slug>/index.html`; the hub is
`~/notes/electronics/index.html`.

## Research

The six source dossiers are in `~/notes/electronics/research/`:

1. `01-electrical.md` — power spine, 24 topics, 10 labs.
2. `02-electronics.md` — devices, analog/digital, 12 labs.
3. `03-communications.md` — signals, modulation, RF, 12 labs.
4. `04-tooling.md` — licences, sizes, offline architecture.
5. `05-skill-design.md` — umbrella-skill decision, rubric, prompts.
6. `06-curriculum-audit.md` — Turkish curricula and local artifacts.

## Limits

Teaching models, not SPICE/PCB/VNA replacements. No live-work, HV,
protection-setting or battery-pack procedures. `pandapower`, GNU Radio,
KiCad and Verilator are not Termux (Android) packages; use them only as
external oracles on a desktop machine, with a cited version.
