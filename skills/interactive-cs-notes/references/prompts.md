# Prompts and handoffs

These are working prompts for an AI agent. They assume the agent can read/write files, run a browser, and execute Python/Node. Replace the bracketed fields.

## 1. Note brief (the main prompt)

```text
Build an interactive HTML study note for [TOPIC] at [LEVEL].

Audience: [e.g. CS2 students who know arrays and loops, but not recursion].
Source: [lecture PDF / chapter / "no source; use standard material"].
Outcomes: by the end, the learner can
1. [observable outcome]
2. [observable outcome]
3. [observable outcome]

Use the interactive-cs-notes skill. Requirements:
- one self-contained HTML file at ~/notes/cs/[slug].html
- 6–9 sections, with a lede, definitions, a worked example, 2 labs,
  complexity/trade-off analysis, common mistakes, a 8-question retrieval quiz,
  a one-screen summary, and 3 exercises with hidden solutions
- each lab must have a prediction prompt, step/play/reset, a code highlight,
  a live status line, and a print fallback
- do not invent complexity or edge-case behavior; derive or cite it
- test every lab to its final state and compare with a hand trace
- open the result in terminal-browser and report the absolute path

Before writing, show me a 6-line plan: sections, labs, interaction pattern for each lab.
```

## 2. Source-grounded note prompt

```text
Read [FILE] fully before writing. Extract:
- definitions and notation,
- theorems/algorithms with preconditions,
- worked examples and their answers,
- figures that carry meaning,
- the instructor's emphasis (repeated claims, exam hints).

Then build the note. Every claim that comes from the source must be traceable to a page/slide.
If a value or equation is unreadable, write "not readable in the source" instead of guessing.
After the build, give me a coverage map: source section → note section → lab/exercise.
```

## 3. Lab design critique

```text
Critique this lab as a learning intervention, not as UI.

For each item, score 0–2 and give one concrete fix:
- invariant visibility
- prediction before feedback
- learner agency
- code/state synchronization
- explanation quality
- accessibility
- print fallback
- transfer to a new problem

Then answer: if I removed the animation and kept a static diagram + one question,
what would the learner lose? If the answer is "nothing", redesign the lab.
```

## 4. Correctness audit

```text
Audit the algorithm implementation in [FILE].

1. List the invariants the code claims to maintain.
2. For each lab, generate the step trace for the smallest interesting input
   (empty, one element, duplicates, already sorted, reverse sorted).
3. Compare the final state with a hand-computed answer.
4. Check off-by-one errors in binary search and BST bounds.
5. Check that operation counters increment exactly once per comparison/swap.
6. Report failures with the exact step index and expected vs actual state.
Do not change the design; only report.
```

## 5. Accessibility audit

```text
Audit [FILE] against WCAG 2.2 AA for an interactive study note.

Check:
- keyboard reachability and focus order,
- names/roles for every control,
- text alternatives for SVG/canvas,
- live-region announcements,
- color contrast and non-color cues,
- reduced motion,
- 200% zoom and 390 px width,
- print/grayscale.

Return a table: issue, severity, location, fix. Do not rewrite the whole page.
```

## 6. "Explain the explanation" prompt

```text
For each lab status message in [FILE], rewrite it so it states:
(a) what changed,
(b) why it changed (the comparison/invariant),
(c) what the learner should notice next.

Bad: "Step 14 / 87."
Good: "42 > 17, so the pair is swapped. The largest unsorted value moves one
position right; the sorted suffix grows from the right."

Keep each message under 30 words. Do not add exclamation marks.
```

## 7. Quiz generation prompt

```text
Write 8 retrieval questions for [TOPIC].

Constraints:
- 2 recall (definitions/preconditions),
- 3 apply (next state, complexity on a specific input),
- 2 analyze (why does this invariant hold? what breaks if…?),
- 1 transfer (a variant or a comparison).
- Each question has 4 options; distractors must be named misconceptions.
- The explanation must say why the right answer is right and why the
  most tempting distractor is wrong.
- Do not put the answer in the question stem.
- No "all of the above".
Return JSON: id, prompt, options, answer, explain, misconception.
```

## 8. Handoff to a human editor

```text
Here is the note and its test log. Please review only:
1. factual correctness of the complexity table,
2. the two worked examples,
3. the quiz explanations,
4. the print layout.

Do not comment on visual taste. Mark issues as blocker / should-fix / nice-to-have.
```

## 9. Prompt for a "compare two algorithms" lab

```text
Build a comparison lab for [A] vs [B] on the same input.

Requirements:
- one shared shuffled array/graph,
- run both step-by-step, synchronized by operation index,
- highlight the first state where they diverge,
- show comparisons, swaps/writes, and a one-line trade-off,
- include an input where A wins and an input where B wins,
- do not claim a universal winner from one input.
```

## 10. Prompt for a static-only note

```text
Build the note without JavaScript. Use static SVG diagrams, tables, and
<details> reveals. The goal is a printable workbook. If a concept needs
interaction, add a "try this on paper" prompt instead of a fake animation.
```

## Anti-prompts (do not use)

- “Make it engaging” with no teaching move.
- “Add animations everywhere.”
- “Use a fancy 3D library.”
- “Generate the whole course in one file.”
- “Make it go viral.”
- “Don’t bother testing; it’s just HTML.”

These produce decoration, not learning.
