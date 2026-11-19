#!/usr/bin/env python3
"""Independent numeric checks for the civil engineering lab layer.

Usage:
    python3 check_civil.py beam 300 600 550 C30/37 B420C 250 220 3 25 8 200
    python3 check_civil.py column 7800 89.3 235 6000 1.0 0.34 900
    python3 check_civil.py retaining 4.0 3.3 0.5 32 18 20 10 2.0 0
    python3 check_civil.py manning 3.0 5.0 0.001 0.013
    python3 check_civil.py drift 4 3.5 400 0.8 0.3 7 1.0 120000
    python3 check_civil.py truss
    python3 check_civil.py selftest

Unit system: N, mm, MPa, kN, kN·m unless stated. Sagging positive; tension
positive. These are teaching checks, not construction design.
"""

from __future__ import annotations

import math
import sys

import numpy as np

FAILS = 0


def check(name: str, condition: bool, detail: str = "") -> None:
    global FAILS
    if condition:
        print(f"  PASS  {name}")
    else:
        FAILS += 1
        print(f"  FAIL  {name} {detail}")


def near(a: float, b: float, tol: float = 1e-6) -> bool:
    return abs(a - b) <= tol * max(1.0, abs(a), abs(b))


CONCRETE = {
    "C25/30": (25.0, 1.8, 0.85),
    "C30/37": (30.0, 1.9, 0.82),
    "C35/45": (35.0, 2.1, 0.79),
    "C40/50": (40.0, 2.2, 0.76),
    "C45/55": (45.0, 2.3, 0.73),
    "C50/60": (50.0, 2.5, 0.70),
}
STEEL = {"B420C": 420.0, "B500C": 500.0}
GAMMA_MC, GAMMA_MS, ES, ECU = 1.5, 1.15, 200_000.0, 0.003


