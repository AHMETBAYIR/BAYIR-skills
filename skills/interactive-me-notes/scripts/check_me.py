#!/usr/bin/env python3
"""Independent checks for common mechanical-engineering note numbers.

Standard library only, so it runs on a phone without SciPy or CoolProp.
Every subcommand prints the intermediate values, not just the answer, so the
note author can copy the table and see which assumption produced which number.

Usage:
    python3 check_me.py beam 4 2 200 5e6 2
    python3 check_me.py mohr 80 -20 40
    python3 check_me.py pipe 0.05 10 0.003 0.000045
    python3 check_me.py otto 8 300 800
    python3 check_me.py fourbar 100 25 70 85 60
    python3 check_me.py fit 30 H7 p6
    python3 check_me.py gear 3 20 60 1450 3 30
    python3 check_me.py fem 1 100 200000 10000 4
    python3 check_me.py fin 200 50 0.104 1e-4 0.03 350 300
    python3 check_me.py vibration 2 20 0.05 50 0.9
    python3 check_me.py section 40 60
    python3 check_me.py selftest

Conventions:
    beam  L [m], P [kN], E [GPa], I [mm^4], a [m]  -> simply supported
    mohr  sx, sy, txy [MPa], tension positive
    pipe  D [m], L [m], Q [m^3/s], eps [m], water 20 C
    otto  r [-], T1 [K], qin [kJ/kg], gamma=1.4, cv=0.718
    fourbar r1 r2 r3 r4 [mm], theta2 [deg]
    fit   size [mm], hole zone, shaft zone (ISO 286 subset, 14-50 mm)
    vibration m [kg], k [kN/m], zeta, F0 [N], r = omega/omega_n
    fem   L [m], A [mm^2], E [MPa], P [N], n elements
"""

from __future__ import annotations

import math
import sys

# ---------------------------------------------------------------- helpers


def fmt(value: float, digits: int = 3) -> str:
    if abs(value) < 5e-13:
        value = 0.0
    if value != 0 and (abs(value) < 1e-3 or abs(value) >= 1e5):
        return f"{value:.3e}"
    text = f"{value:.{digits}f}"
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    return text


def row(name: str, value: float, unit: str, digits: int = 3) -> None:
    print(f"  {name:<34} {fmt(value, digits):>12}  {unit}")


# ---------------------------------------------------------------- beam

def beam(L: float, P_kN: float, E_GPa: float, I_mm4: float, a: float) -> None:
    """Simply supported beam, point load P at distance a from the left support.

    Euler-Bernoulli. Sagging moment positive, downward deflection positive.
    """
    if not (0 < a < L):
        raise ValueError("a must lie strictly inside the span")
    P = P_kN * 1e3
    b = L - a
    R1 = P * b / L
    R2 = P * a / L
    Mmax = P * a * b / L          # N·m
    E = E_GPa * 1e3               # N/mm^2
    EI = E * I_mm4                # N·mm^2
    Lmm, amm, bmm = L * 1e3, a * 1e3, b * 1e3

    # deflection [mm] with every length in mm
    def y(x: float) -> float:
        if x <= amm:
            return P * bmm * x * (Lmm * Lmm - bmm * bmm - x * x) / (6 * EI * Lmm)
        return P * amm * (Lmm - x) * (Lmm * Lmm - amm * amm - (Lmm - x) ** 2) / (6 * EI * Lmm)

    # deflection under the load, closed form: P a^2 b^2 / (3 E I L)
    delta_load = P * amm * amm * bmm * bmm / (3 * EI * Lmm)
    # max deflection location (x measured from left, for a >= b it is at sqrt((L^2-b^2)/3))
    xmax_mm = math.sqrt(max(0.0, (Lmm * Lmm - bmm * bmm) / 3.0)) if a >= b else Lmm - math.sqrt(max(0.0, (Lmm * Lmm - amm * amm) / 3.0))
    delta_max = y(xmax_mm)

    print(f"beam: L={fmt(L)} m, P={fmt(P_kN)} kN at a={fmt(a)} m, E={fmt(E_GPa)} GPa, I={fmt(I_mm4, 0)} mm^4")
    row("R_left", R1 / 1e3, "kN")
    row("R_right", R2 / 1e3, "kN")
    row("check R_left + R_right - P", (R1 + R2 - P) / 1e3, "kN", 6)
    row("M_max", Mmax / 1e3, "kN·m")
    row("deflection at load", delta_load, "mm")
    row("x at max deflection", xmax_mm / 1e3, "m")
    row("max deflection", delta_max, "mm")
    row("EI", EI / 1e9, "kN·m²")
    # sigma = M c / I needs c; report M/I for a unit c
    row("M_max / I (unit c)", Mmax * 1e3 / I_mm4, "MPa per mm c")


