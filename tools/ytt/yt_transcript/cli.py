"""Command-line interface for yt-transcript."""

from __future__ import annotations

import json
import os
import shutil
import sys
import time
from pathlib import Path

from . import asr
from .subtitles import (Cue, parse_subtitle_file, segments_json, segments_srt,
                        segments_text, clean_text)
from .util import (atomic_write_json, atomic_write_text, eprint,
                   human_duration, read_json)
from . import youtube

VERSION = "0.1.0"


def cache_root() -> Path:
    p = Path(os.path.expanduser(os.environ.get("YTT_CACHE", "~/.cache/yt-transcript")))
    p.mkdir(parents=True, exist_ok=True)
    return p


def video_dir(video_id: str) -> Path:
    d = cache_root() / video_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def _language_arg(args) -> str:
    return (args.lang or "auto").strip()


def _resolve_asr_language(lang_arg: str, meta: dict, asr_lang: str | None = None) -> str:
    if asr_lang and asr_lang.lower() not in ("auto", "detect", ""):
        return asr_lang.split(",")[0].strip().lower().split("-")[0]
    # The spoken language is normally the video's original language, not the
    # requested caption language. Asking for German captions on an English
    # talk should not make Whisper transcribe English as German.
    original = (meta.get("language") or "").lower().split("-")[0]
    if original:
        return original
    if lang_arg and lang_arg.lower() not in ("auto", "detect"):
        return lang_arg.split(",")[0].strip().lower().split("-")[0]
    return "en"


def _record_path(vdir: Path, language: str, source: str) -> Path:
    safe = (language or "auto").replace("/", "-")[:20]
    return vdir / f"transcript.{safe}.{source}.json"


def _load_cached(vdir: Path, lang_arg: str, refresh: bool,
                 force_asr: bool = False, no_asr: bool = False) -> dict | None:
    if refresh:
        return None
    meta = read_json(vdir / "meta.json")
    if not meta:
        return None
    priority = {"manual": 0, "auto": 1, "asr": 2}
    paths = sorted(vdir.glob("transcript.*.json"),
                   key=lambda p: (priority.get((read_json(p) or {}).get("transcript", {}).get("source"), 9),
                                  -p.stat().st_mtime))
    for p in paths:
        rec = read_json(p)
        if not rec:
            continue
        tr = rec.get("transcript") or {}
        src = tr.get("source")
        if force_asr and src != "asr":
            continue
        if no_asr and src == "asr":
            continue
        want = (lang_arg or "auto").lower()
        if (want in ("auto", "detect", "")
                or (tr.get("language") or "").lower().startswith(want.split("-")[0])
                or (tr.get("requested_language") or "").lower().startswith(want.split("-")[0])):
            rec["_cache_path"] = str(p)
            rec["cache"] = {**(rec.get("cache") or {}), "hit": True}
            return rec
    return None


def _caption_transcript(url: str, info: dict, meta: dict, lang_arg: str,
                        timeout: int, cookies: str | None, proxy: str | None,
                        quiet: bool) -> dict | None:
    track = youtube.pick_track(info, lang_arg)
    if not track:
        return None
    if not quiet:
        eprint(f"  captions: {track['kind']} {track['lang']} ({track['ext']})")
    tmp = Path(os.path.expanduser("~/.tmp")) / f"ytt-sub-{meta['id']}-{os.getpid()}"
    tmp.mkdir(parents=True, exist_ok=True)
    try:
        path = youtube.download_subtitle(track, url, tmp, timeout=timeout,
                                         cookies=cookies, proxy=proxy)
        cues, _words = parse_subtitle_file(path, auto=(track["kind"] == "auto"))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    if not cues:
        return None
    text = segments_text(cues)
    if len(text.split()) < 5:
        return None
    return {
        "source": track["kind"],
        "language": track["lang"],
        "engine": "youtube",
        "text": text,
        "segments": segments_json(cues),
        "word_count": len(text.split()),
        "char_count": len(text),
        "caption_track": {"kind": track["kind"], "lang": track["lang"],
                          "name": track.get("name") or "", "ext": track["ext"]},
    }


def _asr_transcript(url: str, meta: dict, lang_arg: str, engine: str,
                    timeout: int, cookies: str | None, proxy: str | None,
                    keep_audio: bool, quiet: bool, asr_lang: str | None = None) -> dict:
    tmp = Path(os.path.expanduser("~/.tmp")) / f"ytt-audio-{meta['id']}-{os.getpid()}"
    tmp.mkdir(parents=True, exist_ok=True)
    try:
        cached_audio = video_dir(meta["id"]) / "audio16k.wav"
        if cached_audio.exists():
            wav = cached_audio
            if not quiet:
                eprint("  reusing cached 16 kHz audio")
        else:
            wav = youtube.download_audio(url, tmp, timeout=max(timeout, 900),
                                         cookies=cookies, proxy=proxy)
        if not quiet:
            eprint(f"  audio: {human_duration(asr.audio_duration(wav))}")
        lang = _resolve_asr_language(lang_arg, meta, asr_lang)
        requested = (lang_arg or "").lower().split(",")[0].split("-")[0]
        if requested and requested not in ("auto", "detect", "") and requested != lang and not quiet:
            eprint(f"  ! {requested} captions unavailable; transcribing spoken language ({lang})")
        if not quiet:
            eprint(f"  transcribing with {engine} (language {lang})…")
        res = asr.transcribe(wav, language=lang, engine=engine)
        if keep_audio and wav != cached_audio:
            shutil.copyfile(wav, cached_audio)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    text = segments_text(res.segments)
    return {
        "source": "asr",
        "language": res.language,
        "engine": res.engine,
        "text": text,
        "segments": segments_json(res.segments),
        "word_count": len(text.split()),
        "char_count": len(text),
        "requested_language": requested or None,
        "asr": {"model": res.model, "audio_seconds": round(res.audio_seconds, 2),
                "elapsed_seconds": round(res.elapsed_seconds, 2),
                **res.details},
    }


