# MBG data sources and licences

Use these to source a sequence, a variant frequency, a structure, or a plasmid. **Do not embed a dataset whose licence forbids redistribution.** When in doubt, use a short synthetic sequence and cite the model.

## Sequences and genomes

| Source | What it has | Licence / constraint | Use |
|---|---|---|---|
| **NCBI GenBank / RefSeq** | annotated sequences, reference genomes | Public; some records have third-party restrictions | Examples, primer targets; cite accession + release |
| **Ensembl** | genomes, variation, regulation | Open; check per-species | Gene models, variants |
| **UCSC Genome Browser** | alignments, tracks, hg38 | Open; some tracks have separate licences | Track examples, coordinates |
| **UniProt** | protein sequences, function, PTMs | CC BY 4.0 | Protein examples, domains |
| **PDB** | experimental structures | CC0 for most entries; check! | Structure examples; do not imply a predicted model is experimental |
| **AlphaFold DB** | predicted structures | CC BY 4.0; predictions, not experiments | Fold illustrations; label “predicted” |
| **Addgene** | plasmids, maps, sequences | Depositor terms; many CC BY-NC | Plasmid examples; do not redistribute a map without checking |

**Offline fallback:** short synthetic sequences (20–100 nt) with a stated purpose. For a plasmid, use pUC19 (GenBank L09137.2, 2686 bp) and cite the accession.

## Variation and clinical genetics

| Source | What it has | Licence | Use |
|---|---|---|---|
| **ClinVar** | variant–condition assertions | Public; no warranty | Variant interpretation examples; cite date |
| **gnomAD** | population allele frequencies | Open; check version | Frequency filtering; cite release |
| **dbSNP** | variant identifiers | Public | rsID examples |
| **1000 Genomes** | phased genotypes | Open | Population examples |
| **GTEx** | expression QTLs | Open; controlled-access for some data | eQTL teaching |
| **OMIM** | gene–phenotype catalog | Subscription; do not redistribute text | Background only |
| **TCGA / GDC** | cancer genomes | Controlled access for raw data; summaries open | Cancer genomics; do not embed patient data |
| **COSMIC** | somatic mutations | Registration required | Cancer examples; cite release |
| **ACMG/AMP** | variant classification framework | Published framework; cite Richards et al. 2015 | Teaching evidence codes |

**Rule:** a frequency is not a diagnosis; a ClinVar assertion is not a clinical truth; a GWAS peak is not a causal variant. Always date the snapshot.

## Reagents, enzymes, primers

| Source | What it has | Licence | Use |
|---|---|---|---|
| **REBASE** | restriction enzymes and sites | Free for academic use; check commercial use | Digest examples |
| **Primer3 / primer3-py** | primer design, Tm | GPL-2.0-or-later (primer3-py) | Verification only; do not ship GPL code |
| **NCBI Primer-BLAST** | specificity check | Public service | Design examples; do not depend on runtime |
| **CRISPOR / Cas-OFFinder** | guide scoring, off-target search | Open tools; cite | Real design; the note uses a sequence-space expectation |
| **Benchling / SnapGene** | plasmid editing | Proprietary | Do not embed their files or UI |
| **OpenCloning** | open plasmid cloning | MIT (check version) | Open alternative for maps |

## Pathways and networks

| Source | What it has | Licence | Use |
|---|---|---|---|
| **Reactome** | pathways, reactions | Data CC0; images CC BY 4.0 | Pathway diagrams with attribution |
| **WikiPathways** | community pathways | CC0 | Open pathway examples |
| **KEGG** | pathways, maps | **Not freely redistributable**; academic access is to the website, not the maps | Do not embed KEGG maps; draw your own or use Reactome |
| **GO** | ontology annotations | CC BY 4.0 | Enrichment examples |
| **STRING** | protein interactions | CC BY 4.0 | Network examples |

## Literature and APIs

| API | Use | Note |
|---|---|---|
| **NCBI E-utilities** | PubMed, GenBank, BLAST | Rate-limited; identify your tool; cache |
| **Ensembl REST** | sequence, variation, overlap | JSON; respect rate limits |
| **UniProt REST** | protein records | JSON/FASTA |
| **PDB / RCSB API** | structures | JSON; cite PDB ID |
| **Europe PMC** | open full text | REST |
| **Crossref** | DOI metadata | REST |
| **bioRxiv / medRxiv** | preprints | Licence varies; label preprint |

Cache results locally; never make the note depend on a live API.

## What not to embed

- A patient genome, exome, or identifiable variant.
- TCGA/GDC raw data, GTEx individual data, or any controlled-access dataset.
- A KEGG map.
- A commercial plasmid map or SnapGene file.
- A predicted structure presented as experimental.
- A paper figure without permission; redraw with attribution.

## Citation pattern

```html
<p class="source">Sequences are synthetic. pUC19 coordinates from GenBank L09137.2 (2686 bp).
Variant frequencies would be cited to gnomAD v4.1 with the access date; none are used here.</p>
```

In the readout or caption, say **what is synthetic**, **what is a database snapshot**, and **what is a teaching model**.
