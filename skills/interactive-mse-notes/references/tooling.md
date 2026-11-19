# Tooling landscape for interactive MSE notes (2026)

The question is not “what is the best materials science tool?”. It is “what is the smallest tool that makes this argument testable in a browser?”.

## 1. The layers

| Layer | Options | What it decides |
|---|---|---|
| Document shell | `html-study-notes` template, Quarto, Jupyter Book, Typst HTML export | typography, TOC, print |
| Math | KaTeX, MathJax | formulas, accessibility |
| Diagram | Canvas 2D, SVG, D3, Plotly, Observable Plot | control, print, file size |
| 3D | 3Dmol.js, NGL, JSmol, three.js, `<model-viewer>` | crystal/molecular rendering |
| Computation | in-page JS, Pyodide, server/API | what can be recomputed live |
| Data | embedded JSON, Materials Project/OPTIMADE, CIF, CSV | provenance and reproducibility |
| Verification | Python/SymPy/pymatgen, `check_mse.py`, MatLivre | numbers before prose |
| Delivery | single HTML, GitHub Pages, LMS, PDF | audience and grading |

## 2. 3D crystal and molecular viewers

| Tool | Licence (verify) | Strengths | Limits | Use it when |
|---|---|---|---|---|
| **3Dmol.js** | BSD-3-Clause | small, fast, CIF/PDB/SDF, unit cell, labels, surfaces, WebGL | not a crystallography tool; no symmetry/plane slicing | you need an embedded rotating structure with labels |
| **NGL** | MIT | excellent for large biomolecular assemblies, CIF/mmCIF, smooth | biology-oriented UI; materials features are secondary | the structure is large or protein-like |
| **JSmol** | LGPL-2.1 | very broad format support, scripting, crystallography | Java-to-JS heritage, slower, heavier | you need Jmol scripting or an old teaching workflow |
| **ChemDoodle Web Components** | commercial / GPL for open source | polished chemistry components, editing | licence cost for proprietary use | a commercial product needs a supported component |
| **three.js** | MIT | full control, instancing, shaders, AR | you build the chemistry/crystallography yourself | a bespoke visualisation (dislocation, laminate, architecture) |
| **`<model-viewer>`** | Apache-2.0 | glTF, AR, simple | no crystallographic semantics | a product/part, not a crystal |

**Recommendation for this kit:** the `crystal` lab uses a hand-written perspective projection because the teaching question is “what is shared by neighbouring cells?”. It is ~200 lines, works offline, and exposes the numbers. Do **not** add 3Dmol.js just to rotate a 14-atom cell; add it when you need CIF parsing, surfaces, or real crystallographic data.

## 3. Structure and diffraction computation

| Tool | Licence (verify) | Use |
|---|---|---|
| **pymatgen** | MIT | `Structure`, `Lattice`, CIF/VASP, `SpacegroupAnalyzer`, `XRDCalculator`, `PhaseDiagram`, `PDPlotter`, OPTIMADE client |
| **ASE** | LGPL-2.1+ | structure I/O, calculators, MD, symmetry, surfaces |
| **spglib** | BSD-3-Clause | symmetry detection, standardisation |
| **pycalphad** | MIT | CALPHAD equilibrium from TDB databases, binary/ternary diagrams |
| **Thermo-Calc / TC-Python** | commercial | industrial CALPHAD, large databases |
| **FactSage** | commercial | slag/glass/thermochemistry, phase equilibria |
| **OVITO** | free basic edition, check commercial terms | crystal visualisation, coordination, dislocations, grain analysis |
| **VESTA** | free for non-commercial | crystal structure, planes, diffraction, publication figures |
| **ImageJ / Fiji** | public domain / GPL | grain size, particle analysis, scale bars, image measurement |

**Workflow that keeps the note honest:**

1. Compute the structure/pattern/diagram in pymatgen, ASE, pycalphad, or MatLivre.
2. Export a **small** JSON or a static SVG with the numbers you will cite.
3. Embed the result, not the whole library.
4. State the database, the functional, the temperature, and the version.
5. Keep the scripts in the note folder so the figure can be regenerated.

## 4. Property data and selection

| Source | Access | Notes |
|---|---|---|
| **Materials Project** | API key (`mp_api`) | computed structures/energies; phase diagrams; cite the database and date |
| **OPTIMADE** | open API standard | federated query across providers; good for structure search |
| **AFLOW** | web/API | computed properties, prototypes, convex hulls |
| **OQMD** | web/API | DFT formation energies |
| **NOMAD** | web/API | raw and processed computational data |
| **COD** | open | experimental crystal structures |
| **Granta EduPack** | commercial (Ansys) | Ashby charts, teaching databases, Level 1–3 |
| **matminer** | BSD-3-Clause (verify) | featurisation, dataset access, ML pipelines |
| **ASM Handbooks / textbook tables** | subscription/book | experimental properties; cite edition |

