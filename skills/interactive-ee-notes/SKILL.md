---
name: interactive-ee-notes
description: >-
  Builds interactive, printable HTML study notes for electrical, electronics and
  communications engineering: circuit analysis, phasors and AC power, transients,
  analog and digital electronics, op-amps, filters, signals and systems, sampling,
  modulation, RF and link budgets, antennas, machines and power systems. Use when
  the user asks for elektrik notu, elektronik notu, haberleşme notu, devre analizi,
  sinyal işleme, modülasyon, filtre, güç sistemleri, elektrik makineleri, sayısal
  elektronik, RF/mikrodalga, konu anlatımı, formül kağıdı, sınav çalışma notu,
  lab raporu, devre şeması, Bode/spectrum/constellation lab, or a printable +
  browser-based study guide with verified numbers.
metadata:
  version: "0.2"
---

# Interactive EE Notes

Turn an electrical, electronics or communications topic, lecture, lab sheet, or problem set into **one self-contained HTML note** that teaches through a controlled loop:

> **predict → change one parameter → see the consequence → read why**

The note must still read as a document when JavaScript is blocked, and must print as an A4 workbook. Interactivity is a teaching device, not decoration.

## Output contract

- One file: `~/notes/electronics/courses/<course-slug>/<topic>.html` (or the folder the user names).
- Warm-paper, print-first design inherited from `html-study-notes`; one course accent.
- 1–3 **labs**, chosen for the concept, not one per section.
- At least one formal definition, one derivation, one worked example with a **unit balance**, one **common-mistakes** block, a **retrieval quiz**, and 3–5 exercises with hidden solutions.
- A **print fallback**: prose that stands without the canvas, plus a one-line static statement of the key figure and its current value.
- Every headline number checked by an independent calculation (`scripts/check_ee.py`, NumPy/SciPy/SymPy, ngspice, or a hand derivation written into the note).
- Turkish when the user writes Turkish; otherwise the source language. Keep English technical terms in parentheses on first use.
- A visible **model box** next to every lab: what is ideal, what is measured, where the model breaks.

## Non-negotiable EE

1. **Predict before you manipulate.** Every lab has a gate or a prediction prompt before the controls; the learner commits before the answer is visible.
2. **One idea per lab.** One invariant, one limiting case, one failure mode. Do not animate five concepts at once.
3. **Three representations, one argument.** Symbolic relation + schematic/diagram + a number with a unit. A Bode plot without `f_c` is decoration; `f_c` without the plot is brittle.
4. **State the model.** "Ideal op-amp, negative feedback, linear region", "first-order RC, LTI", "lossless line", "free-space Friis", "schematic, not a wiring diagram". Put it at the point of use.
5. **Units or it did not happen.** SI by default; engineering prefixes when useful. `5 V`, `10 kΩ`, `2 µF`, `−3.01 dB`, `9.59 dB`. Never italic units.
6. **Signs and references.** Mark source polarity, current arrow, node names, and the passive sign convention. A formula with an unexplained sign is a trap.
7. **Limits are part of the equation.** Test at least two: `t→0`, `t→∞`, `R→0`, `C→∞`, `f→0`, `f→∞`, `m→0`, `m→1`, duty `0/100%`, `V_DS→0`.
8. **No fake data.** A smooth "measured" curve needs noise, error bars, residuals, or a label "schematic". Never invent a datasheet value, part number, standard clause, or course code.
9. **Safety boundary.** Notes cover ≤24 V DC low-voltage models unless the source is explicitly a power-systems course. No live-work, switching, arc-flash, HV commissioning, or battery-pack procedures. Label every protection/earthing lab "model, not a procedure".
10. **Print and accessibility are first-class.** Controls disappear; current state, readout, and static sentence remain. Keyboard, 360 px, reduced motion, `aria-live`, `role="img"`.

## The note must answer five questions

1. **What is the system?** Boundary, nodes, source/load, axes, sign convention.
2. **What is conserved or constrained?** KCL/KVL, energy, power, charge, flux, Nyquist, Parseval.
3. **What closes the model?** A constitutive law (`v=iR`, `i=C dv/dt`), a device equation, a boundary condition, a standard table.
4. **What is the representation?** Time, phasor, frequency, constellation, load line, Smith chart; what is schematic and what is measured.
5. **What would falsify it?** A KCL residual, a power imbalance, a gain above the rail, an alias that does not fold, a BER that rises with SNR, a transmission coefficient above 1.

