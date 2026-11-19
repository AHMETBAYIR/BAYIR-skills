#!/usr/bin/env python3
"""Convert the research Markdown dossiers to a single HTML fragment.

This is deliberately small and dependency-free. It handles the subset used by
the medical research notes: headings, paragraphs, lists, pipe tables, links,
bold/italic, inline code, blockquotes and fenced code. It escapes HTML first;
the source files are data, not markup.

Usage:
    python3 md_to_html.py research/*.md --out research.content.html \
        --index-title "Araştırma Dosyası"
"""

from __future__ import annotations

import argparse
import html
import re
from pathlib import Path

TR_MAP = str.maketrans({
    "ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u",
    "Ç": "c", "Ğ": "g", "İ": "i", "I": "i", "Ö": "o", "Ş": "s", "Ü": "u",
})


def slugify(text: str, used: set[str] | None = None) -> str:
    value = re.sub(r"<[^>]+>", " ", text)
    value = html.unescape(value).translate(TR_MAP).lower()
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-") or "bolum"
    if used is None:
        return value
    candidate, n = value, 2
    while candidate in used:
        candidate = f"{value}-{n}"
        n += 1
    used.add(candidate)
    return candidate


def inline(text: str) -> str:
    """Inline formatting after HTML escaping."""
    # Protect code spans from the emphasis pass.
    codes: list[str] = []

    def code_repl(match: re.Match[str]) -> str:
        codes.append(match.group(1))
        return f"\x00CODE{len(codes) - 1}\x00"

    text = re.sub(r"`([^`]+)`", code_repl, text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<em>\1</em>", text)
    text = re.sub(
        r"\[([^\]]+)\]\((https?://[^)\s]+)\)",
        lambda m: f'<a href="{m.group(2)}">{m.group(1)}</a>',
        text,
    )
    text = re.sub(
        r"!\[([^\]]*)\]\(([^)\s]+)\)",
        lambda m: f'<img src="{m.group(2)}" alt="{m.group(1)}">',
        text,
    )
    for i, code in enumerate(codes):
        text = text.replace(f"\x00CODE{i}\x00", f"<code>{code}</code>")
    return text


def convert(markdown: str, id_prefix: str = "") -> str:
    lines = markdown.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    out: list[str] = []
    used_ids: set[str] = set()
    paragraph: list[str] = []
    list_items: list[str] = []
    list_tag = ""
    table_lines: list[str] = []
    code_lines: list[str] = []
    in_code = False
    in_blockquote = False

    def flush_paragraph() -> None:
        nonlocal paragraph
        if paragraph:
            out.append("<p>" + inline(" ".join(part.strip() for part in paragraph)) + "</p>")
            paragraph = []

    def flush_list() -> None:
        nonlocal list_items, list_tag
        if list_items:
            out.append(f"<{list_tag}>" + "".join(f"<li>{inline(item)}</li>" for item in list_items) + f"</{list_tag}>")
            list_items = []
            list_tag = ""

    def flush_table() -> None:
        nonlocal table_lines
        if not table_lines:
            return
        rows = [row.strip().strip("|") for row in table_lines if row.strip()]
        if len(rows) < 2:
            out.append("<p>" + inline(" ".join(rows)) + "</p>")
            table_lines = []
            return
        header = [cell.strip() for cell in rows[0].split("|")]
        body = rows[2:] if re.match(r"^[\s:-]+$", rows[1].replace("|", "")) else rows[1:]
        out.append('<div class="table-wrap"><table>')
        out.append("<thead><tr>" + "".join(f"<th>{inline(cell)}</th>" for cell in header) + "</tr></thead>")
        out.append("<tbody>")
        for row in body:
            cells = [cell.strip() for cell in row.split("|")]
            out.append("<tr>" + "".join(f"<td>{inline(cell)}</td>" for cell in cells) + "</tr>")
        out.append("</tbody></table></div>")
        table_lines = []

    def flush_blockquote() -> None:
        nonlocal in_blockquote
        if in_blockquote:
            out.append("</blockquote>")
            in_blockquote = False

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if in_code:
            if stripped.startswith("```"):
                out.append("<pre><code>" + html.escape("\n".join(code_lines)) + "</code></pre>")
                code_lines = []
                in_code = False
            else:
                code_lines.append(line)
            i += 1
            continue

        if stripped.startswith("```"):
            flush_paragraph()
            flush_list()
            flush_table()
            flush_blockquote()
            in_code = True
            i += 1
            continue

        if not stripped:
            flush_paragraph()
            flush_list()
            flush_table()
            flush_blockquote()
            i += 1
            continue

        # Pipe table
        if stripped.startswith("|") and "|" in stripped[1:]:
            flush_paragraph()
            flush_list()
            flush_blockquote()
            table_lines.append(stripped)
            i += 1
            continue
        elif table_lines:
            flush_table()

        # Headings
        heading = re.match(r"^(#{1,6})\s+(.*)$", stripped)
        if heading:
            flush_paragraph()
            flush_list()
            flush_blockquote()
            level = len(heading.group(1))
            # # -> h2, ## -> h3, ### -> h4 ... so the note TOC has one top level.
            tag = f"h{min(6, level + 1)}"
            text = heading.group(2).strip()
            anchor = slugify(text, used_ids)
            if id_prefix:
                anchor = id_prefix + "-" + anchor
            out.append(f'<{tag} id="{anchor}">{inline(text)}</{tag}>')
            i += 1
            continue

        # Horizontal rule
        if re.match(r"^---+$", stripped):
            flush_paragraph()
            flush_list()
            flush_blockquote()
            out.append("<hr>")
            i += 1
            continue

        # Blockquote (accumulate consecutive lines)
        if stripped.startswith(">"):
            flush_paragraph()
            flush_list()
            flush_table()
            content = stripped[1:].strip()
            if not in_blockquote:
                out.append("<blockquote>")
                in_blockquote = True
            out.append("<p>" + inline(content) + "</p>")
            i += 1
            continue
        else:
            flush_blockquote()

        # Lists
        bullet = re.match(r"^([-*])\s+(.*)$", stripped)
        numbered = re.match(r"^(\d+)\.\s+(.*)$", stripped)
        if bullet or numbered:
            flush_paragraph()
            tag = "ul" if bullet else "ol"
            if list_tag and list_tag != tag:
                flush_list()
            list_tag = tag
            list_items.append((bullet or numbered).group(2))
            i += 1
            continue
        elif list_items and line.startswith(("  ", "\t")):
            # Continuation of the previous list item.
            list_items[-1] += " " + stripped
            i += 1
            continue
        else:
            flush_list()

        paragraph.append(stripped)
        i += 1

    flush_paragraph()
    flush_list()
    flush_table()
    flush_blockquote()
    if in_code:
        out.append("<pre><code>" + html.escape("\n".join(code_lines)) + "</code></pre>")
    return "\n".join(out)


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert medical research Markdown to HTML.")
    parser.add_argument("files", nargs="+", help="Markdown files")
    parser.add_argument("--out", required=True, help="Output HTML fragment")
    parser.add_argument("--index-title", default="Araştırma Dosyası")
    parser.add_argument("--index-lede", default="")
    args = parser.parse_args()

    parts: list[str] = []
    parts.append("<h2 id=\"dossier-index\">" + html.escape(args.index_title) + "</h2>")
    if args.index_lede:
        parts.append("<p class=\"lede\">" + inline(html.escape(args.index_lede)) + "</p>")

    toc_items: list[str] = []
    sections: list[str] = []
    for path_str in args.files:
        path = Path(path_str).expanduser()
        if not path.is_file():
            print(f"warning: missing {path}")
            continue
        text = path.read_text(encoding="utf-8")
        title_match = re.search(r"^#\s+(.+)$", text, re.M)
        title = title_match.group(1).strip() if title_match else path.stem
        anchor = slugify(title)
        toc_items.append(f'<li><a href="#{anchor}">{html.escape(title)}</a></li>')
        prefix = slugify(path.stem)
        body = convert(text, prefix)
        # Give the first h2 the stable section anchor instead of its generated one.
        body = re.sub(r'<h2 id="[^"]*">', f'<h2 id="{anchor}">', body, count=1)
        sections.append(f'<section class="dossier" data-source="{html.escape(path.name)}">\n{body}\n</section>')

    parts.append('<nav class="dossier-toc"><p class="dossier-toc__title">14 alt konu</p><ol>' + "".join(toc_items) + "</ol></nav>")
    parts.extend(sections)
    out_path = Path(args.out).expanduser()
    out_path.write_text("\n".join(parts) + "\n", encoding="utf-8")
    print(out_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
