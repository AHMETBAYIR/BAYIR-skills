---
name: interactive-cs-notes
description: Build interactive HTML study notes for algorithms, data structures, and computer science. Use when the user asks for DSA/CS notes, algorithm visualizations, interactive explanations, coding practice pages, or a printable + browser-based study guide. Produces one self-contained HTML file with step-through labs, retrieval practice, complexity tables, and a print fallback.
---

# Interactive CS Notes

Turn a CS topic, lecture, or source into **one self-contained HTML study note** that teaches through a controlled loop:

> **explain → predict → manipulate → check → explain again**

The note must still work as a readable document and as an A4 printout. Interactivity is a teaching device, not decoration.

## What this skill produces

- One file: `~/notes/<course>/<topic>.html`
- A warm-paper, print-first design inherited from `html-study-notes`
- 2–4 **labs** chosen for the topic, not one lab per section
- At least one **retrieval-practice** block with feedback
- A complexity / trade-off table and a common-mistakes section
- A print stylesheet that hides controls and keeps the current visual state
- Optional `localStorage` progress (quiz answers, last lab state) with a reset button

## Non-negotiable pedagogy

1. **Predict before you run.** Every lab has a one-sentence prediction prompt or a `<details class="predict">` before the controls.
2. **One idea per lab.** The lab isolates an invariant, a frontier, a recurrence, or a trade-off. Do not animate three concepts at once.
3. **Code and state stay synchronized.** Highlight the pseudocode line that produced the current state. If you cannot map the step to a line, do not show pseudocode.
4. **The learner acts.** Step, choose an input, resize, compare algorithms, or answer. Autoplay is secondary and must pause.
5. **Feedback explains the cause.** “Not quite” is followed by *why*, not just the correct option.
6. **Text carries the argument.** The page must make sense if every script is blocked. Put the definition, derivation, and take-away in prose, not only in a canvas.
7. **No passive animation.** If a lab can be replaced by a static diagram without losing the interaction, replace it.

Read [references/pedagogy.md](references/pedagogy.md) before choosing interactions.

## Workflow

### 1. Scope the note

Collect or infer:

| Field | Example |
|---|---|
| Topic | Sorting, binary search, graphs, BSTs, hashing, recursion, DP |
| Level | CS1 / CS2 / interview / graduate |
| Source | lecture PDF, textbook chapter, problem set, or “from topic” |
| Outcomes | 3–5 observable things the learner can do afterwards |
| Constraints | phone reading, print, offline, LMS embed, language |

If a source is supplied, read it before writing. Use `pdftotext -layout` first, then render pages with `pdftoppm` for figures. Never invent a value or a claim from an unreadable source; write “not readable in the source” instead.

### 2. Plan 5–9 sections

A reliable arc:

1. **Why this matters / what you will be able to do** — short lede + outcomes.
2. **The core model** — definition, invariant, or representation.
3. **Lab 1: the mechanism** — step-through with prediction.
4. **Lab 2: the boundary** — edge case, failure mode, or comparison.
5. **The analysis** — complexity, recurrence, trade-offs, proof sketch.
6. **Common mistakes** — each with a counterexample.
7. **Retrieval practice** — 6–10 questions with explanations.
8. **Summary / cheat sheet** — one table or one diagram.
9. **Exercises** — 3–5, with hidden solutions.

Not every topic needs two labs. A proof-heavy topic may need one lab and two static diagrams. A data-structure topic may need a build/insert lab and a traversal lab.

### 3. Choose interaction patterns

Pick from the catalog in [references/design-patterns.md](references/design-patterns.md):

| Pattern | Best for | Avoid when |
|---|---|---|
| Step-through state machine | sorting, traversal, recursion | the state is too large to show |
| Predict-the-next-step | any algorithm with a visible invariant | the learner has no prior model |
| Parameter sweep | complexity, hash load factor, pivot choice | the parameter has no meaningful range |
| Code trace + memory | pointers, recursion, references | the language’s memory model is irrelevant |
| Parsons puzzle | syntax-light algorithm assembly | the goal is recall of exact syntax |
| Compare-two-algorithms | trade-offs, stability, adaptivity | the difference is only cosmetic |
| Retrieval quiz | vocabulary, preconditions, complexity | the answer can be guessed from the options |
| Teach-back prompt | explanations, proofs | no model answer or rubric exists |

Use **two or three** patterns per note. More than four is usually a sign of scope creep.

### 4. Draft the content fragment

Use the components from the base skill (`html-study-notes`) plus the lab markup in [references/lab-markup.md](references/lab-markup.md). The fragment is the inside of `<article class="content">`; the build script generates the TOC.

Rules:

- `<h2 id="...">` for sections. The id is the anchor; keep it stable.
- `<h3>` for lab titles and sub-ideas.
- Use `<aside class="callout callout--definition|theorem|example|warning|tip|note">`.
- Use `<div class="equation">` for display math.
- Use `<details class="predict">` for prediction prompts.
- Use `<div class="exercise">` + `<details class="solution">` for exercises.
- Keep code blocks short enough to read on a phone (≤ 60 columns where possible).
- Every lab gets a one-line “what to notice” sentence **before** the controls and a “what just happened” status **inside** the lab.

### 5. Build

The kit lives next to this skill:

```bash
SKILL=~/.agents/skills/interactive-cs-notes
cp "$SKILL/assets/note.content.html" ./note.content.html
cp "$SKILL/assets/note.meta.json" ./note.meta.json
# edit both files
python3 "$SKILL/scripts/build_note.py" \
  --content note.content.html --meta note.meta.json \
  --out ~/notes/cs/<topic>.html
```

