"""ytc - agent-friendly YouTube comments CLI."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from . import engine, render, store
from .engine import FetchOptions, NoCommentsError
from .util import (VERSION, atomic_write_text, cache_root, canonical_url,
                   eprint, fmt_date_ts, human_int, parse_video_id, read_json,
                   video_dir)


def _opts(args) -> FetchOptions:
    limit = None if getattr(args, "all", False) else getattr(args, "limit", 1000)
    if limit is not None and int(limit) <= 0:
        raise ValueError("--limit must be > 0; use --all for no limit")
    return FetchOptions(
        sort=getattr(args, "sort", "top"),
        limit=limit,
        language=getattr(args, "language", "en"),
        top_level_only=getattr(args, "top_level_only", False),
        top_n=getattr(args, "top", 10),
        replies_per_thread=getattr(args, "replies_per_thread", 3),
        max_comment_chars=getattr(args, "max_comment_chars", 600),
    )


def _jsonl_line(c: dict) -> str:
    return json.dumps(c, ensure_ascii=False) + "\n"


def _stream_cached(video_id: str, write) -> int:
    n = 0
    for c in store.iter_cached(video_id):
        write(_jsonl_line(c))
        n += 1
    return n


def cmd_fetch(args) -> int:
    opt = _opts(args)
    fmt = args.format
    quiet = args.quiet
    if args.all and not quiet:
        eprint("  warning: --all can take a long time on popular videos")
    out = args.out
    if fmt == "jsonl":
        sink = None
        if out and out != "-":
            sink = open(os.path.expanduser(out), "w", encoding="utf-8")
            write = sink.write
        else:
            write = sys.stdout.write
        streamed = {"n": 0}

        def on_comment(c):
            write(_jsonl_line(c))
            streamed["n"] += 1
            if not sink:
                sys.stdout.flush()

        try:
            res = store.fetch(args.url, opt, refresh=args.refresh, quiet=quiet,
                              on_comment=on_comment)
            if res["cache_hit"] and streamed["n"] == 0:
                n = _stream_cached(res["meta"]["video_id"], write)
                if not sink:
                    sys.stdout.flush()
                streamed["n"] = n
        finally:
            if sink:
                sink.close()
        if sink:
            summary = res["summary"]
            print(json.dumps({
                "ok": True,
                "video": summary.get("video"),
                "comments": summary.get("comments"),
                "paths": summary.get("paths"),
                "streamed": streamed["n"],
            }, ensure_ascii=False, indent=2))
        else:
            c = res["summary"].get("comments") or {}
            if not quiet:
                eprint(f"streamed {streamed['n']} comments; complete={c.get('complete')}; "
                       f"{c.get('note') or ''}".rstrip())
        return 0

    res = store.fetch(args.url, opt, refresh=args.refresh, quiet=quiet)
    s = res["summary"]
    text = (json.dumps(s, ensure_ascii=False, indent=2) + "\n" if fmt == "json"
            else render.render_summary_md(s))
    if out and out != "-":
        p = Path(os.path.expanduser(out))
        atomic_write_text(p, text)
        print(p)
    else:
        sys.stdout.write(text)
    return 0


def cmd_summary(args) -> int:
    opt = _opts(args)
    vid = parse_video_id(args.url)
    if not vid:
        raise ValueError(f"not a YouTube video URL: {args.url}")
    if args.refresh or not store.paths(vid)["comments"].exists():
        res = store.fetch(args.url, opt, refresh=args.refresh, quiet=args.quiet)
        s = res["summary"]
    else:
        s = store.ensure_summary(vid, opt)
    text = (json.dumps(s, ensure_ascii=False, indent=2) + "\n" if args.format == "json"
            else render.render_summary_md(s))
    if args.out and args.out != "-":
        p = Path(os.path.expanduser(args.out))
        atomic_write_text(p, text)
        print(p)
    else:
        sys.stdout.write(text)
    return 0


def cmd_top(args) -> int:
    opt = _opts(args)
    vid = parse_video_id(args.url)
    if not vid:
        raise ValueError(f"not a YouTube video URL: {args.url}")
    if args.fetch or args.refresh or not store.paths(vid)["comments"].exists():
        store.fetch(args.url, opt, refresh=args.refresh, quiet=args.quiet)
    s = store.ensure_summary(vid, opt)
    if args.json:
        print(json.dumps(s.get("top_comments") or [], ensure_ascii=False, indent=2))
    else:
        sys.stdout.write(render.render_top_text(s, args.n))
    return 0


def _resolve_video_or_path(ref: str) -> str:
    vid = parse_video_id(ref)
    if vid:
        return vid
    p = Path(os.path.expanduser(ref))
    if p.is_file() and p.suffix == ".jsonl":
        # allow a raw file: cache it under a synthetic id
        return ""
    raise ValueError(f"not a YouTube URL or cached id: {ref}")


def _iter_for_grep(ref: str):
    vid = parse_video_id(ref)
    if vid:
        return store.iter_cached(vid)
    p = Path(os.path.expanduser(ref))
    if p.is_file():
        def gen():
            with open(p, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        yield json.loads(line)
        return gen()
    raise FileNotFoundError(f"no such cache/comment file: {ref}")


def cmd_grep(args) -> int:
    opt = _opts(args)
    vid = parse_video_id(args.ref)
    if vid and (args.fetch or args.refresh) and (
            args.refresh or not store.paths(vid)["comments"].exists()):
        fopt = FetchOptions(sort="top", limit=1000, language="en")
        store.fetch(args.ref, fopt, refresh=args.refresh, quiet=args.quiet)
    if vid and not store.paths(vid)["comments"].exists():
        raise FileNotFoundError(f"no cache for {vid}; run `ytc fetch {args.ref}` first")
    since = datetime.fromisoformat(args.since).replace(tzinfo=timezone.utc).timestamp() if args.since else None
    until = (datetime.fromisoformat(args.until).replace(tzinfo=timezone.utc).timestamp()
             + 86400) if args.until else None
    text_q = (args.text or "").casefold()
    auth_q = (args.author or "").casefold()
    out = sys.stdout
    sink = None
    if args.out and args.out != "-":
        sink = open(os.path.expanduser(args.out), "w", encoding="utf-8")
        out = sink
    n = 0
    try:
        for c in _iter_for_grep(args.ref):
            if args.top_level and c.get("is_reply"):
                continue
            if args.replies and not c.get("is_reply"):
                continue
            if text_q and text_q not in (c.get("text") or "").casefold():
                continue
            if auth_q and auth_q not in (c.get("author") or "").casefold():
                continue
            if args.min_likes is not None and int(c.get("like_count") or 0) < args.min_likes:
                continue
            ts = c.get("published_at_approx")
            if since is not None and (not ts or ts < since):
                continue
            if until is not None and (not ts or ts >= until):
                continue
            if args.format == "text":
                out.write(f"{c.get('author') or '?'} | {c.get('like_count')} likes | "
                          f"{c.get('published_text') or '?'}\n{c.get('text') or ''}\n\n")
            elif args.format == "md":
                out.write(render.render_comment_md(c) + "\n")
            else:
                out.write(_jsonl_line(c))
            n += 1
            if args.limit and n >= args.limit:
                break
    finally:
        if sink:
            sink.close()
    if sink:
        print(f"{n} comments -> {sink.name}")
    elif args.format == "jsonl" and not args.quiet:
        eprint(f"{n} comments")
    return 0


def cmd_info(args) -> int:
    vid = parse_video_id(args.url)
    if not vid:
        raise ValueError(f"not a YouTube video URL: {args.url}")
    meta = engine.video_meta(args.url)
    p = store.paths(vid)
    cached = p["comments"].exists()
    info = {
        "ok": True,
        "video": meta,
        "cache": {
            "present": cached,
            "comments": str(p["comments"]) if cached else None,
            "summary": str(p["summary"]) if p["summary"].exists() else None,
            "count": store.count_cached(vid) if cached else 0,
        },
    }
    if args.json:
        print(json.dumps(info, ensure_ascii=False, indent=2))
    else:
        print(meta.get("title") or vid)
        print(meta.get("url") or canonical_url(vid))
        print(meta.get("channel") or "")
        print(f"cached: {'yes' if cached else 'no'} ({info['cache']['count']} comments)")
    return 0


def cmd_doctor(args) -> int:
    checks = []

    def add(name, ok, detail=""):
        checks.append({"name": name, "ok": bool(ok), "detail": detail})

    try:
        import youtube_comment_downloader as ycd  # noqa: F401
        v = engine.engine_version()
        add("youtube-comment-downloader", v == "0.1.84", v)
    except Exception as exc:  # noqa: BLE001
        add("youtube-comment-downloader", False, type(exc).__name__)
    try:
        import requests
        add("requests", True, requests.__version__)
    except Exception as exc:  # noqa: BLE001
        add("requests", False, type(exc).__name__)
    try:
        import curl_cffi
        add("curl_cffi", True, curl_cffi.__version__)
    except Exception as exc:  # noqa: BLE001
        add("curl_cffi", False, type(exc).__name__)
    add("python", True, sys.executable)
    try:
        root = cache_root()
        t = root / ".write-test"
        t.write_text("ok")
        t.unlink()
        add("cache", True, str(root))
    except Exception as exc:  # noqa: BLE001
        add("cache", False, str(exc))
    if args.probe:
        try:
            t0 = time.time()
            m = engine.video_meta("https://www.youtube.com/watch?v=jNQXAC9IVRw", timeout=args.timeout)
            add("youtube-oembed", bool(m.get("title")),
                f"{m.get('title')} ({int((time.time() - t0) * 1000)} ms)")
        except Exception as exc:  # noqa: BLE001
            add("youtube-oembed", False, str(exc))
    if shutil.which("yt-dlp"):
        add("yt-dlp", True, shutil.which("yt-dlp"))
    if args.json:
        print(json.dumps({"ok": all(c["ok"] for c in checks), "checks": checks},
                         ensure_ascii=False, indent=2))
    else:
        for c in checks:
            print(f"  {'OK  ' if c['ok'] else 'FAIL'} {c['name']:<28} {c['detail']}")
    return 0 if all(c["ok"] for c in checks) else 1


def cmd_cache(args) -> int:
    root = cache_root()
    if args.action == "path":
        print(root)
        return 0
    if args.action == "clear":
        n = 0
        for d in root.iterdir():
            if d.is_dir():
                shutil.rmtree(d, ignore_errors=True)
                n += 1
        print(f"cleared {n} cached video(s) in {root}")
        return 0
    rows = []
    total = 0
    for d in sorted(root.iterdir()):
        if not d.is_dir():
            continue
        size = sum(p.stat().st_size for p in d.rglob("*") if p.is_file())
        total += size
        meta = read_json(d / "meta.json") or {}
        rows.append({"id": d.name, "title": (meta.get("video") or {}).get("title", ""),
                     "comments": meta.get("count", 0), "size_mb": round(size / 1e6, 2)})
    if args.json:
        print(json.dumps({"cache": str(root), "total_mb": round(total / 1e6, 2), "items": rows},
                         ensure_ascii=False, indent=2))
    else:
        print(f"cache: {root} ({total / 1e6:.1f} MB)")
        for r in rows:
            print(f"  {r['id']}  {r['comments']:>7} comments  {r['size_mb']:>7.2f} MB  {r['title'][:60]}")
    return 0


def _add_fetch_opts(sp):
    sp.add_argument("--sort", choices=["top", "new"], default="top")
    g = sp.add_mutually_exclusive_group()
    g.add_argument("--limit", type=int, default=1000, help="total comment limit (default 1000)")
    g.add_argument("--all", action="store_true", help="no limit; may be very large")
    sp.add_argument("--top-level-only", action="store_true", help="skip replies")
    sp.add_argument("--language", default="en", help="YouTube generated-text language (default en)")
    sp.add_argument("--top", type=int, default=10, help="top comments in the summary")
    sp.add_argument("--replies-per-thread", type=int, default=3)
    sp.add_argument("--max-comment-chars", type=int, default=600,
                    help="truncate comment text in the summary (JSONL keeps full text)")
    sp.add_argument("--refresh", action="store_true", help="ignore the cache and refetch")
    sp.add_argument("--quiet", "-q", action="store_true")


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="ytc", description="Fetch and analyze YouTube comments for agents.")
    p.add_argument("--version", action="version", version=f"ytc {VERSION}")
    sub = p.add_subparsers(dest="command", required=True)

    sp = sub.add_parser("fetch", help="fetch comments, cache them, print a summary")
    sp.add_argument("url")
    sp.add_argument("--format", "-f", choices=["json", "md", "jsonl"], default="json")
    sp.add_argument("--out", "-o", help="write output; use - for stdout")
    _add_fetch_opts(sp)
    sp.set_defaults(fn=cmd_fetch)

    sp = sub.add_parser("summary", help="print the cached summary (or fetch it)")
    sp.add_argument("url")
    sp.add_argument("--format", choices=["json", "md"], default="json")
    sp.add_argument("--out", "-o")
    _add_fetch_opts(sp)
    sp.set_defaults(fn=cmd_summary)

    sp = sub.add_parser("top", help="print the top comments as text")
    sp.add_argument("url")
    sp.add_argument("-n", type=int, default=10)
    sp.add_argument("--json", action="store_true")
    sp.add_argument("--fetch", action="store_true", help="fetch if not cached")
    sp.add_argument("--refresh", action="store_true")
    sp.add_argument("--quiet", "-q", action="store_true")
    sp.set_defaults(fn=cmd_top)

    sp = sub.add_parser("grep", help="filter cached comments")
    sp.add_argument("ref", help="YouTube URL/id or a normalized .jsonl file")
    sp.add_argument("--text", help="case-insensitive substring")
    sp.add_argument("--author", help="author substring")
    sp.add_argument("--min-likes", type=int)
    sp.add_argument("--since", help="YYYY-MM-DD (approximate; see docs)")
    sp.add_argument("--until", help="YYYY-MM-DD (inclusive; approximate)")
    sp.add_argument("--top-level", action="store_true")
    sp.add_argument("--replies", action="store_true")
    sp.add_argument("--limit", type=int, default=0, help="max output rows (0 = unlimited)")
    sp.add_argument("--format", choices=["jsonl", "text", "md"], default="jsonl")
    sp.add_argument("--out", "-o")
    sp.add_argument("--fetch", action="store_true", help="fetch if not cached")
    sp.add_argument("--refresh", action="store_true")
    sp.add_argument("--quiet", "-q", action="store_true")
    sp.set_defaults(fn=cmd_grep)

    sp = sub.add_parser("info", help="video metadata and cache status")
    sp.add_argument("url")
    sp.add_argument("--json", action="store_true")
    sp.set_defaults(fn=cmd_info)

    sp = sub.add_parser("doctor", help="check the parser, requests, cache and oEmbed")
    sp.add_argument("--json", action="store_true")
    sp.add_argument("--probe", action="store_true")
    sp.add_argument("--timeout", type=int, default=25)
    sp.set_defaults(fn=cmd_doctor)

    sp = sub.add_parser("cache", help="inspect or clear the comment cache")
    sp.add_argument("action", nargs="?", choices=["list", "clear", "path"], default="list")
    sp.add_argument("--json", action="store_true")
    sp.set_defaults(fn=cmd_cache)
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        return args.fn(args)
    except BrokenPipeError:
        try:
            sys.stdout.close()
        except Exception:  # noqa: BLE001
            pass
        return 0
    except KeyboardInterrupt:
        eprint("\ninterrupted")
        return 130
    except (NoCommentsError, ValueError, FileNotFoundError) as exc:
        eprint(f"! {exc}")
        return 1
    except Exception as exc:  # noqa: BLE001
        eprint(f"! {type(exc).__name__}: {exc}")
        return 1
