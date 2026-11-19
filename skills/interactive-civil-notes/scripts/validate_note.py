#!/usr/bin/env python3
"""Static validation for an interactive civil engineering note.

Checks structure, lab shell, limit-state ledger, number-family box,
accessibility hooks, and the print/JS fallbacks the skill promises.

Usage:
    python3 validate_note.py ~/notes/civil/<course>/topic.html
"""

from __future__ import annotations

import re
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

KNOWN_LABS = {
    "beam", "column", "truss", "retaining", "bearing", "slope",
    "manning", "drift", "pavement", "mix", "cpm", "custom",
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
    visible = re.sub(r"<(script|style)\b.*?</\1>", "", doc, flags=re.S | re.I)

    # --- shell ---------------------------------------------------------
    if not lower.startswith("<!doctype html"):
        fail("missing <!doctype html>")
    if "<title>" not in lower:
        fail("missing <title>")
    if 'name="viewport"' not in lower:
        fail("missing viewport meta tag")
    if 'id="interactive-civil-labs-css"' not in doc:
        fail("civil lab CSS was not injected")
    if 'id="interactive-civil-labs-js"' not in doc:
        fail("civil lab JS was not injected")
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
    positions = [m.start() for m in re.finditer(r'data-lab="([a-z]+)"', visible)]
    kinds = re.findall(r'data-lab="([a-z]+)"', visible)
    if not positions:
        warn("no labs found (data-lab)")
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
        if "data-readout" not in block:
            fail(f"lab '{kind}' has no data-readout")
        if "data-status" not in block:
            fail(f"lab '{kind}' has no data-status")
        if "data-reset" not in block:
            warn(f"lab '{kind}' has no reset control")
        if "data-param" not in block:
            fail(f"lab '{kind}' has no controls (data-param)")
        if "predict" not in visible[max(0, position - 3000):position]:
            warn(f"lab '{kind}' has no preceding <details class=\"predict\">")

    # --- civil evidence ------------------------------------------------
    if "civilledger" not in visible and "data-ledger" not in visible:
        warn("no limit-state ledger (demand → capacity → ratio → governing limit)")
    if "numberfamily" not in visible and "karakteristik" not in lower:
        warn("no number-family box (characteristic / design / allowable)")
    if "callout--warning" not in visible and "Model sınırı" not in visible:
        warn("no model-limit / warning callout")
    if "class=\"keypoints\"" not in visible:
        warn("no keypoints summary")
    if visible.count("<h2") < 4:
        warn("fewer than four sections; a note usually needs 5-9")
    if "class=\"exercise\"" not in visible:
        warn("no exercises")
    if visible.count("class=\"solution\"") < 2:
        warn("fewer than two hidden solutions")

    # --- units / code --------------------------------------------------
    units = re.findall(r"\b(MPa|GPa|kN|kN·m|N·mm|mm²|mm|m³/s|kW|kPa)\b", visible)
    if len(units) < 5:
        warn("few explicit units found; check that every number has one")
    if not re.search(r"\b(TS\s?\d+|TBDY|EN\s?\d+|ACI\s?\d+|AISC|ASCE|AASHTO)\b", visible):
        warn("no standard/code reference found; a civil design note needs an edition")

    # --- size ----------------------------------------------------------
    size = len(doc.encode("utf-8"))
    if size > 500_000:
        warn(f"large single file: {size / 1024:.0f} KB")

    # --- report --------------------------------------------------------
    print(f"{path}")
    print(f"  size: {size / 1024:.0f} KB")
    print(f"  labs: {len(positions)} ({', '.join(kinds) or 'none'})")
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
