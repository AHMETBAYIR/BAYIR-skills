# Tooling

> A tool is useful in a note only if the reader can run it, afford it, and reproduce the number.
> Prefer the smallest tool that closes the calculation.

## 1. The three-tool rule

A physics note contains at most three tools:

1. **Raw canvas 2D / inline SVG** — drawing and interaction, 0 KB.
2. **KaTeX (optional, CDN)** — formulas only. Fonts are not embedded (254 KB); if the CDN fails the page
   must still be readable.
3. **Python + NumPy/SymPy** — verification only. Never shipped to the reader.

Everything else is an **exploration** tool: for the author to understand the topic, not for the page.

## 2. Capability matrix

Sizes are minified/CDN payloads as observed in November 2026; treat them as orders of magnitude.

| Tool | 2D | 3D | Symbolic | ODE/PDE | Interaction | Offline single file | Licence | Size | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| canvas / SVG | ✅ | ◐ | ✗ | ✗ | ✅ | ✅ | platform | 0 | **default** |
| KaTeX | ✗ | ✗ | ✗ | ✗ | ✗ | ◐ (CDN) | MIT | ~280 KB | **default for formulas** |
| MathJax | ✗ | ✗ | ✗ | ✗ | ✗ | ◐ | Apache-2.0 | ~1 MB | only heavy math pages |
| math.js | ✗ | ✗ | ◐ | ✗ | ✗ | ✅ | Apache-2.0 | ~650 KB | too heavy for a note |
| Plotly.js | ✅ | ✅ | ✗ | ✗ | ✅ | ✅ | MIT | 4.84 MB | exploration / dashboard, **not a note** |
| Chart.js | ✅ | ✗ | ✗ | ✗ | ◐ | ✅ | MIT | ~210 KB | luxury inside 120 KB |
| D3 | ✅ | ◐ | ✗ | ✗ | ✅ | ✅ | ISC | ~280 KB | selective import only |
| three.js | ✗ | ✅ | ✗ | ✗ | ✅ | ✅ | MIT | ~814 KB | only when 3D *is* the concept |
| Babylon.js | ✗ | ✅ | ✗ | ✗ | ✅ | ✅ | Apache-2.0 | 8.9 MB | no |
| matter.js | ✅ | ✗ | ✗ | ✗ | ✅ | ✅ | MIT | ~83 KB | game engine, not physics teaching |
| p5.js | ✅ | ◐ | ✗ | ✗ | ✅ | ✅ | LGPL-2.1 | ~991 KB | no (licence + size) |
| Konva | ✅ | ✗ | ✗ | ✗ | ✅ | ✅ | MIT | ~198 KB | drag scenes only |
| JSXGraph | ✅ | ◐ | ◐ | ✗ | ✅ | ✅ | MIT / LGPL-3.0+ | ~996 KB | geometry; dual licence |
| Desmos API | ✅ | ✗ | ◐ | ✗ | ✅ | ✗ (key + network) | commercial | external | cannot embed |
| GeoGebra | ✅ | ✅ | ◐ | ✗ | ✅ | ✗ (hosting) | non-commercial | external | link only |
| PhET | ✅ | ✅ | ✗ | ◐ | ✅ | ◐ (download) | CC BY 4.0 / code MIT | external | cite; check redistribution |
| GlowScript / VPython | ✅ | ✅ | ✗ | ◐ | ✅ | ✗ (hosting) | MIT | external | cannot embed |
| oPhysics | ✅ | ◐ | ✗ | ✗ | ✅ | ✗ | unclear | external | link only |
| Falstad / CircuitJS1 | ✅ | ✗ | ✗ | ◐ | ✅ | ◐ | unclear / GPL-2.0 | external | do not redistribute |
| Algodoo | ✅ | ✅ | ✗ | ✗ | ✅ | ✗ (desktop) | freeware, closed | external | no |
| MATLAB / MatLivre | ✅ | ✅ | ✅ | ✅ | ◐ | ✗ | commercial | external | verification, not delivery |
| Octave 11.3 | ✅ | ◐ | ✅ | ✅ | ✗ | ✗ | GPL-3.0 | Arch prefix | optional third path; needs `OCTAVE_HOME` |
| NumPy | ✅ | ✗ | ✗ | ◐ | ✗ | ✗ | BSD-3 | wheel | **primary** (numbers) |
| SymPy | ✗ | ✗ | ✅ | ◐ | ✗ | ✗ | BSD-3 | wheel | **primary** (derivation) |
| SciPy | ✅ | ✗ | ✗ | ✅ | ✗ | ✗ | BSD-3 | ~40 MB | installed 1.18; use for checks, not the teaching path |
| matplotlib | ✅ | ◐ | ✗ | ✗ | ✗ | ✗ | PSF | ~11 MB | figure generation only |
| plotly (py) | ✅ | ✅ | ✗ | ✗ | ✅ | ◐ (HTML export) | MIT | ~9.7 MB | interactive figure, not a note |
| Manim | ✅ | ◐ | ◐ | ✗ | ✗ | ✗ (video) | MIT | + LaTeX/ffmpeg | promo video |
| Jupyter / Colab | ✅ | ◐ | ✅ | ✅ | ✅ | ✗ | BSD-3 / commercial | external | student exercise |
| Observable | ✅ | ◐ | ◐ | ◐ | ✅ | ✗ (runtime) | commercial | external | no |
| Geant4 / ROOT | ✗ | ✅ | ✗ | ✅ | ✗ | ✗ | Geant4 / LGPL-2.1 | GB | no |
| OpenFOAM / SU2 | ✗ | ✅ | ✗ | ✅ | ✗ | ✗ | GPL-3.0 / LGPL-2.1 | GB | no |
| Astropy | ✗ | ✗ | ◐ | ◐ | ✗ | ✗ | BSD-3 | ~10 MB | data processing |

