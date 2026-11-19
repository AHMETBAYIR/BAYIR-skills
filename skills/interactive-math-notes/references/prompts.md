# Prompts and agent handoffs

These are working prompts, not magic words. They assume the agent can read files, run Python, open a browser, and edit the result.

## 1. Note brief

```text
Topic:
Course / level:
Audience:
Source (PDF/chapter/problem set):
Outcomes (3–5 observable):
Constraints (phone / print / offline / LMS / language):
Labs (1–3):
  - Mechanism:
  - Boundary:
  - Transfer (optional):
Interaction pattern per lab:
Retrieval questions (6–10):
Exercises (3–5):
What this note will NOT cover:
Verification (SymPy / MatLivre / SciPy / hand):
```

## 2. Source coverage map

```text
Read the supplied source fully. Produce a coverage map before writing:

| Source section | Key definition/theorem | Note section | Lab or figure | Exercise |
|---|---|---|---|---|

Rules:
- Do not invent a value or a claim that is not in the source.
- If a formula is unreadable, write "not readable in the source" and move on.
- Mark any external fact that is not in the source.
- List the 3–5 outcomes the source actually supports.
```

## 3. Lab design brief

```text
Design one lab for [topic].

The lab must:
1. isolate one claim: [claim];
2. ask for a prediction before the controls;
3. let the learner change [parameter] and see [state];
4. show a readout with [quantities];
5. explain the cause in the status line;
6. provide a keyboard alternative to dragging;
7. degrade to a static print sentence.

Do not add a second concept. Do not autoplay. Do not use color as the only cue.
Return: the lab markup, the config JSON, the JS state schema, and three test cases.
```

## 4. Mathematical critique

```text
Review this note as a mathematics instructor.

For every definition, theorem, derivation, and numerical claim:
- state whether it is correct;
- name the hypothesis that is missing or implicit;
- check one limiting case;
- check the sign/units;
- identify any place where exact, numerical, and asymptotic are confused.

Then review the pedagogy:
- Is there a prediction before each lab?
- Does the status explain the cause?
- Is there a worked example and a transfer exercise?
- Does the print version still teach?
Return a prioritized list of fixes, with exact line references.
```

## 5. Numerical verification

```text
Independently verify the numbers in this note.

For each number:
1. identify the method, parameters, interval, and norm;
2. reproduce it with SymPy, NumPy/SciPy, or MatLivre;
3. report the value and the difference;
4. if the difference is larger than expected, decide whether the note or the check is wrong.

Do not accept "the lab shows it" as verification. The lab and the check must be independent.
```

## 6. MATLAB-compatible check

```text
Write a small MATLAB script that reproduces [calculation] with the same method and parameters as the note.
Run it with whichever oracle is installed:
    octave --no-gui check.m                                                                        # free
    matlab -batch "run('check.m')"                                                                 # licensed
    python3 <skill>/scripts/matlivre_mcp.py --code-file check.m --out-dir ./matlivre --name check   # optional
Compare the text output with the note's readout.
If a figure is needed, save an SVG with saveas(gcf, '/absolute/path/fig.svg') and cite it as a static print figure.
Do not use matlivre-cli for figures; it has no renderer.
```

## 7. Jupyter companion

```text
Create a notebook companion for this note.

It must:
- run from a clean kernel with Restart & Run All;
- use the same method and parameters as the note;
- print the numbers the note quotes;
- produce one figure with labeled axes;
- include one independent reference (solve_ivp, brentq, polyfit, etc.);
- state the method, parameters, tolerance, and error definition.

Do not duplicate the whole note. The notebook is the computational half.
```

## 8. Accessibility audit

```text
Audit the built page for accessibility.

Check:
- keyboard tab order through every control;
- visible focus;
- canvas role/aria-label and adjacent text alternative;
- status live region;
- color + shape/label, not color alone;
- reduced motion;
- 200% zoom;
- 390 px width;
- grayscale print.

Return concrete failures with selectors and a fix for each.
```

## 9. Quiz generation

```text
Write 6 retrieval questions for [topic].

For each:
1. write the explanation first;
2. write the correct answer;
3. write three distractors, each representing a named misconception;
4. keep the prompt short enough for a phone;
5. avoid "all of the above" and joke options.

Return JSON in the kit's quiz format.
```

## 10. Design critique

```text
Review this note as a document designer.

The design system is fixed: warm paper, editorial serif, one course accent, numbered sections, margin TOC, print-first callouts.
Do not propose a new theme.

Check:
- Is the accent used for one purpose?
- Are boxes used for structure or decoration?
- Does the lab sit on the paper rather than in a dashboard card?
- Is the type scale consistent?
- Does the print preview keep the argument?
- Is there any element that exists only because it looked impressive?

Return a short list of changes that improve reading, not a redesign.
```

## 11. Agent handoff

```text
You are continuing work on an interactive mathematics note.

Read first:
- SKILL.md
- references/math-accuracy.md
- references/quality-gates.md
- the existing note.content.html and note.meta.json

Current state:
- [what is done]
- [what is broken]
- [what is unverified]

Next task:
- [one concrete change]

Constraints:
- Do not change the design system.
- Do not invent numbers.
- Run the validator and step the affected lab in the browser.
- Report the exact command and the observed result.
```

## 12. Prompt anti-patterns

| Anti-pattern | Why it fails | Better |
|---|---|---|
| “Make it engaging” | invites decoration | “Make the learner predict the sign before the reveal” |
| “Add interactivity” | no teaching move | “Add a parameter sweep for h with a readout of the error” |
| “Make it beautiful” | design drift | “Use the existing accent and one status line” |
| “Check the math” | too vague | “Check the derivative, the initial condition, and the limit h→0” |
| “Write a proof” | may hallucinate | “Derive it and mark each hypothesis; do not cite a proof you cannot check” |
| “Use 3D” | novelty bias | “Use 3D only if the third dimension carries the claim; otherwise use a contour map” |
