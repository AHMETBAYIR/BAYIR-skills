"""Subtitle parsing, rolling-caption de-duplication and segment formatting."""

from __future__ import annotations

import html
import json
import re
from dataclasses import dataclass, asdict
from pathlib import Path

from .util import fmt_ts


@dataclass
class Cue:
    start: float
    end: float
    text: str


@dataclass
class Word:
    start: float
    end: float
    text: str


_CJK_RE = re.compile(r"[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]")
_TAG_RE = re.compile(r"<[^>]*>")
_TS_RE = re.compile(
    r"(?P<h>\d{1,2}):(?P<m>\d{2}):(?P<s>\d{2})[.,](?P<ms>\d{3})\s*-->\s*"
    r"(?P<h2>\d{1,2}):(?P<m2>\d{2}):(?P<s2>\d{2})[.,](?P<ms2>\d{3})"
)


def clean_text(text: str) -> str:
    text = html.unescape(text or "")
    text = text.replace("\u200b", "").replace("\ufeff", "")
    text = _TAG_RE.sub("", text)
    text = text.replace("\n", " ")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)
    return text.strip()


def _ts(m: re.Match, which: int = 1) -> float:
    if which == 1:
        return int(m.group("h")) * 3600 + int(m.group("m")) * 60 + int(m.group("s")) + int(m.group("ms")) / 1000
    return int(m.group("h2")) * 3600 + int(m.group("m2")) * 60 + int(m.group("s2")) + int(m.group("ms2")) / 1000


def parse_vtt(text: str) -> list[Cue]:
    cues: list[Cue] = []
    blocks = re.split(r"\n\s*\n", text.replace("\r\n", "\n").replace("\r", "\n"))
    for block in blocks:
        lines = [ln for ln in block.split("\n") if ln.strip()]
        if not lines or lines[0].strip().upper().startswith(("WEBVTT", "NOTE", "STYLE", "REGION")):
            continue
        ts_idx = next((i for i, ln in enumerate(lines) if "-->" in ln), None)
        if ts_idx is None:
            continue
        m = _TS_RE.search(lines[ts_idx])
        if not m:
            continue
        body = clean_text(" ".join(lines[ts_idx + 1:]))
        if body:
            cues.append(Cue(_ts(m, 1), _ts(m, 2), body))
    return _merge_duplicate_cues(cues)


def parse_srt(text: str) -> list[Cue]:
    cues: list[Cue] = []
    blocks = re.split(r"\n\s*\n", text.replace("\r\n", "\n").replace("\r", "\n"))
    for block in blocks:
        lines = [ln for ln in block.split("\n") if ln.strip()]
        ts_idx = next((i for i, ln in enumerate(lines) if "-->" in ln), None)
        if ts_idx is None:
            continue
        m = _TS_RE.search(lines[ts_idx])
        if not m:
            continue
        body = clean_text(" ".join(lines[ts_idx + 1:]))
        if body:
            cues.append(Cue(_ts(m, 1), _ts(m, 2), body))
    return _merge_duplicate_cues(cues)


def _merge_duplicate_cues(cues: list[Cue]) -> list[Cue]:
    out: list[Cue] = []
    for c in cues:
        if not c.text:
            continue
        if out and c.text == out[-1].text and c.start <= out[-1].end + 0.5:
            out[-1].end = max(out[-1].end, c.end)
        else:
            out.append(c)
    return out


def json3_words(text: str) -> tuple[list[list[Word]], list[str]]:
    """Return per-event word lists plus append-only punctuation fragments."""
    data = json.loads(text)
    events = data.get("events") or []
    event_words: list[list[Word]] = []
    appends: list[str] = []
    for ev in events:
        base = float(ev.get("tStartMs") or 0) / 1000.0
        dur = float(ev.get("dDurationMs") or 0) / 1000.0
        segs = ev.get("segs") or []
        is_append = bool(ev.get("aAppend"))
        if is_append:
            chunk = clean_text("".join(s.get("utf8", "") for s in segs))
            if chunk:
                appends.append(chunk)
            continue
        words: list[Word] = []
        for seg in segs:
            raw = seg.get("utf8", "")
            if not raw:
                continue
            off = float(seg.get("tOffsetMs") or 0) / 1000.0
            for m in re.finditer(r"\S+", raw):
                token = clean_text(m.group())
                if not token:
                    continue
                # Spread a segment's tokens across the segment's duration.
                frac = m.start() / max(1, len(raw))
                start = base + off + frac * max(0.0, dur - off)
                words.append(Word(start, start + 0.25, token))
        if words:
            event_words.append(words)
    return event_words, appends


