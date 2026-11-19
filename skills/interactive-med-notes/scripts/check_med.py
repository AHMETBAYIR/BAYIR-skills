#!/usr/bin/env python3
"""Independent checks for the interactive medical note engines.

This script deliberately does not import the JavaScript. It is a second
implementation of the same teaching equations, so the browser readout and the
printed note can be checked against a value that was computed elsewhere.

Usage:
    python3 check_med.py selftest
    python3 check_med.py ecg --hr 72 --pr 160 --qrs 90 --qt 400 --axis 60 --st 0
    python3 check_med.py pv --edv 120 --ees 2.5 --ea 2.0 --hr 70
    python3 check_med.py oxygen --pao2 95 --hb 15 --ph 7.4 --temp 37 --dpg normal --co 0
    python3 check_med.py acidbase --paco2 40 --hco3 24 --na 140 --cl 104 --alb 4
    python3 check_med.py pk --dose 100 --vd 50 --cl 5 --f 0.6 --ka 1 --route oral
    python3 check_med.py pd --emax 100 --ec50 1 --n 1 --mode none --i 0 --ki 1
    python3 check_med.py epi --prevalence 10 --sens 90 --spec 95
    python3 check_med.py ct --ww 80 --wl 40 --hu 40
    python3 check_med.py gcs --e 4 --v 5 --m 6
    python3 check_med.py bmi --weight 70 --height 175
    python3 check_med.py egfr --age 50 --sex F --scr 1.0
    python3 check_med.py sodium --na 130 --glucose 600
"""

from __future__ import annotations

import argparse
import json
import math
import sys


def _finite(value: float) -> float:
    return float(value)


def ecg(hr: float, pr: float, qrs: float, qt: float, axis: float, st: float) -> dict:
    rr = 60.0 / hr
    qtc_b = (qt / 1000.0) / math.sqrt(rr)
    qtc_f = (qt / 1000.0) / (rr ** (1.0 / 3.0))
    lead_i = math.cos(math.radians(axis))
    lead_ii = math.cos(math.radians(axis - 60))
    lead_iii = math.cos(math.radians(axis - 120))
    a_vf = math.cos(math.radians(axis - 90))
    return {
        "hr": hr,
        "rr_s": rr,
        "pr_ms": pr,
        "qrs_ms": qrs,
        "qt_ms": qt,
        "qtc_bazett_ms": qtc_b * 1000,
        "qtc_fridericia_ms": qtc_f * 1000,
        "axis_deg": axis,
        "lead_i": lead_i,
        "lead_ii": lead_ii,
        "lead_iii": lead_iii,
        "a_vf": a_vf,
        "einthoven_check": lead_ii - (lead_i + lead_iii),
        "st_mm": st,
    }


def pv(edv: float, ees: float, ea: float, hr: float) -> dict:
    v0 = 15.0
    esv = (ees * v0 + ea * edv) / (ees + ea)
    esv = min(max(esv, v0), edv - 1)
    sv = edv - esv
    ef = sv / edv
    co = sv * hr / 1000.0
    pes = ees * (esv - v0)
    sw = pes * (sv / 1000.0) * 0.1333
    return {
        "edv_ml": edv,
        "esv_ml": esv,
        "sv_ml": sv,
        "ef": ef,
        "ef_pct": ef * 100,
        "co_l_min": co,
        "pes_mmhg": pes,
        "stroke_work_j": sw,
        "ea_mmhg_ml": ea,
        "ees_mmhg_ml": ees,
    }


def oxygen(pao2: float, hb: float, ph: float, temp: float, dpg: str, co: float) -> dict:
    dpg_factor = {"high": 1.12, "low": 0.88, "normal": 1.0}[dpg]
    p50 = 26.6 * (10 ** (-0.48 * (ph - 7.4))) * (1 + 0.03 * (temp - 37)) * dpg_factor
    n = 2.7
    sao2 = (pao2 ** n) / (p50 ** n + pao2 ** n)
    hb_eff = hb * (1 - co / 100.0)
    cao2 = 1.34 * hb_eff * sao2 + 0.003 * pao2
    do2 = cao2 * 5.0 * 10.0
    return {
        "p50_mmhg": p50,
        "sao2": sao2,
        "sao2_pct": sao2 * 100,
        "hb_eff_g_dl": hb_eff,
        "cao2_ml_dl": cao2,
        "do2_ml_min": do2,
    }