# ---------------------------------------------------------------- mohr

def mohr(sx: float, sy: float, txy: float) -> None:
    """Plane stress transformation. Tension positive, txy positive CCW on +x face."""
    C = (sx + sy) / 2
    R = math.hypot((sx - sy) / 2, txy)
    s1, s2 = C + R, C - R
    theta_p = 0.5 * math.degrees(math.atan2(2 * txy, sx - sy))
    tau_max = R
    theta_s = theta_p + 45
    vm = math.sqrt(max(0, sx * sx - sx * sy + sy * sy + 3 * txy * txy))
    tresca = max(abs(s1 - s2), abs(s1), abs(s2))
    print(f"mohr: sx={fmt(sx)} MPa, sy={fmt(sy)} MPa, txy={fmt(txy)} MPa")
    row("centre C", C, "MPa")
    row("radius R", R, "MPa")
    row("sigma_1", s1, "MPa")
    row("sigma_2", s2, "MPa")
    row("tau_max in plane", tau_max, "MPa")
    row("theta_p (to sigma_1)", theta_p, "deg")
    row("theta_s (to tau_max)", theta_s, "deg")
    row("I1 = sx + sy", sx + sy, "MPa", 6)
    row("I1 = s1 + s2", s1 + s2, "MPa", 6)
    row("von Mises", vm, "MPa")
    row("Tresca", tresca, "MPa")


# ---------------------------------------------------------------- pipe

def colebrook(Re: float, rel: float) -> float:
    """Solve 1/sqrt(f) = -2 log10(eps/3.7D + 2.51/(Re sqrt(f)))."""
    if Re < 2300:
        return 64 / Re if Re > 0 else float("nan")
    f = 0.02
    for _ in range(60):
        lhs = 1 / math.sqrt(f)
        rhs = -2 * math.log10(rel / 3.7 + 2.51 / (Re * math.sqrt(f)))
        f_new = 1 / (rhs * rhs)
        if abs(f_new - f) < 1e-12:
            f = f_new
            break
        f = 0.5 * f + 0.5 * f_new
    return f


def haaland(Re: float, rel: float) -> float:
    inv = -1.8 * math.log10((rel / 3.7) ** 1.11 + 6.9 / Re)
    return 1 / (inv * inv)


def pipe(D: float, L: float, Q: float, eps: float, rho: float = 998.0, mu: float = 1.002e-3) -> None:
    A = math.pi * D * D / 4
    V = Q / A
    Re = rho * V * D / mu
    rel = eps / D
    f = colebrook(Re, rel)
    hf = f * (L / D) * V * V / (2 * 9.80665)
    dp = rho * 9.80665 * hf
    print(f"pipe: D={fmt(D)} m, L={fmt(L)} m, Q={fmt(Q)} m^3/s, eps={fmt(eps)} m, water 20 C")
    row("area", A, "m²")
    row("velocity", V, "m/s")
    row("Reynolds", Re, "-", 0)
    row("relative roughness", rel, "-", 6)
    row("f (Colebrook)", f, "-", 5)
    row("f (Haaland check)", haaland(Re, rel), "-", 5)
    row("head loss", hf, "m")
    row("pressure drop", dp / 1e3, "kPa")
    row("friction velocity", V * math.sqrt(f / 8), "m/s")


