# Pedagogy for interactive mathematics notes

This is the evidence base for the kit, not a literature review for its own sake. Each section ends with a design move you can implement in one HTML file.

## 1. The short version

The patterns that survive both the research literature and real classrooms are:

1. **Active use beats passive viewing.** The learner must predict, choose, or construct; watching an animation is a weak treatment.
2. **Retrieval and spacing beat rereading.** Every note needs questions with feedback and a suggested review schedule.
3. **Worked examples help novices, then fade.** Full trace → completion → independent problem → transfer.
4. **Multiple representations help when the translation is taught.** Formula, graph, table, and contour must be explicitly connected; otherwise the learner sees four unrelated pictures.
5. **Cognitive load is a design constraint.** Remove decoration, segment long traces, put labels next to the thing they label, and define terms before the lab.
6. **Feedback should explain the cause.** “Wrong” is not feedback; “you held y constant but treated it as a function of x” is.

## 2. Active learning and engagement

Freeman et al. (2014) synthesized 225 studies of undergraduate STEM and found that active learning raised examination performance by about 0.47 standard deviations and failure rates under traditional lecturing were about 55% higher than under active learning. The result is about *what students do*, not about technology.

Chi and Wylie (2014) proposed the ICAP framework:

| Level | What the learner does | Example in a math note |
|---|---|---|
| **Passive** | receives information | reading a proof, watching an animation |
| **Active** | manipulates the material | moving a slider, highlighting a step |
| **Constructive** | generates an explanation or prediction | predicting the next Newton iterate, explaining why the error halved |
| **Interactive** | dialogues and co-constructs | comparing two methods with a peer, teaching back |

The design target is **constructive**, with **interactive** as a bonus. A slider alone is active; a prediction plus a slider plus a causal explanation is constructive.

**Design move:** put a prediction prompt before the controls. The learner commits before the feedback appears.

## 3. Retrieval practice and spacing

Dunlosky et al. (2013) evaluated ten study techniques. The two with high utility across materials and criterion tasks were:

- **practice testing** (retrieval from memory);
- **distributed practice** (spacing).

Rereading and highlighting received low utility ratings. This does not make them forbidden; it makes them insufficient as a study strategy.

For mathematics, retrieval should include:

- a definition or hypothesis;
- a one-line derivation step;
- a numerical estimate;
- a method choice (“which method and why?”);
- an error diagnosis (“what is wrong with this solution?”).

**Design move:** 6–10 questions with cause-specific explanations, a “retry missed” button, and a +1/+7/+21-day review suggestion. A note without questions is a reading surface, not a study system.

## 4. Worked examples and expertise reversal

Cognitive Load Theory predicts a **worked-example effect**: novices learn more efficiently from studying a full solution than from solving an equivalent problem, because they are not simultaneously searching for a method and learning the notation. The effect fades and can reverse with expertise (**expertise reversal**; Kalyuga et al.).

A good progression is:

1. **full worked trace** — the lab’s default state;
2. **completion** — predict the next step or fill the missing line;
3. **independent problem** — an exercise with a hidden solution;
4. **transfer** — a variant the note did not show.

**Design move:** every note has at least one full worked example *and* an exercise that changes a condition. Do not jump from definition to a blank problem.

## 5. Self-explanation

Bisra et al. (2018) meta-analyzed self-explanation interventions and reported a moderate positive effect (Hedges’ *g* ≈ 0.55). The mechanism is generative: the learner has to connect a step to a reason.

Prompts that work:

- “Why is this step legal?”
- “What would change if the hypothesis failed?”
- “Which term dominates for small h?”
- “Explain the sign before you compute it.”
- “What did the method assume that this example violates?”

**Design move:** after a lab result, ask for a one-sentence explanation, not another calculation. The status line models the explanation; the exercise asks the learner to produce one.

## 6. Multiple representations and dynamic geometry

