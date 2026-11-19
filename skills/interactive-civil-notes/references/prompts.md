# Prompts — civil engineering

## Scope prompt

> Note topic: [RC beam / truss / retaining wall / pipe / vertical curve / …].
> Course and level: [ … ]. Source: [lecture / code / lab sheet]. Outcomes:
> [3–5]. Design basis: [code + edition, limit state, combination, material
> class, unit system]. Verification: [check_civil.py / hand calc / independent
> tool]. What is the one limit state the learner must be able to defend?

## Number-family prompt

> List every number in the note. For each: symbol, value, unit, family
> (characteristic/design/allowable), factor, source, clause. If a number has no
> family, stop. Do not write a design equation until this table is complete.

## Ledger prompt

> Write one row per limit state: demand, capacity, ratio, governing, clause,
> collapse mode. Highlight the governing row. If more than one row exceeds
> 1.0, report every failure and say which one controls the redesign.

## Lab spec prompt

> Design a lab with one demand/capacity variable and one governing limit.
> State: prediction prompt; state variables (range, step, default, unit);
> governing equations and numerical method; what is drawn; what is read out;
> three invariants with numbers; the collapse mode; the print fallback; the
> accessibility text. If the lab needs more than three controls, split it.

## Verification prompt

> Run `check_civil.py` for every numeric claim. Run the page with
> `?selftest=1`. Check `C=T`, `ΣF=0`, `ΣM=0`, `s≤s_max`, `ε_s≥ε_yd`,
> `V_d≤V_r≤V_max`. Open at 390 px and in print preview. If the drawing and the
> checker disagree, fix the drawing. Report one honest caveat.

## Critique prompt

> Read the ledger without the prose. Which row governs? Is the mode ductile or
> brittle? Which factor or combination is doing the work? What is the smallest
> change that would make the design fail? What is missing: torsion, second
> order, settlement, fire, anchorage, drift?

## Anti-hallucination prompt

> Do not invent a standard value, material grade, soil parameter, traffic
> count, or table entry. If a value is unreadable, write “kaynakta
> okunamıyor”. If an edition is unknown, write “baskı doğrulanmalı”. Do not
> claim an analysis you did not run. Label every teaching simplification at
> the point of use.
