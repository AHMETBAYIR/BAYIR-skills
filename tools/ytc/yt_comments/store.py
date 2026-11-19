"""Cache layout and fetch orchestration."""

from __future__ import annotations

import json
import os
import shutil
import tempfile
import time
from pathlib import Path

from . import engine
from .util import atomic_write_json, eprint, now_iso, parse_video_id, read_json, video_dir

META_NAME = "meta.json"
COMMENTS_NAME = "comments.jsonl"
SUMMARY_NAME = "summary.json"


def paths(video_id: str) -> dict:
    d = video_dir(video_id)
    return {
        "dir": d,
        "meta": d / META_NAME,
        "comments": d / COMMENTS_NAME,
        "summary": d / SUMMARY_NAME,
    }


def is_compatible(meta: dict, opt: engine.FetchOptions) -> bool:
    if not meta:
        return False
    if (meta.get("sort") or "top") != opt.sort:
        return False
    if (meta.get("language") or "en") != (opt.language or "en"):
        return False
    if (meta.get("scope") or "all") != ("top_level" if opt.top_level_only else "all"):
        return False
    # Cache key includes the limit so the cached summary and JSONL always
    # describe the same fetch. A full cache can still be read with `summary`
    # and `top`; `fetch` with a different limit refetches explicitly.
    return meta.get("limit") == opt.limit


def iter_cached(video_id: str):
    p = paths(video_id)["comments"]
    if not p.exists():
        return
    with open(p, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    yield json.loads(line)
                except json.JSONDecodeError:
                    continue


def count_cached(video_id: str) -> int:
    p = paths(video_id)["comments"]
    if not p.exists():
        return 0
    n = 0
    with open(p, "rb") as f:
        for _ in f:
            n += 1
    return n


def fetch(url: str, opt: engine.FetchOptions, refresh: bool = False,
          quiet: bool = False, on_comment=None) -> dict:
    """Fetch comments into the cache. Returns {meta, summary, cache_hit}."""
    vid = parse_video_id(url)
    if not vid:
        raise ValueError(f"not a YouTube video URL: {url}")
    p = paths(vid)
    meta = read_json(p["meta"]) if not refresh else None

    if meta and p["comments"].exists() and is_compatible(meta, opt):
        from .summary import build_summary
        summary = build_summary(p["comments"], meta, opt)
        atomic_write_json(p["summary"], summary)
        summary["cache_hit"] = True
        summary["paths"] = {k: str(v) if isinstance(v, Path) else v for k, v in p.items()}
        return {"meta": meta, "summary": summary, "cache_hit": True}

    vinfo = engine.video_meta(url)
    if not vinfo.get("title"):
        vinfo["title"] = vid
    tmp = p["dir"] / f".{COMMENTS_NAME}.tmp-{os.getpid()}"
    started = time.time()
    n = 0
    try:
        with open(tmp, "w", encoding="utf-8") as f:
            for comment in engine.iter_comments(url, opt):
                f.write(json.dumps(comment, ensure_ascii=False) + "\n")
                n += 1
                if on_comment is not None:
                    on_comment(comment)
                if not quiet and n % 100 == 0:
                    eprint(f"  fetched {n} comments…")
        if n == 0:
            raise engine.NoCommentsError("no comments were returned")
        os.replace(tmp, p["comments"])
    except Exception:
        try:
            tmp.unlink()
        except OSError:
            pass
        raise

    meta = {
        "video": vinfo,
        "video_id": vid,
        "url": vinfo.get("url") or f"https://www.youtube.com/watch?v={vid}",
        "fetched_at": now_iso(),
        "elapsed_seconds": round(time.time() - started, 2),
        "count": n,
        "sort": opt.sort,
        "limit": opt.limit,
        "language": opt.language,
        "scope": "top_level" if opt.top_level_only else "all",
        "source": f"youtube-comment-downloader/{engine.engine_version()}",
        "tool": "ytc/0.1.0",
    }
    atomic_write_json(p["meta"], meta)
    from .summary import build_summary
    summary = build_summary(p["comments"], meta, opt)
    atomic_write_json(p["summary"], summary)
    summary["cache_hit"] = False
    summary["paths"] = {k: str(v) if isinstance(v, Path) else v for k, v in p.items()}
    if not quiet:
        eprint(f"  done: {n} comments in {time.time() - started:.1f}s")
    return {"meta": meta, "summary": summary, "cache_hit": False}


def load_summary(video_id: str) -> dict | None:
    p = paths(video_id)
    s = read_json(p["summary"])
    if s is not None:
        s["paths"] = {k: str(v) if isinstance(v, Path) else v for k, v in p.items()}
    return s


def ensure_summary(video_id: str, opt: engine.FetchOptions) -> dict:
    from dataclasses import replace
    p = paths(video_id)
    meta = read_json(p["meta"])
    if not meta or not p["comments"].exists():
        raise FileNotFoundError(f"no cache for {video_id}; run `ytc fetch` first")
    from .summary import build_summary
    opt = replace(
        opt,
        limit=meta.get("limit"),
        sort=meta.get("sort") or opt.sort,
        language=meta.get("language") or opt.language,
        top_level_only=(meta.get("scope") == "top_level"),
    )
    s = build_summary(p["comments"], meta, opt)
    atomic_write_json(p["summary"], s)
    s["paths"] = {k: str(v) if isinstance(v, Path) else v for k, v in p.items()}
    return s


def clear(video_id: str | None = None) -> int:
    from .util import cache_root
    if video_id:
        shutil.rmtree(video_dir(video_id), ignore_errors=True)
        return 1
    root = cache_root()
    n = 0
    for d in root.iterdir():
        if d.is_dir():
            shutil.rmtree(d, ignore_errors=True)
            n += 1
    return n
