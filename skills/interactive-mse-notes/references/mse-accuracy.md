# Accuracy checklist for MSE notes

Every item here has produced a wrong number in a real teaching note. Run the list before the note ships.

## 1. Units and dimensions

| Quantity | Correct | Common error |
|---|---|---|
| Stress | `MPa` (1 MPa = 1 N/mm²) | mixing `GPa` and `MPa` in one formula |
| Modulus | `GPa` | using `GPa` where the formula needs `MPa` |
| Strain | dimensionless, often `%` in labels | entering `2` for 2% instead of `0.02` |
| Lattice parameter | `Å` (1 Å = 0.1 nm = 10⁻¹⁰ m) | using `nm` in a density formula expecting `cm` |
| Diffusivity | `m²/s` | `cm²/s` without converting |
| Activation energy | `J/mol` in `exp(-Q/RT)` | `kJ/mol` without `×1000` |
| Temperature | `K` in thermodynamics | `°C` inside `exp(-Q/RT)` |
| Composition | `wt%`, `at%`, `mol%` | mixing bases in a lever rule |
| Wavelength | `Å` with `d` in `Å` | `nm` with `Å` |
| Density | `g/cm³` | `kg/m³` mixed with `g/mol` |

**Rule:** write the unit next to every number in the working, not only in the final answer. A unit check catches most algebra errors before a student does.

## 2. Composition basis

- A binary phase diagram is usually **wt%** or **at%**, not both. The axis label must say which.
- The lever rule works for any conserved quantity (mass, moles, volume), but all three numbers must use the same basis.
- Converting wt% to at% requires molar masses: `x_at = (w_i/M_i) / Σ(w_j/M_j)`.
- For a binary, `x_A + x_B = 1` (or 100%). If your numbers do not sum, you have mixed bases.
- Do not write “40% Sn” without the basis. In a teaching note, “40 wt% Sn” is the minimum.

## 3. Temperature

- `T(K) = T(°C) + 273.15`.
- Phase diagrams are labelled in °C; the Gibbs phase rule is basis-independent, but `ΔG = ΔH − TΔS` needs K.
- A “room temperature” claim should say 20 °C, 25 °C, or 298 K. They are not identical for a rate.
- In an Arrhenius plot, `ln D` vs `1/T` has a slope `−Q/R`; the intercept is `ln D0`. Check the sign.

## 4. Gibbs phase rule

At constant pressure for a binary system:

`F = C − P + 1 = 3 − P`

- Single-phase field: `P = 1`, `F = 2` (temperature and composition are free).
- Two-phase field: `P = 2`, `F = 1` (fix T, the compositions are fixed).
- Eutectic point: `P = 3`, `F = 0` (invariant).
- If pressure is not fixed, use `F = C − P + 2` and say so.

Do not use the phase rule to “prove” a boundary shape. It counts degrees of freedom; it does not give the slope.

## 5. Lever rule

For a tie line from `x_α` to `x_β` at composition `x_0`:

```
f_α = (x_β − x_0) / (x_β − x_α)
f_β = (x_0 − x_α) / (x_β − x_α)
```

Checks, in order:

1. `f_α + f_β = 1`.
2. `f_α x_α + f_β x_β = x_0` (within rounding).
3. The phase whose end is closer to `x_0` is the larger fraction.
4. The numerator uses the **opposite** end.
5. For `α + L`, the liquid end is the liquidus composition at that temperature, not the alloy composition.

For three phases at the eutectic isotherm, the lever rule is not a two-phase calculation. Approach from just above or just below, or use a three-phase mass balance with an additional constraint.

## 6. Crystal geometry

### Atoms per cell

| Structure | `n` | Coordination `Z` | APF |
|---|---|---|---|
| SC | 1 | 6 | 0.524 |
| BCC | 2 | 8 | 0.680 |
| FCC | 4 | 12 | 0.740 |
| HCP (ideal) | 6 | 12 | 0.740 |
| Diamond cubic | 8 | 4 | 0.340 |
| Rock salt (NaCl) | 4 formula units | 6 | ≈0.67 |

