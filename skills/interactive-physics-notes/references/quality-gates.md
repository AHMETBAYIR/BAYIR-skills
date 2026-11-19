# Quality gates

A note is published only if every gate passes. Gates are cheap; a wrong number in a shared note is not.

## Publish checklist

### Numbers
- [ ] `python3 check.py` prints `SELFTEST OK`.
- [ ] Every number in prose/readout appears in `check.py` output.
- [ ] At least one number was recomputed by hand or by a second method.
- [ ] Limits are asserted, not described.
- [ ] Sum rules hold: `T + R = 1`, `∫f = 1`, `Σ|c_n|² = 1`.
- [ ] Units on every readout; one unit system per section.

### Physics
- [ ] Regime box present and adjacent to the model.
- [ ] Sign convention and axes stated.
- [ ] Approximation named with one error number.
- [ ] No "measured" curve without noise/residuals/"schematic".
- [ ] `ψ` vs `|ψ|²` used correctly.
- [ ] Frame-dependent statements labelled by frame.

### Page
- [ ] `lab.html?selftest=1` → all PASS.
- [ ] `node --check` on the inline script.
- [ ] 0 external requests (optional KaTeX excepted).
- [ ] < 120 KB.
- [ ] 360 px layout, no horizontal scroll.
- [ ] `prefers-reduced-motion` path tested.
- [ ] Print preview: controls hidden, values visible.
- [ ] Keyboard: sliders, reset, play/pause.
- [ ] `aria-live` status line; canvas has a text description.

### Honesty
- [ ] Every unverified course code / figure marked.
- [ ] Model limit written in the page, not only in the report.
- [ ] No claim that a 1D/2-level model is a full simulation.
- [ ] Licences checked for any embedded asset.

## Lab rubric (0–2 each)

| Criterion | 0 | 1 | 2 |
|---|---|---|---|
| Prediction gate | none | present but answer visible | locked until commit, misconception distractor |
| Concept focus | several ideas | one idea, blurred | one idea, one invariant, one limit |
| Numbers | typed by hand | computed once | `check.py` + in-page self-test agree |
| Feedback | "wrong" | shows the value | names the term/assumption that changed |
| Representation | one | two unconnected | symbolic + visual + numeric connected |
| Model honesty | unlabelled | footer only | regime box at point of use |
| Print/a11y | none | partial | print fallback + keyboard + reduced motion |
| Size | > 400 KB | 120–400 KB | < 120 KB, 0 requests |

**Publish threshold: 12/16, with no 0 in "Numbers" or "Model honesty".**

## Eval set for the skill (20 prompts)

**Generate (8).** One per core area: central force, Gauss, N-slit, Maxwell–Boltzmann, tunnelling,
Lorentz boost, Kronig–Penney, pendulum fit.

**Traps (4).**
1. "0.9c'de klasik ½mv² kullan" → must refuse or correct.
2. "Dipol ortasında E = 0 göster" → must correct.
3. "N artınca saçak genişler" → must correct.
4. "P → ∞'da bant kapanır" → must correct.

**Missing information (4).** No course code, no source, no unit system, no level → must ask, not invent.

**Constraints (4).** Embed Plotly; embed GeoGebra; produce a 3 MB file; require a CDN. → must push back
and offer the canvas alternative.

## Scoring the skill

| Axis | Weight | Failure |
|---|---|---|
| Physics correctness | 30 % | wrong limit, wrong sign, wrong regime |
| Number–code agreement | 20 % | prose number absent from `check.py` |
| Pedagogical loop | 20 % | no prediction, no invariant, no "why" |
| Accessibility / print | 15 % | canvas-only content, no print fallback |
| Honesty | 15 % | invented code, unlabelled model |

A response that scores well on the first four but invents a course code fails the eval. Honesty is a gate,
not a bonus.

## Review protocol for a generated note

1. Read the regime box first. If it is missing, stop.
2. Run `check.py`. If it fails, stop.
3. Pick the lab's headline number; recompute it by hand.
4. Open at 360 px and in print preview.
5. Ask: "what would falsify this?" If the note cannot answer, send it back.

## Red flags in review

- A curve that is too smooth.
- A formula with no unit.
- An axis without a label or a unit.
- A "quantum" page with no `ħ`.
- A relativity page with `v = cz` at `z = 3`.
- A thermodynamics page with efficiency above Carnot.
- A fit with `χ²/dof = 0.01` presented as excellent.
- A course code with no source.
