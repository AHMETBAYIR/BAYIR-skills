# Curriculum map: what an MSE note has to teach

Use this table to choose the representation and the lab. The column “hard part” is the one that should drive the note, not the syllabus title.

## Core courses

| Course | Core representations | Hard part (student misconception) | Best interactive | Verify with |
|---|---|---|---|---|
| **Intro MSE** | bond triangle, unit cells, phase diagram, stress–strain, Ashby chart | “Materials are a list of properties”; structure–property links are verbal, not causal | crystal + phase + stress | density, APF, lever rule |
| **Crystallography** | lattice + basis, Miller indices, planes/directions, reciprocal lattice, stereographic projection | rotating a 3D cell in the head; (hkl) plane vs d-spacing; family vs specific plane | `crystal`, plus a plane-slicing static figure | `a`, `d_hkl`, planar density |
| **Thermodynamics** | G–x curves, common tangent, phase diagrams, Ellingham, Pourbaix | ΔG vs ΔG°; equilibrium vs metastable; tie line vs lever rule | `phase` (binary), static G–x | common tangent, phase rule |
| **Kinetics / diffusion** | Fick I/II, error function, Arrhenius, TTT/CCT, nucleation rate | “diffusion stops at equilibrium”; `t` vs `√t`; D is not constant | `diffusion`, TTT sketch | `D`, `√(Dt)`, case depth |
| **Mechanical behaviour** | stress–strain, Mohr's circle, fracture mechanics, fatigue, creep | stiffness vs strength; UTS vs fracture; toughness vs hardness; engineering vs true | `stress` | area under curve, `K_Ic` |
| **Electronic / magnetic / optical** | band diagram, DOS, carrier concentration, B–H loop, band gap vs wavelength | Fermi level vs vacuum level; direct vs indirect gap; extrinsic vs intrinsic | static band/DOS + parameter plot | `E_g`, `λ = hc/E` |
| **Polymers** | chain conformation, `T_g`, crystallinity, viscoelastic models, stress–strain | `T_g` is not melting; semi-crystalline = two phases; time–temperature superposition | stress–strain (polymer preset), Maxwell sketch | `M_n`, `M_w`, `T_g` |
| **Ceramics / glasses** | coordination polyhedra, Pauling rules, sintering, Weibull, fracture toughness | ionic radius ratio vs coordination; brittle failure statistics | crystal (NaCl), static sintering | APF, `K_Ic`, Weibull |
| **Composites** | rule of mixtures, load transfer, anisotropy, laminate stacking | iso-strain vs iso-stress; fibre vs matrix role | static micromechanics plot | `E_c`, density, volume fraction |
| **Characterisation** | XRD pattern, SEM/TEM image, EDS spectrum, DSC curve, FTIR/Raman | peak position vs intensity; image contrast vs composition; sample prep artefacts | `xrd`, image annotation | Bragg, `d`, indexing |
| **Computational MSE** | DFT energy, convex hull, phonon dispersion, MD trajectory, CALPHAD | “the computer is right”; functional/bias; convergence | static hull/phonon + parameter sweep | `E_hull`, `E_g`, `a_0` |
| **Design / selection** | Ashby chart, performance index, constraint vs objective, cost/sustainability | index derivation; screening vs ranking; units of the index | Ashby-style chart | index algebra, units |

## The four questions every MSE note answers

1. **What is the object?** A crystal, a phase mixture, a microstructure, a component. Name the scale (Å, µm, mm, m).
2. **What is the governing relation?** A free-energy minimisation, a mass balance, a rate law, a constitutive law.
3. **What is the representation?** A cell, a diagram, a curve, an image, a map. State the axes and the convention.
4. **What would falsify the claim?** A limiting case, a missing peak, a fraction that does not sum to one, a unit mismatch.

If a note cannot answer question 4, it is a description, not an explanation.

## Course-specific note recipes

### Intro MSE: “structure → property → application”

- Lede: one material, one property, one application.
- 2 labs maximum: a unit cell and a stress–strain or phase diagram.
- One table that maps structure (FCC/BCC/HCP) to property (ductility, density, slip) to application.
- Common mistake: “density is a material constant” (it changes with structure and `a`).
- Quiz: identify the structure from a property clue.