def beam_check(b: float, h: float, d: float, conc: str, steel: str,
               Md: float, Vd: float, n: int, phi: float, phis: float,
               s: float) -> dict:
    fck, fctk, k1 = CONCRETE[conc]
    fyk = STEEL[steel]
    fcd, fctd, fyd = fck / GAMMA_MC, fctk / GAMMA_MC, fyk / GAMMA_MS
    eps_yd = fyd / ES
    d = min(d, h - 20.0)

    cb_d = ECU / (ECU + eps_yd)
    ab_d = k1 * cb_d
    rho_b = 0.85 * fcd * ab_d / fyd
    rho_max = min(0.85 * rho_b, 0.02)
    alpha_max = rho_max * fyd / (0.85 * fcd)
    mu_max = 0.85 * alpha_max * (1 - alpha_max / 2)
    Mlim = mu_max * b * d * d * fcd / 1e6

    mu = Md * 1e6 / (b * d * d * fcd)
    feasible = mu <= mu_max + 1e-12
    alpha = 1 - math.sqrt(max(0.0, 1 - 2 * mu / 0.85)) if feasible else alpha_max
    a_req = alpha * d
    As_flex = 0.85 * fcd * b * a_req / fyd
    As_min = 0.8 * fctd / fyd * b * d
    As_req = max(As_flex, As_min)
    As_max = rho_max * b * d

    As_prov = n * math.pi * phi * phi / 4
    a_y = As_prov * fyd / (0.85 * fcd * b)
    x_y = a_y / k1
    eps_y = ECU * (d - x_y) / x_y if x_y > 0 else float("inf")
    if eps_y >= eps_yd and x_y < d:
        x, a, eps_s, yields = x_y, a_y, eps_y, True
    else:
        lo, hi = 1e-7, d - 1e-7
        for _ in range(120):
            mid = 0.5 * (lo + hi)
            C = 0.85 * fcd * b * k1 * mid
            eps = ECU * (d - mid) / mid
            T = As_prov * min(ES * eps, fyd)
            if C - T > 0:
                hi = mid
            else:
                lo = mid
        x = 0.5 * (lo + hi)
        a = k1 * x
        eps_s = ECU * (d - x) / x
        yields = False
    C = 0.85 * fcd * b * a
    T = As_prov * (fyd if yields else min(ES * eps_s, fyd))
    M_Rd = C * (d - a / 2) / 1e6
    rho = As_prov / (b * d)
    n_fit = max(1, int((b - 25) / (phi + 25)))

    Vcr = 0.65 * fctd * b * d
    Vc = 0.8 * Vcr
    Vmax = 0.22 * fcd * b * d
    Asw = 2 * math.pi * phis * phis / 4
    Asw_s = Asw / s
    Vw = Asw_s * fyd * d
    Vr = Vc + Vw
    Asw_s_min = 0.3 * fctd * b / fyd
    s_max = d / 2
    if Vd * 1e3 > 3 * Vcr:
        s_max = min(s_max, d / 4)

    rows = {
        "flexure": (Md / M_Rd, f"M_Rd = {M_Rd:.1f} kN·m"),
        "ductility": (rho / rho_max, f"ρ_max = {rho_max*100:.2f}%"),
        "minsteel": (As_min / As_prov, f"As,min = {As_min:.0f} mm²"),
        "shear": (Vd * 1e3 / Vr, f"V_r = {Vr/1e3:.1f} kN"),
        "strut": (Vd * 1e3 / Vmax, f"V_max = {Vmax/1e3:.1f} kN"),
        "minstirrup": (Asw_s_min / Asw_s, f"(Asw/s)min = {Asw_s_min:.3f}"),
        "spacing": (s / s_max, f"s_max = {s_max:.0f} mm"),
        "layout": (n / n_fit, f"n_fit = {n_fit}"),
        "singlelimit": (Md / Mlim, f"M_Rd,lim = {Mlim:.1f} kN·m"),
    }
    gov = max(rows, key=lambda k: rows[k][0])
    all_pass = all(v[0] <= 1 + 1e-9 for v in rows.values()) and eps_s / eps_yd >= 1 - 1e-9
    return {"b": b, "h": h, "d": d, "fck": fck, "fcd": fcd, "fctd": fctd,
            "fyd": fyd, "eps_yd": eps_yd, "As_req": As_req, "As_min": As_min,
            "As_prov": As_prov, "As_max": As_max, "rho": rho, "rho_max": rho_max,
            "M_Rd": M_Rd, "Mlim": Mlim, "x": x, "a": a, "x_d": x / d,
            "eps_s": eps_s, "eps_ratio": eps_s / eps_yd, "yields": yields,
            "C": C, "T": T, "z": d - a / 2, "Vr": Vr, "Vc": Vc, "Vw": Vw,
            "Vmax": Vmax, "Vcr": Vcr, "s_max": s_max, "n_fit": n_fit,
            "rows": rows, "governing": gov, "all_pass": all_pass,
            "feasible": feasible}


def steel_column(A: float, i: float, fy: float, L: float, K: float,
                 alpha: float, gamma_m1: float = 1.0) -> dict:
    lam = K * L / i
    lam1 = math.pi * math.sqrt(210_000.0 / fy)
    lbar = lam / lam1
    phi = 0.5 * (1 + alpha * (lbar - 0.2) + lbar ** 2)
    chi = min(1.0, 1 / (phi + math.sqrt(max(phi ** 2 - lbar ** 2, 0.0))))
    Npl = A * fy / 1e3
    Nb = chi * Npl / gamma_m1
    return {"lambda": lam, "lambda1": lam1, "lambda_bar": lbar, "phi": phi,
            "chi": chi, "N_pl": Npl, "N_b": Nb}


GAMMA_W, GAMMA_C, D_BASE = 9.81, 24.0, 0.60
FS_REQ = {"devrilme": 2.00, "kayma": 1.50, "taşıma": 3.00}


