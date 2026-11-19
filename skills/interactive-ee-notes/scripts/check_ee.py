#!/usr/bin/env python3
"""Independent numeric oracle for the interactive EE lab engines.

Pure Python (stdlib math). It shares formulas with the JS engines but not
their code, so a sign, unit or model error has to be made twice to pass.

Usage:
    python3 check_ee.py selftest
    python3 check_ee.py dc --vs 12 --r1 4 --r2 6 --rl 2.4
    python3 check_ee.py transient --vs 10 --r 1 --c 1 --t 1
    python3 check_ee.py bode --r 1 --c 100 --kind lp --dec 0
    python3 check_ee.py bjt --vcc 12 --r1 47 --r2 10 --rc 2.2 --re 1 --beta 150
    python3 check_ee.py logic --td -10 --tsu 5 --th 3
    python3 check_ee.py sampling --f0 1100 --fs 1000
    python3 check_ee.py am --m 1 --fm 1000 --fc 10000
    python3 check_ee.py constellation --m 16 --ebn0 13.43
    python3 check_ee.py link --pt 20 --gt 2 --gr 2 --freq 2400 --dist 100 --loss 0 --sens -90
    python3 check_ee.py three-phase --vll 400 --r 10 --x 6 --conn y --pft 0.95
    python3 check_ee.py diode --vs 5 --r 1 --is 2.1e-9 --n 1.75 --tc 25
    python3 check_ee.py fourier --a 1 --n 25 --duty 0.5
    python3 check_ee.py mosfet --vgs 3 --vds 3 --vth 1 --kn 0.001 --lam 0 --vdd 10 --rd 3
    python3 check_ee.py txline --z0 50 --zl 75 --xl 0 --len 0
    python3 check_ee.py control --zeta 0.5 --wn 2 --k 1
    python3 check_ee.py transformer --s 10000 --v1 2400 --v2 240 --req 8 --xeq 20 --p0 120 --load 1 --pf 1
    python3 check_ee.py dft --n 32 --fs 1000 --f0 125 --window rect --a 1
    python3 check_ee.py power --vin 12 --vout 5 --iout 0.5 --f 100000 --l 0.000022 --mode buck

Every command prints values, checks 2-4 invariants and ends with
SELFTEST OK (or FAIL). --json emits a machine-readable object.
"""

from __future__ import annotations

import json
import math
import sys


def qfunc(x: float) -> float:
    return 0.5 * math.erfc(x / math.sqrt(2.0))


def db(x: float) -> float:
    return 20.0 * math.log10(max(x, 1e-300))


class Checker:
    def __init__(self) -> None:
        self.rows: list[tuple[str, str]] = []
        self.checks: list[dict] = []

    def row(self, name: str, value: str) -> None:
        self.rows.append((name, value))

    def check(self, name: str, condition: bool, detail: str = "") -> None:
        self.checks.append({"name": name, "ok": bool(condition), "detail": detail})
        print(("PASS " if condition else "FAIL ") + name + ((" — " + detail) if detail else ""))
        if not condition:
            raise SystemExit(1)

    def finish(self) -> dict:
        print("\n" + " | ".join(f"{k}: {v}" for k, v in self.rows))
        print("SELFTEST OK")
        return {"rows": self.rows, "checks": self.checks}


