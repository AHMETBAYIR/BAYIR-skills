"""Shared helpers for yt-comments."""

from __future__ import annotations

import json
import os
import re
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path

VERSION = "0.1.0"


def eprint(*args, **kwargs) -> None:
    print(*args, file=sys.stderr, **kwargs)


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def iso_from_ts(ts: float | int | None) -> str | None:
    if not ts:
        return None
    try:
        return datetime.fromtimestamp(float(ts), tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    except (OverflowError, OSError, ValueError):
        return None


def atomic_write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), prefix=".tmp-", suffix=path.suffix)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(text)
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def atomic_write_json(path: Path, data) -> None:
    atomic_write_text(path, json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def read_json(path: Path, default=None):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return default


def safe_int(value, default: int = 0) -> int:
    if isinstance(value, (int, float)):
        return int(value)
    text = str(value or "").strip().replace(",", "")
    m = re.match(r"(-?\d+(?:\.\d+)?)\s*([KkMmBb]?)", text)
    if not m:
        return default
    try:
        n = float(m.group(1))
    except ValueError:
        return default
    mult = {"": 1, "k": 1_000, "m": 1_000_000, "b": 1_000_000_000}[m.group(2).lower()]
    return int(n * mult)


def fmt_ts(seconds: float | int | None) -> str:
    seconds = max(0, int(float(seconds or 0)))
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def fmt_date_ts(ts: float | int | None) -> str:
    if not ts:
        return "?"
    try:
        return datetime.fromtimestamp(float(ts), tz=timezone.utc).strftime("%Y-%m-%d")
    except (OverflowError, OSError, ValueError):
        return "?"


def short(text: str, limit: int = 120) -> str:
    text = re.sub(r"\s+", " ", text or "").strip()
    return text if len(text) <= limit else text[: max(0, limit - 1)].rstrip() + "…"


def parse_video_id(url: str) -> str | None:
    url = (url or "").strip()
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", url):
        return url
    p = url.split("://", 1)[-1]
    host = p.split("/", 1)[0].lower()
    rest = p[len(host):]
    if host.endswith("youtu.be"):
        return rest.strip("/").split("/")[0] or None
    if "youtube.com" in host:
        if rest.startswith("/watch"):
            m = re.search(r"[?&]v=([A-Za-z0-9_-]{11})", rest)
            return m.group(1) if m else None
        m = re.match(r"/(?:shorts|embed|live|v)/([A-Za-z0-9_-]{11})", rest)
        if m:
            return m.group(1)
    return None


def canonical_url(video_id: str) -> str:
    return f"https://www.youtube.com/watch?v={video_id}"


def cache_root() -> Path:
    p = Path(os.path.expanduser(os.environ.get("YTC_CACHE", "~/.cache/yt-comments")))
    p.mkdir(parents=True, exist_ok=True)
    return p


def video_dir(video_id: str) -> Path:
    d = cache_root() / video_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def human_int(n: int | float | None) -> str:
    try:
        n = int(n or 0)
    except (TypeError, ValueError):
        return "0"
    if abs(n) >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if abs(n) >= 1_000:
        return f"{n / 1_000:.1f}K"
    return str(n)


def sleep_ms(ms: int) -> None:
    if ms > 0:
        time.sleep(ms / 1000.0)
