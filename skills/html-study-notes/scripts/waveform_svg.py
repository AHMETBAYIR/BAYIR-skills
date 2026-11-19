#!/usr/bin/env python3
"""Draw a clean engineering waveform / plot as a standalone SVG.

Input is JSON:

    {
      "title": "RC yükleme eğrisi",
      "xlabel": "t (ms)",
      "ylabel": "v_C (V)",
      "xmax": 5,
      "ymax": 10,
      "ymin": 0,
      "signals": [
        {"label": "v_C(t)", "color": "#8f2d2d",
         "points": [[0, 0], [0.5, 3.93], [1, 6.32], [2, 8.65], [5, 9.93]]}
      ]
    }

For a digital / sampled signal add "step": true to a signal. The renderer
draws horizontal-then-vertical segments, which is what timing diagrams need.

Usage:
    python3 waveform_svg.py spec.json --out waveform.svg
"""

from __future__ import annotations

import argparse
import html
import json
import math
import sys
from pathlib import Path


def fmt(value: float) -> str:
    if abs(value - round(value)) < 1e-9:
        return str(int(round(value)))
    return f"{value:.3g}"


def nice_ticks(lo: float, hi: float, count: int = 5) -> list[float]:
    if hi <= lo:
        return [lo]
    span = hi - lo
    raw = span / count
    power = 10 ** math.floor(math.log10(raw))
    norm = raw / power
    if norm <= 1:
        step = 1
    elif norm <= 2:
        step = 2
    elif norm <= 2.5:
        step = 2.5
    elif norm <= 5:
        step = 5
    else:
        step = 10
    step *= power
    start = math.ceil(lo / step) * step
    ticks = []
    value = start
    while value <= hi + step * 1e-9:
        ticks.append(round(value, 10))
        value += step
    return ticks or [lo, hi]


