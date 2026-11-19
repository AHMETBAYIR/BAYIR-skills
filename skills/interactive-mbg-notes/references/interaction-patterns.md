# MBG interaction patterns

A lab is not “a canvas with sliders”. Pick the pattern that isolates the concept, then check the failure mode.

| Pattern | Learner action | Best for | Failure mode to avoid |
|---|---|---|---|
| **Parameter sweep** | move one slider, watch one outcome | replication time, PCR yield, HWE | five sliders at once; no invariant named |
| **Build / splice** | choose exons or cut sites, see the product | splicing, plasmid digest | the product is decorative; the readout does not depend on the choice |
| **Table explorer** | pick a codon/frame/code, read the mapping | genetic code | the table is static; no sequence context |
| **Logic gate** | set inputs, read the output | *lac* operon | the output is a lookup table with no mechanism |
| **Sampling** | draw progeny, test a ratio | Punnett, χ² | counts are hard-coded from the expected ratio |
| **Scan** | search a sequence for a motif/PAM | CRISPR, restriction sites | only one strand or only the first hit |
| **Model switch** | toggle drift/selection, KV/competitive | HWE, inhibition | the comparison is not parameter-matched |
| **Predict–check** | commit a value, then reveal | all labs | the prediction is skippable and the answer is visible below |

## Pattern notes

### Parameter sweep

- One primary control; secondary controls in a second row.
- A dashed reference curve at a fixed parameter helps the learner see the direction.
- The status line says *why* the curve moved, not only that it moved.

### Build / splice

- The product must be a real sequence or a computed length, not a label.
- Show the frame and the junction; NMD is a separate flag.
- For a digest, all fragments must sum to the plasmid length.

### Table explorer

- Highlight the codons actually used in the current frame.
- Show the peptide, the stop count, and the frame number.
- Do not let the table imply that one codon is “the” codon for an amino acid.

### Logic gate

- Name the inputs and the output in the same units as the readout.
- Show the mechanism (repressor, CAP) and the analog value, not only on/off.
- Include the basal leak.

### Sampling

- Draw from the model; do not hard-code 9:3:3:1.
- Show expected and observed side by side.
- Report the test statistic, df, and decision; a rejection is not proof of a mechanism.

### Scan

- Scan both strands for CRISPR; state the PAM and the cut offset.
- Show the first few hits and the total count.
- Report a sequence-space expectation, not a guarantee of zero.

### Model switch

- Normalise the parameters so the comparison is fair.
- Name the shared quantity (τ, Km, Vmax).
- If the models are indistinguishable at the current parameters, say so.

### Predict–check

- The prediction is a `<details>` before the controls.
- The status line explicitly reconciles the guess with the result.
- A wrong prediction is the useful case.

## Anti-patterns

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Animated replication with no pause | learner watches, does not predict | add play/pause and a step control |
| A codon table with no sequence | no frame, no context | add a sequence and a frame selector |
| A Punnett square with hard-coded counts | teaches the ratio, not sampling | sample from the model |
| A “patient genome” with no provenance | ethical and accuracy risk | use a synthetic sequence |
| Colour-only exon/intron | inaccessible | add labels or patterns |
| A readout with 8 rows | cognitive overload | keep 4–7; move the rest to a table |
| A canvas that prints blank | print failure | keep the current state and add a sentence |

## Mapping to engines

| Engine | Primary pattern | Secondary |
|---|---|---|
| `replication` | parameter sweep | boundary case (N = 1) |
| `splicing` | build / splice | predict–check |
| `codon` | table explorer | predict–check |
| `operon` | logic gate | parameter sweep |
| `hwe` | parameter sweep | model switch (drift/selection) |
| `punnett` | sampling | predict–check |
| `plasmid` | build / splice | reference comparison (gel) |
| `pcr` | parameter sweep | boundary case (plateau) |
| `crispr` | scan | boundary case (mismatch budget) |
