#!/usr/bin/env python3
"""CODATA 2022 constants and exact model checks for physics notes.

Run:
    python3 physics_check.py

Use as a library:
    from physics_check import tunneling_T, gamma, schwarzschild_radius_km

Every function states its model. If a note disagrees with one of these
benchmarks, one of the two is wrong; find out which before publishing.
"""

from __future__ import annotations

import math

# --- CODATA 2022 (SI) -------------------------------------------------------
c = 299_792_458.0
h = 6.626_070_15e-34
hbar = 1.054_571_817e-34
e = 1.602_176_634e-19
k_B = 1.380_649e-23
N_A = 6.022_140_76e23
G = 6.674_30e-11
m_e = 9.109_383_7015e-31
m_p = 1.672_621_923_69e-27
m_n = 1.674_927_498_04e-27
u = 1.660_539_066_60e-27
eps0 = 8.854_187_812_8e-12
mu0 = 1.256_637_062_12e-6
alpha = 7.297_352_569_3e-3
a0 = 5.291_772_109_03e-11
Ry_eV = 13.605_693_122_994
sigma_SB = 5.670_374_419e-8

# eV / nm shortcuts
HBAR2_2M_EV_NM2 = 0.038_099_82  # hbar^2 / (2 m_e) in eV nm^2
HBARC_EV_NM = 197.326_980_4
HC_EV_NM = 1_239.841_984      # hc, for photon energy E = hc/lambda
MEC2_MEV = 0.510_998_950


# --- Models -----------------------------------------------------------------
def infinite_well_eV(n: int, L_nm: float, m_ratio: float = 1.0) -> float:
    """E_n = n^2 pi^2 hbar^2 / (2 m L^2). Model: 1D infinite well."""
    return (n * math.pi) ** 2 * HBAR2_2M_EV_NM2 / (m_ratio * L_nm**2)


def kappa_per_nm(V0_eV: float, E_eV: float, m_ratio: float = 1.0) -> float:
    """Decay constant for E < V0: kappa = sqrt(2m(V0-E))/hbar, in 1/nm."""
    return math.sqrt(m_ratio * (V0_eV - E_eV) / HBAR2_2M_EV_NM2)


def tunneling_T(V0_eV: float, a_nm: float, E_eV: float, m_ratio: float = 1.0) -> float:
    """Exact rectangular-barrier transmission.

    E < V0: T = [1 + V0^2 sinh^2(kappa a) / (4 E (V0 - E))]^-1
    E > V0: T = [1 + V0^2 sin^2(k2 a)   / (4 E (E - V0))]^-1
    Model: 1D, time-independent, single effective mass.
    """
    if E_eV <= 0:
        raise ValueError("requires E > 0")
    if abs(E_eV - V0_eV) < 1e-12:
        # Continuous limit; avoids 0/0.
        k2a = math.sqrt(m_ratio * E_eV / HBAR2_2M_EV_NM2) * a_nm
        return 1.0 / (1.0 + (k2a**2) / 4.0)
    if E_eV < V0_eV:
        ka = kappa_per_nm(V0_eV, E_eV, m_ratio) * a_nm
        return 1.0 / (1.0 + V0_eV**2 * math.sinh(ka) ** 2 / (4 * E_eV * (V0_eV - E_eV)))
    k2a = math.sqrt(m_ratio * (E_eV - V0_eV) / HBAR2_2M_EV_NM2) * a_nm
    return 1.0 / (1.0 + V0_eV**2 * math.sin(k2a) ** 2 / (4 * E_eV * (E_eV - V0_eV)))


def gamma(beta: float) -> float:
    """Lorentz factor. Model: special relativity, inertial frames."""
    if not 0 <= beta < 1:
        raise ValueError("0 <= beta < 1")
    return 1.0 / math.sqrt(1.0 - beta**2)


def schwarzschild_radius_km(m_solar: float = 1.0) -> float:
    """r_s = 2GM/c^2. Model: non-rotating, uncharged black hole."""
    m_sun = 1.988_47e30
    return 2 * G * m_solar * m_sun / c**2 / 1000


