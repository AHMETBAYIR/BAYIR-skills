#!/usr/bin/env python3
"""Independent numeric checks for the architecture lab layer.

Usage:
    python3 check_arch.py stair 3.0 19 0.30 1.5 1.5 8.0 4.0 0.30 konut accessible
    python3 check_arch.py ramp 0.60 8.0
    python3 check_arch.py uvalue 80 0.40
    python3 check_arch.py rt60 6.0 4.0 3.0 0.15
    python3 check_arch.py cut 1.20 0.0 1.50
    python3 check_arch.py selftest

Units: m, mm, W/(m²K), m²K/W, s. The script repeats the arithmetic; it does
not import the JavaScript. A teaching check, not a permit calculation.
"""

from __future__ import annotations

import math
import sys

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


def stair_geom(H: float, N: int, Gmm: float, Lm: float) -> dict:
    R = H / N
    n1 = math.ceil(N / 2)
    n2 = N - n1
    Lreq = (N - 2) * Gmm / 1000.0 + Lm
    return {"H": H, "N": N, "Gmm": Gmm, "Lm": Lm, "R": R,
            "n1": n1, "n2": n2, "Lreq": Lreq}


def covered_at(g: dict, xedge: float) -> dict:
    ymax, xcrit, label = 0.0, 0.0, "açık"

    def consider(x0: float, y: float, lab: str) -> None:
        nonlocal ymax, xcrit, label
        if x0 < xedge - 1e-9 and y > ymax + 1e-12:
            ymax, xcrit, label = y, x0, lab

    for k in range(1, g["n1"]):
        consider((k - 1) * g["Gmm"] / 1000.0, k * g["R"], f"1. kol · {k}. basamak")
    xl = (g["n1"] - 1) * g["Gmm"] / 1000.0
    consider(xl, g["n1"] * g["R"], "ara sahanlık")
    x2 = xl + g["Lm"]
    for j in range(1, g["n2"]):
        consider(x2 + (j - 1) * g["Gmm"] / 1000.0,
                 g["n1"] * g["R"] + j * g["R"], f"2. kol · {j}. basamak")
    return {"ymax": ymax, "xcrit": xcrit, "label": label}


def stair_model(H: float, N: int, Gmm: float, Lm: float, W: float,
                Lavail: float, Lopen: float, t: float,
                building: str = "konut", accessible: bool = True) -> dict:
    g = stair_geom(H, N, Gmm, Lm)
    xedge = max(0.0, g["Lreq"] - Lopen)
    cov = covered_at(g, xedge)
    hmin = H - t - cov["ymax"]
    Rmax = 160.0 if accessible else 180.0
    Wmin = 1.20 if building == "konut" else 1.50
    blondel = 2 * g["R"] * 1000.0 + Gmm
    checks = {
        "R": (g["R"] * 1000.0, Rmax, g["R"] * 1000.0 <= Rmax + 1e-9),
        "G": (Gmm, 280.0, Gmm >= 280.0 - 1e-9),
        "B": (blondel, (600.0, 640.0), 600.0 - 1e-9 <= blondel <= 640.0 + 1e-9),
        "Lm": (Lm, 1.50, Lm >= 1.50 - 1e-9),
        "F": (max(g["n1"], g["n2"]), 10, max(g["n1"], g["n2"]) <= 10),
        "W": (W, Wmin, W >= Wmin - 1e-9),
        "P": (g["Lreq"], Lavail, g["Lreq"] <= Lavail + 1e-9),
        "H": (hmin, 2.20, hmin >= 2.20 - 1e-9),
    }
    return {"geom": g, "xedge": xedge, "cov": cov, "hmin": hmin,
            "Rmm": g["R"] * 1000.0, "blondel": blondel, "checks": checks,
            "all_pass": all(v[2] for v in checks.values()),
            "fails": [k for k, v in checks.items() if not v[2]]}