### Crystallography: “the cell is a coordinate system”

- Start with the basis, not the name. Build FCC from `(0,0,0)` + face centres.
- Use one rotating cell with a coordination-number readout.
- Add a static (100)/(110)/(111) plane figure. The lab cannot draw arbitrary planes; do not pretend it can.
- Derive `d_hkl = a/√(h²+k²+l²)` and `ρ = nM/(N_A a³)`.
- Common mistake: counting corner atoms as whole; confusing a direction `[uvw]` with a plane `(hkl)`.
- Quiz: which plane is close-packed in FCC, and why.

### Thermodynamics: “the diagram is a projection of G–x”

- Show a G–x curve and its common tangent next to the phase diagram. The tie line is the common tangent.
- Use the phase lab to read compositions; use a static G–x figure to explain why the boundaries have their slopes.
- State the pressure and the reference state.
- Common mistake: using the lever rule on a G–x diagram without identifying the two phases.
- Quiz: why the eutectic liquid is stable against both α and β.

### Kinetics: “time is a square root, temperature is exponential”

- Use the diffusion lab to separate the two dependences: `t` and `T`.
- Show the error-function profile and the `√(Dt)` scaling on the same axes.
- Add a TTT/CCT sketch for a phase transformation; label the nose and the critical cooling rate.
- Common mistake: “longer time always gives a deeper case” without asking about D and the surface boundary condition.
- Quiz: by what factor does the case depth change when time is quadrupled.

### Mechanical: “the curve is a design envelope”

- Use the stress lab to read E, σ_y, σ_u, ε_f, toughness, resilience.
- Show the 0.2% offset construction in an inset; at full strain scale it is invisible.
- Compare a ductile metal, a brittle ceramic, and a polymer on the same axes; discuss why the axes must change.
- Common mistake: “the highest point is the fracture stress”; “stiffness is strength”.
- Quiz: which material absorbs more energy before fracture, and why.

### Characterisation: “a pattern is a reciprocal-space fingerprint”

- Start with the specimen and the method: powder vs single crystal, Cu Kα vs synchrotron.
- Index the first three peaks by hand before using the lab.
- Show the structure-factor rules for SC/BCC/FCC/diamond/rock salt.
- State that intensities are schematic unless a full refinement was run.
- Common mistake: assigning the first peak to (100) for every cubic structure.
- Quiz: which reflection distinguishes BCC from FCC.

### Design: “translate, screen, rank”

- Translate the function into a performance index (e.g. `E^{1/2}/ρ` for a stiff beam).
- Screen with constraints (temperature, corrosion, cost).
- Rank on an Ashby chart; show the selection line with the correct slope.
- State the data source and the year; property data ages.
- Common mistake: comparing materials on one property rather than the index.
- Quiz: derive the index for a given loading case.

## What not to put in a single note

- A full crystallography course plus a full thermodynamics course.
- A CALPHAD calculation without the database and the assessment date.
- A micrograph without scale bar, etching method, and magnification.
- A “materials selection” conclusion without the constraint set.
- A quiz whose answers are all numbers with the same units; it tests arithmetic, not understanding.

## Mapping the lab engines to courses

| Engine | Intro | Cryst. | Thermo | Kinetics | Mech. | Char. | Design |
|---|---|---|---|---|---|---|---|
| `crystal` | ● | ● | ○ | ○ | ○ | ○ | ○ |
| `phase` | ● | ○ | ● | ● | ○ | ○ | ○ |
| `stress` | ● | ○ | ○ | ○ | ● | ○ | ● |
| `diffusion` | ○ | ○ | ○ | ● | ○ | ○ | ○ |
| `xrd` | ○ | ● | ○ | ○ | ○ | ● | ○ |
| `ttt` | ○ | ○ | ○ | ● | ● | ○ | ○ |
| `ashby` | ● | ○ | ○ | ○ | ● | ○ | ● |
| `ternary` | ○ | ○ | ● | ○ | ○ | ○ | ○ |
| `band` | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| `micro` | ○ | ○ | ○ | ○ | ○ | ● | ○ |

● primary, ○ secondary. If a course needs a representation the kit does not ship, add a topic-specific lab rather than stretching an existing one.