def cmd_dc(o: dict) -> dict:
    vs = float(o.get("vs", 12)); r1 = float(o.get("r1", 4)); r2 = float(o.get("r2", 6)); rl = float(o.get("rl", 2.4))
    rth = r1 * r2 / (r1 + r2); vth = vs * r2 / (r1 + r2)
    il = vth / (rth + rl); vl = il * rl; pl = vth * vth * rl / (rth + rl) ** 2
    eta = rl / (rth + rl); pmax = vth * vth / (4 * rth)
    c = Checker()
    c.row("Vth (V)", f"{vth:.6f}"); c.row("Rth (kΩ)", f"{rth:.6f}")
    c.row("IL (mA)", f"{il:.6f}"); c.row("PL (mW)", f"{pl:.6f}")
    c.row("eta", f"{eta:.6f}"); c.row("Pmax (mW)", f"{pmax:.6f}")
    c.check("Vth/Rth = 3 mA", abs(vth / (rth * 1000) - 0.003) < 1e-12)
    c.check("Pmax = 5.4 mW at RL = Rth", abs(pmax - 5.4) < 1e-9)
    c.check("efficiency at max power is 50%", abs(eta - 0.5) < 1e-12)
    c.check("loaded power equals Pmax at RL=Rth", abs(pl - pmax) < 1e-12)
    return c.finish()


def cmd_transient(o: dict) -> dict:
    vs = float(o.get("vs", 10)); r = float(o.get("r", 1)); cuf = float(o.get("c", 1)); tms = float(o.get("t", 1))
    tau = r * cuf / 1000.0  # kΩ * µF = ms; convert to s
    t = tms / 1000.0
    v = vs * (1 - math.exp(-t / tau)); i = vs / (r * 1000.0) * math.exp(-t / tau)
    e = 0.5 * (cuf * 1e-6) * vs * vs
    c = Checker()
    c.row("tau (ms)", f"{tau * 1000:.6f}"); c.row("vC (V)", f"{v:.6f}")
    c.row("i (mA)", f"{i * 1000:.6f}"); c.row("E (mJ)", f"{e * 1000:.6f}")
    c.check("tau = 1 ms", abs(tau - 1e-3) < 1e-15)
    c.check("v(tau) = 0.6321 Vs", abs(v / vs - (1 - math.exp(-1))) < 1e-12)
    c.check("v(5tau) = 0.9933 Vs", abs((1 - math.exp(-5)) - 0.993262053) < 1e-9)
    return c.finish()


def cmd_bode(o: dict) -> dict:
    r = float(o.get("r", 1)); cuf = float(o.get("c", 100)); kind = o.get("kind", "lp"); dec = float(o.get("dec", 0))
    fc = 1.0 / (2 * math.pi * r * 1000.0 * cuf * 1e-9)
    f = fc * 10 ** dec; u = f / fc
    if kind == "hp":
        mag = u / math.sqrt(1 + u * u); phase = 90 - math.degrees(math.atan(u))
    else:
        mag = 1 / math.sqrt(1 + u * u); phase = -math.degrees(math.atan(u))
    c = Checker()
    c.row("fc (Hz)", f"{fc:.6f}"); c.row("f (Hz)", f"{f:.6f}")
    c.row("|H| (dB)", f"{db(mag):.6f}"); c.row("phase (deg)", f"{phase:.6f}")
    c.check("fc = 1591.55 Hz", abs(fc - 1591.5494309) < 1e-4)
    c.check("LP at fc is -3.0103 dB", abs(db(1 / math.sqrt(2)) + 3.0103) < 1e-3)
    c.check("LP phase at fc is -45 deg", abs(-45 - phase) < 1e-9)
    return c.finish()


def cmd_bjt(o: dict) -> dict:
    vcc = float(o.get("vcc", 12)); r1 = float(o.get("r1", 47)); r2 = float(o.get("r2", 10))
    rc = float(o.get("rc", 2.2)); re = float(o.get("re", 1)); beta = float(o.get("beta", 150))
    vbb = vcc * r2 / (r1 + r2); rb = r1 * r2 / (r1 + r2)
    ib = max(0.0, (vbb - 0.65) / (rb + (beta + 1) * re))
    ic = beta * ib; ie = (beta + 1) * ib
    vc = vcc - ic * rc; ve = ie * re; vce = vc - ve
    region = "cutoff" if ib <= 1e-12 else ("saturation" if vce < 0.2 else "active")
    gm = ic / 0.026; rpi = beta / gm
    c = Checker()
    c.row("VBB (V)", f"{vbb:.6f}"); c.row("IB (uA)", f"{ib * 1000:.6f}")
    c.row("IC (mA)", f"{ic:.6f}"); c.row("VCE (V)", f"{vce:.6f}")
    c.row("region", region); c.row("gm (mS)", f"{gm:.3f}")
    c.check("default Q is active", region == "active")
    c.check("IC = 1.371 mA", abs(ic - 1.371) < 0.01)
    c.check("KVL holds", abs(vcc - (ic * rc + vce + ie * re)) < 1e-12)
    return c.finish()


