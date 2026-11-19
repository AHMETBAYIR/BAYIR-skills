# Electrical engineering reference

Scope: circuits, AC/three-phase power, transformers, machines, transmission,
load flow, faults, protection, earthing, installations. This is the **power**
side; device-level analog/digital is in `electronics.md`, signals/RF in
`communications.md`.

Full evidence and sources: `~/notes/electronics/research/01-electrical.md`.

## 1. System questions

For every note, state:

- **Boundary:** source, load, network, machine, grid equivalent.
- **Reference:** node names, current arrows, source polarity, phase sequence.
- **Conservation:** KCL/KVL, energy, power balance, flux continuity.
- **Closure:** `v=iR`, `i=C dv/dt`, `v=L di/dt`, machine equivalent circuit,
  line constants, load model.
- **Falsifier:** KCL residual, power imbalance, efficiency >100%, `|Γ|>1`,
  load-flow mismatch, fault current with the wrong sequence contribution.

## 2. Atomic topics

| # | Topic | Relation | Invariant / check | Trap |
|---|---|---|---|---|
| 1 | KCL–KVL | `Σi=0`, `Σv=0` | residual <1e-12 | current is "consumed" |
| 2 | Thevenin–Norton | `Vth=Voc`, `Rth=Voc/Isc` | `|Voc/Isc−Rth|<1e-9` | max power = max efficiency |
| 3 | First-order transient | `τ=RC` or `L/R` | `v_C(0+)=v_C(0−)` | capacitor voltage can jump |
| 4 | Second-order RLC | `s=−ζωn ± ωn√(ζ²−1)` | damping case matches ζ | every RLC oscillates |
| 5 | Phasors | `V=ZI` | RMS magnitude/phase | phasor is physical |
| 6 | AC power | `S=P+jQ=VI*` | `P=VI cosφ` | Q is "lost" |
| 7 | Three-phase | `V_LL=√3V_ph`, `|S|=√3V_LL I_L` | neutral current ≈0 in balance | √3 everywhere |
| 8 | Magnetic circuit | `F=Ni=ΦR` | `Φ=BA`, flux continuity | air gap ignored |
| 9 | Transformer | `V1/V2=N1/N2`, `I1N1=I2N2` | `S1≈S2`, η<100% | changes frequency |
| 10 | DC machine | `E=KΦω`, `T=KΦI` | `Tω=EI` | back-EMF is a loss |
| 11 | Induction machine | `s=(ns−n)/ns` | `Pag:Pm:Pcu=1:(1−s):s` | max torque at s=0 |
| 12 | Synchronous machine | `P=3VE_f sinδ/Xs` | P follows δ, Q follows E_f | excitation controls P |
| 13 | Per-unit | `Z_pu=Z/Z_base` | base change preserves Z | per-unit is physical |
| 14 | Transmission line | `γ=√(zy)`, `Zc=√(z/y)` | `|AD−BC−1|<1e-9` | lumped at 300 km |
| 15 | Load flow | `Ybus V=I` | `ΣS_gen=ΣS_load+ΣS_loss` | slack P is known |
| 16 | Fault / sequence | `I_f=V_ph/Zth` | `Ia=Ia0+Ia1+Ia2` | 3φ always worst |
| 17 | Protection | `t_up−t_down≥CTI` | typical CTI ≥0.3 s | bigger fuse is faster |
| 18 | Earthing | `V_GPR=I_f R_e` | touch voltage ≤ limit | one rod is safe |
| 19 | Cable | `I_b≤I_n≤I_z` | thermal + voltage drop | ampacity is fixed |
| 20 | Power factor | `Qc=P(tanφ1−tanφ2)` | P unchanged | capacitor reduces P |
| 21 | Illumination | `E=Φ/A` | lux ≠ lumen | wattage = brightness |
| 22 | Renewables | `P=½ρAv³Cp` | capacity factor ≠ efficiency | capacity = output |
| 23 | High voltage | breakdown field, BIL | withstand > overvoltage | higher is always better |
| 24 | Power quality | `THD=√(ΣV_h²)/V1` | harmonic/unbalance limits | PF is always cosφ |

## 3. Strongest representations

