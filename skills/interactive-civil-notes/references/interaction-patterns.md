# Interaction patterns for civil engineering notes

## The loop

1. **Name** the system, load path, boundary, and sign convention.
2. **Name** the limit state and the combination.
3. **Predict** which limit will govern.
4. **Change** one demand or capacity variable.
5. **Read** the ratio and the governing row.
6. **Explain** the collapse mode and the code clause.
7. **Revise** the design: section, reinforcement, width, drainage, etc.

## Pattern: demand vs capacity

Every lab has a ledger with `demand | capacity | ratio | governing`. The
governing row is highlighted and explained. A ratio below 1.0 is necessary,
not sufficient: ductility, detailing, serviceability, and fire remain.

## Pattern: number families

Put characteristic, design, and allowable values in separate boxes with
factors. The most common error is comparing a design stress to `f_ck` or an
allowable pressure to an ultimate load. The box makes the family visible at
the point of substitution.

## Pattern: one failure mode at a time

A retaining wall lab should show overturning, sliding, bearing, and tension as
separate rows, with the water table as the variable that changes all four.
A beam lab should show flexure, shear, ductility, spacing, and layout.

## Pattern: real solver, not lookup

- Truss: assemble `K`, solve `Ku=f`, check `ΣF=0`, detect mechanisms.
- Pipe: solve Colebrook and the pump/system intersection; do not fix `f`.
- RC: solve `C=T` including the non-yielding case; do not use a table of
  “typical” capacities.
- Solar/daylight: compute solar altitude from a real algorithm; do not sketch.

## Pattern: collapse-mode sketch

Draw the mechanism next to the ledger: a flexural crack, a diagonal shear
crack, a buckled column, an overturning wall, a slip circle, a scour hole.
The sketch is not decoration; it tells the learner what “failure” means.

## Anti-patterns

- “Design” button with no ledger.
- Ratio with no units.
- `f_ck` in a design equation.
- Euler load presented as capacity.
- One load position for a moving load.
- Retaining wall without water.
- Pipe with fixed `f=0.02`.
- Traffic with design speed = operating speed.
- FEA contour without a model or convergence.