Corner atoms are shared by 8 cells; face atoms by 2; edge atoms by 4; body-centred atoms by 1.

### Density

```
ρ = n M / (N_A a³)
```

with `n` atoms (or formula units) per cell, `M` in g/mol, `a` in cm, `ρ` in g/cm³. For `a` in Å: `a_cm = a_Å × 10⁻⁸`.

**Check:** FCC Cu, `a = 3.615 Å`, `M = 63.55 g/mol` → `ρ = 8.94 g/cm³` (measured 8.96). A 0.2% difference is acceptable for a hard-sphere model.

### Interplanar spacing (cubic)

```
d_hkl = a / √(h² + k² + l²)
```

For non-cubic cells, use the general metric tensor. Do not apply the cubic formula to HCP.

### Planar density

`PD = (number of atoms centred on the plane) / (plane area)`. For FCC (111), the plane is a hexagonal net; the answer is `4/(√3 a²)`, not `2/a²`. Draw the plane before computing.

### Miller indices

- `(hkl)` is a plane; `[uvw]` is a direction; `{hkl}` is a family; `<uvw>` is a family of directions.
- A plane intercepts the axes at `a/h`, `b/k`, `c/l`; take reciprocals and clear fractions.
- In cubic, `[hkl]` is normal to `(hkl)`. In non-cubic, it is not (except by coincidence).

## 7. Stress and strain

- Engineering stress `σ = F/A_0`; engineering strain `ε = (L − L_0)/L_0`.
- True stress `σ_t = σ(1 + ε)`; true strain `ε_t = ln(1 + ε)` (uniform deformation, constant volume).
- Young's modulus `E = dσ/dε` in the linear region. Report `GPa` for metals, `MPa` for polymers.
- Yield strength: the 0.2% offset is the intersection of the curve with a line of slope `E` starting at `ε = 0.002`.
- UTS is the maximum engineering stress, not the fracture stress.
- Toughness is the area under the stress–strain curve, in `MJ/m³` (`MPa × dimensionless`). Do not report it in `J`.
- Modulus of resilience `U_r = σ_y²/(2E)` for a linear elastic solid.
- Fracture toughness `K_Ic` has units `MPa√m`; it is not the same as toughness (energy).

**Check:** the area under a curve from 0 to `ε_f` must be positive and must not exceed `σ_u ε_f` (a rectangle bound). If it does, the integration is wrong.

## 8. Diffusion

```
D = D0 exp(−Q/(RT))
C(x,t) = C0 + (Cs − C0) [1 − erf(x/(2√(Dt)))]
```

Assumptions of the error-function solution:

- constant `D` (not composition-dependent);
- semi-infinite solid (no back-face effect);
- constant surface concentration `Cs` (a reservoir, not a finite source);
- one-dimensional diffusion, no convection, no reaction;
- dilute solution (ideal mixing).

Checks:

- `C(0,t) = Cs`, `C(∞,t) = C0`.
- `√(Dt)` has units of length. At 950 °C for 1 h, `√(Dt) ≈ 200 µm` for C in γ-Fe.
- Quadrupling `t` doubles `√(Dt)`.
- A 50 °C increase can change `D` by a factor of 2–4 for a typical `Q ≈ 150 kJ/mol`. Compute it; do not guess.

## 9. X-ray diffraction

- Bragg: `λ = 2d sin θ`; `2θ` is the plotted angle.
- Cubic: `d = a/√(h²+k²+l²)`.
- `sin²θ` is proportional to `h²+k²+l²`; the sequence of `sin²θ` ratios identifies the lattice.
- Allowed reflections:
  - SC: all `(hkl)`.
  - BCC: `h+k+l` even.
  - FCC: all odd or all even.
  - Diamond: all odd, or all even with `h+k+l = 4n`.
  - Rock salt: mixed parity forbidden; all-even strong, all-odd weak (Na vs Cl form factors).
- Peak height also depends on multiplicity, Lorentz–polarisation, atomic form factor, temperature factor, absorption, and texture. Positions are robust; heights are not, unless refined.
- `Kα1/Kα2` splitting appears at high angle; a teaching pattern may omit it, but say so.
- Do not index a pattern from one peak. Use at least three and check the sequence.

