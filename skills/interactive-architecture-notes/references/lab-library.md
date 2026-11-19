# Architecture lab library

Each lab is a **decision**, not an animation. The table gives the engine, the
state variables, the invariant, and where a working prototype lives.

| Lab | Engine / state | Invariant | Prototype |
|---|---|---|---|
| **Stair / ramp** | `H`, `N`, `G`, `L_m`, `W`, `L_open`, `t`, building, accessible | `R=H/N`; `2R+G`; headroom ≥ 2.20 m; landing ≥ 1.50 m | `assets/arch-labs.js`; `~/notes/architecture/mim201-merdiven-rampa.html` |
| **Plan–section cut** | cut height `z`, cut line `x`, element extents | element is cut iff `z` is inside its vertical extent | spec in `arch-design-representation/research.md` |
| **Adjacency / privacy** | room position, corridor, weight, area | net area conserved; score symmetric; egress length | spec in `arch-design-representation/research.md` |
| **Sun path / daylight** | latitude, day, hour, azimuth, WWR, overhang | solar altitude from a real algorithm; DF estimate; summer/winter gain | `arch-building-physics/lab.html` |
| **Wall assembly / U-value** | layer order, thickness, lambda, insulation | `U=1/ΣR`; target U; tolerance stack | `arch-building-technology/lab.html`; `assets/arch-labs.js` |
| **Acoustics / RT60** | volume, surfaces, absorption, use | Sabine `RT60`; band stated | `check_arch.py rt60`; spec in `arch-building-physics/research.md` |
| **Solar envelope / massing** | plot, setbacks, height, orientation, FAR | envelope from solar access; FAR/coverage | `arch-urban-site/lab.html` |
| **Tectonic anatomy** | structural system, span, rise | `M ∝ L²` for beams; `H ∝ L` for arches at constant f/L | `arch-history-theory/lab.html` |

## What to reuse

- `stairModel` / `rampModel` in `assets/arch-labs.js`: pure functions, no DOM.
- `drawStairPlan` / `drawStairSection`: stacked at narrow widths, side-by-side
  at wide widths; DPR-aware.
- `uvalue(ins, target)`: four-layer wall, EPS thickness, target U.
- `check_arch.py`: independent Python reproduction; use it as the numeric
  source of truth.
- The research labs are standalone HTML; copy the pure functions and the
  drawing pattern, not the whole page.

## What not to build

- A “3D massing” lab with three.js when a 2D solar envelope answers the same
  question. three.js costs ~392 KB min and adds a rendering failure mode.
- A “history timeline” with no argument. Use a static comparative figure.
- A “BIM viewer” that is a screenshot with sliders.
- A “daylight” lab that draws a sun but does not compute solar altitude.

## Lab size budget

- Target < 120 KB per standalone lab; < 250 KB for a full note.
- No external assets except KaTeX (and it must fail gracefully).
- One canvas or SVG per idea; no autoplay; no analytics.
