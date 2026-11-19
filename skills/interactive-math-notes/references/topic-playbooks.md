# Topic playbooks

Each playbook is a compact recipe: the representations that matter, the lab sequence, the misconceptions worth naming, and the verification that keeps the note honest. Pick the playbook, then adapt it to the actual syllabus.

---

## 1. Calculus I — limits, derivatives, applications

### Core representations

- symbolic: the limit definition and derivative rules;
- geometric: secant → tangent, sign of the derivative, extrema;
- numerical: difference quotients, tables of values, error as `h` shrinks;
- verbal: “rate of change” and “local linearity.”

### Lab sequence

1. **Secant → tangent** (`plot`): fix `x₀`, shrink `h`, compare the secant and tangent slopes. Predict the sign first.
2. **Linearization** (`plot` with a different `f`): compare `f(x₀+h)` with `f(x₀)+f'(x₀)h`. The gap is the linearization error.
3. Optional **error hunt**: a derivative with a missing chain-rule factor; reveal the annotation.

### Misconceptions

- “The derivative is a secant slope.” It is a limit.
- “A small `h` always gives a good numerical derivative.” Cancellation and rounding matter.
- “f'(x)=0 means a maximum.” It is a critical point; the second derivative or sign change decides.
- “Differentiable means the formula is smooth.” Corners and vertical tangents are counterexamples.

### Print artifact

A static secant/tangent figure with three `h` values and a table of slopes. The table is the print fallback: it shows the limit even without the canvas.

### Verification

- SymPy: `diff`, `limit`.
- Numerical: central difference at two `h` values; check the error order.

---

## 2. Calculus II — integration, sequences, series

### Core representations

- symbolic: antiderivatives, Riemann sums, series tests;
- geometric: area, accumulation, convergence of partial sums;
- numerical: quadrature rules and error tables;
- verbal: “sum of infinitely many pieces” and “the remainder is what is left.”

### Lab sequence

1. **Riemann sums** (`riemann`): compare left/right/midpoint/trapezoid/Simpson at the same `n`; then double `n` and read the error ratio.
2. **Taylor / partial sums** (custom or notebook): plot `f` and `T_n`; show the remainder. The kit does not ship a Taylor lab; use a notebook or a small custom canvas.
3. Optional **improper integral** lab: truncate the interval and show the tail.

### Misconceptions

- “The integral is the area under the curve.” It is a signed accumulation; area is a special case.
- “More terms always means a better approximation.” Convergence depends on the series and the point.
- “Simpson is always exact for quadratics, so it is exact for everything.” The error depends on the fourth derivative.
- “A convergent series can be rearranged freely.” Absolute convergence is the condition.

### Print artifact

A table of `n`, estimate, exact, error, ratio for two rules. The print version teaches the order without the pictures.

### Verification

- SymPy: `integrate`, `series`, `Sum`.
- Numerical: composite Simpson with a very fine grid as a reference, but do not call it “exact.”

---

## 3. Calculus III — surfaces, gradients, multiple integrals

### Core representations

- symbolic: partial derivatives, gradient, tangent plane, iterated integrals;
- geometric: surface, contour map, tangent plane, vector field;
- numerical: gradient components, directional derivatives, integral approximations;
- verbal: “linearize in two directions” and “sum over a region.”

### Lab sequence

1. **Surface + contour + tangent plane** (`surface`): move the point, orbit the surface, read the gradient. This is the signature lab.
2. **Vector field / line integral** (custom): draw a field, a curve, and the dot product along the curve. The kit does not ship this lab; build it only if the course needs it.
3. **Double integral** (custom/notebook): a Riemann sum over a rectangle, then a polar region.

### Misconceptions

- “The gradient is the normal to the surface.” The gradient is a 2D vector; the normal is `(-f_x,-f_y,1)`.
- “A contour map is a second function.” It is the same function at constant heights.
- “Partial derivatives existing means differentiability.” Continuity of the partials is a sufficient condition; existence alone is not.
- “The tangent plane is exact.” It is the first-order approximation; curvature is the error.
- “The order of integration never matters.” It matters for the region description and for integrability.

### Print artifact

A contour map with the point, gradient arrow, and tangent-plane equation. The map is compact and prints better than a 3D rendering.

### Verification

- SymPy: `diff`, `gradient`, `integrate` over a region.
- Numerical: finite differences for `f_x`, `f_y`; check the tangent plane at the point.
- MatLivre: `surf`, `contour`, `quiver` for an independent static figure.

---

## 4. Differential equations — first order and linear systems

### Core representations

- symbolic: separation, integrating factor, characteristic equation;
- geometric: slope field, phase portrait, nullclines, trajectories;
- numerical: Euler/Heun/RK4, step size, local vs global error;
- verbal: “a direction field plus an initial condition” and “stability is about nearby solutions.”

### Lab sequence

1. **Slope field + methods** (`slope`): one field, three methods, same `h`. Step to the end, then halve `h`.
2. **Phase portrait** (`phase`): classify the origin from trace/determinant; click trajectories; compare node/saddle/spiral/center.
3. Optional **stability lab**: `y'=λy`, show the Euler stability region `|1+hλ|≤1`; connect step size to blow-up.

### Misconceptions

- “Euler is inaccurate, so it is useless.” Euler is the simplest stable method and the base case for order analysis.
- “A small step is always stable.” Explicit Euler on a stiff decay requires `h` below a threshold.
- “The phase portrait is global.” Linear classification is local; nonlinear terms can change it.
- “A center is asymptotically stable.” It is neutrally stable; perturbations do not decay.
- “The exact solution is valid everywhere.” State the interval.

### Print artifact

A slope field with exact, Euler, and RK4 curves plus a small table at `x=2`. The table is the quantitative fallback.

