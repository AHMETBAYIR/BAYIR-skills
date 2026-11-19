# BME data sources and licences

Use these to source a trace, a phantom, a property value, or a standard. **Do not embed a dataset whose licence forbids redistribution.** When in doubt, synthesise the signal and cite the model.

## Physiological signals

| Source | What it has | Licence / constraint | Use |
|---|---|---|---|
| **PhysioNet** (physionet.org) | MIT-BIH Arrhythmia, PTB-XL, MIMIC-IV, WFDB tools | Varies by database; many are ODC-BY or CC-BY; MIMIC requires credentialed access and a data-use agreement | Signal-processing labs, ECG/HRV; never redistribute MIMIC |
| **OpenNeuro** | EEG, fMRI, MEG | CC0 for many datasets; check each | EEG spectra, evoked responses |
| **TUH EEG Corpus** | clinical EEG | Registration + data-use agreement | EEG/PSD, artefacts; not for open redistribution |
| **PhysioNet WFDB** | format + sample data | open tooling | Reading/writing traces |
| **NeuroKit2 / HeartPy** | synthetic and sample ECG/PPG | MIT / GPL (HeartPy) | Verification only; do not ship GPL code in the note |

**Offline fallback:** generate a synthetic PQRST with Gaussian components (as the `ecg` lab does) and label it “synthetic”. A synthetic trace is enough to teach lead algebra, sampling, and filtering.

## Medical imaging

| Source | What it has | Licence | Use |
|---|---|---|---|
| **TCIA** (cancerimagingarchive.net) | CT/MRI/PET collections | CC BY 3.0/4.0 for many collections; check each | Real anatomy for windowing; de-identify and cite |
| **fastMRI** (NYU) | knee/brain MRI k-space | CC BY-NC 4.0 (research only) | k-space, reconstruction; not commercial |
| **OASIS** | brain MRI | CC BY-NC-SA | Anatomy, segmentation |
| **MedMNIST** | small 2D/3D medical images | CC BY 4.0 | Classification teaching; low resolution |
| **scikit-image** | Shepp–Logan phantom, CT helpers | BSD-3 | Synthetic CT/sinogram; best default for a lab |

**Offline fallback:** build a 240×240 phantom with known HU regions (air −1000, fat −90, lung −820, water 0, muscle 40, bone 1000) and label it “schematic”. Do not present it as a patient scan.

## Material and device properties

| Source | What it has | Constraint |
|---|---|---|
| **MatWeb** | polymer/metal/ceramic properties | Scripted access returns HTTP 403; do not scrape. Use a curated table with a citation. |
| **ASM Handbook / Materials Data** | authoritative property ranges | Subscription; cite volume/table |
| **NIST WebBook** | thermophysical data | Public; cite |
| **Granta EduPack** | teaching property maps | Licensed; do not redistribute the database |
| **ISO 10993-1** | biological evaluation | Purchase; cite edition (2025 current) |
| **ASTM F136** | Ti-6Al-4V ELI | Purchase; cite edition |
| **FDA 510(k) / MAUDE** | device summaries, adverse events | Public; do not imply clinical advice |

**Offline fallback:** a small CSV of teaching values with a range and a source column. State “approximate teaching data; verify before design”.

## Literature and APIs

| API | Use | Note |
|---|---|---|
| **Europe PMC REST** | search, abstracts, open full text | `https://www.ebi.ac.uk/europepmc/webservices/rest/search` |
| **Crossref** | DOI metadata | `https://api.crossref.org/works/{doi}` |
| **PubMed E-utilities** | biomedical citations | rate-limited; identify your tool |
| **OpenAlex** | citation graph | CC0 |
| **arXiv** | preprints | licence varies |

Cache results locally; never make the note depend on a live API.

## Standards and regulatory claims

- Cite the **edition**: “ISO 10993-1:2025”, “ASTM F136-26”.
- Do not claim compliance from a simulation.
- Do not reproduce a proprietary standard's text or figures.
- Distinguish “standard test method” from “clinical evidence”.

## What not to embed

- MIMIC-IV, TUH EEG, fastMRI, OASIS, or any credentialed dataset.
- A patient photo, even de-identified; metadata stripping is not enough.
- A commercial property database.
- A KEGG pathway map (KEGG is not freely redistributable) — use Reactome (CC0 data, CC BY images) or draw it yourself.
- A figure from a paper without permission; redraw with attribution.

## Citation pattern

In the note:

```html
<p class="source">Values: ASTM F136-26; cortical bone modulus range from Currey (2002), verified against the lab readout. Synthetic ECG, not patient data.</p>
```

In the readout or caption, say **what is synthetic**, **what is measured**, and **what is a teaching fit**.
