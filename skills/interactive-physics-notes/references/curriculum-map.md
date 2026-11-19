# Curriculum map (Türkiye)

> **Status field is mandatory.** `verified` means a programme/catalogue page was read during this research
> (Nov 2026). `unverified` means do not print the code. Catalogues drift every year; the note targets
> content, not the code.

## 1. Two institutional paths

| Path | Character | Consequence for the note |
|---|---|---|
| **Fizik** (Fen / Fen-Edebiyat Fakültesi) | theoretical, heavier maths, early electives | derivations can assume calculus and linear algebra |
| **Fizik Mühendisliği** | common physics pool + advanced repeat, more lab | start from the phenomenon, add the formalism second |

The same topic appears twice: once as a service course (Fizik I/II) and once as a department course
(Klasik Mekanik, EM Teori, Kuantum I–II). Write for one audience; do not blend.

## 2. Verified chains (examples)

### Mechanics
| University | Course | Semester | Status |
|---|---|---|---|
| İTÜ | FIZ 101 / FIZ 101E, FIZ 102 / 102E | 1–2 | verified (common pool) |
| ODTÜ | PHYS 109 → PHYS 335 → PHYS 336 | 1 → 5 → 6 | verified |
| Boğaziçi | PHYS 121; PHYS 301; PHYS 302 | 1; 5; 6 | verified |
| DEÜ | FİZ 1013; FİZ 3901 (Analitik Mekanik) | 1; 5 | verified (2021–22 catalogue) |
| GTÜ | PHYS 121; PHYS 204; PHYS 424 | 1; —; — | verified from programme |

**Trap:** ODTÜ has no `PHYS 301` in the physics programme; Boğaziçi `PHYS 201` is EM, not mechanics;
İTÜ's classical mechanics code for Fizik Mühendisliği was not published.

### Electromagnetism
| University | Course | Status |
|---|---|---|
| İTÜ | FIZ 102 (service); advanced EM theory code not verified | partial |
| ODTÜ | PHYS 106 → PHYS 331 / 332 | verified |
| Boğaziçi | PHYS 202 → PHYS 401 / 402 | verified |
| GTÜ | FİZ 122 | verified |
| DEÜ | FİZ 1102 (2015–16 archive) | archive only |

**Trap:** `PHYS 311` (ODTÜ) and `PHYS 431` (Boğaziçi) are not the EM sequence.

### Waves and optics
| University | Course | Status |
|---|---|---|
| İTÜ | FIZ 214 (waves); FIZ 201 is modern physics | verified |
| ODTÜ | PHYS 221 (optics); PHYS 203 is electronics | verified |
| Others | optics usually an elective in years 3–4 | unverified |

**Trap:** the brief's "FIZ 201 = waves" and "PHYS 203 = optics" were both wrong.

### Thermodynamics and statistical mechanics
| University | Course | Status |
|---|---|---|
| İTÜ | FIZ 274 (4/6) → FIZ 310 (4/8) | verified |
| ODTÜ | PHYS 213 (heat); PHYS 430 / 429 (advanced); **PHYS 251 is Properties of Matter I** | verified |
| Boğaziçi | PHYS 421 | verified (credits unverified) |
| DEÜ | FİZ 3016 (old, 8 ECTS) vs FİZ 3904 (current, 6 ECTS) | version conflict |
| GTÜ | PHYS 302 | semester varies 5/6 |

**Trap:** `FIZ 224` does not exist in the İTÜ chain.

### Modern physics and quantum
| University | Course | Status |
|---|---|---|
| İTÜ | **FIZ 215** (modern physics); FIZ 213 is the old "Genel Fizik III" | verified |
| ODTÜ | PHYS 202 (AKTS 9 on programme page, 6 in catalogue) | conflict |
| DEÜ | PHY 3001 | semester inferred |
| GTÜ | FİZ 303 (ECTS 8 on form, 6 in catalogue) | conflict |

### Condensed matter and nuclear
| University | Course | Status |
|---|---|---|
| İTÜ | FIZ 431E / 436 (solid state); FIZ 433 / 496 (nuclear). **FIZ 362 = Mathematical Methods II, not solid state** | verified |
| ODTÜ | PHYS 402 / 403 (nuclear I–II); solid state years 7–8 | verified |
| DEÜ | FİZ 4910 (nuclear) | verified |
| GTÜ | FİZ 404 (nuclear & particle) | verified |

### Computational physics
| University | Course | Status |
|---|---|---|
| İTÜ | FIZ 272E / FIZ 241E | credits partly unverified |
| ODTÜ | PHYS 343 / 443 / 444 | verified |
| DEÜ | FİZ 2108 (semester 4, 2+2, 6 ECTS) | verified |
| Boğaziçi | computational option exists; code page 404 | unverified |
| GTÜ | no dedicated compulsory course | verified 2023–24 plan |

### Laboratory
| University | Course | Status |
|---|---|---|
| İTÜ / ODTÜ / Boğaziçi / GTÜ | Fizik Lab I–IV variants | verified |
| DEÜ | physics department lab code **not verified**; `FIZ 1103` belongs to Physics Teacher Education | do not use |

## 3. Catalogue traps

1. **Same number, different course** across universities (PHYS 201, PHYS 301).
2. **Same course, different number** across years (DEÜ 3016 → 3904).
3. **AKTS conflicts** between the programme page and the course catalogue (Boğaziçi, ODTÜ, GTÜ).
4. **Service vs department** sections with different credits (ODTÜ PHYS 202).
5. **Retired codes** still visible in old PDFs (İTÜ FIZ 213, DEÜ FİZ 3016).
6. **Wrong faculty** (DEÜ FIZ 1103 is teacher education, not physics).

## 4. What to write instead of a code

```html
<td>Kuantum Mekaniği I <span class="flag">kod doğrulanamadı</span></td>
```

or

```html
<td>FIZ 215 <span class="src">[katalog, 12.11.2026]</span></td>
```

A visible gap is a feature. It tells the reader which part of the map is surveyed and which is inferred.

## 5. Outcomes that recur

Across programmes, the first-year outcomes converge on:

1. draw a free-body diagram and write Newton's equations;
2. predict with conservation laws when direct integration fails;
3. classify a central-force orbit from energy and angular momentum;
4. compute a moment of inertia and apply the rolling condition;
5. derive Lagrange/Hamilton equations and find normal modes.

For later courses: set up a boundary-value problem, solve a 1D Schrödinger equation, compute a density of
states, and estimate an uncertainty. These five are good defaults for a note's learning outcomes.
