"""YouTube metadata, caption tracks and audio download via yt-dlp."""

from __future__ import annotations

import json
import re
import urllib.parse
from pathlib import Path

from .util import eprint, run_cmd, which

UA = ("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36")

_FORMAT_PRIORITY = ["json3", "vtt", "srt", "ttml", "srv3", "srv2", "srv1"]


def require_ytdlp() -> str:
    exe = which("yt-dlp")
    if not exe:
        raise RuntimeError("yt-dlp not found. Install it with: pkg install yt-dlp")
    return exe


def parse_video_id(url: str) -> str | None:
    url = url.strip()
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", url):
        return url
    p = urllib.parse.urlsplit(url if "://" in url else "https://" + url)
    host = (p.hostname or "").lower()
    if host.endswith("youtu.be"):
        return p.path.strip("/").split("/")[0] or None
    if "youtube.com" in host:
        if p.path in ("/watch", "/watch/"):
            v = urllib.parse.parse_qs(p.query).get("v", [""])[0]
            return v or None
        m = re.match(r"/(?:shorts|embed|live|v)/([A-Za-z0-9_-]{11})", p.path)
        if m:
            return m.group(1)
    return None


def canonical_video_url(url: str) -> str:
    vid = parse_video_id(url)
    return f"https://www.youtube.com/watch?v={vid}" if vid else url


def _base_args() -> list[str]:
    return [require_ytdlp(), "--no-warnings", "--no-playlist"]


