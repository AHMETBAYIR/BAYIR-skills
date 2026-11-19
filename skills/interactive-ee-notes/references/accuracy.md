# Accuracy and verification

A note can render perfectly and still be wrong. This file is the checklist for
the **claim**, not the page.

## 1. Claim ledger

Write the ledger before the prose. Every headline number gets a row:

| Field | Example |
|---|---|
| id | F-012 |
| claim | RC time constant is 1 ms |
| formula/units | `τ=RC`; τ s, R Ω, C F |
| assumptions | LTI, ideal R/C, no source resistance |
| source | Dorf & Svoboda §7.2, p. 312 |
| oracle | `check_ee.py transient --r 1 --c 1` |
| expected/tolerance | `1.000e-3 s`, rel. 1e-9 |
| status | verified / assumption / unverified |

Rules:

- A number without a source or oracle is **unverified**. It may stay only as a
  labelled peripheral caveat; it may not be a headline number.
- If the source is unreadable, write "kaynakta okunamıyor" and move on.
- If a value depends on a standard edition, cite the edition. A TS EN year
  that is not verified is written as "doğrulanamadı".
- A DOI/link that does not resolve is a FAIL, not a "probably fine".

## 2. Oracle hierarchy

| Oracle | Catches | Use for |
|---|---|---|
| SymPy / hand algebra | sign, algebra, units | closed-form derivations |
| Python stdlib / NumPy | arithmetic, FFT, linear algebra | numeric checks |
| ngspice 47 / hover | topology, bias, transient, AC | analog circuits |
| MatLivre | MATLAB semantics | matrix/control checks |
| Browser `?selftest=1` | JS/DOM drift | the actual page |
| ngspice/iverilog | device/HDL model | electronics/HDL |

If two oracles disagree, diagnose **model, unit, topology or convergence**.
Never average two disagreeing results.

## 3. Unit ledger

- SI by default. Engineering prefixes are fine when labelled:
  `1 kΩ`, `2.2 µF`, `10 mH`, `100 nF`, `2.4 GHz`.
- Units upright in math: `5\,\mathrm{V}`, not `5 V` in italic math.
- Decimal comma in Turkish prose ("3,3 V"), decimal point inside math
  (`$3.3\,\mathrm{V}$`).
- Check dimensions before numbers: `RC` has seconds; `V²/R` has watts;
  `1/√(LC)` has rad/s; `V_LL/V_ph=√3` is dimensionless.
- dB is dimensionless; dBm is absolute. Never add dBm + dBm.

## 4. Electrical signs and references

- Mark the source polarity and the assumed current direction.
- Use the passive sign convention consistently: current enters the positive
  terminal of a passive element.
- `v_C` and `i_L` cannot jump (unless an impulse); `i_C` and `v_L` can.
- For a transformer, mark dot convention; for a three-phase source, mark
  phase sequence and Y/Δ.
- For a BJT, mark `V_BE`, `V_CE`, `I_B`, `I_C`, `I_E` directions; for a
  MOSFET, `V_GS`, `V_DS`, `I_D`.
- For a transmission line, define the sending/receiving ends and the current
  direction before using ABCD.

## 5. RMS, peak, average, power

| Quantity | Relation | Example |
|---|---|---|
| Sine RMS | `V_rms=V_pk/√2` | 12 Vrms → 16.97 Vpk |
| Peak-to-peak | `V_pp=2V_pk` | 33.94 Vpp |
| Average (full-wave) | `2V_pk/π` | 10.81 V for 16.97 Vpk |
| Active power | `P=V_rms I_rms cosφ` | W |
| Reactive power | `Q=V_rms I_rms sinφ` | var |
| Apparent power | `S=V_rms I_rms` | VA |
| Three-phase | `|S|=√3 V_LL I_L` | balanced |

A multimeter may show RMS, average, or true RMS; state which. A rectifier
output is not pure DC; give the ripple and the formula/model.

## 6. dB rules

`L_dB=10log10(P2/P1)`. For voltage at equal impedance:
`20log10(V2/V1)`. `P_dBm=10log10(P/1 mW)`.

- `+3 dB` ≈ ×2 power; `+10 dB` = ×10 power.
- `−3 dB` = 0.707 voltage, half power.
- `0 dBm` = 1 mW; `30 dBm` = 1 W; `−90 dBm` = 1 pW.
- Two equal **independent** 20 dBm sources: 23.01 dBm. Coherent voltages:
  26 dBm. Never 40 dBm.
- In a receiver chain, convert to linear gain/noise figure, then back to dB.
  `F=F1+(F2−1)/G1+…`.

## 7. Component and standard values

- E12/E24 values are **examples**, not guarantees. State tolerance.
- A resistor's power rating is at a case temperature; derate.
- A capacitor's nominal value can fall under DC bias (MLCC) and temperature
  (X7R); electrolytics are polarized.
- A datasheet's absolute maximum is not an operating point.
- Logic thresholds depend on family and `Vcc`; do not mix 74HC/74LS/CMOS
  without checking `VIH/VIL`.
- Cable impedance (50/75/120 Ω), connector, and trace geometry matter above a
  few MHz; state the assumption.
- Standards: cite the edition and clause only when verified. A teaching model
  is not conformity assessment.

## 8. Formula checks

For every formula:

1. **Dimensions.** Both sides must have the same unit.
2. **Two limits.** Check `t→0`, `t→∞`, `R→0`, `C→∞`, `f→0`, `f→∞`, `m→0`,
   `m→1`, `D→0`, `D→1`, `SNR→∞`.
3. **Sign.** Does the predicted direction match the physical story?
4. **Consistency.** Does the drawing use the same node names and reference
   directions as the equation?
5. **Approximation.** State the regime and one error number outside it
   (e.g. `sinθ≈θ` errs 4.7% at 30°, 11.1% at 45°).

## 9. "Doğrulanamadı" policy

Use it when:

- a course code/ECTS/prerequisite is not in the current catalogue,
- a standard edition/clause is not available,
- a datasheet value is remembered but not checked,
- a source page is unreadable,
- a simulation result cannot be reproduced.

Write it visibly, not in a footnote. Remove the claim from the headline. A
short honest note is better than a confident wrong one.

## 10. Proof pack

For a serious note, keep:

```
verification/
  ledger.csv
  check.txt          # check_ee.py output
  selftest.txt       # browser ?selftest=1 output
  screenshot-360.png
  print.pdf
  caveats.md
  report.json
```

The final message reports path, verified/assumption/unverified counts, exact
commands, and one caveat. A screenshot proves pixels, not physics.
