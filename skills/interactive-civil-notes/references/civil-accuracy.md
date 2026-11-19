# Civil engineering accuracy rules

## Number families

| Family | Symbols | How obtained | Never compare to |
|---|---|---|---|
| Characteristic | `f_ck`, `f_yk`, `G_k`, `Q_k`, `S_u` | test/standard | design stress |
| Design | `f_cd=f_ck/γ_mc`, `f_yd=f_yk/γ_ms`, `S_d` | factored | characteristic strength |
| Allowable (ASD) | `F_em=F_y/Ω`, `q_em` | service-level | ultimate demand |

A design check is `S_d ≤ R_d`. An allowable check is `S_service ≤ R_allowable`.
Do not mix the two cultures in one ledger.

## Units and sign

- Use **N–mm–MPa** for RC/steel sections; **kN, kN·m** for frame results;
  **kPa** for soil; **m, m³/s** for hydraulics.
- `1 MPa = 1 N/mm²`; `1 kN·m = 10^6 N·mm`; `1 GPa = 1000 MPa`.
- State the sign convention once: sagging positive; tension positive;
  clockwise positive; compression positive in soil (or state otherwise).
- Do not write `kN/m²` for a moment or `mm⁴` for a section modulus.

## Load combinations

| Code | Ultimate | Service | Note |
|---|---|---|---|
| TS 500 §6.2.6 | `1.4G + 1.6Q` | `G + Q` | RC buildings |
| TBDY 2018 §4.4.4.1 | `G + Q + E_d`; `0.9G + E_d` | — | earthquake; `E_d` includes R/I |
| EN 1990 | `1.35G + 1.5Q` | `G + Q` | Eurocode |
| AISC LRFD | `1.2D + 1.6L` | — | steel |
| AISC ASD | — | `D + L` | allowable |

`R` in TBDY is a **response modification factor**, not a safety factor. Drift
is amplified by `R/I`; the base shear is reduced by `R/I`.

## RC

- TS 500 block: `0.85 f_cd`, `k_1`, `ε_cu = 0.003`.
- `C = T`; `M_Rd = C(d − a/2)`; `a = A_s f_yd/(0.85 f_cd b)`.
- Check `A_s,min`, `ρ ≤ min(0.85ρ_b, 0.02)`, `ε_s ≥ ε_yd`, `V_r = V_c + V_w`,
  `V_d ≤ V_max = 0.22 f_cd b_w d`, `s ≤ s_max`, anchorage, cover, detailing.
- A capacity ratio below 1.0 with a brittle mode is not automatically safe.
- Do not use a T-beam or doubly reinforced formula without saying so.

## Steel

- Section class (1–4); `W_pl` vs `W_el`; `χ` from the buckling curve;
  `N_b,Rd = χ A f_y/γ_M1`.
- Euler load `N_cr = π²EI/L²` is not a design capacity.
- Check bolt/weld failure modes, block shear, connection eccentricity, fire.
- `γ_M0`, `γ_M1` are nationally determined; state the values used.

## Geotech

- Total stress `σ = σ' + u`; effective stress controls strength and settlement.
- Drained (`c'`, `φ'`) vs undrained (`S_u`) is a design decision, not a detail.
- Bearing capacity: ultimate `q_ult`, allowable `q_em = q_ult/FS`, settlement
  separate. FS and LRFD are different cultures.
- Retaining wall: overturning, sliding, bearing, tension; water and drainage
  change all four.
- Slope: limit equilibrium gives a factor of safety against a assumed surface;
  it is not a probability of failure.
- Soil parameters are site-specific; give a source or a range, never a single
  invented number.

## Hydraulics

- Energy: `H_p = H_st + h_f + h_m` across a pump; Bernoulli without the pump
  term is wrong.
- Friction: Colebrook–White; `f` depends on `Re` and `ε/D`; a fixed `0.02` is a
  teaching simplification, not a general value.
- Open channel: Manning `Q=(1/n)A R_h^{2/3} S^{1/2}`; `n` is empirical; the
  normal depth is not the critical depth.
- Hydrology: state the return period and the method (rational, unit hydrograph).

## Transport

- Design speed ≠ operating speed ≠ posted speed.
- Vertical curve: `K = L/|A|`; SSD from `S = Vt + V²/(2g(f±G))`.
- Pavement design is empirical (AASHTO 1993) or mechanistic-empirical; say
  which, and give the ESAL and reliability.
- Traffic flow: speed–density–flow; capacity and LOS are not the same.

## Collapse modes

Every capacity check names the mode:

| Element | Ductile | Brittle |
|---|---|---|
| RC beam | flexural yielding | shear, anchorage, compression block |
| Steel column | yielding | local buckling, overall buckling |
| Retaining wall | — | overturning, sliding, bearing, piping |
| Slope | — | shear failure, liquefaction |
| Connection | bolt yield | block shear, weld fracture |

## Standards and copyright

Cite edition and clause. Do not reproduce a full table. A small subset with a
citation is acceptable. National adoptions (TS EN) can lag; say which you used.
