# Pedagogy: what the evidence actually supports

This is a design brief, not a literature review. It answers one question: **what should an interactive CS note do so that the interaction causes learning rather than entertainment?**

## The short version

1. **Interaction is not the active ingredient; the learner’s cognitive work is.** Naps et al.’s meta-study of 24 algorithm-visualization experiments found that *how* students used the visualization mattered more than *what* it showed. Merely viewing animations did not reliably outperform conventional materials. Prediction, what-if analysis, and programming with the visualization did.
2. **Retrieval practice and distributed practice are the most robust study techniques.** Dunlosky et al. (2013) rated practice testing and distributed practice as high utility; rereading and highlighting were low utility. A note should therefore contain questions and a review schedule, not only explanations.
3. **Worked examples help novices, but fade.** The worked-example effect is strong for initial skill acquisition and reverses as expertise grows (expertise reversal). Pair each worked example with a completion problem or a prediction prompt.
4. **Multimedia design matters, but it is subordinate to activity.** Mayer’s principles — coherence, signaling, segmenting, spatial/temporal contiguity, pre-training — reduce extraneous load. They do not replace practice.
5. **Visualization can improve outcomes, with caveats.** Reviews report positive effects in many studies, but not all; the benefit is larger when learners manipulate the visualization and when it is integrated with text and assessment. Do not promise that “interactive” automatically means “better.”

## Design implications

### 1. Use a prediction gate before every lab

Ask a question whose answer is visible in the first few steps:

- “After one bubble pass, which element is guaranteed to be in place?”
- “If `target < A[mid]`, which half can you discard?”
- “BFS discovers the graph in what order from A?”
- “Where will 7 be inserted in this BST?”

The learner commits to a model before seeing the answer. This is cheap to implement (a `<details>` or a one-question quiz) and changes the interaction from watching to testing.

### 2. Make the state visible, but not everything visible

Show the array, the queue, the recursion stack, or the tree. Do **not** show every variable, every pointer, and a full call tree at once. Segment the view:

- one primary state (bars / cells / graph / tree),
- one frontier or memory structure (queue, stack, path),
- one line of pseudocode,
- one sentence of explanation.

This is Mayer’s coherence and segmenting principles applied to a lab.

### 3. Put the explanation next to the state

The status line should say what changed and why:

> “Compared 42 and 17. 42 > 17, so the pair is swapped. The sorted suffix now contains the largest element.”

Not:

> “Step 14 / 87.”

The first is instruction; the second is telemetry.

### 4. Use color as a second channel, never the only channel

Every color state needs a text or shape equivalent:

- compare: dashed outline + “comparing” label,
- swap: accent fill + “swap” in status,
- sorted: check mark or “sorted” legend,
- found: green + “found at index 7”,
- out of range: dimmed + “discarded” label.

This is both an accessibility requirement and a learning aid.

### 5. Fade the scaffolding

A good sequence for one topic:

1. **Worked example** — full trace, narrated.
2. **Completion problem** — learner supplies the next step or the missing line.
3. **Prediction** — learner commits before the trace continues.
4. **Independent problem** — learner writes or assembles the algorithm.
5. **Transfer** — a variant with a different constraint.

A note can implement 1–3 in the browser and 4–5 as exercises. Do not stop at 1.

### 6. Interleave, don’t block

Mix questions from earlier sections into the retrieval quiz. Mix “which algorithm?” questions with “what is the next state?” questions. Interleaving is moderately supported and helps discrimination between similar procedures (e.g., BFS vs DFS, selection vs insertion).

### 7. Space the review

A single note cannot enforce spacing, but it can:

- store quiz results in `localStorage`,
- show “review these 3” on return,
- include a suggested schedule (+1 day, +7 days, +21–30 days),
- export a short “review card” list.

Do not use streak guilt. The point is retrieval, not app engagement.

### 8. Respect cognitive load

- One lab = one invariant.
- Keep the pseudocode to ≤ 12 lines.
- Pre-train vocabulary before the lab (define “frontier”, “invariant”, “stable”).
- Use the same visual grammar across labs (same accent = active, same dashed = frontier).
- Avoid simultaneous autoplay + narration + a long paragraph. Let the learner step.

## What not to do

| Anti-pattern | Why it fails | Better |
|---|---|---|
| Autoplaying animation with no question | Learner watches, does not retrieve | Step button + prediction |
| 3D bars, particles, sound effects | Extraneous load; distracts from the invariant | Plain bars, one accent |
| Full code + full state + full call tree on one screen | Split attention and overload | Segment; show one layer at a time |
| Quiz where the answer is in the question | Tests recognition, not understanding | Plausible distractors + explanation |
| “Interactive” page that is a video in a `<canvas>` | No manipulation, no feedback | Real state + controls |
| Color-only status | Inaccessible; ambiguous | Text + shape + color |
| Fake code execution | Teaches a false mental model | Real sandbox or link to Python Tutor |

## Evidence notes

- Naps, T. L., Rößling, G., Almstrum, V., Dann, W., Fleischer, R., Hundhausen, C., Korhonen, A., Malmi, L., McNally, M., Rodger, S., & Velázquez-Iturbide, J. Á. (2002). *Exploring the role of visualization and engagement in computer science education.* ACM SIGCSE Bulletin. The meta-study’s key finding: engagement level matters more than visualization quality.
- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). *Improving students’ learning with effective learning techniques.* Psychological Science in the Public Interest, 14(1), 4–58. Practice testing and distributed practice = high utility; rereading/highlighting = low utility.
- Mayer, R. E. (2017). *Using multimedia for e-learning.* Journal of Computer Assisted Learning, 33, 403–423. Twelve principles; median effect sizes for multimedia, coherence, signaling, segmenting, etc.
- Sweller, J., van Merriënboer, J. J. G., & Paas, F. (2019). *Cognitive architecture and instructional design: 20 years later.* Educational Psychology Review. Worked-example effect and expertise reversal.
- Sorva, J., Karavirta, V., & Malmi, L. (2013). *A review of generic program visualization systems for introductory programming education.* ACM Transactions on Computing Education. Mixed but often positive results; engagement and integration matter.
- Ericson, B. J., Foley, J. D., et al. (2022). *Parsons problems and beyond: systematic literature review and empirical study designs.* Parsons problems reduce time and syntax load; learning gains are comparable to code generation in many studies, so use them for fluency and diagnosis, not as a replacement for writing code.
- Hundhausen, C. D., Douglas, S. A., & Stasko, J. T. (2002). *A meta-study of algorithm visualization effectiveness.* Journal of Visual Languages and Computing. Students who merely viewed visualizations did not show significant advantages; active use did.

## A compact rubric for a lab

Score 0–2 on each:

- [ ] **Invariant**: the lab makes one invariant visible.
- [ ] **Prediction**: the learner commits before seeing the result.
- [ ] **Agency**: the learner can step, choose, or change a parameter.
- [ ] **Synchronization**: code line, state, and explanation agree.
- [ ] **Feedback**: wrong actions produce a cause, not just a red mark.
- [ ] **Accessibility**: text alternative, keyboard, reduced motion.
- [ ] **Print**: the static state still teaches something.
- [ ] **Transfer**: at least one exercise asks for a variant, not a repeat.

A lab scoring below 10/16 should be simplified or replaced with a static figure.
