#!/usr/bin/env python3
"""Static checks for an interactive CS note.

This is not a correctness proof. It catches structural mistakes that are easy
to miss when an agent builds a page quickly: unresolved placeholders, missing
lab hooks, missing live regions, external scripts, and absent print rules.

Usage:
    python3 validate_note.py ~/notes/cs/topic.html
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

LAB_HOOKS = {
    "sorting": [
        "data-sort-bars", "data-sort-code", "data-sort-status",
        "data-sort-step", "data-sort-play", "data-sort-reset",
    ],
    "binary": [
        "data-bin-cells", "data-bin-code", "data-bin-status",
        "data-bin-step", "data-bin-play", "data-bin-target",
    ],
    "graph": [
        "data-graph-svg", "data-graph-frontier", "data-graph-code",
        "data-graph-status", "data-graph-step", "data-graph-mode",
    ],
    "bst": [
        "data-bst-svg", "data-bst-traversals", "data-bst-status",
        "data-bst-insert", "data-bst-search",
    ],
    "growth": [
        "data-growth-canvas", "data-growth-n", "data-growth-table",
        "data-growth-status",
    ],
    "ieee754": [
        "data-ieee-input", "data-ieee-bits", "data-ieee-metrics",
        "data-ieee-steps", "data-ieee-status",
    ],
    "arm": [
        "data-arm-memory", "data-arm-regs", "data-arm-code",
        "data-arm-status", "data-arm-step",
    ],
    "sub96": [
        "data-sub-words", "data-sub-metrics", "data-sub-code",
        "data-sub-status", "data-sub-step",
    ],
    "merge": [
        "data-merge-rows", "data-merge-metrics", "data-merge-status",
        "data-merge-step",
    ],
}


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: validate_note.py <note.html>", file=sys.stderr)
        return 2

    path = Path(sys.argv[1]).expanduser().resolve()
    if not path.is_file():
        print(f"error: file not found: {path}", file=sys.stderr)
        return 2

    html = path.read_text(encoding="utf-8")
    errors: list[str] = []
    warnings: list[str] = []

    def check(condition: bool, message: str) -> None:
        if not condition:
            errors.append(message)

    # --- document basics ---
    check(bool(re.search(r"<!doctype\s+html", html, re.I)), "missing <!doctype html>")
    check(bool(re.search(r'<html[^>]*\blang="[^"]+"', html, re.I)), "missing <html lang>")
    check(bool(re.search(r'<meta[^>]*name="viewport"', html, re.I)), "missing viewport meta")
    check("{{" not in html, "unresolved {{PLACEHOLDER}} token")

    h1s = re.findall(r"<h1\b[^>]*>(.*?)</h1>", html, re.S | re.I)
    check(len(h1s) == 1, f"expected exactly one <h1>, found {len(h1s)}")

    h2s = re.findall(r"<h2\b([^>]*)>(.*?)</h2>", html, re.S | re.I)
    check(len(h2s) >= 3, f"expected at least 3 <h2> sections, found {len(h2s)}")
    for attrs, inner in h2s:
        if 'id="' not in attrs:
            title = re.sub(r"<[^>]+>", "", inner).strip()[:40]
            errors.append(f"<h2> without id: {title!r}")

    # --- labs ---
    lab_count = 0
    for lab, hooks in LAB_HOOKS.items():
        blocks = re.findall(
            rf'<section[^>]*data-lab="{lab}"[^>]*>.*?</section>',
            html, re.S | re.I,
        )
        for block in blocks:
            lab_count += 1
            for hook in hooks:
                check(hook in block, f"lab '{lab}' missing hook {hook}")
            check(
                bool(re.search(r'role="status"|aria-live="polite"', block, re.I)),
                f"lab '{lab}' has no role=status / aria-live region",
            )
            check(
                bool(re.search(r'class="lab__print"', block, re.I)),
                f"lab '{lab}' has no print-only fallback line",
            )
    all_lab_count = len(re.findall(r'<section[^>]*\bdata-lab="[^"]+"', html, re.I))
    lab_count = max(lab_count, all_lab_count)
    check(lab_count >= 2, f"expected at least 2 labs, found {lab_count}")

    prediction_count = len(re.findall(r'<details class="predict"', html, re.I))
    check(
        prediction_count >= lab_count,
        f"found {prediction_count} prediction prompts for {lab_count} labs; "
        "each lab should have a prediction gate",
    )

    quizzes = re.findall(r'<section[^>]*class="quiz"[^>]*>.*?</section>', html, re.S | re.I)
    for quiz in quizzes:
        if "data-vize-quiz" in quiz:
            check("data-vize-questions" in quiz, "vize quiz missing questions container")
            check("data-vize-progress" in quiz, "vize quiz missing progress element")
            check("data-vize-reset" in quiz, "vize quiz missing reset button")
        else:
            check("data-quiz" in quiz, "quiz section missing data-quiz")
            check("data-quiz-questions" in quiz, "quiz missing data-quiz-questions")
            check("data-quiz-progress" in quiz, "quiz missing progress element")
            check("data-quiz-reset" in quiz, "quiz missing reset button")

    # The quiz data lives in the injected JS. Count the fields, not the rendered HTML.
    quiz_prompts = len(re.findall(r"prompt:\s*[\"']", html))
    quiz_explains = len(re.findall(r"explain:\s*[\"']", html))
    check(quiz_prompts >= 6, f"quiz has only {quiz_prompts} prompt entries")
    check(quiz_explains >= 6, f"quiz has only {quiz_explains} explanation entries")
    check(quiz_prompts == quiz_explains, "quiz prompt/explanation count mismatch")

    # --- external resources and unsafe patterns ---
    script_srcs = re.findall(r'<script[^>]*\bsrc="([^"]+)"', html, re.I)
    allowed = ("https://cdn.jsdelivr.net/npm/katex@",)
    for src in script_srcs:
        if not src.startswith(allowed):
            errors.append(f"unexpected external script: {src}")

    check("eval(" not in html, "inline script contains eval(")
    check("new Function(" not in html, "inline script contains new Function(")
    check("document.write(" not in html, "inline script contains document.write(")

    # --- accessibility hooks ---
    check("prefers-reduced-motion" in html, "missing prefers-reduced-motion handling")
    check(
        bool(re.search(r'@media\s+print', html, re.I)),
        "missing @media print block",
    )
    check(
        bool(re.search(r'\.lab__controls[^{]*\{[^}]*display:\s*none', html, re.S | re.I)),
        "print CSS does not hide .lab__controls",
    )
    for svg_id in ("data-graph-svg", "data-bst-svg"):
        if svg_id in html:
            tag = re.search(rf'<svg[^>]*{svg_id}[^>]*>', html, re.I)
            if tag and "aria-label" not in tag.group(0) and "role=" not in tag.group(0):
                errors.append(f"<svg {svg_id}> has no role/aria-label")

    # --- print / mobile / self-contained hints ---
    if not re.search(r"@page\s*\{", html, re.I) and "size: A4" not in html:
        warnings.append("no explicit @page A4 rule found")

    if "data-quiz-id" not in html:
        warnings.append("quiz has no data-quiz-id; localStorage key falls back to document.title")

    if len(html) < 20_000:
        warnings.append(f"file is only {len(html):,} bytes; is this a complete note?")

    # --- report ---
    print(f"file: {path}")
    print(f"size: {len(html):,} bytes")
    print(f"labs: {lab_count}, h2 sections: {len(h2s)}, quizzes: {len(quizzes)}")
    if warnings:
        print("\nwarnings:")
        for warning in warnings:
            print(f"  - {warning}")
    if errors:
        print("\nerrors:")
        for error in errors:
            print(f"  - {error}")
        print(f"\nFAIL: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1
    print(f"\nPASS: 0 errors, {len(warnings)} warning(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