def cmd_logic(o: dict) -> dict:
    td = float(o.get("td", -10)); tsu = float(o.get("tsu", 5)); th = float(o.get("th", 3))
    stable = td <= -tsu or td >= th
    setup_margin = -td - tsu; hold_margin = td - th
    c = Checker()
    c.row("td (ns)", f"{td:.3f}"); c.row("setup margin", f"{setup_margin:.3f}")
    c.row("hold margin", f"{hold_margin:.3f}"); c.row("Q", "D" if stable else "metastable")
    c.check("td=-10 ns is stable", stable)
    c.check("td=0 ns is a violation", not (0 <= -tsu or 0 >= th))
    c.check("td=+4 ns with th=3 is stable", 4 >= th)
    return c.finish()


def cmd_sampling(o: dict) -> dict:
    f0 = float(o.get("f0", 1100)); fs = float(o.get("fs", 1000))
    fa = abs(f0 - fs * round(f0 / fs)); nyq = fs / 2
    c = Checker()
    c.row("f0 (Hz)", f"{f0:.3f}"); c.row("fs (Hz)", f"{fs:.3f}")
    c.row("Nyquist (Hz)", f"{nyq:.3f}"); c.row("alias (Hz)", f"{fa:.3f}")
    c.check("1100 Hz at 1000 Hz aliases to 100 Hz", abs(abs(1100 - 1000 * round(1100 / 1000)) - 100) < 1e-9)
    c.check("1200 Hz at 1000 Hz aliases to 200 Hz", abs(abs(1200 - 1000 * round(1200 / 1000)) - 200) < 1e-9)
    c.check("1100 Hz at 3000 Hz has no alias",
            abs(abs(1100 - 3000 * round(1100 / 3000)) - 1100) < 1e-9)
    return c.finish()


def cmd_am(o: dict) -> dict:
    m = float(o.get("m", 1)); fm = float(o.get("fm", 1000)); fc = float(o.get("fc", 10000))
    eta = m * m / (2 + m * m); pc = 2 / (2 + m * m); sb = m * m / (2 + m * m)
    c = Checker()
    c.row("m", f"{m:.3f}"); c.row("eta", f"{eta:.6f}")
    c.row("carrier fraction", f"{pc:.6f}"); c.row("sideband fraction", f"{sb:.6f}")
    c.row("bandwidth (Hz)", f"{2 * fm:.3f}")
    c.check("m=1 gives 33.33% efficiency", abs(eta - 1 / 3) < 1e-12)
    c.check("m=0.5 gives 11.11% efficiency", abs(0.5 ** 2 / (2 + 0.5 ** 2) - 1 / 9) < 1e-12)
    c.check("sidebands are fc±fm", (fc - fm, fc + fm) == (9000.0, 11000.0))
    return c.finish()


def cmd_constellation(o: dict) -> dict:
    M = int(float(o.get("m", 16))); ebn0db = float(o.get("ebn0", 13.43))
    k = math.log2(M); ebn0 = 10 ** (ebn0db / 10)
    ber = (4 / k) * (1 - 1 / math.sqrt(M)) * qfunc(math.sqrt(3 * k / (M - 1) * ebn0))
    es = (M - 1) / 6
    c = Checker()
    c.row("M", str(M)); c.row("k", f"{k:.0f}"); c.row("Es", f"{es:.6f}")
    c.row("BER", f"{ber:.3e}")
    c.check("4-QAM at 9.59 dB is ~1e-5", 0.5e-5 < qfunc(math.sqrt(2 * 10 ** (9.59 / 10))) < 2e-5)
    c.check("16-QAM at 13.43 dB is ~1e-5", 0.5e-5 < 0.75 * qfunc(math.sqrt(0.8 * ebn0)) < 2e-5)
    c.check("16-QAM Es = 2.5", abs(es - 2.5) < 1e-12)
    return c.finish()