def retaining(H: float, B: float, t: float, phi_deg: float, gamma: float,
              gamma_sat: float, q: float, z_w: float, drainage: bool) -> dict:
    phi = math.radians(phi_deg)
    Ka = math.tan(math.pi / 4 - phi / 2) ** 2
    Htot = H + D_BASE
    zw = Htot if drainage else min(max(z_w, 0.0), Htot)

    def sigv(z):
        return q + gamma * min(z, zw) + gamma_sat * max(0.0, z - zw)

    def pore(z):
        return 0.0 if drainage else GAMMA_W * max(0.0, z - zw)

    def pa(z):
        return Ka * (sigv(z) - pore(z))

    def segment(z1, z2):
        L = z2 - z1
        if L <= 1e-12:
            return 0.0, 0.0
        p1, p2 = pa(z1), pa(z2)
        a = Htot - z1
        P = 0.5 * (p1 + p2) * L
        M = L * (a * (p1 + p2) / 2 - L * (p1 + 2 * p2) / 6)
        return P, M

    Pa1, Ma1 = segment(0, zw)
    Pa2, Ma2 = segment(zw, Htot)
    Pa, Ma = Pa1 + Pa2, Ma1 + Ma2
    if (not drainage) and zw < Htot:
        hw = Htot - zw
        Pw = 0.5 * GAMMA_W * hw * hw
        Mw = Pw * hw / 3
    else:
        Pw = Mw = 0.0

    Ltoe = B / 3
    Lheel = B - Ltoe - t
    Ws = GAMMA_C * t * H
    xs = Ltoe + t / 2
    Wb = GAMMA_C * B * D_BASE
    xb = B / 2
    soil_w = Lheel * (gamma * min(H, zw) + gamma_sat * max(0.0, H - zw))
    xsoil = Ltoe + t + Lheel / 2
    Wq = q * Lheel
    N = Ws + Wb + soil_w + Wq
    MR = Ws * xs + Wb * xb + (soil_w + Wq) * xsoil
    MO = Ma + Mw
    Fs_ot = MR / MO if MO > 0 else float("inf")
    mu = math.tan(0.8 * phi)
    Hdrive = Pa + Pw
    Fs_sl = N * mu / Hdrive if Hdrive > 0 else float("inf")
    e = B / 2 - (MR - MO) / N
    eabs = abs(e)
    if eabs <= B / 2:
        qmax = N / B * (1 + 6 * eabs / B)
        qmin = N / B * (1 - 6 * eabs / B)
    else:
        qmax = qmin = float("nan")
    Nq = math.exp(math.pi * math.tan(phi)) * math.tan(math.pi / 4 + phi / 2) ** 2
    Nc = (Nq - 1) / math.tan(phi) if phi > 0 else 5.14
    Ng = 2 * (Nq + 1) * math.tan(phi)
    Beff = max(B - 2 * eabs, 0.1 * B)
    qult = gamma * D_BASE * Nq + 0.5 * gamma * Beff * Ng
    qallow = qult / 3
    Fs_b = qult / qmax if qmax and not math.isnan(qmax) and qmax > 0 else 0.0
    util = {"devrilme": FS_REQ["devrilme"] / Fs_ot,
            "kayma": FS_REQ["kayma"] / Fs_sl,
            "taşıma": FS_REQ["taşıma"] / Fs_b if Fs_b > 0 else float("inf"),
            "çekme": eabs / (B / 6)}
    gov = max(util, key=util.get)
    return {"Ka": Ka, "Htot": Htot, "zw": zw, "Pa": Pa, "Ma": Ma,
            "Pw": Pw, "Mw": Mw, "N": N, "MR": MR, "MO": MO,
            "Fs_ot": Fs_ot, "Fs_sl": Fs_sl, "Fs_b": Fs_b, "e": e,
            "qmax": qmax, "qmin": qmin, "qult": qult, "qallow": qallow,
            "util": util, "gov": gov,
            "all_pass": all(v <= 1 + 1e-9 for v in util.values())}


def manning(b: float, Q: float, S0: float, n: float) -> dict:
    def q_of(y):
        A = b * y
        P = b + 2 * y
        R = A / P
        return (1 / n) * A * R ** (2 / 3) * math.sqrt(S0)

    lo, hi = 1e-6, 20.0
    for _ in range(120):
        mid = 0.5 * (lo + hi)
        if q_of(mid) < Q:
            lo = mid
        else:
            hi = mid
    y = 0.5 * (lo + hi)
    A = b * y
    P = b + 2 * y
    R = A / P
    V = Q / A
    Fr = V / math.sqrt(9.81 * y)
    yc = (Q * Q / (9.81 * b * b)) ** (1 / 3)
    return {"y": y, "A": A, "P": P, "R": R, "V": V, "Fr": Fr, "yc": yc,
            "regime": "süperkritik" if y < yc else "subkritik"}


