# MBG accuracy checklist

Every number in a note must survive an independent calculation. This file lists the conventions the shipped labs use and the places where a plausible-looking claim is wrong.

## Genome and chromatin

| Quantity | Value | Note |
|---|---|---|
| GRCh38 | **3.10 Gb** | “3.2 Gb” is a legacy round number |
| T2T-CHM13 | **3.055 Gb** | telomere-to-telomere, 2022 |
| Protein-coding genes | **~19,900** | Ensembl 112: 19,846; GENCODE v50: 19,442; RefSeq: 19,890 |
| Coding sequence | ~1.2–1.5% | introns ~24–26%, repeats ~50% |
| Nucleosome core | **147 bp**, ~1.65 turns, ~11 nm disc | linker 20–80 bp; chromatosome ~166 bp with H1 |
| Human supercoiling | σ ≈ **−0.05 to −0.06** | negatively supercoiled |
| Telomere repeat | 5′-TTAGGG-3′ | 5–15 kb; 50–300 nt 3′ overhang |
| Okazaki fragment | **100–200 nt** | ~1–2 kb in *E. coli* |
| Fork speed | **1–2 kb/min** (0.5–3) | human |
| Active origins | ~30,000–100,000 | only a subset fires per S phase |

The 30 nm fibre is a model; in-situ data favour 10 nm fibres in many cell types. Do not present it as settled.

## Replication

$$T=\frac{G}{2vN},\qquad N_{\text{Okazaki}}=\frac{G}{L_O}$$

- The 2 is two forks per origin.
- Default: 3.1 Gb, 50,000 origins, 1.5 kb/min → **20.7 min**. One origin → **~2.0 years**.
- Real S phase is hours because origin firing is stochastic and not all origins fire at once; the arithmetic is a lower bound, not a measured S phase.
- Fidelity: base selection 10⁻⁴–10⁻⁵; proofreading 10⁻⁶–10⁻⁷; mismatch repair 10⁻⁹–10⁻¹⁰.
- Germline de novo rate: **~1.0–1.3×10⁻⁸ per base per generation** (~60–80 per diploid genome). This is **not** replication fidelity.
- Do not say “DNA polymerase proofreads both strands equally”; leading and lagging have different architecture.

## Transcription and splicing

- Pol I → 45S pre-rRNA (18S, 5.8S, 28S); Pol II → mRNA, snRNA, most miRNA; Pol III → tRNA, 5S rRNA, U6.
- CTD: 52 YSPTSPS repeats in human; Ser5P initiation/capping, Ser2P elongation/splicing/polyA.
- Splice sites: 5′ GU, 3′ AG, branch point A; the spliceosome is an RNA enzyme.
- Exon lengths determine the frame. An exon skip preserves the frame only if the skipped length is a multiple of 3.
- Intron retention shifts the frame unless the intron length is a multiple of 3.
- NMD rule: a PTC **more than 50–55 nt upstream of the last exon–exon junction** is a candidate. It is a heuristic; many exceptions exist.
- The shipped synthetic gene: exons 120/90/150 nt, introns 800/600 nt.
  - canonical: 360 nt, 119 aa
  - exon 2 skipped: 270 nt, 89 aa
  - intron 1 retained: 1160 nt, 40 aa, PTC at 123 nt, junction 1010 nt → NMD yes
  - alternative 3′ site (−30 nt): 330 nt, 109 aa

## Genetic code

- 64 codons = **61 sense + 3 stop** (TAA, TAG, TGA).
- Standard code; vertebrate mitochondrial exceptions: TGA = Trp, ATA = Met, AGA/AGG = stop.
- Degenerate but not ambiguous: one codon → one amino acid; most amino acids have several codons.
- Wobble: third-base pairing is relaxed; this is why degeneracy is possible.
- Selenocysteine (UGA + SECIS) and pyrrolysine (UAG) are recoding exceptions; do not imply the standard table is universal.
- Frame matters: the same mRNA gives different peptides in different frames.