Ainsworth (2006) describes three functions of multiple representations: **complementary roles**, **constraining interpretation**, and **constructing deeper understanding**. The design issue is not “add more representations”; it is “teach the translation.”

Meta-analyses of dynamic geometry and dynamic mathematical software report positive but heterogeneous effects:

| Synthesis | Scope | Reported effect |
|---|---|---|
| Juandi et al. (2021), *Heliyon* | 29 studies, 36 effect sizes, 2,111 students; GeoGebra | Hedges’ *g* ≈ 0.96 (random effects) |
| 2023 meta-analysis, *Journal of Research on Technology in Education* | 14 studies, 19 effect sizes, 1,334 students; GeoGebra | Hedges’ *g* ≈ 0.653 |
| 2024 three-level meta-analysis, *Journal of Educational Computing Research* | 107 studies, 10,507 participants; dynamic mathematical software | *d* ≈ 0.632 |

Interpretation:

- The average effect is medium-to-large, but the confidence intervals and heterogeneity are substantial.
- **Short, focused, student-operated** interventions tend to do better than long, teacher-demonstrated ones.
- Near transfer is stronger than far transfer.
- Publication bias and poor reporting are real risks in this literature.

**Design move:** for each core idea, show the symbolic object, the geometric object, and a numerical check. Ask the learner to translate between them. Do not show a surface and a contour map without asking which point is which.

## 7. Prediction, productive failure, and desirable difficulties

Kapur’s **productive failure** work suggests that letting learners attempt a problem before instruction can improve later transfer, especially when the attempt is followed by consolidation. Bjork and Bjork’s **desirable difficulties** framework makes a similar point: conditions that slow immediate performance can improve retention.

In a note, this translates to:

- a prediction before the reveal;
- a “commit” button or a folded `<details>`;
- a wrong answer that is explained, not erased;
- a second attempt after feedback.

**Design move:** never autoplay the answer. The learner should have a stake in the next state.

## 8. Cognitive load and multimedia

Mayer’s multimedia principles remain the best short checklist:

| Principle | Design move | Anti-pattern |
|---|---|---|
| **Multimedia** | words + relevant graphics | walls of text with decorative icons |
| **Coherence** | remove extraneous material | 3D bars, particles, sound effects |
| **Signaling** | highlight the essential element | everything highlighted |
| **Redundancy** | do not repeat the same text in two channels | narration + full caption + paragraph |
| **Spatial contiguity** | put labels next to the thing | legend far from the chart |
| **Temporal contiguity** | show explanation with the state | explain step 3 while showing step 7 |
| **Segmenting** | learner-paced chunks | autoplay through a long trace |
| **Pre-training** | define terms before the lab | “frontier” appears without definition |

**Design move:** one accent for the active state; one status line; labels adjacent to the curve or point; no decorative animation. The lab is not a dashboard.

## 9. Feedback

Hattie and Timperley (2007) distinguish feedback about the **task**, the **process**, and **self-regulation**. “Correct” is task feedback; “you used the wrong chain-rule order” is process feedback; “check the hypothesis before applying the theorem” is self-regulation feedback.

A good status line has three parts:

1. **state** — what is shown now;
2. **cause** — why it changed;
3. **next** — what to try or notice.

Example:

> “At x = 0.25, Euler is 0.625 and RK4 is 0.608; the exact value is 0.608. Euler used only the left slope, so its error is first order.”

**Design move:** write the status line before writing the controls. If you cannot explain the state, the lab is not ready.

## 10. What the evidence does not say

- It does **not** say “more interactivity is always better.” A confusing lab can be worse than a clear static figure.
- It does **not** say “students prefer it, therefore it works.” Preference and learning are different measurements.
- It does **not** say “3D/VR is better.” The representation should match the structure, not the novelty budget.
- It does **not** generalize automatically across prior knowledge, culture, and assessment. Measure transfer if it matters.
- It does **not** justify replacing proof with animation. In a proof-based course, the proof is the object; a diagram is an aid.

