---
name: html-study-notes
description: Create beautiful standalone HTML study notes for class notes, mathematics, and electronics. Use when the user asks for "ders notu", "ders notları", "konu anlatımı", "çalışma notu", "formül kağıdı", lecture notes, class notes, a study guide, or wants notes as HTML instead of Markdown/PDF; also use when a math derivation or circuit diagram would be clearer as a designed, printable page.
metadata:
  version: "1.0"
---

# HTML Study Notes

Turn a topic, lecture, or source into **one designed HTML page** that a student can read on a phone, study from, and print as an A4 workbook.

The look is fixed: warm paper, editorial serif, one course accent, numbered sections, margin-style table of contents, and print-first callouts. Do not redesign it per note. Consistency across a course is the point.

## Output contract

- One file: `~/notes/<course>-<topic>.html` (or a folder the user names).
- Self-contained: CSS and JS are inline, local SVGs are inlined by the build script. Only pinned Google Fonts and KaTeX come from a CDN.
- Turkish when the user writes Turkish; otherwise the source language. Keep technical terms in English in parentheses on first use.
- Content: definition / theorem boxes, a real derivation, worked examples, at least one figure when the topic has structure, common mistakes, a summary, and 2–5 exercises with hidden solutions.
- Open the result in `terminal-browser` and give the user the absolute path.

## Workflow

### 1. Read the source first

If the user supplies slides, a PDF, photos, or a chapter, extract and read it fully before writing. Never invent a definition, a value, or an exam claim. If a value is unreadable, write "kaynakta okunamıyor" and move on. If there is no source, use the named topic and state the level (e.g. "üniversite 1. sınıf devre analizi") in the intro.

The system already has `pdftotext`, `pdftoppm`, and `pdfinfo`:

```bash
pdftotext -layout lecture.pdf lecture.txt
pdfinfo lecture.pdf
pdftoppm -png -r 150 -f 12 -l 14 lecture.pdf page   # pages with figures/equations
```

Read the text first, then render the pages whose diagrams, equations, tables, or handwriting the text layer lost. A sparse extraction is a reason to look at the image, not evidence that the page is empty.

### 2. Plan 5–9 sections

If the source is a lecture, slide deck, or reading, read
[references/lecture-workflow.md](references/lecture-workflow.md) first and build
a coverage map. It covers source inspection, fidelity, formula checks, figure
captions, and review questions.

List the `h2` sections before writing. A good lecture-note arc:

1. What this note covers (short lede + 3 outcomes)
2. Core definitions and notation
3. The main idea, built step by step
4. Derivation / method
5. Worked example
6. One figure or table that makes the structure visible
7. Common mistakes
8. Summary
9. Exercises with solutions

Every section earns its place. No "Introduction" section that only says the topic is important.

### 3. Write the content fragment

Write only the article body to `note.content.html`, using the components in
[references/components.md](references/components.md):

- `<h2 id="...">` for sections — the build script generates the TOC.
- `<aside class="callout callout--definition">` for Tanım, `--theorem`, `--example`, `--warning`, `--tip`, `--note`.
- `<div class="equation">` for numbered display math.
- `<figure class="figure">` + `<img src="local.svg" alt="...">` for circuits and waveforms.
- `<div class="exercise">` + `<details class="solution">` for exercises.
- `<div class="keypoints">` for the take-away box.

Use `$...$` for inline math and `$$...$$` inside `.equation__body` for display math.

### 4. Make the figures

Analog circuits — write a small SchemDraw file, then render it:

```bash
SKILL=~/.agents/skills/html-study-notes
python3 "$SKILL/scripts/render_circuit.py" rc.py --out rc.svg \
  --title "RC şarj devresi" --alt "Direnç ve kondansatörden oluşan seri RC devresi"
```

Waveforms and timing diagrams — write a JSON spec, then render it:

```bash
python3 "$SKILL/scripts/waveform_svg.py" rc-wave.json --out rc-wave.svg
```

Both scripts print the output path. Reference the SVG from the content fragment with a normal `<img src="rc.svg" alt="...">`; the build script inlines it.

Read [references/electronics.md](references/electronics.md) before drawing a circuit. Topology and labels are graded; decoration is not.

### 5. Build

Create `note.json`:

```json
{
  "title": "RC Devrelerinde Geçici Rejim",
  "course": "ELE 201 · Elektrik Devreleri",
  "subtitle": "Birinci mertebeden devrelerde zaman sabiti, enerji ve sınır durumları",
  "date": "6 Kasım 2026",
  "source": "Ders 07 slaytları",
  "lang": "tr",
  "accent": "#8f2d2d"
}
```

Then:

```bash
python3 "$SKILL/scripts/build_note.py" \
  --content note.content.html --meta note.json \
  --out ~/notes/ele201-rc-gecici-rejim.html
```

Pick the accent once per course and reuse it: oxblood `#8f2d2d`, ink blue `#1f4e79`, forest `#2f5d3a`, amber `#9a5a00`, or plum `#5b3a6b`.

### 6. Verify before delivering

Open the page and actually look at it:

```bash
terminal-browser open ~/notes/ele201-rc-gecici-rejim.html --split right --size 0.55
```

Check:

- No raw `$...$` or `$$...$$` visible: KaTeX parsed every formula.
- No horizontal overflow at phone width (~390 px).
- Circuit pins all connect; labels do not collide; values and units are present.
- Every `<details>` opens; print preview shows solutions expanded.
- The PDF/A4 print does not split a callout, figure, equation, or table row.
- The TOC entries jump to the right sections and highlight while scrolling.

If something is wrong, fix the source and rebuild. Do not ship a page you have not looked at.

### 7. Deliver

Open it in a split pane, then tell the user in two or three lines:

- the absolute path,
- what is inside (sections, solved examples, figures),
- one honest caveat if a source value was unreadable.

## The look: rules that keep it coherent

- **One accent per course.** It marks section numbers, links, labels, and the top rule. Everything else is ink, paper, and rule.
- **Serif body, serif display, sans labels, mono math/code.** Do not switch to Inter or a system sans for the body.
- **Space groups content, not boxes.** Prefer a rule and a gap to another card.
- **One radius (2 px), one shadow (the sheet), no gradients on components.**
- **No emoji, no icon rows, no "hero → three cards → CTA" layout.** This is a document, not a landing page.
- **Numbers in the margin, not in a badge.** Section numbers are typographic, not decorative chips.
- **Figures get a white canvas even in dark mode.** Black circuit strokes must stay readable.
- **Print is a first-class output.** A4, 16–18 mm margins, 10.5 pt body, solutions expanded.

## Math rules

Read [references/math.md](references/math.md) for the full checklist. The non-negotiables:

- Define every symbol before it appears in an equation.
- Units upright: `5\,\mathrm{V}`, `10\,\mathrm{k\Omega}`, `2\,\mu\mathrm{F}` — never italic units.
- Decimal comma in Turkish prose, decimal point inside math: "3,3 V" but `$3.3\,\mathrm{V}$`.
- One relation per display line; annotate the rule ("KVL", "türev al", "başlangıç koşulu") next to the step.
- Check the limiting cases: $t\to0$, $t\to\infty$, $R\to0$, $C\to\infty$. A derivation that fails a limit is wrong.
- Do not use `\text{}` for multi-word Turkish explanations inside equations; put the explanation in prose.

## Electronics rules

Read [references/electronics.md](references/electronics.md) for SchemDraw recipes and a correctness checklist. The non-negotiables:

- Power at the top, ground at the bottom, signal flow left to right.
- Every pin has a connection; no dangling wire, no "looks adjacent" node.
- Put a dot on every T-junction; a crossing without a dot is not a connection.
- Label every component with a reference and a value (`R1 = 1 kΩ`), and every source with polarity.
- Check the topology before styling: series/parallel, node count, source polarity, reference directions.
- For transient notes, show the circuit, the waveform, and the time constant together.

## Verification tools

For a circuit note, the hand derivation comes first. After it, verify the
number with a small netlist:

```bash
hover circuit.hvr        # writes simulation_output.csv
```

`hover` is installed in this environment and is documented in
[references/hover.md](references/hover.md). It is a circuit simulator, not a
MATLAB replacement: use it for `.op` (DC) and `.tran` (transient) checks, and
keep MATLAB/Octave/Python for matrix algebra, symbolic work, and general plots.

## Companion skills

This skill is the **output system** for full class notes. Use a companion only
when its job is genuinely different:

| Companion | Use it when | Do not use it for |
|---|---|---|
| `math-render` | the user asks for a quick one-topic formula/figure page, not a full class note; run it with `--no-open --no-pdf`, then open the HTML with `terminal-browser` | a multi-section lecture note with exercises |
| `interactive-cs-notes` | the topic is algorithms/data structures/CS and needs step-through labs, retrieval practice, code/state synchronization, or a printable interactive note | a purely prose note with no stateful figures |
| `terminal-browser` | previewing the built page, checking mobile width, taking a screenshot | writing or editing the note |
| `lecture-workflow.md` (reference, not a skill) | the source is a lecture, slide deck, or reading | a note from a topic the user described in chat |

If the user explicitly asks for slides → a print-ready PDF workbook, say that
this skill produces HTML/A4 and offer to print the HTML to PDF; do not silently
switch to a different design system.

## Files

| Path | Purpose |
|---|---|
| `assets/template.html` | The complete design system; do not edit per note unless the user asks for a new theme |
| `scripts/build_note.py` | Content + metadata → single HTML file; generates TOC and inlines SVGs |
| `scripts/render_circuit.py` | SchemDraw Python → clean inline-ready SVG |
| `scripts/waveform_svg.py` | JSON points → engineering waveform / timing SVG |
| `references/components.md` | Copy-paste HTML components |
| `references/lecture-workflow.md` | Source → coverage map → teaching structure → review |
| `references/math.md` | KaTeX, notation, units, derivation style |
| `references/electronics.md` | Circuit conventions, SchemDraw recipes, verification checklist |
| `references/hover.md` | Hover netlists and `.op`/`.tran` verification (MATLAB alternative for circuit simulation) |
