#!/usr/bin/env python3
"""Build a single polished HTML study note from a content fragment + metadata.

Usage:
    python3 build_note.py --content note.content.html --meta note.json --out ~/notes/topic.html

The content fragment contains only the article body. It may use the classes
documented in references/components.md. Local .svg images referenced with
<img src="..."> are inlined automatically so the result stays portable.
"""

from __future__ import annotations

import argparse
import base64
import datetime as _dt
import html
import json
import mimetypes
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "assets" / "template.html"

TR_MONTHS = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
]

TR_MAP = str.maketrans({
    "ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u",
    "Ç": "c", "Ğ": "g", "İ": "i", "I": "i", "Ö": "o", "Ş": "s", "Ü": "u",
})


def today_tr() -> str:
    now = _dt.date.today()
    return f"{now.day} {TR_MONTHS[now.month - 1]} {now.year}"


def strip_tags(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    value = html.unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def slugify(value: str) -> str:
    value = strip_tags(value).translate(TR_MAP).lower()
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value or "bolum"


def ensure_heading_ids(content: str) -> str:
    """Give every <h2> an id so the table of contents can link to it."""
    used: set[str] = set(re.findall(r'id="([^"]+)"', content))

    def repl(match: re.Match[str]) -> str:
        attrs, inner = match.group("attrs"), match.group("inner")
        existing = re.search(r'id="([^"]+)"', attrs)
        if existing:
            used.add(existing.group(1))
            return match.group(0)
        base = slugify(inner)
        slug, n = base, 2
        while slug in used:
            slug = f"{base}-{n}"
            n += 1
        used.add(slug)
        return f'<h2{attrs} id="{slug}">{inner}</h2>'

    return re.sub(
        r"<h2(?P<attrs>[^>]*)>(?P<inner>.*?)</h2>",
        repl,
        content,
        flags=re.S | re.I,
    )


def build_toc(content: str) -> str:
    items: list[str] = []
    for index, match in enumerate(
        re.finditer(r'<h2[^>]*id="([^"]+)"[^>]*>(.*?)</h2>', content, re.S | re.I),
        start=1,
    ):
        anchor, inner = match.group(1), match.group(2)
        title = strip_tags(inner)
        if not title:
            continue
        items.append(
            f'    <li><a href="#{html.escape(anchor)}">'
            f'<span class="toc__num">{index:02d}</span>{html.escape(title)}</a></li>'
        )

    if not items:
        return (
            '<nav class="toc" aria-label="İçindekiler">\n'
            '  <p class="toc__title">İçindekiler</p>\n'
            '  <p class="toc__foot">Bu not tek bir akış hâlinde okunabilir.</p>\n'
            "</nav>"
        )

    return (
        '<nav class="toc" aria-label="İçindekiler">\n'
        '  <p class="toc__title">İçindekiler</p>\n'
        "  <ol>\n" + "\n".join(items) + "\n  </ol>\n"
        "</nav>"
    )


def inline_svgs(content: str, base_dir: Path) -> str:
    """Replace <img src="local.svg"> with the SVG markup itself."""
    pattern = re.compile(r"<img\b(?P<attrs>[^>]*?)>", re.I)

    def repl(match: re.Match[str]) -> str:
        tag = match.group(0)
        src_match = re.search(r'src="([^"]+\.svg)"', tag, re.I)
        if not src_match:
            return tag
        src = src_match.group(1)
        if re.match(r"^(https?:|data:)", src, re.I):
            return tag
        path = (base_dir / src).resolve()
        if not path.is_file():
            print(f"warning: SVG not found, leaving <img>: {src}", file=sys.stderr)
            return tag
        svg = path.read_text(encoding="utf-8")
        svg = re.sub(r"<\?xml[^>]*\?>", "", svg, count=1, flags=re.I)
        svg = re.sub(r"<!DOCTYPE[^>]*>", "", svg, count=1, flags=re.I)
        svg = svg.strip()

        alt_match = re.search(r'alt="([^"]*)"', tag, re.I)
        alt = html.unescape(alt_match.group(1)) if alt_match else ""
        extra = f' class="figure__svg" role="img" aria-label="{html.escape(alt)}"'
        if re.search(r"<svg\b[^>]*\bclass=", svg, re.I):
            svg = re.sub(r'\bclass="[^"]*"', 'class="figure__svg"', svg, count=1, flags=re.I)
            if alt:
                svg = re.sub(r"<svg\b", f'<svg role="img" aria-label="{html.escape(alt)}"', svg, count=1, flags=re.I)
        else:
            svg = re.sub(r"<svg\b", f"<svg{extra}", svg, count=1, flags=re.I)
        return svg

    return pattern.sub(repl, content)


def inline_rasters(content: str, base_dir: Path) -> str:
    """Turn local <img src="...png/jpg"> into data URIs for a single-file note."""
    pattern = re.compile(r'src="([^"]+\.(?:png|jpe?g|webp))"', re.I)

    def repl(match: re.Match[str]) -> str:
        src = match.group(1)
        if re.match(r"^(https?:|data:)", src, re.I):
            return match.group(0)
        path = (base_dir / src).resolve()
        if not path.is_file():
            print(f"warning: raster image not found, leaving src: {src}", file=sys.stderr)
            return match.group(0)
        mime = mimetypes.guess_type(str(path))[0] or "image/png"
        payload = base64.b64encode(path.read_bytes()).decode("ascii")
        return f'src="data:{mime};base64,{payload}"'

    return pattern.sub(repl, content)


def reading_time(content: str) -> str:
    words = len(strip_tags(content).split())
    minutes = max(1, round(words / 190))
    return f"~{minutes} dk"


def main() -> int:
    parser = argparse.ArgumentParser(description="Build a single-file HTML study note.")
    parser.add_argument("--content", required=True, help="HTML fragment with the note body")
    parser.add_argument("--meta", help="JSON file with title/course/subtitle/date/source/lang/accent")
    parser.add_argument("--out", required=True, help="Destination .html file")
    args = parser.parse_args()

    content_path = Path(args.content).expanduser().resolve()
    if not content_path.is_file():
        parser.error(f"content file not found: {content_path}")
    content = content_path.read_text(encoding="utf-8")

    meta: dict[str, str] = {}
    if args.meta:
        meta_path = Path(args.meta).expanduser().resolve()
        if not meta_path.is_file():
            parser.error(f"meta file not found: {meta_path}")
        meta = json.loads(meta_path.read_text(encoding="utf-8"))

    template = TEMPLATE.read_text(encoding="utf-8")
    content = ensure_heading_ids(content)
    content = inline_svgs(content, content_path.parent)
    content = inline_rasters(content, content_path.parent)

    title = str(meta.get("title") or "Ders Notu")
    course = str(meta.get("course") or "Ders")
    subtitle = str(meta.get("subtitle") or "Kavramlar, formüller ve çözümlü örnekler")
    date = str(meta.get("date") or today_tr())
    source = str(meta.get("source") or "Ders notları")
    lang = str(meta.get("lang") or "tr")
    accent = str(meta.get("accent") or "#8f2d2d")
    if not re.fullmatch(r"#[0-9a-fA-F]{3,8}", accent):
        accent = "#8f2d2d"

    replacements = {
        "{{LANG}}": html.escape(lang),
        "{{TITLE}}": html.escape(title),
        "{{COURSE}}": html.escape(course),
        "{{SUBTITLE}}": html.escape(subtitle),
        "{{DATE}}": html.escape(date),
        "{{SOURCE}}": html.escape(source),
        "{{ACCENT}}": accent,
        "{{READING_TIME}}": reading_time(content),
        "{{TOC}}": build_toc(content),
        "{{CONTENT}}": content,
    }
    document = template
    for key, value in replacements.items():
        document = document.replace(key, value)

    out_path = Path(args.out).expanduser().resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(document, encoding="utf-8")
    print(out_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
