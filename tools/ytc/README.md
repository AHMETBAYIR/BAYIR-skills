# yt-comments (`ytc`)

Agent-friendly YouTube comments, built on the small MIT-licensed
`youtube-comment-downloader` library.

Why this exists:

- comments are a different dataset from transcripts; they need author/thread
  structure, completeness accounting and safe defaults;
- `yt-dlp` is excellent but writes comments into a large `info.json`, runs a
  JavaScript challenge, and can miss replies;
- `youtube-comment-downloader` streams JSONL and has an exact total `--limit`.

`ytc` adds:

- normalized JSONL (`parent_id`, `root_id`, `depth`, likes, reply counts,
  approximate timestamps, heart/paid flags);
- a **completeness receipt** (declared vs fetched replies, limit reached);
- top comments/threads and top authors;
- cache, summaries, filters and agent-readable output.

## Install

```bash
./install.sh
ytc doctor --probe
```

Works on Linux, macOS and Android/Termux. The installer creates an isolated
virtualenv (default `${XDG_DATA_HOME:-~/.local/share}/ytc/venv`, override with
`YTC_VENV`) so nothing is installed into the system Python, then links `ytc`
into `~/.local/bin` (or `$PREFIX/bin` on Termux; override with `YTC_BIN_DIR`).
The venv installs the pinned comment parser plus `curl-cffi` (Chrome TLS
fingerprint for the oEmbed metadata call; `requests` remains the fallback).

No virtualenv wanted? `pip install -r requirements.txt` and run
`./bin/ytc` — the launcher finds any interpreter that can import the parser.

## Commands

```bash
ytc info 'https://youtu.be/ID'
ytc fetch 'https://youtu.be/ID' --top 20 --replies-per-thread 3
ytc fetch 'https://youtu.be/ID' --format jsonl --out comments.jsonl
ytc summary 'https://youtu.be/ID' --format md
ytc top 'https://youtu.be/ID' -n 10
ytc grep 'https://youtu.be/ID' --text battery --min-likes 10
ytc cache list
ytc cache clear
```

Safe defaults:

- `--limit 1000`; use `--all` only when you mean it.
- `--sort top` by default; `--sort new` for chronology.
- `--top-level-only` to skip replies.
- `--refresh` to ignore the cache.

## Output contract

`ytc fetch --format json`:

```json
{
  "ok": true,
  "video": {"id": "...", "title": "...", "channel": "..."},
  "comments": {
    "total": 150,
    "top_level": 70,
    "replies": 80,
    "declared_replies": 83,
    "missing_replies": 3,
    "complete": false,
    "limit_reached": false,
    "scope": "all",
    "sort": "top",
    "note": "YouTube did not serve 3 declared replies..."
  },
  "stats": {"total_likes": 1234, "unique_authors": 88, "...": "..."},
  "top_authors": [{"author": "@x", "comments": 4, "likes": 120}],
  "top_comments": [{"id": "...", "author": "@x", "text": "...", "like_count": 42,
                    "replies": [{"author": "@y", "text": "..."}]}],
  "paths": {"comments": "...", "summary": "...", "meta": "..."}
}
```

`--format jsonl` emits one normalized comment per line and keeps full text.
The cache stores the same JSONL under `~/.cache/yt-comments/<video_id>/`.

## Measured here

- `JciVReJs8hc` (8.5 min): 148 comments (70 top-level + 78 replies) in ~9.5 s;
  83 declared replies, 5 not served, `complete=false`.
- `mDYRaCq1LVw` (1:45): 1197 comments (704 + 493) in ~47 s; 544 declared
  replies, 51 not served, `complete=false`.
- `--limit 1000` on the same video: exactly 1000 comments, `missing_reason=limit`.

## Completeness

No keyless YouTube comment extractor can guarantee every comment: comments can
be deleted, held, hidden by Restricted Mode, or not served. `ytc` reports:

- `declared_replies` — sum of `reply_count` on top-level comments;
- `replies` — replies actually fetched;
- `missing_replies` — declared minus fetched;
- `complete` — true only when nothing is missing and no limit was hit.

Do **not** describe a result as “all comments” when `complete` is false.

## Security

See `SECURITY.md` for the audit record.

- Pinned `youtube-comment-downloader==0.1.84` in an isolated venv
  (`~/.venvs/ytcomments`), not system Python.
- The library is MIT, about 9 KB of source, and talks only to
  `youtube.com` and `consent.youtube.com`; it has no `exec`, no subprocess and
  no auth/cookie handling.
- `ytc` itself has no `subprocess`/shell calls. It adds a public oEmbed metadata
  request and local JSONL/cache writes.
- No cookies or account session are used. Cache dirs are `0700`; files are
  `0600` on this device.
- Re-audit before upgrading the library; do not run a prebuilt comments binary
  from an unknown publisher.

## Limitations

- `youtube-comment-downloader` does not expose pinned, uploader or verified
  flags. Those are `null` here. Use `yt-dlp`/the official API if you need them.
- `published_at_approx` is derived from relative text (“2 years ago”) and is
  approximate; use it for ordering, not exact dating.
- Replies are flattened to top-level threads; `depth` is 0 or 1.
- Comments are public opinion, not factual evidence. Bots, brigading, deleted
  comments and sampling bias matter.
- Respect YouTube’s Terms of Service and local privacy law. Use the official
  Data API for production/compliance workloads.
