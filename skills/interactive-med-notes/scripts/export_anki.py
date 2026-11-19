#!/usr/bin/env python3
"""Export a medical note quiz to Anki-importable TSV/CSV.

Two input modes:

    # A structured JSON file (recommended)
    python3 export_anki.py quiz.json --out quiz.tsv --deck "Tıp::Kardiyovasküler"

    # Extract a quiz embedded in a built note
    python3 export_anki.py ~/notes/tip/kardiyovaskuler.html --from-html \
        --out quiz.tsv --deck "Tıp::Kardiyovasküler"

The output has four columns: Front, Back, Tags, Source. Anki imports it with
File → Import; map the first row as the header. No network, no account, no
genanki dependency.
"""

from __future__ import annotations

import argparse
import csv
import html
import json
import re
import sys
from pathlib import Path


def clean(value: str) -> str:
    value = re.sub(r"<[^>]+>", "", value)
    value = html.unescape(value)
    value = value.replace("\r", " ").replace("\n", " ").replace("\t", " ")
    return re.sub(r"\s+", " ", value).strip()


def load_json(path: Path) -> tuple[str, str, list[dict]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("JSON root must be an object")
    deck = str(data.get("deck", "Tıp"))
    source = str(data.get("source", path.stem))
    cards = data.get("cards")
    if not isinstance(cards, list):
        raise ValueError("JSON must contain a 'cards' array")
    return deck, source, cards


def load_html(path: Path, deck: str) -> tuple[str, str, list[dict]]:
    document = path.read_text(encoding="utf-8")
    blocks = re.findall(
        r'<script[^>]*class="quiz-data"[^>]*>(.*?)</script>', document, re.S | re.I
    )
    if not blocks:
        raise ValueError("no quiz-data block found in the HTML")
    cards: list[dict] = []
    for raw in blocks:
        questions = json.loads(raw)
        for question in questions:
            prompt = clean(str(question.get("prompt", "")))
            options = question.get("options") or []
            answer = question.get("answer")
            explain = clean(str(question.get("explain", "")))
            if not prompt or not options or not isinstance(answer, int):
                continue
            if not 0 <= answer < len(options):
                continue
            correct = clean(str(options[answer]))
            back = correct
            if explain:
                back += " — " + explain
            cards.append({
                "front": prompt,
                "back": back,
                "tags": ["tıp", "quiz"],
            })
    return deck, path.stem, cards


def normalize(cards: list[dict], source: str) -> list[dict]:
    result: list[dict] = []
    for index, card in enumerate(cards, start=1):
        if not isinstance(card, dict):
            raise ValueError(f"card {index} is not an object")
        front = clean(str(card.get("front", "")))
        back = clean(str(card.get("back", "")))
        if not front or not back:
            raise ValueError(f"card {index} needs a non-empty front and back")
        tags = card.get("tags") or []
        if isinstance(tags, str):
            tags = [tags]
        tags = [clean(str(tag)).replace(" ", "_") for tag in tags if clean(str(tag))]
        result.append({
            "front": front,
            "back": back,
            "tags": " ".join(tags),
            "source": clean(str(card.get("source", source))),
        })
    return result


def write_tsv(path: Path, cards: list[dict]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, delimiter="\t", quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
        writer.writerow(["Front", "Back", "Tags", "Source"])
        for card in cards:
            writer.writerow([card["front"], card["back"], card["tags"], card["source"]])


def write_csv(path: Path, cards: list[dict]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, quoting=csv.QUOTE_ALL, lineterminator="\n")
        writer.writerow(["Front", "Back", "Tags", "Source"])
        for card in cards:
            writer.writerow([card["front"], card["back"], card["tags"], card["source"]])


def main() -> int:
    parser = argparse.ArgumentParser(description="Export a medical quiz to Anki TSV/CSV.")
    parser.add_argument("input", help="JSON file or built HTML note")
    parser.add_argument("--out", required=True, help="Output .tsv or .csv")
    parser.add_argument("--deck", default="", help="Deck/tag prefix (default: from JSON or 'Tıp')")
    parser.add_argument("--from-html", action="store_true", help="Extract quiz-data from a built HTML note")
    parser.add_argument("--csv", action="store_true", help="Write CSV instead of TSV")
    args = parser.parse_args()

    path = Path(args.input).expanduser().resolve()
    if not path.is_file():
        print(f"error: file not found: {path}", file=sys.stderr)
        return 2

    try:
        if args.from_html or path.suffix.lower() in {".html", ".htm"}:
            deck = args.deck or "Tıp"
            deck, source, cards = load_html(path, deck)
        else:
            deck, source, cards = load_json(path)
            if args.deck:
                deck = args.deck
        cards = normalize(cards, source)
    except (ValueError, json.JSONDecodeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    if not cards:
        print("error: no cards to export", file=sys.stderr)
        return 1

    # Add the deck as a tag so one export can feed a single deck or filtered tags.
    deck_tag = clean(deck).replace("::", "_").replace(" ", "_")
    for card in cards:
        card["tags"] = (card["tags"] + " " + deck_tag).strip()

    out_path = Path(args.out).expanduser().resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if args.csv or out_path.suffix.lower() == ".csv":
        write_csv(out_path, cards)
    else:
        write_tsv(out_path, cards)

    print(f"{out_path}")
    print(f"  deck: {deck}")
    print(f"  cards: {len(cards)}")
    print("  import: Anki → File → Import → map Front/Back/Tags/Source")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