### Verification

- SymPy: `dsolve` for the exact solution; check the initial condition.
- MatLivre/SciPy: fixed-step RK4 and `solve_ivp` with tight tolerances.
- Hand check: one Euler step and one RK4 step at the first node.

---

## 5. Numerical analysis — root finding, interpolation, quadrature, ODE

### Core representations

- symbolic: error formulas, order, convergence recurrence;
- geometric: bracket, tangent, secant, interpolating polynomial, node placement;
- numerical: iteration tables, error ratios, maximum error on an interval;
- verbal: “what is the guarantee, what is the cost, and when does it fail?”

### Lab sequence

1. **Root finding** (`root`): bisection vs Newton vs secant on the same function and tolerance. Compare steps and function evaluations.
2. **Interpolation** (`interp`): equidistant vs Chebyshev at the same degree; Runge phenomenon.
3. Optional **quadrature order** (`riemann`): error ratios for midpoint/trapezoid/Simpson.
4. Optional **ODE order** (`slope`): halve `h` and estimate the observed order.

### Misconceptions

- “Bisection is slow, so it is not useful.” It is the only method here with a certified bracket.
- “Newton is always fastest.” It needs a derivative and a good start; per function evaluation, secant can win.
- “A small step means convergence.” Check the residual and the bracket.
- “High-degree interpolation is more accurate.” Runge is the counterexample.
- “The error is zero at the nodes, so the approximation is good.” The maximum error can be large between nodes.

### Print artifact

A convergence plot on a semilog axis and a table of steps/errors. The plot is the shape; the table is the evidence.

### Verification

- SymPy: exact root or exact integral when available; otherwise high-precision `mpmath`.
- NumPy/SciPy: `brentq`, `newton`, `interp1d`/`CubicSpline` as independent checks.
- MatLivre: the same iterations in MATLAB semantics; compare step counts.

---

## 6. Linear algebra — matrices as maps

### Core representations

- symbolic: matrix entries, determinant, eigenvalues, characteristic polynomial;
- geometric: basis vectors, unit square, grid deformation, eigen-directions;
- numerical: `det`, trace, eigenvalues, condition number;
- verbal: “a linear map is determined by what it does to a basis.”

### Lab sequence

1. **Matrix map** (`matrix`): drag a vector; compare `v` and `Av`; watch the unit square.
2. **Eigenvalues** (`matrix` presets): rotation, shear, reflection, projection; identify real/complex eigenvalues.
3. Optional **composition**: apply `A` then `B`; compare `BA` with `AB`.

### Misconceptions

- “The determinant is just a number.” It is the area scale (with sign for orientation).
- “A matrix with determinant zero is invertible.” It collapses at least one direction.
- “Eigenvalues are always real.” Rotations have complex eigenvalues.
- “The columns are just data.” They are the images of the basis vectors.
- “`AB=BA`.” Matrix multiplication is not commutative; composition order matters.

### Print artifact

A before/after grid with the unit square, `v`, `Av`, and the determinant. The static print still shows the map.

### Verification

- SymPy: `det`, `eigenvals`, `eigenvects`, `A*B`.
- Numerical: check `A v = λ v` for each eigenpair; check `det` against the area ratio.

---

## 7. Proof-based courses — discrete math, real analysis, abstract algebra

### Core representations

- symbolic: quantifiers, definitions, algebraic manipulation;
- geometric: dependency diagrams, counterexample pictures, Cayley tables;
- numerical: small cases, counterexample search, proof assistant checks;
- verbal: “what is assumed, what is concluded, and why each line follows.”

### Lab sequence

1. **Proof step-through** (custom): one line at a time, with a “why is this legal?” reveal.
2. **Counterexample hunt** (custom/static): a statement with a parameter; drag to find a failure.
3. **Formal check** (Lean/Mathlib, optional): encode the finite/combinatorial part; do not pretend to formalize the whole course.

### Misconceptions

- “A proof is a sequence of equations.” It is a sequence of implications with stated hypotheses.
- “One example proves a universal statement.” It can disprove, not prove.
- “The converse is true.” Check the direction.
- “A picture is a proof.” It can guide, not replace, the argument.
- “The base case is optional.” Induction needs both base and step.

### Print artifact

A proof skeleton with the hypotheses, goal, and each implication; the diagram is secondary.

### Verification

- Lean 4/Mathlib for formalizable statements.
- Small-case enumeration with Python for finite counterexamples.
- A proof-reading checklist: quantifiers, hypotheses, direction, equality vs implication.

---

## 8. Probability and statistics (extension)

The kit does not ship a statistics lab, but the pattern transfers:

1. **Law of large numbers**: simulate, show the running mean and the standard error.
2. **Central limit theorem**: standardize and compare the histogram with the normal density.
3. **Confidence intervals**: change the confidence level and sample size; show coverage, not only width.

Use a notebook for the simulation, and a single HTML lab for one distribution at a time. Do not animate 10,000 points without a summary statistic.

---

## 9. Choosing a playbook

| Course | First lab | Second lab | Print artifact |
|---|---|---|---|
| Calculus I | `plot` | optional `plot` linearization | secant/tangent table |
| Calculus II | `riemann` | custom Taylor | error table |
| Calculus III | `surface` | custom vector field | contour map |
| Differential equations | `slope` | `phase` | slope field + table |
| Numerical analysis | `root` | `interp` | convergence plot + table |
| Linear algebra | `matrix` | `matrix` composition | before/after grid |
| Proofs | custom proof steps | counterexample hunt | proof skeleton |

If the course is not listed, choose by the **object**: a limiting process → `plot`/`riemann`; a field → `slope`/`phase`; a surface → `surface`; an iteration → `root`; a map → `matrix`; a logical dependency → custom proof steps.
