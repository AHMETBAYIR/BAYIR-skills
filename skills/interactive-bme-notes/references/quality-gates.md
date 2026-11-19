# BME quality gates

Run before delivery. A note that fails any **blocking** item is not shipped.

## Structure — blocking

- [ ] `<!doctype html>`, `<title>`, viewport meta, `lang` attribute.
- [ ] One `<h1>`; sections are `<h2 id="...">`; TOC links resolve.
- [ ] 1–3 labs; each has head, prediction, controls, canvas, readout, status, print fallback, JSON config.
- [ ] Quiz has 6–10 questions, each with an explanation.
- [ ] 3–5 exercises with `<details class="solution">`.
- [ ] No duplicate `id` attributes.
- [ ] Print CSS hides controls and keeps the current state.

## Accuracy — blocking

- [ ] Every number is reproduced by `check_bme.py` or a hand calculation.
- [ ] Every equation has defined symbols and units.
- [ ] Unit conversions are explicit (mm → m, mL/s → m³/s, µM → mol/m³).
- [ ] The model's assumptions and failure mode are stated.
- [ ] No patient data, no clinical advice, no invented standard.
- [ ] Percentages sum to 100; fractions sum to 1.
- [ ] Significant figures match the inputs.

## Interaction — blocking

- [ ] Every slider, select, toggle, text input, reset, and preset works.
- [ ] The readout changes on every primary interaction.
- [ ] The status line explains the cause, not just the value.
- [ ] The canvas is non-blank at the default state.
- [ ] A boundary case is reachable and flagged (r → 0, C < 0, Re > 2000).
- [ ] No console errors (`terminal-browser action -- eval`).

## Accessibility — blocking

- [ ] Canvas has `role="img"` and a state-dependent `aria-label`.
- [ ] Status has `role="status"` and `aria-live="polite"`.
- [ ] Tab reaches every control; focus is visible.
- [ ] Colour is not the only carrier of meaning.
- [ ] `prefers-reduced-motion` suppresses transitions.
- [ ] Text contrast meets WCAG AA at 390 px.

## Phone — blocking

- [ ] No horizontal overflow at 390 px.
- [ ] Controls wrap; labels do not overlap.
- [ ] Canvas width ≥ 280 px for a trace; ≥ 240 px for a diagram.
- [ ] Tables scroll, not clip.
- [ ] Tap targets ≥ 40 px.

## Real desktop — blocking

- [ ] `verify_desktop.sh` prints `PASS`, or the failure is recorded as BLOCKED with a reason.
- [ ] KaTeX is typeset (not raw `$...$`).
- [ ] Equation numbers appear once (`.equation__tag` is empty in the source).
- [ ] The desktop two-column lab does not overflow at 1000 px.
- [ ] Turkish glyphs render in headings, body, and captions.
- [ ] The same readout values appear in the desktop canvas.

## Print — blocking

- [ ] Controls, hints, and quiz buttons are hidden.
- [ ] The current state and readout are visible.
- [ ] The key figure is not split across pages.
- [ ] Solutions open automatically.
- [ ] A static sentence gives the key number.

## Content — warning

- [ ] Lede states level, system, and payoff.
- [ ] 3–5 outcomes.
- [ ] Formal definition + worked example.
- [ ] 3+ common mistakes with counterexamples.
- [ ] A table of key values with provenance.
- [ ] Sources for external claims.
- [ ] One-screen summary.

## Performance — warning

- [ ] File size < 1.5 MB (hard), < 900 KB (comfort).
- [ ] No remote script/style/font; citations only.
- [ ] Canvas redraw < 50 ms on a mid-range phone.
- [ ] No layout shift on load.

## Final smoke test

```bash
node --check assets/bme-labs.js
python3 scripts/validate_note.py note.html
terminal-browser open file:///.../note.html
terminal-browser action -- eval "JSON.stringify({labs:document.querySelectorAll('[data-bme-lab]').length,ready:document.querySelectorAll('[data-bme-ready=\"1\"]').length})"
```

Expect `ready === labs`. Then step through every lab by hand once. The checklist is not a substitute for using the page.
