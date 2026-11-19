#!/usr/bin/env python3
"""Static quality checks for an interactive mathematics note.

Usage:
    python3 validate_note.py ~/notes/math/topic.html

It checks structure, lab configuration, quiz data, accessibility hooks,
and print rules. It cannot check mathematical correctness or layout; open
the page in a browser and step every lab.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path

LAB_KINDS = {"plot", "riemann", "slope", "phase", "surface", "root", "interp", "matrix"}
REQUIRED_CONFIG = {
    "plot": ["f"],
    "riemann": ["f", "a", "b"],
    "slope": ["f", "xmin", "xmax", "ymin", "ymax", "x0", "y0"],
    "phase": [],
    "surface": ["f"],
    "root": ["f"],
    "interp": ["f"],
    "matrix": [],
}


def text_of(fragment: str) -> str:
    fragment = re.sub(r"<script\b.*?</script>", " ", fragment, flags=re.S | re.I)
    fragment = re.sub(r"<style\b.*?</style>", " ", fragment, flags=re.S | re.I)
    fragment = re.sub(r"<[^>]+>", " ", fragment)
    return re.sub(r"\s+", " ", html.unescape(fragment)).strip()


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate an interactive mathematics note.")
    parser.add_argument("path", help="HTML file to check")
    args = parser.parse_args()
    path = Path(args.path).expanduser().resolve()
    if not path.is_file():
        print(f"error: no such file: {path}", file=sys.stderr)
        return 2
    doc = path.read_text(encoding="utf-8")
    errors: list[str] = []
    warnings: list[str] = []

    if re.search(r"\{\{\s*[A-Za-z0-9_]+\s*\}\}", doc):
        errors.append("unresolved template placeholder {{...}}")
    if re.search(r"\bTODO\b|\bFIXME\b|lorem ipsum", doc, re.I):
        errors.append("placeholder text (TODO/FIXME/lorem ipsum)")

    h1 = re.findall(r"<h1\b[^>]*>(.*?)</h1>", doc, re.S | re.I)
    if len(h1) != 1:
        errors.append(f"expected exactly one <h1>, found {len(h1)}")
    h2 = re.findall(r"<h2\b([^>]*)>(.*?)</h2>", doc, re.S | re.I)
    if len(h2) < 4:
        errors.append(f"expected at least 4 <h2> sections, found {len(h2)}")
    for attrs, inner in h2:
        if not re.search(r'id="[^"]+"', attrs):
            errors.append(f"<h2> without id: {text_of(inner)[:60]}")

    ids = re.findall(r'\bid="([^"]+)"', doc)
    seen: set[str] = set()
    for value in ids:
        if value in seen:
            errors.append(f"duplicate id: {value}")
        seen.add(value)

    is_hub = 'data-page-kind="hub"' in doc
    labs = re.findall(r'<div\b[^>]*data-math-lab="([^"]+)"[^>]*>', doc)
    if not labs and not is_hub:
        errors.append("no interactive math labs found")
    if len(labs) > 4:
        warnings.append(f"{len(labs)} labs on one page; the 2–3 lab rule is usually better")
    for kind in labs:
        if kind not in LAB_KINDS:
            errors.append(f"unknown lab type: {kind}")

    lab_blocks = re.findall(
        r'<div\b[^>]*data-math-lab="([^"]+)"[^>]*>(.*?)(?=<div\b[^>]*data-math-lab=|</article>)',
        doc, re.S | re.I,
    )
    for index, (kind, block) in enumerate(lab_blocks, start=1):
        if 'data-canvas' not in block:
            errors.append(f"lab {index} ({kind}) has no [data-canvas]")
        if 'data-status' not in block:
            errors.append(f"lab {index} ({kind}) has no [data-status]")
        if 'data-readout' not in block:
            errors.append(f"lab {index} ({kind}) has no [data-readout]")
        for canvas in re.findall(r"<canvas\b[^>]*>", block, re.I):
            if "aria-label=" not in canvas or 'role="img"' not in canvas:
                warnings.append(f"lab {index} ({kind}) canvas lacks role=img + aria-label in markup")
        config_match = re.search(
            r'<script\b[^>]*class="[^"]*mathlab-config[^"]*"[^>]*>(.*?)</script>',
            block, re.S | re.I,
        )
        if not config_match:
            errors.append(f"lab {index} ({kind}) has no mathlab-config JSON block")
            continue
        try:
            config = json.loads(config_match.group(1))
        except json.JSONDecodeError as exc:
            errors.append(f"lab {index} ({kind}) config is invalid JSON: {exc}")
            continue
        for key in REQUIRED_CONFIG.get(kind, []):
            if key not in config:
                errors.append(f"lab {index} ({kind}) config missing '{key}'")

    quiz_blocks = re.findall(
        r'<script\b[^>]*class="[^"]*quiz-data[^"]*"[^>]*>(.*?)</script>',
        doc, re.S | re.I,
    )
    if not quiz_blocks and not is_hub:
        warnings.append("no retrieval quiz data found")
    for qindex, raw in enumerate(quiz_blocks, start=1):
        try:
            questions = json.loads(raw)
        except json.JSONDecodeError as exc:
            errors.append(f"quiz {qindex} is invalid JSON: {exc}")
            continue
        if not isinstance(questions, list) or len(questions) < 4:
            warnings.append(f"quiz {qindex} has fewer than 4 questions")
        for i, question in enumerate(questions, start=1):
            if not isinstance(question, dict):
                errors.append(f"quiz {qindex} question {i} is not an object")
                continue
            for key in ("prompt", "options", "answer", "explain"):
                if key not in question:
                    errors.append(f"quiz {qindex} question {i} missing '{key}'")
            options = question.get("options", [])
            if not isinstance(options, list) or len(options) < 3:
                errors.append(f"quiz {qindex} question {i} needs at least 3 options")
            answer = question.get("answer")
            if not isinstance(answer, int) or not (0 <= answer < len(options)):
                errors.append(f"quiz {qindex} question {i} has an invalid answer index")

    if not is_hub and "class=\"keypoints\"" not in doc and 'class="keypoints"' not in doc:
        warnings.append("no .keypoints summary box")
    if not is_hub and doc.count('class="exercise"') < 2:
        warnings.append("fewer than two exercises")
    if "details" not in doc or "predict" not in doc:
        warnings.append("no details.predict prompt found")
    if "katex" not in doc:
        warnings.append("KaTeX is not linked")
    if "data-math-quiz" not in doc:
        warnings.append("no [data-math-quiz] container")

    external_scripts = re.findall(r'<script\b[^>]*\bsrc="([^"]+)"', doc, re.I)
    for src in external_scripts:
        if "cdn.jsdelivr.net/npm/katex" not in src:
            warnings.append(f"external script other than KaTeX: {src}")
    insecure = [u for u in re.findall(r"http://[^\s\"'<>]+", doc) if not u.startswith("http://www.w3.org/")]
    if insecure:
        warnings.append("insecure http:// URL present: " + insecure[0])

    print(f"{path}")
    print(f"  labs: {len(labs)} ({', '.join(labs) if labs else 'none'})")
    print(f"  sections: {len(h2)} · quiz blocks: {len(quiz_blocks)}")
    if warnings:
        print("  warnings:")
        for warning in warnings:
            print(f"    - {warning}")
    if errors:
        print("  errors:")
        for error in errors:
            print(f"    - {error}")
        print("FAIL")
        return 1
    print("PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
