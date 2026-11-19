# Tooling for single-file MBG notes

Sizes below are measured (2026-11) with `gzip -9`, not quoted from a README. The target is one HTML file that opens from `file://` on a mid-range Android phone.

## Recommended stack

| Need | Use | Why |
|---|---|---|
| Math | **KaTeX 0.16/0.19** | Fast, print-quality; ~76 KB gzip JS + fonts |
| Sequence display | hand-drawn **canvas/SVG** or **DOM spans** | Crisp text, selectable, accessible |
| Dense plots (HWE, coverage) | **uPlot 1.6** (≈22 KB gzip) or hand canvas | Fast; only if needed |
| Plasmid map | hand **SVG** | Circular arcs and labels are easy; no dependency |
| Gel | **canvas** | Log(bp) lanes and bands; cheap |
| 3D protein | **3Dmol.js** (≈180 KB gzip) or pre-rendered SVG | Only if rotation is the learning objective |
| Genome browser | none for `file://` | IGV/JBrowse need HTTP range requests; use a static track figure |
| Network/pathway | **Cytoscape.js** only for a real graph lab | Otherwise hand SVG |
| Icons | Unicode or inline SVG | No icon font |

**Avoid:** Plotly (≈1.5 MB gzip), Mermaid (≈1.5 MB), Mol* (≈1.3 MB), MathJax (≈500 KB), SeqViz (≈200 KB gzip) unless one or two constructs are the whole point.

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
- There is no gzip transfer, so raw bytes are the budget.
- Inline every script, style, font, and image; base64 for binary.
- If KaTeX is loaded from a CDN, equations need a network. For a truly offline note, inline `katex.min.js`, `auto-render.min.js`, the CSS, and a WOFF2 subset. Test with the network disabled.
- Genome browsers and API-driven annotation do not work from `file://`; ship a static figure or a small embedded JSON.
- Citation `<a href="https://…">` links are fine; a remote `<script src>` is not.

## Sequence rendering

| Approach | Use when | Notes |
|---|---|---|
| DOM `<span>` per base | ≤200 nt, selection/copy matters | Best accessibility; style with CSS |
| Canvas text | 200–2,000 nt, zoom/pan | Wrap at 20–60 nt per row; ≥10 px font |
| SVG text | diagrams with annotations | Crisp print; avoid 10k nodes |
| Canvas blocks (no letters) | whole locus overview | Pair with a zoom panel |

Do not shrink a 3 kb sequence into one line. Wrap, zoom, or summarise.

## Gel and plasmid

- Gel: `y = a − b·log10(bp)`; label the axis “log(bp)”; band intensity ∝ mass (bp), not molecule number.
- Plasmid: circular coordinates; the wrap-around fragment is `G − last + first`; draw ticks, not overlapping labels at nearby sites.
- pUC19: 2686 bp; EcoRI 397, BamHI 418, HindIII 448.

## Accessibility

- Canvas: `role="img"`, `aria-label` updated on every state change.
- Status: `role="status"`, `aria-live="polite"`.
- Controls: native range/select/button/text; label wraps the control.
- Keyboard: Tab order, `:focus-visible` outline, no drag-only interaction.
- Colour: Okabe–Ito palette; pair exon/intron or allele with a label/pattern.
- Motion: `prefers-reduced-motion` disables transitions.
- Print: hide controls, keep the current state, open solutions.

## Real desktop verification

`terminal-browser` is the fast mobile loop. The delivery gate is the live Plasma/Firefox session, driven by the `bionic-runtime` skill:

```sh
~/.agents/skills/interactive-mbg-notes/scripts/verify_desktop.sh \
  ~/notes/mbg/topic.html ~/notes/evidence/topic-desktop.png --scroll 2
```

It resolves `XAUTHORITY` from the live `plasmashell`, opens the note through `$HOME/Apps/glibc/launch/firefox.sh`, and captures the X11 window with ImageMagick `import`.

**Capture caveat:** on this runtime, `wayland-screenshot.sh` (Spectacle) returned black content for the Xwayland Firefox window even though the page rendered. `import -window "$WID"` captured the real page. For Wayland-native apps, keep using the Spectacle helper.

This tier is where you catch: raw TeX instead of KaTeX, doubled equation numbers, desktop two-column overflow, Turkish glyph fallback, and canvas/Gecko differences.

## Verification on Termux

| Tool | Status | Use |
|---|---|---|
| `node --check` | works | syntax gate for the injected JS |
| `python3 validate_note.py` | works | structure, configs, quiz, print hooks |
| `terminal-browser` / Chromium | works on this device | screenshot, eval, interaction smoke test |
| Playwright | not on Bionic | use the system Chromium via terminal-browser |
| `axe-core` | inject via eval | accessibility scan |
| `html-validate` | npm, works | static HTML checks |
| Biopython | pip, works | sequence checks on the laptop/phone |
| primer3-py | GPL; laptop | Tm verification only, not shipped |

Smoke test:

```bash
node --check assets/mbg-labs.js
python3 scripts/validate_note.py note.html
terminal-browser open file:///.../note.html
terminal-browser action -- eval "JSON.stringify({labs:document.querySelectorAll('[data-mbg-lab]').length,ready:document.querySelectorAll('[data-mbg-ready=\"1\"]').length})"
terminal-browser action -- screenshot /tmp/note.png
```

Check `ready === labs` and no “failed to render” status before shipping.

## Fonts and Turkish

KaTeX fonts do not contain all Turkish glyphs (`ş`, `ğ`, `İ`, `ç` may be missing in some faces). Keep Turkish words in HTML, not inside `\text{}`; use `\text{}` for units and short symbols. Never subset the body font to ASCII.

## When not to build a lab

- The concept is a definition or a classification.
- The interaction would be a slider with no invariant.
- The model would be a fake (a “patient genome”, a “real” BLAST hit).
- The page is for print only.
- You cannot test it on a phone.

A static figure with a caption beats a broken canvas.
