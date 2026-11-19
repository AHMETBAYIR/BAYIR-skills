# Reusable prompts

These are briefs for an agent using this skill. Copy the block, fill the brackets, and remove what does not apply.

## 1. Master brief (topic → note)

```text
Build an interactive HTML study note with the `interactive-mse-notes` skill.

Topic: [crystal structures / binary eutectic / diffusion / stress–strain / XRD / ...]
Course and level: [MSE 201, second-year undergraduate]
System / material: [Pb–Sn / FCC Cu / C in γ-Fe / ...]
Source: [lecture PDF path / textbook chapter / dataset / "from topic"]
Language: [English / Turkish]
Constraints: [phone, print, offline, 2 labs max]

Requirements:
- 6–9 sections, 2–3 labs, one worked example with a mass/unit balance,
  3+ common mistakes, 6–10 retrieval questions, 3–5 exercises.
- Every number checked with scripts/check_mse.py or a cited source.
- Label every model (linearised, hard-sphere, schematic).
- Build with scripts/build_note.py, validate, open in terminal-browser, and step through.
- Report the absolute path and one honest caveat.
```

## 2. From a lecture PDF

```text
Read [path]. Extract the definitions, the figures, the worked examples, and the
claims the lecturer emphasises. Do not infer a value that is not readable.

1. Summarise the lecture in 8 bullets with page references.
2. List the 3–5 outcomes the lecture is trying to achieve.
3. Identify one concept that needs a lab because it is spatial or parametric.
4. Draft a note with that one lab and one worked example from the lecture.
5. Flag any figure you cannot reproduce or licence.
```

## 3. From a lab manual

```text
Turn [lab manual path] into a lab note, not a copy of the manual.

Include:
- the specimen and the method, with instrument settings;
- the raw data table (or a small representative subset) and the measured values;
- the analysis equation, the fit, and the residual;
- the uncertainty and the assumptions;
- one interactive that lets the learner reproduce the calculation;
- a "what would change the conclusion" section;
- a scale bar and a provenance line for every image.
```

## 4. From a paper or dataset

```text
Source: [paper / dataset / CIF / CSV].
First, extract: composition, structure/property, method, conditions, uncertainty,
and the licence. Then:

1. State the claim in one sentence.
2. State the evidence and the method that produced it.
3. Build a note that explains the claim to a student who has not read the paper.
4. Include one figure redrawn from the data (not a screenshot) and one table.
5. Add a "limits of the evidence" box: sample size, temperature, model, conflicts.
6. Cite the paper and the dataset version in the note.
```

## 5. Critique prompt (run after drafting)

```text
Act as a materials science examiner reviewing this note. Do not rewrite it.
Return a table with: location, problem, severity (blocker/major/minor), fix.

Check specifically:
- Is any number invented or unsupported?
- Does the lever rule / density / Bragg / diffusion calculation balance?
- Is the composition basis stated everywhere?
- Is a model presented as data?
- Is any lab decorative rather than diagnostic?
- Is the print fallback sufficient without JavaScript?
- Is any figure unlicensed or missing a scale bar?
```

## 6. Verification prompt

```text
List every numeric claim in this note. For each, give:
value, unit, formula, inputs, independent check (script/source), and result.
Flag any claim that cannot be checked. Do not add new claims.
```

## 7. Quiz generation prompt

```text
Write 8 retrieval questions for [topic] at [level].
Rules:
- one correct answer, 3 plausible distractors drawn from real misconceptions;
- no "all of the above";
- the explanation names the cause and the likely error;
- at least 4 questions require a calculation or a diagram reading;
- do not put the answer in the question;
- return JSON: prompt, options, answer (0-based), explain.
```

## 8. Diagram prompt

```text
Design a static SVG figure for [concept].
Constraints: monochrome-friendly, labels on the figure, units on the axes,
no decorative shading, printable at 80 mm width, text ≥ 8 pt at print size.
Return the SVG and a one-sentence caption that states the relationship,
not a repetition of the labels.
```

## 9. "Convert my notes" prompt

```text
Here are my existing notes: [paste or path].
Preserve my sequence and examples. Do not add topics I did not cover.
Convert to the interactive-mse-notes format:
- keep the prose that carries the argument;
- turn the one spatial/parametric idea into a lab;
- add a prediction, a status line, and a print fallback;
- add a retrieval quiz only from the material present;
- list anything you removed and why.
```

## 10. Agent handoff

```text
Handoff for the next agent:
- note path: [absolute path]
- content fragment: [path]
- meta: [path]
- extra lab files: [paths]
- build command: [command]
- verification: [checker commands and expected output]
- known caveats: [list]
- next task: [one sentence]
```

## 11. Anti-hallucination contract

Append this to any materials-science generation prompt:

```text
Do not invent a lattice parameter, a phase boundary, a space group, a PDF card,
a licence, or a citation. If a value is not in the source or in a tool output,
write "[unverified]" and explain what is missing. A smaller note with verified
numbers is better than a complete-looking note with one fabricated value.
```

## 12. Style pass

```text
Edit for clarity without changing the science.
- One idea per paragraph.
- Define a symbol before use.
- Replace "obviously" and "simply" with the actual step.
- Put the unit next to the number.
- Cut any sentence that only announces what the next section will do.
- Keep the author's language; do not translate technical terms unnecessarily.
```
