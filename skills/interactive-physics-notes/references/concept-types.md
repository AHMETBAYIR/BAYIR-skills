# The eight concept types

Chapter titles fragment physics; the same reasoning recurs across six courses. Tag every section with at
most **two** types. More than two means the section is too big.

| # | Type | Core difficulty | Canonical misconception | Representation that works | Lab? |
|---|---|---|---|---|---|
| 1 | **Conservation** | "What is conserved" depends on the system boundary and the interaction | Energy is conserved even when friction is present; momentum is conserved in every collision | energy bars, phase portrait, before/after table | yes |
| 2 | **Field** | A field is a value at every point, not a thing at one point | `V = 0` means `E = 0`; field lines are trajectories | field arrows + equipotentials + a probe readout | yes |
| 3 | **Superposition** | Linearity holds only for linear equations | Two sources "compete" instead of adding | phasor chain, wave sum, interference pattern | yes |
| 4 | **Limit** | The limit is part of the formula, not decoration | `T → 0` means "nothing moves"; `P → ∞` closes bands | parameter sweep into the limit, with residuals | yes |
| 5 | **Symmetry** | Symmetry is a calculation shortcut, not an aesthetic | Gauss's law applies to any surface | before/after transformation, conserved quantum number | sometimes |
| 6 | **Probability** | One measurement is not the expectation value | `⟨x⟩` is where the particle is; `|ψ|²` is a density of particles | histogram + expected value + spread | yes |
| 7 | **Frame** | Simultaneity, energy, and field components are frame-dependent | "Now" is universal; time dilation is an illusion | Minkowski diagram, two clock worldlines | yes |
| 8 | **Approximation regime** | Validity is invisible in the formula | `sin θ ≈ θ` at 60°; ½mv² at 0.9c | error-vs-parameter curve with a shaded valid band | yes |

## Design consequences

**Conservation.** Always draw the boundary first. A conservation law without a stated boundary is a
slogan. Ask: what crosses the boundary, and what is stored inside?

**Field.** Never show a field map without a probe. The learner must read `V` and `|E|` at the same point
and see that one can be zero while the other is not. The dipole midpoint is the canonical case:
`V = 0`, `|E| = 44.9 kV/m` for the standard configuration in the EM dossier.

**Superposition.** Show the sum, not just the result. The phasor strip in the optics lab makes
"N increases → principal maximum narrows" a geometric fact rather than a sentence.

**Limit.** Test two limits and show the approach. A limit stated only at the endpoint teaches nothing
about the approach, which is where the physics lives.

**Symmetry.** Use it to remove a coordinate, then show the reduced equation. If the lab cannot show the
reduction, use a static figure.

**Probability.** Distinguish three objects on the page: the distribution, one sample, and the expectation.
The Maxwell–Boltzmann lab does this with a shaded fraction and three velocity markers.

**Frame.** Draw both frames' axes. A Lorentz boost is not a "shrink"; it is a change of simultaneity
surfaces. Keep the light cone invariant and say so.

**Approximation regime.** Put the error number next to the approximation. `sin θ ≈ θ` relative to
`sin θ`: 4.7 % at 30°, 11.1 % at 45°, 20.9 % at 60°. Relativistic kinetic energy at 0.9c:
`K/mc² = 1.2942` vs classical `0.4050` — a factor 3.2.

## Tagging example

| Section | Types | Representation |
|---|---|---|
| Coulomb → Gauss | Field, Symmetry | field map + Gaussian surface |
| N-slit | Superposition, Limit | intensity pattern + phasor strip |
| Tunnelling | Limit, Probability | `T(E)` curve + `|ψ|²` decay |
| Lorentz boost | Frame, Limit | Minkowski diagram |
| Maxwell–Boltzmann | Probability, Limit | `f(v)` + markers |
| Band structure | Limit, Symmetry | folded `E–k` + DOS |

## Anti-pattern

Do not use a concept type as a chapter heading ("Bölüm 3: Süperpozisyon"). It reads as abstraction with
no phenomenon. Tag internally; write the chapter around a concrete question ("İki yarık neden çizgi
yapar?").