def _norm_word(w: str) -> str:
    return re.sub(r"^[^\w]+|[^\w]+$", "", w.lower(), flags=re.UNICODE)


def dedup_event_words(event_words: list[list[Word]], max_overlap: int = 60) -> list[Word]:
    """Remove the rolling overlap between consecutive auto-caption windows."""
    out: list[Word] = []
    for words in event_words:
        keys = [_norm_word(w.text) for w in words]
        best = 0
        limit = min(len(out), len(keys), max_overlap)
        for k in range(limit, 0, -1):
            tail = [_norm_word(w.text) for w in out[-k:]]
            if tail == keys[:k]:
                best = k
                break
        for w in words[best:]:
            # A one-word cue that exactly repeats the previous word is a
            # rolling artefact, not a real repetition.
            if out and _norm_word(w.text) == _norm_word(out[-1].text) and len(words) == 1:
                continue
            out.append(w)
    return out


_STOPWORDS = {"a", "an", "the", "in", "on", "at", "to", "of", "and", "or", "is",
              "it", "that", "this", "so", "we", "i", "you", "he", "she", "they",
              "but", "for", "with", "as", "was", "were", "be", "been", "has", "had"}
_EMPHASIS = {"very", "really", "no", "yes", "never", "bye", "ha", "haha", "so"}


def clean_word_stream(words: list[Word]) -> list[Word]:
    """Repair common caption artefacts: stutters and split words.

    Deliberately conservative: "per" must not be eaten by "performance", and
    "A and M" must survive. Only exact stopword repeats and clear fragment
    continuations are removed.
    """
    out: list[Word] = []
    for w in words:
        nw = _norm_word(w.text)
        if not nw:
            if out:
                out[-1].text += w.text
            continue
        if out:
            pw = _norm_word(out[-1].text)
            # "respons responsible" -> keep the complete word.
            if pw and len(pw) >= 5 and nw.startswith(pw) and (len(nw) - len(pw)) <= 6:
                out[-1] = w
                continue
            # "in in", "the the", "Snapdragon Snapdragon" -> one copy.
            # Keep genuine emphasis ("very very", "no no").
            if nw == pw and nw not in _EMPHASIS:
                continue
            # "s so" -> drop the single-letter fragment. Never drop "a" or "I".
            if len(pw) == 1 and pw.islower() and pw not in ("a", "i") and nw.startswith(pw):
                out[-1] = w
                continue
        out.append(w)
    return out


def cues_from_json3(text: str) -> tuple[list[Cue], list[Word]]:
    event_words, appends = json3_words(text)
    # YouTube's json3 auto-caption events are sequential text, not rolling
    # windows; only the timing overlaps. Concatenate and repair stutters.
    words = clean_word_stream([w for ws in event_words for w in ws])
    if appends and words:
        # Punctuation-only append events belong to the previous word.
        for a in appends:
            if re.fullmatch(r"[\W_]+", a):
                words[-1].text += a
    return group_words(words), words


def words_from_cues(cues: list[Cue]) -> list[Word]:
    words: list[Word] = []
    for c in cues:
        tokens = list(re.finditer(r"\S+", c.text))
        if not tokens:
            continue
        span = max(0.001, c.end - c.start)
        for m in tokens:
            frac = m.start() / max(1, len(c.text))
            start = c.start + frac * span
            words.append(Word(start, min(c.end, start + 0.3), m.group()))
    return words


