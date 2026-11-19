# Pedagogy for MBG notes

The evidence base is general; the implications below are specific to process-heavy molecular biology and probability-heavy genetics.

## Nine levers

| Lever | What the evidence says | Design implication |
|---|---|---|
| **Predict–observe–explain** | Committing to a prediction before seeing the result improves conceptual change, especially when the prediction is wrong. | Every lab opens with a `<details class="predict">`. The status line reconciles the guess with the result. |
| **Worked examples with fading** | Novices learn more from a full worked example than from an equivalent problem. | A full sequence/probability worked example follows Lab 1; exercises fade from completion to bare. |
| **Retrieval practice** | Testing beats rereading at one week. | Every section ends in closed-book retrieval; answers behind a button. |
| **Spacing and interleaving** | Interleaving helps when categories are confusable. | Mix exon skip vs intron retention, competitive vs non-competitive, HWE vs drift, θ = 0.5 vs linked. |
| **Cognitive load** | Split attention and redundancy consume working memory. | Put the label on the diagram; put the mechanism in the prose. Do not repeat the caption in the body. |
| **Dual coding** | Words + relevant graphics beat words alone. | One idea per canvas. A legend, a reading frame, and a status line are part of the graphic. |
| **Misconception confrontation** | Refutation beats neutral explanation when the misconception is explicit. | A common-mistakes block names the wrong model and gives a counterexample or a count. |
| **Feedback timing** | Immediate, cause-specific feedback helps procedural learning. | Quiz feedback explains why the distractor is wrong. |
| **Self-explanation** | Prompting learners to explain a step improves transfer. | Ask “why does the frame shift?” and “what would make this ratio wrong?”. |

## Note arcs by type

### Process (replication, splicing, PCR)

1. Lede + outcomes.
2. Players, directionality, and the key constraint (5′→3′, antiparallel, primers).
3. Mechanism step by step.
4. Lab: change one parameter, read the time/length/yield.
5. Worked example with a sequence or unit balance.
6. Failure mode / artefact.
7. Common mistakes.
8. Retrieval quiz.
9. Summary + exercises.

### Code / mapping (genetic code, codon table)

1. Lede + outcomes.
2. The table and its logic (triplets, degeneracy, wobble).
3. Reading frame and translation.
4. Lab: change frame/code, read the peptide.
5. Worked example: translate a sequence by hand.
6. Exception (mitochondrial code, selenocysteine).
7. Common mistakes.
8. Retrieval quiz.
9. Summary + exercises.

### Probability (Punnett, HWE, linkage)

1. Lede + outcomes.
2. Sample space and expected counts.
3. Test statistic and df.
4. Lab: sample, test, reject/not reject.
5. Worked example with counts.
6. What the test does not prove.
7. Common mistakes.
8. Retrieval quiz.
9. Summary + exercises.

### Technique (plasmid, PCR, CRISPR)

1. Lede + outcomes.
2. Substrate, enzyme, readout.
3. Workflow and failure points.
4. Lab: design, digest, scan, read.
5. Worked example with a real number (pUC19 2686 bp, etc.).
6. Artefact / false positive.
7. Common mistakes.
8. Retrieval quiz.
9. Summary + exercises.

## Lab design rules

1. **One invariant per lab.** Name what stayed fixed (genome size, plasmid length, population N).
2. **A visible consequence within one interaction.** No “press run and wait”.
3. **A number the learner can check by hand.** Fragment lengths sum; genotype frequencies sum; codons count.
4. **A named model limit.** “Synthetic locus”, “Wright–Fisher”, “Wallace approximation”, “sequence-space expectation”.
5. **A text path.** Keyboard, sliders, and a status line; the canvas is not the only channel.
6. **A print path.** Hide controls, keep the current state and a static sentence.
7. **No fake data.** A synthetic sequence is labelled synthetic; no patient genome.
8. **No colour-only encoding.** Pair exon/intron, allele, or guide with a label or pattern.

## Assessment patterns

| Pattern | Example | What it tests |
|---|---|---|
| 2-tier MCQ | Answer + reason | Whether the number comes from the right model |
| Predict-the-output | “What happens to T if N doubles?” | Proportional reasoning |
| Spot-the-error | A splice map that ignores the frame | Representation literacy |
| Order-the-steps | Digest → ligate → transform → select → screen | Workflow causality |
| Label-the-diagram | Fork, splice site, plasmid map, pedigree | Vocabulary in context |
| Calculate-then-interpret | Compute χ², then decide | Statistical reasoning |
| Transfer | Same HWE logic in a different allele frequency | Far transfer |

Distractors should come from real misconceptions: “one gene = one protein”, “introns are junk”, “dominant = common”, “Km = Kd”, “CRISPR is 100% specific”, “PCR is linear”.

## What must not be faked

- A patient genome or a real clinical variant.
- A BLAST hit, an alignment, or a folded structure you did not compute.
- A primer Tm presented as thermodynamic truth.
- A restriction site that is not in the sequence.
- A CRISPR off-target count of zero.
- A “cure” or a clinical recommendation.

## Ethical red lines

1. **No clinical or genetic advice.** “Associated with risk”, not “you have”.
2. **No patient-identifiable genomic data.** Aggregate frequencies only, with provenance.
3. **No pathogen protocols, gain-of-function methods, or synthesis-ready hazardous sequences.** Teach governance, not methods.
4. **No deterministic language for complex traits.** “Associated with”, “contributes to”, not “the gene for”.
5. **No disability deficit framing.** Person-first or identity-first as preferred; no “suffers from”.