def drift(N: int, hs: float, m_story: float, SDS: float, SD1: float,
          R: float, I: float, k_story: float) -> dict:
    H = N * hs
    Tp = 0.07 * H ** 0.75
    TA, TB, TL = 0.2 * SD1 / SDS, SD1 / SDS, 6.0
    Sae = SDS if Tp <= TB else (SD1 / Tp if Tp <= TL else SD1 * TL / Tp ** 2)
    SaR = Sae / (R / I)
    mt = N * m_story
    Vt = mt * SaR * 9.81
    Vmin = 0.04 * mt * I * SDS * 9.81
    V = max(Vt, Vmin)
    dF = 0.0075 * N * V
    den = sum(m_story * (i + 1) * hs for i in range(N))
    F = [(V - dF) * m_story * (i + 1) * hs / den for i in range(N)]
    F[-1] += dF
    shears, acc = [], 0.0
    for Fi in F:
        acc += Fi
        shears.append(acc)
    ratios = [(R / I) * (Vi / k_story) / hs for Vi in shears]
    return {"H": H, "Tp": Tp, "Sae": Sae, "SaR": SaR, "Vt": Vt,
            "Vmin": Vmin, "V": V, "F": F, "shears": shears,
            "ratios": ratios, "max_ratio": max(ratios), "limit": 0.008}


