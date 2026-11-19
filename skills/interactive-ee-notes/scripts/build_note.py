#!/usr/bin/env python3
"""Build an interactive electrical / electronics / communications note.

Wraps html-study-notes, then injects the EE lab CSS/JS and only the engines
referenced by data-ee-lab attributes. Fails closed if an engine is missing.

Usage:
    python3 build_note.py --content note.content.html --meta note.meta.json \
        --out ~/notes/electronics/courses/<course>/<topic>.html [--offline]

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
EE_CSS = SKILL_ROOT / "assets" / "ee-labs.css"
EE_JS = SKILL_ROOT / "assets" / "ee-labs.js"
LABS_DIR = SKILL_ROOT / "assets" / "labs"


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
LAB_RE = re.compile(r'data-ee-lab="([a-z0-9-]+)"')

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
    """Give every inlined SVG a unique id prefix."""
    counter = 0

    def repl(match: re.Match[str]) -> str:
        nonlocal counter
        counter += 1
        svg = match.group(0)
        prefix = f"eesvg{counter}-"
        ids = set(re.findall(r'\bid="([^"]+)"', svg))
        for value in ids:
            svg = svg.replace(f'id="{value}"', f'id="{prefix}{value}"')
        for value in ids:
            svg = svg.replace(f"url(#{value})", f"url(#{prefix}{value})")
            svg = svg.replace(f'href="#{value}"', f'href="#{prefix}{value}"')
            svg = svg.replace(f'xlink:href="#{value}"', f'xlink:href="#{prefix}{value}"')
        return svg

    return re.sub(r"<svg\b.*?</svg>", repl, document, flags=re.S | re.I)


def strip_remote_assets(document: str) -> str:
    """Remove Google Fonts and KaTeX CDN tags for a truly offline file."""
    document = re.sub(
        r'<link[^>]+(?:fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)[^>]*>\s*',
        "", document, flags=re.I,
    )
    document = re.sub(
        r'<script[^>]+src="https?://[^"]+"[^>]*>\s*</script>\s*',
        "", document, flags=re.I,
    )
    return document


def main() -> int:
    parser = argparse.ArgumentParser(description="Build an interactive EE note.")
    parser.add_argument("--content", required=True, help="HTML fragment with the note body")
    parser.add_argument("--meta", required=True, help="JSON with title/course/subtitle/date/source/lang/accent")
    parser.add_argument("--out", required=True, help="Destination .html")
    parser.add_argument("--base-skill", default=str(DEFAULT_BASE), help="Path to html-study-notes")
    parser.add_argument("--offline", action="store_true", help="Strip remote fonts and KaTeX CDN")
    parser.add_argument("--extra-css", action="append", default=[], help="Extra CSS file (repeatable)")
    parser.add_argument("--extra-js", action="append", default=[], help="Extra JS file (repeatable)")
    args = parser.parse_args()

    content_path = Path(args.content).expanduser().resolve()
    meta_path = Path(args.meta).expanduser().resolve()
    if not content_path.is_file():
        parser.error(f"content file not found: {content_path}")
    if not meta_path.is_file():
        parser.error(f"meta file not found: {meta_path}")
    base = Path(args.base_skill).expanduser().resolve()
    base_build = base / "scripts" / "build_note.py"
    if not base_build.is_file():
        parser.error(f"base builder not found: {base_build}")

    content = content_path.read_text(encoding="utf-8")
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    engines = sorted(set(LAB_RE.findall(content)))
    missing = [name for name in engines if not (LABS_DIR / f"{name}.js").is_file()]
    if missing:
        parser.error("missing lab engine(s): " + ", ".join(missing))

    out_path = Path(args.out).expanduser().resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="ee-note-") as tmp:
        raw = Path(tmp) / "raw.html"
        cmd = [
            sys.executable, str(base_build),
            "--content", str(content_path),
            "--meta", str(meta_path),
            "--out", str(raw),
        ]
        proc = subprocess.run(cmd, text=True, capture_output=True)
        if proc.returncode != 0:
            sys.stderr.write(proc.stdout)
            sys.stderr.write(proc.stderr)
            return proc.returncode
        document = raw.read_text(encoding="utf-8")

    if not EE_CSS.is_file() or not EE_JS.is_file():
        parser.error("EE lab core is missing")
    css = EE_CSS.read_text(encoding="utf-8")
    js = EE_JS.read_text(encoding="utf-8")

    extra_css = ""
    for path in args.extra_css:
        p = Path(path).expanduser().resolve()
        if not p.is_file():
            parser.error(f"extra CSS not found: {p}")
        extra_css += "\n/* " + p.name + " */\n" + p.read_text(encoding="utf-8")

    document = document.replace(
        "</head>",
        f'<style id="interactive-ee-labs-css">\n{css}\n{extra_css}\n</style>\n</head>',
        1,
    )

    scripts = [f'<script id="interactive-ee-labs-js">\n{js}\n</script>']
    for name in engines:
        engine = (LABS_DIR / f"{name}.js").read_text(encoding="utf-8")
        scripts.append(f'<script id="interactive-ee-lab-{name}">\n{engine}\n</script>')
    for path in args.extra_js:
        p = Path(path).expanduser().resolve()
        if not p.is_file():
            parser.error(f"extra JS not found: {p}")
        scripts.append(f'<script id="interactive-ee-extra-{p.stem}">\n{p.read_text(encoding="utf-8")}\n</script>')
    document = document.replace("</body>", "\n".join(scripts) + "\n</body>", 1)

    document = namespace_svg_ids(document)
    if str(meta.get("lang", "tr")).lower().startswith("en"):
        document = localize_english(document)
    if args.offline:
        document = strip_remote_assets(document)

    out_path.write_text(document, encoding="utf-8")
    print(f"{out_path}  ({len(document) / 1024:.1f} KB, engines: {', '.join(engines) or 'none'})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