def maxwell_boltzmann_v(molar_mass_kg: float, T: float, kind: str = "rms") -> float:
    """v_mp, v_avg, v_rms for an ideal gas. Model: classical, non-interacting, 3D."""
    R = k_B * N_A
    if kind == "mp":
        return math.sqrt(2 * R * T / molar_mass_kg)
    if kind == "avg":
        return math.sqrt(8 * R * T / (math.pi * molar_mass_kg))
    if kind == "rms":
        return math.sqrt(3 * R * T / molar_mass_kg)
    raise ValueError("kind = mp | avg | rms")


def photon_energy_eV(wavelength_nm: float) -> float:
    return HC_EV_NM / wavelength_nm


def thermal_energy_eV(T: float) -> float:
    return k_B * T / e


# --- Benchmarks -------------------------------------------------------------
def main() -> int:
    checks: list[tuple[str, float, float, float]] = []

    # name, computed, expected, tolerance (absolute)
    checks.append(("E1 infinite well a=1nm", infinite_well_eV(1, 1.0), 0.376_030, 1e-5))
    checks.append(("E2 infinite well a=1nm", infinite_well_eV(2, 1.0), 1.504_121, 1e-5))
    checks.append(("kappa a (1eV,1nm,0.5eV)", kappa_per_nm(1.0, 0.5) * 1.0, 3.622_626, 1e-5))
    checks.append(("T (1eV,1nm,0.5eV)", tunneling_T(1.0, 1.0, 0.5), 2.850_147e-3, 2e-6))
    checks.append(("gamma(0.6)", gamma(0.6), 1.250_000, 1e-9))
    checks.append(("gamma(0.9)", gamma(0.9), 2.294_157, 1e-5))
    checks.append(("r_s(1 Msun) km", schwarzschild_radius_km(1.0), 2.953, 2e-3))
    checks.append(("v_rms N2 300K", maxwell_boltzmann_v(0.028_013_4, 300.0, "rms"), 516.839, 0.01))
    checks.append(("v_avg N2 300K", maxwell_boltzmann_v(0.028_013_4, 300.0, "avg"), 476.173, 0.01))
    checks.append(("v_mp N2 300K", maxwell_boltzmann_v(0.028_013_4, 300.0, "mp"), 421.997, 0.01))
    checks.append(("photon 550 nm eV", photon_energy_eV(550.0), 2.254_258, 1e-5))
    checks.append(("kT at 300K eV", thermal_energy_eV(300.0), 0.025_852, 1e-6))

    print(f"{'quantity':30s} {'computed':>14s} {'expected':>14s}  status")
    ok = True
    for name, got, want, tol in checks:
        good = abs(got - want) <= tol
        ok &= good
        print(f"{name:30s} {got:14.6g} {want:14.6g}  {'PASS' if good else 'FAIL'}")

    # Ratios: model-independent and easy to remember.
    v_mp = maxwell_boltzmann_v(0.028_013_4, 300.0, "mp")
    v_avg = maxwell_boltzmann_v(0.028_013_4, 300.0, "avg")
    v_rms = maxwell_boltzmann_v(0.028_013_4, 300.0, "rms")
    ratios = (v_mp / v_rms, v_avg / v_rms)
    exp = (0.816_497, 0.921_318)
    good = all(abs(a - b) < 1e-5 for a, b in zip(ratios, exp))
    ok &= good
    print(f"{'ratios mp:avg:rms':30s} {ratios[0]:.6f},{ratios[1]:.6f} {exp[0]:.6f},{exp[1]:.6f}  "
          f"{'PASS' if good else 'FAIL'}")

    # Limit tests (these catch reversed limits, a classic failure mode).
    limits = [
        ("T -> 1 as E >> V0", abs(tunneling_T(1.0, 1.0, 100.0) - 1) < 1e-4),
        ("T -> 0 as a -> large", tunneling_T(1.0, 20.0, 0.5) < 1e-50),
        ("E = V0 is finite", 0 < tunneling_T(1.0, 1.0, 1.0) < 1),
        ("gamma -> 1 as beta -> 0", abs(gamma(1e-9) - 1) < 1e-12),
        ("E_n ~ n^2", abs(infinite_well_eV(3, 1.0) / infinite_well_eV(1, 1.0) - 9) < 1e-9),
    ]
    for name, good in limits:
        ok &= good
        print(f"LIMIT {name:38s} {'PASS' if good else 'FAIL'}")

    print("\nSELFTEST OK" if ok else "\nSELFTEST FAILED")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
