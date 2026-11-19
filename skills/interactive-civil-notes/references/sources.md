# Source ledger — civil engineering

## Per-note schema

```json
{
  "sources": [
    {
      "id": "ts500",
      "title": "TS 500 — Betonarme Yapıların Tasarım ve Yapım Kuralları",
      "edition": "2000",
      "clause": "7.3 / 8.1",
      "url": "…",
      "accessed": "2026-11-12",
      "used_for": ["flexure", "shear", "ductility"]
    }
  ],
  "generated": [
    {
      "id": "beam-default",
      "command": "python3 scripts/check_civil.py beam 300 600 550 C30/37 B420C 250 200 3 25 8 200",
      "outputs": { "As_req_mm2": 1366, "M_Rd_kNm": 267.45, "V_r_kN": 209.65 }
    }
  ]
}
```

## Rules

- Every standard value has an `id`, `title`, `edition`, `clause`, and
  `accessed` date.
- Every generated value has the exact command that reproduces it.
- Soil/water/traffic data: record the site, test, date, and method; if it is a
  teaching value, label it.
- A screenshot of ETABS/SAP2000/PLAXIS is not a source; the model file and the
  assumptions are.
- Keep quotations short; paraphrase and cite the clause.
- Do not cite a standard you did not open.

## Source hierarchy

1. Code/standard/regulation (with edition and clause).
2. Peer-reviewed paper or official test report.
3. Textbook (chapter/section).
4. Manufacturer/test laboratory report (for a product).
5. Reputable practice article (context only).

## Red flags

- A number with no unit.
- A design stress compared to `f_ck`.
- A soil parameter with no source/range.
- A “FEA result” with no mesh/convergence.
- A “code check” with no edition.
- A “traffic count” with no date/location.
- A “cost” with no date/region.