## 3. Ban list and why

| Do not embed | Reason |
|---|---|
| Plotly.js | 4.84 MB; turns a note into an app |
| three.js unless 3D is the concept | 814 KB; often decorative |
| p5.js | LGPL + 991 KB |
| GeoGebra / Desmos | hosting, key, or non-commercial terms |
| PhET | redistribution terms vary; link instead |
| GlowScript / Observable | runtime hosting; not offline |
| Falstad original | no clear licence |
| Algodoo | closed source |
| Any analytics / tracker | privacy + offline failure |

## 4. Platform reality (Android / Termux + Bionic desktop)

Two layers, verified 12 Nov 2026.

**Termux layer (always available).** Python 3 with NumPy, SymPy, **SciPy 1.18.1**, pandas, matplotlib,
pint; Node 24; canvas; `terminal-browser`. This is the compute and syntax-check path.

**Bionic desktop layer.** Rootless Plasma/Wayland (`gapp_doctor` PASS), Arch prefix
`~/Apps/glibc/arch` (1,911 packages, 30 GB). Verified:

| Capability | Status | Caveat |
|---|---|---|
| Octave 11.3 CLI | PASS | needs `OCTAVE_HOME=$HOME/Apps/glibc/arch/usr`; otherwise `ode45.m` not found |
| gnuplot 6.0.6 | PASS | PNG + vector PDF |
| Firefox (fresh profile) | PASS | use `--screenshot` with a throwaway profile; Chromium is disallowed |
| Wayland screenshot | PASS | `$HOME/Apps/glibc/bin/wayland-screenshot.sh` |
| `pdflatex` | **BLOCKED** | binary exists, no `pdflatex.fmt`, no `article.cls`; needs `texlive-latex` |
| LabPlot / KiCad / KStars / OpenSCAD | UNTESTED | installed; do not claim they work |

Commands:

```sh
# Octave (wrapper in the physics notes repo)
~/notes/physics/tools/octave-cli.sh --eval "eig([2 -1;-1 2])"

# gnuplot figure
arch-native run gnuplot plot.gp

# render a note in Firefox and capture it
~/notes/physics/tools/firefox-shot.sh note.html shot.png 1200 900
```

**Rules.** Do not run Chromium/Electron in ordinary testing. Do not use a bare binary instead of
`arch-native run` / `arch-gui-run`. Do not mix `LD_LIBRARY_PATH` into glibc children. Do not treat a
window as proof; verify page content or an output artefact. LaTeX is not a PDF path until the format
and class exist — use Firefox print instead.

Consequence: generate numbers in Python (Octave optional as a third check), draw in the browser,
export figures with gnuplot when vector output matters, verify pages in Firefox.

## 5. Size budget

| Part | Budget |
|---|---|
| HTML + CSS | 10–15 KB |
| Physics model (JS) | 8–20 KB |
| Drawing | 5–10 KB |
| Text + quiz | 10–20 KB |
| **Total** | **< 120 KB** |

Measured: 11 labs, mean 41 KB, max 56 KB, 0 external requests.

## 6. Licence notes

- MIT/BSD/Apache: safe to embed with attribution.
- LGPL (p5.js, JSXGraph option): dynamic linking is fine in principle, but a single inlined file is not
  dynamic linking. Avoid.
- GPL (Falstad port, OpenFOAM): a distributed note becomes GPL. Avoid unless intended.
- CC BY 4.0 (PhET): attribution required; check whether modification/redistribution is allowed for your
  use.
- "Free for non-commercial" (GeoGebra): not open source; do not embed in a paid course.
- Commercial API (Desmos): needs a key and network; fails offline.

When in doubt: draw it yourself with canvas. A 200-line model is cheaper than a licence review.

## 7. Minimum viable stack

1. **Author:** this skill + `html-study-notes` + a text editor.
2. **Verify:** Python 3 + NumPy/SymPy; `check.py`; one hand check.
3. **Draw:** inline SVG + canvas.
4. **Open:** any browser; `terminal-browser` for side-by-side; print to PDF.
5. **Optional:** MatLivre for a matrix or a control plot.
