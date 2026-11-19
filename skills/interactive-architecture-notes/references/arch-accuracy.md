# Architecture accuracy rules

## The first question: is it code, convention, or teaching rule?

Every number in an architecture note belongs to one of three families:

| Family | Example | How to cite | Danger |
|---|---|---|---|
| **Code** | stair rise ≤ 160 mm; ramp 1:12; door clear width | standard + edition + clause | presenting an old edition as current |
| **Convention** | 2R+G = 600–640 mm; plan cut at 1.20 m; poché | “stüdyo konvansiyonu” | presenting it as law |
| **Teaching** | 0.30 m slab; 1.5 m landing for this exercise; 26 °C comfort threshold | “bu notun varsayımı” | hiding it in a footnote |

A code value without an edition is a rumour. A convention without a name is a
rule invented by the page.

## Units and dimensions

- Plans in **m**, details in **mm**; state the unit on the dimension line.
- Areas in **m²**; volumes in **m³**; U-value in **W/(m²·K)**; R-value in
  **m²·K/W**; illuminance in **lux**; sound reduction in **dB**; reverberation
  in **s**.
- Do not write `m²` for a length or `W/m²K` without parentheses.
- Decimal comma in Turkish prose, decimal point inside math: “3,00 m” but
  `$3.00\,\mathrm{m}$`.
- Significant figures: a 1:50 plan does not justify millimetre precision.

## Plan / section / elevation

- A plan is a cut; a section is a cut; an elevation is a projection. Do not
  use the words interchangeably.
- Poché only the cut; show what is beyond with a lighter line.
- A section must show the cut plane, the floor slabs, the structure, and the
  headroom. A section without a slab is a diagram, not a section.
- Check that the same wall, opening, stair and level appears in all three.

## Stairs / ramps / accessibility

- `R = H/N`; `2R+G`; headroom ≥ 2.20 m; landing ≥ 1.50 m; clear width;
  risers per flight; handrail; door swing.
- TS 9111:2011 is the Turkish accessibility reference used in the starter
  note. ADA/IBC are comparison only; they are not binding in Turkey.
- A ramp is not a stair with a slope: check 1:12, landings, clear width,
  turning circle, entrance table, and handrail.
- The stair lab is a 2D flat-slab, two-flight teaching model; it does not
  check fire, structure, handrail load, or winders.

## Daylight / thermal / acoustics

- **Daylight:** state the model. Average daylight factor (BRE split-flux) is
  not Radiance/ClimateStudio; a render is not a calculation. Give latitude,
  orientation, sky condition, window-to-wall ratio, and shading.
- **Thermal:** `U = 1/(R_si + ΣR + R_se)`. State the surface resistances and
  the layer lambdas. A steady-state 1D U-value ignores thermal bridges,
  moisture, and 2D/3D effects. Glaser is steady-state; it is not WUFI.
- **Acoustics:** Sabine `RT60 = 0.161 V/A` is a diffuse-field estimate; state
  the frequency band and the absorption coefficients. A single number without
  a band is not an acoustic design.
- **Comfort:** 26 °C is a studio teaching threshold, not an EN 16798-1
  compliance limit. Say so.

## Area and program

- Net vs gross; wall thickness; circulation; occupancy factor.
- A room area is not a program. A program is a list of activities, adjacencies,
  and performance requirements.
- If you use an occupancy factor, cite the code/edition or mark it teaching.

## Precedent and history

- Redraw at the same scale; cite the source; distinguish documented from
  inferred.
- Dates are approximate; a building can be started, completed, and opened in
  different years. Write “yaklaşık” when the source is not exact.
- Do not copy copyrighted drawings or photographs; draw a schematic and cite
  the source of the dimensions.
- History is interpretive: a timeline is not an argument. Pair it with a
  tectonic, spatial, or programmatic claim.

## Representation ethics

- No fake BIM/IFC screenshots; no render-as-evidence; no “the model solved it”
  without a drawing, a dimension, and a check.
- No AI-generated “precedent” images presented as real buildings.
- If a figure is schematic, label it at the point of use.
