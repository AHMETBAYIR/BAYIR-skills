# Civil engineering lab library

Each lab is a **limit state**, not an animation. The table gives the engine,
the state variables, the invariant, and where a working prototype lives.

| Lab | Engine / state | Invariant | Prototype |
|---|---|---|---|
| **RC beam** | `b`, `h`, `d`, `M_d`, `V_d`, bars, stirrups | `C=T`; `M_Rd`; `V_r`; `ρ`; `ε_s/ε_yd`; `s≤s_max` | `assets/civil-labs.js`; `~/notes/civil/ins338-betonarme-kiris.html` |
| **Steel column** | `A`, `i`, `f_y`, `L`, `K`, `α` | `λ`; `χ`; `N_b,Rd` | `check_civil.py column` |
| **Truss** | nodes, members, load position | `ΣF=0`; `ΣM=0`; mechanism detection | `civil-structural-analysis/lab.html` |
| **Retaining wall** | `H`, `B`, `t`, `φ`, `γ`, water table | overturning/sliding/bearing FS | `civil-geotechnical/lab.html` |
| **Bearing capacity** | `B`, `L`, `D_f`, `c`, `φ`, `γ` | `q_ult`, `q_em`, settlement | `check_civil.py retaining` |
| **Slope** | `H`, `β`, `c`, `φ`, `u` | `FS`; pore pressure | spec in `civil-geotechnical/research.md` |
| **Manning** | `b`, `Q`, `S_0`, `n` | `Q=(1/n)A R^{2/3}S^{1/2}`; normal depth | `assets/civil-labs.js`; `check_civil.py manning` |
| **Pipe/pump** | `D`, `L`, `ε`, `ΣK`, `H_st`, pump curve | `H_p=H_st+h_f+h_m`; Colebrook | `civil-hydraulics/lab.html` |
| **Vertical curve** | `V`, `g_1`, `g_2`, `L` | `K=L/|A|`; SSD | `civil-transportation/lab.html` |
| **Concrete mix** | strength, w/c, slump, D_max | absolute volume `ΣV=1 m³`; cost | `civil-construction-materials/lab.html` |
| **CPM** | activities, durations, dependencies | critical path; floats | spec in `civil-construction-materials/research.md` |
| **Earthwork** | stations, cut/fill, shrinkage | mass balance; haul | spec in `civil-construction-materials/research.md` |
| **TBDY drift** | `N`, `h_s`, `m`, `S_DS`, `R`, `I` | `V_t`; `ΣF=V_t`; drift ratio | `check_civil.py drift` |

## What to reuse

- `beam(s)` in `assets/civil-labs.js`: full TS 500 flexure + shear + ledger.
- `manning(s)`: rectangular channel normal depth.
- `check_civil.py`: independent Python reproduction; the numeric source of
  truth.
- The research labs are standalone HTML; copy the pure solver and the ledger
  pattern, not the whole page.

## What not to build

- A “FEA” contour plot from a formula. If you did not assemble and solve a
  model, do not draw a mesh.
- A “BIM” viewer that is a screenshot with sliders.
- A “design” button that returns a section without showing the governing limit.
- A “soil” lab with invented parameters and no source/range.
- A “traffic” lab with a single queue and no arrival distribution.

## Lab size budget

- Target < 120 KB per standalone lab; < 250 KB for a full note.
- No external assets except KaTeX (and it must fail gracefully).
- One canvas or SVG per idea; no autoplay; no analytics.
