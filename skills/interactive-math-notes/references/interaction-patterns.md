# Interaction patterns for mathematics

A lab is not a button. It is a **teaching move** made concrete. This catalog lists the moves that fit the kit, the representations they need, and the failure modes to catch before shipping.

## 1. The 3-lab rule

A full note usually needs **two or three** labs:

1. **Mechanism lab** — how the object works.
2. **Boundary lab** — where it fails, what it costs, or how it compares.
3. **Transfer lab** (optional) — a variant the note did not show.

If you have four labs, check whether one is actually an exercise or a static figure. If you have one lab, check whether the note is really a reading.

## 2. Pattern catalog

| Pattern | Teaching move | Best for | Minimum controls | Main failure |
|---|---|---|---|---|
| **Step-through limit** | make a limiting process visible one step at a time | secant → tangent, Riemann sum refinement, Picard iteration | Step, Reset | state too large; no causal status |
| **Predict-then-reveal** | force retrieval before feedback | derivative sign, method choice, convergence order | commit / reveal | answer visible; fake choice |
| **Parameter sweep** | turn a formula into a family of behaviors | step size, n, matrix entries, node count | slider, presets | unlabeled axes; no exact values |
| **Compare-two** | make a trade-off concrete on the same input | Euler vs RK4, bisection vs Newton, equidistant vs Chebyshev | shared input, run both | panels drift; one example overgeneralized |
| **Convergence lab** | show error vs effort, not one answer | numerical integration, ODE order, root finding | n/h, error table | claim of order from one ratio |
| **Drag-the-object** | connect a symbolic parameter to geometry | tangent point, initial condition, vector, point on surface | drag + keyboard slider | drag-only; no alternative |
| **Orbit / 3D** | reveal occlusion and shape | surfaces, tangent planes, level curves | drag, zoom, point | decorative 3D; no quantitative check |
| **Error hunt** | diagnose a wrong solution | sign errors, missing hypotheses, unit errors | reveal annotations | “wrong” with no explanation |
| **Proof step-through** | expose the dependency of each line | induction, epsilon–delta, linear algebra proof | next/previous, why | animation replaces the proof |
| **Teach-back** | learner generates the explanation | definitions, method choice, proof idea | prompt, rubric | no model answer |

## 3. Mapping to the kit's engines

### `plot` — secant to tangent

- **Mechanism:** secant slope `(f(x+h)-f(x))/h` approaches `f'(x)`.
- **Boundary:** large `h`, a corner, or a vertical tangent.
- **Transfer:** numerical differentiation error; compare forward/central differences.
- **Status:** say both slopes and the gap; do not only show a moving line.

### `riemann` — sums and order

- **Mechanism:** rectangles/trapezoids/quadratic patches approximate area.
- **Boundary:** a discontinuity, a spike, or a non-smooth integrand.
- **Transfer:** error ratio when `n` doubles; Simpson vs trapezoid.
- **Status:** estimate, exact, error, ratio. The table is the teaching object.

### `slope` — ODE methods

- **Mechanism:** the field gives a direction; a method chooses how to step.
- **Boundary:** stiffness, blow-up, or a step too large for stability.
- **Transfer:** halve `h` and compare observed order.
- **Status:** current `x`, all method values, exact value, error. Do not hide the exact curve if you claim “exact.”

### `phase` — linear systems

- **Mechanism:** eigenvectors and eigenvalues organize trajectories.
- **Boundary:** saddle, center, repeated eigenvalue, zero determinant.
- **Transfer:** nonlinear perturbation of a linearization.
- **Status:** trace, determinant, discriminant, eigenvalues, classification. The label is not enough; say what the trajectories do.

### `surface` — surfaces and gradients

- **Mechanism:** the surface is the graph; the contour map is the level sets.
- **Boundary:** a saddle, a cone point, a flat region, a steep gradient.
- **Transfer:** tangent plane at a different point; directional derivative.
- **Status:** `f`, `f_x`, `f_y`, `|∇f|`, tangent plane. The gradient is a 2D vector; the normal is a 3D vector.

### `root` — root finding

- **Mechanism:** bracket, tangent, or secant crosses the axis.
- **Boundary:** multiple root, flat derivative, bad initial guess, cycle.
- **Transfer:** compare steps and function evaluations at the same tolerance.
- **Status:** iterate, residual, error estimate, stopping reason. A small step is not a small error.

### `interp` — interpolation

- **Mechanism:** a degree `n-1` polynomial passes through `n` nodes.
- **Boundary:** Runge oscillation; noisy data; high degree.
- **Transfer:** equidistant vs Chebyshev at the same degree.
- **Status:** maximum error on the interval, not only the nodal error.

### `matrix` — linear maps

- **Mechanism:** a matrix sends basis vectors and the unit square to new vectors/parallelogram.
- **Boundary:** determinant zero, negative determinant, repeated eigenvalue.
- **Transfer:** composition of two maps; inverse map.
- **Status:** `det`, eigenvalues, area scale, orientation.

## 4. Implementation notes

### Step-through state machine

Generate the states first, render second:

```js
const trace = generate(input);   // pure, testable
let index = 0;
function render() { draw(trace[index]); }
```

The state should carry the explanation, not only the numbers:

```js
{ x, y, slope, error, note: "Euler uses the left slope for the whole step." }
```

### Parameter sweep

- Label the parameter with a symbol and a value.
- Use a linear scale unless the phenomenon is multiplicative; if you use a log scale, say so.
- Show at least one exact value, not only a picture.
- Provide presets for “typical,” “boundary,” and “failure.”

### Compare-two

- Share the input and the axes.
- Keep one color per method across the whole note.
- Show the difference, not only two pictures.
- State the cost: function evaluations, iterations, memory.

### Drag

- Always provide a slider or number input as the keyboard-accessible equivalent.
- Snap to meaningful values only if the mathematics is discrete.
- On pointer down, do not jump the object unless that is the intended interaction.

### 3D

- Use an explicit projection and a clear scale; label the axes.
- Occlusion is a teaching cue, not a measurement.
- Provide a 2D contour or table for the quantitative claim.
- Do not let the 3D view be the only representation of a value.

## 5. What not to build

- A “Run” button that prints a canned answer.
- An animation that cannot be paused or stepped.
- A lab whose only state is “before/after.”
- A 3D view with no axes or scale.
- A quiz whose distractors are obviously wrong.
- A color-only encoding.
- A drag-only interaction.
- A lab that hides the exact value while claiming an error.

## 6. A lab rubric (0–2 each)

- [ ] **Invariant:** one mathematical claim is visible.
- [ ] **Prediction:** the learner commits before feedback.
- [ ] **Agency:** step, choose, drag, or change a parameter.
- [ ] **Synchronization:** state, readout, table, and status agree.
- [ ] **Explanation:** the status says what changed and why.
- [ ] **Representation:** symbolic + geometric + numeric are connected.
- [ ] **Accuracy:** the numbers are independently checked.
- [ ] **Accessibility:** text alternative, keyboard, reduced motion.
- [ ] **Print:** the static state still teaches something.
- [ ] **Transfer:** an exercise asks for a variant, not a repeat.

A lab below 12/20 should be simplified or replaced with a static figure.