def acidbase(paco2: float, hco3: float, na: float, cl: float, alb: float) -> dict:
    ph = 6.1 + math.log10(hco3 / (0.03 * paco2))
    ag = na - (cl + hco3)
    ag_corr = ag + 2.5 * (4.0 - alb)
    delta = (ag - 12) / (24 - hco3) if hco3 < 24 else None
    winter = 1.5 * hco3 + 8
    return {
        "ph": ph,
        "paco2_mmhg": paco2,
        "hco3_meq_l": hco3,
        "anion_gap": ag,
        "corrected_anion_gap": ag_corr,
        "delta_ratio": delta,
        "winter_expected_paco2": winter,
        "winter_low": winter - 2,
        "winter_high": winter + 2,
        "primary": (
            "metabolic acidosis" if ph < 7.35 and hco3 < 22
            else "respiratory acidosis" if ph < 7.35 and paco2 > 45
            else "metabolic alkalosis" if ph > 7.45 and hco3 > 26
            else "respiratory alkalosis" if ph > 7.45 and paco2 < 35
            else "normal pH / mixed or compensated"
        ),
    }


def pk(dose: float, vd: float, cl: float, f: float, ka: float, route: str, hours: float = 48.0) -> dict:
    k = cl / vd
    t12 = math.log(2) / k
    auc = dose / cl if route == "iv" else f * dose / cl

    def conc(t: float) -> float:
        if route == "iv":
            return dose / vd * math.exp(-k * t)
        if abs(ka - k) < 1e-9:
            return f * dose * ka / vd * t * math.exp(-k * t)
        return f * dose * ka / (vd * (ka - k)) * (math.exp(-k * t) - math.exp(-ka * t))

    samples = [(hours * i / 4000.0, conc(hours * i / 4000.0)) for i in range(4001)]
    tmax, cmax = max(samples, key=lambda pair: pair[1])
    return {
        "k_per_h": k,
        "t_half_h": t12,
        "auc_mg_h_l": auc,
        "cmax_mg_l": cmax,
        "tmax_h": tmax,
        "route": route,
        "bioavailability": f if route == "oral" else 1.0,
    }


def pd(emax: float, ec50: float, n: float, mode: str, i: float, ki: float) -> dict:
    ec50_eff = ec50
    emax_eff = emax
    if mode == "comp":
        ec50_eff = ec50 * (1 + i / ki)
    elif mode == "noncomp":
        emax_eff = emax / (1 + i / ki)
    effect_at_ec50 = emax_eff * (ec50_eff ** n) / (ec50_eff ** n + ec50_eff ** n)
    return {
        "emax": emax,
        "emax_eff": emax_eff,
        "ec50": ec50,
        "ec50_eff": ec50_eff,
        "hill_n": n,
        "dose_ratio": ec50_eff / ec50,
        "effect_at_ec50_pct": effect_at_ec50,
    }


def epi(prevalence: float, sens: float, spec: float, n: int = 1000) -> dict:
    p = prevalence / 100.0
    se = sens / 100.0
    sp = spec / 100.0
    tp = round(n * p * se)
    fn = round(n * p * (1 - se))
    fp = round(n * (1 - p) * (1 - sp))
    tn = round(n * (1 - p) * sp)
    ppv = tp / (tp + fp) if tp + fp else 1.0
    npv = tn / (tn + fn) if tn + fn else 1.0
    lrp = se / (1 - sp) if sp < 1 else math.inf
    lrn = (1 - se) / sp if se < 1 else 0.0
    return {
        "n": n,
        "tp": tp,
        "fn": fn,
        "fp": fp,
        "tn": tn,
        "sensitivity": se,
        "specificity": sp,
        "ppv": ppv,
        "npv": npv,
        "lr_positive": lrp,
        "lr_negative": lrn,
        "accuracy": (tp + tn) / n,
    }


def ct(ww: float, wl: float, hu: float) -> dict:
    lo = wl - ww / 2
    hi = wl + ww / 2
    gray = min(1.0, max(0.0, (hu - lo) / (hi - lo)))
    return {"ww": ww, "wl": wl, "hu": hu, "window_low": lo, "window_high": hi, "gray": gray}


def gcs(e: int, v: int, m: int) -> dict:
    total = e + v + m
    if total <= 8:
        severity = "severe"
    elif total <= 12:
        severity = "moderate"
    else:
        severity = "mild"
    return {"gcs": total, "severity": severity, "min": 3, "max": 15}


