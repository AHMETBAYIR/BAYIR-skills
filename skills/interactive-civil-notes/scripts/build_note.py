#!/usr/bin/env python3
"""Build an interactive civil engineering note.

Wraps html-study-notes, then injects the shared labkit and the civil engineering
lab layer. The output is one self-contained HTML file.

Usage:
    python3 build_note.py --content note.content.html --meta note.meta.json \\
        --out ~/notes/civil/<course>/topic.html

The base skill is resolved from $HTML_STUDY_NOTES_SKILL, then
~/.agents/skills, ~/.pi/agent/skills, ~/.claude/skills, then a sibling
../html-study-notes checkout. Override with --base-skill.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parent.parent
ASSETS = SKILL_ROOT / "assets"


def _resolve_base_skill() -> Path:
    """Locate the html-study-notes skill.

    $HTML_STUDY_NOTES_SKILL wins; otherwise the usual agent skill roots are
    tried, then a sibling checkout so this repo works as cloned. When nothing
    matches, the first candidate is returned so the error path can name it.
    """
    override = os.environ.get("HTML_STUDY_NOTES_SKILL", "").strip()
    if override:
        return Path(override).expanduser()
    candidates = [
        Path.home() / ".agents" / "skills" / "html-study-notes",
        Path.home() / ".pi" / "agent" / "skills" / "html-study-notes",
        Path.home() / ".claude" / "skills" / "html-study-notes",
        SKILL_ROOT.parent / "html-study-notes",
    ]
    for candidate in candidates:
        if (candidate / "scripts" / "build_note.py").is_file():
            return candidate
    return candidates[0]


DEFAULT_BASE = _resolve_base_skill()

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
    """Make ids inside inlined SVGs unique per figure."""
    counter = 0

    def repl(match: re.Match[str]) -> str:
        nonlocal counter
        counter += 1
        svg = match.group(0)
        prefix = f"civilsvg{counter}-"
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
    parser = argparse.ArgumentParser(description="Build an interactive civil engineering note.")
    parser.add_argument("--content", required=True, help="HTML fragment with the note body")
    parser.add_argument("--meta", required=True, help="JSON metadata file")
    parser.add_argument("--out", required=True, help="Destination .html file")
    parser.add_argument("--base-skill", default=str(DEFAULT_BASE),
                        help="Path to the html-study-notes skill")
    parser.add_argument("--extra-css", action="append", default=[],
                        help="Additional CSS file to inline (repeatable)")
    parser.add_argument("--extra-js", action="append", default=[],
                        help="Additional JS file to inline after the civil layer (repeatable)")
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
            "Set $HTML_STUDY_NOTES_SKILL, install it at ~/.agents/skills/html-study-notes, "
            "or pass --base-skill.",
            file=sys.stderr,
        )
        return 2

    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    lang = str(meta.get("lang", "tr")).lower()

    with tempfile.TemporaryDirectory(prefix="civil-note-") as tmp:
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

    css_parts = [
        (ASSETS / "labkit.css").read_text(encoding="utf-8"),
        (ASSETS / "civil-labs.css").read_text(encoding="utf-8"),
    ]
    js_parts = [
        (ASSETS / "labkit.js").read_text(encoding="utf-8"),
        (ASSETS / "civil-labs.js").read_text(encoding="utf-8"),
    ]

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
        print("error: JS contains a closing </script> tag", file=sys.stderr)
        return 2

    injection = (
        "\n<!-- interactive-civil-notes: lab layer -->\n"
        '<style id="interactive-civil-labs-css">\n' + css + "\n</style>\n"
        '<script id="interactive-civil-labs-js">\n' + js + "\n</script>\n"
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
