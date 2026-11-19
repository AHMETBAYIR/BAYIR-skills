# Lab patterns

An EE lab is not a slider that moves a curve. The teaching claim has nine
parts. If one is missing, the lab is decoration.

## 1. Prediction gate

Controls are locked until the learner commits. The gate must name the
comparison, not the formula:

- "R iki katına çıkarsa τ ne olur?" (answer: doubles)
- "Rezonansta `V_L` kaynaktan büyük olabilir mi?" (yes, `Q` times)
- "3 dB daha fazla güç BER'i kaç kat azaltır?" (orders of magnitude, not 2×)
- "16-QAM aynı `E_b/N_0`'da BPSK'den daha mı iyi?" (no; faster, not more
  power-efficient)

Bad prompts: "Formülü doğrula", "Grafiği incele", "Ne olduğunu gör".

Three options are enough; one must encode the real misconception. The gate
feedback must explain why the chosen option fails, then unlock the controls.

## 2. One idea, one invariant

Each lab carries one concept, one invariant, one limiting case. A panel that
shows five things teaches none. Split into two labs or move the rest to static
figures.

## 3. Numeric invariants

At least two, preferably three, with explicit tolerances. They must be
checkable both in `check_ee.py` and in the browser `?selftest=1`.

| Topic | Invariant | Checked value |
|---|---|---|
| Thevenin | `Vth/Rth`, max power | 7.2 V / 2.4 kΩ / 5.4 mW |
| RC transient | `v(τ)=0.6321Vs` | 6.321 V for 10 V |
| Bode | `−3.01 dB`, `−45°` at `fc` | `fc=1591.55 Hz` |
| BJT | `Ic=βIb`, KVL | 1.371 mA, 7.604 V |
| DFF | setup/hold margins | td=−10 ns stable, td=0 violation |
| Sampling | alias formula | 1.1 kHz at 1 kHz → 100 Hz |
| AM | `η=m²/(2+m²)` | m=1 → 33.33% |
| QAM | `Es=(M−1)/6` unit spacing | 16-QAM → 2.5 |
| Link | FSPL at 2.4 GHz/100 m | 80.05 dB |

## 4. Causal status line

A number alone is not feedback. Name **which term changed** and **why**:

> **Change:** `R` 1 kΩ → 2 kΩ. **Effect:** `τ` 1 ms → 2 ms. **Why:** `τ=RC`;
> doubling R doubles the time constant, while the final voltage is unchanged.

Or:

> **Değişen terim:** `m`. **Etki:** `η` %33.3 → %11.1. **Nedeni:** bilgi
> gücü `m²/2`, taşıyıcı gücü sabit; `m` küçülünce bilgi payı ikinci dereceden
> düşer.

The status line must be `aria-live="polite"` and must not change on every
animation frame.

## 5. Model box at the point of use

Put it next to the lab, not in a footer:

```
Model:  first-order RC, LTI, ideal source, no ESR/ESL
Regime: 0 ≤ t ≤ 5τ, initial v_C(0)=0
Breaks:  dielectric leakage, capacitor tolerance, source resistance, thermal drift
```

For a BJT: "active region, `VBE≈0.65 V`, β fixed at the slider value; the
small-signal model is invalid in saturation." For a link: "free-space Friis,
isotropic path loss, no multipath, no body loss."

## 6. Print and accessibility

- `@media print`: hide controls and gate; keep current canvas, readout and
  `data-print` sentence; avoid breaking a lab across pages.
- `prefers-reduced-motion`: no necessary animation; steady state drawn.
- Keyboard: Tab to every input, arrows change ranges, `R` reset, visible focus.
- Canvas: `role="img"` + an `aria-label` containing the current values.
- Colour never carries meaning alone; label every curve and marker.
- 360 px single column; controls wrap; canvas labels remain legible.

## 7. In-page self-test

`?selftest=1` runs the same invariants in the browser and prints PASS/FAIL plus
`window.__EE_SELFTEST__`. A lab that fails its self-test is not publishable.

## 8. One canvas, one contract

The engine shape:

```js
EE.registerLab("name", function (state, canvasEl) {
  // pure-ish compute: numbers, series, status, readout
  // draw: axes, lines, markers, labels
  return {readout, status, tone, aria, print};
});
```

`initLab()` owns the controls, gate, readout, status and print fallback. The
engine owns the model and the drawing. Never re-implement axes or controls in
an engine.

## 9. Honest bounds

State the size of the model: "one node", "first-order", "balanced Y", "AWGN
only", "free-space", "1D", "schematic". A lab that says "power system" but
solves a 3-bus toy case is fine if the page says so.

## Numerical method rules

| Model | Method | Do not |
|---|---|---|
| RC/RL transient | closed form | numerical ODE with an unreported step |
| RLC/Bode | complex `H(jω)` | plotting only the magnitude and calling it the response |
| Diode/BJT | Newton or piecewise model | a fixed 0.7 V drop when the current varies |
| Load flow | Newton/Gauss–Seidel with mismatch print | a hand-waved "solution" |
| FFT | windowed DFT with Parseval check | reading a peak without a window/leakage note |
| QAM BER | closed-form `Q`/`erfc` | Monte Carlo with too few errors |
| Link | dB ledger | adding dBm values as powers |

## Prompt design checklist

- [ ] Names the parameter and the direction of change.
- [ ] Has exactly one defensible answer.
- [ ] The wrong options are real misconceptions, not random.
- [ ] Feedback explains why the chosen option fails.
- [ ] The default state does not already reveal the answer.
- [ ] The lab's invariant is visible in the readout, not only in code.

## Common failure modes

1. A slider that changes a curve but has no invariant.
2. A "measurement" that is a smooth synthetic curve with no noise/residual.
3. An ideal op-amp shown without rails or saturation.
4. A BJT "gain" shown without a Q-point or region check.
5. A Bode plot with linear frequency or no `−3 dB` marker.
6. A sampling lab that shows aliasing but never states Nyquist.
7. An AM lab that claims 50% efficiency at m=1.
8. A constellation with no decision regions or noise cloud.
9. A link budget that adds dBm values.
10. A print view that hides the only explanation.