| Cluster | Learner manipulates | What proves understanding | Key relation |
|---|---|---|---|
| DC resistive | `R_L` | `P_L` peaks at `R_L=Rth` | `P_L=Vth²R_L/(Rth+R_L)²` |
| AC / phasor | `f` | `|H(f0)|=1`, `Q=f0/BW` | `H=1/[1+jQ(ω/ω0−ω0/ω)]` |
| Three-phase | `Z`, Y/Δ, capacitor bank | P constant while Q, I fall | `S=3V_ph I_ph*` |
| Machines | `s`, `δ`, `E_f` | torque–slip peak; P–δ; Q–E_f | `T=3V²R2'/s / (ωs[(R1+R2'/s)²+(X1+X2')²])` |
| Network | line length, load | `AD−BC=1`, no-load rise, SIL | ABCD chain |
| Load flow | bus P/Q, PV setpoint | mismatch →0, losses balance | `Ybus V=I` |
| Fault/protection | fault type, Z0, TMS | sequence currents and CTI | `I_f=V_ph/(Z1+Z2+Z0)` |
| Installations | length, load, R_e | ΔV and GPR | `ΔV=√3I(Rcosφ+Xsinφ)L` |

## 4. Ten lab patterns with checked numbers

Use these as starting points; change values only after re-running the oracle.

1. **Thevenin/max power.** `Vs=12 V, R1=4 kΩ, R2=6 kΩ`. `Vth=7.2 V`,
   `Rth=2.4 kΩ`, `Pmax=5.4 mW` at `RL=2.4 kΩ`, η=50%. Prompt: "RL=Rth yapınca
   güç de verim de maksimum mu?" Answer: power yes, efficiency no.
2. **RLC resonance/Bode.** `R=10 Ω, L=100 mH, C=10 µF, Vs=10 V`. `f0=159.155 Hz`,
   `Q=10`, at resonance `V_L/V_s=Q=10`, phase 0°. Prompt: "Rezonansta bobin ve
   kondansatör gerilimi kaynaktan büyük olabilir mi?"
3. **Balanced three-phase + PF.** `V_LL=400 V`, `Z=10+j6 Ω/phase`, Y. `P=11.765 kW`,
   `Q=7.059 kvar`, neutral current 0; target PF 0.95 needs `Qc=3.867 kvar`
   (`63.5 µF/phase`). Prompt: "Kondansatör aktif gücü azaltır mı?"
4. **Transformer.** 10 kVA, 2400/240 V, `Req=8 Ω`, `Xeq=20 Ω`, `P0=120 W`.
   Full-load η=97.48%; peak efficiency at `√(P0/Pcu)=0.9295` per-unit load;
   regulation 3.21% at 0.8 lag. Prompt: "Verim tam yükte mi en yüksek?"
5. **Induction motor.** 400 V, 50 Hz, 4 poles, `R1=0.5`, `X1=1.2`, `R2'=0.4`,
   `X2'=1.5 Ω`. `ns=1500 rpm`; at `s=0.04`, `T=86.66 N·m`; `s_max=0.1457`,
   `T_max=156.9 N·m`, `T_start=50.3 N·m`. Prompt: "Kayma artınca moment hep
   artar mı?"
6. **Synchronous machine.** 400 V Y, `Xs=1.2 Ω`, `Ef=300 V`, `P=100 kW`.
   `δ=35.26°`, `Q=+8.09 kvar`, PF 0.997, `Pmax=173.2 kW` at 90°. Prompt:
   "Uyartımı artırınca aktif güç artar mı?"
7. **Transmission line.** 400 kV, 50 Hz, 300 km, `z=0.03+j0.4 Ω/km`,
   `y=j3.0e−6 S/km`. `Zc`, `γ`, ABCD; no-load `V_R=422.6 kV` (+5.65%);
   SIL=437.6 MW. Prompt: "300 km hattı tek seri empedansla modelleyebilir miyiz?"
8. **Three-bus load flow.** 100 MVA base; lines `0.02+j0.06`, `0.08+j0.24`,
   `0.06+j0.18 pu`; slack `1.02∠0°`; PV `P=0.5`, `|V|=1.0`; PQ `0.8+j0.4`.
   `V3=0.9323 pu`; loss `0.0342+j0.1027 pu`; slack `P=0.3342 pu`. Prompt:
   "Slack gücü önceden bilinir mi?"