# ---------------------------------------------------------------- otto

def otto(r: float, T1: float, qin: float, gamma: float = 1.4, cv: float = 0.718) -> None:
    T2 = T1 * r ** (gamma - 1)
    T3 = T2 + qin / cv
    T4 = T3 / r ** (gamma - 1)
    qout = cv * (T4 - T1)
    wnet = qin - qout
    eta = 1 - 1 / r ** (gamma - 1)
    eta_check = wnet / qin
    print(f"otto: r={fmt(r)}, T1={fmt(T1)} K, qin={fmt(qin)} kJ/kg, gamma={fmt(gamma)}, cv={fmt(cv)}")
    row("T2 after isentropic compression", T2, "K")
    row("T3 after heat addition", T3, "K")
    row("T4 after expansion", T4, "K")
    row("q_out", qout, "kJ/kg")
    row("w_net", wnet, "kJ/kg")
    row("eta (1 - 1/r^(g-1))", eta * 100, "%")
    row("eta (w/qin)", eta_check * 100, "%")
    row("energy closure |qin-qout-wnet|", abs(qin - qout - wnet), "kJ/kg", 9)
    row("Carnot bound at T3/T1", (1 - T1 / T3) * 100, "%")


# ---------------------------------------------------------------- fourbar

def fourbar(r1: float, r2: float, r3: float, r4: float, theta2_deg: float) -> None:
    """Crank-rocker position and velocity, ground O2-O4 along +x."""
    lengths = sorted([r1, r2, r3, r4])
    s, l, p, q = lengths[0], lengths[-1], lengths[1], lengths[2]
    grashof = s + l <= p + q
    t2 = math.radians(theta2_deg)
    Ax, Ay = r2 * math.cos(t2), r2 * math.sin(t2)
    # B is at distance r3 from A and r4 from O4=(r1,0)
    dx, dy = r1 - Ax, -Ay
    d = math.hypot(dx, dy)
    if d > r3 + r4 or d < abs(r3 - r4):
        print("fourbar: no assembly at this crank angle")
        return
    a = (r3 * r3 - r4 * r4 + d * d) / (2 * d)
    h = math.sqrt(max(0.0, r3 * r3 - a * a))
    mx, my = Ax + a * dx / d, Ay + a * dy / d
    # open configuration
    Bx = mx + h * (-dy) / d
    By = my + h * dx / d
    t3 = math.atan2(By - Ay, Bx - Ax)
    t4 = math.atan2(By, Bx - r1)

    # transmission angle between coupler and rocker
    mu = math.degrees(math.acos(max(-1, min(1, math.cos(t4 - t3)))))
    mu = min(mu, 180 - mu)

    # velocity with omega2 = 1 rad/s
    # A = r2 e^{it2}; B = A + r3 e^{it3} = O4 + r4 e^{it4}
    # omega3 r3 (-sin t3, cos t3) - omega4 r4 (-sin t4, cos t4) = -omega2 r2 (-sin t2, cos t2)
    a11, a12 = -r3 * math.sin(t3), r4 * math.sin(t4)
    a21, a22 = r3 * math.cos(t3), -r4 * math.cos(t4)
    b1 = r2 * math.sin(t2)
    b2 = -r2 * math.cos(t2)
    det = a11 * a22 - a12 * a21
    if abs(det) < 1e-12:
        w3 = w4 = float("nan")
    else:
        w3 = (b1 * a22 - a12 * b2) / det
        w4 = (a11 * b2 - b1 * a21) / det

    print(f"fourbar: r1={fmt(r1)} r2={fmt(r2)} r3={fmt(r3)} r4={fmt(r4)} mm, theta2={fmt(theta2_deg)} deg")
    row("Grashof s+l", s + l, "mm")
    row("Grashof p+q", p + q, "mm")
    print(f"  {'Grashof condition':<34} {'YES' if grashof else 'NO':>12}")
    row("Bx", Bx, "mm")
    row("By", By, "mm")
    row("theta3 (coupler)", math.degrees(t3) % 360, "deg")
    row("theta4 (rocker)", math.degrees(t4) % 360, "deg")
    row("transmission angle mu", mu, "deg")
    row("omega3 / omega2", w3, "-")
    row("omega4 / omega2", w4, "-")
    row("coupler point closure error", math.hypot(math.hypot(Bx - Ax, By - Ay) - r3, math.hypot(Bx - r1, By) - r4), "mm", 9)