def bmi(weight: float, height_cm: float) -> dict:
    height_m = height_cm / 100.0
    value = weight / (height_m ** 2)
    if value < 18.5:
        category = "underweight"
    elif value < 25:
        category = "normal"
    elif value < 30:
        category = "overweight"
    elif value < 35:
        category = "obesity class I"
    elif value < 40:
        category = "obesity class II"
    else:
        category = "obesity class III"
    return {"bmi": value, "category": category}


def egfr(age: float, sex: str, scr: float) -> dict:
    female = sex.upper().startswith("F")
    kappa = 0.7 if female else 0.9
    alpha = -0.241 if female else -0.302
    ratio = scr / kappa
    value = 142 * (min(ratio, 1.0) ** alpha) * (max(ratio, 1.0) ** -1.200) * (0.9938 ** age)
    if female:
        value *= 1.012
    if value >= 90:
        stage = "G1"
    elif value >= 60:
        stage = "G2"
    elif value >= 45:
        stage = "G3a"
    elif value >= 30:
        stage = "G3b"
    elif value >= 15:
        stage = "G4"
    else:
        stage = "G5"
    return {"egfr": value, "stage": stage, "sex": "female" if female else "male"}


def sodium(na: float, glucose: float) -> dict:
    corrected = na + 1.6 * (glucose - 100) / 100.0
    return {"measured_na": na, "glucose": glucose, "corrected_na": corrected}


def _print(result: dict) -> None:
    for key, value in result.items():
        if isinstance(value, float):
            print(f"{key}: {value:.6g}")
        else:
            print(f"{key}: {value}")


