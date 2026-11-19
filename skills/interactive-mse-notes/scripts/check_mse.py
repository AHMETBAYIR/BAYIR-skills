#!/usr/bin/env python3
"""Independent checks for numbers that appear in an MSE note.

The point is not to be a materials library. It is a small, dependency-free
calculator the author can run before writing a readout, so the note does not
ship a number that was invented in prose.

Usage:
    python3 check_mse.py selftest
    python3 check_mse.py lever 0.40 0.19 0.97
    python3 check_mse.py density fcc 3.615 63.55
    python3 check_mse.py bragg 3.615 1 1 1 1.5406
    python3 check_mse.py diffusion 2.3e-5 148 950 1
"""

from __future__ import annotations

import argparse
import math
import sys

N_A = 6.02214076e23
R = 8.314462618

ATOMS_PER_CELL = {"sc": 1, "bcc": 2, "fcc": 4, "diamond": 8, "nacl": 4}


def lever(x0: float, xa: float, xb: float) -> tuple[float, float]:
    if not xa < xb:
        raise ValueError("need xa < xb")
    if not xa - 1e-12 <= x0 <= xb + 1e-12:
        raise ValueError("x0 must lie between the tie-line ends")
    fb = (x0 - xa) / (xb - xa)
    return 1 - fb, fb


def density(structure: str, a_angstrom: float, molar_mass: float) -> float:
    n = ATOMS_PER_CELL[structure]
    volume_cm3 = (a_angstrom * 1e-8) ** 3
    return n * molar_mass / (N_A * volume_cm3)


def bragg(a_angstrom: float, h: int, k: int, l: int, wavelength: float) -> tuple[float, float]:
    n = h * h + k * k + l * l
    if n == 0:
        raise ValueError("(000) is not a reflection")
    d = a_angstrom / math.sqrt(n)
    sin_theta = wavelength / (2 * d)
    if not 0 < sin_theta < 1:
        raise ValueError("reflection is outside the accessible range")
    two_theta = 2 * math.degrees(math.asin(sin_theta))
    return d, two_theta


def d_spacing(a_angstrom: float, h: int, k: int, l: int) -> float:
    n = h * h + k * k + l * l
    if n == 0:
        raise ValueError("(000) has no d-spacing")
    return a_angstrom / math.sqrt(n)


def diffusion(d0: float, q_kj: float, t_celsius: float, hours: float) -> tuple[float, float, float]:
    temp = t_celsius + 273.15
    d = d0 * math.exp(-q_kj * 1000 / (R * temp))
    root = math.sqrt(d * hours * 3600)
    return d, root, root * 1e6


def selftest() -> int:
    checks: list[tuple[str, float, float, float]] = []

    checks.append(("Cu FCC density", density("fcc", 3.615, 63.55), 8.96, 0.05))
    checks.append(("NaCl density", density("nacl", 5.64, 58.44), 2.16, 0.03))

    fa, fb = lever(0.40, 0.19, 0.97)
    checks.append(("lever f_alpha", fa, 0.7308, 0.001))
    checks.append(("lever f_beta", fb, 0.2692, 0.001))
    if abs((fa + fb) - 1) > 1e-12:
        print("FAIL lever fractions do not sum to 1")
        return 1

    d, tt = bragg(3.615, 1, 1, 1, 1.5406)
    checks.append(("Cu (111) d", d, 2.087, 0.002))
    checks.append(("Cu (111) 2theta", tt, 43.32, 0.05))

    diff, root, root_um = diffusion(2.3e-5, 148, 950, 1)
    checks.append(("C in Fe D", diff, 1.09e-11, 0.08e-11))
    checks.append(("C in Fe sqrt(Dt)", root_um, 198, 6))

    ok = True
    for name, got, want, tol in checks:
        passed = abs(got - want) <= tol
        ok = ok and passed
        print(f"{'PASS' if passed else 'FAIL'}  {name:22s} got {got:.6g}  expected {want:.6g} ± {tol:.3g}")

    # Invariants that catch silent unit mistakes.
    apf_fcc = 4 * (4 / 3) * math.pi * (math.sqrt(2) / 4) ** 3
    if abs(apf_fcc - 0.7405) > 1e-3:
        print("FAIL FCC packing fraction is wrong")
        ok = False
    if not 0 < diff < 1e-8:
        print("FAIL diffusion coefficient outside a plausible solid-state range")
        ok = False

    print("SELFTEST", "PASS" if ok else "FAIL")
    return 0 if ok else 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Check MSE numbers used in a note.")
    sub = parser.add_subparsers(dest="command", required=True)

    sessions = sub.add_parser("selftest")
    sessions.set_defaults(func=lambda _: selftest())

    p = sub.add_parser("lever")
    p.add_argument("x0", type=float)
    p.add_argument("xa", type=float)
    p.add_argument("xb", type=float)

    p = sub.add_parser("density")
    p.add_argument("structure", choices=sorted(ATOMS_PER_CELL))
    p.add_argument("a", type=float)
    p.add_argument("mass", type=float)

    p = sub.add_parser("bragg")
    p.add_argument("a", type=float)
    p.add_argument("h", type=int)
    p.add_argument("k", type=int)
    p.add_argument("l", type=int)
    p.add_argument("wavelength", type=float)

    p = sub.add_parser("dspacing")
    p.add_argument("a", type=float)
    p.add_argument("h", type=int)
    p.add_argument("k", type=int)
    p.add_argument("l", type=int)
    p.add_argument("--wavelength", type=float, default=None)

    p = sub.add_parser("diffusion")
    p.add_argument("d0", type=float)
    p.add_argument("q", type=float)
    p.add_argument("t", type=float)
    p.add_argument("hours", type=float)

    args = parser.parse_args()

    if args.command == "selftest":
        return selftest()
    if args.command == "lever":
        fa, fb = lever(args.x0, args.xa, args.xb)
        print(f"f_alpha = {fa:.4f}")
        print(f"f_beta  = {fb:.4f}")
        print(f"sum     = {fa + fb:.4f}")
        return 0
    if args.command == "density":
        print(f"rho = {density(args.structure, args.a, args.mass):.4f} g/cm3")
        return 0
    if args.command == "bragg":
        d, tt = bragg(args.a, args.h, args.k, args.l, args.wavelength)
        print(f"d     = {d:.4f} A")
        print(f"2theta = {tt:.3f} deg")
        return 0
    if args.command == "dspacing":
        d = d_spacing(args.a, args.h, args.k, args.l)
        print(f"d = {d:.4f} A")
        if args.wavelength:
            sin_theta = args.wavelength / (2 * d)
            if 0 < sin_theta < 1:
                print(f"2theta = {2 * math.degrees(math.asin(sin_theta)):.3f} deg")
        return 0
    if args.command == "diffusion":
        d, root, root_um = diffusion(args.d0, args.q, args.t, args.hours)
        t_k = args.t + 273.15
        print(f"T      = {t_k:.2f} K")
        print(f"D      = {d:.3e} m2/s")
        print(f"sqrtDt = {root:.3e} m = {root_um:.1f} um")
        return 0

    return 2


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(2)
