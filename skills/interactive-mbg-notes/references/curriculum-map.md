# MBG curriculum map

Programme names vary (“Moleküler Biyoloji ve Genetik” vs “…ve Genetik Mühendisliği”); semester placement varies, but the dependency chain is stable. Claim no national standard. Verify the host institution's AKTS sheet.

## Course chain

| Year | Typical Turkish course | Prerequisites | Role |
|---|---|---|---|
| 1 | Genel Biyoloji I–II + Lab, Genel/Organik Kimya, Matematik, Fizik | — | biomolecules, acid–base, cell cycle, statistics |
| 2 | Hücre Biyolojisi I–II, **Genetik I** + Lab, Mikrobiyoloji, **Moleküler Biyoloji** + Lab, Biyokimya I | Genel Biyoloji, Organik Kimya | DNA/RNA, replication, transcription, translation |
| 3 | **Moleküler Genetik**, Prokaryot/Ökaryot Moleküler Genetiği, **Biyoinformatik**, **Rekombinant DNA / Genetik Mühendisliği**, Biyokimya II | Moleküler Biyoloji, Genetik I | operons, chromatin, cloning, PCR, sequencing |
| 4 | **Genomik/Proteomik**, Epigenetik, Protein Yapısı ve Fonksiyonu, **Kanser Genetiği**, bitirme tezi | Moleküler Biyoloji, Biyokimya II | annotation, PTMs, folding, allostery, kinetics |

**Prerequisite chains:**

```
Genel Biyoloji → Hücre Biyolojisi → Moleküler Biyoloji → Moleküler Genetik / Rekombinant DNA
Genel Kimya → Organik Kimya → Biyokimya → Enzimoloji / Protein Yapısı
Biyoistatistik → Biyoinformatik → Genomik
Genetik I → Genetik II → Popülasyon Genetiği / İnsan Genetiği
```

Assume cell biology and basic chemistry, **not** thermodynamics or kinetics. Supply the needed math inline.

**Terminology to hold constant:** replikasyon, transkripsiyon, translasyon, replikasyon çatalı, öncü/gecikmeli zincir, Okazaki parçaları, kromatin, nükleozom, ekzon/intron, splisozom, alternatif splays, 5′ kapak, poli-A kuyruğu, ribozom, kodon/antikodon, sallantı (wobble), operon, promotör, güçlendirici (enhancer), susturucu, insülatör, transkripsiyon faktörü, mediatör, şaperon, allosteri, enzim kinetiği, inhibisyon. Give English at first mention.

## Cluster A — molecular core

| Idea | Irreducible representation | Common misconception |
|---|---|---|
| Central dogma | information-flow diagram with exceptions | “one gene = one protein” |
| DNA topology | Lk = Tw + Wr; supercoil sign | “topoisomerase unwinds by magic” |
| Replication | fork diagram with leading/lagging | “both strands are continuous” |
| Transcription | promoter → initiator → elongation → termination | “eukaryotes couple transcription and translation” |
| Splicing | exon/intron map + splice sites + frame | “introns are junk” |
| Translation | ribosome A/P/E + codon table | “one codon = one amino acid” is false for stop |
| Regulation | operon logic / enhancer–promoter loop | “lac is induced by lactose” (it is allolactose) |
| Epigenetics | chromatin state tracks | “methylation always silences” |
| Protein | secondary structure → fold → function | “sequence determines one stable structure” |

**Labs:** `replication`, `splicing`, `codon`, `operon`.

## Cluster B — genetics and genomics

| Idea | Representation | Misconception |
|---|---|---|
| Mendel | Punnett square + counts | “3:1 is exact for small n” |
| Probability | binomial / χ² | “a correct model is never rejected” |
| Pedigree | graph + conditional probability | “1/4 recurrence = 1/2 carrier” |
| Linkage | recombination map | “cM is a physical unit” |
| HWE | genotype frequencies + null surface | “HWE means no evolution” |
| Drift | Wright–Fisher trajectory | “drift is deterministic” |
| Mutation/repair | lesion → pathway → consequence | “all mutations are point mutations” |
| Cancer | clonal evolution + driver/passenger | “two hits = two coding mutations” |
| GWAS | Manhattan + QQ + LD | “lead SNP is causal” |
| Genomics | assembly → annotation → variant | “N50 is the average contig” |

**Labs:** `hwe`, `punnett`. **Extensions:** linkage mapper, pedigree calculator, GWAS explorer (not shipped).

## Cluster C — genetic engineering and biotech

| Idea | Representation | Misconception |
|---|---|---|
| Restriction digest | circular map + gel | “gel migration is linear in bp” |
| Ligation | insert:vector ratio + junction | “more insert is always better” |
| Transformation | colonies + selection | “blue-white is proof” |
| PCR | amplification curve + gel | “PCR is linear” |
| qPCR | standard curve + ΔΔCt | “Ct is amount” |
| Sanger | chromatogram | “one peak = one base” |
| NGS | coverage histogram | “coverage = accuracy” |
| CRISPR | guide + PAM + cut site | “CRISPR is 100% specific” |
| Gene therapy | vector → cell → expression | “HDR is the default repair” |
| Synthetic biology | circuit/pathway diagram | “a part works the same in every host” |

**Labs:** `plasmid`, `pcr`, `crispr`.

## Representations that carry the argument

| Representation | Must show | Why it matters |
|---|---|---|
| Replication fork | 5′→3′, leading/lagging, Okazaki, two forks per origin | Directionality explains the asymmetry |
| Splice map | exon/intron boundaries, frame, PTC, junction | Splicing is not just “cut the introns” |
| Codon table | 64 cells, stop, degeneracy, frame | The table is a lookup, not a story |
| Operon logic | promoter, operator, CAP site, repressor | Regulation is a logic gate with an analog input |
| Punnett square | gametes, zygotes, counts | Probability is a sample space |
| HWE plot | genotype frequencies, null surface | HWE is a null model, not a law |
| Plasmid map | circular coordinates, cut sites, fragments | The wrap-around fragment is the concept |
| Gel | log(bp) axis, band intensity ∝ mass | Size is not linear |
| Amplification curve | log copies vs cycle, plateau | Exponential then saturated |
| CRISPR locus | guide, PAM, both strands, cut | Specificity is a distribution, not a boolean |

## Assessment archetypes

- Predict the replication time from G, N, v.
- Read a splice variant: mRNA length, protein length, NMD.
- Translate a sequence in three frames and two codes.
- Predict the *lac* operon state from lactose and glucose.
- Compute HWE genotype frequencies and test with χ².
- Build a Punnett square and interpret a rejection.
- Map a plasmid digest and sum the fragments.
- Compute primer Tm and qPCR efficiency.
- Scan a locus for PAMs and explain the off-target expectation.
- Interpret a variant with frequency, consequence, and evidence codes (ACMG/AMP).