def cmd_link(o: dict) -> dict:
    pt = float(o.get("pt", 20)); gt = float(o.get("gt", 2)); gr = float(o.get("gr", 2))
    freq = float(o.get("freq", 2400)); dist = float(o.get("dist", 100))
    loss = float(o.get("loss", 0)); sens = float(o.get("sens", -90))
    lam = 300 / freq; fspl = 20 * math.log10(4 * math.pi * dist / lam)
    pr = pt + gt + gr - fspl - loss; margin = pr - sens
    c = Checker()
    c.row("lambda (m)", f"{lam:.6f}"); c.row("FSPL (dB)", f"{fspl:.6f}")
    c.row("Pr (dBm)", f"{pr:.6f}"); c.row("margin (dB)", f"{margin:.6f}")
    c.check("2.4 GHz 100 m FSPL = 80.05 dB", abs(fspl - 80.05) < 0.02)
    c.check("doubling distance adds 6.02 dB", abs(20 * math.log10(2) - 6.0206) < 1e-3)
    c.check("default Pr = -56.05 dBm", abs(pr + 56.05) < 0.02)
    return c.finish()



def cmd_three_phase(o: dict) -> dict:
    vll = float(o.get("vll", 400)); r = float(o.get("r", 10)); x = float(o.get("x", 6))
    conn = o.get("conn", "y"); pft = float(o.get("pft", 0.95))
    y = conn != "d"
    vph = vll / math.sqrt(3) if y else vll
    z = math.hypot(r, x); iph = vph / z; il = iph if y else math.sqrt(3) * iph
    P = 3 * iph * iph * r; Q = 3 * iph * iph * x; S = 3 * vph * iph
    pf = r / z; phi = math.atan2(x, r); phi2 = math.acos(pft)
    qafter = P * math.tan(phi2); qc = P * (math.tan(phi) - math.tan(phi2))
    C = qc / (3 * 2 * math.pi * 50 * vph * vph) if qc > 0 else 0.0
    c = Checker()
    c.row("V_ph (V)", f"{vph:.3f}"); c.row("I_L (A)", f"{il:.3f}")
    c.row("P (kW)", f"{P/1000:.4f}"); c.row("Q (kvar)", f"{Q/1000:.4f}")
    c.row("S (kVA)", f"{S/1000:.4f}"); c.row("PF", f"{pf:.4f}")
    c.row("Qc bank (kvar)", f"{qc/1000:.4f}"); c.row("C/faz (uF)", f"{C*1e6:.2f}")
    c.check("P = 11.765 kW", abs(P - 11765.0) < 12.0)
    c.check("Q = 7.059 kvar", abs(Q - 7059.0) < 8.0)
    c.check("Qc bank = 3.192 kvar", abs(qc - 3192.0) < 10.0)
    c.check("C/faz = 63.5 uF", abs(C * 1e6 - 63.5) < 0.5)
    c.check("balanced Y neutral current is zero", y)
    return c.finish()


def _diode_solve(vs, r_ohm, is25, n, tc):
    qe = 1.602176634e-19; kb = 1.380649e-23; t0 = 298.15; eg = 1.12; kbev = 8.617333262e-5
    T = tc + 273.15
    vt = kb * T / qe
    isat = is25 * (T / t0) ** 3 * math.exp((eg / (n * kbev)) * (1 / t0 - 1 / T))
    lo, hi = 0.0, max(vs, 0.05)
    for _ in range(100):
        mid = (lo + hi) / 2
        x = mid / (n * vt)
        f = isat * (math.expm1(x) if x < 700 else 1e300) - (vs - mid) / r_ohm
        if f > 0: hi = mid
        else: lo = mid
    vd = (lo + hi) / 2
    idd = (vs - vd) / r_ohm
    rd = n * vt / (idd + isat)
    return vd, idd, rd, vt, isat