## 11. Evidence → design move

| Evidence | Design move | Avoid |
|---|---|---|
| Active learning / ICAP | prediction, manipulation, teach-back | autoplay-only lab |
| Retrieval + spacing | quiz, retry missed, review schedule | “read again” as the only review |
| Worked-example effect | full trace → completion → independent | jumping to a blank problem |
| Expertise reversal | optional “show full trace”, hide hints | forcing experts through basics |
| Self-explanation | “why is this step legal?” prompts | asking for another calculation |
| Multiple representations | explicit translation tasks | four unrelated pictures |
| Cognitive load | segmentation, signaling, contiguity | decoration, split attention |
| Feedback | state + cause + next | “wrong” with no reason |

## 12. Sources

- Ainsworth, S. (2006). DeFT: A conceptual framework for considering learning with multiple representations. *Learning and Instruction*, 16(3), 183–198. <https://doi.org/10.1016/j.learninstruc.2006.03.001>
- Bisra, K., Liu, Q., Nesbit, J. C., Salimi, F., & Winne, P. H. (2018). Inducing self-explanation: A meta-analysis. *Educational Psychology Review*, 30, 703–725. <https://doi.org/10.1007/s10648-018-9434-x>
- Bjork, E. L., & Bjork, R. A. (2011). Making things hard on yourself, but in a good way: Creating desirable difficulties to enhance learning. In *Psychology and the Real World*.
- Chi, M. T. H., & Wylie, R. (2014). The ICAP framework: Linking cognitive engagement to active learning outcomes. *Educational Psychologist*, 49(4), 219–243. <https://doi.org/10.1080/00461520.2014.965823>
- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). Improving students’ learning with effective learning techniques. *Psychological Science in the Public Interest*, 14(1), 4–58. <https://doi.org/10.1177/1529100612453266>
- Freeman, S., et al. (2014). Active learning increases student performance in science, engineering, and mathematics. *PNAS*, 111(23), 8410–8415. <https://doi.org/10.1073/pnas.1319030111>
- Hattie, J., & Timperley, H. (2007). The power of feedback. *Review of Educational Research*, 77(1), 81–112. <https://doi.org/10.3102/003465430298487>
- Juandi, D., et al. (2021). A meta-analysis of GeoGebra software decade of assisted mathematics learning. *Heliyon*, 7(5), e06876. <https://www.cell.com/heliyon/fulltext/S2405-8440(21)01056-2>
- Kapur, M. (2008). Productive failure. *Cognition and Instruction*, 26(3), 379–424. <https://doi.org/10.1080/07370000802212669>
- Kalyuga, S., Ayres, P., Chandler, P., & Sweller, J. (2003). The expertise reversal effect. *Educational Psychologist*, 38(1), 23–31.
- Mayer, R. E. (2017). Using multimedia for e-learning. *Journal of Computer Assisted Learning*, 33, 403–423. <https://doi.org/10.1111/jcal.12197>
- National Academies of Sciences, Engineering, and Medicine (2018). *How People Learn II: Learners, Contexts, and Cultures*. National Academies Press.
- Rittle-Johnson, B., Schneider, M., & Star, J. R. (2015). Not a one-way street: Bidirectional relations between procedural and conceptual knowledge of mathematics. *Educational Psychology Review*, 27, 587–597. <https://doi.org/10.1007/s10648-015-9309-3>
- Sweller, J., van Merriënboer, J. J. G., & Paas, F. (2019). Cognitive architecture and instructional design: 20 years later. *Educational Psychology Review*, 31, 261–292. <https://doi.org/10.1007/s10648-019-09465-5>
- 2023 GeoGebra meta-analysis. *Journal of Research on Technology in Education*. <https://doi.org/10.1080/15391523.2023.2250886>
- 2024 three-level meta-analysis of dynamic mathematical software. *Journal of Educational Computing Research*. <https://doi.org/10.1177/07356331241226594>
