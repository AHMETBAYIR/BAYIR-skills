# Quality gates

Run these before delivery. A note that fails a gate is not finished, even if it looks good.

## 1. Numbers

```bash
SKILL=~/.agents/skills/interactive-me-notes
python3 "$SKILL/scripts/check_me.py" selftest
python3 "$SKILL/scripts/check_me.py" beam 4 2 200 5e6 2
# ... the command(s) used in the note
```

- [ ] The checker numbers match the note's prose and readout.
- [ ] A second, independent path exists (closed form, table, or a different tool).
- [ ] Units cancel; the result's order of magnitude is plausible.
- [ ] Every standard table value has an edition and a clause.

## 2. Structure

```bash
python3 "$SKILL/scripts/validate_note.py" ~/notes/mechanical/<course>/topic.html
```

- [ ] `OK` with zero failures; warnings reviewed.
- [ ] 5–9 `<h2>` sections, 1–3 labs.
- [ ] One definition, one worked example, one warning, one summary.
- [ ] 3+ common mistakes, 6–10 quiz questions, 3–5 exercises with solutions.
- [ ] Sources / further reading present.

## 3. Browser

```bash
terminal-browser open ~/notes/mechanical/<course>/topic.html --split right --size 0.5
```

- [ ] No console errors (`?selftest=1` shows PASS).
- [ ] Each lab: change every control, press reset, switch theme.
- [ ] Predict block opens and closes.
- [ ] A wrong quiz answer shows a cause-specific explanation.
- [ ] At 390 px: no horizontal scroll; controls wrap; tables scroll.
- [ ] At 200% zoom: labels do not overlap; canvas remains readable.
- [ ] Dark mode: grid, labels, tension/compression colours still contrast.
- [ ] Keyboard only: Tab reaches every control; focus ring visible.

## 4. Print

- [ ] `Ctrl/Cmd+P` preview: controls and quiz buttons hidden.
- [ ] Current state visible: canvas, readout, status sentence.
- [ ] No lab split across pages; no table cut mid-row.
- [ ] Backgrounds are not required to read the figure (print in grayscale).
- [ ] Page count reasonable; margins not consumed by a giant canvas.

## 5. Content

- [ ] The lede states level, system, and payoff.
- [ ] 3–5 outcomes are observable (“hesaplayabilir”, not “anlar”).
- [ ] The derivation has assumptions and a limiting case.
- [ ] The worked example has a unit balance.
- [ ] The common mistakes are the real misconceptions, each with a counterexample.
- [ ] The summary fits on one screen.
- [ ] The model limits are stated next to the result.

## 6. Honesty

- [ ] No invented material property, standard value, or exam claim.
- [ ] No “FEM/CFD validated” unless it was run; otherwise “hand check” or “schematic”.
- [ ] A commercial tool's output is not embedded without a licence and a reproducible model.
- [ ] The simplification is named: rigid, linear-elastic, steady, air-standard, 1D, lumped.
- [ ] Safety factor and failure mode are present in any design calculation.

## 7. Delivery message

Tell the user:

1. absolute path;
2. what is inside (sections, labs, quiz);
3. one honest caveat;
4. how to print and where the checker lives.

## 8. If a gate fails

Fix the **source** (`note.content.html`, `topic-labs.js`), rebuild, re-run the gate. Do not patch the built HTML by hand; the next build will overwrite it.