def cmd_diode(o: dict) -> dict:
    vs = float(o.get("vs", 5)); r = float(o.get("r", 1)); is25 = float(o.get("is", 2.1e-9))
    n = float(o.get("n", 1.75)); tc = float(o.get("tc", 25))
    vd, idd, rd, vt, isat = _diode_solve(vs, r * 1000, is25, n, tc)
    c = Checker()
    c.row("V_D (V)", f"{vd:.6f}"); c.row("I_D (mA)", f"{idd*1000:.6f}")
    c.row("r_d (ohm)", f"{rd:.3f}"); c.row("V_T (mV)", f"{vt*1000:.3f}")
    c.check("V_D = 0.654 V", abs(vd - 0.654) < 0.006)
    c.check("I_D = 4.35 mA", abs(idd * 1000 - 4.35) < 0.08)
    c.check("KVL residual < 1e-9", abs(vs - vd - idd * r * 1000) < 1e-9)
    c.check("r_d ~ 10.4 ohm", abs(rd - 10.4) < 1.0)
    return c.finish()


def cmd_fourier(o: dict) -> dict:
    A = float(o.get("a", 1)); N = int(float(o.get("n", 25))); duty = float(o.get("duty", 0.5))
    # Square wave ±A with duty D; fundamental sine amplitude 4A/pi for D=0.5.
    fund = 4 * A / math.pi
    # Sum of odd harmonic powers / signal power for a 50% square.
    # Use a high harmonic count for the convergence check, independent of N.
    NP = max(N, 2000)
    psum = sum((4 * A / (math.pi * k)) ** 2 / 2 for k in range(1, 2 * NP, 2))
    psig = A * A
    parseval = psum / psig
    # Gibbs overshoot for N-term partial sum, sampled on a fine grid.
    peak = 0.0
    for i in range(20001):
        t = i / 20000.0
        v = 0.0
        for k in range(1, 2 * N, 2):
            v += (4 * A / (math.pi * k)) * math.sin(2 * math.pi * k * t)
        peak = max(peak, abs(v))
    gibbs = (peak - A) / (2 * A) * 100
    c = Checker()
    c.row("fundamental (V)", f"{fund:.6f}"); c.row("Gibbs (%)", f"{gibbs:.4f}")
    c.row("Parseval", f"{parseval:.9f}"); c.row("N", str(N))
    c.check("square fundamental = 4A/pi", abs(fund - 4 * A / math.pi) < 1e-12)
    c.check("Gibbs overshoot ~8.95%", 8.0 < gibbs < 9.5)
    c.check("Parseval approaches 1", 0.9995 < parseval <= 1.0000001)
    c.check("duty 50% is the square-wave case", abs(duty - 0.5) < 1e-12)
    return c.finish()


