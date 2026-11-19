# Quality gates

A note is released only when it passes the static gate, the numeric gate and
the browser gate. `validate_note.py` cannot prove correctness; `check_ee.py`
cannot prove the page works; the browser cannot prove the physics.

## 1. 0–3 rubric

| Criterion | Weight | A 3 looks like | A 0 looks like |
|---|---:|---|---|
| Content accuracy | 25 | formulas, signs, units, limits correct; oracle agrees | wrong gain, sign, alias or dB |
| Coverage and fit | 10 | 3–5 outcomes met; prerequisites named | survey with no outcome |
| Verification | 15 | ledger complete; numbers reproduced; proof pack | hand-typed numbers |
| Interaction/lab quality | 15 | 1–3 labs, one idea, invariant, limit | slider with no invariant |
| Prediction/feedback | 10 | locked until commit; real misconception; causal | answer visible; "Yanlış" only |
| Print/a11y/performance | 10 | 360 px, print fallback, reduced motion, <180 KB | canvas-only; controls in print |
| Turkish language | 8 | TDK spelling, decimal comma, upright units | machine translation |
| Citations/honesty | 5 | page-anchored sources; caveats | fabricated DOI/course code |
| Build contract | 2 | deterministic rebuild; fails closed | silent missing lab |

Weighted score = `(score/3) × weight`.

## 2. Release gate

- Total ≥85/100.
- Accuracy = 3.
- Verification ≥2.
- Prediction/feedback ≥2.
- Print/a11y ≥2.
- Turkish ≥2.
- Zero unverified headline numbers.
- Zero invented standards, part numbers, course codes or exam claims.
- All commands PASS.
- 360 px and print checked.
- Below gate = **taslak**, not delivered.

## 3. Ten checks that catch broken labs

1. **Syntax/boot:** every inline script passes `node --check`; no console
   errors; every `data-ee-lab` resolves to an engine.
2. **Selftest:** `?selftest=1` shows OK; `window.__EE_SELFTEST__.ok` is true;
   ≥2 checks per engine; a deliberately wrong check fails.
3. **Reference numbers:** three parameter sets match Python/ngspice within
   tolerance.
4. **Mutation/scaling:** `R×2 → τ×2`; `C×2 → fc/2`; reversed diode blocks;
   open wire changes output; a wrong unit fails.
5. **Canvas geometry:** non-blank at 360 and 1200 px; backing store = CSS×DPR;
   no overflow; plot box inside canvas.
6. **Contract:** canvas/controls/readout/status/reset/print; every param
   changes an output; every quiz answer explains.
7. **Keyboard/a11y:** Tab reaches all controls; focus visible; arrows change
   ranges; status announced; canvas has a current-value label.
8. **Print:** controls/gate hidden; current values/static sentence visible; no
   split lab/figure/table; solutions open; grayscale legible.
9. **Offline/no-JS:** network blocked; `file://` loads with no errors and no
   raw `$...$`; prose/static figure/key value survive JS off.
10. **Units/limits:** every readout has a unit; `t→0/∞`, `f→0/∞`, duty 0/100%,
    `m=0/1`; KCL/KVL or power residual within tolerance.

## 4. Content checklist

- [ ] Lede states the level and the payoff.
- [ ] 3–5 outcomes in a `.keypoints` box.
- [ ] Formal definition + one worked example with unit balance.
- [ ] At least one figure, table or lab that makes structure visible.
- [ ] A model box and a limiting case.
- [ ] 3+ common mistakes, each with a counterexample.
- [ ] 6–10 retrieval questions with explanations.
- [ ] 3–5 exercises with hidden solutions.
- [ ] One-screen summary.
- [ ] Sources/further reading; "doğrulanamadı" for gaps.

## 5. Review protocol

1. Author runs `check_ee.py`, builds, validates.
2. Verifier recomputes three headline numbers by a second method, audits five
   random claims and every unverified row, runs the static/browser gates.
3. Editor does language, TOC, print, a11y only.
4. Numeric defects go back to the author. Do not let an editor "fix" a number.
5. Publish with the proof pack and a one-line caveat.

## 6. Evaluation set

Keep 12 prompts as a regression set:

- 5 generation: lecture, topic-only, exam, lab, fix-note.
- 3 traps: ideal op-amp rail-to-rail, 8 kHz sampling of 5 kHz, 100% efficient
  link.
- 2 missing-info: no course code, no source.
- 2 constraints: offline, 360 px.

Add 8 should-trigger Turkish/English queries and 4 should-not (ME, CS,
medicine, civil). Track trigger precision/recall and pass rate.
