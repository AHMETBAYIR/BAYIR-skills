#!/usr/bin/env python3
"""Independent checks for the interactive MBG lab engines.

Recomputes replication timing, splicing/NMD, codon translation, operon logic,
HWE, chi-square, plasmid digests, PCR yield and CRISPR off-target expectations
with plain Python. No browser, no project code.

Examples:
    python3 check_mbg.py replication --G 3.1 --N 50000 --v 1.5
    python3 check_mbg.py splicing --mode normal
    python3 check_mbg.py codon --seq ATGGCTGAATTCGATCGTTAA --frame 0
    python3 check_mbg.py plasmid --enzymes EcoRI,BamHI,HindIII
    python3 check_mbg.py pcr --primer ATGCGTACGTAGCTAGCTAG --cycles 30 --eff 0.9
    python3 check_mbg.py crispr --pam NGG --mismatches 3 --G 3.1
    python3 check_mbg.py selftest
"""

from __future__ import annotations

import argparse
import math

BASES = "TCAG"
AA_STD = "FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG"
CODON = {}
for _i in range(64):
    _b1 = BASES[_i // 16]
    _b2 = BASES[(_i // 4) % 4]
    _b3 = BASES[_i % 4]
    CODON[_b1 + _b2 + _b3] = AA_STD[_i]

SITES = {"EcoRI": 397, "BamHI": 418, "HindIII": 448}


def aa_for(codon: str, code: str = "std") -> str:
    if code == "mito":
        if codon == "TGA":
            return "W"
        if codon == "ATA":
            return "M"
        if codon in ("AGA", "AGG"):
            return "*"
    return CODON.get(codon, "X")


def translate(seq: str, frame: int = 0, code: str = "std") -> dict:
    pep = ""
    for i in range(frame, len(seq) - 2, 3):
        pep += aa_for(seq[i:i + 3], code)
    stop = pep.find("*")
    return {"peptide": pep, "aa": stop if stop >= 0 else len(pep), "stop_codon": stop}


def replication(G: float, N: int, v: float, okazaki: int = 150, mu: float = 1e-9) -> dict:
    nt = G * 1e9
    minutes = nt / (2 * v * 1000 * N)
    return {
        "genome_nt": nt,
        "replication_min": minutes,
        "forks": 2 * N,
        "okazaki_fragments": nt / okazaki,
        "errors_per_genome": nt * mu,
        "one_origin_years": minutes * N / 525600,
    }


def _repeat(s: str, n: int) -> str:
    return s * n


def _gene() -> dict:
    return {
        "ex1": "ATG" + _repeat("GCT", 39),
        "in1": "TAA" + _repeat("CAG", 265) + "TT",
        "ex2": _repeat("GCT", 30),
        "in2": "TAA" + _repeat("CAG", 199),
        "ex3": _repeat("GCT", 49) + "TAA",
    }


def splicing(mode: str = "normal") -> dict:
    g = _gene()
    if mode == "skip2":
        mrna = g["ex1"] + g["ex3"]
        junction = len(g["ex1"])
    elif mode == "retain1":
        mrna = g["ex1"] + g["in1"] + g["ex2"] + g["ex3"]
        junction = len(g["ex1"]) + len(g["in1"]) + len(g["ex2"])
    elif mode == "alt3":
        mrna = g["ex1"] + g["ex2"][30:] + g["ex3"]
        junction = len(g["ex1"]) + len(g["ex2"]) - 30
    else:
        mrna = g["ex1"] + g["ex2"] + g["ex3"]
        junction = len(g["ex1"]) + len(g["ex2"])
    tr = translate(mrna)
    stop_nt = (tr["stop_codon"] + 1) * 3 if tr["stop_codon"] >= 0 else None
    nmd = stop_nt is not None and stop_nt < junction - 55
    return {
        "mRNA_nt": len(mrna),
        "protein_aa": tr["aa"],
        "stop_nt": stop_nt if stop_nt else "none",
        "last_junction_nt": junction,
        "NMD": "yes" if nmd else "no",
        "first_codon": mrna[:3],
    }


def codon(seq: str, frame: int = 0, code: str = "std") -> dict:
    tr = translate(seq, frame, code)
    gcn = sum(1 for c in seq if c in "GC")
    return {
        "length_nt": len(seq),
        "GC_percent": 100 * gcn / max(1, len(seq)),
        "peptide": tr["peptide"],
        "protein_aa": tr["aa"],
        "stops": tr["peptide"].count("*"),
    }


def operon(lac: float, glc: float, Kl: float = 1.0, Kg: float = 2.0, n: int = 2) -> dict:
    rep = lac ** n / (Kl ** n + lac ** n)
    cap = 1 / (1 + (glc / Kg) ** 2)
    rate = 2 + 98 * rep * cap
    return {"rate_percent": rate, "repressor_free": rep, "CAP_active": cap}


def hwe(p: float, s: float = 0.0) -> dict:
    q = 1 - p
    mean = p * p + 2 * p * q + q * q * (1 - s)
    pn = (p * p + p * q) / mean
    return {
        "p": p, "q": q,
        "f_AA": p * p, "f_Aa": 2 * p * q, "f_aa": q * q,
        "H": 2 * p * q,
        "p_next": pn,
        "delta_p": pn - p,
    }


def punnett(cross: str = "mono", n: int = 160) -> dict:
    if cross == "mono":
        expected = [0.75, 0.25]
        names = ["A-", "aa"]
        df = 1
    elif cross == "test":
        expected = [0.5, 0.5]
        names = ["A-", "aa"]
        df = 1
    else:
        expected = [9 / 16, 3 / 16, 3 / 16, 1 / 16]
        names = ["A-B-", "A-bb", "aaB-", "aabb"]
        df = 3
    critical = {1: 3.84, 2: 5.99, 3: 7.81}[df]
    return {"classes": "/".join(names), "expected_counts": "/".join(f"{e * n:.1f}" for e in expected),
            "df": df, "critical_0.05": critical}


def plasmid(enzymes: list[str], G: int = 2686) -> dict:
    cuts = sorted(SITES[e] for e in enzymes)
    frags = []
    for i, cut in enumerate(cuts):
        nxt = cuts[i + 1] if i + 1 < len(cuts) else cuts[0] + G
        frags.append(nxt - cut)
    return {"cuts": ",".join(map(str, cuts)), "fragments": " + ".join(map(str, frags)),
            "count": len(frags), "sum": sum(frags), "largest": max(frags) if frags else 0}


def pcr(primer: str, cycles: int = 30, eff: float = 0.9, amplicon: int = 500) -> dict:
    a = sum(1 for c in primer if c in "AT")
    gcn = sum(1 for c in primer if c in "GC")
    wallace = 2 * a + 4 * gcn
    gc_tm = 64.9 + 41 * (gcn - 16.4) / max(1, len(primer))
    log_copies = min(12, cycles * math.log10(1 + eff))
    return {
        "length_nt": len(primer),
        "GC_percent": 100 * gcn / max(1, len(primer)),
        "Tm_Wallace": wallace,
        "Tm_GC": gc_tm,
        "log10_copies": log_copies,
        "copies": 10 ** log_copies,
        "amplicon": amplicon,
    }


def crispr(pam: str = "NGG", mismatches: int = 3, G: float = 3.1, seq: str = "") -> dict:
    if not seq:
        seq = "GTCAGTACGTAGCTAGCTAGCTAGGATCCGATCGTAGCTAGCATGGCTAGCTAGCTAGCGATCGATCGA"

    def pam_ok(triplet: str) -> bool:
        return triplet[1] == "G" and triplet[2] == "G" if pam == "NGG" else triplet[1] == "A" and triplet[2] == "G"

    hits = 0
    for i in range(len(seq) - 22):
        if pam_ok(seq[i + 20:i + 23]):
            hits += 1
    rc = seq.translate(str.maketrans("ACGT", "TGCA"))[::-1]
    for i in range(len(rc) - 22):
        if pam_ok(rc[i + 20:i + 23]):
            hits += 1
    choose = [1, 20, 190, 1140, 4845]
    variants = sum(choose[k] * 3 ** k for k in range(mismatches + 1))
    expected = G * 1e9 * 2 * (1 / 16) * variants / 4 ** 20
    return {"guides_found": hits, "variants_within_budget": variants, "expected_offtargets": expected}


def selftest() -> None:
    assert replication(3.1, 50000, 1.5)["replication_min"] < 25
    assert replication(3.1, 1, 1.5)["replication_min"] > 1e6
    assert splicing("normal")["protein_aa"] == 119
    assert splicing("retain1")["NMD"] == "yes"
    assert splicing("skip2")["protein_aa"] == 89
    assert splicing("alt3")["mRNA_nt"] == 330
    assert len(CODON) == 64 and sum(1 for v in CODON.values() if v == "*") == 3
    assert codon("ATGGCCTAA")["peptide"] == "MA*"
    assert abs(operon(0, 10)["rate_percent"] - 2) < 1e-9
    assert abs(operon(10, 0.1)["rate_percent"] - 98.8) < 1.0
    assert abs(hwe(0.5)["f_Aa"] - 0.5) < 1e-12
    d = plasmid(["EcoRI", "BamHI", "HindIII"])
    assert d["sum"] == 2686 and d["fragments"] == "21 + 30 + 2635"
    assert abs(pcr("ATGCGTACGTAGCTAGCTAG")["Tm_Wallace"] - 60) < 1e-9
    assert abs(pcr("ATGCGTACGTAGCTAGCTAG")["Tm_GC"] - 51.78) < 0.15
    c = crispr(mismatches=3)
    assert 5 < c["expected_offtargets"] < 20
    print("selftest: all 12 checks passed")


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("replication")
    s.add_argument("--G", type=float, default=3.1)
    s.add_argument("--N", type=int, default=50000)
    s.add_argument("--v", type=float, default=1.5)
    s.add_argument("--okazaki", type=int, default=150)
    s.add_argument("--mu", type=float, default=1e-9)

    s = sub.add_parser("splicing")
    s.add_argument("--mode", choices=["normal", "skip2", "retain1", "alt3"], default="normal")

    s = sub.add_parser("codon")
    s.add_argument("--seq", default="ATGGCTGAATTCGATCGTTAA")
    s.add_argument("--frame", type=int, default=0)
    s.add_argument("--code", choices=["std", "mito"], default="std")

    s = sub.add_parser("operon")
    s.add_argument("--lac", type=float, default=0)
    s.add_argument("--glc", type=float, default=10)

    s = sub.add_parser("hwe")
    s.add_argument("--p", type=float, default=0.5)
    s.add_argument("--s", type=float, default=0)

    s = sub.add_parser("punnett")
    s.add_argument("--cross", choices=["mono", "test", "dihybrid"], default="mono")
    s.add_argument("--n", type=int, default=160)

    s = sub.add_parser("plasmid")
    s.add_argument("--enzymes", default="EcoRI,BamHI,HindIII")
    s.add_argument("--G", type=int, default=2686)

    s = sub.add_parser("pcr")
    s.add_argument("--primer", default="ATGCGTACGTAGCTAGCTAG")
    s.add_argument("--cycles", type=int, default=30)
    s.add_argument("--eff", type=float, default=0.9)
    s.add_argument("--amplicon", type=int, default=500)

    s = sub.add_parser("crispr")
    s.add_argument("--pam", choices=["NGG", "NAG"], default="NGG")
    s.add_argument("--mismatches", type=int, default=3)
    s.add_argument("--G", type=float, default=3.1)
    s.add_argument("--seq", default="")

    sub.add_parser("selftest")

    args = p.parse_args()
    if args.cmd == "selftest":
        selftest()
        return 0
    fn = globals()[args.cmd]
    kwargs = {k: v for k, v in vars(args).items() if k != "cmd"}
    if args.cmd == "plasmid":
        kwargs["enzymes"] = [e.strip() for e in kwargs["enzymes"].split(",") if e.strip()]
    result = fn(**kwargs)
    for key, value in result.items():
        if isinstance(value, float):
            print(f"{key:26s} {value:.6g}")
        else:
            print(f"{key:26s} {value}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
