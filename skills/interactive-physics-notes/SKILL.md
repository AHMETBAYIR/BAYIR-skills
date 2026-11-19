---
name: interactive-physics-notes
description: Build interactive HTML study notes for university physics — mechanics, electromagnetism, waves and optics, thermodynamics and statistical mechanics, quantum mechanics, relativity and astrophysics, condensed matter, nuclear/particle physics, computational physics, and lab/data analysis. Use when the user asks for fizik notu, physics notes, ders notu, konu anlatımı, a formula sheet, a simulation or lab (orbit, field map, interference, tunnelling, Minkowski, band structure, fit), or wants the numbers verified before delivery.
metadata:
  version: "0.1"
---

# Interactive Physics Notes

Turn a physics topic, lecture, lab sheet, or problem set into **one self-contained HTML note** that teaches
through a controlled loop:

> **predict → change one parameter → see the physical consequence → read why**

Physics is the discipline of **models and their regimes**. A field map, a phase portrait, an interference
pattern, an E–k band, a Minkowski diagram, a residual plot — each is a compressed argument that is easy to
misread. The note must still read as a document when JavaScript is blocked or the page is printed.

## Output contract

- One file: `~/notes/physics/<course>/<topic>.html` (or the folder the user names).
- Warm-paper, print-first design inherited from `html-study-notes`; one course accent.
- 1–3 **labs**, chosen for the concept, not one per section.
- At least one formal definition, one derivation, one worked example with a **unit balance**, one
  **common-mistakes** block, a **retrieval quiz**, and 3–5 exercises with hidden solutions.
- A **print fallback**: prose that stands without the canvas, plus a one-line static statement of the key
  figure and its current value.
- Every number checked by an independent calculation (`scripts/physics_check.py`, NumPy/SymPy, MatLivre,
  or a hand derivation written into the note).
- A **regime box** next to every model: what it is, where it holds, where it breaks.
- Turkish when the user writes Turkish; otherwise the source language. Keep English terms in parentheses
  on first use.

## Non-negotiable physics

1. **Predict before you manipulate.** Controls stay locked until the learner commits to an answer.
2. **One idea per lab.** One invariant, one limiting case, one failure mode.
3. **Three representations, one argument.** Symbolic relation + drawing + a number with a unit. A band
   diagram without `E_g` is decoration; `E_g` without the diagram is brittle.
4. **State the model.** "Point charge", "ideal gas", "1D", "non-relativistic", "paraxial", "mean-field",
   "Fraunhofer", "schematic". Put it at the point of use, not in a footnote.
5. **Name the regime.** Every formula carries its validity condition and one number showing the error
   outside it (e.g. `sin θ ≈ θ` errs 4.7 % at 30°, 11.1 % at 45°, 20.9 % at 60°).
6. **Limits are part of the equation.** Test at least two: `ω → 0`, `P → 0`, `E ≫ V₀`, `β → 0`, `T → 0`.
7. **No fake data.** A smooth "measured" curve needs noise, error bars, residuals, or a label "schematic".
8. **The learner acts.** Drag, slide, step, choose. Autoplay is secondary and must pause.
9. **Feedback explains the cause.** "Yanlış" is followed by *which term changed* or *which assumption broke*.
10. **Print is a first-class output.** Controls disappear; the current state and a static fallback remain.
11. **Units or it did not happen.** SI by default; eV/nm only when the topic demands it, and then labelled.
12. **Do not invent curriculum metadata.** Course codes, ECTS, prerequisites: cite, or write
    "doğrulanamadı". An empty cell is better than a wrong code.

## The note must answer five questions

1. **What is the system?** Boundary, degrees of freedom, frame, axes, sign convention.
2. **What is conserved or constrained?** Energy, momentum, charge, particle number, parity, gauge.
3. **What closes the model?** A constitutive law, an equation of state, a boundary condition, a potential.
4. **What is the representation?** Which axis is independent, what is schematic, what is measured.
5. **What would falsify it?** A limit that fails, a unit mismatch, a probability that does not sum to 1,
   a transmission above 1, an entropy that decreases in a closed system, a fit with `χ²/dof ≫ 1`.

If a section cannot answer question 5, it is description, not physics.

## Workflow

### 1. Scope

Collect or infer:

| Field | Example |
|---|---|
| Topic | Central force; Gauss; N-slit; Maxwell–Boltzmann; tunnelling; Lorentz boost; Kronig–Penney |
| Course / level | Fizik I (service) vs Kuantum Mekaniği I (department) |
| Source | lecture PDF, lab sheet, textbook chapter, dataset |
| Outcomes | 3–5 observable things the learner can do afterwards |
| Calculus level | algebra only, derivatives, integrals, linear algebra |
| Units | SI, or eV–nm with explicit conversions |
| Constraints | phone, print, offline, LMS embed, language |

If a field is unknown, **ask once**, then proceed with a stated assumption. Do not silently guess course codes.

