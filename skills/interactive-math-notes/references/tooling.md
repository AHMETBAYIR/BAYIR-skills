# Tool landscape for interactive mathematics notes (2026)

The important distinction is **authoring surface** vs **rendering/visualization engine** vs **computational runtime** vs **verification engine**. Most projects need one from each column, not ten.

## 1. Selection in one page

| Need | Default | Better alternative | Avoid |
|---|---|---|---|
| One portable, printable note | single HTML + vanilla JS | Quarto / Astro when you need a course site | a framework for one page |
| Math typesetting | KaTeX | MathJax for broad TeX coverage | images of formulas |
| 2D graphing | custom Canvas/SVG | JSXGraph, Mafs, Desmos, GeoGebra | Plotly for a 20-point graph |
| 3D surfaces | custom Canvas projection | three.js, MathBox, Plotly, GeoGebra 3D | 3D when a contour map is clearer |
| Symbolic work | SymPy | Mathematica/Wolfram, Maple | asking an LLM to “do the algebra” |
| Numerical work | NumPy/SciPy | MatLivre, MATLAB, Julia | spreadsheet for a convergence study |
| Real Python in browser | Pyodide | JupyterLite, marimo WASM | faking an interpreter |
| Reproducible notebook | Jupyter | marimo, Quarto | screenshots of outputs |
| Verification | SymPy + MatLivre + SciPy | Lean for proofs | a single unchecked run |
| Polished video | Manim | Motion Canvas | using video as the only explanation |

## 2. Math rendering

### KaTeX

- Fast, synchronous, accessible, small enough for a single file.
- Good coverage of everyday undergraduate mathematics: fractions, roots, matrices, aligned environments, `\operatorname`, `\mathbb`, `\mathrm`.
- The base template uses KaTeX 0.16.22 from jsDelivr.
- Some advanced TeX packages (`tikz`, `mhchem`, exotic macros) are not supported.
- For offline use, vendor `katex.min.css`, `katex.min.js`, the fonts, and `auto-render.min.js`; do not rely on the CDN.

### MathJax

- Broader TeX coverage and better support for accessibility and some legacy constructs.
- The MathJax 4 line is the current generation; v3 is still widely deployed.
- Heavier than KaTeX; the page should be designed for asynchronous typesetting or a build-time render.
- Better choice for research-level notation, exotic macros, or math in many output formats.

### MathLive / MathQuill

- MathLive is a modern math input field with virtual keyboard and accessibility support.
- Use it when the learner must *enter* an expression, not just read one.
- MathQuill is older and less actively developed; prefer MathLive for new work.

### Temml

- A TeX-to-MathML converter; fast and accessible, with a smaller ecosystem than KaTeX/MathJax.
- Good when MathML is the target (publishing pipelines, EPUB).

**Rule:** render at build time if the page is static; render in the browser only when the formula depends on state. Do not mix raw LaTeX and rendered output on the same page.

## 3. 2D graphing and geometry

| Tool | Model / license | Strengths | Limits |
|---|---|---|---|
| **Desmos API** | hosted JS, API key, Desmos terms | excellent graphing, sliders, accessibility, mobile | key/terms; not a general geometry kernel; vendor dependency |
| **GeoGebra Apps API** | hosted JS, GeoGebra license | geometry, algebra, 3D, CAS, spreadsheet; classroom familiar | license terms for commercial use; large embed |
| **JSXGraph** | MIT, JS | dynamic geometry, constructions, function graphs, 3D | older docs; you own the UI |
| **Mafs** | MIT, React | clean declarative 2D math, good defaults | React dependency; 2D only |
| **Function Plot** | MIT, JS | quick function plots | limited interaction/geometry |
| **D3.js** | ISC, JS | precise charts, scales, force layouts | steep API; overkill for a tangent line |
| **Observable Plot** | ISC, JS | concise statistical charts | not a geometry/CAS tool |
| **p5.js** | LGPL, JS | sketches, generative visuals | encourages decoration; accessibility is your job |
| **Canvas/SVG by hand** | none | full control, offline, small | you own layout, hit-testing, accessibility |

**Rule of thumb:**

- 1–3 functions with a point and a tangent → custom Canvas/SVG or Mafs.
- A dynamic geometry construction with dependencies → JSXGraph or GeoGebra.
- A classroom-familiar calculator with sliders → Desmos or GeoGebra.
- A statistical chart → Observable Plot or a small Canvas chart.
- A custom look with no vendor → custom Canvas/SVG.

## 4. 3D surfaces and fields

