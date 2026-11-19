"""CLI commands for yt-transcript (appended to cli.py)."""

from __future__ import annotations

import argparse
import json
import shutil
import sys
import time
from pathlib import Path

from . import asr, youtube
from .cli import process_url, cache_root, VERSION
from .render import output_paths, render
from .util import eprint, human_duration


def _emit_records(records: list[dict], args, fmt: str) -> int:
    if fmt == "json":
        payload = records[0] if len(records) == 1 else {"ok": all(r.get("ok") for r in records),
                                                        "results": records}
        text = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    else:
        text = "\n\n---\n\n".join(render(r, fmt, args.timestamps, None) for r in records if r.get("ok"))

    out = args.out
    if not out:
        sys.stdout.write(text)
    elif out == "-":
        sys.stdout.write(text)
    else:
        p = Path(out).expanduser()
        if len(records) > 1:
            p.mkdir(parents=True, exist_ok=True)
            for r in records:
                if not r.get("ok"):
                    continue
                v = r.get("video") or {}
                name = f"{v.get('id') or 'video'}.{ 'json' if fmt == 'json' else fmt }"
                q = p / name
                q.write_text(render(r, fmt, args.timestamps, None), encoding="utf-8")
                print(q)
        else:
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(text, encoding="utf-8")
            print(p)
    return 0 if all(r.get("ok") for r in records) else 1


def cmd_fetch(args) -> int:
    fmt = args.format or ("text" if args.command == "get" else "md")
    records: list[dict] = []
    for url in args.urls:
        try:
            rec = process_url(url, args)
            if args.save_dir:
                rec["paths"].update(output_paths(rec, args.save_dir))
            records.append(rec)
        except KeyboardInterrupt:
            raise
        except Exception as exc:  # noqa: BLE001 - report per URL and continue
            eprint(f"  ! {url}: {exc}")
            records.append({"ok": False, "url": url, "error": str(exc)})
    return _emit_records(records, args, fmt)


def cmd_info(args) -> int:
    try:
        info = youtube.get_info(args.url, timeout=args.timeout, cookies=args.cookies,
                                proxy=args.proxy)
    except Exception as exc:  # noqa: BLE001
        if args.json:
            print(json.dumps({"ok": False, "error": str(exc)}, indent=2))
        else:
            eprint(f"! {exc}")
        return 1
    meta = youtube.normalize_info(info)
    manual = sorted((k for k, v in (info.get("subtitles") or {}).items() if v))
    auto = sorted((k for k, v in (info.get("automatic_captions") or {}).items() if v))
    chosen = youtube.pick_track(info, args.lang)
    if args.json:
        print(json.dumps({**meta, "manual_captions": manual, "auto_captions": auto,
                          "chosen_track": chosen}, ensure_ascii=False, indent=2))
        return 0
    print(f"{meta['title']}")
    print(f"{meta['url']}")
    print(f"{meta['channel']} | {meta['upload_date'] or '?'} | "
          f"{human_duration(meta['duration_s'])} | language={meta['language'] or '?'}")
    print(f"manual captions: {', '.join(manual) if manual else 'none'}")
    print(f"auto captions:   {len(auto)} tracks"
          + (f" ({', '.join(auto[:12])}{' …' if len(auto) > 12 else ''})" if auto else ""))
    if chosen:
        print(f"chosen:          {chosen['kind']} {chosen['lang']} ({chosen['ext']})")
    return 0


def cmd_search(args) -> int:
    try:
        rows = youtube.search(args.query, limit=args.limit, timeout=args.timeout,
                              cookies=args.cookies, proxy=args.proxy)
    except Exception as exc:  # noqa: BLE001
        if args.json:
            print(json.dumps({"ok": False, "error": str(exc)}, indent=2))
        else:
            eprint(f"! {exc}")
        return 1
    if args.json:
        print(json.dumps(rows, ensure_ascii=False, indent=2))
        return 0
    for i, r in enumerate(rows, 1):
        dur = human_duration(r.get("duration_s")) if r.get("duration_s") else "?"
        print(f"{i:>2}. {r['title']}  [{dur}]")
        print(f"    {r['url']}")
        print(f"    {r.get('channel') or ''}")
    return 0