If a section cannot answer question 5, it is description, not engineering.

## Domain router

| Topic | Read | Default lab | Oracle |
|---|---|---|---|
| DC circuits, Thevenin, max power | `references/electrical.md` | `dc` | `check_ee.py dc`; ngspice `.op` |
| RC/RL transient, time constant | `references/electrical.md` | `transient` | `check_ee.py transient`; ngspice `.tran` |
| AC phasors, RLC, Bode, filters | `references/electrical.md` | `bode` | `check_ee.py bode`; ngspice `.ac` |
| Diode, BJT, MOSFET, bias | `references/electronics.md` | `bjt` (diode via static figure) | `check_ee.py bjt`; ngspice `.op` |
| Op-amps, feedback, oscillators | `references/electronics.md` | `bode` / static | ngspice; hand gain/phase |
| Digital logic, DFF, timing | `references/electronics.md` | `logic` | exhaustive truth table; `check_ee.py logic` |
| Sampling, aliasing, PCM | `references/communications.md` | `sampling` | `check_ee.py sampling`; FFT |
| AM/FM, spectrum, receivers | `references/communications.md` | `am` | `check_ee.py am`; FFT |
| QAM, BER, Shannon, coding | `references/communications.md` | `constellation` | `check_ee.py constellation` |
| RF, Friis, link budget | `references/communications.md` | `link` | `check_ee.py link` |
| Machines, three-phase, power systems | `references/electrical.md` | static + `dc`/`bode` | SymPy/NumPy; pandapower offline |
| Mixed (e.g. op-amp filter for a receiver) | both refs | one lab, one claim | two oracles |

When a topic crosses domains, pick **one** teaching claim and one lab. Put the rest in prose or a static figure.

## Workflow

### 1. Scope the note

Collect or infer:

| Field | Example |
|---|---|
| Topic | RC transient; diode bias; AM; sampling; link budget |
| Course / level | ELM 225 Devre Teorisi I; 2nd year; service vs department |
| Source | lecture PDF, lab sheet, textbook chapter, dataset, or "from topic" |
| Outcomes | 3–5 observable things the learner can do afterwards |
| Constraints | phone, print, offline, LMS embed, language |
| Verification | `check_ee.py`, ngspice, SymPy/NumPy, MatLivre, measured data |

If a source is supplied, read it first with `pdftotext -layout`, then `pdftoppm` for figures. Never invent a value or a claim from an unreadable source; write "kaynakta okunamıyor" instead.

### 2. Classify the note

| Type | What it must contain | Default lab |
|---|---|---|
| **Concept** | definition, mechanism, one canonical example | one manipulation |
| **Derivation** | assumptions, algebra, limits, check | parameter sweep |
| **Lab / data** | provenance, uncertainty, fit, residual | fit + residual |
| **Design** | function, constraints, objective, margin | trade-off |
| **Exam prep** | worked examples, traps, timed retrieval | quiz + one figure |

A design note needs a margin and a failure mode. A lab note needs raw data and uncertainty. Do not turn either into a history essay.

### 3. Plan 6–9 sections

1. **Why this matters** — lede + 3–5 outcomes.
2. **The system** — boundary, nodes, source/load, sign convention.
3. **The governing relation** — derivation or reading procedure.
4. **Lab 1: the mechanism** — predict, manipulate, check.
5. **Worked example** — full solution with a unit balance.
6. **Lab 2 or a boundary case** — failure mode, limit, comparison.
7. **Common mistakes** — each with a counterexample.
8. **Retrieval practice** — 6–10 questions with explanations.
9. **Summary + exercises** — one-screen take-away; 3–5 exercises with hidden solutions.

### 4. Verify the numbers before writing

Write the claim ledger and run the oracle first. Do not type a number into prose and "verify" it later.

```bash
SKILL=~/.agents/skills/interactive-ee-notes
python3 "$SKILL/scripts/check_ee.py" selftest
python3 "$SKILL/scripts/check_ee.py" transient --vs 10 --r 1 --c 1 --t 1
```

For analog circuits, cross-check the topology in ngspice 47 or hover. For matrix work, use SymPy/NumPy or MatLivre. If two methods disagree, diagnose model, unit, topology or convergence; never average.

