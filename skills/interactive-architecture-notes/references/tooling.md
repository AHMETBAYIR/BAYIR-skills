# Tooling — architecture

## Rendering choices

| Need | Use | Avoid |
|---|---|---|
| Plan/section/elevation with labels | **SVG** (crisp, accessible, printable) | canvas for line drawings with text |
| Dense diagrams, sun path, many points | **Canvas** at devicePixelRatio | SVG with thousands of nodes |
| 3D massing/shadow when depth is the lesson | three.js (last resort) | three.js for a 2D plan |
| Math | KaTeX (CDN with fallback) | MathJax for a single formula |
| Parametric geometry | small vanilla JS functions | a full CAD kernel |

SVG is the default for architecture drawings because it prints sharply and its
text is selectable. Canvas is better for dense, animated, or pixel-level
diagrams. Do not put body text in canvas.

## Libraries

| Tool | Licence | Size / note | Use |
|---|---|---|---|
| three.js | MIT | ~643 KB raw / ~392 KB min (r187) | 3D massing, shadows, walkthrough |
| d3 | ISC | modular; ~90 KB for the core + scales | data-driven SVG, timelines |
| p5.js | LGPL-2.1 | ~1.16 MB min | sketching, teaching demos; heavy |
| Observable Plot | ISC | ~100 KB | quick charts; not a drawing tool |
| KaTeX | MIT | ~273 KB JS + ~254 KB fonts | math |
| MathJax | Apache-2.0 | larger | math with complex accessibility needs |
| GeoGebra | proprietary/free app | embed only | interactive geometry; not offline |
| Desmos | proprietary API | embed only | graphing; not offline |
| IFC.js / web-ifc | MIT / MPL-2.0 | WASM, multi-MB | BIM viewing; not a design check |
| Pyodide | MPL-2.0 | ~13 MB | Python in the browser; too heavy for a note |
| matplotlib-wasm | BSD | multi-MB | static plots; use pre-rendered SVG instead |

## BIM / CAD / GIS

- **IFC** (ISO 16739): model exchange; use IfcOpenShell/IFC.js for extraction,
  not for design verification.
- **DXF**: 2D drawing exchange; use `ezdxf` (Python) to read/write, not to
  render a note.
- **GeoJSON / CityGML**: site and urban data; simplify to a schematic SVG.
- **Rhino/Grasshopper**: parametric design; export a static figure and the
  parameter table, not a screenshot alone.
- **Revit/ArchiCAD**: BIM authoring; a screenshot is not evidence of a
  performance calculation.

## Offline / single-file rules

- Inline all CSS/JS; only KaTeX may come from a CDN, and the page must remain
  readable if it fails.
- No analytics, no accounts, no runtime data fetch.
- Compress images; prefer SVG.
- Budget: < 250 KB for a full note; < 120 KB for a standalone lab.
- Test with JavaScript disabled: the prose, constraint table, and static
  fallback must remain.

## Accessibility

- Canvas: `role="img"`, changing `aria-label`, visible focus, keyboard controls.
- SVG: `<title>` and `<desc>`, or `aria-label`.
- Colour is never the only carrier: use line weight, hatch, and labels.
- `prefers-reduced-motion`: no autoplay; stepping still works.
- Print: controls hidden; current state and scale bar visible.