def cmd_doctor(args) -> int:
    checks = []

    def add(name: str, ok: bool, detail: str = ""):
        checks.append({"name": name, "ok": ok, "detail": detail})

    ytdlp = shutil.which("yt-dlp")
    add("yt-dlp", bool(ytdlp), ytdlp or "pipx install yt-dlp (or brew/apt/pkg)")
    ff = shutil.which("ffmpeg")
    add("ffmpeg", bool(ff), ff or "apt/brew/pkg install ffmpeg")
    fp = shutil.which("ffprobe")
    add("ffprobe", bool(fp), fp or "apt/brew/pkg install ffmpeg")
    for mod in ("numpy", "soundfile", "scipy", "tiktoken", "curl_cffi"):
        try:
            m = __import__(mod)
            add(mod, True, getattr(m, "__version__", ""))
        except Exception as exc:  # noqa: BLE001
            add(mod, False, type(exc).__name__)

    missing_qnn = asr.qnn_missing()
    add("whisper-qnn", not missing_qnn, "; ".join(missing_qnn) if missing_qnn else "ready")
    if not missing_qnn:
        p = asr.qnn_paths()
        add("whisper-model", True, str(p["model"]))
        add("htp-runtime", True, str(p["qnn"]))
    missing_w = asr.whispercpp_missing()
    add("whisper.cpp", not missing_w, "; ".join(missing_w) if missing_w else str(asr.whispercpp_paths()["model"]))
    try:
        c = cache_root()
        test = c / ".write-test"
        test.write_text("ok")
        test.unlink()
        add("cache", True, str(c))
    except Exception as exc:  # noqa: BLE001
        add("cache", False, str(exc))

    if args.probe:
        try:
            t = time.time()
            info = youtube.get_info("https://www.youtube.com/watch?v=jNQXAC9IVRw",
                                    timeout=args.timeout)
            add("youtube", True, f"{info.get('title')} ({int((time.time()-t)*1000)} ms)")
        except Exception as exc:  # noqa: BLE001
            add("youtube", False, str(exc))

    if args.json:
        print(json.dumps({"ok": all(c["ok"] for c in checks), "checks": checks},
                         ensure_ascii=False, indent=2))
    else:
        for c in checks:
            print(f"  {'OK  ' if c['ok'] else 'FAIL'} {c['name']:<14} {c['detail']}")
    essential = {"yt-dlp", "ffmpeg", "numpy", "soundfile", "scipy", "tiktoken"}
    return 0 if all(c["ok"] for c in checks if c["name"] in essential) else 1


