# Quality gates

Do not ship a page you have not stepped through. This checklist is the minimum for a note that teaches a real topic.

## 1. Structure

- [ ] Exactly one `<h1>`.
- [ ] 6–9 `<h2>` sections, each with a stable `id`.
- [ ] The TOC entries jump to the correct sections and highlight while scrolling.
- [ ] No unresolved `{{...}}` placeholders.
- [ ] No `TODO`, `FIXME`, or “lorem ipsum.”
- [ ] No duplicate ids (the builder namespaces SVG ids automatically).
- [ ] At least one definition/theorem, one worked example, one common-mistakes block, one summary, and 3–5 exercises.
- [ ] A retrieval quiz with 6–10 questions and explanations.

## 2. Mathematics

- [ ] Every symbol is defined before use.
- [ ] Hypotheses and domains are stated.
- [ ] Every derivation step is justified or named.
- [ ] Limiting cases are checked.
- [ ] Exact vs numerical vs asymptotic is clear.
- [ ] Units are upright and correct.
- [ ] Every number in the prose is produced by the lab or a verified check.
- [ ] Convergence/order claims state local vs global and the norm/interval.
- [ ] No raw `$...$` visible on the page.
- [ ] KaTeX renders display and inline math without overflow.

## 3. Labs

For each lab:

- [ ] The lab loads (`[data-math-ready="1"]`).
- [ ] The canvas has a visible result.
- [ ] Step / Play / Reset work.
- [ ] Every slider changes the expected state.
- [ ] Every select changes the method or preset.
- [ ] Drag works; the slider is the keyboard alternative.
- [ ] The readout, table, and status agree with each other.
- [ ] The status explains the cause, not only the step count.
- [ ] The final state is mathematically correct.
- [ ] The print fallback is visible in print preview.
- [ ] The canvas has `role="img"` and an `aria-label`.
- [ ] The status has `role="status"` and `aria-live="polite"`.

## 4. Quiz

- [ ] Every question has 3–4 plausible options.
- [ ] The answer index is correct.
- [ ] A wrong answer shows a cause-specific explanation.
- [ ] The correct option is marked after answering.
- [ ] Refresh restores answers (localStorage).
- [ ] Reset clears the answers.
- [ ] Retry missed resets only the wrong questions.
- [ ] Keyboard: Tab reaches the options; focus is visible.

## 5. Responsive and dark mode

- [ ] 390 px: no horizontal overflow.
- [ ] Controls wrap; labels do not collide.
- [ ] Tables scroll horizontally instead of clipping.
- [ ] The canvas remains legible; no 24 bars in 200 px.
- [ ] Dark mode: text, grid, axes, and semantic colors have contrast.
- [ ] The theme toggle does not blank a canvas (the kit re-renders on `data-theme` change).
- [ ] 200% zoom: no clipped content; the page remains usable.

## 6. Print

- [ ] A4, margins 16–18 mm.
- [ ] Toolbar, TOC, controls, quiz bar/footer hidden.
- [ ] The current lab state is visible (or a static fallback).
- [ ] Static print figures appear.
- [ ] No callout, figure, equation, or table row split awkwardly.
- [ ] Solutions to exercises are expanded.
- [ ] Quiz explanations are visible.
- [ ] Page count is reasonable; a 10-page note should not print as 30.

## 7. Accessibility

- [ ] Keyboard-only path through every control.
- [ ] Focus visible on buttons, sliders, selects, and quiz options.
- [ ] Canvas has a text alternative or an adjacent readout/table.
- [ ] Color is never the only encoding; labels/dashes/markers also differ.
- [ ] `prefers-reduced-motion` suppresses transitions.
- [ ] Contrast: 4.5:1 body, 3:1 large text.
- [ ] Grayscale print still distinguishes the states.
- [ ] No drag-only interaction.

## 8. Performance

- [ ] Page weight under ~1–2 MB on a phone; under ~500 KB if possible.
- [ ] No network calls except pinned KaTeX/fonts (and disclose them).
- [ ] The lab renders in under ~100 ms after load on a mid-range phone.
- [ ] 3D lab: rotation is responsive; reduce the grid on small screens if needed.
- [ ] No memory leak from `setInterval` when the user leaves a playing lab.
- [ ] No console errors.

## 9. Browser test script

```bash
# 1. Build
python3 ~/.agents/skills/interactive-math-notes/scripts/build_note.py \
  --content note.content.html --meta note.meta.json --out ~/notes/math/topic.html

# 2. Static checks
python3 ~/.agents/skills/interactive-math-notes/scripts/validate_note.py ~/notes/math/topic.html

# 3. Open
terminal-browser open ~/notes/math/topic.html --split right --size 0.55
```

Then, in the browser:

```js
// Lab readiness and status
JSON.stringify([...document.querySelectorAll('[data-math-lab]')].map(l => ({
  kind: l.dataset.mathLab,
  ready: l.dataset.mathReady,
  status: l.querySelector('[data-status]')?.textContent.slice(0, 120)
})))

// Overflow check
document.documentElement.scrollWidth > window.innerWidth

// Quiz persistence
localStorage.getItem('math-note-quiz:<id>')
```

Step every lab to its final state. If a lab has a “Compare all” button, press it and check the step counts.

## 10. Independent verification log

For each demo, record:

| Check | Value | Tool |
|---|---|---|
| ODE at x=2, Euler/Heun/RK4/exact | 0.019768 / −0.631124 / −0.694333 / −0.694528 | MatLivre |
| Phase matrix τ, Δ, eigenvalues | −0.8, 1.16, −0.4 ± i | hand/SymPy |
| Surface f, f_x, f_y at (0.8,0.6) | 1, 1.6, 1.2 | SymPy/MatLivre |
| Root steps at 1e−6 | bisection 20, Newton 2–3, secant 3–4 | MatLivre/Python |
| Interpolation n=11 max error | equidistant ≈1.92, Chebyshev ≈0.11 | Python/MatLivre |

The exact numbers may vary in the last digit by engine; the order and the qualitative conclusion should not. The Tool column records what produced each value here — reproduce it with any installed oracle (MATLAB, Octave, or MatLivre) or the Python equivalent.

## 11. Delivery message

- Absolute path.
- What is inside (sections, labs, examples).
- One honest caveat.
- Print/export instruction.
- Companion notebook or MatLivre script path.
