# Tooling and offline limits

The default delivery is **one HTML file, zero network requests, no build
framework**. The author-side oracles are Python, ngspice, and the browser.

Full licence/size audit: `~/notes/electronics/research/04-tooling.md`.

## 1. What is installed here

| Tool | Version | Role |
|---|---|---|
| Python | 3.14.8 | build, validate, oracle |
| NumPy | 2.5.4 | arrays, FFT, linear algebra |
| SciPy | 1.18.1 | `erfc`, Bessel, signal |
| SymPy | 1.14.0 | symbolic checks |
| Node | 24.22.1 | `node --check` for inline JS |
| ngspice | 47 | `.op`, `.tran`, `.ac` analog oracle |
| hover | 0.9.0 | small netlist checks (MIT); rebuild with `CGO_ENABLED=0 make linux-aarch64 VERSION=v0.9.0`; `hover --setup` builds the runtime |
| Firefox | 160.0 via glibc wrapper | live page verification |
| MatLivre | local MCP | MATLAB-compatible numeric checks |

`pandapower` did not install on Python 3.14 (source build failure); do not make
a page depend on it. `iverilog` 13 exists in the Termux package set; install it
only when verifying HDL. GNU Radio, KiCad, Verilator and LTspice are not
native Termux dependencies.

## 2. Library matrix (measured)

| Library | Licence | Size | Verdict |
|---|---|---|---|
| Native canvas/SVG | platform | 0 | **default** |
| KaTeX 0.19.1 | MIT | 266.7 KB JS + 24.2 KB CSS + 254 KB fonts | pre-render or CDN only |
| MathJax 4.1.3 | Apache-2.0 | 1.81 MB | reject |
| JSXGraph 1.14.3 | MIT/LGPL | 973 KB | reject |
| Plotly.js 4.3.0 | MIT | 4.73 MB | reject |
| uPlot 1.6.32 | MIT | 49.9 KB | possible, custom plot cheaper |
| Chart.js 4.6.1 | MIT | 205 KB | over budget |
| D3 7.9.2 | ISC | 274 KB (118 KB subset) | reject full |
| fft.js 4.0.4 | MIT | 4.6 KB min | embed if needed |
| dsp.js 1.0.1 | MIT | 26.4 KB | abandoned 2017; avoid |
| math.js 15.2.0 | Apache-2.0 | 634.5 KB | reject |
| numeric.js 1.2.6 | MIT | 69.8 KB | abandoned 2012; avoid |
| ml-matrix 6.15.1 | MIT | 68.8 KB | optional; hand-roll 2×2/3×3 |
| CircuitJS1 | GPL-2.0 | multi-MB | separate page only |
| ngspice | mixed BSD | ~7 MB | external oracle |
| eecircuit-engine | MIT | 19.8 MB | reject for page budget |
| PySpice | GPL-3.0 | native | author-side only |
| LTspice | proprietary | huge | no |
| KiCad | GPL-3.0 | ~GB | no single-file delivery |
| Wokwi/Tinkercad | proprietary SaaS | online | link only |
| Logisim-evolution/Digital | GPL-3.0 | Java | desktop demo only |
| Verilator | LGPL-3.0 | native | author-side oracle |
| Icarus Verilog | GPL-2.0 | native | author-side oracle |

## 3. Licence policy

- Personal use is not distribution. GPL obligations attach when the HTML is
  conveyed to someone else.
- Inlining GPL code into the note makes the note a combined work. Keep GPL
  simulators on a **separate linked page**, not inside the single file.
- LGPL inlining is static linking; a minified one-file note cannot cleanly
  satisfy replacement/relinking. Avoid.
- MIT/BSD/ISC require the copyright notice; Apache-2.0 also requires the
  licence, NOTICE and a statement of changes. Add a colophon when sharing.
- Do not copy a GPL tool's code into `ee-labs.js`. Reimplement the small model.

## 4. Size budget

| Part | Target |
|---|---|
| HTML shell + base CSS (trimmed) | 20–25 KB |
| EE CSS | 8–10 KB |
| EE core JS | 18–22 KB |
| 2–3 engines | 10–15 KB |
| Content/quiz | 20–25 KB |
| SVG figures | 8–12 KB |
| **Total** | **85–110 KB** |

Hard cap in `validate_note.py` is 220 KB; aim below 180 KB. KaTeX inline is
290 KB+ before fonts; do not inline it. With `--offline`, the note has zero
network requests and HTML/Unicode math.

## 5. Browser constraints

- `file://`: no fetch/XHR, no ES modules, no service workers. Use classic
  inline scripts.
- `localStorage` works on `file://` in Firefox 160; namespace keys and
  `try/catch`. Avoid IndexedDB.
- Cap DPR at 2 on phones; a 360 px canvas at DPR 3 is 9× the pixels.
- `ResizeObserver` + `requestAnimationFrame` for redraw; no layout thrash.
- `touch-action:none` only on the canvas; always provide a slider/number
  alternative.
- Test 360×800 and 412×915, portrait and landscape, plus a network-blocked run.

## 6. Verification commands

```bash
SKILL=~/.agents/skills/interactive-ee-notes
python3 "$SKILL/scripts/check_ee.py" selftest
python3 "$SKILL/scripts/validate_note.py" <note.html> --strict
# extract inline scripts, then:
node --check /tmp/ee-inline.js
# analog cross-check:
ngspice -b rc.cir
# live page:
$HOME/Apps/glibc/launch/firefox.sh "file:///<abs>/<note>.html?selftest=1"
$HOME/Apps/glibc/bin/wayland-screenshot.sh /tmp/ee-note.png
```

## 7. What not to embed

- Full SPICE/WASM (19.8 MB), MathJax, Plotly, D3, JSXGraph.
- Electron/Chromium apps; Firefox is the supported browser.
- A live SDR/GNU Radio dependency; use recorded IQ or a closed-form model.
- A full PCB/EDA tool; link to KiCad and keep the note conceptual.
