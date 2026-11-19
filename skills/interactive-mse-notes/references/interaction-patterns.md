# Interaction patterns for MSE notes

A lab is justified when the learner can form a hypothesis, change one thing, and see a consequence that is not obvious from the static figure. If the static figure already makes the point, use the figure.

## Pattern catalogue

### 1. Rotate-and-count (3D structure)

**Use when:** the object is a unit cell and the question is “what is shared?” or “what is nearest?”.
**Learner action:** drag to rotate; switch structure; toggle bonds.
**Must show:** atoms/cell, coordination number, nearest-neighbour distance, packing fraction.
**Avoid when:** the question is about a specific plane. A rotating ball model does not teach `(111)` planar density; use a plane-slicing figure.
**Failure mode:** a beautiful 3D viewer with no numbers. Rotation alone is “active”, not “constructive”.

### 2. Tie-line drag (phase diagram)

**Use when:** the learner must connect a point, a tie line, phase compositions, and fractions.
**Learner action:** drag the alloy point; change temperature; switch system.
**Must show:** the tie line, its endpoint labels, the fractions, and a mass-balance check.
**Avoid when:** the diagram is ternary or the boundaries are computed by CALPHAD and not available as a simple model.
**Failure mode:** the readout and the figure disagree because both compute independently. Use one geometry function for both.

### 3. Parameter sweep with a limiting case

**Use when:** a relation has a parameter whose effect is counter-intuitive (`√t`, `1/√t`, `exp(-Q/RT)`).
**Learner action:** move a slider across decades; compare two curves.
**Must show:** the current value, the reference value, and the ratio.
**Avoid when:** the parameter has no meaningful range (e.g. negative time).
**Failure mode:** a linear slider for an exponential variable. Use a log slider and label the actual value.

### 4. Compare two systems

**Use when:** the concept is a trade-off (FCC vs BCC, hypoeutectic vs hypereutectic, steel vs aluminium).
**Learner action:** switch a preset while the axes stay fixed.
**Must show:** what is held constant and what changes.
**Avoid when:** the axes must change so much that the comparison is visually meaningless; then use two small multiples.
**Failure mode:** switching the preset also rescales the axes, so the learner cannot see the difference.

### 5. Index-the-pattern

**Use when:** the learner must assign `(hkl)` labels from peak positions.
**Learner action:** choose the lattice type and radiation; read the first peaks; predict the next.
**Must show:** `2θ`, `d`, `(hkl)`, and the allowed-reflection rule.
**Avoid when:** the cell is non-cubic and the indexing requires a full search.
**Failure mode:** a pattern with unlabelled peaks, or labels that are auto-generated without the selection rule.

### 6. Step-through a cooling path

**Use when:** the sequence matters: liquid → primary solid → eutectic → solid.
**Learner action:** step the temperature down; pause at the liquidus, solidus, and eutectic.
**Must show:** the current region, the phases, the fractions, and the microstructure sketch.
**Avoid when:** the path is trivial (pure substance) or the diagram is not at equilibrium.
**Failure mode:** autoplay that cannot be paused; the learner watches instead of predicting.

### 7. Fit-and-residual

**Use when:** the note is a lab report or a data-analysis exercise.
**Learner action:** choose a model, adjust a parameter, inspect residuals.
**Must show:** the data, the fit, the residual, and the parameter uncertainty.
**Avoid when:** there is no real data; a synthetic curve with no noise teaches nothing about fitting.
**Failure mode:** `R²` displayed as the only goodness-of-fit measure.

### 8. Selection chart (Ashby)

**Use when:** the task is materials selection with a performance index.
**Learner action:** move a selection line; change the index slope; apply a constraint.
**Must show:** log axes, material families, the index equation, and the surviving candidates.
**Avoid when:** the dataset is not sourced or the index is not derived.
**Failure mode:** a scatter plot with no constraints; “the best material” without a function.

### 9. Microstructure sketch that follows the state

