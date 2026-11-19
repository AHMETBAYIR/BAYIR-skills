# Prompts and handoffs

## Brief for a new MBG note

```text
Create one self-contained HTML study note for a Turkish university MBG course.

Topic: <topic>. Course level: <Moleküler Biyoloji / Genetik / Rekombinant DNA / Genomik>.
Source: <PDF/lab manual/none>. Language: Turkish, with English terms in parentheses.
Outcome: by the end the student can <3–5 observable actions>.
Constraints: phone-first, printable, offline-capable; 2–3 labs maximum.

Follow ~/.agents/skills/interactive-mbg-notes/SKILL.md.
Use the lab engines in assets/mbg-labs.js; do not invent a new engine unless the
existing ones cannot express the concept.
Verify every number with scripts/check_mbg.py and put the command in a comment.
Build with scripts/build_note.py, validate with scripts/validate_note.py, and open
the result in terminal-browser before reporting.
```

## Critique prompt

```text
Review this MBG note as an examiner and as a student.

1. Find every claim that is not backed by a calculation, a sequence, or a citation.
2. Check the frames, the codon table, and the genotype/fragment sums.
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

Pay special attention to: T = G/(2vN), exon/intron frame, NMD rule,
codon table (64/61/3), HWE genotype frequencies, chi-square df, cM conversion,
plasmid fragment sum, Tm, qPCR efficiency, CRISPR PAM/cut.
Return a table: claim | computed | verdict | fix.
```

## Handoff to a subject expert

```text
Please check only the domain content, not the HTML.

- Is the mechanism correct?
- Is the model's validity range stated correctly?
- Is any number implausible for a real gene/genome?
- Is any clinical or genetic claim too strong?
- Is a database release or a licence wrong?

Return: blocking errors, warnings, and “nice to have”. Do not edit files.
```

## Agent handoff (multi-step build)

```text
You are continuing an MBG note build.

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
- “Add a 3D protein” without a task.
- “Use real patient genomes” without a licence and consent.
- “Make it look like a dashboard” — the design system is paper, not cards.
- “Add a quiz” without misconceptions to target.
- “Design a CRISPR experiment for <pathogen>” — refuse the wet-lab protocol; teach governance instead.