**Do not scrape a commercial database into a public note.** Check the terms. For teaching, a small cited table is usually enough; for a design exercise, use EduPack or an open dataset with a licence note.

## 5. Plotting and diagrams

| Tool | Licence | Best for | Notes |
|---|---|---|---|
| **Canvas 2D** | platform | custom labs, drag, animation | full control; you own axes, ticks, hit-testing |
| **SVG** | platform | static figures, print | crisp, accessible, easy to inline |
| **D3** | ISC | data-driven SVG, scales, axes | steep learning curve; great for a complex chart |
| **Plotly.js** | MIT | interactive scientific charts | heavy (~3 MB); overkill for one curve |
| **Observable Plot** | ISC | quick exploratory charts | nice defaults; not a lab engine |
| **TikZ / PGFPlots** | GPL/LPPL | publication figures | compile to SVG/PDF, then inline |
| **Typst / CeTZ** | Apache-2.0 | fast typeset figures | good for handouts, less for interaction |
| **Mermaid** | MIT | flowcharts, diagrams | not for phase diagrams or crystal cells |

**Recommendation:** Canvas for labs, inline SVG for static figures, no charting library by default. A 150 kB self-contained note beats a 3 MB dependency.

## 6. Document and notebook shells

| Tool | Best for | Why not |
|---|---|---|
| **`html-study-notes`** | one polished, printable note | not a course site |
| **Quarto** | reproducible reports with code | heavier, needs a toolchain |
| **Jupyter Book** | computational course notes | notebook output is not a teaching sequence |
| **Typst** | fast PDF/HTML handouts | less interactive |
| **Obsidian/Notion export** | personal notes | weak print/typography control |
| **LMS (Moodle/Canvas)** | grading, cohorts | needs SCORM/xAPI/LTI; not a single file |

**Recommendation:** author in the single-file kit; use Jupyter/Quarto only for the computational companion. Keep the student-facing note and the analysis notebook separate.

## 7. AI-assisted authoring: the pipeline that works

A language model is good at drafting prose, proposing a sequence, writing canvas code, and generating quiz distractors. It is bad at remembering a lattice parameter, a phase boundary, or a licence. Split the work:

1. **Retrieve** the source (PDF, CIF, dataset, lecture). Extract text with `pdftotext -layout`; render figures with `pdftoppm`.
2. **Compute** the numbers with a deterministic tool (`check_mse.py`, SymPy, pymatgen, MatLivre).
3. **Plan** the note: type, outcomes, 1–3 labs, one worked example, one misconception per section.
4. **Draft** the fragment with the kit's components.
5. **Generate** lab config and, if needed, a topic-specific JS module.
6. **Validate** structure and numbers; open the page and step through every control.
7. **Critique** with a second prompt: “what claim is unsupported? what number is unchecked? what lab is decorative?”.
8. **Publish** the single file and the verification scripts.

The model must not be the source of truth for a material property. It can be the source of the explanation.

## 8. Decision matrix

| Need | Choose | Avoid |
|---|---|---|
| One printable teaching note | this kit | a dashboard |
| Real crystal from CIF | 3Dmol.js / NGL + pymatgen | hand-typed coordinates |
| Real phase equilibrium | pycalphad/Thermo-Calc → static figure | a hand-drawn “CALPHAD” curve |
| Real XRD pattern | pymatgen `XRDCalculator` → embed peaks | schematic heights presented as data |
| Grain size / image analysis | ImageJ + a measured table | eyeballing a micrograph |
| Materials selection | EduPack or an open dataset + derived index | a scatter plot without constraints |
| Reproducible report | Quarto/Jupyter + exported figures | a notebook as the student handout |
| LMS quiz | server-side or SCORM/xAPI | `localStorage` as a gradebook |

## 9. What this kit deliberately does not use

- **No framework.** A lab is ~200 lines of vanilla JS; React/Svelte would add a build step and a dependency for no teaching gain.
- **No charting library.** The axes, ticks, and hit-testing are part of the teaching.
- **No 3D library.** The cell is 14 atoms and a box; a perspective projection is enough.
- **No network.** The default file works offline. Fonts and KaTeX are enhancements.
- **No CALPHAD solver in the browser.** The phase lab is a parameterised model, labelled as such.

## 10. Licence hygiene

Before shipping a note, record:

- the source of every figure and dataset;
- the licence of every library you inline;
- whether a commercial database's terms allow student distribution;
- whether a micrograph has permission and a scale bar;
- the date of the property data.

A note that cannot be shared is not a note. When in doubt, redraw the figure from cited numbers and link to the source.