def get_info(url: str, timeout: int = 120, cookies: str | None = None,
             proxy: str | None = None) -> dict:
    cmd = _base_args() + ["-J", "--no-check-formats"]
    if cookies:
        cmd += ["--cookies", cookies]
    if proxy:
        cmd += ["--proxy", proxy]
    cmd.append(url)
    p = run_cmd(cmd, timeout=timeout)
    try:
        info = json.loads(p.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError("yt-dlp returned invalid metadata JSON") from exc
    if info.get("_type") == "playlist":
        entries = [e for e in (info.get("entries") or []) if e]
        if not entries:
            raise RuntimeError("playlist has no playable entries")
        return get_info(entries[0].get("url") or entries[0].get("webpage_url") or url,
                        timeout=timeout, cookies=cookies, proxy=proxy)
    if not info.get("id"):
        raise RuntimeError("could not read video metadata (private, age-gated or removed?)")
    return info


def _normalize_lang(code: str) -> str:
    code = (code or "").strip()
    low = code.lower()
    if low in ("auto", "und", ""):
        return ""
    # Keep region for exact matching, but expose the base code.
    return low.replace("_", "-")


def _lang_base(code: str) -> str:
    code = _normalize_lang(code)
    if code.startswith("zh-"):
        return code
    return code.split("-")[0]


def _langs_from_arg(language: str | None, info: dict) -> list[str]:
    if language:
        raw = [x.strip() for x in str(language).split(",") if x.strip()]
        if raw and raw[0].lower() not in ("auto", "detect"):
            return [_normalize_lang(x) for x in raw]
    original = _normalize_lang(info.get("language") or "")
    return [original] if original else []


def _choose_format(track) -> dict | None:
    if isinstance(track, list):
        formats = track
    elif isinstance(track, dict):
        formats = track.get("formats") or ([track] if track.get("url") else [])
    else:
        return None
    if not formats:
        return None
    by_ext = {}
    for f in formats:
        ext = (f.get("ext") or "").lower()
        if ext and ext not in by_ext:
            by_ext[ext] = f
    for ext in _FORMAT_PRIORITY:
        if ext in by_ext:
            return by_ext[ext]
    return formats[0]


def pick_track(info: dict, language: str | None = None) -> dict | None:
    """Choose the best caption track.

    Returns {kind, lang, name, ext, url, automatic} or None.
    Manual captions win over automatic ones. An explicit --lang selects that
    language first; otherwise the video's original language is preferred.
    """
    manual = info.get("subtitles") or {}
    auto = info.get("automatic_captions") or {}
    langs = _langs_from_arg(language, info)
    explicit = bool(language and str(language).strip().lower() not in ("auto", "detect", ""))
    original = _normalize_lang(info.get("language") or "")
    if not original:
        # The untranslated automatic track key is the source language.
        orig_keys = [k for k in auto if "-" not in str(k)]
        if orig_keys:
            original = _normalize_lang(str(orig_keys[0]))

    def candidates(tracks: dict):
        for key, track in tracks.items():
            if not track:
                continue
            fmt = _choose_format(track)
            if not fmt or not fmt.get("url"):
                continue
            yield {
                "kind": "manual",
                "lang": key,
                "base": _lang_base(key),
                "name": track[0].get("name") if isinstance(track, list) and track and isinstance(track[0], dict) else "",
                "ext": (fmt.get("ext") or "").lower(),
                "url": fmt["url"],
            }

    manual_list = list(candidates(manual))
    auto_list = []
    for c in candidates(auto):
        c["kind"] = "auto"
        auto_list.append(c)

    def rank(c: dict) -> tuple:
        lang = _normalize_lang(c["lang"])
        base = c["base"]
        name = (c.get("name") or "").lower()
        if explicit:
            if lang in langs:
                lang_score = 0
            elif base in [_lang_base(x) for x in langs] and "-" not in lang:
                lang_score = 1
            elif any(lang == f"{_lang_base(x)}-{_lang_base(original)}" for x in langs) and original:
                lang_score = 2
            elif any(lang.startswith(_lang_base(x) + "-") for x in langs):
                lang_score = 3
            else:
                lang_score = 10
        else:
            if original and lang == original:
                lang_score = 0
            elif original and base == _lang_base(original):
                lang_score = 1
            elif not original and lang in ("en", "en-us", "en-gb"):
                lang_score = 2
            else:
                lang_score = 5
        # Original (non-"from X") tracks before machine translations.
        translated = 1 if " from " in name else 0
        return (lang_score, translated, 0 if c["kind"] == "manual" else 1, lang)

    # Manual preferred over auto for the same language, but never let a random
    # manual language beat an explicit requested auto translation.
    pool = manual_list + auto_list
    if not pool:
        return None
    pool.sort(key=rank)
    best = pool[0]
    if best.get("kind") == "auto" and not explicit and original:
        # If original auto exists, it will already rank first.
        pass
    return best


def _direct_download(url: str, timeout: int) -> bytes:
    """Fetch a signed caption URL, impersonating Chrome when curl_cffi exists."""
    headers = {"Accept-Language": "en-US,en;q=0.9",
               "Referer": "https://www.youtube.com/"}
    try:
        from curl_cffi import requests as curl_requests
        r = curl_requests.get(url, impersonate="chrome", headers=headers,
                              timeout=timeout, allow_redirects=True)
        if r.status_code == 200:
            return r.content[: 8 * 1024 * 1024]
        raise RuntimeError(f"HTTP {r.status_code}")
    except ImportError:
        pass
    import urllib.request
    req = urllib.request.Request(url, headers={"User-Agent": UA, **headers})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(8 * 1024 * 1024)


def download_subtitle(track: dict, url: str, tmpdir: Path, timeout: int = 120,
                      cookies: str | None = None, proxy: str | None = None) -> Path:
    """Download one selected caption track, preferring its signed URL."""
    tmpdir.mkdir(parents=True, exist_ok=True)
    ext = track.get("ext") or "json3"
    out = tmpdir / f"caption.{ext}"

    try:
        data = _direct_download(track["url"], min(timeout, 45))
        if len(data) > 40:
            out.write_bytes(data)
            return out
    except Exception as exc:  # noqa: BLE001 - fall through to yt-dlp
        eprint(f"  ! direct caption download failed ({type(exc).__name__}); using yt-dlp")

    flag = "--write-auto-subs" if track.get("kind") == "auto" else "--write-subs"
    cmd = _base_args() + [
        "--skip-download", flag,
        "--sub-langs", track["lang"],
        "--sub-format", f"{ext}/best",
        "-o", str(tmpdir / "%(id)s.%(ext)s"),
    ]
    if cookies:
        cmd += ["--cookies", cookies]
    if proxy:
        cmd += ["--proxy", proxy]
    cmd.append(url)
    run_cmd(cmd, timeout=timeout)
    found = sorted(tmpdir.glob(f"*.{ext}")) or sorted(tmpdir.glob("*.*"))
    found = [p for p in found if p.name.startswith("caption") is False and p.suffix.lower() not in (".part", ".ytdl")]
    if not found:
        raise RuntimeError("yt-dlp did not write a subtitle file")
    return found[0]


def download_audio(url: str, tmpdir: Path, timeout: int = 3600,
                   cookies: str | None = None, proxy: str | None = None) -> Path:
    """Download best audio and convert it to 16 kHz mono PCM WAV."""
    tmpdir.mkdir(parents=True, exist_ok=True)
    cmd = _base_args() + [
        "-f", "bestaudio/best",
        "--no-part", "--retries", "3", "--fragment-retries", "5",
        "-o", str(tmpdir / "audio.%(ext)s"),
    ]
    if cookies:
        cmd += ["--cookies", cookies]
    if proxy:
        cmd += ["--proxy", proxy]
    cmd.append(url)
    eprint("  downloading audio…")
    run_cmd(cmd, timeout=timeout)
    audio = sorted(p for p in tmpdir.glob("audio.*") if p.is_file() and p.suffix != ".part")
    if not audio:
        raise RuntimeError("yt-dlp did not produce an audio file")
    src = audio[0]
    wav = tmpdir / "audio16k.wav"
    ff = which("ffmpeg")
    if not ff:
        raise RuntimeError("ffmpeg not found. Install it with: pkg install ffmpeg")
    run_cmd([ff, "-y", "-loglevel", "error", "-i", str(src), "-vn",
             "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", str(wav)],
            timeout=timeout)
    return wav


def search(query: str, limit: int = 10, timeout: int = 120,
           cookies: str | None = None, proxy: str | None = None) -> list[dict]:
    cmd = [require_ytdlp(), "--no-warnings", "--flat-playlist", "-J",
           f"ytsearch{max(1, limit)}:{query}"]
    if cookies:
        cmd += ["--cookies", cookies]
    if proxy:
        cmd += ["--proxy", proxy]
    p = run_cmd(cmd, timeout=timeout)
    data = json.loads(p.stdout)
    out = []
    for e in (data.get("entries") or []):
        if not e:
            continue
        vid = e.get("id")
        out.append({
            "id": vid,
            "title": e.get("title") or "",
            "url": e.get("url") or (f"https://www.youtube.com/watch?v={vid}" if vid else ""),
            "channel": e.get("channel") or e.get("uploader") or "",
            "duration_s": e.get("duration"),
            "view_count": e.get("view_count"),
            "description": (e.get("description") or "")[:400],
        })
    return out


def normalize_info(info: dict) -> dict:
    date = str(info.get("upload_date") or "")
    if re.fullmatch(r"\d{8}", date):
        date = f"{date[:4]}-{date[4:6]}-{date[6:]}"
    chapters = []
    for ch in info.get("chapters") or []:
        chapters.append({
            "title": ch.get("title") or "",
            "start": ch.get("start_time"),
            "end": ch.get("end_time"),
        })
    vid = info.get("id") or ""
    language = info.get("language") or ""
    if not language:
        # The untranslated automatic track key is the source language.
        keys = [k for k in (info.get("automatic_captions") or {}) if "-" not in k]
        if keys:
            language = keys[0]
    return {
        "id": vid,
        "url": f"https://www.youtube.com/watch?v={vid}" if vid else (info.get("webpage_url") or ""),
        "title": info.get("title") or "",
        "channel": info.get("channel") or info.get("uploader") or "",
        "channel_url": info.get("channel_url") or "",
        "duration_s": info.get("duration"),
        "upload_date": date,
        "description": (info.get("description") or "").strip(),
        "chapters": chapters,
        "view_count": info.get("view_count"),
        "language": language,
        "thumbnail": info.get("thumbnail") or "",
    }