**Use when:** the learner must connect phase fractions to morphology.
**Learner action:** change composition/temperature; the sketch changes from primary + liquid to primary + eutectic.
**Must show:** a “schematic, not to scale” label and the phase colours.
**Avoid when:** the morphology depends on kinetics (dendrite arm spacing, spherulite size) that the diagram does not contain.
**Failure mode:** a photorealistic image that implies quantitative information.

### 10. Retrieval quiz with cause-specific feedback

**Use when:** the note needs durable recall of vocabulary, rules, and orders of magnitude.
**Learner action:** answer; read why; retry missed.
**Must show:** progress, score, and a per-question explanation.
**Avoid when:** the question can be answered by pattern-matching the options.
**Failure mode:** “Wrong, try again” with no explanation; the correct answer highlighted before the learner commits.

### 11. Teach-back prompt

**Use when:** the concept is causal and the learner can explain it in words.
**Learner action:** write or say an explanation; compare with a model answer.
**Must show:** a rubric (what a good answer contains) and a model answer behind a disclosure.
**Avoid when:** no model answer exists; then use a peer-review protocol, not a self-check.
**Failure mode:** a generic “explain why” with no criteria.

### 12. Virtual measurement

**Use when:** the learner must read a scale, a micrograph, or a diffraction pattern.
**Learner action:** place a cursor, measure a grain, read a peak position.
**Must show:** the scale bar, the cursor coordinates, and the uncertainty.
**Avoid when:** the image is decorative or has no scale.
**Failure mode:** a synthetic image presented as experimental data.

## Choosing the pattern

| If the note is about… | First choice | Second choice |
|---|---|---|
| a 3D object | rotate-and-count | plane-slicing figure |
| a map with regions | tie-line drag | step-through cooling |
| a rate law | parameter sweep | compare two systems |
| a characterisation method | index-the-pattern | virtual measurement |
| a trade-off | compare two systems | selection chart |
| a lab report | fit-and-residual | virtual measurement |
| vocabulary/rules | retrieval quiz | teach-back |

Use at most **three** patterns in one note. More than three usually means the note is a course, not a lesson.

## Implementation notes (vanilla JS)

- **One geometry function, two consumers.** Compute the tie-line endpoints once and use them for the canvas, the readout, and the mass-balance check. Do not duplicate the formula.
- **State object first.** Keep `{x, T, key}` (or equivalent) in one object; every control mutates it and calls `render()`. This makes reset and print trivial.
- **Log sliders for exponential variables.** Store the slider index, compute the physical value, display the physical value.
- **Pointer events, not mouse events.** `pointerdown/move/up` works for touch and pen. Set `touch-action: none` on the canvas.
- **Canvas DPR.** Scale the backing store by `devicePixelRatio` and set the CSS size; otherwise text is blurry on a phone.
- **Text alternative.** Update `aria-label` on every render with the current numeric result. A canvas without a changing label is invisible to a screen reader.
- **Reduced motion.** If you animate, respect `prefers-reduced-motion` and keep a step button.
- **Print.** Hide controls, keep the canvas and readout, and add a static sentence with the key number.
- **No `innerHTML` with learner input.** Use `textContent` or DOM construction.
- **No network calls.** The note must work from `file://`. If you need a library, inline it and check the licence.

## Anti-patterns

- **The dashboard.** Six charts, no argument. The learner explores but cannot say what was learned.
- **The animated lecture.** A video embedded in a page; the learner is passive and cannot predict.
- **The fake simulation.** A curve generated by a polynomial that is not the stated physics.
- **The unlabelled figure.** A phase diagram without axis units or a micrograph without a scale bar.
- **The quiz that tests reading.** The answer is a phrase copied from the paragraph above.
- **The 3D view with no 2D check.** The learner rotates but cannot index a plane.
- **The colour-only encoding.** α and β differ only by hue; a colour-blind or printed reader loses the distinction.
