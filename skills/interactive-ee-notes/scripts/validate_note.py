#!/usr/bin/env python3
"""Static validation for an interactive EE note.

Checks the shell, lab contract, prediction gates, quiz/exercise structure,
offline/print/accessibility hooks, duplicate ids and size. It cannot prove the
physics; run check_ee.py and the browser ?selftest=1 for that.

Usage:
    python3 validate_note.py note.html [--strict] [--json]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

KNOWN_LABS = {
    "dc", "transient", "bode", "bjt", "logic", "sampling",
    "am", "constellation", "link", "smith", "three-phase", "fourier", "diode",
    "txline", "mosfet", "control", "dft", "transformer", "power",
}

fails: list[str] = []
warns: list[str] = []


def fail(message: str) -> None:
    fails.append(message)


def warn(message: str) -> None:
    warns.append(message)


class IdCollector(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: list[str] = []

    def handle_starttag(self, tag, attrs) -> None:
        for key, value in attrs:
            if key == "id" and value:
                self.ids.append(value)


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate an interactive EE note.")
    parser.add_argument("path", help="HTML file")
    parser.add_argument("--strict", action="store_true", help="Treat warnings as failures")
    parser.add_argument("--gallery", action="store_true", help="Relax lesson checks for a lab gallery")
    parser.add_argument("--json", action="store_true", help="Emit JSON")
    args = parser.parse_args()

    path = Path(args.path).expanduser()
    if not path.is_file():
        print(f"error: file not found: {path}", file=sys.stderr)
        return 2
    doc = path.read_text(encoding="utf-8")
    lower = doc.lower()
    visible = re.sub(r"<script\b.*?</script>", "", doc, flags=re.S | re.I)
    visible = re.sub(r"<style\b.*?</style>", "", visible, flags=re.S | re.I)

    # shell
    if not lower.startswith("<!doctype html"):
        fail("missing <!doctype html>")
    if "<title>" not in lower:
        fail("missing <title>")
    if 'name="viewport"' not in lower:
        fail("missing viewport meta tag")
    if not re.search(r'<html[^>]*\blang="', doc, re.I):
        fail("html element has no lang attribute")
    if 'id="interactive-ee-labs-css"' not in doc:
        fail("EE lab CSS was not injected")
    if 'id="interactive-ee-labs-js"' not in doc:
        fail("EE lab JS was not injected")
    if "@media print" not in doc:
        fail("missing print stylesheet")
    if "prefers-reduced-motion" not in lower:
        warn("no prefers-reduced-motion rule")

    # external assets
    remote = []
    for src in re.findall(r'<script[^>]+src="([^"]+)"', doc, re.I):
        if re.match(r"https?://", src, re.I):
            remote.append(src)
    for href in re.findall(r'<link[^>]+href="([^"]+)"', doc, re.I):
        if re.match(r"https?://", href, re.I):
            remote.append(href)
    if remote:
        warn("remote asset(s): " + ", ".join(sorted(set(remote))[:4]))

    # duplicate ids
    collector = IdCollector()
    collector.feed(visible)
    duplicates = [value for value, count in Counter(collector.ids).items() if count > 1]
    if duplicates:
        fail("duplicate id(s): " + ", ".join(duplicates[:6]))

    # sections / exercises / quiz
    h2s = re.findall(r"<h2\b[^>]*>(.*?)</h2>", visible, re.S | re.I)
    exercises = len(re.findall(r'class="[^"]*\bexercise\b', visible, re.I))
    quiz_questions = len(re.findall(r'class="[^"]*\beequiz__q\b', visible, re.I))
    if not args.gallery:
        if not 5 <= len(h2s) <= 10:
            warn(f"{len(h2s)} h2 sections; 6-9 is the usual range")
        if exercises < 3:
            fail(f"only {exercises} exercises; 3-5 expected")
        if quiz_questions < 6:
            warn(f"{quiz_questions} retrieval questions; 6-10 expected")

    # labs
    positions = [m.start() for m in re.finditer(r'data-ee-lab="([a-z0-9-]+)"', visible)]
    kinds = re.findall(r'data-ee-lab="([a-z0-9-]+)"', visible)
    if not positions:
        fail("no labs found (data-ee-lab)")
    if len(positions) > 4 and not args.gallery:
        warn(f"{len(positions)} labs on one page; 1-3 is usually enough")
    for index, position in enumerate(positions):
        end = positions[index + 1] if index + 1 < len(positions) else min(len(visible), position + 40000)
        block = visible[position:end]
        kind = kinds[index]
        if kind not in KNOWN_LABS:
            fail(f"unknown lab type: {kind}")
            continue
        if "data-canvas" not in block:
            fail(f"lab '{kind}' has no data-canvas")
        if "data-controls" not in block:
            fail(f"lab '{kind}' has no data-controls")
        if "data-readout" not in block:
            fail(f"lab '{kind}' has no data-readout")
        if "data-status" not in block:
            fail(f"lab '{kind}' has no data-status")
        if "data-print" not in block:
            fail(f"lab '{kind}' has no data-print")
        if "data-reset" not in block:
            warn(f"lab '{kind}' has no reset control")
        if "data-gate" not in block and not args.gallery:
            warn(f"lab '{kind}' has no prediction gate")
        if 'aria-live="polite"' not in block:
            warn(f"lab '{kind}' status is not aria-live")
        if "role=\"img\"" not in block:
            warn(f"lab '{kind}' canvas has no role=img")
        if not args.gallery and "predict" not in visible[max(0, position - 3500):position].lower() and "data-gate" not in block:
            warn(f"lab '{kind}' has no preceding prediction prompt")

    # math / size / sources
    if "katex" not in lower and re.search(r"(?<!\\)\$[^$\n]{2,80}(?<!\\)\$", visible):
        fail("raw $...$ math without KaTeX; use HTML math or build without --offline")
    size_kb = len(doc.encode("utf-8")) / 1024
    if size_kb > 220:
        fail(f"file is {size_kb:.0f} KB; 220 KB is the hard cap")
    elif size_kb > 180:
        warn(f"file is {size_kb:.0f} KB; aim below 180 KB")
    if not args.gallery and not re.search(r"<h2[^>]*>(?:[^<]*(?:Kaynak|Sources|Referans))", visible, re.I):
        warn("no sources / further reading section")
    if "doğrulanamadı" not in lower and "unverified" not in lower:
        warn("no explicit 'doğrulanamadı' / unverified note (fine if every claim is sourced)")

    ok = not fails and not (args.strict and warns)
    result = {
        "path": str(path),
        "ok": ok,
        "fails": fails,
        "warnings": warns,
        "sections": len(h2s),
        "labs": kinds,
        "exercises": exercises,
        "quiz_questions": quiz_questions,
        "size_kb": round(size_kb, 1),
    }
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        for message in fails:
            print("FAIL " + message)
        for message in warns:
            print("WARN " + message)
        print(("PASS " if ok else "FAIL ") + f"{path.name}: {size_kb:.1f} KB, " +
              f"{len(kinds)} lab(s), {len(h2s)} sections, {exercises} exercises")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
