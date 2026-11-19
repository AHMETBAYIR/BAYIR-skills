"""Rendering helpers for yt-transcript."""

from __future__ import annotations

import json
from pathlib import Path

from .subtitles import Cue, segments_srt, segments_vtt
from .util import fmt_ts, human_duration, shorten


def _source_label(tr: dict) -> str:
    src = tr.get("source")
    if src == "manual":
        return "YouTube manual captions"
    if src == "auto":
        return "YouTube auto captions"
    if src == "asr":
        return f"ASR ({tr.get('engine') or 'whisper'})"
    return str(src or "unknown")


def render_markdown(rec: dict, timestamps: bool = True, max_chars: int | None = None) -> str:
    v = rec.get("video") or {}
    tr = rec.get("transcript") or {}
    lines = [f"# {v.get('title') or v.get('id') or 'YouTube video'}", ""]
    lines.append(f"- **URL:** {v.get('url', '')}")
    if v.get("channel"):
        lines.append(f"- **Channel:** {v['channel']}")
    if v.get("upload_date"):
        lines.append(f"- **Published:** {v['upload_date']}")
    if v.get("duration_s"):
        lines.append(f"- **Duration:** {human_duration(v['duration_s'])}")
    lines.append(f"- **Language:** {tr.get('language') or v.get('language') or 'unknown'}")
    lines.append(f"- **Transcript:** {_source_label(tr)}")
    if tr.get("caption_track", {}).get("name"):
        lines.append(f"- **Track:** {tr['caption_track']['name']}")
    asr = tr.get("asr") or {}
    if asr:
        lines.append(f"- **ASR:** {asr.get('audio_seconds', '?')} s audio in "
                     f"{asr.get('elapsed_seconds', '?')} s (RTF {asr.get('rtf', '?')})")
    lines.append("")
    lines.append("## Transcript")
    lines.append("")
    text = ""
    for s in tr.get("segments") or []:
        line = s.get("text", "")
        if timestamps:
            line = f"[{fmt_ts(s.get('start', 0))}] {line}"
        text += line + "\n\n"
    if not tr.get("segments"):
        text = tr.get("text", "")
    lines.append(shorten(text.strip(), max_chars))
    return "\n".join(lines).rstrip() + "\n"


def render_text(rec: dict, timestamps: bool = False, max_chars: int | None = None) -> str:
    tr = rec.get("transcript") or {}
    if timestamps:
        text = "\n".join(f"[{fmt_ts(s.get('start', 0))}] {s.get('text', '')}"
                         for s in tr.get("segments") or [])
    else:
        text = tr.get("text") or ""
    return shorten(text, max_chars).rstrip() + "\n"


def render_json(rec: dict) -> str:
    return json.dumps(rec, ensure_ascii=False, indent=2) + "\n"


def render(rec: dict, fmt: str, timestamps: bool = False,
           max_chars: int | None = None) -> str:
    fmt = (fmt or "md").lower()
    if fmt == "json":
        return render_json(rec)
    if fmt in ("md", "markdown"):
        return render_markdown(rec, timestamps=timestamps, max_chars=max_chars)
    if fmt in ("text", "txt", "plain"):
        return render_text(rec, timestamps=timestamps, max_chars=max_chars)
    cues = [Cue(float(s["start"]), float(s["end"]), s["text"])
            for s in (rec.get("transcript") or {}).get("segments") or []]
    if fmt == "srt":
        return segments_srt(cues) + "\n"
    if fmt == "vtt":
        return segments_vtt(cues) + "\n"
    raise ValueError(f"unknown format: {fmt}")


def output_paths(rec: dict, save_dir: str) -> dict:
    """Write json/txt/srt copies next to a user-selected directory."""
    d = Path(save_dir).expanduser()
    d.mkdir(parents=True, exist_ok=True)
    v = rec.get("video") or {}
    stem = f"{v.get('id') or 'video'}-{v.get('title') or ''}"
    from .util import slugify
    stem = slugify(stem, 80)
    tr = rec.get("transcript") or {}
    cues = [Cue(float(s["start"]), float(s["end"]), s["text"]) for s in tr.get("segments") or []]
    jp = d / f"{stem}.json"
    tp = d / f"{stem}.txt"
    sp = d / f"{stem}.srt"
    jp.write_text(render_json(rec), encoding="utf-8")
    tp.write_text(tr.get("text", "") + "\n", encoding="utf-8")
    sp.write_text(segments_srt(cues) + "\n", encoding="utf-8")
    return {"json": str(jp), "txt": str(tp), "srt": str(sp)}