def cmd_cache(args) -> int:
    root = cache_root()
    if args.action == "path":
        print(root)
        return 0
    if args.action == "clear":
        n = 0
        for p in root.iterdir():
            if p.is_dir():
                shutil.rmtree(p, ignore_errors=True)
                n += 1
        print(f"cleared {n} video cache folder(s) in {root}")
        return 0
    rows = []
    total = 0
    for d in sorted(root.iterdir()):
        if not d.is_dir():
            continue
        size = sum(p.stat().st_size for p in d.rglob("*") if p.is_file())
        total += size
        meta = {}
        try:
            meta = json.loads((d / "meta.json").read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            pass
        rows.append({"id": d.name, "title": meta.get("title", ""),
                     "size_mb": round(size / 1e6, 2),
                     "transcripts": [p.name for p in d.glob("transcript.*.json")]})
    if args.json:
        print(json.dumps({"cache": str(root), "total_mb": round(total / 1e6, 2), "items": rows},
                         ensure_ascii=False, indent=2))
    else:
        print(f"cache: {root}  ({total / 1e6:.1f} MB)")
        for r in rows:
            print(f"  {r['id']}  {r['size_mb']:>7.2f} MB  {r['title'][:60]}")
            for t in r["transcripts"]:
                print(f"      {t}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="ytt", description="Fetch YouTube transcripts for agents, with local ASR fallback.")
    p.add_argument("--version", action="version", version=f"ytt {VERSION}")
    sub = p.add_subparsers(dest="command", required=True)

    def common(sp):
        sp.add_argument("--lang", "-l", default="auto",
                        help="caption/ASR language (comma list, or auto)")
        sp.add_argument("--timeout", type=int, default=180, help="network timeout per step (s)")
        sp.add_argument("--cookies", help="cookies.txt for age-gated/private videos")
        sp.add_argument("--proxy", help="proxy URL for yt-dlp")
        sp.add_argument("--quiet", "-q", action="store_true")

    for name in ("fetch", "get"):
        sp = sub.add_parser(name, help="fetch a transcript" if name == "fetch" else "print a transcript")
        sp.add_argument("urls", nargs="+", help="YouTube URL or 11-character video id")
        sp.add_argument("--format", "-f", default=("text" if name == "get" else "md"),
                        choices=["md", "text", "json", "srt", "vtt"])
        sp.add_argument("--json", action="store_const", const="json", dest="format",
                        help="shorthand for --format json")
        sp.add_argument("--timestamps", "-t", action="store_true",
                        help="prefix text/markdown segments with [HH:MM:SS]")
        sp.add_argument("--out", "-o", help="write output to a file (or - for stdout)")
        sp.add_argument("--save-dir", help="write <id>-<title>.json/.txt/.srt here")
        sp.add_argument("--refresh", action="store_true", help="ignore cached transcript")
        sp.add_argument("--no-cache", action="store_true", help="do not use cache (but still write it)")
        sp.add_argument("--no-asr", action="store_true", help="captions only; fail if none")
        sp.add_argument("--captions-only", action="store_true", help="alias for --no-asr")
        sp.add_argument("--force-asr", action="store_true", help="ignore captions and transcribe audio")
        sp.add_argument("--asr-lang", help="spoken language for ASR (default: video metadata)")
        sp.add_argument("--engine", default="auto",
                        choices=["auto", "qnn", "htp", "whispercpp", "cpu", "none"],
                        help="ASR engine when captions are missing")
        sp.add_argument("--keep-audio", action="store_true", help="keep 16 kHz audio in cache")
        sp.add_argument("--max-chars", type=int, help="truncate transcript at a word boundary")
        sp.add_argument("--start", type=float, help="keep segments after this many seconds")
        sp.add_argument("--end", type=float, help="keep segments before this many seconds")
        common(sp)
        sp.set_defaults(fn=cmd_fetch)

    sp = sub.add_parser("info", help="show video metadata and available caption tracks")
    sp.add_argument("url")
    sp.add_argument("--json", action="store_true")
    sp.add_argument("--lang", "-l", default="auto")
    sp.add_argument("--timeout", type=int, default=120)
    sp.add_argument("--cookies")
    sp.add_argument("--proxy")
    sp.set_defaults(fn=cmd_info)

    sp = sub.add_parser("search", help="search YouTube (titles + URLs)")
    sp.add_argument("query")
    sp.add_argument("-n", "--limit", type=int, default=10)
    sp.add_argument("--json", action="store_true")
    sp.add_argument("--timeout", type=int, default=120)
    sp.add_argument("--cookies")
    sp.add_argument("--proxy")
    sp.set_defaults(fn=cmd_search)

    sp = sub.add_parser("doctor", help="check dependencies and local ASR backends")
    sp.add_argument("--json", action="store_true")
    sp.add_argument("--probe", action="store_true", help="also test a live YouTube metadata call")
    sp.add_argument("--timeout", type=int, default=60)
    sp.set_defaults(fn=cmd_doctor)

    sp = sub.add_parser("cache", help="inspect or clear the transcript cache")
    sp.add_argument("action", choices=["list", "clear", "path"], nargs="?", default="list")
    sp.add_argument("--json", action="store_true")
    sp.set_defaults(fn=cmd_cache)
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        return args.fn(args)
    except KeyboardInterrupt:
        eprint("\ninterrupted")
        return 130
    except Exception as exc:  # noqa: BLE001
        eprint(f"! {exc}")
        return 1
