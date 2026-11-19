# Tooling — civil engineering

## Rendering choices

| Need | Use | Avoid |
|---|---|---|
| Beam section, stress block, truss, retaining wall | **SVG or Canvas** | three.js for a 2D section |
| Dense plots (Moody, V/M, pump curve) | **Canvas** at DPR | SVG with thousands of points |
| Ledger / number families | **HTML table** | canvas text |
| Math | KaTeX (CDN with fallback) | MathJax for one formula |
| 3D FEM contour | pre-rendered image with provenance | a fake contour drawn from a formula |

## Python (installed here)

| Package | Use | Licence |
|---|---|---|
| numpy | linear algebra, arrays | BSD |
| scipy | root finding, integration, sparse | BSD |
| sympy | symbolic checks | BSD |
| matplotlib | static figures | PSF/BSD |
| pandas | tables/data | BSD |

## Python (not installed; install only if needed)

| Package | Use | Licence | Note |
|---|---|---|---|
| PyNite | 3D frame FE | MIT | pure Python; good for teaching |
| anaStruct | 2D frames/trusses | MIT | lightweight |
| OpenSeesPy | nonlinear FE | UC Regents custom | check licence; heavy |
| sectionproperties | section properties | MIT | good for steel/concrete |
| ifcopenshell | IFC read/write | LGPL | BIM extraction |
| ezdxf | DXF read/write | MIT | 2D exchange |
| shapely | geometry | BSD | site/plan geometry |
| pvlib | solar | BSD | daylight/solar |
| CoolProp | fluid properties | MIT | thermo/fluids |
| pyslope | slope stability | MIT | limit equilibrium |
| pint | units | BSD | unit checks |

## Browser-side solvers

- A small 2D truss/frame solver is feasible in vanilla JS (see
  `civil-structural-analysis/lab.html`).
- A full FEM/CFD/geotech solver is not. Precompute the result and embed the
  verified numbers + a static figure; do not pretend the browser solved it.
- For a design check, the equations are small enough to implement and verify
  with a Python checker.

## Data formats

| Format | Use | Tool |
|---|---|---|
| IFC | BIM exchange | IfcOpenShell / IFC.js |
| DXF | 2D drawings | ezdxf |
| GeoJSON | site/GIS | shapely/geopandas |
| CityGML | urban models | 3D city tools |
| CSV/JSON | test data, golden values | stdlib |
| EPW/TMY | weather | pvlib/EnergyPlus |

## Offline / single-file rules

- Inline all CSS/JS; only KaTeX may come from a CDN, and the page must remain
  readable if it fails.
- No analytics, no accounts, no runtime data fetch.
- Budget: < 250 KB for a full note; < 120 KB for a standalone lab.
- Test with JavaScript disabled: the prose, ledger, and static fallback remain.

## Accessibility

- Canvas: `role="img"`, changing `aria-label`, visible focus, keyboard controls.
- SVG: `<title>` and `<desc>`, or `aria-label`.
- Colour is never the only carrier: use line style, labels, and hatch.
- `prefers-reduced-motion`: no autoplay; stepping still works.
- Print: controls hidden; ledger and governing row visible.