9. **Fault + protection.** 11 kV, 5 MVA, `Z1=Z2=0.08 pu`, `Z0=3Z1`;
   pickups 100/200 A, TMS 0.05/0.2. `I_f,3φ=3.28 kA`; SLG `1.97 kA`;
   `t_down=0.097 s`, `t_up=0.486 s`, CTI=0.389 s (IEC 60255-151 model).
   Prompt: "Üç fazlı arıza her zaman en büyük mü?"
10. **Cable + earthing.** 240 mm² Cu XLPE, `R20=0.0754 Ω/km`, 90 °C, 100 m,
    200 A, PF 0.9. `ΔV=4.20 V` (1.05%); GPR=3.28 kV at 1 Ω; for 50 V touch,
    `R_e≤15.2 mΩ`, impossible with one rod. **Model only; IEC 60364-4-41 and
    national regulation govern.** Prompt: "1 Ω topraklama dokunma gerilimini
    güvenli yapar mı?"

## 5. Standards and editions

| Standard | Subject | Edition to cite |
|---|---|---|
| IEC 60364-1/-4-41/-5-52/-5-54/-6 | LV installations | -1:2005+A1:2009; -4-41:2017; -5-52:2009; -5-54:2011; -6:2016 |
| IEC 60909-0 | Short-circuit currents | 2016 |
| IEC 60076 series | Power transformers | -1:2011; -2:2011; -3:2013; -5:2006 |
| IEC 60071-1/-2 | Insulation coordination | -1:2019; -2:2018 |
| IEC 60287-1-1 | Cable rating | 2023 |
| IEC 60502-1/-2 | Extruded cables | -1:2021; -2:2014 |
| IEC 61936-1 | AC installations >1 kV | 2021 |
| IEC 61000-4-30 | Power-quality measurement | 2015+A1:2021 |

Turkish adoptions normally follow IEC, but the year lags. Cite both only when
verified: "IEC 60909-0:2016; TS EN 60909-0 adoption year not verified." Never
invent a TS EN year or clause. EKAT, the Earthing Regulation and the EPDK
*Elektrik Piyasası Şebeke Yönetmeliği* are national regulations, not IEC.

## 6. Tools and oracles

| Tool | Licence | Termux status | Use |
|---|---|---|---|
| Python 3.14 + NumPy 2.5.4 / SciPy / SymPy | PSF/BSD | installed | primary invariant checks, load-flow prototype |
| ngspice 47 | open source | installed | `.op`, `.tran`, `.ac` circuit checks |
| hover | MIT | installed | small netlist DC/transient checks |
| pandapower 3.5.6 | BSD-3 | pip failed on Python 3.14 | offline load-flow/fault check in proot/desktop |
| MATPOWER | BSD-3 | pure Octave/MATLAB | IEEE-case cross-check |
| Octave 11.3 | GPL-3 | available in tur-packages | MATLAB-compatible check |
| ETAP / PowerWorld / Simulink | commercial | no native Termux | licensed offline validation only |

Minimal stack: one HTML file + `check_ee.py` (stdlib) + ngspice/hover for
circuits. Do not make the page depend on pandapower or a commercial tool.

## 7. Safety boundary

- No live-work, switching, isolation, arc-flash, HV commissioning or
  battery-pack procedures.
- No fake live-grid data. Use a synthetic 3-bus case, a cited IEEE case, or
  label "örnek veri".
- No protection settings or earthing design presented as real. A CTI of
  0.389 s is a model result, not a feeder setting.
- No "IEC approved" claim. A teaching model is not conformity assessment.
- Label every protection/earthing lab "model, not a procedure".

## 8. Common mistakes

| Mistake | Why it hurts | Fix |
|---|---|---|
| `P_L` max = efficiency max | max power at `RL=Rth` is 50% efficient | show both curves |
| `Q` is lost power | Q oscillates; it is not dissipated | phasor/power triangle |
| `V_LL=V_ph` | balanced Y has √3 | label Y/Δ |
| Transformer changes frequency | it does not; it changes voltage/current | state f fixed |
| Induction max torque at s=0 | `T=0` at synchronous speed | torque–slip curve |
| Excitation controls P | `Ef` mainly controls Q | P–δ / Q–Ef |
| 3φ fault always largest | SLG can exceed 3φ depending on Z0 | sequence networks |
| Bigger fuse is faster | inverse-time curve | coordination graph |
| One earth rod is safe | GPR can be kV | calculate touch/step voltage |
| Capacitor reduces P | it reduces Q and current | PF triangle |
