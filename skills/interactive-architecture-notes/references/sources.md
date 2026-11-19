# Source ledger — architecture

## Per-note schema

```json
{
  "sources": [
    {
      "id": "ts9111",
      "title": "TS 9111 — Özürlüler ve Hareket Kısıtlılığı Bulunan Bireyler İçin Binalarda Ulaşılabilirlik Gerekleri",
      "edition": "2011",
      "clause": "4.7.1.3.1",
      "url": "…",
      "accessed": "2026-11-12",
      "used_for": ["stair rise", "ramp slope", "headroom"]
    }
  ],
  "generated": [
    {
      "id": "stair-default",
      "command": "python3 scripts/check_arch.py stair 3.0 19 300 1.5 1.5 8.0 4.0 0.30 konut accessible",
      "outputs": { "R_mm": 157.9, "2R_G_mm": 615.8, "h_min_m": 1.28 }
    }
  ]
}
```

## Rules

- Every external number has an `id`, a `title`, an `edition`, and an
  `accessed` date. A URL alone is not a citation.
- A generated number has the exact command that reproduces it.
- If a source is a drawing, record the sheet number, scale, and archive.
- If a source is a lecture, record the course, week, and file name.
- Do not cite a source you did not open. Do not cite a page you only saw in a
  search snippet.
- Distinguish **documented** from **inferred** in the note, especially for
  precedent dimensions.
- Keep quotations short; paraphrase the clause and cite it.

## Source hierarchy

1. Standard / code / official regulation (with edition).
2. Peer-reviewed or official technical report.
3. Textbook (chapter/section).
4. Manufacturer technical guide (for a product, not for a code).
5. Reputable practice article (for context, not for a value).

## Red flags

- A number with no unit.
- A code claim with no edition.
- A precedent with no drawing source.
- A “daylight factor” with no sky condition.
- A “U-value” with no layer list.
- A timeline with no argument.