def main() -> int:
    parser = argparse.ArgumentParser(description="Render a waveform spec to SVG.")
    parser.add_argument("spec", help="JSON waveform specification")
    parser.add_argument("--out", required=True, help="Destination .svg file")
    parser.add_argument("--width", type=int, default=760)
    parser.add_argument("--height", type=int, default=360)
    args = parser.parse_args()

    path = Path(args.spec).expanduser().resolve()
    if not path.is_file():
        parser.error(f"spec not found: {path}")
    spec = json.loads(path.read_text(encoding="utf-8"))

    width, height = args.width, args.height
    left, right, top, bottom = 72, 24, 58, 56
    plot_w = width - left - right
    plot_h = height - top - bottom

    xmin = float(spec.get("xmin", 0))
    xmax = float(spec.get("xmax", 1))
    ymin = float(spec.get("ymin", 0))
    ymax = float(spec.get("ymax", 1))
    if xmax <= xmin:
        xmax = xmin + 1
    if ymax <= ymin:
        ymax = ymin + 1

    def sx(x: float) -> float:
        return left + (x - xmin) / (xmax - xmin) * plot_w

    def sy(y: float) -> float:
        return top + plot_h - (y - ymin) / (ymax - ymin) * plot_h

    ink = "#1e1b17"
    muted = "#7d7468"
    grid = "#e7e1d6"
    rule = "#cfc6b7"
    font = "IBM Plex Sans, system-ui, -apple-system, sans-serif"

    parts: list[str] = []
    title = str(spec.get("title", "Waveform"))
    parts.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" class="figure__svg" '
        f'role="img" aria-label="{html.escape(title)}" viewBox="0 0 {width} {height}" '
        f'width="{width}" height="{height}">'
    )
    parts.append(f"<title>{html.escape(title)}</title>")
    parts.append(f'<rect width="{width}" height="{height}" fill="#ffffff"/>')

    # grid + ticks
    for tick in nice_ticks(xmin, xmax):
        x = sx(tick)
        parts.append(
            f'<line x1="{x:.2f}" y1="{top}" x2="{x:.2f}" y2="{top + plot_h}" '
            f'stroke="{grid}" stroke-width="1"/>'
        )
        parts.append(
            f'<text x="{x:.2f}" y="{top + plot_h + 22}" text-anchor="middle" '
            f'font-family="{font}" font-size="12" fill="{muted}">{fmt(tick)}</text>'
        )
    for tick in nice_ticks(ymin, ymax, 4):
        y = sy(tick)
        parts.append(
            f'<line x1="{left}" y1="{y:.2f}" x2="{left + plot_w}" y2="{y:.2f}" '
            f'stroke="{grid}" stroke-width="1"/>'
        )
        parts.append(
            f'<text x="{left - 12}" y="{y + 4:.2f}" text-anchor="end" '
            f'font-family="{font}" font-size="12" fill="{muted}">{fmt(tick)}</text>'
        )

    # axes
    parts.append(
        f'<line x1="{left}" y1="{top + plot_h}" x2="{left + plot_w}" y2="{top + plot_h}" '
        f'stroke="{ink}" stroke-width="1.4"/>'
    )
    parts.append(
        f'<line x1="{left}" y1="{top}" x2="{left}" y2="{top + plot_h}" '
        f'stroke="{ink}" stroke-width="1.4"/>'
    )

    # dashed reference guides (time constants, thresholds, ...)
    for guide in spec.get("guides", []):
        gx = sx(float(guide["x"]))
        glabel = str(guide.get("label", ""))
        parts.append(
            f'<line x1="{gx:.2f}" y1="{top}" x2="{gx:.2f}" y2="{top + plot_h}" '
            f'stroke="{muted}" stroke-width="1" stroke-dasharray="4 4" opacity="0.75"/>'
        )
        if glabel:
            parts.append(
                f'<text x="{gx + 4:.2f}" y="{top + 12}" '
                f'font-family="{font}" font-size="11" fill="{muted}">{html.escape(glabel)}</text>'
            )
    for guide in spec.get("guides_y", []):
        gy = sy(float(guide["y"]))
        glabel = str(guide.get("label", ""))
        parts.append(
            f'<line x1="{left}" y1="{gy:.2f}" x2="{left + plot_w}" y2="{gy:.2f}" '
            f'stroke="{muted}" stroke-width="1" stroke-dasharray="4 4" opacity="0.65"/>'
        )
        if glabel:
            parts.append(
                f'<text x="{left + 6}" y="{gy - 5:.2f}" '
                f'font-family="{font}" font-size="11" fill="{muted}">{html.escape(glabel)}</text>'
            )

    # axis labels
    xlabel = str(spec.get("xlabel", ""))
    ylabel = str(spec.get("ylabel", ""))
    if xlabel:
        parts.append(
            f'<text x="{left + plot_w / 2:.2f}" y="{height - 12}" text-anchor="middle" '
            f'font-family="{font}" font-size="13" fill="{ink}">{html.escape(xlabel)}</text>'
        )
    if ylabel:
        cx, cy = 18, top + plot_h / 2
        parts.append(
            f'<text x="{cx}" y="{cy}" text-anchor="middle" transform="rotate(-90 {cx} {cy})" '
            f'font-family="{font}" font-size="13" fill="{ink}">{html.escape(ylabel)}</text>'
        )

    # signals
    signals = spec.get("signals", [])
    legend_x = left
    legend_y = 24
    for index, signal in enumerate(signals):
        points = [(float(p[0]), float(p[1])) for p in signal.get("points", [])]
        if not points:
            continue
        color = str(signal.get("color", "#8f2d2d"))
        step = bool(signal.get("step", False))
        label = str(signal.get("label", f"signal {index + 1}"))

        if step:
            coords = [f"M {sx(points[0][0]):.2f} {sy(points[0][1]):.2f}"]
            for (x0, y0), (x1, y1) in zip(points, points[1:]):
                coords.append(f"H {sx(x1):.2f}")
                coords.append(f"V {sy(y1):.2f}")
            d = " ".join(coords)
            parts.append(
                f'<path d="{d}" fill="none" stroke="{color}" stroke-width="2.2" '
                f'stroke-linejoin="round" stroke-linecap="round"/>'
            )
        else:
            coords = " ".join(f"{sx(x):.2f},{sy(y):.2f}" for x, y in points)
            parts.append(
                f'<polyline points="{coords}" fill="none" stroke="{color}" '
                f'stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>'
            )

        # horizontal legend entry across the top margin
        if legend_x + 120 < width - right:
            parts.append(
                f'<line x1="{legend_x}" y1="{legend_y}" x2="{legend_x + 22}" y2="{legend_y}" '
                f'stroke="{color}" stroke-width="2.6"/>'
            )
            parts.append(
                f'<text x="{legend_x + 30}" y="{legend_y + 4}" '
                f'font-family="{font}" font-size="12" fill="{ink}">{html.escape(label)}</text>'
            )
            legend_x += 42 + len(label) * 6.6

    parts.append("</svg>")
    svg = "\n".join(parts)

    out_path = Path(args.out).expanduser().resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(svg, encoding="utf-8")
    print(out_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
