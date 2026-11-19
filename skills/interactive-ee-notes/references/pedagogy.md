# Pedagogy

The note teaches through a loop:

> **predict → manipulate → observe → explain → retrieve**

Interactivity is justified only when it makes a model visible or breaks a
misconception.

## 1. Predict before manipulate

A prediction gate is not a speed bump; it activates prior knowledge and makes
the learner commit. The prompt must name the comparison and the direction of
change. Wrong options should be real misconceptions, not random.

## 2. One idea per lab

A lab isolates one invariant, one frontier, or one failure mode. If the learner
changes three parameters and sees five curves, they learn nothing. Split the
lab or move the extra material to a static figure.

## 3. Three representations

For each key idea, connect:

1. **Symbolic:** the equation with defined symbols and units.
2. **Visual:** schematic, Bode plot, load line, constellation, timing diagram.
3. **Numeric:** one worked value with a unit and a tolerance.

A formula without a picture is brittle; a picture without a number is
decoration.

## 4. Worked example

Show the solution as a sequence of decisions, not a wall of algebra:

1. model and assumptions,
2. known/unknown,
3. equation,
4. substitution with units,
5. result and sanity check,
6. limiting case.

Use the same node names and sign conventions as the figure.

## 5. Retrieval practice

- 6–10 questions per note.
- Mix definitions, a calculation, a graph reading, and a misconception.
- Distractors should be plausible: "AM efficiency is 50%", "virtual ground
  works without feedback", "more ADC bits fix aliasing".
- Every answer gets a causal explanation, not just "wrong".
- Hide the answer until an attempt; offer a reset.

## 6. Cognitive load

- One new notation system per section.
- Define a symbol before it appears.
- Keep the worked example close to the rule it uses.
- Use a table for comparisons; use prose for the argument.
- Do not put a long derivation inside a lab panel.

## 7. Common misconceptions to target

| Domain | Misconception | Counterexample |
|---|---|---|
| Circuits | max power = max efficiency | `RL=Rth` gives 50% |
| AC | Q is lost power | Q oscillates; P is dissipative |
| Transient | capacitor voltage can jump | `v_C(0+)=v_C(0−)` |
| Diodes | diode always drops 0.7 V | 0.653 V at 4.35 mA |
| BJT | β is constant | process/temperature/current dependence |
| Op-amp | virtual ground without feedback | comparator |
| Digital | setup/hold = clock period | 25 ns window at 100 MHz |
| Sampling | more bits fix aliasing | 1.1 kHz at 1 kHz → 100 Hz |
| AM | efficiency 50% | 33.3% at m=1 |
| QAM | higher order is always better | same Eb/N0 → worse BER |
| Link | dBm + dBm is meaningful | 20+20 dBm = 23.01 dBm |
| Machines | excitation controls P | Ef mainly controls Q |

## 8. Exam mode

For exam-prep notes:

- one-page formula sheet with units,
- 5 typical problems with full solutions,
- 2 traps with the wrong mental model named,
- 10 quick-retrieval cards,
- a timed mode (5/10/20 min) with hidden solutions,
- no invented exam claims, instructor names, or past-paper questions.

## 9. Language

Turkish when the user writes Turkish. Use TDK spelling, decimal comma in
prose, and keep the English term in parentheses on first use. Do not machine-
translate technical terms; use the established Turkish term (`gerilim`, not
"voltaj"; `empedans`, not "direnç").

## 10. What makes a note good

A good note answers:

- What is the system and the model?
- What changes when I turn this knob, and why?
- What number should I expect, with what unit?
- Where does the model break?
- What would I do on an exam or in a lab?

If the note only answers "what is the formula", it is a reference sheet, not a
lesson.
