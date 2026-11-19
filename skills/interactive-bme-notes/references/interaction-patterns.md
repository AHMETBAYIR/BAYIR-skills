# BME interaction patterns

A lab is not “a canvas with sliders”. Pick the pattern that isolates the concept, then check the failure mode.

| Pattern | Learner action | Best for | Failure mode to avoid |
|---|---|---|---|
| **Parameter sweep** | move one slider, watch one curve | moment arm, diffusion, Michaelis–Menten | five sliders moving at once; no invariant named |
| **Probe** | point at a pixel/trace, read a value | CT HU, ECG fiducials | probe value with no unit or reference |
| **Model switch** | toggle KV/Maxwell, linear/non-linear | viscoelasticity, inhibition type | the two curves look identical because the parameters were not matched |
| **Boundary case** | push a parameter until the model breaks | L_crit, Re > 2000, r → 0 | the break is hidden; the readout keeps showing a number |
| **Composition** | build a system from parts (lead, filter, tissue) | signal chain, scaffold layers | parts are decorative; the output does not depend on them |
| **Predict–check** | commit a value, then reveal | all labs | the prediction is skippable and the answer is visible below |
| **Reference comparison** | compare a measurement with a model | calibration, ECG axis | the model is treated as truth rather than a fit |

## Pattern notes

### Parameter sweep

- One primary control; secondary controls in a second row.
- A dashed “reference” curve at a fixed parameter helps the learner see the direction.
- The status line says *why* the curve moved, not only that it moved.

### Probe

- Crosshair + numeric readout + unit.
- Probe should not change the underlying data.
- On touch, a tap is enough; do not require a hover.

### Model switch

- Normalise the parameters so the comparison is fair (same E, η, σ₀).
- Name the shared quantity (τ, Vmax, Km).
- If the models are indistinguishable at the current parameters, say so.

### Boundary case

- Flag the invalid region explicitly: “Re > 2000: laminar model invalid”, “C < 0: clamped”.
- Do not let the readout report a negative concentration or an infinite force as if it were physical.
- Show the limiting value and the reason.

### Composition

- Each part must have a visible effect on the output.
- Use a block diagram with the same colour/label as the readout.
- Do not add a part that only changes a label.

### Predict–check

- The prediction is a `<details>` before the controls.
- The status line should explicitly reconcile the guess with the result.
- A wrong prediction is the useful case; do not punish it.

### Reference comparison

- Plot the measurement and the fit on the same axes.
- Show residuals or a residual sentence.
- State the fit model and the number of parameters.

## Anti-patterns

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Animated autoplay with no pause | learner watches, does not predict | add play/pause and a step control |
| A slider that changes only a label | no mechanism | remove it or make it change the figure |
| A 3D viewer with no task | novelty, not learning | use a 2D schematic or add a measure task |
| A “real” patient trace with no provenance | ethical and accuracy risk | use synthetic or cite a de-identified dataset |
| Colour-only legend | inaccessible | add labels, shapes, or hatching |
| A readout with 8 rows | cognitive overload | keep 4–7; move the rest to a table |
| A canvas that prints blank | print failure | keep the current state and add a sentence |

## Mapping to engines

| Engine | Primary pattern | Secondary |
|---|---|---|
| `joint` | parameter sweep | boundary case (r → 0) |
| `visco` | model switch | predict–check |
| `oxygen` | parameter sweep | boundary case (C < 0) |
| `stenosis` | parameter sweep | boundary case (Re) |
| `ecg` | composition | probe |
| `michaelis` | model switch | reference comparison |
| `ct` | probe | boundary case (window) |