def _is_cjk(text: str) -> bool:
    return bool(_CJK_RE.search(text)) and len(_CJK_RE.findall(text)) >= max(4, len(text) // 4)


def join_words(words: list[Word]) -> str:
    if not words:
        return ""
    raw = [w.text for w in words]
    if _is_cjk("".join(raw)):
        text = "".join(raw)
    else:
        text = " ".join(raw)
        text = re.sub(r"\s+([,.;:!?%)\]}»”’])", r"\1", text)
        text = re.sub(r"([({\[«“‘])\s+", r"\1", text)
    return clean_text(text)


def group_words(words: list[Word], max_chars: int = 520, max_duration: float = 18.0,
                max_gap: float = 1.4) -> list[Cue]:
    if not words:
        return []
    out: list[Cue] = []
    cur: list[Word] = []
    cur_chars = 0

    def flush() -> None:
        nonlocal cur, cur_chars
        if not cur:
            return
        text = join_words(cur)
        if text:
            out.append(Cue(cur[0].start, max(cur[-1].end, cur[0].start + 0.2), text))
        cur = []
        cur_chars = 0

    for w in words:
        if cur:
            gap = w.start - cur[-1].end
            too_long = (w.end - cur[0].start) > max_duration
            too_wide = cur_chars + len(w.text) + 1 > max_chars
            if gap > max_gap or too_long or too_wide:
                flush()
        cur.append(w)
        cur_chars += len(w.text) + 1
        # Sentence-final punctuation closes the segment when it is long enough.
        if re.search(r"[.!?。！？][\"'»”’)]*$", w.text) and cur_chars >= 40:
            flush()
    flush()
    return out


def group_cues(cues: list[Cue], max_chars: int = 620, max_duration: float = 55.0,
               max_gap: float = 2.0) -> list[Cue]:
    out: list[Cue] = []
    cur: list[Cue] = []
    cur_chars = 0

    def flush() -> None:
        nonlocal cur, cur_chars
        if not cur:
            return
        text = clean_text(" ".join(c.text for c in cur))
        if text:
            out.append(Cue(cur[0].start, max(cur[-1].end, cur[0].start + 0.2), text))
        cur = []
        cur_chars = 0

    for c in cues:
        if cur:
            gap = c.start - cur[-1].end
            if gap > max_gap or cur_chars + len(c.text) + 1 > max_chars \
                    or (c.end - cur[0].start) > max_duration:
                flush()
        cur.append(c)
        cur_chars += len(c.text) + 1
    flush()
    return out


def parse_subtitle_text(text: str, fmt: str, auto: bool) -> tuple[list[Cue], list[Word]]:
    fmt = fmt.lower().lstrip(".")
    if fmt in ("json3", "json"):
        return cues_from_json3(text)
    if fmt == "vtt":
        cues = parse_vtt(text)
    elif fmt == "srt":
        cues = parse_srt(text)
    else:
        # Last resort: try each parser.
        for parser in (parse_vtt, parse_srt):
            try:
                cues = parser(text)
                if cues:
                    break
            except Exception:  # noqa: BLE001
                cues = []
        else:
            cues = []
    if auto:
        words = clean_word_stream(dedup_event_words([words_from_cues([c]) for c in cues]))
        return group_words(words) if words else group_cues(cues), words
    return group_cues(cues), words_from_cues(cues)


def parse_subtitle_file(path: Path, auto: bool) -> tuple[list[Cue], list[Word]]:
    text = path.read_text(encoding="utf-8", errors="replace")
    return parse_subtitle_text(text, path.suffix.lower().lstrip("."), auto)


def segments_json(cues: list[Cue]) -> list[dict]:
    return [{"start": round(c.start, 3), "end": round(c.end, 3), "text": c.text} for c in cues]


def segments_text(cues: list[Cue]) -> str:
    return "\n\n".join(c.text for c in cues).strip()


def segments_srt(cues: list[Cue]) -> str:
    lines: list[str] = []
    for i, c in enumerate(cues, 1):
        lines.append(str(i))
        lines.append(f"{fmt_ts(c.start, True).replace('.', ',')} --> {fmt_ts(c.end, True).replace('.', ',')}")
        lines.append(_wrap(c.text))
        lines.append("")
    return "\n".join(lines)


def segments_vtt(cues: list[Cue]) -> str:
    lines = ["WEBVTT", ""]
    for c in cues:
        lines.append(f"{fmt_ts(c.start, True)} --> {fmt_ts(c.end, True)}")
        lines.append(_wrap(c.text))
        lines.append("")
    return "\n".join(lines)


def _wrap(text: str, width: int = 88) -> str:
    if _is_cjk(text):
        return text
    words = text.split()
    lines: list[str] = []
    cur = ""
    for w in words:
        if cur and len(cur) + 1 + len(w) > width:
            lines.append(cur)
            cur = w
        else:
            cur = f"{cur} {w}".strip()
    if cur:
        lines.append(cur)
    return "\n".join(lines)


def cues_to_dict(cues: list[Cue]) -> list[dict]:
    return [asdict(c) for c in cues]
