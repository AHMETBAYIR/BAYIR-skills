# Interaction patterns for mechanical engineering

A lab is a **controlled comparison**, not an animation. Each pattern below isolates one variable and one invariant. If the invariant cannot be stated, do not build the lab.

## 1. Move the load (statics)

- **Learner changes:** load position, magnitude, or support type.
- **Drawing:** free-body diagram with reaction arrows; member forces in tension/compression.
- **Invariant:** `ΣF = 0`, `ΣM = 0`; tension/compression colours match the sign.
- **Failure:** reactions drawn as guesses; a zero-force member coloured as loaded.
- **Good prompt:** “Before you move the load to midspan, which reaction grows?”

## 2. Section cursor (V/M diagrams)

- **Learner changes:** cursor position `x`, load position `a`, UDL intensity.
- **Drawing:** beam, load, shear diagram, moment diagram, deflection curve, stress at the cursor.
- **Invariant:** `dV/dx = −q`, `dM/dx = V`; `M` is zero at a pin, max where `V=0`.
- **Failure:** diagram not aligned with the beam; sign convention changes mid-page.

## 3. Drag the stress state (Mohr)

- **Learner changes:** `σx`, `σy`, `τxy`.
- **Drawing:** stress element + Mohr circle, principal axes, max-shear plane.
- **Invariant:** `I1 = σx+σy = σ1+σ2`; `R = √(((σx−σy)/2)²+τxy²)`; the pole construction is consistent.
- **Failure:** rotating the element by the wrong angle (2θ on the circle); calling `τmax` the principal shear if out-of-plane is larger.

## 4. Cycle slider (thermo)

- **Learner changes:** compression ratio, cut-off ratio, boiler pressure, turbine inlet temperature.
- **Drawing:** `p–v` and `T–s` with state points, energy bar (Qin, Qout, Wnet).
- **Invariant:** `Qin − Qout = Wnet` within 0.5%; `η < η_Carnot`.
- **Failure:** state 2 not isentropic; °C fed into `T`; efficiency computed from pressures only.

## 5. Live operating point (fluids)

- **Learner changes:** `D`, `L`, `Q`, `ε`, fittings.
- **Drawing:** Moody chart with the point, system curve and pump curve, head-loss bar.
- **Invariant:** `Re = ρVD/μ`; Colebrook residual `< 1e-8`; `h_f = f(L/D)(V²/2g)`.
- **Failure:** using `f=0.02` for all cases; adding minor losses as metres without `V²/2g`.

## 6. Tolerance band (machine elements)

- **Learner changes:** nominal size, hole zone, shaft zone.
- **Drawing:** zero line, hole band, shaft band, clearance/interference arrow.
- **Invariant:** limits come from the cited table; `cmin = Hmin − Smax`, `cmax = Hmax − Smin`.
- **Failure:** subtracting the zone names; mixing µm and mm; using a table outside its size range.

## 7. Drag the crank (mechanisms)

- **Learner changes:** crank angle, link lengths.
- **Drawing:** linkage, coupler curve trace, transmission angle arc, toggle markers.
- **Invariant:** loop closure `|B−A| = r3`, `|B−O4| = r4`; Grashof classification from `s+l ≤ p+q`.
- **Failure:** drawing a configuration that cannot assemble; calling a non-Grashof linkage a crank-rocker.

## 8. Sweep the frequency (vibrations)

- **Learner changes:** `ω/ωn`, `ζ`, mass/stiffness.
- **Drawing:** amplitude and phase vs `r`, resonance marker, transmissibility.
- **Invariant:** `X/X0 = 1/√((1−r²)²+(2ζr)²)`; peak near `r = √(1−2ζ²)`.
- **Failure:** saying resonance is exactly at `r=1` for damped systems; transmissibility formula used for force instead of base motion.

## 9. Tune the controller (control)

- **Learner changes:** `Kp`, `Ki`, `Kd`, plant `ωn`, `ζ`, saturation.
- **Drawing:** step response, control effort, pole map or Bode.
- **Invariant:** closed-loop poles from the characteristic polynomial; `Mp` matches `exp(−πζ/√(1−ζ²))` only for a canonical second-order system.
- **Failure:** derivative kick ignored; integral windup hidden; “unstable” declared from a clipped plot.

## 10. Refine the mesh (FEM)

- **Learner changes:** element count, element order, load position.
- **Drawing:** deformed mesh, stress bands, convergence curve.
- **Invariant:** reaction equals applied load; tip displacement converges to `PL/EA`; error decreases with `h`.
- **Failure:** a point-load stress singularity presented as a converged peak; a colourful contour with no scale.

## 11. Stack the dimensions (design)

- **Learner changes:** nominal dimensions, tolerances, distribution.
- **Drawing:** dimension chain, worst-case gap, RSS distribution.
- **Invariant:** worst case `Σ|t_i|`; RSS `√Σt_i²`; assembly requirement met or not.
- **Failure:** mixing worst-case and statistical methods; ignoring a datum shift.

## 12. Toggle the unit or datum (all courses)

- **Learner changes:** SI ↔ N–mm–MPa, gauge ↔ absolute, °C ↔ K, rpm ↔ rad/s.
- **Drawing:** the same physical state with the converted values.
- **Invariant:** the physical result is unchanged; only the number and unit change.
- **Failure:** a “unit toggle” that silently changes the formula or the result.

## Anti-patterns

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Autoplay animation with no question | passive watching | add predict + pause + step |
| Five sliders, one plot | no isolable cause | one primary control, others fixed presets |
| Random “real-time” data | unreproducible | deterministic seeded data, stated |
| 3D for a 1D concept | cognitive load | 2D section + one number |
| Colour-only encoding | inaccessible | sign, label, hatch, line style |
| Readout with no unit | unverifiable | unit + significant figures |
| “Reset” that reloads the page | loses the lesson | restore defaults in place |
| Hidden assumptions in a footnote | learner misses them | put the caveat beside the control |
