# Pedagogy: why these notes are built this way

This is a design rationale, not a literature review. The claims below are the ones that change a layout decision.

## 1. Active learning beats a clean explanation

The largest evidence base in undergraduate STEM is the comparison between lecture-only and active learning. Freeman et al. (2014) pooled 225 studies and found higher exam performance and lower failure rates in active-learning sections. The implication for a note is not “add a quiz at the end”. It is that the page should interrupt reading with a decision the learner must make.

**Design consequence:** every lab opens with a prediction. The prediction is not graded; it commits the learner to a model before the page can confirm it.

## 2. Retrieval practice and feedback

Roediger and Karpicke (2006) and the broader testing-effect literature show that retrieving an answer strengthens retention more than rereading. The effect depends on feedback: a wrong answer with no explanation can entrench the error.

**Design consequence:** 6–10 questions per note, each with a cause-specific explanation. Distractors are plausible misconceptions, not random numbers. The quiz persists locally so a learner can return, and “Retry missed” preserves correct answers.

## 3. Spatial reasoning is a trainable bottleneck in MSE

Crystal structures, Miller planes, and microstructure require representational competence: the ability to move between a 3D object, a 2D projection, a symbolic label, and a physical property. Studies of computer-based crystal visualisation in introductory MSE (e.g. ASEE work by Gentry and Faltens) report that students can place atoms in a unit cell yet fail to identify the atomic arrangement on a (110) or (111) plane. The problem is not vocabulary; it is the transformation between representations.

**Design consequence:** a rotating cell is not enough. Pair the rotation with a number that changes when the representation changes: coordination number, nearest-neighbour distance, packing fraction, planar density. Ask the learner to predict which plane is close-packed before revealing it.

## 4. ICAP: interactive beats constructive beats active beats passive

Chi and Wylie's ICAP framework distinguishes passive (reading), active (manipulating), constructive (explaining, predicting, self-explaining), and interactive (dialogic). A slider is only “active”. The learning gain comes when the learner constructs an explanation.

**Design consequence:** controls are followed by a status line that says *why*, and by a teach-back prompt (“explain why the α fraction rises across the eutectic”). A lab with no explanation is a toy.

## 5. Worked examples and fading

Novices learn more from studying a worked example than from solving an isomorphic problem cold (the worked-example effect), but the advantage fades as expertise grows. The practical pattern is example → partially worked → independent problem.

**Design consequence:** the note has one fully worked example with a mass balance, then exercises with hidden solutions, then one open exercise without a solution. Do not begin with an unsolved problem.

## 6. Dual coding and split attention

Text and a diagram are processed through different channels, but a diagram that requires constant eye movement between a legend and the figure imposes split attention. Labels should sit on the figure; the caption should explain the *relationship*, not repeat the labels.

**Design consequence:** label regions and tie-line ends directly on the canvas. Put units on the axes. Do not use a legend for two colours that could be labelled in place.

## 7. Misconceptions are specific

Generic “common mistakes” lists do not help. MSE misconceptions are concrete:

- “A corner atom belongs entirely to this cell.”
- “The lever rule gives the composition of the alloy.”
- “The eutectic is a compound.”
- “Doubling the diffusion time doubles the penetration depth.”
- “UTS is the stress at fracture.”
- “The (111) reflection is the first peak for every cubic metal.”

**Design consequence:** each mistake gets a counterexample and, where possible, a lab state that reproduces it. The phase lab can be dragged to the eutectic isotherm; the diffusion lab can be moved from 1 h to 4 h; the stress lab can be switched to a brittle material.

## 8. Cognitive load: one idea per lab

A phase diagram already contains phases, boundaries, tie lines, compositions, fractions, and microstructure. Adding a cooling-curve animation, a ternary inset, and a quiz to the same panel exceeds working memory.

**Design consequence:** one lab isolates one relationship. The note's prose carries the rest. If a lab needs a paragraph of instructions before it makes sense, the lab is too complex.

## 9. Print and offline are accessibility features

A student on a phone, a student with a printed handout, and a student on a locked-down exam computer are all real. A canvas that requires a mouse excludes the first two; a page that requires a CDN excludes the third.

**Design consequence:** the prose stands alone; the print stylesheet keeps the current state; canvases have text alternatives; the page works from `file://` with no build step. External fonts and KaTeX are enhancements, not prerequisites for the argument.

## 10. What the evidence does *not* say

- It does not say every topic needs an animation.
- It does not say a 3D view is always better than a good 2D diagram. For Miller indices, a labelled 2D projection is often clearer.
- It does not say gamification improves learning. Points and streaks can distract from the explanation.
- It does not say a single HTML file replaces a laboratory. It replaces a handout, not a furnace.

## References worth following

- Freeman, S. et al. (2014). Active learning increases student performance in science, engineering, and mathematics. *PNAS* 111(23), 8410–8415.
- Roediger, H. L. & Karpicke, J. D. (2006). Test-enhanced learning. *Psychological Science* 17(3), 249–255.
- Chi, M. T. H. & Wylie, R. (2014). The ICAP framework. *Educational Psychologist* 49(4), 219–243.
- National Academies of Sciences, Engineering, and Medicine (2018). *How People Learn II*.
- Uttal, D. H. & Cohen, C. A. (2012). Spatial thinking and STEM education. *Psychology of Learning and Motivation* 57, 147–181.
- Gentry, S. P. & Faltens, T. (2017). A computer-based interactive activity for visualizing crystal structures. ASEE Annual Conference.
- Callister, W. D. & Rethwisch, D. G. *Materials Science and Engineering: An Introduction* — the standard reference for the representations used here.