### 5. Choose 1–3 labs

Pick from `references/lab-patterns.md`. A lab is justified only if it isolates an invariant, a frontier, or a failure mode. If a static figure teaches the same thing without interaction, use the figure.

### 6. Draft the content fragment

The fragment is the inside of `<article class="content">`. The builder generates the TOC and wraps the design system.

- `<h2 id="...">` for sections; `<h3>` for lab titles.
- `<aside class="callout callout--definition|theorem|example|warning|tip|note">`.
- `<div class="equation"><div class="equation__body">…</div><div class="equation__tag">…</div></div>`.
- `<details class="predict">` before every lab, or a `data-gate` block.
- `<div class="exercise">` + `<details class="solution">`.
- `<table class="metable">` for numeric tables; wrap in `<div class="metable__scroll">` on phone.
- Use HTML math (`v<sub>C</sub>`, `e<sup>−t/τ</sup>`) when the note must be offline. Use `$...$` only when KaTeX is available and the build is not `--offline`.

### 7. Build

```bash
SKILL=~/.agents/skills/interactive-ee-notes
python3 "$SKILL/scripts/build_note.py" \
  --content note.content.html --meta note.meta.json \
  --out ~/notes/electronics/courses/<course>/<topic>.html --offline
```

`--offline` strips Google Fonts and the KaTeX CDN. The result must have zero network requests. Omit `--offline` only when the user wants CDN math and accepts the dependency.

### 8. Verify before delivering

```bash
python3 "$SKILL/scripts/validate_note.py" <note.html> --strict
# open the page and run ?selftest=1
```

Then open it and actually use it:

```bash
"${BROWSER:-firefox}" "file:///<absolute-path>/<note>.html?selftest=1"
# title match + screenshot on any session:
~/.agents/skills/interactive-bme-notes/scripts/verify_desktop.sh \
  "<absolute-path>/<note>.html" /tmp/ee-note.png
# Android/Termux: $HOME/Apps/glibc/launch/firefox.sh "file:///…?selftest=1"
```

Check:

- Every lab: gate, controls, reset, selftest; no console errors.
- At least one wrong answer in the quiz shows an explanation.
- Phone width ~360 px: no horizontal overflow; controls wrap; canvas labels legible.
- Dark mode: lab colors still have contrast.
- Print preview: controls/gate hidden; current canvas, readout, and static sentence visible; no lab split across pages.
- `prefers-reduced-motion`: transitions suppressed; autoplay is never the only way to see the effect.
- Keyboard: Tab reaches every control; focus visible; SVG/canvas has a text alternative.
- Offline: network blocked; page loads with no requests; no raw `$...$`.
- Numbers: `check_ee.py` and the browser `?selftest=1` agree.

### 9. Deliver

Open the file in Firefox and report:

- absolute path,
- what is inside (sections, labs, exercises),
- the exact verification commands and results,
- one honest caveat (e.g. "the line is lossless; no thermal model"),
- how to print/export.

## Lab markup contract

```html
<div class="eelab" data-ee-lab="transient">
  <div class="eegate" data-gate data-answer="b"
       data-why="τ = RC; R iki katına çıkarsa τ iki katına çıkar.">
    <p class="eegate__q">Tahmin: R iki katına çıkarsa τ ne olur?</p>
    <div class="eegate__opts">
      <button class="eegate__opt" data-opt="a" type="button">Yarıya iner</button>
      <button class="eegate__opt" data-opt="b" type="button">İki katına çıkar</button>
      <button class="eegate__opt" data-opt="c" type="button">Değişmez</button>
    </div>
    <p class="eegate__why" hidden></p>
  </div>
  <div data-controls class="eelab__controls">
    <label class="eefield">R
      <input type="range" data-param="r" data-default="1" min="0.1" max="10" step="0.1">
      <output data-out="r"></output>
    </label>
    <button type="button" data-reset>Sıfırla</button>
  </div>
  <div class="eelab__canvaswrap"><canvas data-canvas data-height="240"></canvas></div>
  <div class="eelab__readout" data-readout></div>
  <p class="eelab__status" data-status aria-live="polite"></p>
  <p class="eelab__print" data-print></p>
</div>
```

Rules:

- `data-ee-lab` must match a file in `assets/labs/`; the builder fails closed on a missing engine.
- Every lab needs `data-controls`, `data-canvas`, `data-readout`, `data-status`, `data-print`, and `data-reset`.
- Prefer a `data-gate` over a passive `<details>`; the gate disables controls until commit.
- `data-status` must explain the **cause**, not just print a number: "R iki katına çıktı, τ iki katına çıktı; çünkü τ=RC."
- The static `data-print` sentence must make sense without the canvas.

## Engines

| Engine | Learner changes | Invariant / check |
|---|---|---|
| `dc` | `Vs`, `R1`, `R2`, `RL` | `Vth/Rth`, max power at `RL=Rth`, η=50% |
| `transient` | `Vs`, `R`, `C`, `t` | `v(τ)=0.6321Vs`, `v(5τ)=0.9933Vs`, `τ=RC` |
| `bode` | `R`, `C`, `LP/HP`, `f/fc` | `−3.01 dB` and `−45°` at `fc`, slope `−20 dB/dec` |
| `bjt` | `Vcc`, `R1`, `R2`, `Rc`, `Re`, `β` | `V_BB`, `I_C=βI_B`, KVL, active/saturation/cutoff |
| `logic` | `td`, `tsu`, `th` | setup/hold margins, metastability window |
| `sampling` | `f0`, `fs` | Nyquist, alias formula, `fs>2f0` |
| `am` | `m`, `fm`, `fc` | sidebands `fc±fm`, `η=m²/(2+m²)`, m=1 → 33.3% |
| `constellation` | `M`, `Eb/N0` | `Es=(M−1)/6` for unit spacing, BER monotonic, Gray neighbors |
| `link` | `Pt`, `Gt`, `Gr`, `f`, `d`, loss, threshold | FSPL, `Pr`, 2× distance → 6.02 dB |
| `three-phase` | `V_LL`, `R`, `X`, Y/Δ, target PF | `P=√3V_LL I_L cosφ`, neutral≈0, `Qc`/`C` |
| `diode` | `Vs`, `R`, `Is`, `n`, `T` | Shockley + load line, `Vd/Id/rd`, temperature shift |
| `fourier` | waveform, duty, `N`, `f0` | `4A/π`, Gibbs≈8.95%, Parseval |
| `mosfet` | `Vgs`, `Vds`, `Vth`, `kn`, `λ` | triode/saturation boundary, `Id`, `gm/gds`, load line |
| `txline` | `Z0`, `ZL`, length/λ | `Γ`, VSWR, `Zin`, quarter-wave match |
| `control` | `ζ`, `ωn`, `K` | `Mp`, `tp`, `ts`, pole map, step response |
| `transformer` | `S`, `V1/V2`, `Req/Xeq`, `P0`, load, PF | `η`, regulation, peak-efficiency load |
| `dft` | `N`, `fs`, `f0`, window | `Δf=fs/N`, leakage, Parseval |
| `power` | `Vin`, `Vout`, `Iout`, `f`, `L`, mode | duty, `ΔIL`, CCM/DCM, inductor/switch waveforms |

All engines are vanilla JS canvas, no network, no dependencies. The pure `compute` block and the drawing block are separate; the Python oracle re-derives the same numbers.

## EE accuracy rules

Read `references/accuracy.md` before writing. The non-negotiables:

- **RMS vs peak vs peak-to-peak.** `12 V_rms → 16.97 V_peak → 33.94 V_pp`.
- **dB vs dBm.** `dB` is a ratio; `dBm` is absolute power relative to 1 mW. Never add two dBm values as if they were powers.
- **Power vs voltage dB.** `10 log10` for power, `20 log10` for voltage at equal impedance.
- **Complex power.** `S=P+jQ=V I*`; `Q` is not "lost power".
- **Three-phase.** `V_LL=√3 V_ph` for a balanced Y; `|S|=√3 V_LL I_L`.
- **Op-amp.** Virtual short only with negative feedback and linear operation; always check rails and slew rate.
- **BJT.** `β` is not constant; saturation begins near `V_CE≈0.2 V`; the small-signal model is invalid there.
- **MOSFET.** Gate current is ~0, but `Q_g`, `C_iss`, and switching loss are not.
- **Logic.** Thresholds depend on family and `Vcc`; 3.3 V CMOS does not safely drive 5 V CMOS.
- **Sampling.** More bits do not fix aliasing; `f_s>2f_max` or an anti-alias filter does.
- **AM.** `η=m²/(2+m²)`; m=1 gives 33.3%, not 50%. Overmodulation (m>1) distorts the envelope.
- **BER.** `E_b/N_0` is not `SNR`; `SNR = E_b/N_0 + 10log10(R_b/B)`.
- **Smith chart.** Admittance is a 180° rotation, `Γ_y=−Γ_z`; do not move a shunt element on the impedance locus.
- **Standards.** Cite the edition; never invent a clause or a TS EN year. If unverified, write "doğrulanamadı".

