# Mechanical accuracy checklist

Use this before the lab is drawn. The common failure is not a wrong formula; it is a **unit, sign, or model mismatch** that survives because the picture looks plausible.

## 0. System and model

- [ ] Boundary / control volume / free body is drawn, not implied.
- [ ] Coordinate axes and positive directions are stated once.
- [ ] The model is named: rigid, linear-elastic, steady, incompressible, lumped, 1D, air-standard.
- [ ] The validity limit is next to the result, not in a footnote.
- [ ] The result has a unit and a sensible magnitude (order-of-magnitude check).

## 1. Units and conversions

| Quantity | SI | Common working unit | Trap |
|---|---|---|---|
| Stress | Pa | MPa = N/mm² | 1 MPa = 10⁶ Pa |
| Moment | N·m | N·mm | factor 1000 |
| Second moment | m⁴ | mm⁴ | factor 10¹² |
| Section modulus | m³ | mm³ | factor 10⁹ |
| Pressure | Pa | bar, atm, psi | gauge vs absolute |
| Temperature | K | °C | offset 273.15, not a factor |
| Speed | rad/s | rpm | ×2π/60 |
| Flow | m³/s | L/min | ÷60000 |
| Energy | J | kWh, kcal | 3.6×10⁶ J per kWh |
| Power | W | hp | 745.7 W (mechanical) |

- [ ] Every substitution is in one consistent system (SI, or N–mm–MPa).
- [ ] `E` in GPa is converted to N/mm² (×1000) before use.
- [ ] `I` in mm⁴ and `L` in m are not mixed in `PL³/48EI`.
- [ ] Angles in trigonometric functions are radians unless the function says degrees.

## 2. Statics and dynamics

- [ ] Every reaction has a direction and a magnitude; a roller has one component, a pin two.
- [ ] `ΣF=0` and `ΣM=0` are checked numerically after solving.
- [ ] A two-force member carries force along its axis; a three-force member does not.
- [ ] Internal forces are drawn twice and opposite at a cut.
- [ ] Friction uses `f ≤ μN`; the direction opposes impending motion, not velocity in general.
- [ ] `a_c = v²/r` points to the centre; Coriolis `2ω×v` sign follows the rotating frame.
- [ ] Impact uses restitution `e`; energy is not conserved unless `e=1`.

## 3. Mechanics of materials

- [ ] `σ = N/A` (axial), `τ = Tr/J` (torsion), `σ = Mc/I` (bending), `τ = VQ/(It)` (shear).
- [ ] `c` is the distance from the neutral axis to the extreme fibre, not the full depth.
- [ ] `W = I/c`; `I` and `W` are not interchangeable.
- [ ] Principal angle `θp = ½ atan(2τxy/(σx−σy))`; max shear is 45° from principal.
- [ ] `σvm = √(σ1²−σ1σ2+σ2²)` for plane stress; Tresca = `max(|σ1−σ2|,|σ1|,|σ2|)`.
- [ ] Euler buckling uses the effective length `KL`; `K` depends on end conditions.
- [ ] Thermal stress exists only if expansion is restrained; free expansion gives zero stress.
- [ ] Stress concentration `Kt` multiplies nominal stress; it is not a safety factor.
- [ ] Fatigue needs a mean-stress correction (Goodman/Gerber) and a endurance limit, not just `σmax < Sy`.

## 4. Thermodynamics and heat transfer

- [ ] Absolute pressure and kelvin in `pV=mRT`, `T ds`, radiation, and Carnot.
- [ ] `c_p − c_v = R`; `γ = c_p/c_v`; air-standard uses constant `c_p` unless a table says otherwise.
- [ ] `η = Wnet/Qin`; `COP = Qcool/Win`; do not compare a COP to an efficiency.
- [ ] The cycle closes: `ΣQ − ΣW = 0` for a steady cycle; `Qin − Qout = Wnet`.
- [ ] `η < 1 − TL/TH` for any real cycle between the same reservoirs.
- [ ] Fin `m = √(hP/(kAc))`; `ηf = tanh(mL)/(mL)` for an adiabatic tip; effectiveness `εf = qf/(hAcθb)`.
- [ ] LMTD uses the correct ΔT1 and ΔT2 and a correction factor `F` for non-counterflow.
- [ ] Radiation `q = εσA(Ts⁴−Tsur⁴)` in kelvin; view factor `F12` and reciprocity `A1F12=A2F21`.
- [ ] `Nu = hL/k`; the correct length scale (D for pipe, L for plate) is stated.

## 5. Fluids