## *lac* operon

- Inducer: **allolactose**, not lactose (lactose is the substrate; LacZ converts some to allolactose).
- LacI binds the operator and blocks RNA polymerase; allolactose reduces binding.
- Glucose lowers cAMP; CAP–cAMP is the activator. High glucose → catabolite repression even when lactose is present.
- Basal leak is ~2%, not zero.
- The shipped rate model is a teaching fit: `rate = 2 + 98 * rep * cap`, `rep = Lac^n/(K^n+Lac^n)`, `cap = 1/(1+(Glc/Kg)^2)`. Do not present it as measured.

## Mendelian genetics and probability

- Monohybrid Aa × Aa: 1 AA : 2 Aa : 1 aa; with complete dominance 3 : 1.
- Dihybrid AaBb × AaBb: 9 : 3 : 3 : 1 **only if** independent assortment and equal viability.
- Test cross Aa × aa: 1 : 1.
- Binomial: $P(k)=\binom{n}{k}p^k(1-p)^{n-k}$.
- Recurrence risk for an autosomal recessive family with one affected child: **1/4**. The probability that an unaffected sibling is a carrier is **2/3**, not 1/2. This is conditional probability, not a ratio.
- Dominant is a property of a genotype–phenotype pair, not “more common” or “advantageous”.
- Epistasis ratios (9:3:4, 9:7, 12:3:1, 15:1, 13:3) are hypotheses; linkage, lethality, and ascertainment can mimic them.

## Chi-square and HWE

$$\chi^2=\sum\frac{(O-E)^2}{E},\qquad df=k-1-m$$

- HWE with two alleles: $df=1$; with $k$ alleles: $df=k(k-1)/2$.
- Expected counts must be computed from the model, not copied from 9:3:3:1.
- A correct model is rejected ~5% of the time at α = 0.05. That is the test working, not failing.
- HWE assumptions: random mating, no selection, no mutation, no migration, no drift.
- With inbreeding: $f(Aa)=2pq(1-F)$.
- Drift variance per generation: $p(1-p)/(2N_e)$.
- $q^*=\sqrt{\mu/s}$ for a recessive deleterious allele (mutation–selection balance).

## Linkage

- Recombination fraction $0\le\theta\le0.5$; $\theta=0.5$ means unlinked.
- Haldane: $d=-50\ln(1-2\theta)$ cM.
- Kosambi: $d=25\ln[(1+2\theta)/(1-2\theta)]$ cM.
- At θ=0.2: Haldane 25.5 cM, Kosambi 21.2 cM. At θ=0.3: 45.8 vs 34.7 cM.
- Three-point: expected DCO $=r_1r_2N$; coefficient of coincidence $=O_{DCO}/E_{DCO}$; interference $=1-\text{c.o.c.}$.
- LOD $=\log_{10}[L(\theta)/L(0.5)]$; a LOD of 3 is the conventional threshold, not proof.
- cM is not a linear physical distance; recombination hotspots break the mapping.

## Population and complex traits

- $p^2+2pq+q^2=1$.
- Odds ratio $=ad/bc$ for a 2×2 table.
- $r^2=D^2/(p_Ap_ap_Bp_b)$ for LD.
- $\lambda_{GC}=\text{median}(\chi^2)/0.4549$.
- $h^2=V_A/V_P$ (narrow-sense heritability); it is a population parameter, not a property of an individual.
- A GWAS peak is a region; the lead SNP is not necessarily causal.
- ClinVar/gnomAD/COSMIC snapshots have dates; cite the release.

## Mutation, repair, cancer

