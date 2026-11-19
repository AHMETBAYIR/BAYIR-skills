# Quality gates

Run these before delivering. A note can be beautiful and still fail as teaching material.

## A. Content correctness

- [ ] Every definition is stated precisely, with the domain and preconditions.
- [ ] Every complexity claim is derived or cited; no “O(n log n)” hand-waving.
- [ ] Every worked example has a checked final state (sort the array, trace the search, draw the tree).
- [ ] Edge cases are covered: empty input, one element, duplicates, negative numbers, disconnected graph, degenerate tree.
- [ ] Common mistakes are real mistakes, each with a counterexample.
- [ ] The summary does not introduce a new claim.
- [ ] Sources are listed for external claims and borrowed figures.

## B. Interaction correctness

- [ ] The lab’s generated steps end in the correct final state.
- [ ] Step forward and step backward (or reset) are consistent.
- [ ] Play/pause does not leave a timer running.
- [ ] Changing algorithm/size/mode resets or regenerates the trace cleanly.
- [ ] The code highlight matches the state transition.
- [ ] Operation counts (comparisons/swaps/visits) are correct for the current trace.
- [ ] The status line explains the *cause* of the change.
- [ ] No console errors or unhandled promise rejections.

## C. Learning design

- [ ] Each lab has a prediction prompt or a question before the controls.
- [ ] The learner can act (step, choose, resize, compare), not only watch.
- [ ] At least one exercise requires transfer, not repetition.
- [ ] The quiz has plausible distractors and an explanation for each answer.
- [ ] The note includes retrieval practice and a spaced-review suggestion.
- [ ] The text still teaches if scripts are blocked.

## D. Accessibility

- [ ] All controls have visible labels (not placeholder-only).
- [ ] Every interactive element is reachable by Tab; focus is visible.
- [ ] The SVG/canvas has a text alternative and a live status line.
- [ ] Color is not the only indicator of compare/swap/sorted/found.
- [ ] `prefers-reduced-motion: reduce` disables transitions and non-essential motion.
- [ ] Text contrast is at least 4.5:1 for body, 3:1 for large text.
- [ ] The page works at 200% zoom and at 390 px width.
- [ ] No flashing content; no autoplay audio.

## E. Print / export

- [ ] Controls, play buttons, and quiz buttons are hidden in print.
- [ ] The current lab state is visible and makes sense on paper.
- [ ] A print-only line explains that the lab is interactive.
- [ ] No lab, callout, table row, or equation is split across pages.
- [ ] The TOC and page numbers (if any) are correct.
- [ ] The PDF is readable in grayscale.

## F. Performance / robustness

- [ ] The page loads without a network connection after the first visit (fonts/KaTeX may be CDN; document this).
- [ ] No layout shift when the lab initializes.
- [ ] A 24-element sorting trace does not freeze the main thread.
- [ ] `localStorage` failures (private mode/quota) are caught.
- [ ] No `innerHTML` with untrusted learner input.
- [ ] The page does not depend on a server or an API key.

## G. Delivery

- [ ] The absolute path is reported.
- [ ] The note is opened in the browser and stepped through.
- [ ] The user knows how to print and how to reset progress.
- [ ] One honest caveat is stated (e.g. “the merge-sort lab is a static trace”).

## Automatic checks

```bash
python3 ~/.agents/skills/interactive-cs-notes/scripts/validate_note.py note.html
```

The validator checks:

- single `<h1>`, at least three `<h2>` with ids,
- no unresolved `{{PLACEHOLDER}}`,
- lab hooks match the JS engine,
- `role="status"` / `aria-live` present in each lab,
- print CSS hides controls,
- no `<script src>` other than the allowed KaTeX CDN,
- no `eval(` or `new Function(` in inline scripts,
- quiz data has explanations,
- file size and basic mobile meta.

It cannot check whether the algorithm is correct. That is your job: step to the end and compare with a hand trace.
