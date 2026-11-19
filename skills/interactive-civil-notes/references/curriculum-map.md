# Civil engineering curriculum map (Türkiye)

Course codes and ECTS change; verify the current Bologna/ÖBS page before
quoting a code. This map is for sequencing and prerequisite intuition.

## Typical sequence

| Year | Core | Support | Representation |
|---|---|---|---|
| 1 | Statik, Malzeme Bilimi, Bilgisayar Programlama | Kalkülüs I–II, Lineer Cebir, Fizik | FBD, stress–strain, MATLAB/Python |
| 2 | Mukavemet I–II, Yapı Statiği I, Akışkanlar Mekaniği, Ölçme Bilgisi | Diferansiyel Denklemler, Sayısal Yöntemler | stress element, V/M, truss/frame, manometer |
| 3 | Yapı Statiği II, Betonarme I, Çelik Yapılar, Zemin Mekaniği I, Hidrolik | Olasılık/İstatistik | influence line, RC section, soil profile, Moody |
| 4 | Betonarme II, Çelik Yapılar II, Temel Mühendisliği, Ulaştırma, Yapı Yönetimi, Su Kaynakları | Seçmeli | connection, foundation, pavement, CPM |
| 4–5 | Bitirme / seçmeli | — | integrated design, report |

## Programme anchors (verify current pages)

| Programme | Structural analysis | RC / steel | Geotech | Hydraulics / transport |
|---|---|---|---|---|
| İTÜ İnşaat | INS 303/331 (Yapı Statiği) | INS 338 (Betonarme), INS 342 (Çelik) | INS 321/331 (Zemin) | INS 341 (Hidrolik), INS 361 (Ulaştırma) |
| ODTÜ CE | CE 271/371 (Structural Analysis) | CE 382 (RC), CE 384 (Steel) | CE 335 (Geotech) | CE 372/376 (Hydraulics), CE 361 (Transport) |
| YTÜ İnşaat | INS 3241/3242 | INS 3522 (Betonarme), INS 3532 (Çelik) | INS 3412 (Zemin) | INS 3242 (Hidroloji, elective), INS 3612 |
| Boğaziçi CE | CE 231/331 (Mechanics/Structures) | CE 354 (RC), CE 356 (Steel) | CE 335 | CE 241/311/312 (Fluids), CE 361 |
| KTÜ İnşaat | INS 3000-level analysis | INS 3000-level RC/steel | INS 3000-level geotech | INS 3000-level hydraulics/transport |

## The conceptual spine

1. **Equilibrium** (statics) → **compatibility** (mechanics) → **constitutive
   law** (materials) → **limit state** (design).
2. **Analysis** answers “what are the demands?”; **design** answers “is the
   capacity ≥ demand with the required ductility and detailing?”.
3. **Geotech** adds effective stress, drainage, and site variability.
4. **Hydraulics** adds energy, friction, free surface, and return period.
5. **Transport** adds human behaviour, safety, and empirical performance models.
6. **Construction** adds time, cost, quantity, and tolerance.

## Where the misconceptions live

| Course | Misconception | Note that fixes it |
|---|---|---|
| Statik | reaction direction guessed; zero-force member removed | truss lab; FBD ledger |
| Mukavemet | `σ = Mc/I` with full depth; `I` vs `W` | stress element; section properties |
| Yapı Statiği | one load position; sign convention mixed | influence line; moving load |
| Betonarme | `f_ck` used as design; only flexure checked | RC beam ledger; number families |
| Çelik | Euler load as capacity; `W_el` vs `W_pl` | column buckling lab; section class |
| Zemin | total stress = effective; no drainage | retaining wall lab; water table |
| Hidrolik | fixed `f=0.02`; Bernoulli across a pump | pipe/pump lab; Colebrook |
| Ulaştırma | design speed = operating speed | vertical curve + SSD lab |
| Yapı Yönetimi | cost = quantity × price; no risk | CPM + cost ledger |
| Deprem | `R` as safety factor | TBDY ELF + drift lab |
