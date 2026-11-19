# Mathematical accuracy checklist

A mathematically wrong note is worse than no note. This checklist is written for the author and for the reviewing agent. It is deliberately concrete.

## 1. Definitions and hypotheses

- [ ] Every symbol is defined before it appears.
- [ ] Every function has a domain and a codomain where they matter.
- [ ] Every theorem states its hypotheses. “For a continuous function” is not optional.
- [ ] “Differentiable” vs “continuously differentiable” vs “smooth” is not blurred.
- [ ] “Existence” and “uniqueness” are not conflated.
- [ ] The interval of validity of an ODE solution is stated when it is finite.
- [ ] A matrix is square before you talk about eigenvalues or determinant.
- [ ] A series is stated to converge absolutely before you rearrange it.

## 2. Notation

- [ ] `f'`, `df/dx`, and `Df` are used consistently.
- [ ] Partial derivatives are `∂f/∂x` or `f_x`, not `df/dx` when another variable is held fixed.
- [ ] The gradient is a vector; the normal is a different vector.
- [ ] Units are upright: `5\,\mathrm{V}`, `2\,\mathrm{m/s}`, `3\,\mathrm{kg}`.
- [ ] Decimal comma in prose (Turkish), decimal point inside math.
- [ ] `\approx` for numerical approximation, `=` for exact equality, `\sim` for asymptotic equivalence.
- [ ] Do not write `O(h)` without saying what is being measured and as what goes to zero.

## 3. Derivations

- [ ] Each display line follows from the previous one, or the rule is named.
- [ ] Integration by parts has the correct sign.
- [ ] The integrating factor is `e^{∫P}`, not `e^{P}`.
- [ ] The chain rule is applied to the outer and inner functions.
- [ ] The quotient rule has the correct order.
- [ ] A substitution changes the limits (definite integral) or back-substitutes (indefinite).
- [ ] Squaring both sides does not introduce extraneous solutions without a check.
- [ ] Dividing by a quantity excludes the zero case.
- [ ] The constant of integration is present when needed.
- [ ] The initial condition is imposed after the general solution, not before.

## 4. Limiting cases

Every derivation should survive at least two of these:

- `h → 0` (numerical method → exact derivative/integral);
- `n → ∞` (sum → integral; interpolation → function);
- `x → 0` or `x → ∞` (asymptotic behavior);
- parameter → 0 or ∞ (stability, stiffness, degeneracy);
- matrix → identity / zero / singular (linear algebra);
- interval → a point (continuity, differentiability).

If a formula fails a limit, do not “fix” the limit; fix the formula.

## 5. Numerical claims

A numerical claim needs:

1. **the method** (Euler, RK4, bisection, Simpson, ...);
2. **the parameters** (`h`, `n`, tolerance, initial guess);
3. **the interval** and the norm;
4. **the reference** (exact value, high-precision value, or a certified bracket);
5. **the observed order** or error, not only “the answer.”

Examples of acceptable claims:

> “With `h=0.25`, Euler gives `0.0198` and RK4 gives `−0.69433`; the exact value is `−0.694528`, so the RK4 error is `1.95×10^{-4}`.”

> “Bisection on `[1,2]` reaches `|x-r|≤10^{-6}` in 20 steps; the bracket width is a certificate.”

Unacceptable:

> “Euler is inaccurate.”

> “The error is small.”

> “Newton converges fast.”

## 6. Order and convergence

- Distinguish **local truncation error** from **global error**.
- Euler: local `O(h²)`, global `O(h)` on a fixed interval.
- Heun: local `O(h³)`, global `O(h²)`.
- RK4: local `O(h⁵)`, global `O(h⁴)`.
- Bisection: error bound `(b-a)/2^{k+1}`.
- Newton: quadratic at a simple root; linear at a multiple root.
- Secant: order `φ=(1+√5)/2` under standard assumptions.
- A single error ratio is not proof of an order. Use at least three step sizes; check the trend and the constants.
- For interpolation, state the maximum error on the interval, not the error at the nodes.

## 7. Common false statements

| False statement | Correction |
|---|---|
| “A sign change proves a unique root.” | It proves at least one root for continuous `f`; uniqueness needs monotonicity or a derivative condition. |
| “If `f'(r)=0`, Newton still converges quadratically.” | At a multiple root the order drops; Newton can converge linearly. |
| “The gradient is normal to the surface.” | `∇f=(f_x,f_y)` is in the plane; a normal is `(-f_x,-f_y,1)`. |
| “The tangent plane is exact.” | It is the first-order approximation; the error is controlled by second derivatives. |
| “A smaller step always improves accuracy.” | Round-off and stability can dominate; explicit Euler on a stiff problem can blow up. |
| “More interpolation points always improve the maximum error.” | Runge's function with equidistant nodes is the counterexample. |
| “A convergent series can be rearranged.” | Only absolutely convergent series can be rearranged without changing the sum. |
| “The determinant is always positive.” | It can be negative (orientation reversal) or zero (singular). |
| “Eigenvalues are always real.” | Real matrices can have complex conjugate eigenvalues. |
| “A center is asymptotically stable.” | It is neutrally stable; perturbations do not decay. |

## 8. Figures and tables

- [ ] Axes are labeled with symbols and units.
- [ ] Tick values are readable; the scale is linear or log, and the caption says which.
- [ ] The exact curve and numerical curves are distinguishable by more than color (dash, marker, label).
- [ ] A table states the method, parameters, and error definition.
- [ ] A 3D figure has axes and a viewpoint; a contour map has level values or a caption.
- [ ] The figure caption says what to notice, not only what is plotted.
- [ ] The static print figure is generated from the same data or a verified computation.

## 9. Source fidelity

- [ ] The source is read before writing.
- [ ] The coverage map links source sections to note sections.
- [ ] Direct claims are cited; derivations are checked.
- [ ] An unreadable value is marked “not readable in the source,” not guessed.
- [ ] A figure from a source is credited and its license is respected.
- [ ] The note does not invent an exam policy, a grading rule, or a textbook exercise number.

## 10. Verification recipes

### SymPy

```python
import sympy as sp
x, y = sp.symbols('x y')
f = x**3 - 3*x
assert sp.simplify(sp.diff(f, x) - (3*x**2 - 3)) == 0
assert sp.integrate(sp.sin(x) + sp.Rational(6,5), (x, 0, sp.pi)) == 2 + sp.Rational(6,5)*sp.pi
```

### Numerical derivative check

```python
def central(f, x, h=1e-5):
    return (f(x+h) - f(x-h)) / (2*h)
```

Use it to catch a sign error in an analytic derivative, not to replace the derivation.

### ODE check

- Verify the exact solution by substitution.
- Verify the initial condition.
- Run one step by hand and compare with the lab.
- Compare with `solve_ivp` at tight tolerance (SciPy) or MatLivre's fixed-step code.

### Linear algebra check

- `A @ v - λ * v` should be near zero.
- `det(A)` should match the area ratio of the transformed unit square.
- The characteristic polynomial should have the stated roots.

### Interpolation check

- The interpolant should match every node.
- The maximum error should be computed on a dense grid, not only at the nodes.
- For Chebyshev, check the node formula and the ordering.

## 11. Review questions for the author

1. What is the one claim this note makes?
2. Which line of the derivation would a student challenge, and is the reason written?
3. Which number in the prose is not produced by the lab or a check?
4. What happens at the boundary (`h` large, `n` small, root multiple, matrix singular)?
5. What does the printed page teach if the canvas is blank?
6. Which misconception does each distractor in the quiz represent?
7. Is the “exact” value exact, or is it a high-accuracy numerical reference?