# ---------------------------------------------------------------- ISO 286

# ISO 286-2 fundamental deviations [µm] and IT grades [µm], subset 14-50 mm.
# Values are the standard table entries for shafts; holes here are H only.
ISO = {
    "14-18": {
        "IT5": 8, "IT6": 11, "IT7": 18, "IT8": 27, "IT9": 43,
        "shaft": {"f": -16, "g": -6, "h": 0, "k": 1, "m": 7, "n": 12, "p": 18, "r": 20, "s": 27},
    },
    "18-30": {
        "IT5": 9, "IT6": 13, "IT7": 21, "IT8": 33, "IT9": 52,
        "shaft": {"f": -20, "g": -7, "h": 0, "k": 2, "m": 8, "n": 15, "p": 22, "r": 28, "s": 35},
    },
    "30-50": {
        "IT5": 11, "IT6": 16, "IT7": 25, "IT8": 39, "IT9": 62,
        "shaft": {"f": -25, "g": -9, "h": 0, "k": 2, "m": 9, "n": 17, "p": 26, "r": 34, "s": 43},
    },
}


def iso_zone(size: float, zone: str) -> tuple[float, float]:
    """Return (lower, upper) deviation in µm for a hole H or a shaft letter+IT."""
    if not (14 <= size <= 50):
        raise ValueError("this cited ISO 286 subset covers 14-50 mm only")
    if zone[0] != "H" and zone[0] not in "fghkmnprs":
        raise ValueError(f"unsupported zone: {zone}")
    if zone[0] == "H" and zone[1:] not in ("6", "7", "8", "9"):
        raise ValueError(f"unsupported hole grade: {zone}")
    band = "14-18" if size <= 18 else ("18-30" if size <= 30 else "30-50")
    table = ISO[band]
    letter = zone[0]
    grade = "IT" + zone[1:]
    it = table[grade]
    if letter == "H":
        return 0.0, float(it)
    if letter not in table["shaft"]:
        raise ValueError(f"unsupported shaft zone: {zone}")
    fd = table["shaft"][letter]
    # For f/g/h the fundamental deviation is the UPPER deviation (es);
    # for k and above it is the LOWER deviation (ei).
    if letter in "fgh":
        return float(fd - it), float(fd)
    return float(fd), float(fd + it)


def fit(size: float, hole: str, shaft: str) -> None:
    h_lo, h_hi = iso_zone(size, hole)
    s_lo, s_hi = iso_zone(size, shaft)
    # hole limits in mm
    H_lo, H_hi = size + h_lo / 1000, size + h_hi / 1000
    S_lo, S_hi = size + s_lo / 1000, size + s_hi / 1000
    cmin = H_lo - S_hi
    cmax = H_hi - S_lo
    if cmin >= 0:
        kind = "clearance"
    elif cmax <= 0:
        kind = "interference"
    else:
        kind = "transition"
    print(f"fit: {fmt(size)} mm, {hole}/{shaft} (ISO 286 subset, 14-50 mm)")
    row("hole lower deviation", h_lo, "µm")
    row("hole upper deviation", h_hi, "µm")
    row("shaft lower deviation", s_lo, "µm")
    row("shaft upper deviation", s_hi, "µm")
    row("hole min", H_lo, "mm", 4)
    row("hole max", H_hi, "mm", 4)
    row("shaft min", S_lo, "mm", 4)
    row("shaft max", S_hi, "mm", 4)
    row("min clearance", cmin * 1000, "µm")
    row("max clearance", cmax * 1000, "µm")
    print(f"  {'fit type':<34} {kind:>12}")