The builder wraps the content in the `html-study-notes` template, injects `labs.css` and `labs.js`, and localizes the Turkish chrome to English when `lang` is `en`.

For topic-specific labs (e.g. an IEEE-754 converter or an ARM stack simulator), keep them in a separate `topic-labs.js` / `topic-labs.css` and pass them with `--extra-js` and `--extra-css`. They are inlined after the generic lab layer, so the result is still one file:

```bash
python3 "$SKILL/scripts/build_note.py" \
  --content note.content.html --meta note.meta.json \
  --extra-css topic-labs.css --extra-js topic-labs.js \
  --out ~/notes/cs/<topic>.html
```

If the base skill is missing, install/copy `html-study-notes` first. The builder prints the exact expected path.

### 6. Verify before delivering

Run the validator:

```bash
python3 "$SKILL/scripts/validate_note.py" ~/notes/cs/<topic>.html
```

Then open it and actually use it:

```bash
terminal-browser open ~/notes/cs/<topic>.html --split right --size 0.55
```

Check:

- Every lab: step, play, pause, reset, resize, algorithm/mode switch.
- No console errors (`terminal-browser action -- eval "..."` or devtools).
- At least one wrong answer in the quiz shows an explanation.
- Refresh restores quiz state; reset clears it.
- Phone width ~390 px: no horizontal overflow; controls wrap; bars/cells remain legible.
- Dark mode: lab colors still have contrast.
- Print preview: controls hidden, current state visible, no lab split across pages.
- `prefers-reduced-motion`: transitions are suppressed; autoplay is not the only way to see the algorithm.
- Keyboard: Tab reaches every control; focus is visible; SVG has a text alternative.

Fix the source and rebuild. Do not ship a page you have not stepped through.

### 7. Deliver

Open the file in a split pane and report:

- absolute path,
- what is inside (labs, sections, exercises),
- one honest caveat (e.g. “the merge-sort lab is a static trace because the recursion depth would not fit on a phone”),
- how to print/export.

## Content contract

A complete note has:

- [ ] A lede that states the level and the payoff.
- [ ] 3–5 outcomes in a `.keypoints` box.
- [ ] At least one formal definition and one worked example.
- [ ] At least one figure, table, or lab that makes structure visible.
- [ ] A complexity/trade-off table with the *reason*, not just the order.
- [ ] 3+ common mistakes, each with a counterexample.
- [ ] 6–10 retrieval questions with explanations.
- [ ] 3–5 exercises with hidden solutions.
- [ ] A one-screen summary.
- [ ] Sources / further reading when claims are external.

## Design rules

Inherit the `html-study-notes` system: warm paper, editorial serif, one course accent, numbered sections, margin TOC, print-first callouts. Add only the lab layer:

- Labs sit on the paper, not in a dashboard card. Use rules and spacing, not shadows.
- One accent for the algorithm’s “active” state; semantic colors only for compare/swap/found/error.
- Controls are small, labeled, and wrap on phone.
- Never use color alone: pair it with a label, shape, or text status.
- Keep the lab’s canvas/SVG at a readable size; do not shrink 24 bars into 200 px.
- The status line is part of the teaching, not a debug log. Write it in the note’s language.

## AI interaction rules

When an agent is generating or editing a note:

- **Do not hallucinate complexity.** Derive it or cite it. If the note says “O(n log n)”, the analysis section must explain why.
- **Do not generate a lab you cannot test.** A static trace is better than a broken animation.
- **Do not hide the source of a claim.** Link to the lecture, textbook, or paper.
- **Do not put the answer in the question.** Quiz distractors should be plausible misconceptions.
- **Do not use `innerHTML` with learner input.** Use `textContent` or sanitize.
- **Do not add analytics, network calls, or accounts** unless the user asks. The default is a local, offline-capable file.
- **Do not silently change the design system.** If a new component is needed, add it to the kit and document it.

See [references/prompts.md](references/prompts.md) for reusable briefs and critique prompts.

## Files

| Path | Purpose |
|---|---|
| `assets/labs.css` | Lab, quiz, control, graph, BST, and print styles |
| `assets/labs.js` | Sorting, binary search, graph, BST, growth, and quiz engines |
| `assets/note.content.html` | Starter content with one lab of each type |
| `assets/note.meta.json` | Starter metadata |
| `scripts/build_note.py` | Wraps `html-study-notes`, injects labs, localizes chrome |
| `scripts/validate_note.py` | Static checks for structure, scripts, accessibility hooks, and print CSS |
| `references/design-patterns.md` | Interaction catalog with implementation notes |
| `references/pedagogy.md` | Evidence and design implications |
| `references/tooling.md` | Landscape and selection guide |
| `references/lab-markup.md` | Copy-paste lab HTML |
| `references/quality-gates.md` | Pre-delivery checklist |
| `references/prompts.md` | Briefs, critique prompts, and agent handoffs |

## Companion skills

| Skill | Use it for |
|---|---|
| `html-study-notes` | The base template, TOC, print CSS, KaTeX, and exercise components |
| `terminal-browser` | Opening and testing the built page |
| `math-render` | A quick one-topic formula page, not a full CS note |
| `reverse-engineer-anything` | Only when the note is about a binary/runtime, not ordinary DSA |

## Limits

- This kit does not ship a code execution sandbox. For “run Python in the browser”, add Pyodide deliberately (≈20 MB) or link to Python Tutor; do not pretend a fake interpreter is real.
- Canvas/SVG labs are not screen-reader equivalent on their own. Always pair them with a status line, a text trace, or a table.
- A single HTML file is easy to share but hard to grade at scale. For LMS use, add xAPI/LTI or a server-side quiz only if the user asks.
