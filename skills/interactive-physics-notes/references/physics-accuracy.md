# Physics accuracy

## 1. CODATA 2022 constants (SI)

```python
c     = 299_792_458.0          # m/s, exact
h     = 6.626_070_15e-34       # J s, exact
hbar  = 1.054_571_817e-34      # J s
e     = 1.602_176_634e-19      # C, exact
k_B   = 1.380_649e-23          # J/K, exact
N_A   = 6.022_140_76e23        # 1/mol, exact
G     = 6.674_30e-11           # m^3/(kg s^2)
m_e   = 9.109_383_7015e-31     # kg
m_p   = 1.672_621_923_69e-27   # kg
m_n   = 1.674_927_498_04e-27   # kg
u     = 1.660_539_066_60e-27   # kg
eps0  = 8.854_187_812_8e-12    # F/m
mu0   = 1.256_637_062_12e-6    # N/A^2
alpha = 7.297_352_569_3e-3
a0    = 5.291_772_109_03e-11   # m
R_inf = 10_973_731.568_160     # 1/m
F     = 96_485.332_12          # C/mol
R     = 8.314_462_618          # J/(mol K)
sigma = 5.670_374_419e-8       # W/(m^2 K^4)
b_wien= 2.897_771_955e-3       # m K
```

Derived shortcuts that prevent unit slips:

| Quantity | Value | Use |
|---|---|---|
| `ħ²/(2 m_e)` | `0.038099 eV·nm²` | 1D wells and barriers in eV–nm |
| `ħc` | `197.327 eV·nm` | photon energy / wavelength |
| `m_e c²` | `0.510999 MeV` | relativistic thresholds |
| `e²/(4πε₀)` | `1.439964 eV·nm` | Coulomb in eV–nm |
| `k_B T` at 300 K | `0.025852 eV` | thermal energy |
| `hc` | `1239.842 eV·nm` | band gap ↔ wavelength |

**Rule:** choose one unit system per note and write the conversion once. Mixing eV and J inside one
equation is the most common silent error.

## 2. Dimensional checks

Every equation gets a three-line audit:

1. Both sides in base units (kg, m, s, A, K, mol, cd).
2. Every additive term has the same dimension (a Taylor series in `x` requires `x` dimensionless).
3. Every transcendental argument is dimensionless (`exp`, `sin`, `log`).

Examples that catch real mistakes:

- `E = ħ²k²/(2m)`: `(J s)² (1/m)² / kg = J`. ✓
- `T = exp(-2κa)` needs `κa` dimensionless: `κ = √(2m(V-E))/ħ` has units `1/m`. ✓
- `V_eff = L²/(2mr²) + V(r)`: `L²/(m r²)` is J. ✓
- `χ² = Σ((y - f)/σ)²` is dimensionless. ✓

## 3. Regime ledger

Attach one line to every model. If you cannot fill the "breaks at" column, you do not yet know the model.

| Topic | Model | Regime | Breaks at |
|---|---|---|---|
| Mechanics | Newton, fixed centre | `v ≪ c`, point masses, no radiation | two-body needs `μ`; high `v` needs SR |
| Central force | `V = -k/r^p` | non-relativistic, fixed centre | `p ≠ 1` → rosette, not ellipse |
| EM | point charges in vacuum | classical, static or quasi-static | conductors, dielectrics, radiation, `r → 0` |
| Circuits | lumped elements | `λ ≫` circuit size | transmission-line effects |
| Optics | Fraunhofer scalar | `L ≫ d²/λ`, paraxial, one λ | near field, wide angles, white light |
| Thermo | ideal gas | dilute, `T` high enough, classical | degeneracy, interactions, phase change |
| Stat mech | Maxwell–Boltzmann | non-interacting, 3D translation | rotation/vibration, quantum, dense |
| Quantum | 1D, time-independent | non-relativistic, `T = 0`, no measurement | 3D, spin–orbit, scattering, decoherence |
| Relativity | 1+1D flat | inertial frames | acceleration, curved spacetime |
| Cosmology | FLRW, `z ≪ 1` | low redshift | `z > 1`: use luminosity distance, not `v = cz` |
| Condensed | 1D Kronig–Penney | `T = 0`, delta barriers, single band | 3D, finite barriers, correlations |
| Nuclear | liquid drop / Bateman | isolated decays, no branching feedback | chains with feedback, dense matter |
| Computation | scaled units `GM = a = 1` | 2D, fixed star | real ephemerides, radiation pressure |
| Data | small-angle pendulum | `θ₀ → 0` | `θ₀ = 20°`: `+0.8 %` period, invisible to `χ²` |

