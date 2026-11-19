#!/usr/bin/env python3
"""Render a SchemDraw circuit file to a clean, inline-ready SVG.

The circuit file is ordinary Python. It receives three names:

    d          an empty schemdraw.Drawing()
    elm        schemdraw.elements
    schemdraw  the schemdraw module

It must add elements to `d` and must not call d.save() itself.

Example circuit.py
------------------
    d.config(unit=3, fontsize=12)
    src = elm.SourceV().up().label("$V_s$")
    d += src
    d += elm.Resistor().right().label("$R$")
    cap = elm.Capacitor().down().label("$C$")
    d += cap
    d += elm.Line().at(cap.end).to(src.start)
    d += elm.Ground()

Usage
-----
    python3 render_circuit.py circuit.py --out circuit.svg --title "RC devresi"
"""

from __future__ import annotations

import argparse
import html
import re
import sys
from pathlib import Path

try:
    import schemdraw
    import schemdraw.elements as elm
except ImportError:
    print(
        "error: schemdraw is not installed.\n"
        "       python3 -m pip install schemdraw",
        file=sys.stderr,
    )
    raise SystemExit(2)


def clean_svg(svg: str, title: str, alt: str, width: str | None) -> str:
    svg = re.sub(r"<\?xml[^>]*\?>", "", svg, count=1, flags=re.I)
    svg = re.sub(r"<!DOCTYPE[^>]*>", "", svg, count=1, flags=re.I)
    svg = svg.strip()

    label = html.escape(alt or title or "Devre şeması")
    attrs = f'class="figure__svg" role="img" aria-label="{label}"'
    if re.search(r"<svg\b[^>]*\bclass=", svg, re.I):
        svg = re.sub(r'\bclass="[^"]*"', attrs, svg, count=1, flags=re.I)
    else:
        svg = re.sub(r"<svg\b", f"<svg {attrs}", svg, count=1, flags=re.I)
    if width:
        svg = re.sub(r'\bwidth="[^"]*"', f'width="{html.escape(width)}"', svg, count=1, flags=re.I)
    if title:
        svg = re.sub(
            r"(<svg\b[^>]*>)",
            rf"\1<title>{html.escape(title)}</title>",
            svg,
            count=1,
            flags=re.I,
        )
    return svg


def main() -> int:
    parser = argparse.ArgumentParser(description="Render a SchemDraw circuit to SVG.")
    parser.add_argument("source", help="Python file that adds elements to d")
    parser.add_argument("--out", required=True, help="Destination .svg file")
    parser.add_argument("--title", default="", help="SVG <title> and default aria-label")
    parser.add_argument("--alt", default="", help="Accessible description for aria-label")
    parser.add_argument("--width", default="", help="Optional display width (e.g. 32rem)")
    args = parser.parse_args()

    source_path = Path(args.source).expanduser().resolve()
    if not source_path.is_file():
        parser.error(f"circuit file not found: {source_path}")

    drawing = schemdraw.Drawing()
    namespace = {
        "__file__": str(source_path),
        "__name__": "__circuit__",
        "d": drawing,
        "elm": elm,
        "schemdraw": schemdraw,
    }
    code = compile(source_path.read_text(encoding="utf-8"), str(source_path), "exec")
    try:
        exec(code, namespace)  # noqa: S102 - deliberate: the source is the user's circuit
    except Exception as exc:  # pragma: no cover - surfaced to the caller
        print(f"error while building circuit: {exc}", file=sys.stderr)
        return 1

    out_path = Path(args.out).expanduser().resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    drawing.save(str(out_path))

    svg = out_path.read_text(encoding="utf-8")
    svg = clean_svg(svg, args.title, args.alt, args.width or None)
    out_path.write_text(svg, encoding="utf-8")
    print(out_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