def _apply_filters(rec: dict, args) -> dict:
    tr = rec.get("transcript") or {}
    segments = [Cue(float(s["start"]), float(s["end"]), clean_text(s["text"]))
                for s in tr.get("segments") or []]
    if args.start is not None or args.end is not None:
        lo = args.start or 0.0
        hi = args.end if args.end is not None else float("inf")
        segments = [c for c in segments if c.end > lo and c.start < hi]
        tr["text"] = segments_text(segments)
        tr["segments"] = segments_json(segments)
        tr["word_count"] = len(tr["text"].split())
        tr["char_count"] = len(tr["text"])
    if getattr(args, "max_chars", None):
        limited, text = _limit_segments(segments, args.max_chars)
        tr["text"] = text
        tr["segments"] = segments_json(limited)
        tr["word_count"] = len(text.split())
        tr["char_count"] = len(text)
        tr["truncated"] = True
    return rec


def process_url(url: str, args) -> dict:
    t0 = time.time()
    vid = youtube.parse_video_id(url)
    if not vid:
        raise RuntimeError(f"not a YouTube video URL: {url}")
    vdir = video_dir(vid)
    cached = _load_cached(vdir, _language_arg(args), args.refresh,
                          force_asr=getattr(args, "force_asr", False),
                          no_asr=args.no_asr or args.captions_only)
    if cached and not args.no_cache:
        return _apply_filters(cached, args)

    if not args.quiet:
        eprint(f"-> {url}")
    info = youtube.get_info(url, timeout=args.timeout, cookies=args.cookies, proxy=args.proxy)
    meta = youtube.normalize_info(info)
    atomic_write_json(vdir / "meta.json", meta)

    transcript = None
    if not getattr(args, "force_asr", False):
        try:
            transcript = _caption_transcript(url, info, meta, _language_arg(args),
                                             args.timeout, args.cookies, args.proxy,
                                             args.quiet)
        except Exception as exc:  # noqa: BLE001 - captions are a best-effort path
            if not args.quiet:
                eprint(f"  ! captions failed: {exc}")
    if transcript is None:
        if args.no_asr or args.captions_only or args.engine == "none":
            raise RuntimeError("no usable captions and caption-only mode was requested")
        transcript = _asr_transcript(url, meta, _language_arg(args), args.engine,
                                     args.timeout, args.cookies, args.proxy,
                                     args.keep_audio, args.quiet, args.asr_lang)

    rec = {
        "ok": True,
        "video": meta,
        "transcript": transcript,
        "cache": {"hit": False, "dir": str(vdir)},
        "timing_ms": {"total": int((time.time() - t0) * 1000)},
    }
    rec["paths"] = _write_cache(vdir, rec, args)
    # Re-write the cache entry now that paths are known. Cache the full
    # transcript; --start/--end/--max-chars apply to this output only.
    atomic_write_json(Path(rec["paths"]["json"]), rec)
    return _apply_filters(rec, args)


def _limit_segments(cues: list[Cue], max_chars: int) -> tuple[list[Cue], str]:
    out: list[Cue] = []
    total = 0
    for c in cues:
        if total >= max_chars:
            break
        remaining = max_chars - total
        text = c.text
        if len(text) > remaining:
            cut = text[:remaining]
            pos = cut.rfind(" ")
            text = (cut[:pos] if pos > 0 else cut).rstrip() + " …"
        out.append(Cue(c.start, c.end, text))
        total += len(text) + 2
    return out, segments_text(out)


def _write_cache(vdir: Path, rec: dict, args) -> dict:
    safe_lang = (rec["transcript"].get("language") or "auto").replace("/", "-")[:20]
    src = rec["transcript"].get("source") or "unknown"
    jp = _record_path(vdir, safe_lang, src)
    atomic_write_json(jp, rec)
    tp = vdir / "transcript.txt"
    atomic_write_text(tp, rec["transcript"]["text"] + "\n")
    cues = [Cue(float(s["start"]), float(s["end"]), s["text"]) for s in rec["transcript"]["segments"]]
    atomic_write_text(vdir / "transcript.srt", segments_srt(cues) + "\n")
    return {"json": str(jp), "txt": str(tp), "srt": str(vdir / "transcript.srt")}