## 4. Numbers every physics note should be able to reproduce

| Quantity | Value | Where |
|---|---|---|
| `γ(0.6)` | `1.25` | SR |
| `γ(0.9)` | `2.29416` | SR |
| `r_s(1 M☉)` | `2.953 km` | GR |
| Solar light deflection | `1.751″` | GR |
| `v_rms` of N₂ at 300 K | `516.839 m/s` | thermo |
| H₂ 1s `⟨r⟩` | `79.377 pm` | quantum |
| `P(r < a₀)` for 1s | `0.323324` | quantum |
| `T` for 1 eV / 1 nm / 0.5 eV | `2.850e-3` | tunnelling |
| `κa` for the same | `3.6226` | tunnelling |
| Si `n_i` at 300 K | `~6.7e15 m⁻³` (effective-mass approx.) | condensed |
| Cu `E_F` | `7.04 eV` | condensed |
| `B(²³⁸U)` | `1789.9 MeV` | nuclear |

If a note cites one of these and the lab cannot reproduce it, one of the two is wrong.

## 5. Order-of-magnitude discipline

Before computing, estimate. Then compare. A factor-10 error is a modelling error, not a rounding error.

Examples:

- 1 eV photon → `λ = hc/E = 1240 nm`. ✓ (IR)
- 1 nm well → `E₁ = 0.376 eV`. ✓ (semiconductor scale)
- 300 K → `kT = 25.9 meV`. ✓
- 1 T, electron → `ħω_c = 0.116 meV`. ✓

## 6. Verification recipes

**Analytic vs numeric.** Compute the same quantity two ways: closed form + transfer matrix, or closed
form + RK4. Assert the difference.

**Limit test.** Send a parameter to a limit where the answer is known (`P → 0`, `E ≫ V₀`, `β → 0`,
`T → 0`, `a → ∞`). Assert the limit, not just the interior.

**Conservation test.** Energy, momentum, probability, charge. Measure the drift, not "looks stable".

**Sum rule.** `∫f dv = 1`, `Σ|c_n|² = 1`, `T + R = 1`, `ΣP_i = 1`. A sum rule failing by `1e-3` is a
bug, not noise.

**Reverse check.** Given the output, recover the input (`g` from the fit, `E` from `k`, `V₀` from `T`).
The forward direction can hide a sign error.

## 7. Sign and convention checklist

- Coordinate axes and origin, drawn on the figure.
- Sign of work: `W = ∫F·dx` (physics) vs `W = -∫P dV` (chemistry/thermo). Pick one and say it.
- Potential zero: at infinity for localized charge; at the plate for a capacitor.
- Fourier/phasor sign: `e^{-iωt}` vs `e^{+iωt}`; state it once.
- Metric signature: `(+,-,-,-)` vs `(-,+,+,+)`; state it once.
- Gauge: Coulomb vs Lorenz; if it does not matter, say so.
- Statistical: `β = 1/(k_B T)`, `Z = Σ e^{-βE}`; do not mix `kT` and `k_B T` notation.

## 8. What "verified" means

A number is verified when:

1. `check.py` computes it from the model, independently of the HTML;
2. the page's `?selftest=1` produces the same value;
3. at least one limit or invariant constrains it.

Otherwise it is **computed once**, which is weaker. Mark it as such.