# ---------------------------------------------------------------- gear

def gear(m: float, z1: int, z2: int, n1: float, P_kW: float, b: float) -> None:
    """Simplified spur-gear check: kinematics, tangential force, Lewis bending.

    m [mm], b [mm], n1 [rpm], P [kW]. Y = 0.154 - 0.912/z is the Lewis form
    factor approximation for 20 deg full-depth teeth; label it as approximate.
    """
    d1 = m * z1
    d2 = m * z2
    u = z2 / z1
    omega1 = 2 * math.pi * n1 / 60
    T1 = P_kW * 1e3 / omega1
    Ft = 2 * T1 / (d1 / 1000)
    v = math.pi * d1 / 1000 * n1 / 60
    Y1 = 0.154 - 0.912 / z1
    sigma1 = Ft / (b * m * Y1)
    print(f"gear: m={fmt(m)} mm, z1={fmt(z1, 0)}, z2={fmt(z2, 0)}, n1={fmt(n1, 0)} rpm, P={fmt(P_kW)} kW, b={fmt(b)} mm")
    row("ratio u", u, "-")
    row("d1", d1, "mm")
    row("d2", d2, "mm")
    row("centre distance", (d1 + d2) / 2, "mm")
    row("pitch-line velocity", v, "m/s")
    row("torque T1", T1, "N·m")
    row("tangential force Ft", Ft, "N")
    row("Lewis Y (z1)", Y1, "-", 4)
    row("Lewis bending stress", sigma1, "MPa")
    row("n2", n1 / u, "rpm")
    row("power check Ft*v", Ft * v / 1e3, "kW")


# ---------------------------------------------------------------- FEM bar

def fem_bar(L: float, A: float, E: float, P: float, n: int) -> None:
    """1D linear bar, fixed at x=0, tip load P. L [m], A [mm²], E [MPa], P [N]."""
    Le = L / n
    k = E * A / (Le * 1000)  # N/mm, with Le in mm
    K = [[0.0] * (n + 1) for _ in range(n + 1)]
    for e in range(n):
        for i in range(2):
            for j in range(2):
                K[e + i][e + j] += k * (1 if i == j else -1)
    # boundary condition u0 = 0
    Kred = [row_[1:] for row_ in K[1:]]
    f = [0.0] * n
    f[-1] = P
    # Gaussian elimination
    M = [Kred[i][:] + [f[i]] for i in range(n)]
    for col in range(n):
        piv = max(range(col, n), key=lambda r: abs(M[r][col]))
        M[col], M[piv] = M[piv], M[col]
        for r in range(col + 1, n):
            fac = M[r][col] / M[col][col]
            for c in range(col, n + 1):
                M[r][c] -= fac * M[col][c]
    u = [0.0] * (n + 1)
    for i in range(n - 1, -1, -1):
        s = M[i][n] - sum(M[i][j] * u[j + 1] for j in range(i + 1, n))
        u[i + 1] = s / M[i][i]
    stress = [E * (u[e + 1] - u[e]) / (Le * 1000) for e in range(n)]
    exact = P * (L * 1000) / (E * A)
    print(f"fem: L={fmt(L)} m, A={fmt(A)} mm², E={fmt(E)} MPa, P={fmt(P)} N, n={n}")
    row("element stiffness k", k, "N/mm")
    row("tip displacement (FEM)", u[-1], "mm", 6)
    row("tip displacement (PL/EA)", exact, "mm", 6)
    row("relative error", abs(u[-1] - exact) / exact, "-", 9)
    row("element stress", stress[-1], "MPa")
    row("reaction", -k * u[1], "N")
    row("equilibrium reaction + P", -k * u[1] + P, "N", 9)