def cmd_mosfet(o: dict) -> dict:
    vgs = float(o.get("vgs", 3)); vds = float(o.get("vds", 3)); vth = float(o.get("vth", 1))
    kn = float(o.get("kn", 1e-3)); lam = float(o.get("lam", 0)); vdd = float(o.get("vdd", 10))
    rd = float(o.get("rd", 3)) * 1000
    vov = vgs - vth
    if vov <= 0:
        idd, region, gm, gds = 0.0, "cutoff", 0.0, 0.0
    elif vds < vov:
        idd = kn * (vov * vds - 0.5 * vds * vds) * (1 + lam * vds)
        region = "triode"; gm = kn * vds * (1 + lam * vds); gds = kn * (vov - vds)
    else:
        idd = 0.5 * kn * vov * vov * (1 + lam * vds)
        region = "saturation"; gm = kn * vov * (1 + lam * vds); gds = 0.5 * kn * vov * vov * lam
    av = -gm * rd / (1 + gds * rd) if rd > 0 else 0.0
    c = Checker()
    c.row("V_ov (V)", f"{vov:.3f}"); c.row("I_D (mA)", f"{idd*1000:.4f}")
    c.row("region", region); c.row("gm (mS)", f"{gm*1000:.4f}")
    c.row("gds (uS)", f"{gds*1e6:.4f}"); c.row("Av", f"{av:.3f}")
    c.check("default Id = 2.00 mA", abs(idd * 1000 - 2.0) < 1e-6)
    c.check("saturation boundary Vds = 2 V", abs(vov - 2.0) < 1e-12)
    c.check("triode at Vds=1 -> 1.50 mA", abs(kn * (2 * 1 - 0.5) * 1000 - 1.5) < 1e-9)
    c.check("lambda=0.02 at Vds=3 -> 2.12 mA", abs(0.5 * kn * 4 * (1 + 0.02 * 3) * 1000 - 2.12) < 1e-6)
    return c.finish()


def cmd_txline(o: dict) -> dict:
    z0 = float(o.get("z0", 50)); zl = float(o.get("zl", 75)); xl = float(o.get("xl", 0))
    length = float(o.get("len", 0)); zload = complex(zl, xl)
    gamma = (zload - z0) / (zload + z0)
    gmag = abs(gamma); vswr = (1 + gmag) / (1 - gmag) if gmag < 1 else float("inf")
    rl = -20 * math.log10(gmag) if gmag > 0 else float("inf")
    beta_l = 2 * math.pi * length
    zin = z0 * (zload + 1j * z0 * math.tan(beta_l)) / (z0 + 1j * zload * math.tan(beta_l))
    c = Checker()
    c.row("Gamma", f"{gamma.real:.6f}{gamma.imag:+.6f}j"); c.row("|Gamma|", f"{gmag:.6f}")
    c.row("VSWR", f"{vswr:.6f}"); c.row("return loss (dB)", f"{rl:.4f}")
    c.row("Zin (ohm)", f"{zin.real:.4f}{zin.imag:+.4f}j")
    c.check("75/50 -> Gamma=0.2", abs(gmag - 0.2) < 1e-12)
    c.check("75/50 -> VSWR=1.5", abs(vswr - 1.5) < 1e-12)
    c.check("75/50 -> return loss 13.98 dB", abs(rl - 13.9794) < 1e-3)
    c.check("quarter-wave matching section sqrt(50*75)=61.24", abs(math.sqrt(50 * 75) - 61.2372) < 1e-3)
    c.check("|Gamma| <= 1", gmag <= 1.0 + 1e-12)
    return c.finish()


def cmd_control(o: dict) -> dict:
    zeta = float(o.get("zeta", 0.5)); wn = float(o.get("wn", 2)); K = float(o.get("k", 1))
    if zeta < 1:
        wd = wn * math.sqrt(1 - zeta * zeta)
        mp = 100 * math.exp(-math.pi * zeta / math.sqrt(1 - zeta * zeta))
        tp = math.pi / wd
        ts = 4 / (zeta * wn) if zeta > 0 else float("inf")
        poles = (-zeta * wn, wd), (-zeta * wn, -wd)
    else:
        mp, tp, ts = 0.0, 0.0, 4 / (zeta * wn) if zeta > 0 else float("inf")
        poles = (-zeta * wn + wn * math.sqrt(zeta * zeta - 1), 0.0), (-zeta * wn - wn * math.sqrt(zeta * zeta - 1), 0.0)
    c = Checker()
    c.row("Mp (%)", f"{mp:.3f}"); c.row("tp (s)", f"{tp:.4f}")
    c.row("ts (s)", f"{ts:.4f}"); c.row("K", f"{K:.3f}")
    c.row("poles", "; ".join(f"{p[0]:.3f}{p[1]:+.3f}j" for p in poles))
    c.check("zeta=0.5 -> Mp=16.30%", abs(mp - 16.303) < 0.01)
    c.check("zeta=0.5, wn=2 -> tp=1.814 s", abs(tp - 1.8138) < 1e-3)
    c.check("zeta=0.707 -> Mp~4.3%", abs(100 * math.exp(-math.pi * 0.707 / math.sqrt(1 - 0.707 ** 2)) - 4.32) < 0.1)
    c.check("zeta>=1 -> no overshoot", zeta < 1 or mp == 0)
    return c.finish()


