#!/usr/bin/env python3
"""Structural gate for an interactive physics note.

Usage:
    python3 validate_note.py note.html [note2.html ...]

Checks the contract that is cheap to automate: prediction gate, self-test,
print fallback, reduced motion, live region, external requests, size, and a
few HTML-level mistakes. It does NOT check the physics; that is check.py.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

MAX_KB = 120
ALLOWED_EXTERNAL = ("katex",)  # CDN allowed for typesetting, must degrade


def check(path: Path) -> list[tuple[str, str, bool]]:
    html = path.read_text(encoding="utf-8")
    low = html.lower()
    out: list[tuple[str, str, bool]] = []

    size_kb = len(html.encode("utf-8")) / 1024
    out.append(("size", f"{size_kb:.1f} KB (limit {MAX_KB})", size_kb <= MAX_KB))

    ext = re.findall(r'(?:src|href)\s*=\s*["\'](https?://[^"\']+)["\']', html, re.I)
    bad_ext = [u for u in ext if not any(a in u.lower() for a in ALLOWED_EXTERNAL)]
    out.append(("external", f"{len(ext)} total, {len(bad_ext)} not allowed", not bad_ext))

    has_predict = any(
        m in low
        for m in ("data-predict", "tahmin", "prediction", "predict")
    )
    out.append(("prediction", "prompt before controls", has_predict))

    out.append(("selftest", "?selftest=1 path", "selftest" in low))
    out.append(("print", "@media print", "@media print" in low))
    out.append(("motion", "prefers-reduced-motion", "prefers-reduced-motion" in low))
    out.append(("live", "aria-live status", "aria-live" in low))
    interactive = "<canvas" in low or "<svg" in low or "<input" in low or "<button" in low
    out.append(("interactive", "canvas/svg or form control", interactive))

    lang = re.search(r'<html[^>]*\blang\s*=\s*["\']([^"\']+)', html, re.I)
    out.append(("lang", lang.group(1) if lang else "missing", bool(lang)))

    has_title = bool(re.search(r"<title>\s*\S", html, re.I))
    out.append(("title", "document title", has_title))

    # A canvas readout must have a textual alternative.
    has_fallback = any(
        m in low for m in ('role="img"', "aria-label", "figure", "figcaption")
    )
    out.append(("fallback", "text alternative for figure", has_fallback))

    # Heuristic: assigning *user input* to innerHTML is an injection/robustness smell.
    # Generated markup for a status line is acceptable if it never reads input sources.
    assignments = re.findall(r"innerHTML\s*=\s*([^;\n]+)", html)
    unsafe = [
        a for a in assignments
        if any(t in a for t in (".value", "location", "search", "hash", "prompt(", "user"))
    ]
    detail = f"{len(assignments)} assignment(s), {len(unsafe)} from input"
    out.append(("innerhtml", detail, not unsafe))

    # Units present in at least some readouts, or an explicit dimensionless/scaled statement.
    units = sum(low.count(u) for u in (" ev", " nm", " m/s", " rad", " kv", " mev", " j<", " k<"))
    scaled = any(s in low for s in ("boyutsuz", "birim sistem", "scaled", "c = 1", "gm = 1", "ölçekli"))
    out.append(("units", f"{units} unit tokens" + (" + scaled" if scaled else ""), units >= 3 or scaled))

    return out


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 2

    failed_any = False
    for name in argv:
        path = Path(name)
        if not path.exists():
            print(f"FAIL  {name}: not found")
            failed_any = True
            continue

        print(f"\n== {path.name}")
        rows = check(path)
        failed = 0
        for key, detail, ok in rows:
            print(f"  {'PASS' if ok else 'FAIL'}  {key:12s} {detail}")
            failed += not ok
        failed_any |= failed > 0
        print(f"  --> {'OK' if failed == 0 else f'{failed} gate(s) failed'}")

    print("\nNOTE OK" if not failed_any else "\nNOTE BLOCKED")
    return 0 if not failed_any else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
