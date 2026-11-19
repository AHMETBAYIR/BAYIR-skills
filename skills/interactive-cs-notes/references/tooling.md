# Tooling landscape and selection guide

The goal is not to use the most tools. It is to choose the smallest stack that supports the interaction you designed.

## 1. Authoring formats

| Format | Best for | Strengths | Limits |
|---|---|---|---|
| **Single HTML file** | one note, offline sharing, print | portable, no build, full control, works on phone | you own the JS/CSS; no LMS gradebook |
| **Markdown → HTML** (Pandoc, Quarto, Astro Starlight, MkDocs) | a course site | fast authoring, version control, themes | interactivity needs components/iframes |
| **Jupyter / marimo** | computational CS, data, notebooks | real execution, widgets, reproducibility | heavy; notebook state; export can be static |
| **Observable Framework** | data-heavy interactive pages | reactive JS, D3/Plot, static build | JS-first; less natural for long prose |
| **Quarto** | books, papers, slides, HTML/PDF | multi-format, citations, Observable JS, widgets | build chain; interactivity varies by engine |
| **Slide deck** (Reveal, Slidev) | lecture delivery | pacing, presenter mode | poor as a self-study reference |
| **Video** (Manim, Motion Canvas) | polished derivations | temporal explanation | not self-paced; hard to update; no retrieval |

**Default for this skill:** single HTML file. Add a build system only when the course grows beyond a handful of notes.

## 2. Visualization libraries

| Tool | Model | Good for | Watch out |
|---|---|---|---|
| **Vanilla SVG** | DOM/SVG | trees, graphs, pointers, small state | you write layout and accessibility |
| **Canvas 2D** | immediate mode | many bars/particles, charts | no DOM accessibility; redraw on resize |
| **D3.js** | data joins + SVG | precise charts, force graphs, transitions | steep API; overkill for 12 bars |
| **p5.js** | sketch loop | generative visuals, quick prototypes | can encourage decoration over pedagogy |
| **Observable Plot** | high-level grammar | statistical charts | not an algorithm animation engine |
| **JSAV** | algorithm-visualization library | arrays, graphs, trees, pseudocode, exercises | older docs; jQuery-era API; still used by OpenDSA |
| **VisuAlgo** | hosted visualizer | reference/demo, not embeddable as your note | external site; limited customization |
| **Algorithm Visualizer** | hosted + code-driven | code-centric demos | external; not a note authoring tool |
| **Manim** | Python scene renderer | polished mathematical video | render loop; not interactive |
| **Motion Canvas** | TypeScript + generator | web-native animated explanations | video-like; needs a player |
| **Mermaid** | text → diagram | flowcharts, sequence, class, state | limited custom interaction |
| **Excalidraw / tldraw** | hand-drawn diagrams | concept maps, sketches | static or embed; not a lab |
| **Graphviz / DOT** | automatic graph layout | dependency graphs, trees | styling limits; static output |

**Rule of thumb:**

- 8–30 bars, cells, or nodes → vanilla SVG/DOM. You get accessibility and easy hit-testing.
- 100+ elements or continuous animation → Canvas.
- Statistical charts → Observable Plot or a small Canvas chart.
- Trees/graphs with layout → compute positions yourself or use D3/Graphviz; do not hand-place 30 nodes.
- Polished video → Manim/Motion Canvas, but keep the interactive note separate.

## 3. Code execution and tracing

| Tool | What it really does | Use it for | Cost |
|---|---|---|---|
| **Python Tutor** | server-side execution + step visualization | Python/Java/C/C++/JS memory model | external dependency; privacy; link out |
| **Pyodide** | CPython in WebAssembly | real Python in the browser | ~20 MB initial load; package limits; run in a Worker |
| **Skulpt** | Python-in-JS subset | lightweight intro exercises | not full Python; subtle differences |
| **CodeMirror 6** | editor component | editable code, syntax highlight | bundle size; you own execution |
| **Monaco** | VS Code editor | full IDE feel | heavy for a note |
| **WASM-compiled language** | real runtime in browser | C/C++/Rust demos | build complexity; memory limits |
| **Server sandbox** | isolated container | autograding, untrusted code | security, cost, latency |

**Do not fake an interpreter.** If the learner types code, either run it for real (Pyodide/WASM/server) or make the exercise a Parsons puzzle / trace question. A fake “Run” button that prints a canned answer destroys trust.

## 4. Math, code, and diagrams

- **KaTeX** — fast, accessible math; good for complexity formulas and recurrences. MathJax is heavier but has more TeX coverage.
- **Shiki / Prism / highlight.js** — static syntax highlighting. Shiki gives VS Code-quality themes; Prism is lighter.
- **Mermaid** — quick diagrams from text; good for flowcharts and sequence diagrams.
- **Graphviz** — automatic layout for trees/graphs; export SVG.
- **SchemDraw** — circuits (not CS, but the base skill uses it).

## 5. AI authoring surfaces

| Surface | Strength | Limitation |
|---|---|---|
| **Coding agent + skills** (OpenCode, Claude Code, Codex, Cursor) | can write, run, test, and iterate on a real file; can use scripts and a validator | needs a workspace and tool permissions |
| **Claude Artifacts / ChatGPT Canvas / Gemini Canvas** | fast in-chat interactive prototype; easy sharing | sandbox; export/proprietary API limits; no durable learner data |
| **Notebook + AI** (marimo, Jupyter) | real computation, reproducible | less control over layout; runtime state |
| **Slide/video AI** | fast first draft | hard to verify; passive output |
| **MCP-connected tools** | access to files, browser, LMS, databases | setup and security surface |

**The winning workflow in 2026:** an agent writes a real HTML file in the workspace, runs a validator, opens it in a browser, clicks through it, and fixes it. Chat-only artifacts are great for prototypes but weak for a tested, printable, offline note.

## 6. Distribution

| Channel | Use when | Notes |
|---|---|---|
| Local file / USB | personal study, offline | single HTML; fonts/KaTeX CDN optional |
| GitHub Pages / Netlify | share with a class | static, free, versioned |
| LMS (Canvas, Moodle, Blackboard) | graded course | embed via iframe or upload; check CSP |
| PWA | repeated use on phone | add manifest + service worker; cache fonts |
| PDF | print, archive | use the print stylesheet; test page breaks |
| EPUB | e-readers | convert with Pandoc; interactivity lost |

## 7. A minimal stack that works

For most DSA notes:

- **HTML + CSS + vanilla JS**
- **SVG** for graphs/trees, **DOM** for bars/cells
- **KaTeX** for math
- **localStorage** for quiz state
- **one Python build script** to inline assets and generate the TOC
- **terminal-browser** (or Playwright) to test
- **no framework, no bundler, no server**

Add a framework only when the note collection needs routing, search, or shared components across dozens of pages.

## 8. When to stop building

Stop adding interactivity when:

- the next lab would duplicate an existing teaching move,
- the state cannot be made legible on a phone,
- the animation would take longer to build than the concept is worth,
- a static diagram plus a question would teach the same thing,
- you cannot test the lab’s correctness.

A finished note with two solid labs beats a half-finished note with six.