def truss_triangle() -> dict:
    # Nodes: A(0,0), B(4,0), C(2,3). Members AB, AC, BC. A pin, B roller.
    nodes = np.array([[0.0, 0.0], [4.0, 0.0], [2.0, 3.0]])
    members = [(0, 1), (0, 2), (1, 2)]
    E, A = 200e9, 5e-3
    K = np.zeros((6, 6))
    for i, j in members:
        xi, yi = nodes[i]
        xj, yj = nodes[j]
        L = math.hypot(xj - xi, yj - yi)
        c, s = (xj - xi) / L, (yj - yi) / L
        k = E * A / L * np.array([[c*c, c*s, -c*c, -c*s],
                                  [c*s, s*s, -c*s, -s*s],
                                  [-c*c, -c*s, c*c, c*s],
                                  [-c*s, -s*s, c*s, s*s]])
        dofs = [2*i, 2*i+1, 2*j, 2*j+1]
        for a in range(4):
            for b in range(4):
                K[dofs[a], dofs[b]] += k[a, b]
    # Supports: A x,y fixed; B y fixed. Free DOFs: Bx, Cx, Cy.
    free = [2, 4, 5]
    F = np.zeros(6)
    F[5] = -10e3  # 10 kN down at C
    Kff = K[np.ix_(free, free)]
    u = np.linalg.solve(Kff, F[free])
    U = np.zeros(6)
    U[free] = u
    forces = {}
    for idx, (i, j) in enumerate(members):
        xi, yi = nodes[i]
        xj, yj = nodes[j]
        L = math.hypot(xj - xi, yj - yi)
        c, s = (xj - xi) / L, (yj - yi) / L
        ue = np.array([U[2*i], U[2*i+1], U[2*j], U[2*j+1]])
        N = E * A / L * np.array([-c, -s, c, s]) @ ue
        forces[idx] = N / 1e3
    return {"U": U, "forces": forces, "residual": float(np.linalg.norm((K @ U - F)[free]))}


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    cmd = sys.argv[1].lower()

    if cmd == "beam":
        vals = sys.argv[2:]
        if len(vals) < 11:
            print("usage: beam b h d conc steel Md Vd n phi phis s")
            return 2
        b, h, d = map(float, vals[0:3])
        conc, steel = vals[3], vals[4]
        Md, Vd, n, phi, phis, s = map(float, vals[5:11])
        r = beam_check(b, h, d, conc, steel, Md, Vd, int(n), phi, phis, s)
        print(f"  As,req = {r['As_req']:.0f} mm²   As,prov = {r['As_prov']:.0f} mm²")
        print(f"  M_Rd = {r['M_Rd']:.2f} kN·m   V_r = {r['Vr']/1e3:.2f} kN   "
              f"ρ = {r['rho']*100:.2f}%   εs/εyd = {r['eps_ratio']:.2f}")
        for key, (u, cap) in r["rows"].items():
            print(f"  {'PASS' if u <= 1 + 1e-9 else 'FAIL'}  {key:12s} {u*100:7.1f}%  {cap}")
        print(f"  governing: {r['governing']}   all_pass: {r['all_pass']}")
        check("beam: C=T", near(r["C"], r["T"], 1e-6))
        check("beam: M_Rd = C(d-a/2)", near(r["M_Rd"], r["C"] * r["z"] / 1e6, 1e-9))
        check("beam: As,prov <= As,max", r["As_prov"] <= r["As_max"] + 1e-9)
        return 0 if not FAILS else 1

    if cmd == "column":
        A, i, fy, L, K, alpha, NEd = map(float, sys.argv[2:9])
        r = steel_column(A, i, fy, L, K, alpha)
        print(f"  λ = {r['lambda']:.1f}  λ̄ = {r['lambda_bar']:.3f}  χ = {r['chi']:.3f}")
        print(f"  N_pl = {r['N_pl']:.0f} kN   N_b,Rd = {r['N_b']:.0f} kN   N_Ed = {NEd:.0f} kN")
        print(f"  utilization = {NEd/r['N_b']*100:.1f}%")
        check("column: chi in (0,1]", 0 < r["chi"] <= 1)
        check("column: N_b <= N_pl", r["N_b"] <= r["N_pl"] + 1e-9)
        return 0 if not FAILS else 1

    if cmd == "retaining":
        vals = sys.argv[2:]
        if len(vals) < 9:
            print("usage: retaining H B t phi gamma gamma_sat q z_w drainage(0|1)")
            return 2
        H, B, t, phi, gamma, gsat, q, zw = map(float, vals[0:8])
        drainage = bool(int(vals[8]))
        r = retaining(H, B, t, phi, gamma, gsat, q, zw, drainage)
        print(f"  Ka = {r['Ka']:.4f}   Pa = {r['Pa']:.2f} kN/m   Pw = {r['Pw']:.2f} kN/m")
        print(f"  FS_overturning = {r['Fs_ot']:.2f}   FS_sliding = {r['Fs_sl']:.2f}   "
              f"FS_bearing = {r['Fs_b']:.2f}")
        print(f"  e = {r['e']:.3f} m   q_max = {r['qmax']:.1f} kPa   q_ult = {r['qult']:.1f} kPa")
        for k, v in r["util"].items():
            print(f"  {'PASS' if v <= 1 + 1e-9 else 'FAIL'}  {k:10s} {v*100:6.1f}%")
        print(f"  governing: {r['gov']}")
        check("retaining: Ka = tan²(45-φ/2)", near(r["Ka"], math.tan(math.pi/4 - math.radians(phi)/2)**2, 1e-9))
        check("retaining: e <= B/6 for no tension", abs(r["e"]) <= B/6 + 1e-9)
        return 0 if not FAILS else 1

    if cmd == "manning":
        b, Q, S0, n = map(float, sys.argv[2:6])
        r = manning(b, Q, S0, n)
        print(f"  y_n = {r['y']:.4f} m   y_c = {r['yc']:.4f} m   regime = {r['regime']}")
        print(f"  A = {r['A']:.3f} m²   R = {r['R']:.3f} m   V = {r['V']:.3f} m/s   Fr = {r['Fr']:.3f}")
        check("manning: Q = (1/n) A R^(2/3) sqrt(S0)",
              near((1/n)*r["A"]*r["R"]**(2/3)*math.sqrt(S0), Q, 1e-6))
        return 0 if not FAILS else 1

    if cmd == "drift":
        N, hs, m, SDS, SD1, R, I, k = map(float, sys.argv[2:10])
        r = drift(int(N), hs, m, SDS, SD1, R, I, k)
        print(f"  Tp = {r['Tp']:.3f} s   SaR = {r['SaR']:.3f} g   Vt = {r['Vt']:.1f} kN   "
              f"V = {r['V']:.1f} kN")
        print(f"  max drift ratio = {r['max_ratio']:.5f}   limit = {r['limit']:.3f}   "
              f"{'PASS' if r['max_ratio'] <= r['limit'] else 'FAIL'}")
        check("drift: sum F = V", near(sum(r["F"]), r["V"], 1e-9))
        check("drift: story shears decrease upward", all(r["shears"][i] >= r["shears"][i+1] for i in range(len(r["shears"])-1)))
        return 0 if not FAILS else 1

    if cmd == "truss":
        r = truss_triangle()
        print("  member forces (kN, + tension):")
        for idx, f in r["forces"].items():
            print(f"    M{idx+1}: {f:+.3f}")
        print(f"  residual = {r['residual']:.2e}")
        check("truss: equilibrium residual < 1e-6", r["residual"] < 1e-6)
        check("truss: at least one diagonal carries force", abs(r["forces"][1]) > 1e-6)
        return 0 if not FAILS else 1

    if cmd == "selftest":
        print("== beam ==")
        r = beam_check(300, 600, 550, "C30/37", "B420C", 250, 220, 3, 25, 8, 200)
        print(f"  As,req = {r['As_req']:.0f} mm²   M_Rd = {r['M_Rd']:.2f} kN·m   "
              f"V_r = {r['Vr']/1e3:.2f} kN   eps ratio = {r['eps_ratio']:.2f}")
        check("beam: default As,req ≈ 1366 mm²", near(r["As_req"], 1366, 0.01))
        check("beam: 3Ø25 M_Rd ≈ 267.45 kN·m", near(r["M_Rd"], 267.45, 1e-3))
        check("beam: V_r(Ø8@200) ≈ 209.65 kN", near(r["Vr"]/1e3, 209.65, 1e-3))
        r6 = beam_check(300, 600, 550, "C30/37", "B420C", 250, 220, 6, 25, 8, 200)
        check("beam: 6Ø25 does not double M_Rd", r6["M_Rd"] < 2 * 267.45 and r6["M_Rd"] > 400)
        r25 = beam_check(300, 400, 350, "C25/30", "B420C", 200, 150, 5, 25, 8, 200)
        check("beam: C25 5Ø25 is ductility-limited", r25["eps_ratio"] < 1 and r25["M_Rd"] > 200)
        print("== column ==")
        c = steel_column(7810, 50.7, 235, 6000, 1.0, 0.49)
        print(f"  chi = {c['chi']:.3f}   N_b = {c['N_b']:.0f} kN")
        check("column: HEB200 S235 L=6m Nb ≈ 745 kN", near(c["N_b"], 745, 0.02))
        print("== retaining ==")
        w = retaining(4.0, 3.3, 0.5, 32, 18, 20, 10, 2.0, False)
        print(f"  FS_sl = {w['Fs_sl']:.3f}   FS_ot = {w['Fs_ot']:.2f}   q_ult = {w['qult']:.1f} kPa")
        check("retaining: FS_sliding ≈ 1.185", near(w["Fs_sl"], 1.185, 0.01))
        check("retaining: q_ult ≈ 1054.6 kPa", near(w["qult"], 1054.587, 0.01))
        print("== manning ==")
        m = manning(4.0, 12.0, 0.001, 0.015)
        print(f"  y_n = {m['y']:.4f} m   y_c = {m['yc']:.4f} m   Fr = {m['Fr']:.3f}")
        check("manning: y_n ≈ 1.5555 m", near(m["y"], 1.5555, 0.001))
        print("== drift ==")
        d = drift(4, 3.5, 400, 0.8, 0.3, 7, 1.0, 120000)
        print(f"  V = {d['V']:.1f} kN   max drift = {d['max_ratio']:.5f}")
        check("drift: V_t ≈ 1327.8 kN", near(d["Vt"], 1327.8, 0.001))
        check("drift: max ratio > 0.008", d["max_ratio"] > 0.008)
        print("== truss ==")
        t = truss_triangle()
        print(f"  residual = {t['residual']:.2e}")
        check("truss: residual < 1e-6", t["residual"] < 1e-6)
        print()
        if FAILS:
            print(f"{FAILS} check(s) FAILED")
            return 1
        print("SELFTEST OK")
        return 0

    print(f"unknown command: {cmd}")
    print(__doc__)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
