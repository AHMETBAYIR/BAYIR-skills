# Pedagogy for BME notes

The evidence base is general; the design implications below are specific to diagram- and measurement-heavy engineering.

## Nine levers

| Lever | What the evidence says | Design implication |
|---|---|---|
| **Predict–observe–explain** | Committing to a prediction before seeing the result improves conceptual change, especially when the prediction is wrong. | Every lab opens with a `<details class="predict">` and a one-sentence commitment. The status line names the reconciliation, not just the number. |
| **Worked examples with fading** | Novices learn more from a full worked example than from an equivalent problem; support should fade as expertise grows. | A full worked example with a unit balance follows Lab 1. Exercises move from completion to bare problems. |
| **Retrieval practice** | Testing beats rereading at one week, even when rereading feels more effective. | Every section ends in closed-book retrieval. Answers live behind a button, not below the fold. |
| **Spacing and interleaving** | Spacing improves retention; interleaving helps when the categories are confusable. | Mix look-alikes: KV vs Maxwell, viscous vs convective, T1 vs T2, competitive vs non-competitive. Do not randomly mix unrelated topics. |
| **Cognitive load** | Split attention and redundancy consume working memory that the diagram needs. | Put labels on the figure; put the cause in the prose. Do not repeat the same sentence in the caption and the body. |
| **Dual coding** | Words + relevant graphics beat words alone, but only when the graphic is intelligible without decoding. | One idea per canvas. A legend, a unit, and a status line are part of the graphic. |
| **Misconception confrontation** | Refutation works better than neutral explanation when the misconception is made explicit. | A common-mistakes block names the wrong model and gives a counterexample or a number. |
| **Feedback timing** | Immediate, cause-specific feedback helps procedural learning; delayed feedback can help transfer. | Quiz feedback explains *why* the distractor is wrong, not only which option is right. |
| **Self-explanation** | Prompting learners to explain a step improves transfer. | Ask “why does the force peak here?” and “what would break this model?” rather than “what is the value?”. |

## Note arcs by type

### Process (ECG acquisition, PCR-like chain, oxygen transport)

1. Lede + outcomes.
2. The signal chain / players and directionality.
3. One mechanism, step by step.
4. Lab: change one parameter, read the trace.
5. Worked example with units.
6. Failure mode / artefact.
7. Common mistakes.
8. Retrieval quiz.
9. Summary + exercises.

### Quantitative model (joint mechanics, Michaelis–Menten, diffusion)

1. Lede + outcomes.
2. Assumptions and free-body / reaction scheme.
3. Derivation with limiting cases.
4. Lab: change a parameter, watch the curve.
5. Worked example with a unit balance.
6. Boundary case where the model fails.
7. Common mistakes.
8. Retrieval quiz.
9. Summary + exercises.

### Data / clinical measurement (CT, ECG interpretation, biosensor calibration)

1. Lede + outcomes.
2. What is measured, with what unit, against what reference.
3. Signal chain and calibration.
4. Lab: window/probe/calibrate.
5. Worked example with uncertainty.
6. Artefact and failure mode.
7. Common mistakes (including “the picture is the physics”).
8. Retrieval quiz.
9. Summary + exercises.

## Lab design rules

1. **One invariant per lab.** The learner should be able to say what stayed fixed.
2. **A visible consequence within one interaction.** No “press run and wait”.
3. **A number the learner can check by hand.** The readout is not decoration.
4. **A named model limit.** “Linearised”, “steady”, “synthetic”, “not to scale”.
5. **A text path.** Keyboard, sliders, and a status line; the canvas is not the only channel.
6. **A print path.** Hide controls, keep the current state and a static sentence.
7. **No fake data.** If it looks like a patient ECG, say “synthetic” in the caption and the aria-label.
8. **No colour-only encoding.** Pair arterial/venous, error, or tissue class with a label, pattern, or number.

## Assessment patterns

| Pattern | Example | What it tests |
|---|---|---|
| 2-tier MCQ | Answer + reason | Whether the right number comes from the right model |
| Predict-the-output | “What happens to L_crit if q doubles?” | Proportional reasoning |
| Spot-the-error | A free-body diagram with the moment arm drawn to the joint | Representation literacy |
| Order-the-steps | Sampling → anti-alias → ADC → filter | Signal-chain causality |
| Label-the-diagram | Randles circuit, CT window, splice map | Vocabulary in context |
| Calculate-then-interpret | Compute F_m, then say whether it is plausible | Unit and plausibility check |
| Transfer | Same lever rule in a different joint | Far transfer |

Distractors should come from real misconceptions: “moment arm = muscle length”, “CMRR is constant”, “stiffer implant is stronger”, “L_crit is a tissue constant”.

## What must not be faked

- A patient ECG, EEG, or medical image.
- A Hounsfield value without a calibration statement.
- A material property without a source and a range.
- A clinical threshold or guideline.
- A finite-element or CFD result.
- A 3D anatomy that implies a segmentation you did not perform.

## Ethical red lines

1. **No clinical advice.** Measurement, description, classification, mechanism; add “not a diagnostic guide”.
2. **No patient-identifiable data.** Metadata stripping is not enough; imaging can re-identify.
3. **No implant/device recommendation for a real person.**
4. **No fabricated standards compliance.** ISO/ASTM/FDA claims need the edition and the scope.
5. **No disability deficit framing.** Describe function, not “suffering”.