def selftest() -> int:
    failures: list[str] = []

    def check(name: str, actual: float, expected: float, tol: float = 1e-6) -> None:
        if abs(actual - expected) > tol:
            failures.append(f"{name}: expected {expected}, got {actual}")

    e = ecg(60, 160, 90, 400, 60, 0)
    check("ecg.rr", e["rr_s"], 1.0)
    check("ecg.qtc", e["qtc_bazett_ms"], 400.0)
    check("ecg.einthoven", e["einthoven_check"], 0.0, 1e-9)

    p = pv(120, 2.5, 2.0, 70)
    check("pv.esv", p["esv_ml"], 61.6666667, 1e-4)
    check("pv.sv", p["sv_ml"], 58.3333333, 1e-4)
    check("pv.ef", p["ef_pct"], 48.6111111, 1e-4)
    check("pv.co", p["co_l_min"], 4.0833333, 1e-4)
    check("pv.sw", p["stroke_work_j"], 0.9074, 1e-3)

    o = oxygen(95, 15, 7.4, 37, "normal", 0)
    check("oxygen.p50", o["p50_mmhg"], 26.6, 1e-9)
    check("oxygen.sao2", o["sao2_pct"], 96.88, 0.05)
    check("oxygen.cao2", o["cao2_ml_dl"], 19.76, 0.05)

    a = acidbase(40, 24, 140, 104, 4)
    check("acidbase.ph", a["ph"], 7.40, 0.005)
    check("acidbase.ag", a["anion_gap"], 12.0)

    k = pk(100, 50, 5, 1.0, 1.0, "iv")
    check("pk.c0", k["auc_mg_h_l"], 20.0)
    check("pk.t12", k["t_half_h"], 6.9314718, 1e-4)
    check("pk.cmax", k["cmax_mg_l"], 2.0, 1e-4)

    d = pd(100, 1, 1, "none", 0, 1)
    check("pd.effect_at_ec50", d["effect_at_ec50_pct"], 50.0)

    x = epi(10, 90, 95)
    check("epi.tp", x["tp"], 90)
    check("epi.fp", x["fp"], 45)
    check("epi.ppv", x["ppv"], 90 / 135, 1e-9)
    check("epi.lr_positive", x["lr_positive"], 18.0)

    c = ct(80, 40, 40)
    check("ct.gray", c["gray"], 0.5)

    check("gcs", gcs(4, 5, 6)["gcs"], 15)
    check("bmi", bmi(70, 175)["bmi"], 22.857142857, 1e-6)
    check("egfr", egfr(50, "F", 1.0)["egfr"], 68.7, 0.2)
    check("sodium", sodium(130, 600)["corrected_na"], 138.0)

    if failures:
        print("SELFTEST FAILED")
        for failure in failures:
            print("  " + failure)
        return 1
    print(f"SELFTEST OK — {len(failures)} failures")
    return 0


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    if sys.argv[1] == "selftest":
        return selftest()

    parser = argparse.ArgumentParser(description="Independent medical note checks")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("ecg")
    p.add_argument("--hr", type=float, default=72)
    p.add_argument("--pr", type=float, default=160)
    p.add_argument("--qrs", type=float, default=90)
    p.add_argument("--qt", type=float, default=400)
    p.add_argument("--axis", type=float, default=60)
    p.add_argument("--st", type=float, default=0)

    p = sub.add_parser("pv")
    p.add_argument("--edv", type=float, default=120)
    p.add_argument("--ees", type=float, default=2.5)
    p.add_argument("--ea", type=float, default=2.0)
    p.add_argument("--hr", type=float, default=70)

    p = sub.add_parser("oxygen")
    p.add_argument("--pao2", type=float, default=95)
    p.add_argument("--hb", type=float, default=15)
    p.add_argument("--ph", type=float, default=7.4)
    p.add_argument("--temp", type=float, default=37)
    p.add_argument("--dpg", choices=["low", "normal", "high"], default="normal")
    p.add_argument("--co", type=float, default=0)

    p = sub.add_parser("acidbase")
    p.add_argument("--paco2", type=float, default=40)
    p.add_argument("--hco3", type=float, default=24)
    p.add_argument("--na", type=float, default=140)
    p.add_argument("--cl", type=float, default=104)
    p.add_argument("--alb", type=float, default=4)

    p = sub.add_parser("pk")
    p.add_argument("--dose", type=float, default=100)
    p.add_argument("--vd", type=float, default=50)
    p.add_argument("--cl", type=float, default=5)
    p.add_argument("--f", type=float, default=1.0)
    p.add_argument("--ka", type=float, default=1.0)
    p.add_argument("--route", choices=["iv", "oral"], default="iv")

    p = sub.add_parser("pd")
    p.add_argument("--emax", type=float, default=100)
    p.add_argument("--ec50", type=float, default=1)
    p.add_argument("--n", type=float, default=1)
    p.add_argument("--mode", choices=["none", "comp", "noncomp"], default="none")
    p.add_argument("--i", type=float, default=0)
    p.add_argument("--ki", type=float, default=1)

    p = sub.add_parser("epi")
    p.add_argument("--prevalence", type=float, default=10)
    p.add_argument("--sens", type=float, default=90)
    p.add_argument("--spec", type=float, default=95)
    p.add_argument("--n", type=int, default=1000)

    p = sub.add_parser("ct")
    p.add_argument("--ww", type=float, default=80)
    p.add_argument("--wl", type=float, default=40)
    p.add_argument("--hu", type=float, default=40)

    p = sub.add_parser("gcs")
    p.add_argument("--e", type=int, default=4)
    p.add_argument("--v", type=int, default=5)
    p.add_argument("--m", type=int, default=6)

    p = sub.add_parser("bmi")
    p.add_argument("--weight", type=float, required=True)
    p.add_argument("--height", type=float, required=True)

    p = sub.add_parser("egfr")
    p.add_argument("--age", type=float, required=True)
    p.add_argument("--sex", choices=["F", "M", "f", "m"], required=True)
    p.add_argument("--scr", type=float, required=True)

    p = sub.add_parser("sodium")
    p.add_argument("--na", type=float, required=True)
    p.add_argument("--glucose", type=float, required=True)

    args = parser.parse_args()
    if args.command == "ecg":
        result = ecg(args.hr, args.pr, args.qrs, args.qt, args.axis, args.st)
    elif args.command == "pv":
        result = pv(args.edv, args.ees, args.ea, args.hr)
    elif args.command == "oxygen":
        result = oxygen(args.pao2, args.hb, args.ph, args.temp, args.dpg, args.co)
    elif args.command == "acidbase":
        result = acidbase(args.paco2, args.hco3, args.na, args.cl, args.alb)
    elif args.command == "pk":
        result = pk(args.dose, args.vd, args.cl, args.f, args.ka, args.route)
    elif args.command == "pd":
        result = pd(args.emax, args.ec50, args.n, args.mode, args.i, args.ki)
    elif args.command == "epi":
        result = epi(args.prevalence, args.sens, args.spec, args.n)
    elif args.command == "ct":
        result = ct(args.ww, args.wl, args.hu)
    elif args.command == "gcs":
        result = gcs(args.e, args.v, args.m)
    elif args.command == "bmi":
        result = bmi(args.weight, args.height)
    elif args.command == "egfr":
        result = egfr(args.age, args.sex, args.scr)
    elif args.command == "sodium":
        result = sodium(args.na, args.glucose)
    else:
        parser.error("unknown command")
        return 2

    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
