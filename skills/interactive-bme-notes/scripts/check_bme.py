#!/usr/bin/env python3
"""Independent checks for the interactive BME lab engines.

Every lab prints numbers; this script recomputes them from first principles
with plain Python (no project code, no browser). Use it before shipping a note.

Examples:
    python3 check_bme.py joint --angle 90 --load 10
    python3 check_bme.py visco --model kv --E 1 --eta 5 --sigma 0.2 --t 7.2
    python3 check_bme.py oxygen --D 2e-9 --C0 0.1 --q 0.02 --L 150e-6
    python3 check_bme.py stenosis --ratio 0.6 --Q 5e-6
    python3 check_bme.py ecg --hr 72 --axis 60
    python3 check_bme.py michaelis --vmax 100 --km 50 --s 50 --inhib comp --i 50 --ki 50
    python3 check_bme.py ct --level 40 --width 400
    python3 check_bme.py selftest
"""

from __future__ import annotations

import argparse
import math

G = 9.81


def joint(angle: float, load: float, a: float = 0.30, b: float = 0.035, d: float = 0.35) -> dict:
    th = math.radians(angle)
    u = (math.sin(th), -math.cos(th))
    A = (0.0, a)
    B = (b * u[0], b * u[1])
    P = (d * u[0], d * u[1])
    L = math.hypot(A[0] - B[0], A[1] - B[1])
    um = ((A[0] - B[0]) / L, (A[1] - B[1]) / L)
    r = abs(B[0] * um[1] - B[1] * um[0])
    torque = abs(load * G * d * math.sin(th))
    fm = torque / r if r > 1e-9 else float("inf")
    W = -load * G
    rx = -(fm * um[0])
    ry = -(fm * um[1] + W)
    return {
        "moment_arm_cm": r * 100,
        "muscle_force_N": fm,
        "joint_reaction_N": math.hypot(rx, ry),
        "load_torque_Nm": torque,
        "load_lever_cm": d * abs(math.sin(th)) * 100,
        "insertion_to_origin_cm": L * 100,
    }


def visco(model: str, E: float, eta: float, sigma: float, t: float, test: str = "creep") -> dict:
    tau = eta / E
    if test == "creep":
        eps = sigma / E * (1 - math.exp(-t / tau)) if model == "kv" else sigma / E + sigma * t / eta
        return {"tau_s": tau, "strain": eps, "instant_strain": 0.0 if model == "kv" else sigma / E}
    stress = sigma if model == "kv" else sigma * math.exp(-t / tau)
    return {"tau_s": tau, "stress_MPa": stress}


def oxygen(D: float, C0: float, q: float, L: float, Cmin: float = 0.005) -> dict:
    def C(x: float) -> float:
        return C0 - (q / D) * (L * x - x * x / 2)

    lcrit = math.sqrt(2 * D * C0 / q)
    viable = 0.0
    for i in range(0, 4001):
        x = L * i / 4000
        if C(x) >= Cmin:
            viable = x
    return {
        "L_crit_um": lcrit * 1e6,
        "C_centre": C(L),
        "C_surface": C0,
        "viable_depth_um": viable * 1e6,
        "mean_C": (C0 + C(L)) / 2,
    }


def stenosis(ratio: float, Q: float = 5e-6, Ls: float = 0.01, mu: float = 0.0035,
             rho: float = 1060.0, r0: float = 0.005) -> dict:
    rs = r0 * ratio
    vs = Q / (math.pi * rs * rs)
    v0 = Q / (math.pi * r0 * r0)
    rv = 8 * mu * Ls / (math.pi * rs ** 4)
    visc = rv * Q
    conv = 0.5 * rho * (vs * vs - v0 * v0)
    return {
        "viscous_Pa": visc,
        "convective_Pa": conv,
        "total_Pa": visc + conv,
        "Vs_m_s": vs,
        "Re": rho * vs * 2 * rs / mu,
    }


def ecg(hr: float, axis: float) -> dict:
    proj = {lead: math.cos(math.radians(axis - ang)) for lead, ang in (("I", 0), ("II", 60), ("III", 120))}
    return {
        "RR_s": 60 / hr,
        "projection_I": proj["I"],
        "projection_II": proj["II"],
        "projection_III": proj["III"],
        "identity_error": abs(proj["II"] - (proj["I"] + proj["III"])),
        "aVR": -(proj["I"] + proj["II"]) / 2,
    }


def michaelis(vmax: float, km: float, s: float, inhib: str = "none", i: float = 0.0, ki: float = 50.0) -> dict:
    km_app, vmax_app = km, vmax
    if inhib == "comp":
        km_app = km * (1 + i / ki)
    elif inhib == "noncomp":
        vmax_app = vmax / (1 + i / ki)
    v = vmax_app * s / (km_app + s)
    return {"v": v, "Km_app": km_app, "Vmax_app": vmax_app, "fraction_Vmax": v / vmax_app}