- Mutation types: SNP, indel, frameshift, CNV, structural, splice-site, regulatory.
- MMR, NER, BER, HR, NHEJ are distinct pathways; do not collapse them into “repair”.
- Knudson two-hit: both alleles of a tumour suppressor lost; “two hits” are not necessarily two coding mutations (promoter methylation, deletion, imprinting).
- Oncogene activation is usually gain-of-function, dominant; tumour suppressor loss is usually recessive at the cell level.
- Driver vs passenger is inferred from frequency, function, and context; a hotspot is not proof of driver status.
- Clonal evolution: VAF ≈ clone fraction × purity / copy number; do not set VAF directly from clone fraction without those terms.

## Recombinant DNA

$$P=4^{-n},\qquad E[\text{sites}]=G\cdot4^{-n}$$

- 4-cutter 1/256; 6-cutter 1/4096; 8-cutter 1/65,536.
- 4.64 Mb genome → ~1133 six-cutter sites (expectation, not count).
- Ligation: $m_{insert}=m_{vector}\cdot\frac{bp_{insert}}{bp_{vector}}\cdot\text{ratio}$.
- pUC19: 2686 bp; EcoRI 397, BamHI 418, HindIII 448; three-cut digest gives **21 + 30 + 2635 bp**, sum 2686.
- Circular DNA with n cuts gives n fragments, including the wrap-around fragment.
- Gel: distance is linear in $\log(bp)$ only inside the resolution window; intensity tracks mass, not molecule number.
- Transformation efficiency: cfu/µg DNA; state the plating volume.
- Blue-white screening is a screen, not proof; confirm with colony PCR, digest, or Sanger.

## PCR and qPCR

- Wallace: $T_m=2(A+T)+4(G+C)$; unreliable above ~20 nt.
- GC formula: $T_m=64.9+41(\%GC-16.4)/N$; also approximate.
- Nearest-neighbour (SantaLucia) is the defensible method for primers above ~20 nt; primer3-py is GPL, keep it on the verification side.
- Yield: $N_n=N_0(1+E)^n$ in log phase, then a plateau.
- qPCR: $C_t=m\log_{10}N+b$; $E=10^{-1/m}$; $\Delta\Delta C_t$ gives $2^{-\Delta\Delta C_t}$ only when $E\approx2$.
- A 20-mer with 50% GC: Wallace 60.0 °C, GC formula 51.8 °C. The 8 °C gap is the lesson, not a nuisance.
- A failed reaction (blank lane) is a better teaching case than a perfect amplification.

## CRISPR

- SpCas9 PAM: **NGG**; NAG is a relaxed alternative.
- Cut ~3 bp 5′ of the PAM.
- Guide 20 nt; GC 40–70% is a rough design window, not a guarantee.
- Off-target expectation (sequence space): $G\cdot2\cdot\frac{1}{16}\cdot\frac{\sum_{k=0}^{m}\binom{20}{k}3^k}{4^{20}}$.
- At m=3 and G=3.1 Gb: ~12 expected sites. At m=0: ~0.0003. Never report zero as a guarantee.
- HDR is not the default; NHEJ dominates. HDR efficiency is context-dependent (1–20% is a teaching range).
- A predicted guide is not a validated guide; use GUIDE-seq/Cas-OFFinder for real work.

## Genomics

- Coverage $C=NL/G$.
- N50 is the length-weighted median: sort contigs descending, accumulate length until half the assembly.
- Short reads struggle with repeats; long reads span them; assembly is not a single algorithm.
- Variant annotation: consequence, frequency, conservation, clinical evidence. A VEP consequence is not a diagnosis.
- ACMG/AMP codes (Richards et al. 2015) are a framework, not a score you can apply without evidence.

## Pre-flight checks

- [ ] Every sequence is 5′→3′ and labelled.
- [ ] Every codon table use states the code and the frame.
- [ ] Every probability states the sample size and the null model.
- [ ] Every count sums to the whole (fragments → plasmid; genotypes → 1).
- [ ] Every database value has a release date.
- [ ] No patient data, no clinical advice, no pathogen protocol.
- [ ] Significant figures match the inputs.
- [ ] Colour is not the only carrier of meaning.