| Tool | Model / license | Strengths | Limits |
|---|---|---|---|
| **three.js** | MIT, JS | full WebGL scene graph, materials, controls | heavier; you build the math UI |
| **MathBox** | MIT, JS | math-native 3D, declarative | smaller community; WebGL |
| **Plotly.js** | MIT, JS | quick 3D scatter/surface, export | bundle size; styling; not a geometry kernel |
| **GeoGebra 3D** | hosted | classroom 3D, CAS integration | license/embed |
| **Desmos 3D** | hosted | polished 3D graphing | key/terms |
| **Custom Canvas projection** | none | tiny, offline, complete control | painter's-algorithm artifacts; no true depth buffer |
| **Manim** | MIT, Python | beautiful rendered video | not interactive; render time |

**Rule:** use 3D when the third dimension carries the idea (surface, tangent plane, vector field in space). If a contour map or a table answers the question, prefer 2D. A 3D view that cannot be rotated is usually worse than a contour map.

## 5. Symbolic and numerical computation

### Browser-side

| Tool | What it does | Use for | Cost |
|---|---|---|---|
| **math.js** | expression parser, matrices, units, numeric | small calculators, unit-aware inputs | not a full CAS |
| **Nerdamer** | symbolic algebra in JS | factoring, solving, calculus | coverage/performance limits |
| **Algebrite** | symbolic algebra in JS | simple CAS demos | maintenance/coverage |
| **numeric.js** | numerical linear algebra | small matrix/ODE demos | old API; limited maintenance |
| **ml-matrix** | matrix operations | linear algebra labs | no CAS |
| **simple-statistics** | statistics | data labs | not mathematics-wide |
| **Pyodide** | CPython + NumPy/SciPy/SymPy in WASM | real Python, real packages | ~10–20 MB initial load; use a Worker |
| **JupyterLite** | Jupyter in the browser (WASM) | notebook-style teaching | size; package availability |
| **marimo WASM** | reactive Python notebook exported to WASM | reproducible interactive notebooks | Python-centric; size |

### Desktop / local

| Tool | What it does | Use for |
|---|---|---|
| **SymPy** | exact symbolic math in Python | derivatives, integrals, ODEs, matrix algebra, LaTeX |
| **NumPy/SciPy** | numerical arrays, integration, optimization, linear algebra | convergence studies, reference solutions |
| **Matplotlib** | publication figures | static figures for print or reports |
| **MatLivre** | clean-room MATLAB-compatible runtime | MATLAB-semantics checks, figures, MCP |
| **MATLAB/Octave** | numerical computing | course-specific toolboxes, legacy code |
| **Mathematica/Wolfram** | symbolic/numeric engine | research-level algebra, Wolfram MCP |
| **Lean 4 / Mathlib** | proof assistant | formal verification of proofs |

**Rule:** use a real CAS for exact work. An LLM can propose a simplification; it cannot be the proof.

## 6. Authoring and publishing

| Tool | Model | Strengths | Limits |
|---|---|---|---|
| **Single HTML** | hand-written/generated | portable, offline, printable, no build | you own JS/CSS/testing |
| **Quarto** | Markdown + engines → HTML/PDF/books | citations, cross-refs, Observable JS, multi-format | build chain; interactivity depends on engine |
| **Observable Framework** | Markdown + reactive JS → static site | data loaders, D3/Plot, fast output | JS-first; less natural for long prose |
| **marimo** | reactive Python notebook | reproducible, Git-friendly, widgets, HTML/WASM export | Python-centric; layout |
| **Jupyter** | notebook | ecosystem, kernels, widgets | hidden state; export friction |
| **Jupyter Book / MyST** | Markdown/notebooks → book | course-scale, citations, cross-refs | build chain |
| **Astro / Starlight / MkDocs** | static site | course-scale navigation/search | interactivity via components |
| **Slidev / Reveal** | slides | lecture pacing, presenter mode | weak as a self-study reference |
| **Typst** | markup → PDF | fast, clean PDF, math | not interactive; separate web artifact |
| **Manim** | Python → video | polished mathematical animation | not interactive; render time |

**Default for this kit:** single HTML. It is the smallest artifact that satisfies document, lab, print, and offline requirements. For a 10–50-note course, a static site generator with shared components is the next step.

## 7. Notebooks: where they fit

Jupyter is excellent for:

- exploring a method before designing the lab;
- generating figures and tables;
- checking a numerical claim against SciPy;
- sharing reproducible work with an instructor or researcher.

Jupyter is poor for:

- a self-paced lesson with controlled disclosure;
- print-first layout;
- a student who will not install Python;
- hiding the code while showing the result.

**Recommended split:**

```
notebook  → compute, plot, verify, export
HTML note → explain, predict, manipulate, print
```

Jupyter Book or Quarto can publish both together when a course needs a book-like site. Do not make the notebook the only artifact for a student who needs a phone-friendly page.

## 8. AI skills, MCP, and agents

### Agent Skills