E-series values, tolerances, rails, cable impedances, and logic thresholds must be cited or labelled as examples. Do not present a teaching value as a component recommendation.

## AI rules

When an agent is generating or editing a note:

- **Do not hallucinate a formula, value, part number, standard, or course code.** Derive it or cite it; otherwise mark "doğrulanamadı" and omit it from the headline.
- **Do not generate a lab you cannot test.** A static trace is better than a broken animation.
- **Do not hide the source of a claim.** Link the lecture, textbook, datasheet, or standard.
- **Do not put the answer in the question.** Quiz distractors should encode real misconceptions.
- **Do not use `innerHTML` with learner input.** Use `textContent` or sanitize.
- **Do not add analytics, network calls, accounts, or telemetry.** The default is a local, offline file.
- **Do not silently change the design system.** Add a component to the kit and document it; do not fork the base template.
- **Do not let a screenshot stand in for verification.** A screenshot proves pixels, not physics.

## Files

| Path | Purpose |
|---|---|
| `assets/ee-labs.css` | Lab shell, controls, gate, quiz, print, dark mode, reduced motion |
| `assets/ee-labs.js` | Canvas/DPR, linear/log axes, primitives, gate, quiz, selftest |
| `assets/labs/*.js` | One pure-compute + draw engine per lab |
| `scripts/build_note.py` | Wraps `html-study-notes`, injects EE CSS/JS/engines, `--offline` |
| `scripts/validate_note.py` | Static contract/print/a11y/size validator |
| `scripts/check_ee.py` | Independent NumPy-free numeric oracle; `SELFTEST OK` |
| `scripts/check_all_notes.sh` | Validate the 12-note core and all 18 engines |
| `references/curriculum-map.md` | Turkish EE courses, concept sequence, terminology |
| `references/electrical.md` | Circuits, AC, machines, power systems, 10 labs |
| `references/electronics.md` | Devices, analog, digital, embedded, 12 labs |
| `references/communications.md` | Signals, modulation, coding, RF, 12 labs |
| `references/lab-patterns.md` | Nine-part lab anatomy and invariants |
| `references/lab-markup.md` | Exact markup, engine API, print/a11y hooks |
| `references/tooling.md` | Stack, licences, offline limits, version checks |
| `references/accuracy.md` | Units, dB, signs, limits, standards, claim ledger |
| `references/pedagogy.md` | Predict–observe–explain, retrieval, misconceptions |
| `references/prompts.md` | Five reusable prompt templates |
| `references/quality-gates.md` | 0–3 rubric, release gate, ten checks |
| `references/desktop-verification.md` | Real-browser check, 360 px, screenshot, print |

## Companions

| Skill | Use it when | Do not use it for |
|---|---|---|
| `html-study-notes` | you need the base template, components, SchemDraw circuits, or a prose-only note | a stateful lab |
| `interactive-physics-notes` | the topic is EM fields/waves or a physics lab, not a circuit | a circuit lab |
| `interactive-cs-notes` | the topic is algorithms/data structures, not EE | an EE note |
| `terminal-browser` | previewing and driving the built page | writing the note |
| `bionic-runtime` | Android/Termux Plasma session: glibc Firefox wrapper, Xwayland capture | native build logic |

## Limits

- This skill does not replace a full SPICE engine, a PCB tool, a VNA, or a safety standard. It builds **teaching models**.
- `ngspice` is an author-side oracle, not a page dependency. A WASM SPICE build is too large for the single-file budget.
- Pandapower/GridCal need a full desktop Python (they do not build on Android/Termux); use them only on the desktop and cite the version.
- Do not put live-grid, HV, protection-setting, or battery-pack procedures into an interactive note.
- The default build is offline. If you use KaTeX CDN, say so and verify the fallback.