def ramp_model(H: float, Lavail: float) -> dict:
    imax = 1.0 / 12.0
    max_rise = min(0.76, 9.00 * imax)
    nr = max(1, math.ceil(H / max_rise - 1e-12))
    hi = H / nr
    li = hi / imax
    Lreq = nr * li + (nr + 1) * 1.50
    return {"H": H, "nr": nr, "hi": hi, "li": li, "Lreq": Lreq,
            "pass": H <= 0.76 + 1e-9 and Lreq <= Lavail + 1e-9}


LAYERS = [
    ("Dış sıva", 0.020, 0.87),
    ("Tuğla duvar", 0.190, 0.45),
    ("EPS yalıtım", None, 0.035),
    ("İç sıva", 0.015, 0.35),
]


def uvalue(ins_mm: float, target: float) -> dict:
    layers = []
    for name, t, lam in LAYERS:
        thickness = ins_mm / 1000.0 if t is None else t
        layers.append((name, thickness, lam))
    Rsi, Rse = 0.13, 0.04
    Rlayers = sum(t / lam for _, t, lam in layers)
    R = Rsi + Rse + Rlayers
    U = 1.0 / R
    fixed = sum(t / lam for name, t, lam in layers if name != "EPS yalıtım")
    ins_req = max(0.0, (1.0 / target - Rsi - Rse - fixed) * 0.035) * 1000.0
    return {"layers": layers, "R": R, "U": U, "target": target,
            "ins_req": ins_req, "pass": U <= target + 1e-9,
            "thickness": sum(t for _, t, _ in layers)}


def rt60(L: float, W: float, H: float, alpha: float) -> dict:
    V = L * W * H
    S = 2 * (L * W + L * H + W * H)
    A = S * alpha
    T = 0.161 * V / A
    return {"V": V, "S": S, "A": A, "RT60": T}