def cmd_transformer(o: dict) -> dict:
    S = float(o.get("s", 10000)); V1 = float(o.get("v1", 2400)); V2 = float(o.get("v2", 240))
    Req = float(o.get("req", 8)); Xeq = float(o.get("xeq", 20)); P0 = float(o.get("p0", 120))
    load = float(o.get("load", 1)); pf = float(o.get("pf", 1.0))
    I1 = load * S / V1; I2 = load * S / V2
    Pcu = I1 * I1 * Req; Pout = load * S * pf
    eta = 100 * Pout / (Pout + P0 + Pcu) if Pout + P0 + Pcu > 0 else 0
    phi = math.acos(pf)
    A = I1 * (Req * pf + Xeq * math.sin(phi)); B = I1 * (Xeq * pf - Req * math.sin(phi))
    v2p = math.sqrt(max(0, V1 * V1 - B * B)) - A
    reg = (V1 - v2p) / V1 * 100
    # Regulation at 0.8 lag is a separate check from the efficiency PF.
    phi08 = math.acos(0.8)
    A08 = I1 * (Req * 0.8 + Xeq * math.sin(phi08))
    B08 = I1 * (Xeq * 0.8 - Req * math.sin(phi08))
    v2p08 = math.sqrt(max(0, V1 * V1 - B08 * B08)) - A08
    reg08 = (V1 - v2p08) / V1 * 100
    PcuFL = (S / V1) ** 2 * Req; npeak = math.sqrt(P0 / PcuFL)
    c = Checker()
    c.row("I1 (A)", f"{I1:.4f}"); c.row("I2 (A)", f"{I2:.4f}")
    c.row("Pcu (W)", f"{Pcu:.3f}"); c.row("eta (%)", f"{eta:.4f}")
    c.row("regulation @PF (%)", f"{reg:.4f}"); c.row("regulation @0.8 lag (%)", f"{reg08:.4f}")
    c.row("n_peak (pu)", f"{npeak:.4f}")
    c.check("full-load eta at PF=1 = 97.48%", abs(eta - 97.48) < 0.05)
    c.check("peak-load fraction = 0.9295", abs(npeak - 0.9295) < 1e-4)
    c.check("regulation at 0.8 lag = 3.21%", abs(reg08 - 3.21) < 0.05)
    c.check("S1 ~ S2", abs(V1 * I1 - V2 * I2) < 1e-6)
    return c.finish()


def cmd_dft(o: dict) -> dict:
    N = int(float(o.get("n", 32))); fs = float(o.get("fs", 1000)); f0 = float(o.get("f0", 125))
    window = o.get("window", "rect"); A = float(o.get("a", 1))
    x = [A * math.sin(2 * math.pi * f0 * n / fs) for n in range(N)]
    if window == "hann":
        x = [x[n] * (0.5 - 0.5 * math.cos(2 * math.pi * n / (N - 1))) for n in range(N)]
    X = []
    for k in range(N):
        re = im = 0.0
        for n in range(N):
            ang = -2 * math.pi * k * n / N
            re += x[n] * math.cos(ang); im += x[n] * math.sin(ang)
        X.append((re, im))
    mags = [math.hypot(re, im) for re, im in X]
    peak = max(range(N), key=lambda k: mags[k])
    df = fs / N
    energy_time = sum(v * v for v in x)
    energy_freq = sum(m * m for m in mags) / N
    parseval = energy_freq / energy_time if energy_time > 0 else 0
    c = Checker()
    c.row("Delta f (Hz)", f"{df:.4f}"); c.row("peak bin", str(peak))
    c.row("peak freq (Hz)", f"{peak*df:.3f}"); c.row("Parseval", f"{parseval:.9f}")
    c.check("Delta f = fs/N = 31.25 Hz", abs(df - 31.25) < 1e-12)
    c.check("125 Hz tone peaks at bin 4", peak == 4)
    c.check("Parseval = 1", abs(parseval - 1) < 1e-9)
    c.check("110 Hz is off-bin and leaks", abs(110 - 4 * df) > 1e-9)
    return c.finish()


