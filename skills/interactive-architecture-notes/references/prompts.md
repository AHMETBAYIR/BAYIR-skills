# Prompts — architecture

## Scope prompt

> Note topic: [stair / daylight / wall assembly / precedent / …]. Studio year:
> [1–4]. Site/program: [ … ]. Source: [PDF / drawing / standard]. Outcomes:
> [3–5]. Constraints: [phone / A4 / offline / Turkish]. Verification:
> [check_arch.py / hand calc / standard]. What is the one design decision the
> learner must be able to defend afterwards?

## Constraint prompt

> List every number in the note. For each: value, unit, type (code /
> convention / teaching), source, edition, clause. If the edition is unknown,
> stop and say so. Do not write a number into prose until it is in this table.

## Claim prompt

> Write one design claim as a sentence that could be false. Give three pieces
> of evidence: a drawing, a number, and a precedent. Then write the strongest
> counter-argument. Revise the claim if the counter-argument survives.

## Lab spec prompt

> Design a lab with one control and one consequence. State: prediction
> prompt; state variables (range, step, default, unit); governing equation;
> what is drawn; what is read out; three invariants with numbers; the failure
> mode; the print fallback; the accessibility text. If the lab needs more than
> three controls, split it or replace it with a static figure.

## Precedent prompt

> Redraw [building] plan/section at 1:200. Cite the source drawing. Mark what
> is documented vs inferred. What did the architect keep from the type, and
> what did they change? What would the opposite decision look like?

## Critique prompt

> Read the drawing without the text. What is the parti? Where is the section?
> Who is excluded? Which constraint is doing the work? What is the smallest
> change that would falsify the claim? Do not praise; name the evidence.

## Verification prompt

> Run `check_arch.py` for every numeric claim. Run the page with
> `?selftest=1`. Open it at 390 px and in print preview. If the drawing and
> the checker disagree, fix the drawing. Report one honest caveat.

## Anti-hallucination prompt

> Do not invent a dimension, a code clause, a site condition, a material
> property, or a precedent. If a value is unreadable, write “kaynakta
> okunamıyor”. If a standard edition is unknown, write “baskı doğrulanmalı”.
> Label every teaching simplification at the point of use.
