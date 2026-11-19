# BME accuracy checklist

Every number in a note must survive an independent calculation. This file lists the conventions the shipped labs use and the places where a plausible-looking model is wrong.

## Units

| Quantity | Use | Do not write |
|---|---|---|
| Force | N, kN | kg as force |
| Moment/torque | N·m | N/m |
| Stress, pressure | Pa, kPa, MPa, GPa | psi without conversion |
| Elastic modulus | MPa or GPa | “stiffness” in N |
| Strain | dimensionless, % | “strain in mm” |
| Time constant | s | “τ in MPa” |
| Diffusivity | m²/s | cm²/s without conversion |
| Concentration | mol/m³, µM, mM | “mol” for concentration |
| Consumption | mol m⁻³ s⁻¹ | mol/s without volume |
| Flow | m³/s, mL/s | mL/min without conversion |
| Velocity | m/s, cm/s | “flow” for velocity |
| Heart rate | bpm | Hz (unless stated) |
| CT | HU | “grey level” |
| Enzyme rate | nmol/s, µA | “activity” without unit |

Convert **before** substituting: mm → m, mL/s → m³/s, µM → mol/m³, °C → K for gas laws.

## Joint mechanics

$$L(\theta)=\sqrt{a^2+b^2+2ab\cos\theta},\qquad r(\theta)=\frac{ab\sin\theta}{L(\theta)}$$

- $\theta$ is flexion from full extension; the sign of the cosine term depends on the geometry. State the convention.
- The peak of $r(\theta)$ is geometry-dependent. For $a=30$ cm, $b=3.5$ cm it is ≈97°; for $a=10$ cm, $b=3$ cm it is ≈107°. It is **not** universally 90°.
- $F_m=\tau_{load}/r$, where $\tau_{load}=mgd\sin\theta$. Near full extension $r\to0$ and $F_m\to\infty$; clamp the display and say why.
- Joint reaction: $\mathbf F_J=-(\mathbf F_m+\sum\mathbf F_{ext})$. Report magnitude and direction; it is not equal to the load.
- A 2D quasi-static model ignores co-contraction, tendon slack, and 3D wrapping. Say so.

## Viscoelasticity

$$r=\frac{\sigma_0}{\varepsilon_\infty}\ \text{(KV)},\qquad \tau=\frac{\eta}{E}$$

- Kelvin–Voigt creep: $\varepsilon(t)=\frac{\sigma_0}{E}(1-e^{-t/\tau})$. At $t=\tau$, 63.2% of the final strain.
- Kelvin–Voigt relaxation: $\sigma(t)=\sigma_0$; it does **not** relax.
- Maxwell creep: $\varepsilon(t)=\frac{\sigma_0}{E}+\frac{\sigma_0}{\eta}t$; it flows without bound.
- Maxwell relaxation: $\sigma(t)=\sigma_0e^{-t/\tau}$. At $t=\tau$, 36.8% of the initial stress.
- Hysteresis is the area of the loading–unloading loop, not the area under one curve.
- Linear models do not capture preconditioning, strain stiffening, or poroelasticity.

## Oxygen diffusion

$$D\frac{d^2C}{dx^2}=q,\qquad C(x)=C_0-\frac{q}{D}\left(Lx-\frac{x^2}{2}\right),\qquad L_{crit}=\sqrt{\frac{2DC_0}{q}}$$

- Assumptions: steady state, uniform $q$, constant $D$, no perfusion, zero flux at the centre, plane geometry.
- If $C$ becomes negative, the model has left its valid range. Clamp at zero and say “hypoxic”; do not report a negative concentration as a prediction.
- 100–200 µm is a typical result, not a tissue constant. $q$ 0.005 → 0.05 mol m⁻³ s⁻¹ moves $L_{crit}$ from ~230 to ~73 µm at the same $D$, $C_0$.
- Spherical constructs use a different solution; do not apply the planar formula to a sphere without saying so.

## Stenosis

$$\Delta P=\frac{8\mu L_sQ}{\pi R_s^4}+\frac12\rho\left(V_s^2-V_0^2\right),\qquad V=\frac{Q}{\pi R^2}$$