## 10. Miller planes and planar density

- Cubic: `d_hkl = a/√(h²+k²+l²)`.
- Planar density is **atoms per 2D unit cell divided by the 2D cell area**, not the number of atom centres on a drawn polygon divided by the polygon area. Boundary sharing matters.
- The 2D cell area is `|u × v| a²`, where `u`, `v` are the shortest independent lattice vectors perpendicular to `(hkl)`.
- Check against known values for FCC Cu (`a = 3.615 Å`): (100) 0.153, (110) 0.108, (111) 0.177 atoms/Å².
- `(200)` has the same planar density as `(100)`; the planes are closer but the in-plane lattice is the same.

## 11. Ternary compositions

- `x_A + x_B + x_C = 1` (or 100%). If the readout does not sum, the projection is wrong.
- A point inside a three-phase triangle has fractions equal to its barycentric coordinates with respect to that triangle. All three must be non-negative and sum to 1.
- Check `Σ f_i x_i = x_0` in two independent components; the third follows.
- A point outside the triangle is in a two-phase or single-phase region; do not apply the three-phase lever rule there.

## 12. Band diagrams

- `n_i = √(N_c N_v) exp(−E_g/(2kT))`, with `k = 8.617333×10⁻⁵ eV/K`.
- `N_c`, `N_v` scale approximately as `T^{3/2}`.
- n-type: `E_F − E_i = kT ln(N_d/n_i)`; p-type: `E_i − E_F = kT ln(N_a/n_i)`.
- Doping moves `E_F`; it does not change `E_g` in this model.
- State the assumptions: full ionisation, non-degenerate statistics, constant `E_g`, no compensation.
- If `E_F` leaves the gap, the model is outside its valid range; flag it rather than plotting a false number.

## 13. TTT and CCT

- TTT is **isothermal**: hold at a temperature, measure transformation start/finish.
- CCT is **continuous cooling**: the path crosses the curves; the result depends on the cooling rate.
- A schematic TTT/CCT diagram is not a calculated one. Say which one is drawn and what the curves are based on.
- The nose is the competition between undercooling (driving force) and diffusion (rate). A fast quench misses the nose and forms martensite.
- Phase fractions must sum to 1, including retained austenite.

## 14. Significant figures and rounding

- `a = 3.615 Å` (4 s.f.) supports a density to about 0.1%, not five decimals.
- A lever-rule fraction from a diagram read to 1 wt% is good to about 0.01–0.03, not 0.001.
- Do not write `f_α = 0.38624` when the tie-line ends are `16.8` and `54.6`. Write `0.386`.
- Keep full precision in the computation; round only the display.
- In a table, align the decimal points and use a consistent number of digits.

## 15. Model vs measurement

State the model at the point of use:

- “Linearised phase boundaries” — the slopes are not thermodynamic.
- “Hard-sphere atoms” — the radii are not the real electron density.
- “Schematic XRD intensities” — not a Rietveld refinement.
- “Schematic microstructure” — not a micrograph; no scale.
- “Equilibrium” — infinite time; real casting may be nowhere near it.

A note that labels its models is more trustworthy than one that hides them.

## 16. Final numeric checklist

- [ ] Every formula has a unit check.
- [ ] Every composition has a basis.
- [ ] Every temperature in an exponential is in K.
- [ ] Every lever rule sums to 1 and reproduces `x_0`.
- [ ] Every density uses the right `n` and `a` unit.
- [ ] Every XRD peak satisfies Bragg and the selection rule.
- [ ] Every planar density uses a 2D cell, not a raw atom count.
- [ ] Every ternary composition and phase fraction sums to 1.
- [ ] Every band calculation states full ionisation and checks `E_F` inside the gap.
- [ ] Every TTT/CCT fraction sums to 1 and states TTT vs CCT.
- [ ] Every toughness is an area, not a point.
- [ ] Every diffusion length is `√(Dt)`, not `Dt`.
- [ ] Every number in the prose appears in the lab or the checker output.
- [ ] Every model is labelled as a model.