An Agent Skill is a folder with `SKILL.md`, references, scripts, and assets. The agent sees the name and description, loads the skill when the task matches, and reads references only when needed. This is **progressive disclosure**: rich workflow, small default context.

Support in 2026 includes Claude Code, OpenAI Codex, OpenCode, Cursor, Gemini CLI, and others. The directory differs (`.claude/skills`, `.agents/skills`, `.opencode/skills`), but the format is portable.

### MCP

The Model Context Protocol connects an agent to tools and data. For mathematics, useful servers include:

- **MatLivre MCP** — `run_code`, `get_workspace`; MATLAB semantics and figures.
- **Wolfram MCP** — Wolfram Language/Alpha computation; local or cloud.
- **SymPy skill/tool** — exact symbolic work through Python.
- **File/browser tools** — read PDFs, open the built page, screenshot, test.
- **LMS/database tools** — only when the course needs them.

### What works

- Agent writes a real file → validator runs → browser opens → agent steps through → fixes → prints.
- Source-grounded generation: read the PDF/chapter, produce a coverage map, then write.
- Independent verification: SymPy/MatLivre/SciPy check the numbers in the note.
- One lab first: build and test a representative lab before generating the rest.

### What fails

| Failure | Why | Constraint |
|---|---|---|
| Hallucinated formula | plausible notation | derive or check |
| Fake execution | easier than a sandbox | run real code or link out |
| Over-animation | “engaging” is easy to optimize | 3-lab rule |
| Inaccessible canvas | visual output is easy | status + table + aria |
| Invented citation | language models complete patterns | source map; link check |
| Design drift | each generation invents a theme | fixed design system |
| Notebook hidden state | out-of-order execution | “Run All” + clean kernel |
| 3D decoration | novelty budget | ask what the third dimension explains |

## 9. Offline and low-resource

- Vendor KaTeX + fonts if the page must work without network.
- Do not load three.js, Plotly, or GeoGebra if a 20-line Canvas lab suffices.
- Keep total page weight under ~1–2 MB for a phone; under ~500 KB if possible.
- Test on a mid-range Android device, not only a desktop.
- Use `prefers-reduced-motion`, keyboard controls, and a print fallback.
- Avoid autoplay and network calls in the default artifact.

## 10. Licensing checklist

Before embedding a tool or figure:

- Check the license of the library and the terms of the hosted API.
- Desmos API requires a key and has terms; GeoGebra has separate commercial terms.
- Wikimedia/OpenStax figures need attribution; public domain still needs a source note.
- Matplotlib/MatLivre/KaTeX/JSXGraph/Mafs/three.js are permissive, but keep the notice if required.
- Do not embed a copyrighted textbook figure without permission.
- Record the source and license in the note or a companion file.

## 11. Version notes (November 2026)

- The kit’s base template uses KaTeX 0.16.22.
- MatLivre installed on this device is 0.1.5, built from commit `82fc24e`; `matlivre-cli` cannot render figures, `matlivre --mcp` can.
- The Python stack in the glibc environment includes NumPy, SciPy, Matplotlib, SymPy, and Pandas; Jupyter is not installed by default, so notebook files are valid JSON companions that can be run in Jupyter/Colab/VS Code.
- Browser support targets current Chromium/Firefox/Safari; the labs use Canvas 2D, pointer events, and `color-mix()` in CSS.

## 12. Sources

- Desmos API v1.11: <https://www.desmos.com/api/v1.11/docs/index.html>
- GeoGebra apps: <https://www.geogebra.org/apps>
- JSXGraph: <https://jsxgraph.org/>
- Mafs: <https://mafs.dev/>
- MathBox: <https://github.com/unconed/mathbox>
- three.js: <https://threejs.org/>
- KaTeX: <https://katex.org/>
- MathJax: <https://www.mathjax.org/>
- MathLive: <https://mathlive.io/>
- Pyodide: <https://pyodide.org/en/stable/usage/index.html>
- Quarto interactivity: <https://quarto.org/docs/interactive/>
- marimo: <https://marimo.io/>
- Observable Framework: <https://observablehq.com/framework/>
- Jupyter: <https://jupyter.org/>; nbconvert: <https://nbconvert.readthedocs.io/>
- Jupyter Book: <https://jupyterbook.org/>
- Manim: <https://www.manim.community/>
- Typst: <https://typst.app/>
- SymPy: <https://www.sympy.org/>
- Lean: <https://lean-lang.org/>
- MatLivre: <https://github.com/campuslivre/matlivre>
- Wolfram MCP: <https://www.wolfram.com/ai/mcp>
- Agent Skills: <https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview>
- MCP: <https://modelcontextprotocol.io/>
- WCAG 2.2: <https://www.w3.org/TR/WCAG22/>
