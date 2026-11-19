# Tooling landscape (November 2026)

> A tool is only useful in a note if the reader can run it, afford it, and reproduce the number. Prefer the smallest tool that closes the calculation. Verify licences before shipping a file that embeds data or code.

## 1. What belongs inside the HTML file

| Need | Library | Licence | Size / offline | Verdict |
|---|---|---|---|---|
| Math typesetting | KaTeX 0.16 | MIT | ~280 KB CSS+JS from CDN | default; the note must still read without it |
| Symbolic/numeric math in JS | math.js | Apache-2.0 | ~700 KB | only for a real calculator; otherwise hand-code the formula |
| 2D plots | canvas API | platform | 0 KB | default for labs |
| 2D plots, publication style | Plotly.js | MIT | ~3.5 MB | too heavy for one note; use for a dashboard |
| 3D | three.js | MIT | ~600 KB | only when 3D is the concept (mechanism, stress block) |
| Charts | Chart.js | MIT | ~200 KB | easy but limited for engineering axes |
| Diagrams | inline SVG | — | 0 KB | default for figures, sections, dimension lines |
| Syntax/flow | Mermaid | MIT | ~500 KB | avoid; draw the block diagram as SVG |

**Rule:** a single HTML note should stay under ~400 KB. KaTeX and the base template's Google Fonts link are the only network dependencies; both degrade to system fonts and plain math, so the note still works offline. Everything else is inline.

## 2. Computation and verification

| Tool | Use | Licence | Offline | Notes |
|---|---|---|---|---|
| NumPy | arrays, linear algebra, checks | BSD-3 | yes | installed here |
| SymPy | symbolic derivation, units | BSD-3 | yes | installed here |
| SciPy | ODE, optimisation, stats | BSD-3 | yes | not installed here; use RK4 by hand |
| Matplotlib | static figures for print | PSF-based | yes | not installed here |
| pandas | data tables | BSD-3 | yes | installed here |
| CoolProp | steam, refrigerants, humid air | MIT | yes | not installed here; cite backend/version if used |
| thermo | properties, cycles | MIT | yes | pure Python, good for teaching |
| fluids | pipe, fittings, pumps | MIT | yes | convenient but check correlations |
| pint | unit-safe arithmetic | BSD-3 | yes | excellent for a unit-balance check |
| Cantera | combustion, kinetics | BSD-3 | yes | overkill for a first thermo note |
| pyromat | thermodynamic properties | GPL-3 (check) | yes | licence may constrain distribution |
| XSteam | steam tables in MATLAB/Python | free (check) | yes | small, but old formulations |
| MatLivre | MATLAB-compatible local environment | local | yes | good for generating a figure or checking a matrix |

**Verification rule:** the note's number must be reproducible by a second path — a closed form, a table, or a different library. `check_me.py` is the second path for the labs in this kit.

## 3. CAD, FEA, CFD, multibody

| Tool | Use | Licence | Runs on a phone? | Note |
|---|---|---|---|---|
| FreeCAD (+ FEM workbench, TechDraw) | parametric CAD, CalculiX front end | LGPL-2.1 | no | best open desktop chain |
| SolidCraft 0.40 + SolidCore | parametric CAD, headless MCP, STEP/STL export | MIT/Apache-2.0 (brand separate) | browser WASM / native aarch64 | early B-rep kernel; good for figures, not production |
| CalculiX | static/modal/thermal FEA | GPL-2 | no | solver behind FreeCAD FEM |
| Code_Aster / Salome-Meca | advanced FEA | GPL/LGPL | no | steep learning curve |
| FEniCS / FEniCSx | PDE research, Python | LGPL-3 | no | excellent for a course on FEM |
| scikit-fem | small FEM teaching | BSD-3 | yes (pure Python) | good for 1D/2D labs |
| sfepy | multiphysics FEM | BSD-3 (check) | no | mature |
| pycalculix | CalculiX scripting | GPL-3 (check) | no | quick parametric studies |
| OpenFOAM | CFD | GPL-3 | no | not a teaching UI |
| SU2 | CFD/FEA | LGPL-2.1 | no | good adjoint support |
| XFOIL | airfoil analysis | GPL-2 | yes (CLI) | small, fast, old but useful |
| OpenModelica | acausal modelling, controls | OSMC/GPL | no | good for mechatronics |
| Octave / Scilab | MATLAB alternative | GPL | no | syntax similar to MATLAB |
| MATLAB/Simulink | control, dynamics | commercial | no | campus licence usually available |
| EES | thermo/heat transfer | commercial | no | excellent property tables, Windows |
| KISSsoft / MITCalc | gears, bearings, fits | commercial | no | industry standard; cite version |
| ANSYS / Abaqus / SolidWorks / Fusion | industry CAE/CAD | commercial | no | do not claim results without a licence |