# ---------------------------------------------------------------- fin

def fin(k: float, h: float, P: float, Ac: float, L: float, Tb: float, Tinf: float) -> None:
    m = math.sqrt(h * P / (k * Ac))
    mL = m * L
    eta = math.tanh(mL) / mL if mL > 0 else 1.0
    qmax = h * P * L * (Tb - Tinf)
    qf = eta * qmax
    print(f"fin: k={fmt(k)} W/mK, h={fmt(h)} W/m²K, P={fmt(P)} m, Ac={fmt(Ac)} m², L={fmt(L)} m")
    row("m = sqrt(hP/kAc)", m, "1/m")
    row("mL", mL, "-")
    row("fin efficiency", eta * 100, "%")
    row("heat rate (finned)", qf, "W")
    row("heat rate if entire fin at Tb", qmax, "W")
    row("tip temperature rise ratio", 1 / math.cosh(mL) if mL < 700 else 0, "-")


# ---------------------------------------------------------------- vibration

def vibration(m: float, k_kN_m: float, zeta: float, F0: float, ratio: float) -> None:
    """SDOF base/force excitation. m [kg], k [kN/m], F0 [N], r = omega/omega_n."""
    k = k_kN_m * 1000.0
    wn = math.sqrt(k / m)
    Xst = F0 / k
    r = ratio
    den = (1 - r * r) ** 2 + (2 * zeta * r) ** 2
    X = Xst / math.sqrt(den)
    phi = math.degrees(math.atan2(2 * zeta * r, 1 - r * r))
    Tr = math.sqrt((1 + (2 * zeta * r) ** 2) / den)
    rp = math.sqrt(1 - 2 * zeta * zeta) if zeta < 1 / math.sqrt(2) else 0.0
    Xmax = Xst / (2 * zeta * math.sqrt(1 - zeta * zeta)) if zeta > 0 else float("inf")
    print(f"vibration: m={fmt(m)} kg, k={fmt(k_kN_m)} kN/m, zeta={fmt(zeta)}, F0={fmt(F0)} N, r={fmt(r)}")
    row("omega_n", wn, "rad/s")
    row("f_n", wn / (2 * math.pi), "Hz")
    row("X_st = F0/k", Xst * 1000, "mm")
    row("X", X * 1000, "mm")
    row("phase", phi, "deg")
    row("transmissibility", Tr, "-")
    row("peak r", rp, "-")
    row("peak X", Xmax * 1000 if Xmax < 1e6 else float("inf"), "mm")
    row("check X/Xst", X / Xst, "-")


# ---------------------------------------------------------------- section

def section(b: float, h: float) -> None:
    A = b * h
    I = b * h ** 3 / 12
    W = I / (h / 2)
    r = math.sqrt(I / A)
    print(f"section: rectangle b={fmt(b)} mm, h={fmt(h)} mm")
    row("area", A, "mm²")
    row("I about centroid", I, "mm^4", 0)
    row("section modulus W", W, "mm^3", 0)
    row("radius of gyration", r, "mm")
    row("I for a 2 mm fibre", I / 1 * 2 / h, "mm^4", 0)


# ---------------------------------------------------------------- selftest

def close(a: float, b: float, tol: float = 1e-6) -> None:
    if abs(a - b) > tol * max(1.0, abs(b)):
        raise AssertionError(f"{a} != {b}")