### 2. Decompose into atomic topics

Produce 12–18 rows. For each: governing relation, canonical problem, misconception, best representation,
and **lab or static**. Tag each row with one of the eight concept types in
`references/concept-types.md`. If a row needs three representations, split it.

### 3. Choose the model and write the regime box

Before any HTML, write:

```
Model:       1B, time-independent, single particle, effective mass
Equations:   ...
Regime:      E < V0, a ~ nm, T = 0
Breaks at:   a >> κ^-1 (T → 0 numerically), finite temperature, many-body
```

### 4. Produce the numbers first

Write `check.py` before the page. It must:

- print a table of values;
- assert at least 3 invariants with explicit tolerances;
- print `SELFTEST OK` at the end;
- use only the standard library + NumPy/SymPy for the teaching model (SciPy 1.18 is installed but keep it
  out of the core path; a closed form is easier to verify and to explain);

Copy the numbers into the HTML **from the script output**. Never type a number into prose and then
"verify" it later.

### 5. Build one lab

Use the anatomy in `references/lab-patterns.md`: prediction gate → controls → readout → status line →
self-test → print/a11y. Start from an existing lab in `~/notes/physics/research/*/lab.html`; reuse the
harness, replace the model.

### 6. Write the document around the lab

Order that works:

1. one-paragraph framing (what question this note answers);
2. the phenomenon, with a static figure if 2D;
3. the model and its regime box;
4. the derivation (every symbol defined);
5. the lab, with the prediction prompt **before** the controls;
6. a worked example with unit balance;
7. common mistakes (3–5, each with the wrong mental model named);
8. retrieval quiz (6 questions, misconception-based distractors);
9. exercises (3, full solutions collapsible);
10. sources and "doğrulanamadı" list.

### 7. Pass the gates

Run:

```bash
python3 check.py
python3 ~/.agents/skills/interactive-physics-notes/scripts/validate_note.py note.html
# extract inline JS and run: node --check
```

Then open in a browser at 360 px and in print preview. A note that fails any gate is not published.

## The eight concept types

Use these as tags, not as chapters. Full table: `references/concept-types.md`.

| Type | Core difficulty | Lab? |
|---|---|---|
| Conservation | depends on system boundary | yes |
| Field | value at a point vs everywhere | yes |
| Superposition | where linearity ends | yes |
| Limit | the limit is part of the formula | yes |
| Symmetry | seeing it shortens the calculation | sometimes |
| Probability | one measurement ≠ the mean | yes |
| Frame | "now" is relative | yes |
| Approximation regime | validity is invisible | yes |

## Tools

Default stack: **raw canvas/SVG + optional KaTeX + Python for verification.** Nothing else goes into the
note. Sizes, licences, and the ban list: `references/tooling.md`.

Hard budget: **< 120 KB**, **0 external requests** (KaTeX CDN optional, must degrade), no framework, no
build step.

## Failure modes to check before delivery

1. Unlabelled idealisation ("frictionless", "point charge", "1D").
2. `V = 0` read as `E = 0` (dipole midpoint).
3. Formula used outside its regime (½mv² at 0.9c; sin θ ≈ θ at 60°).
4. Fake measurement — smooth curve, no noise, no residuals.
5. Expectation value presented as a single measurement.
6. `ψ` treated as a classical field instead of `|ψ|²` as probability density.
7. Animation with no prediction, no invariant, no "why".
8. Reversed limit ("bands close as P → ∞").
9. Unit slip: eV vs J, nm vs m, ħ = 1 vs SI.
10. Invented course code / ECTS / prerequisite.
11. Licence violation: embedding GeoGebra, PhET, Plotly, Desmos and calling it free.
12. Over-simplification that removes the physics being taught.

## References

- `references/curriculum-map.md` — Turkish physics programmes, verified chains, known catalogue traps.
- `references/concept-types.md` — the eight types, misconceptions, representation choice.
- `references/lab-patterns.md` — nine-part lab anatomy, harness contract, status-line grammar.
- `references/physics-accuracy.md` — constants, unit checks, regime ledger, per-topic model limits.
- `references/tooling.md` — ship/ban table with licences and sizes.
- `references/quality-gates.md` — the publish checklist and eval rubric.
- `~/notes/physics/research/` — eleven worked dossiers with labs and `check.py`.

## Minimum viable stack

1. **Author:** this skill + `html-study-notes` + a text editor.
2. **Verify:** Python 3 + NumPy/SymPy; `check.py`; a hand check for one number.
3. **Draw:** inline SVG and canvas; no framework.
4. **Open:** Firefox (fresh profile) at 1200×900 and 360 px; capture with the Wayland helper; print to PDF.
5. **Optional:** Octave for a MATLAB-compatible cross-check, gnuplot for vector figures, MatLivre for a
   matrix or a control plot.

Everything runs offline once the note is built. That is the point.
