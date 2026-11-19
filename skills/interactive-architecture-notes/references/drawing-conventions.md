# Drawing conventions

## The triad

| Drawing | Projection | What it answers | Common error |
|---|---|---|---|
| Plan | horizontal cut, usually ~1.20 m above floor | circulation, room adjacency, openings, structure | drawing a roof plan and calling it a plan |
| Section | vertical cut, looking in one direction | height, headroom, structure–envelope, light | zero-thickness walls, no cut poché |
| Elevation | orthographic projection, no cut | facade rhythm, openings, material | showing interior depth that is not visible |

The same element must be consistent across all three. A stair that fits in plan
but not in section is the canonical example.

## Scale

- Site / urban: 1:500, 1:1000, 1:2000.
- Floor plan: 1:50, 1:100, 1:200.
- Detail: 1:5, 1:10, 1:20.
- Every sheet gets a **scale bar**; site/floor plans get a **north arrow**.
- If a drawing is schematic, write **“şematik / not to scale”** next to it.
- Never mix scales in one figure without separate bars.

## Line weights and poché

- Cut elements: heavy line + poché (solid or hatch).
- Beyond the cut: medium line, less detail.
- Grid / reference: light dashed.
- Dimension / leader: thin.
- Do not use colour alone to distinguish cut/beyond; use weight and hatch too.
- Grayscale test: print the page in black and white; the hierarchy must survive.

## Dimension chains

- One chain must close: `A + B + C = total`.
- mm in details, m in plans; state the unit once per chain.
- Distinguish **nominal** (module), **clear** (opening), and **structural** dimensions.
- Door clear width ≠ module width; stair going ≠ tread width; room area ≠ program area.
- Put the dimension line outside the drawing where possible; avoid crossing leaders.

## Stairs and ramps

- `R = H/N` (rise = floor-to-floor / number of risers).
- `2R + G` is a comfort relation, not a code; report it separately.
- Check: headroom ≥ 2.20 m, landing ≥ 1.50 m, clear width, risers per flight,
  handrail, door swing, fire egress.
- A stair can pass in plan and fail in section. Draw both.
- Ramp: 1:12 max (TS 9111), landing at top/bottom and at each 0.76 m rise;
  check clear width, turning circle, and entrance table.

## Precedent drawings

- Redraw at the **same scale** as the analysis; do not trace a render.
- Cite the source drawing; distinguish documented from inferred.
- Show what was kept, what was changed, and why.
- A collage is not a precedent analysis; it has no scale and no argument.

## Digital drawing

- BIM/IFC is a model, not evidence of a design decision; show the plan/section
  extracted from it and the parameter that changed.
- If you use a screenshot, say which view, which level, and what is omitted.
- Do not present a rendered perspective as a measured drawing.
