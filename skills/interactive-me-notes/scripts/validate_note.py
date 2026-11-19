#!/usr/bin/env python3
"""Static validation for an interactive mechanical engineering note.

Checks structure, lab shell, quiz data, accessibility hooks, and the
print/JS fallbacks that the skill promises. It cannot replace opening the page.

Usage:
    python3 validate_note.py ~/notes/mechanical/<course>/topic.html
"""

from __future__ import annotations

import re
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

KNOWN_LABS = {
    "section", "beam", "mohr", "fourbar", "slider", "pipe", "moody",
    "otto", "rankine", "pid", "vibration", "truss", "fit", "gear",
    "fem", "machining", "gdandt", "custom",
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
    if len(sys.argv) != 2:
        print("usage: validate_note.py <note.html>", file=sys.stderr)
        return 2

    path = Path(sys.argv[1]).expanduser()
    if not path.is_file():
        print(f"error: file not found: {path}", file=sys.stderr)
        return 2

    doc = path.read_text(encoding="utf-8")
    lower = doc.lower()
    visible = re.sub(r"<script\b.*?</script>", "", doc, flags=re.S | re.I)

    # --- shell ---------------------------------------------------------
    if not lower.startswith("<!doctype html"):
        fail("missing <!doctype html>")
    if "<title>" not in lower:
        fail("missing <title>")
    if 'name="viewport"' not in lower:
        fail("missing viewport meta tag")
    if 'id="interactive-me-labs-css"' not in doc:
        fail("ME lab CSS was not injected")
    if 'id="interactive-me-labs-js"' not in doc:
        fail("ME lab JS was not injected")
    if "@media print" not in doc:
        fail("missing print stylesheet")
    if "prefers-reduced-motion" not in doc:
        warn("no prefers-reduced-motion rule")
    if not re.search(r'<html[^>]*\blang="', doc, re.I):
        warn("html element has no lang attribute")
    if "katex" not in lower:
        warn("no KaTeX: equations will be plain text")

    # --- external scripts ---------------------------------------------
    for src in re.findall(r'<script[^>]+src="([^"]+)"', doc, re.I):
        if "katex" not in src:
            fail(f"external script is not allowed: {src}")

    # --- duplicate ids -------------------------------------------------
    collector = IdCollector()
    collector.feed(visible)
    duplicates = [value for value, count in Counter(collector.ids).items() if count > 1]
    if duplicates:
        fail(f"duplicate id(s): {', '.join(duplicates[:6])}")

    # --- labs ----------------------------------------------------------
    positions = [m.start() for m in re.finditer(r'data-me-lab="([a-z]+)"', visible)]
    kinds = re.findall(r'data-me-lab="([a-z]+)"', visible)
    if not positions:
        warn("no labs found (data-me-lab)")
    if len(positions) > 5:
        warn(f"{len(positions)} labs on one page; 1-3 is usually enough for a lesson")

    for index, position in enumerate(positions):
        end = positions[index + 1] if index + 1 < len(positions) else min(len(visible), position + 30000)
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
        if "data-reset" not in block:
            warn(f"lab '{kind}' has no reset control")
        if "predict" not in visible[max(0, position - 2500):position]:
            warn(f"lab '{kind}' has no preceding <details class=\"predict\">")

    # --- quiz ----------------------------------------------------------
    answers = re.findall(r'data-answer="([a-d])"', visible)
    options = re.findall(r'data-option="([a-d])"', visible)
    if answers:
        if len(options) < len(answers) * 2:
            fail("quiz has fewer than two options per question")
        why = len(re.findall(r'class="mequiz__why"', visible))
        if why < len(answers):
            fail("each quiz question needs a .mequiz__why explanation")
    if answers and not re.search(r'<div class="mequiz"', visible):
        fail("quiz answers outside a .mequiz container")
    for q in re.finditer(r'<div class="mequiz__q"[^>]*data-answer="([a-d])"[^>]*>(.*?)</div>\s*</div>', visible, re.S):
        answer, body = q.group(1), q.group(2)
        opts = re.findall(r'data-option="([a-d])"', body)
        if answer not in opts:
            fail(f"quiz answer '{answer}' has no matching option")
        if len(opts) < 3:
            warn("a quiz question has fewer than three options")

    # --- pedagogy ------------------------------------------------------
    if visible.count("<h2") < 4:
        warn("fewer than four sections; a note usually needs 5-9")
    if "class=\"exercise\"" not in visible:
        warn("no exercises")
    if visible.count("class=\"solution\"") < 2:
        warn("fewer than two hidden solutions")
    if "callout--warning" not in visible and "Model sınırı" not in visible:
        warn("no model-limit / warning callout")
    if "class=\"keypoints\"" not in visible:
        warn("no keypoints summary")

    # --- units ---------------------------------------------------------
    units = re.findall(r"\b(MPa|GPa|kN|N·m|Nm|rpm|rad/s|mm|µm|m³/s|kg/s|kW)\b", visible)
    if len(units) < 5:
        warn("few explicit units found; check that every number has one")

    # --- size ----------------------------------------------------------
    size = len(doc.encode("utf-8"))
    if size > 400_000:
        warn(f"large single file: {size / 1024:.0f} KB")

    # --- report --------------------------------------------------------
    print(f"{path}")
    print(f"  size: {size / 1024:.0f} KB")
    print(f"  labs: {len(positions)} ({', '.join(kinds) or 'none'})")
    print(f"  quiz questions: {len(answers)}")
    for message in warns:
        print(f"  WARN {message}")
    for message in fails:
        print(f"  FAIL {message}")
    if fails:
        print(f"\n{len(fails)} failure(s), {len(warns)} warning(s)")
        return 1
    print(f"\nOK — {len(warns)} warning(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