- The first term is viscous (Poiseuille), the second is convective (Bernoulli). At $r/r_0=0.6$ they are comparable; at 0.3 the convective term dominates.
- A Poiseuille-only model underestimates the drop by 5–15× at severe narrowing.
- Re > 2000 invalidates the laminar assumption; turbulence, separation, and unsteadiness are not modelled.
- Womersley number $\alpha=R\sqrt{\omega\rho/\mu}$; aortic $\alpha\approx19$ means the profile is nearly flat with phase lag, not parabolic.
- Murray's law ($R^3$ branching) is a optimality argument, not a measured law for every vessel.

## ECG and signals

- Limb leads: $II=I+III$; $aVR=-(I+II)/2$, $aVL=I-II/2$, $aVF=II-I/2$.
- With the projection convention $\cos(\text{axis}-\text{lead angle})$, the identity holds exactly. State the convention.
- Heart rate from RR: $HR=60/RR$ (RR in seconds).
- QRS duration is measured from the first deflection to the end of the last deflection, not from the R peak.
- CMRR is frequency-dependent and collapses with source-impedance mismatch: $CMRR_{eff}=A_d/(A_{cm}+A_d\Delta Z_s/Z_{in})$.
- “2× sampling is enough” is false for real anti-alias filters. Show the alias fold: $f_a=|f_0-kf_s|$.
- EEG is dominated by post-synaptic potentials of pyramidal cells, not summed action potentials.

## CT and imaging

- $HU=1000(\mu-\mu_w)/\mu_w$; water is 0 HU by definition at the calibration conditions.
- Window: display range $[L-W/2,\;L+W/2]$. A narrow width stretches a small HU range; it does not add contrast information.
- HU depends on kVp, beam hardening, scatter, and reconstruction kernel. It is not a universal tissue constant.
- CT reconstruction is not “a photo”: the sinogram is a set of line integrals, and filtered backprojection is an inverse problem.
- MRI: T1 recovery $\propto1-e^{-TR/T1}$; T2 decay $\propto e^{-TE/T2}$. T1-weighted, T2-weighted, and PD are different TR/TE choices, not different tissues.
- Ultrasound depth: $z=ct/2$; Doppler shift $f_d=2f_0v\cos\theta/c$. At 60°, the measured velocity is half the true velocity.

## Biosensors and enzyme kinetics

$$v=\frac{V_{max}[S]}{K_m+[S]},\qquad K_m=\frac{k_{-1}+k_2}{k_1}$$

- $K_m$ is not $K_d$ unless $k_2\ll k_{-1}$.
- Competitive: $K_{m,app}=K_m(1+[I]/K_i)$, $V_{max}$ unchanged.
- Non-competitive: $V_{max,app}=V_{max}/(1+[I]/K_i)$, $K_m$ unchanged.
- LOD $=3\sigma/S$; state what $\sigma$ is (blank replicates, not the signal noise).
- Sensitivity is the slope of the calibration curve, not the absolute response.
- Pulse oximetry uses an empirical $R$–$SpO_2$ calibration; Beer–Lambert alone does not give the curve. It is affected by HbCO, perfusion, motion, nail polish, and skin pigmentation.

## Standards and claims

- ISO 10993-1 was revised in 2025; the 2018 edition is withdrawn. Cite the edition used.
- ASTM F136 covers wrought Ti-6Al-4V ELI for surgical implants. Do not generalise it to every titanium alloy.
- “Biocompatible” is not a numeric property; it is a context-dependent assessment.
- Do not claim FDA/CE clearance, clinical efficacy, or a validated model from a teaching simulation.

## Pre-flight checks

- [ ] Every symbol in an equation is defined at first use, with a unit.
- [ ] Every substituted value carries its unit into the calculation.
- [ ] Every readout is reproduced by `check_bme.py` or a hand calculation.
- [ ] Every model states at least one assumption and one failure mode.
- [ ] No patient data, no clinical advice, no invented standard.
- [ ] Significant figures match the inputs.
- [ ] Percentages sum to 100 where they should; fractions sum to 1.
- [ ] Axes are labelled with quantity and unit; log axes are marked.
- [ ] Colour is not the only carrier of meaning.