def cut(z: float, bottom: float, top: float) -> dict:
    return {"z": z, "bottom": bottom, "top": top, "cut": bottom <= z <= top}


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    cmd = sys.argv[1].lower()

    if cmd == "stair":
        vals = sys.argv[2:]
        if len(vals) < 7:
            print("usage: stair H N Gmm Lm W Lavail Lopen t [konut|okul] [accessible|standard]")
            return 2
        H, N, Gmm, Lm, W, Lavail, Lopen, t = (
            float(vals[0]), int(vals[1]), float(vals[2]), float(vals[3]),
            float(vals[4]), float(vals[5]), float(vals[6]), float(vals[7]) if len(vals) > 7 else 0.30)
        building = vals[8] if len(vals) > 8 else "konut"
        accessible = (vals[9] if len(vals) > 9 else "accessible") != "standard"
        m = stair_model(H, N, Gmm, Lm, W, Lavail, Lopen, t, building, accessible)
        print(f"  R = {m['Rmm']:.1f} mm   2R+G = {m['blondel']:.1f} mm   L_req = {m['geom']['Lreq']:.2f} m")
        print(f"  x_edge = {m['xedge']:.2f} m   h_min = {m['hmin']:.2f} m   critical: {m['cov']['label']}")
        for key, (value, limit, ok) in m["checks"].items():
            print(f"  {'PASS' if ok else 'FAIL'}  {key:2s}  {value:8.2f}  limit {limit}")
        check("stair: at least one limit state is reported", len(m["checks"]) == 8)
        check("stair: headroom is H - t - covered rise", near(m["hmin"], H - t - m["cov"]["ymax"], 1e-9))
        if m["all_pass"]:
            print("  all checks pass")
        return 0 if not FAILS else 1

    if cmd == "ramp":
        H, Lavail = float(sys.argv[2]), float(sys.argv[3])
        m = ramp_model(H, Lavail)
        print(f"  ramps = {m['nr']}   rise = {m['hi']:.3f} m   slope length = {m['li']:.2f} m")
        print(f"  L_req = {m['Lreq']:.2f} m   available = {Lavail:.2f} m   {'PASS' if m['pass'] else 'FAIL'}")
        check("ramp: 1:12 slope", near(m["hi"] / m["li"], 1 / 12, 1e-9))
        check("ramp: length includes landings", near(m["Lreq"], m["nr"] * m["li"] + (m["nr"] + 1) * 1.5, 1e-9))
        return 0 if not FAILS else 1

    if cmd == "uvalue":
        ins, target = float(sys.argv[2]), float(sys.argv[3])
        m = uvalue(ins, target)
        print(f"  thickness = {m['thickness']*1000:.0f} mm   R = {m['R']:.3f} m²K/W   U = {m['U']:.3f} W/(m²K)")
        print(f"  target = {target:.2f}   required EPS = {m['ins_req']:.0f} mm   {'PASS' if m['pass'] else 'FAIL'}")
        check("uvalue: R = 1/U", near(m["R"], 1 / m["U"], 1e-9))
        check("uvalue: layers sum to thickness", near(m["thickness"], sum(t for _, t, _ in m["layers"]), 1e-9))
        return 0 if not FAILS else 1

    if cmd == "rt60":
        L, W, H, alpha = map(float, sys.argv[2:6])
        m = rt60(L, W, H, alpha)
        print(f"  V = {m['V']:.1f} m³   S = {m['S']:.1f} m²   A = {m['A']:.1f} m² sabin")
        print(f"  RT60 = {m['RT60']:.2f} s")
        check("rt60: Sabine formula", near(m["RT60"], 0.161 * m["V"] / (m["S"] * alpha), 1e-9))
        check("rt60: positive", m["RT60"] > 0)
        return 0 if not FAILS else 1

    if cmd == "cut":
        z, bottom, top = map(float, sys.argv[2:5])
        m = cut(z, bottom, top)
        print(f"  cut at z = {z:.2f} m; element {bottom:.2f}–{top:.2f} m -> {'CUT' if m['cut'] else 'BEYOND'}")
        check("cut: interval membership", m["cut"] == (bottom <= z <= top))
        return 0 if not FAILS else 1

    if cmd == "selftest":
        print("== stair ==")
        m = stair_model(3.0, 19, 300, 1.5, 1.5, 8.0, 4.0, 0.30)
        print(f"  R = {m['Rmm']:.1f}  2R+G = {m['blondel']:.1f}  L_req = {m['geom']['Lreq']:.2f}  h_min = {m['hmin']:.2f}")
        check("stair: default R = 157.9 mm", near(m["Rmm"], 157.8947, 1e-3))
        check("stair: default 2R+G = 615.8 mm", near(m["blondel"], 615.789, 1e-3))
        check("stair: plan fits", m["geom"]["Lreq"] <= 8.0 + 1e-9)
        check("stair: headroom fails at 1.28 m", near(m["hmin"], 1.28, 0.02))
        m2 = stair_model(3.0, 19, 300, 1.5, 1.5, 8.0, 5.70, 0.30)
        check("stair: opening 5.70 m passes", m2["hmin"] >= 2.20 - 1e-9)
        print("== ramp ==")
        r = ramp_model(0.60, 8.0)
        print(f"  L_req = {r['Lreq']:.2f} m  ramps = {r['nr']}")
        check("ramp: 0.60 m needs one ramp", r["nr"] == 1)
        check("ramp: L_req = 10.20 m", near(r["Lreq"], 10.20, 1e-6))
        print("== uvalue ==")
        u = uvalue(80, 0.40)
        print(f"  U = {u['U']:.3f}  R = {u['R']:.3f}  EPS required = {u['ins_req']:.0f} mm")
        check("uvalue: 80 mm EPS gives U ≈ 0.34", near(u["U"], 0.340, 0.003))
        check("uvalue: 160 mm gives U ≈ 0.19", near(uvalue(160, 0.40)["U"], 0.192, 0.004))
        print("== rt60 ==")
        t = rt60(6.0, 4.0, 3.0, 0.15)
        print(f"  RT60 = {t['RT60']:.2f} s")
        check("rt60: 6x4x3 room at alpha=0.15 is about 0.72 s", near(t["RT60"], 0.716, 0.01))
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
