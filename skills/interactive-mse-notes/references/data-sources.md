# Data sources for MSE notes

The rule is simple: a number in the note must have a source, a version, and a licence. A model-generated lattice parameter has none of the three.

## 1. Crystal structures

| Source | What it gives | Access | Cite / licence |
|---|---|---|---|
| **Materials Project** | computed structures, energies, band gaps, phase diagrams | `mp_api` client + API key | cite MP and the database version; check data terms |
| **OPTIMADE** | federated structure search across providers (COD, MP, OQMD, NOMAD, …) | open API standard | cite the provider and the OPTIMADE spec |
| **COD** (Crystallography Open Database) | experimental crystal structures | open | cite the COD entry and the original paper |
| **AFLOW** | prototypes, computed properties, convex hulls | web/API | cite AFLOW and the entry |
| **OQMD** | DFT formation energies and structures | web/API | cite OQMD |
| **NOMAD** | raw/processed computational data | web/API | cite NOMAD and the upload |
| **ICSD / PDF cards** | experimental structures and diffraction | subscription | do not redistribute; cite the card |

**Minimal pymatgen query** (verify the current API before running):

```python
from pymatgen.core import Structure
s = Structure.from_file("my.cif")
print(s.composition, s.lattice.a, s.density)
```

**Minimal OPTIMADE query** (the exact endpoint and fields change; check the docs):

```python
import requests
url = "https://optimade.materialsproject.org/v1/structures"
r = requests.get(url, params={"filter": 'elements HAS "Si" AND elements HAS "O"', "page_limit": 5})
print(r.json()["data"][0]["attributes"]["lattice_vectors"])
```

Do not embed an API key in a distributed note. Precompute the result and cite the query.

## 2. Phase diagrams and thermodynamics

| Source | What it gives | Notes |
|---|---|---|
| **Thermo-Calc + TC-Python** | CALPHAD equilibrium, databases (TCFE, etc.) | commercial; record database name and version |
| **FactSage** | phase equilibria, slag/glass, thermochemistry | commercial |
| **pycalphad** | open CALPHAD from TDB files | MIT; record the TDB and assessment |
| **Materials Project phase diagrams** | DFT convex hulls and competition | computed, not experimental; say so |
| **ASM Alloy Phase Diagram Database** | assessed experimental diagrams | subscription; cite the assessment |
| **Textbook diagrams** | teaching idealisations | cite figure and edition; redraw rather than scan |

A CALPHAD figure is only reproducible if you state: database, version, components, pressure, temperature range, and the software. “Thermo-Calc” alone is not a citation.

## 3. Diffraction

| Source | What it gives | Notes |
|---|---|---|
| **pymatgen `XRDCalculator`** | peak positions and intensities from a structure | computed; state the radiation and the structure source |
| **VESTA** | calculated powder pattern, structure visualisation | free for non-commercial; check terms |
| **CrystalDiffract / SingleCrystal** | teaching diffraction, Rietveld | commercial |
| **COD / ICSD** | experimental patterns and structures | cite the entry |
| **PDF cards** | reference patterns | subscription; do not redistribute |

For a teaching pattern, the safest route is: compute the positions from `a` and the selection rule, label the intensities as schematic, and cite the structure source. For a real pattern, show the measured data with the instrument, radiation, step size, and sample.

## 4. Properties and selection

| Source | What it gives | Notes |
|---|---|---|
| **Granta EduPack** | property databases, Ashby charts, teaching levels | commercial; check student-use terms |
| **ASM Handbooks** | mechanical/physical properties | subscription |
| **MatWeb** | vendor datasheets | free; vendor data, not necessarily traceable |
| **NIST** | reference data, thermodynamics, spectra | public; cite the specific dataset |
| **matminer** | datasets and featurisation for ML | BSD-3 (verify); cite the dataset |
| **Materials Project** | computed properties | computed; not a substitute for a datasheet |
| **Textbook tables** | teaching values | cite edition and table |

Property data ages. A 1990 handbook value for a 2026 alloy may be wrong. Record the year.

## 5. Images and micrographs

- Use your own micrograph, a CC-licensed image, or a redrawn schematic. Do not lift a figure from a paper without permission.
- Every micrograph needs: material, magnification, scale bar, imaging mode (SE/BSE/optical), etching/preparation, and source.
- A “schematic microstructure” must say so. It is not evidence.
- For image analysis, use ImageJ/Fiji and report the threshold, the number of grains, and the uncertainty.
- If you annotate an image, keep the original and the annotation separate.

## 6. Computational data

| Source | What it gives | Notes |
|---|---|---|
| **Materials Project** | DFT energies, band structures, DOS, hulls | state functional (GGA/GGA+U/r2SCAN) |
| **AFLOW** | prototypes, hulls, properties | state the entry |
| **OQMD** | formation energies | state the functional |
| **NOMAD** | raw/processed data | state the upload and method |
| **Phonon databases** | phonon dispersions, thermal properties | state the method |

Do not compare energies from different functionals without saying so. A convex hull from GGA and a hull from r2SCAN are different objects.

## 7. Licensing checklist

For every source, record:

- [ ] title and authors;
- [ ] database/edition/version;
- [ ] access date;
- [ ] licence (CC BY, CC BY-NC, subscription, commercial);
- [ ] whether redistribution is allowed;
- [ ] whether modification is allowed;
- [ ] the citation format.

If a licence is unclear, link to the source and redraw the figure from cited numbers. Do not redistribute a scanned figure from a subscription journal.

## 8. Offline strategy

A note that depends on a live API is not a note; it is a demo. For distribution:

1. Precompute the data.
2. Store a small JSON or a static SVG in the note folder.
3. Embed only the numbers the note argues about.
4. Keep the query script next to the note for reproducibility.
5. State the date and the version in the note.

## 9. Citation patterns

**Database**

> Materials Project, database version 2026.1, accessed 11 November 2026. Structure mp-30 (Cu). https://materialsproject.org

**CALPHAD**

> Thermo-Calc 2026a, TCFE12 database, Pb–Sn system, 1 atm. Calculated 11 November 2026.

**Diffraction card**

> ICDD PDF-4+ card 04-004-1234, Cu Kα1, 1.54056 Å.

**Micrograph**

> Author, “Figure caption”, *Journal*, vol., page (year). Reproduced with permission / CC BY 4.0.

**Textbook**

> W. D. Callister Jr. and D. G. Rethwisch, *Materials Science and Engineering: An Introduction*, 10th ed., Wiley, 2018, ch. 9.

A note with a clear source table is easier to trust, easier to update, and easier to defend in a review.
