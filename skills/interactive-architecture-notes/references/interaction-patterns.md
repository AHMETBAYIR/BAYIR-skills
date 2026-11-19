# Interaction patterns for architecture notes

## The loop

1. **Read** the drawing: what is cut, what is beyond, what is dimensioned, what
   is missing.
2. **Predict** what happens when one design variable changes.
3. **Move** one control (not five).
4. **See** the spatial consequence in plan/section and the numeric consequence
   in the readout.
5. **Explain** the cause: which constraint moved, which trade-off appeared.
6. **Revise** the claim: keep it, qualify it, or abandon it.

## Pattern: plan fits, section fails

The strongest architecture lab in this kit. The learner sees a plan that fits
the available length, then discovers that the floor opening clips the stair and
the headroom falls below 2.20 m. The fix is a single move: slide the opening
edge. The note must show both drawings from the same geometry.

## Pattern: one move, two criteria

A good lab changes one variable and moves two criteria in opposite directions:

- more glazing → more daylight, more overheating;
- deeper overhang → less summer gain, less winter gain, lower DF;
- narrower mass → more average sun hours, but a taller shadow wall;
- more insulation → lower U, thicker wall, higher cost.

If every criterion improves together, the lab is an optimisation toy, not a
design decision.

## Pattern: constraint table

Do not hide code values in prose. Put them in a table with:

`value | unit | type (code/convention/teaching) | source | edition | clause | check`

Then the lab readout can point to the row that failed.

## Pattern: design claim ledger

| Claim | Evidence | Representation | Counter-argument | Revision |
|---|---|---|---|---|

A row without a counter-argument is not designed yet. A row without a
representation is not communicated yet.

## Pattern: precedent at the same scale

Redraw the precedent plan/section at the same scale as the proposal. Mark what
was kept, what was changed, and what was omitted. A collage without a scale is
not evidence.

## Pattern: critique prompt

Instead of “Is this good?”, ask:

- Which user group is excluded by this move?
- What happens at the section, not just the plan?
- Which constraint is doing the work: code, structure, climate, or cost?
- What would a precedent that does the opposite look like?
- What is the smallest change that would falsify the claim?

## Anti-patterns

- Slider with no prediction.
- Animation with no readout.
- Render with no plan.
- “Daylight” without a solar altitude.
- “BIM” screenshot with no parameter.
- Timeline with no argument.
- Five controls, one output, no trade-off.
