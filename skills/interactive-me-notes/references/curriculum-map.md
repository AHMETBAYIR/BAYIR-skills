# Curriculum map — where each ME course sits and what to draw

> Semester numbers are typical for Turkish mechanical engineering programmes (İTÜ, ODTÜ, Boğaziçi, Dokuz Eylül, GTÜ). Course codes and credit/ECTS change; verify against the current programme page before quoting them in a note.

## The eight-semester spine

| Semester | Core sequence | Mathematics / support | Representation that matters |
|---|---|---|---|
| 1 | Fizik I, Kimya, Teknik Resim | Kalkülüs I | orthographic views, dimension chains |
| 2 | Statik, Malzeme Bilgisi | Kalkülüs II, Lineer Cebir | free-body diagram, stress–strain |
| 3 | Dinamik, Mukavemet I | Diferansiyel Denklemler | trajectory, Mohr circle, V/M diagrams |
| 4 | Mukavemet II, Termodinamik I, Akışkanlar Mekaniği | Sayısal Yöntemler | stress element, p–v/T–s, Moody |
| 5 | Termodinamik II, Isı Transferi, Makine Elemanları I, Mekanizma Tekniği | Olasılık/İstatistik | cycle, resistance network, tolerance band, coupler curve |
| 6 | Makine Elemanları II, Makine Dinamiği/Titreşim, İmalat Yöntemleri | Control intro | gear tooth, frequency response, speed/feed |
| 7 | Otomatik Kontrol, FEM/Sonlu Elemanlar, Bitirme Projesi I | elective | block diagram, convergence, design report |
| 8 | Mekatronik/Seçmeli, Bitirme Projesi II | elective | integrated system, test evidence |

## Course-by-course: the one representation and the one misconception

| Course | Governing relation | Strongest representation | Recurring misconception | Lab? |
|---|---|---|---|---|
| Statik | ΣF=0, ΣM=0 | FBD, truss | reaction direction guessed; two-force member | yes — movable load on a truss |
| Dinamik | F=ma, T+V=const, ∫F dt=Δp | trajectory + energy bars | centripetal vs centrifugal; Coriolis sign | yes — projectile with drag |
| Mukavemet | σ=M c/I, τ=Tr/J, EI y''''=q | Mohr circle, V/M diagram | I vs W; principal vs max-shear plane | yes — stress element or beam cursor |
| Termodinamik | 1st/2nd law, η=W/Q | p–v and T–s | gauge vs absolute; °C in pV=mRT | yes — Otto/Rankine |
| Isı transferi | q''=−k∇T, Nu=hL/k | resistance network, fin profile | radiation in °C; fin efficiency vs effectiveness | yes — fin or LMTD |
| Akışkanlar | ρVD/μ, Darcy–Weisbach | Moody chart, system curve | f constant; Bernoulli across a pump | yes — pipe operating point |
| Makine elemanları | σ≤σ_em, L10=(C/P)^3·10^6 | tolerance band, gear tooth | H7/h6 as subtraction; L10 as average | yes — ISO 286 or gear |
| Mekanizma | loop closure, Grashof | coupler curve, transmission angle | DOF with redundant constraints; toggle | yes — four-bar drag |
| Titreşim | mẍ+cẋ+kx=F | frequency response, mode shape | resonance at r=1 only for undamped | yes — SDOF sweep |
| Kontrol | closed-loop poles, margins | step response, Bode | P reduces but does not remove type-0 ess | yes — PID with saturation |
| İmalat | vc, fz, Taylor | speed/feed chart, tolerance stack | vc in m/min vs rpm; resolution vs accuracy | yes — milling calculator |
| FEM | K u = f | convergence curve, deformed mesh | mesh = validation; point-load singularity | yes — 1D bar refinement |
| Teknik resim | projection, ISO 286/1101 | six views, tolerance frame | 1st vs 3rd angle; MMC bonus direction | yes — projection or GD&T |

## Programme differences worth knowing

- **İTÜ**: strong separate mukavemet sequence and a dedicated makine dinamiği/titreşim line; studio-like design courses. Notes should connect to the design project early.
- **ODTÜ**: English-medium; ME 201/202 mechanics, ME 203 thermodynamics, ME 304 fluids, ME 305 heat transfer, ME 307 machine elements, ME 403 control. Representation-heavy, lab reports in English.
- **Boğaziçi**: compact core with strong mechanics and thermo; ME 331/332 sequences; project-based capstone. Notes often need English/Turkish bilingual labels.
- **Dokuz Eylül**: large programme, separate termodinamik I–II and mukavemet I–II; applied manufacturing and machine design. Turkish terminology is the default.
- **GTÜ (Gebze Teknik)**: semester-based, English-medium in engineering; core mechanics/thermo/fluids then machine design and mechatronics. Course codes should be checked on the current Bologna page; do not assume İTÜ codes.

## What changes across the years

1. **Year 1–2** needs *reading* skills: axes, conventions, units, free bodies.
2. **Year 3** needs *selection* skills: which correlation, which standard table, which safety factor.
3. **Year 4** needs *integration* skills: a design report that connects load → stress → material → manufacturing → cost.

A note that teaches a formula without its selection rule is a year-2 note. A note that teaches a selection rule without a number is a year-4 note without evidence.

## Mapping a lecture to a note

| Source says | Note must add |
|---|---|
| “Assume a simply supported beam” | the support symbols, the sign convention, the validity limit |
| “Use the Moody chart” | the equation behind it, the iteration, the roughness source |
| “Select a bearing” | the load duty, the life target, the reliability adjustment |
| “Tune the PID” | the plant model, the saturation, the performance metric |

## Sources to re-check

- İTÜ Makine Mühendisliği lisans programı ve ders içerikleri.
- ODTÜ Mechanical Engineering undergraduate curriculum and course catalogue.
- Boğaziçi ME programme requirements.
- Dokuz Eylül Makine Mühendisliği ders planı.
- GTÜ Makine Mühendisliği Bologna bilgi paketi.
- ABET Criterion 3 student outcomes (for outcome wording, not for course content).
