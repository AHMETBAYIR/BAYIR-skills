# Interaction pattern catalog

Use this catalog to choose a lab before writing code. Each pattern lists the teaching move, the minimum state, and the failure modes.

## 1. Step-through state machine

**Teaching move:** make an invariant or frontier visible one transition at a time.

**Minimum state:**
- current data structure,
- previous state (or a diff),
- current code line,
- one-sentence explanation,
- step counter and operation counter.

**Good for:** bubble/selection/insertion sort, binary search, BFS/DFS, BST insert/search, linked-list reversal, stack/queue operations, recursion call stack.

**Controls:** Step, Play/Pause, Reset, Speed, input size, algorithm/mode.

**Failure modes:**
- The state is too large to read (e.g., 100 bars).
- The code highlight is not causally connected to the state.
- Autoplay hides the transition.
- The status says “step 14” instead of what changed.

**Implementation tip:** generate an array of immutable snapshots first, then render. This separates algorithm logic from animation and makes testing trivial.

```js
const steps = [];
steps.push({ array: [...a], line: 1, note: "start" });
// ... push a snapshot at every meaningful transition
```

## 2. Predict-the-next-step

**Teaching move:** force retrieval before feedback.

**Minimum state:** a paused trace, a question, a reveal, and the correct next state.

**Good for:** any step-through lab; especially sorting swaps, binary-search half-discard, DFS next node, BST insertion path.

**Controls:** “Reveal next step” instead of “Step” for the first few transitions; then unlock free stepping.

**Failure modes:**
- The prediction is a fake choice (“Should we compare?”).
- The answer is visible in the code panel.
- No explanation after the reveal.

**Implementation tip:** use `<details class="predict">` for a zero-JS version; use a one-question quiz for a scored version.

## 3. Parameter sweep

**Teaching move:** turn a formula into a family of behaviors.

**Minimum state:** parameter, output chart, exact values at the current parameter, one observation.

**Good for:** growth rates, hash-table load factor, pivot choice in quicksort, array size vs comparisons, cache size vs hit rate.

**Controls:** slider, log/linear toggle, presets (n = 8, 64, 1024), reset.

**Failure modes:**
- The chart’s axes are unlabeled.
- The parameter range is too narrow to show the difference.
- A log scale is used without saying so.
- The learner cannot read exact values.

**Implementation tip:** always show a table of exact counts next to the chart. “Looks steep” is not an analysis.

## 4. Code trace + memory model

**Teaching move:** connect source lines to the runtime state that novices cannot see.

**Minimum state:** source, current line, call stack, locals, heap objects/references.

**Good for:** recursion, pointers, linked lists, references vs values, closures, stack vs heap.

**Controls:** step, step over/into, reset, example selector.

**Failure modes:**
- The memory model is language-specific but presented as universal.
- The diagram is too detailed to parse.
- The code is longer than the screen.

**Implementation tip:** if you cannot build a real interpreter, link to Python Tutor for the exact code. Do not fake execution.

## 5. Parsons puzzle

**Teaching move:** remove syntax load and focus on logical order.

**Minimum state:** shuffled lines, drag/click ordering, check, feedback, solution.

**Good for:** algorithm assembly, loop invariants, recursive base cases, SQL query order, proof steps.

**Controls:** drag or up/down buttons, check, reset, hint, show solution.

**Failure modes:**
- Distractor lines are obviously wrong.
- The puzzle can be solved by syntax alone.
- No explanation of why the order matters.

**Implementation tip:** make at least one distractor a plausible but wrong invariant (e.g., `while low < high` vs `while low <= high`). Use keyboard-friendly up/down buttons, not drag-only.

## 6. Compare-two-algorithms

**Teaching move:** make a trade-off concrete by running both on the same input.

**Minimum state:** shared input, two synchronized traces or two result panels, a difference summary.

**Good for:** BFS vs DFS, selection vs insertion, merge vs quick, array vs linked list, BST vs hash table.

**Controls:** shared shuffle, run both, step both, highlight divergence.

**Failure modes:**
- The two panels drift out of sync.
- The comparison is only “which is faster” on one input.
- Stability/adaptivity is asserted but not shown.

**Implementation tip:** run both algorithms on the same snapshot array and show the first index where their states differ. That is the teaching moment.

## 7. Retrieval quiz

**Teaching move:** strengthen recall and reveal misconceptions.

**Minimum state:** question, options or free response, answer, explanation, score, retry-missed.

**Good for:** preconditions, complexity, vocabulary, “which structure?”, “what happens if…?”.

**Controls:** answer, next, retry missed, reset.

**Failure modes:**
- Options are guessable by length or grammar.
- The correct answer is always the longest.
- No explanation.
- The quiz is the only interaction.

**Implementation tip:** write the explanation first, then the distractors. Each distractor should correspond to a named misconception.

## 8. Teach-back / self-explanation

**Teaching move:** make the learner generate the explanation.

**Minimum state:** prompt, free-text box, model answer/rubric, self-check.

**Good for:** proofs, invariants, why an algorithm is correct, trade-off justification.

**Controls:** reveal rubric, compare, save to localStorage.

**Failure modes:**
- No rubric, so the learner cannot judge.
- The model answer is a paragraph of jargon.
- The prompt is “explain everything.”

**Implementation tip:** ask for three specific things: the invariant, why it is maintained, why it terminates. Provide a 3-item checklist, not an essay.

## 9. Static diagram with a question

**Teaching move:** use a well-designed figure when animation adds nothing.

**Good for:** memory layout, tree rotations, graph cuts, recurrence trees, proof diagrams.

**Controls:** none, or a “reveal labels” toggle.

**Failure modes:**
- The diagram is decorative.
- Labels collide.
- The caption repeats the figure instead of interpreting it.

**Implementation tip:** a static SVG + one prediction question often beats a shaky animation. This is a valid choice, not a failure.

## Choosing a pattern

| If the topic is… | Start with | Add |
|---|---|---|
| A loop with an invariant | Step-through | Predict-the-next-step |
| A search space | Step-through | Parameter sweep |
| A recursive definition | Code trace + memory | Teach-back |
| A trade-off between two structures | Compare-two | Retrieval quiz |
| A proof of correctness | Static diagram | Teach-back rubric |
| A vocabulary-heavy chapter | Retrieval quiz | Concept map |
| A “which one is faster?” question | Parameter sweep | Compare-two |

## The 3-lab rule

A full note usually needs **two or three** labs:

1. **Mechanism lab** — how it works.
2. **Boundary lab** — where it breaks or what it costs.
3. **Transfer lab** (optional) — a variant or a comparison.

If you have four labs, check whether one is actually an exercise or a static figure.