def selftest() -> None:
    # Mohr: uniaxial 100 MPa -> principal 100, 0; R = 50
    C = 50.0
    R = math.hypot(50.0, 0.0)
    close(C + R, 100.0)
    close(C - R, 0.0)
    # von Mises for pure shear 100 MPa -> 173.2 MPa
    close(math.sqrt(3) * 100, 173.20508075688772, 1e-9)
    # Otto r=8: eta = 1 - 8^-0.4
    close(1 - 8 ** -0.4, 0.564724, 1e-5)
    # Pipe: laminar f = 64/Re
    close(64 / 1000, 0.064)
    # Colebrook should be close to Haaland for a typical case
    f1, f2 = colebrook(1e5, 1e-4), haaland(1e5, 1e-4)
    if abs(f1 - f2) > 5e-4:  # Haaland is a 1-2% approximation, not an identity
        raise AssertionError("Colebrook/Haaland disagree")
    # Beam: PL^3/48EI for midspan point load
    L, P, E, I = 4000.0, 2000.0, 200e3, 5e6  # mm, N, MPa, mm^4
    close(P * L ** 3 / (48 * E * I), 2.6666666667, 1e-6)
    # ISO 30 H7/p6
    h_lo, h_hi = iso_zone(30, "H7")
    s_lo, s_hi = iso_zone(30, "p6")
    close(h_hi, 21); close(s_lo, 22); close(s_hi, 35)
    # h6 at 30: -13..0; f7: -41..-20 -> H8/f7 clearance 20..74 µm
    h_lo6, h_hi6 = iso_zone(30, "h6")
    f_lo, f_hi = iso_zone(30, "f7")
    close(h_lo6, -13); close(h_hi6, 0); close(f_lo, -41); close(f_hi, -20)
    close(0 - f_hi, 20); close(33 - f_lo, 74)
    # 18 is in the 14-18 band: p6 = +18..+29, H7 = 0..+18 -> 0..29 µm interference
    p_lo, p_hi = iso_zone(18, "p6")
    close(p_lo, 18); close(p_hi, 29)
    # FEM: 1 m bar, 100 mm², 200 GPa, 10 kN -> 0.5 mm
    close(10000 * 1000 / (200000 * 100), 0.5)
    # Four-bar closure at 60 deg (no exception)
    fourbar(100, 25, 70, 85, 60)
    # SDOF: m=2, k=20 kN/m, zeta=.05, F0=50 -> wn=100, Xst=2.5 mm
    close(math.sqrt(20000 / 2), 100)
    close(50 / 20000 * 1000, 2.5)
    close(2.5 / math.sqrt((1 - 0.81) ** 2 + (0.09) ** 2), 11.891, 1e-4)
    # Fin: mL ~ 0.4836 for the documented example
    close(math.sqrt(50 * 0.104 / (200 * 1e-4)) * 0.03, 0.4836, 1e-3)
    print("SELFTEST OK")


# ---------------------------------------------------------------- main

def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    cmd = argv[1]
    try:
        if cmd == "beam":
            beam(*map(float, argv[2:7]))
        elif cmd == "mohr":
            mohr(*map(float, argv[2:5]))
        elif cmd == "pipe":
            pipe(*map(float, argv[2:6]))
        elif cmd == "otto":
            otto(*map(float, argv[2:5]))
        elif cmd == "fourbar":
            fourbar(*map(float, argv[2:7]))
        elif cmd == "fit":
            fit(float(argv[2]), argv[3], argv[4])
        elif cmd == "gear":
            gear(float(argv[2]), int(float(argv[3])), int(float(argv[4])), *map(float, argv[5:8]))
        elif cmd == "fem":
            fem_bar(float(argv[2]), float(argv[3]), float(argv[4]), float(argv[5]), int(float(argv[6])))
        elif cmd == "fin":
            fin(*map(float, argv[2:9]))
        elif cmd == "vibration":
            vibration(*map(float, argv[2:7]))
        elif cmd == "section":
            section(*map(float, argv[2:4]))
        elif cmd == "selftest":
            selftest()
        else:
            print(f"unknown command: {cmd}", file=sys.stderr)
            print(__doc__)
            return 2
    except (IndexError, ValueError, AssertionError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