def ct(level: float, width: float) -> dict:
    lo, hi = level - width / 2, level + width / 2
    structures = {"air": -1000, "fat": -90, "lung": -820, "water": 0, "muscle": 40, "bone": 1000}
    visible = [k for k, v in structures.items() if lo <= v <= hi]
    return {"low_HU": lo, "high_HU": hi, "visible": ",".join(visible) or "none"}


def selftest() -> None:
    # Moment arm peaks near 70 degrees, not 90.
    arms = [(a, joint(a, 10)["moment_arm_cm"]) for a in range(5, 141)]
    peak = max(arms, key=lambda p: p[1])
    assert 92 <= peak[0] <= 102, peak
    # Static equilibrium: muscle torque balances load torque.
    j = joint(90, 10)
    assert abs(j["muscle_force_N"] * (j["moment_arm_cm"] / 100) - j["load_torque_Nm"]) < 1e-6
    # Kelvin-Voigt reaches 63.2% of final strain at t = tau.
    v = visco("kv", 1.0, 5.0, 0.2, 5.0)
    assert abs(v["strain"] / (0.2 / 1.0) - (1 - math.exp(-1))) < 1e-12
    # Oxygen: centre concentration is zero at L = L_crit.
    o = oxygen(2e-9, 0.1, 0.02, math.sqrt(2 * 2e-9 * 0.1 / 0.02))
    assert abs(o["C_centre"]) < 1e-12
    # Poiseuille-only is not the total: convective term is positive.
    st = stenosis(0.6)
    assert st["convective_Pa"] > 0 and st["total_Pa"] > st["viscous_Pa"]
    # Einthoven: II = I + III.
    e = ecg(72, 60)
    assert e["identity_error"] < 1e-12
    # Michaelis-Menten: v = Vmax/2 at S = Km.
    m = michaelis(100, 50, 50)
    assert abs(m["v"] - 50) < 1e-12
    # Competitive inhibition leaves Vmax_app unchanged.
    mc = michaelis(100, 50, 500, "comp", 50, 50)
    assert abs(mc["Vmax_app"] - 100) < 1e-12 and mc["Km_app"] == 100
    # CT window contains water at level 40 / width 400.
    c = ct(40, 400)
    assert c["low_HU"] == -160 and c["high_HU"] == 240
    print("selftest: all 9 checks passed")


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("joint")
    s.add_argument("--angle", type=float, default=90)
    s.add_argument("--load", type=float, default=10)

    s = sub.add_parser("visco")
    s.add_argument("--model", choices=["kv", "maxwell"], default="kv")
    s.add_argument("--test", choices=["creep", "relax"], default="creep")
    s.add_argument("--E", type=float, default=1.0)
    s.add_argument("--eta", type=float, default=5.0)
    s.add_argument("--sigma", type=float, default=0.2)
    s.add_argument("--t", type=float, default=7.2)

    s = sub.add_parser("oxygen")
    s.add_argument("--D", type=float, default=2e-9)
    s.add_argument("--C0", type=float, default=0.1)
    s.add_argument("--q", type=float, default=0.02)
    s.add_argument("--L", type=float, default=150e-6)

    s = sub.add_parser("stenosis")
    s.add_argument("--ratio", type=float, default=0.6)
    s.add_argument("--Q", type=float, default=5e-6)
    s.add_argument("--Ls", type=float, default=0.01)

    s = sub.add_parser("ecg")
    s.add_argument("--hr", type=float, default=72)
    s.add_argument("--axis", type=float, default=60)

    s = sub.add_parser("michaelis")
    s.add_argument("--vmax", type=float, default=100)
    s.add_argument("--km", type=float, default=50)
    s.add_argument("--s", type=float, default=50)
    s.add_argument("--inhib", choices=["none", "comp", "noncomp"], default="none")
    s.add_argument("--i", type=float, default=0)
    s.add_argument("--ki", type=float, default=50)

    s = sub.add_parser("ct")
    s.add_argument("--level", type=float, default=40)
    s.add_argument("--width", type=float, default=400)

    sub.add_parser("selftest")

    args = p.parse_args()
    if args.cmd == "selftest":
        selftest()
        return 0
    fn = globals()[args.cmd]
    kwargs = {k: v for k, v in vars(args).items() if k != "cmd"}
    result = fn(**kwargs)
    for key, value in result.items():
        if isinstance(value, float):
            print(f"{key:26s} {value:.6g}")
        else:
            print(f"{key:26s} {value}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