def cmd_power(o: dict) -> dict:
    vin = float(o.get("vin", 12)); vout = float(o.get("vout", 5)); iout = float(o.get("iout", 0.5))
    f = float(o.get("f", 100e3)); L = float(o.get("l", 22e-6)); mode = o.get("mode", "buck")
    if mode == "boost":
        D = 1 - vin / vout
        ripple = vin * D / (L * f)
    else:
        D = vout / vin
        ripple = vout * (1 - D) / (L * f)
    boundary = ripple / 2
    ccm = iout > boundary
    pout = vout * iout
    c = Checker()
    c.row("D", f"{D:.4f}"); c.row("Delta IL (A)", f"{ripple:.4f}")
    c.row("CCM boundary (A)", f"{boundary:.4f}"); c.row("Pout (W)", f"{pout:.4f}")
    c.row("mode", "CCM" if ccm else "DCM")
    c.check("buck D = 0.4167", abs(vout / vin - 0.4167) < 1e-4)
    c.check("buck ripple = 1.326 A", abs(ripple - 1.326) < 1e-3)
    c.check("buck CCM boundary = 0.663 A", abs(boundary - 0.663) < 1e-3)
    c.check("boost 5->12 D = 0.5833", abs(1 - 5 / 12 - 0.5833) < 1e-4)
    c.check("default Iout=0.5 A is DCM", not ccm)
    c.check("Iout=1.0 A is CCM", 1.0 > boundary)
    return c.finish()


COMMANDS = {
    "dc": cmd_dc, "transient": cmd_transient, "bode": cmd_bode, "bjt": cmd_bjt,
    "logic": cmd_logic, "sampling": cmd_sampling, "am": cmd_am,
    "constellation": cmd_constellation, "link": cmd_link,
    "three-phase": cmd_three_phase, "diode": cmd_diode, "fourier": cmd_fourier,
    "mosfet": cmd_mosfet, "txline": cmd_txline, "control": cmd_control,
    "transformer": cmd_transformer, "dft": cmd_dft, "power": cmd_power,
}


def main() -> int:
    argv = sys.argv[1:]
    as_json = "--json" in argv
    argv = [a for a in argv if a != "--json"]
    if not argv or argv[0] in {"-h", "--help"}:
        print(__doc__)
        return 0
    cmd = argv[0]
    opts: dict[str, str] = {}
    i = 1
    while i < len(argv):
        key = argv[i].lstrip("-")
        if i + 1 >= len(argv):
            print(f"missing value for --{key}", file=sys.stderr)
            return 2
        opts[key] = argv[i + 1]
        i += 2

    if cmd == "selftest":
        results = {}
        for name in ["dc", "transient", "bode", "bjt", "logic", "sampling", "am", "constellation", "link",
                     "three-phase", "diode", "fourier", "mosfet", "txline", "control",
                     "transformer", "dft", "power"]:
            print(f"\n=== {name} ===")
            results[name] = COMMANDS[name]({})
        if as_json:
            print(json.dumps(results, indent=2))
        return 0
    if cmd not in COMMANDS:
        print(f"unknown command: {cmd}", file=sys.stderr)
        return 2
    result = COMMANDS[cmd](opts)
    if as_json:
        print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
