#!/usr/bin/env python3
"""Static validation for an interactive materials science note.

Checks structure, lab configuration, quiz data, accessibility hooks, and the
print/JS fallbacks that the skill promises. It cannot replace opening the page
in a browser.

Usage:
    python3 validate_note.py ~/notes/mse/topic.html
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

KNOWN_LABS = {"crystal", "phase", "stress", "diffusion", "xrd", "ttt", "ashby", "ternary", "band", "micro"}

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

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for key, value in attrs:
            if key == "id" and value:
                self.ids.append(value)


def script_json(document: str, css_class: str) -> list[tuple[int, str]]:
    pattern = re.compile(
        r'<script[^>]*class="' + re.escape(css_class) + r'"[^>]*>(.*?)</script>',
        re.S | re.I,
    )
    return [(m.start(), m.group(1)) for m in pattern.finditer(document)]


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

    # Scripts are data, not markup. Strip them before structural checks so a
    # code comment or a JSON string cannot look like a sixth lab.
    visible = re.sub(r"<script\b.*?</script>", "", doc, flags=re.S | re.I)
    # Keep authored JSON blocks, drop the injected engine (its header comment
    # contains a literal example config and would confuse the counter).
    data_doc = re.sub(
        r'<script id="interactive-mse-labs-js">.*?</script>', "", doc, flags=re.S | re.I
    )

    # --- shell ---------------------------------------------------------
    if not lower.startswith("<!doctype html"):
        fail("missing <!doctype html>")
    if '<style id="interactive-mse-labs-css">' not in doc:
        fail("MSE lab CSS was not injected")
    if '<script id="interactive-mse-labs-js">' not in doc:
        fail("MSE lab JS was not injected")
    if "<title>" not in lower:
        fail("missing <title>")
    if 'name="viewport"' not in lower:
        fail("missing viewport meta tag")
    if "@media print" not in doc:
        fail("missing print stylesheet")
    if "prefers-reduced-motion" not in doc:
        warn("no prefers-reduced-motion rule")

    lang = re.search(r'<html[^>]*\blang="([^"]+)"', doc, re.I)
    if not lang:
        warn("html element has no lang attribute")

    # --- duplicate ids -------------------------------------------------
    collector = IdCollector()
    collector.feed(visible)
    duplicates = [value for value, count in Counter(collector.ids).items() if count > 1]
    if duplicates:
        fail(f"duplicate id(s): {', '.join(duplicates[:6])}")

    # --- labs ----------------------------------------------------------
    positions = [m.start() for m in re.finditer(r'data-mse-lab="([a-z]+)"', visible)]
    kinds = re.findall(r'data-mse-lab="([a-z]+)"', visible)
    if not positions:
        fail("no labs found (data-mse-lab)")
    if len(positions) > 6:
        warn(f"{len(positions)} labs on one page; 2–4 is usually enough for a lesson")

    for index, position in enumerate(positions):
        end = positions[index + 1] if index + 1 < len(positions) else min(len(visible), position + 24000)
        block = visible[position:end]
        kind = kinds[index]
        if kind not in KNOWN_LABS:
            fail(f"unknown lab type: {kind}")
            continue
        if "data-canvas" not in block:
            fail(f"lab '{kind}' has no data-canvas")
        if "data-controls" not in block:
            fail(f"lab '{kind}' has no data-controls")
        if "data-status" not in block:
            warn(f"lab '{kind}' has no data-status live region")
        if 'class="predict"' not in block and "<details class=\"predict\"" not in block:
            fail(f"lab '{kind}' has no <details class=\"predict\"> prompt")
        if "<h3" not in block:
            fail(f"lab '{kind}' has no h3 title")
        if kind != "crystal" and "data-readout" not in block:
            warn(f"lab '{kind}' has no data-readout")

    canvas_tags = re.findall(r"<canvas\b[^>]*>", visible, re.I)
    for tag in canvas_tags:
        if "aria-label" not in tag:
            fail("a canvas has no aria-label")
        if "role=" not in tag:
            warn("a canvas has no role attribute")

    # --- lab JSON ------------------------------------------------------
    configs = script_json(data_doc, "mselab-config")
    if len(configs) != len(positions):
        fail(f"{len(positions)} labs but {len(configs)} lab configs")
    for start, raw in configs:
        try:
            value = json.loads(raw)
        except json.JSONDecodeError as exc:
            fail(f"lab config near offset {start} is not valid JSON: {exc}")
            continue
        if not isinstance(value, dict):
            fail(f"lab config near offset {start} is not an object")

    # --- quizzes -------------------------------------------------------
    quizzes = re.findall(r'data-mse-quiz(?![-\w])(?:\s+data-quiz-id="([^"]+)")?', visible)
    data_blocks = script_json(data_doc, "quiz-data")
    if quizzes and not data_blocks:
        fail("quiz container exists but no quiz-data block was found")
    if len(data_blocks) != len(quizzes) and quizzes:
        fail(f"{len(quizzes)} quizzes but {len(data_blocks)} quiz-data blocks")

    for start, raw in data_blocks:
        try:
            questions = json.loads(raw)
        except json.JSONDecodeError as exc:
            fail(f"quiz JSON near offset {start} is invalid: {exc}")
            continue
        if not isinstance(questions, list) or len(questions) < 4:
            fail(f"quiz near offset {start} has fewer than 4 questions")
            continue
        for i, question in enumerate(questions):
            if not isinstance(question, dict):
                fail(f"quiz question {i + 1} is not an object")
                continue
            options = question.get("options")
            answer = question.get("answer")
            explain = question.get("explain", "")
            if not isinstance(options, list) or len(options) < 3:
                fail(f"quiz question {i + 1} has fewer than 3 options")
            elif not isinstance(answer, int) or not 0 <= answer < len(options):
                fail(f"quiz question {i + 1} has an out-of-range answer index")
            if not isinstance(explain, str) or len(explain.strip()) < 24:
                fail(f"quiz question {i + 1} needs a cause-specific explanation")
            if not question.get("prompt"):
                fail(f"quiz question {i + 1} has no prompt")

    # --- prose and assets ---------------------------------------------
    if "<h2" not in visible:
        fail("no h2 sections; the table of contents will be empty")
    if visible.count("<h2") < 4:
        warn("fewer than 4 sections; a full note usually has 5–9")

    for tag in re.findall(r"<img\b[^>]*>", visible, re.I):
        if "alt=" not in tag:
            fail("an <img> has no alt text")
        if re.search(r'src="https?://', tag, re.I):
            warn("external image: the note is no longer self-contained")

    for marker in ("TODO", "Lorem ipsum", "lorem ipsum", "FIXME"):
        if marker in doc:
            fail(f"placeholder text left in the note: {marker}")

    if len(doc) > 4_500_000:
        warn(f"file is {len(doc) / 1e6:.1f} MB; consider trimming embedded images")

    # --- report --------------------------------------------------------
    print(f"{path}")
    print(f"  labs: {len(positions)}  quizzes: {len(quizzes)}  size: {len(doc) / 1024:.0f} kB")
    for message in warns:
        print(f"  WARN  {message}")
    for message in fails:
        print(f"  FAIL  {message}")
    if fails:
        print(f"\n{len(fails)} failure(s), {len(warns)} warning(s)")
        return 1
    print(f"  OK    no structural failures ({len(warns)} warning(s))")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