**SolidCraft MCP.** `solidcraft-cli mcp --headless --allow-path <dir>` exposes a design session over MCP: `skill_reference`, `batch`, `measure`, `export`, `screenshot`. It is useful for producing a verified STEP/PNG figure for a note; it is not a note runtime. Pin 0.40.x, check volume against a hand calculation, and keep the `.sc` file. See `~/notes/mechanical/cad/README.md`.

**Rule:** never embed a contour plot from a commercial solver and imply the reader can reproduce it. Show the model, the boundary conditions, the mesh, and the convergence table, or label the figure “schematic”.

## 4. Standards and data

| Source | What it gives | Access | Warning |
|---|---|---|---|
| ISO 286-1/2 | fits and tolerances | paid | use a small cited subset, not the whole table |
| ISO 2768 | general tolerances | paid | edition matters |
| ISO 1101 / ASME Y14.5 | GD&T | paid | ASME and ISO differ in symbols |
| ISO 6336 / ISO 281 | gear and bearing life | paid | simplified formulas in notes must say so |
| TS EN 1993 (Eurocode 3) | steel design | paid + national annex | national annex changes the numbers |
| ASME B31.3 / EN 13480 | piping | paid | not a substitute for a piping engineer |
| NIST Chemistry WebBook | fluid/property data | public | cite the retrieval date |
| IAPWS-IF97 | steam formulation | public | the basis of most steam tables |
| CoolProp | property database | MIT | cite the backend and version |
| MatWeb | material properties | free/pro | values are typical, not certified |
| Engineering Toolbox | quick values | free | secondary source; verify before use |
| Cambridge Engineering Selector / Granta EduPack | Ashby selection | commercial | campus licence; do not redistribute charts |

## 5. Teaching and visual reference

| Tool | Use | Licence / access |
|---|---|---|
| PhET | physics simulations | free for non-commercial teaching |
| GeoGebra | geometry, mechanisms, calculus | free for non-commercial |
| MDSolids | mechanics of materials drills | commercial/limited free |
| SkyCiv / Structural Basics | beam and truss calculators | freemium |
| Linkage (D. M. Rector) | four-bar synthesis | free |
| MIT OpenCourseWare 2.001–2.72 | lecture notes and problem sets | CC BY-NC-SA |
| Engineering Toolbox | quick reference | free |
| Wolfram Demonstrations | concept demos | free viewing, licence varies |
| YouTube channels (The Efficient Engineer, Engineering Explained) | intuition | cite, do not copy |

## 6. The AI-skill landscape

As of November 2026:

- **Agent Skills** is an open format (`SKILL.md` + optional scripts/references, `agentskills.io`). Anthropic's `anthropics/skills` repository is the reference implementation; the format is supported by Claude Code, Codex, Cursor, Gemini CLI, OpenCode and others.
- **Scientific Agent Skills** (K-Dense, MIT) is the largest science-oriented collection: 177 skills, including thermodynamics/fluid packages, scientific visualisation, and CAD for lab hardware. It is a *package* layer, not a note-authoring layer.
- **Education skill libraries** (e.g. `claude-education-skills`) cover curriculum, assessment, and memory science, but not the engineering representation.
- **No dedicated mechanical-engineering note skill was found.** The closest neighbours are this kit, `interactive-mse-notes`, `interactive-math-notes`, and `interactive-cs-notes`. The gap is exactly the ME-specific layer: sign conventions, standards, unit systems, and verified physical models.

Implication: reuse the design system and the Agent Skills packaging, but do not expect an off-the-shelf skill to know that `H7/p6` is a table pair or that a Rankine cycle needs a pump work term. That knowledge belongs in the skill's references and checker.

## 7. Minimum viable stack for a student

1. **Author:** this skill + `html-study-notes` + a text editor.
2. **Verify:** Python 3 with NumPy/SymPy; `check_me.py`; a calculator for the hand check.
3. **Draw:** inline SVG and canvas; no framework.
4. **Open:** any browser; `terminal-browser` for a side-by-side check; print to PDF for submission.
5. **Optional:** FreeCAD for a real part; CoolProp for steam; MatLivre/MATLAB for a matrix or a control plot.

Everything above runs offline once the note is built. That is the point.
