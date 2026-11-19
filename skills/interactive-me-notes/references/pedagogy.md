# Pedagogy behind the kit

The design is not a style preference. It follows five findings that have survived replication well enough to bet a course note on.

## 1. Active learning beats lecture for the same content

Freeman et al. (2014, *PNAS*) pooled 225 studies in undergraduate STEM: active-learning sections had higher exam scores (about 0.47 SD) and lower failure rates (about 1.5× lower). The design implication is **not** “add a quiz at the end”. It is: interrupt the reading with a decision that uses the idea just stated.

In a note this becomes the **predict → manipulate → check** loop. The prediction is cheap (a sentence), but it forces the reader to commit to a mental model before the page confirms or refutes it.

## 2. Retrieval, not rereading

Roediger and Karpicke (2006) showed that testing produces better long-term retention than restudying, even when restudying feels more fluent. Feedback matters: a wrong answer without an explanation can strengthen the error.

Design implication: every quiz option is a **plausible misconception**, and the explanation names the cause (“`W = I/c`, and `c = h/2`, so `W = bh²/6`”), not just the right letter.

## 3. Engagement has levels

Chi and Wylie (2014, ICAP) distinguish passive (reading), active (manipulating), constructive (explaining, predicting), and interactive (dialogue). A slider is *active*; a prediction plus a written explanation is *constructive*. The learning gain is in the construction.

Design implication: a lab must ask the learner to **say what will happen and why** before the controls are touched. The `details.predict` block is that commitment device.

## 4. Novices need worked examples, then faded support

Sweller's cognitive-load work and the worked-example literature (Renkl, Atkinson) show that novices learn more from studying a full solution than from solving an isomorphic problem cold; the advantage fades with expertise.

Design implication: **example → faded example → independent exercise**. The note gives one fully worked numeric example with every substitution, one exercise with a partial hint, and one independent problem. The hidden solution is a check, not the teaching.

## 5. Representation is the bottleneck in engineering

Engineering education research on representations (graphs, free-body diagrams, phase diagrams, circuits) repeatedly finds that students can state a definition and still fail to read the representation. In mechanics, the classic errors are drawing a reaction in the wrong direction, confusing a stress with a force, or reading a diagram’s axes as the physical object.

Design implication: **one representation, made manipulable, connected to a number**. A truss that only rotates teaches nothing; a truss where moving the load changes member forces and exposes a zero-force member teaches the method of joints.

## 6. What the evidence does *not* justify

- It does not justify animation for its own sake. Motion can increase extraneous load (Mayer's coherence principle).
- It does not justify gamification points, streaks, or badges; those change motivation, not the model.
- It does not justify replacing a static figure that already works. If the interaction has no decision, it is decoration.
- It does not justify “discovery learning” without guidance. The note supplies the definition, the procedure, and the check.

## 7. The design rules that follow

| Finding | Rule in this kit |
|---|---|
| Active learning | every lab has a control that changes a physical consequence |
| Retrieval | 6–10 questions, cause-specific feedback, no answer in the stem |
| ICAP | predict before manipulate; explain after |
| Worked examples | full example → faded → independent |
| Representation | one drawing, one formula, one number, same argument |
| Cognitive load | one idea per lab; no decorative animation; controls grouped |
| Accessibility | text alternative, keyboard, print, reduced motion |
| Honesty | model limits at the point of use, not in a footnote |

## 8. Assessment alignment

A note is aligned when the **outcome**, the **example**, the **lab**, and the **quiz** use the same verb and the same representation. If the outcome says “calculate the principal stresses”, the example must calculate them, the lab must show them on the circle, and the quiz must ask for a number or a direction — not for the definition of “principal”.

## 9. Evidence limits

Most of the evidence above comes from classroom studies, not from single-file HTML notes. The transfer is plausible but not measured here. The kit's own quality gates are a design argument, not an efficacy claim. A course that uses these notes should still measure: completion, time-on-task, and a delayed post-test.

## References

- Freeman, S. et al. (2014). Active learning increases student performance in science, engineering, and mathematics. *PNAS* 111(23), 8410–8415.
- Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning. *Psychological Science* 17(3), 249–255.
- Chi, M. T. H., & Wylie, R. (2014). The ICAP framework. *Educational Psychologist* 49(4), 219–243.
- Sweller, J. (1988). Cognitive load during problem solving. *Cognitive Science* 12(2), 257–285.
- Renkl, A. (2014). Toward an instructionally oriented theory of example-based learning. *Cognitive Science* 38(1), 1–37.
- Mayer, R. E. (2009). *Multimedia Learning* (2nd ed.). Cambridge.
- National Academies (2018). *How People Learn II*.