- [ ] `Re = ρVD/μ = VD/ν`; laminar `<2300`, transitional, turbulent `>4000` (state the criterion).
- [ ] `f` from Colebrook/Moody, not a universal 0.02; `ε/D` is dimensionless.
- [ ] Darcy–Weisbach `h_f = f(L/D)(V²/2g)`; minor loss `h_m = K(V²/2g)`.
- [ ] Bernoulli only along a streamline, steady, incompressible, no shaft work, no large loss.
- [ ] Pump adds head; turbine removes head; the energy line rises at a pump.
- [ ] `NPSHa = (p_atm − p_v)/(ρg) + z − h_f`; cavitation when `NPSHa < NPSHr`.
- [ ] Affinity laws: `Q∝n`, `H∝n²`, `P∝n³` for the same impeller.

## 6. Machine elements

- [ ] ISO 286 zones from the table; `H7/h6` is a pair, not a subtraction.
- [ ] Clearance `= hole − shaft`; positive is clearance, negative is interference.
- [ ] Bolt preload `Fi`, joint constant `C = kb/(kb+km)`, external load share `C·Fe`.
- [ ] Bearing `L10 = (C/P)^p × 10⁶` rev, `p=3` ball, `10/3` roller; `P` is the equivalent dynamic load.
- [ ] Gear `i = z2/z1 = n1/n2`; `d = mz`; `v = πdn/60`; `Ft = 2T/d`; Lewis `σ = Ft/(b m Y)`.
- [ ] `Y` (Lewis) is not the same as the ISO 6336 geometry factor; say which model.
- [ ] Key `τ = 2T/(d b L)`; shear and bearing must both be checked.
- [ ] Spring `k = Gd⁴/(8D³N)`; `τ = 8FD/(πd³)` with Wahl correction.

## 7. Mechanisms and vibrations

- [ ] DOF `M = 3(n−1) − 2j1 − j2`; redundant constraints reduce the count.
- [ ] Grashof `s+l ≤ p+q`; the shortest link must be the crank for a crank-rocker.
- [ ] Transmission angle is the acute angle between coupler and follower; near 0°/180° is poor.
- [ ] `ωn = √(k/m)`, `ζ = c/(2√(km))`, `r = ω/ωn`.
- [ ] Amplitude `X = F0/k / √((1−r²)²+(2ζr)²)`; phase `tanφ = 2ζr/(1−r²)`.
- [ ] Transmissibility for base motion `Tr = √((1+(2ζr)²)/((1−r²)²+(2ζr)²))`.
- [ ] Isolation begins at `r > √2`.

## 8. Control

- [ ] Plant transfer function and units (rad/s vs Hz) are stated.
- [ ] Closed-loop characteristic polynomial; Routh or pole locations confirm stability.
- [ ] `ess` type: type 0 step, type 1 ramp, type 2 parabola.
- [ ] `Mp = exp(−πζ/√(1−ζ²))` only for a canonical second-order system with no zeros.
- [ ] Saturation, rate limit, and windup are modelled or explicitly excluded.
- [ ] Sampling `Ts` satisfies Nyquist; a digital controller is not a continuous one.

## 9. Manufacturing and metrology

- [ ] `n = 1000 vc/(πD)` with `vc` in m/min and `D` in mm; result rpm.
- [ ] `vf = fz z n`; `MRR = ap ae vf` with consistent units.
- [ ] Taylor `vT^n = C`; `n` depends on tool material; state the source.
- [ ] Tolerance stack worst case `Σ|ti|` vs RSS `√Σti²`; do not mix.
- [ ] Measurement uncertainty: type A (statistical), type B (calibration/resolution), combined, expanded `U=k·uc`.
- [ ] `Ra` and `Rz` are different statistics; do not convert without a stated relation.
- [ ] GD&T: bonus tolerance at MMC adds to the geometric tolerance, not to the size tolerance.

## 10. FEM and numerical methods

- [ ] Units consistent (N–mm–MPa is the usual choice).
- [ ] Element type, order, and DOF stated.
- [ ] Boundary conditions remove rigid-body modes but do not over-constrain.
- [ ] Reaction sum equals applied load.
- [ ] Mesh refinement shows convergence; a singularity is identified, not hidden.
- [ ] Analytical limit compared (bar, beam, patch test).
- [ ] Stress plotted at a known location, not at a singular corner.
- [ ] Solver, version, and tolerance recorded.

## 11. Presentation

- [ ] Significant figures match the inputs (3 is usually enough).
- [ ] A table of values has units in the header.
- [ ] A diagram has axes, scale, and a sign convention.
- [ ] A schematic is labelled “şematik” or “not to scale”.
- [ ] A standard is cited by number and edition.
- [ ] A safety factor is shown with its basis.
