# Lab patterns

A physics lab is not a slider that moves a curve. The teaching claim is made of nine parts. If one is
missing, the lab is decoration.

## 1. Prediction gate

Controls are **locked** until the learner chooses an answer. No number is visible before the commit.
Three options are enough; one must encode the actual misconception.

Good prompts name the comparison, not the formula:

- "N artınca ana maksimum genişler mi, daralır mı?" (answer: narrows)
- "p = 1,10 yaparsan yörünge kapanır mı?" (answer: no, it precesses)
- "a iki katına çıkarsa T ne olur?" (answer: falls by orders of magnitude, not by 2)
- "Hata çubuklarını yarıya indirirsem χ² ne olur?" (answer: ≈ ×4)

Bad prompts: "Formülü doğrula", "Grafiği incele", "Ne olduğunu gör".

## 2. One idea, one invariant

Each lab carries one concept, one invariant, one limiting case. A panel that shows five things teaches
none. Split into two labs or move the rest to static figures.

## 3. Numeric invariants

At least three, with explicit tolerances. They must be checkable in `check.py` and in the page.

| Topic | Invariant | Verified value |
|---|---|---|
| Central force | energy drift over 10 orbits | `|ΔE/E| = 7.4e-10` |
| Central force | precession at `p = 1.1` | `+0.339925 rad/orbit` (theory `+0.339874`) |
| EM | Gauss flux / `q/ε₀` | `0.031 %` error at `R = 3 cm` |
| EM | `E = -∇V` finite difference | `0.010 %` |
| Optics | `N = 2` reduces to Young | `2.2e-16` |
| Optics | resolving power | `R = mN` |
| Thermo | velocity ratios | `1 : 0.921318 : 0.816497` |
| Thermo | normalisation | `∫f dv - 1 = 1.1e-16` |
| Quantum | `T + R` | `< 5e-16` |
| Quantum | numeric vs analytic `T` | `< 5e-11` |
| Relativity | interval invariance | `6.9e-14` |
| Relativity | light-cone error | `0` |
| Condensed | `P → 0` gap | exactly `0` |
| Computational | measured order | Euler 1.05, Cromer 1.02, leapfrog 2.00, RK4 4.00 |
| Lab data | recovered `g` | `1σ` from truth |

## 4. Status line: explain the cause

A number alone is not feedback. The status line names **which term** changed.

Grammar:

> **Change:** `<parameter>` `<old>` → `<new>`. **Effect:** `<readout>`. **Why:** `<mechanism>`.

Examples:

- "ω ≈ ω₀: faz −90°'ye yakın; A = 0,833 m; ζ küçüldükçe tepe sivrilir (Q = 3,33)."
- "Değişen terim: zarf. N arttı, girişim terimi keskinleşti; zarf sıfırları yerinde kaldı."
- "Bariyer `x = π` çözümünü yukarı iter; alt kenar `E₁`'de kalır, yasak bant üstten açılır."

The line must be `aria-live="polite"`.

## 5. Model limit, at the point of use

Next to the lab, not in a footer:

```
Model: 1B, time-independent, single particle, effective mass
Regime: E < V0, barrier ~ nm
Breaks: a ≫ κ⁻¹ (T underflows), finite T, many-body, measurement
```

## 6. Print and accessibility

- `@media print`: controls hidden, current readouts and a static figure visible.
- `prefers-reduced-motion`: animation stops, steady state drawn.
- Keyboard: `Tab` to sliders, arrows to change, `R` reset, `Space` play/pause.
- `role="img"` + a numeric hidden description of the canvas.
- 360 px single column; canvas scaled by `devicePixelRatio`.
- Colour never carries meaning alone; every curve is labelled.

## 7. In-page self-test

`?selftest=1` runs the same invariants in the browser and prints PASS/FAIL. Open it before publishing,
then leave it out of the final view (or keep it behind the query flag).

## 8. One canvas, one contract

The reference harness (from `research/tooling-sims/lab.html`):

```js
fit()        // devicePixelRatio scaling, resize
advance(dt)  // fixed step, 120 Hz trace sampling
draw()       // single canvas, panels
readouts()   // DOM values, aria-live status
explain()    // which term changed and why
selfTest()   // invariants, PASS/FAIL
```

New lab = new model + new panels + new invariants. The other ~250 lines stay.

## 9. Honest bounds

State the size of the state space: "1 degree of freedom", "1+1D", "two-level", "1B lattice". A lab that
says "quantum" but solves a 1D square well is fine — if the page says so.

## Numerical method rules

| Model | Method | Do not |
|---|---|---|
| Conservative orbit | velocity-Verlet / leapfrog | Euler (spirals out) |
| Stiff or driven oscillator | RK4, fixed `h` | adaptive step without reporting `h` |
| Transmission | transfer matrix (complex) | finite differences at a discontinuity |
| Band structure | root-find `cos ka = f(x)` | sample `E(k)` on a uniform grid and miss gaps |
| Fit | closed-form weighted least squares | `scipy.optimize` when a closed form exists (installed, but hides the method) |
| Distribution | analytic `f(v)` + numeric quadrature | histogram of too few samples as "the distribution" |

## Prompt design checklist

- [ ] Names the parameter and the direction of change.
- [ ] Has exactly one defensible answer.
- [ ] The wrong options are real misconceptions, not random.
- [ ] Feedback explains why the chosen option fails.
- [ ] The lab's default state does not already reveal the answer.
