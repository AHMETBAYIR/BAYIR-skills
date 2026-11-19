# Prompts and handoffs

## Brief for a new BME note

```text
Create one self-contained HTML study note for a Turkish university BME course.

Topic: <topic>. Course level: <Biyomekanik / Biyoenstrümantasyon / ...>.
Source: <PDF/lab manual/none>. Language: Turkish, with English terms in parentheses.
Outcome: by the end the student can <3–5 observable actions>.
Constraints: phone-first, printable, offline-capable; 2–3 labs maximum.

Follow ~/.agents/skills/interactive-bme-notes/SKILL.md.
Use the lab engines in assets/bme-labs.js; do not invent a new engine unless the
existing ones cannot express the concept.
Verify every number with scripts/check_bme.py and put the command in a comment.
Build with scripts/build_note.py, validate with scripts/validate_note.py, and open
the result in terminal-browser before reporting.
```

## Critique prompt

```text
Review this BME note as an examiner and as a student.

1. Find every claim that is not backed by a calculation or a citation.
2. Check the units and conversions in each readout.
3. Check the model's assumptions and failure mode.
4. Check that the prediction comes before the manipulation.
5. Check phone width (390 px), print, dark mode, keyboard, and reduced motion.
6. Name the single weakest lab and say whether to fix or remove it.

Do not rewrite the note; return a prioritized list with file/line references.
```

## Lab redesign prompt

```text
This lab is decorative: the learner can move a slider but cannot form a
checkable prediction.

Concept: <concept>. Current engine: <engine>. What the learner should be able
to do: <action>.

Propose one invariant, one control, one readout, one boundary case, and one
status sentence that explains the cause. Give the equations and the check
command. If a static figure would teach it better, say so.
```

## Accuracy audit prompt

```text
Audit the numerical claims in this note.

For each number:
- quote the sentence,
- name the model and its assumptions,
- recompute it with an independent method,
- flag a mismatch, a missing unit, or an over-precise value.

Pay special attention to: moment arms, joint reaction, τ = η/E, L_crit,
viscous vs convective pressure drop, II = I + III, HU, Km vs Kd.
Return a table: claim | computed | verdict | fix.
```

## Handoff to a subject expert

```text
Please check only the domain content, not the HTML.

- Is the mechanism correct?
- Is the model's validity range stated correctly?
- Is any number implausible for a real tissue/device?
- Is any clinical claim too strong?
- Is a standard edition or a dataset licence wrong?

Return: blocking errors, warnings, and “nice to have”. Do not edit files.
```

## Agent handoff (multi-step build)

```text
You are continuing a BME note build.

State:
- content fragment: <path>
- meta: <path>
- built file: <path>
- labs used: <list>
- checker commands already run: <list>
- known caveats: <list>

Next:
1. Run validate_note.py and fix structural failures.
2. Open in terminal-browser; check ready === labs.
3. Step through each lab at 390 px; screenshot the weakest one.
4. Fix the source, rebuild, re-validate.
5. Report the path, the caveat, and the remaining warnings.
```

## Prompt patterns to avoid

- “Make it interactive” without naming the invariant.
- “Add a 3D model” without a task.
- “Use real patient data” without a licence.
- “Make it look like a dashboard” — the design system is paper, not cards.
- “Add a quiz” without misconceptions to target.
