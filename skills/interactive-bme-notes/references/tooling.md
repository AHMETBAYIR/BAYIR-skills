# Tooling for single-file BME notes

Sizes below are measured (2026-11) with `gzip -9`, not quoted from a README. The target is one HTML file that opens from `file://` on a mid-range Android phone.

## Recommended stack

| Need | Use | Why |
|---|---|---|
| Math | **KaTeX 0.16/0.19** | Fast, print-quality; ~76 KB gzip JS + fonts. MathJax is 5–10× larger. |
| 2D traces | hand-drawn **canvas 2D** or inline **SVG** | No dependency; full control of axes, units, print. |
| Dense traces (ECG/EEG) | **uPlot 1.6** (≈22 KB gzip, MIT) | Fast for thousands of points; only if hand canvas becomes slow. |
| Diagrams | authored **SVG** | Crisp at any DPI, accessible, prints well. |
| 3D protein/anatomy | **3Dmol.js** (≈180 KB gzip) or pre-rendered SVG | Only if rotation *is* the learning objective; otherwise a 2D schematic is better. |
| Sequence/plasmid (BME rarely) | hand SVG | No genome browser; IGV/JBrowse need HTTP range requests. |
| Icons | Unicode or inline SVG | No icon font. |

**Avoid:** Plotly (≈1.5 MB gzip), Mermaid (≈1.5 MB), Mol* (≈1.3 MB), MathJax (≈500 KB), Chart.js (≈70 KB but less control than canvas), any CDN-only dependency if the note must work offline.

## Single-file budget

| Part | Typical |
|---|---|
| Base template + CSS | 40–60 KB |
| KaTeX JS + CSS + fonts | 150–250 KB |
| Lab engine | 30–50 KB |
| Content + SVG | 30–100 KB |
| **Total** | **300–600 KB** |

Hard ceiling 1.5 MB for a phone; 5 MB is a red flag. Check with `du -b`.

## Offline reality

- `file://` blocks `fetch`, XHR, ES module imports, and service workers.
- There is no gzip transfer, so the raw bytes are the budget.
- Inline every script, style, font, and image; base64 for binary.
- If KaTeX is loaded from a CDN, equations need a network. For a truly offline note, inline `katex.min.js`, `auto-render.min.js`, the CSS, and a WOFF2 subset. Test with the network disabled.
- Citation `<a href="https://…">` links are fine; a remote `<script src>` is not.

## Canvas vs SVG

| Use canvas when | Use SVG when |
|---|---|
| >5k points, animation, pixel-level image (CT) | axes, labels, diagrams, <2k elements |
| you need `ImageData` (windowing) | you need selectable text and DOM accessibility |
| the figure is a raster by nature | the figure must print crisply and scale |

Canvas is a bitmap in print. Always provide a table/readout and a print sentence. For CT, `imageSmoothingEnabled=false` and an offscreen 240×240 buffer are enough.

## Accessibility

- Canvas: `role="img"`, `aria-label` updated on every state change.
- Status: `role="status"`, `aria-live="polite"`.
- Controls: native range/select/button, label wrapping the control.
- Keyboard: Tab order, `:focus-visible` outline, no drag-only interaction.
- Colour: Okabe–Ito palette; pair hue with label/pattern.
- Motion: `prefers-reduced-motion` disables transitions.
- Print: hide controls, keep the current state, open solutions.

## Real desktop verification

`terminal-browser` is the fast loop for phone-width layout. The delivery gate is a real browser window on a real desktop session:

```sh
~/.agents/skills/interactive-bme-notes/scripts/verify_desktop.sh \
  ~/notes/bme/topic.html ~/notes/evidence/topic-desktop.png --scroll 2
```

It uses the `$DISPLAY`/`$WAYLAND_DISPLAY` you already have, finds a browser (`$BROWSER`, then `firefox`/`chromium`/`chromium-browser`/`google-chrome`/`brave-browser`), matches the window title against the note's `<title>`, and captures the window. Nothing is hardwired to one machine; without a capture tool it still reports the render check.

**Capture caveat:** on Xwayland, Wayland screenshot tools (Spectacle, `grim` on some compositors) can return black content for an Xwayland browser window even though the page rendered. `import -window "$WID"` captures the real page. For Wayland-native apps, keep using the compositor's own tool. Details: [desktop-verification.md](desktop-verification.md).

This tier is where you catch: raw TeX instead of KaTeX, doubled equation numbers, desktop two-column overflow, Turkish glyph fallback, and canvas/engine differences.

## Verification tooling

| Tool | Status | Use |
|---|---|---|
| `node --check` | any Node install | syntax gate for the injected JS |
| `python3 validate_note.py` | stdlib only | structure, configs, quiz, print hooks |
| `terminal-browser` / Chromium | where a browser exists (Android: the system Chromium) | screenshot, eval, interaction smoke test |
| Playwright | needs glibc; not installable under Android/Bionic | use the system browser via terminal-browser |
| Puppeteer-core | possible with system Chromium | if you need a scripted run |
| `axe-core` | inject via eval | accessibility scan |
| `html-validate` | npm, works | static HTML checks |

A practical smoke test:

```bash
node --check assets/bme-labs.js
python3 scripts/validate_note.py note.html
terminal-browser open file:///.../note.html
terminal-browser action -- eval "JSON.stringify({labs:document.querySelectorAll('[data-bme-lab]').length,ready:document.querySelectorAll('[data-bme-ready=\"1\"]').length})"
terminal-browser action -- screenshot /tmp/note.png
```

Check `ready === labs` and `bad.length === 0` before shipping.

## Fonts and Turkish

KaTeX fonts do not contain all Turkish glyphs (`ş`, `ğ`, `İ`, `ç` may be missing in some faces). Keep Turkish words in HTML, not inside `\text{}`; use `\text{}` for units and short symbols. Never subset the body font to ASCII.

## When not to build a lab

- The concept is a definition or a classification.
- The interaction would be a slider with no invariant.
- The model would be a fake (a “patient” trace, a “real” CT).
- The page is for print only.
- You cannot test it on a phone.

A static figure with a caption beats a broken canvas.
