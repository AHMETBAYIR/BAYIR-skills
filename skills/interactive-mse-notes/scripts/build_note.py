#!/usr/bin/env python3
"""Build an interactive materials science note.

Wraps html-study-notes, then injects the MSE lab CSS/JS and localizes the
Turkish chrome to English when the note language is `en`.

Usage:
    python3 build_note.py --content note.content.html --meta note.meta.json \\
        --out ~/notes/mse/topic.html

The base skill is expected at ~/.agents/skills/html-study-notes. Override it
with --base-skill if it lives elsewhere.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parent.parent
MSE_CSS = SKILL_ROOT / "assets" / "mse-labs.css"
MSE_JS = SKILL_ROOT / "assets" / "mse-labs.js"
DEFAULT_BASE = Path.home() / ".agents" / "skills" / "html-study-notes"

EN_REPLACEMENTS = {
    "İçeriğe geç": "Skip to content",
    "İçindekileri aç": "Open contents",
    "İçindekileri kapat": "Close contents",
    "İçindekiler": "Contents",
    "Ders notu": "Study note",
    "Yazdırmak için": "To print,",
    "Çözümler yazdırmada otomatik açılır.": "Solutions open automatically in print.",
    "Tarih": "Date",
    "Kaynak": "Source",
    "Okuma": "Reading",
    " dk": " min",
    "Biçim": "Format",
    "Çalışma notu": "Study note",
    "Mobil görünüm": "Mobile view",
    "Masaüstü / mobil görünüm": "Desktop / mobile view",
    "Masaüstü görünüm": "Desktop view",
    "Masaüstü görünümüne geç": "Switch to desktop view",
    "Temayı değiştir": "Change theme",
    "Açık temaya geç": "Switch to light theme",
    "Koyu temaya geç": "Switch to dark theme",
    "Yazdır": "Print",
    "Kopyala": "Copy",
    "Kopyalandı": "Copied",
    "Soru": "Question",
    "Çözüm": "Solution",
    "Şekil": "Figure",
    "Tanım": "Definition",
    "Teorem": "Theorem",
    "Örnek": "Example",
    "Uyarı": "Warning",
    "İpucu": "Tip",
    "Alıştırma": "Exercise",
    "Anahtar noktalar": "Key points",
}


def localize_english(document: str) -> str:
    for old, new in EN_REPLACEMENTS.items():
        document = document.replace(old, new)
    return document


def namespace_svg_ids(document: str) -> str:
    """Make ids inside inlined SVGs unique.

    Two inlined figures with clipPath id="c1" make the browser resolve the
    second url(#c1) to the first figure. Give each SVG its own prefix.
    """
    counter = 0

    def repl(match: re.Match[str]) -> str:
        nonlocal counter
        counter += 1
        svg = match.group(0)
        prefix = f"msesvg{counter}-"
        ids = set(re.findall(r'\bid="([^"]+)"', svg))
        for value in ids:
            svg = svg.replace(f'id="{value}"', f'id="{prefix}{value}"')
        for value in ids:
            svg = svg.replace(f"url(#{value})", f"url(#{prefix}{value})")
            svg = svg.replace(f'href="#{value}"', f'href="#{prefix}{value}"')
            svg = svg.replace(f'xlink:href="#{value}"', f'xlink:href="#{prefix}{value}"')
        return svg

    return re.sub(r"<svg\b.*?</svg>", repl, document, flags=re.S | re.I)


def main() -> int:
    parser = argparse.ArgumentParser(description="Build an interactive materials science note.")
    parser.add_argument("--content", required=True, help="HTML fragment with the note body")
    parser.add_argument("--meta", required=True, help="JSON metadata file")
    parser.add_argument("--out", required=True, help="Destination .html file")
    parser.add_argument("--base-skill", default=str(DEFAULT_BASE),
                        help="Path to the html-study-notes skill")
    parser.add_argument("--extra-css", action="append", default=[],
                        help="Additional CSS file to inline (repeatable)")
    parser.add_argument("--extra-js", action="append", default=[],
                        help="Additional JS file to inline after mse-labs.js (repeatable)")
    parser.add_argument("--labs", default="",
                        help="Comma-separated lab modules from assets/labs, or 'all'")
    args = parser.parse_args()

    content_path = Path(args.content).expanduser().resolve()
    meta_path = Path(args.meta).expanduser().resolve()
    base_skill = Path(args.base_skill).expanduser().resolve()
    base_builder = base_skill / "scripts" / "build_note.py"

    if not content_path.is_file():
        parser.error(f"content file not found: {content_path}")
    if not meta_path.is_file():
        parser.error(f"meta file not found: {meta_path}")
    if not base_builder.is_file():
        print(
            "error: html-study-notes is required for the base template.\n"
            f"expected: {base_builder}\n"
            "Install it at ~/.agents/skills/html-study-notes or pass --base-skill.",
            file=sys.stderr,
        )
        return 2

    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    lang = str(meta.get("lang", "en")).lower()

    with tempfile.TemporaryDirectory(prefix="mse-note-") as tmp:
        built_path = Path(tmp) / "base.html"
        cmd = [
            sys.executable, str(base_builder),
            "--content", str(content_path),
            "--meta", str(meta_path),
            "--out", str(built_path),
        ]
        result = subprocess.run(cmd, text=True, capture_output=True)
        if result.returncode != 0:
            sys.stderr.write(result.stdout)
            sys.stderr.write(result.stderr)
            return result.returncode
        document = built_path.read_text(encoding="utf-8")

    if lang == "en":
        document = localize_english(document)

    document = namespace_svg_ids(document)

    css_parts = [MSE_CSS.read_text(encoding="utf-8")]
    js_parts = [MSE_JS.read_text(encoding="utf-8")]

    lab_dir = SKILL_ROOT / "assets" / "labs"
    if args.labs:
        if args.labs.strip() == "all":
            names = sorted(p.stem for p in lab_dir.glob("*.js"))
        else:
            names = [name.strip() for name in args.labs.split(",") if name.strip()]
        for name in names:
            lab_js = lab_dir / f"{name}.js"
            lab_css = lab_dir / f"{name}.css"
            if not lab_js.is_file():
                parser.error(f"lab module not found: {lab_js}")
            if lab_css.is_file():
                css_parts.append(lab_css.read_text(encoding="utf-8"))
            js_parts.append(lab_js.read_text(encoding="utf-8"))

    for extra in args.extra_css:
        extra_path = Path(extra).expanduser().resolve()
        if not extra_path.is_file():
            parser.error(f"extra CSS not found: {extra_path}")
        css_parts.append(extra_path.read_text(encoding="utf-8"))
    for extra in args.extra_js:
        extra_path = Path(extra).expanduser().resolve()
        if not extra_path.is_file():
            parser.error(f"extra JS not found: {extra_path}")
        js_parts.append(extra_path.read_text(encoding="utf-8"))

    css = "\n".join(css_parts)
    js = "\n".join(js_parts)

    if "</style" in css.lower():
        print("error: CSS contains a closing </style> tag", file=sys.stderr)
        return 2
    if "</script" in js.lower():
        print("error: extra JS contains a closing </script> tag", file=sys.stderr)
        return 2

    injection = (
        "\n<!-- interactive-mse-notes: lab layer -->\n"
        '<style id="interactive-mse-labs-css">\n' + css + "\n</style>\n"
        '<script id="interactive-mse-labs-js">\n' + js + "\n</script>\n"
    )
    if "</body>" not in document:
        print("error: built document has no </body>", file=sys.stderr)
        return 2
    document = document.replace("</body>", injection + "</body>", 1)

    out_path = Path(args.out).expanduser().resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(document, encoding="utf-8")
    print(out_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
