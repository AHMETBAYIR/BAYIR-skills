# Quality gates

Run this list before delivering a note. A “pass” means you actually did it, not that it looks plausible.

## A. Content

- [ ] The lede names the level, the material system, and the payoff.
- [ ] 3–5 outcomes are observable (“compute”, “identify”, “explain”), not vague (“understand”).
- [ ] At least one formal definition and one worked example.
- [ ] The worked example has a mass/unit balance, not only a final number.
- [ ] Every symbol is defined before its first use.
- [ ] At least one table of key values with units and provenance.
- [ ] 3+ common mistakes, each with a counterexample.
- [ ] 6–10 retrieval questions with cause-specific explanations.
- [ ] 3–5 exercises with hidden solutions; at least one open exercise.
- [ ] A one-screen summary that can be read in 60 seconds.
- [ ] Sources for every external claim, figure, and dataset.

## B. Materials science accuracy

- [ ] Composition basis (wt%/at%/mol%) is stated everywhere.
- [ ] Temperature is in K inside exponentials; °C only on axes/readouts.
- [ ] Lever rule: fractions sum to 1 and reproduce `x_0`.
- [ ] Crystal: `n`, `Z`, APF, and density are consistent with the basis.
- [ ] Stress: engineering vs true is explicit; toughness is an area.
- [ ] Diffusion: `Q` in J/mol, `T` in K, `√(Dt)` scaling correct.
- [ ] XRD: every labelled peak satisfies Bragg and the selection rule.
- [ ] The model is labelled as a model (linearised, hard-sphere, schematic).
- [ ] Numbers in prose match the lab/checker output.
- [ ] Significant figures match the inputs.

## C. Interaction

- [ ] Every lab has a prediction prompt before the controls.
- [ ] The learner can act with mouse, touch, and keyboard.
- [ ] Every control changes something visible within one frame.
- [ ] The status line explains *why*, not only *what*.
- [ ] Reset restores the initial state exactly.
- [ ] Switching a preset updates the axes and the controls coherently.
- [ ] No lab silently rescales axes when comparing two systems.
- [ ] At least one wrong quiz answer shows an explanation.
- [ ] Refresh restores quiz state; Reset clears it.
- [ ] No console errors on load or after 10 interactions.

## D. Accessibility

- [ ] Every canvas has `role="img"` and a changing `aria-label`.
- [ ] Colour is not the only encoding; labels/patterns accompany α/β/liquid.
- [ ] Focus is visible on every control.
- [ ] Tab order follows the reading order.
- [ ] Text contrast passes in light and dark themes.
- [ ] `prefers-reduced-motion` suppresses transitions and autoplay.
- [ ] The page is readable with JavaScript disabled (prose + print fallback).
- [ ] Tables have headers; figures have captions.

## E. Print

- [ ] Controls and buttons are hidden.
- [ ] The current lab state is visible.
- [ ] A static sentence states the key number.
- [ ] No lab is split across a page break.
- [ ] Colours remain distinguishable in grayscale.
- [ ] Links show their URL or a short citation.
- [ ] The page count is reasonable (a note, not a book).

## F. Mobile

- [ ] No horizontal overflow at 390 px.
- [ ] Controls wrap; labels do not overlap.
- [ ] Canvas text is legible; ticks are not crowded.
- [ ] Tables scroll or collapse.
- [ ] Touch drag works and does not scroll the page accidentally.
- [ ] The readout is below the canvas, not beside it.

## G. Performance and portability

- [ ] The file opens from `file://` with no build step.
- [ ] No network request is required for the argument.
- [ ] Total size is reasonable (< 2 MB without images; < 5 MB with).
- [ ] No unused library or duplicated asset.
- [ ] Fonts and KaTeX degrade gracefully.
- [ ] The HTML validates structurally (`validate_note.py`).

## H. Ethics and licensing

- [ ] Figures and data are original, licensed, or cited with permission.
- [ ] No commercial database content is redistributed against its terms.
- [ ] Micrographs have scale bars and provenance.
- [ ] AI-generated text is checked against sources; no fabricated citation.
- [ ] No analytics, tracking, or account requirement by default.
- [ ] The note does not present a model as an experimental result.

## I. Delivery

- [ ] Absolute path is reported.
- [ ] The note is opened in a browser and stepped through.
- [ ] One honest caveat is stated.
- [ ] Print/export instructions are included.
- [ ] Verification scripts and source fragments are next to the note.

## Severity

| Level | Example | Action |
|---|---|---|
| **Blocker** | wrong lever rule, wrong unit, broken lab | fix before delivery |
| **Major** | missing prediction, unlabelled axis, no print fallback | fix unless the user waives it |
| **Minor** | cramped tick labels, inconsistent capitalisation | fix if time |
| **Note** | “the 3D view is a perspective sketch” | state in the delivery message |
