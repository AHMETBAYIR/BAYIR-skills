"""Streaming summary: stats, top comments, threads, completeness receipt."""

from __future__ import annotations

import heapq
import json
from pathlib import Path

from .engine import FetchOptions
from .util import iso_from_ts, short


def _load(comments_path: Path):
    with open(comments_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    yield json.loads(line)
                except json.JSONDecodeError:
                    continue


def _comment_summary(c: dict, max_chars: int) -> dict:
    return {
        "id": c.get("id"),
        "author": c.get("author"),
        "author_channel_id": c.get("author_channel_id"),
        "text": short(c.get("text") or "", max_chars),
        "like_count": c.get("like_count", 0),
        "reply_count": c.get("reply_count", 0),
        "published_text": c.get("published_text"),
        "published_at_approx": c.get("published_at_approx"),
        "hearted": c.get("hearted", False),
        "paid": c.get("paid"),
        "is_pinned": c.get("is_pinned"),
        "is_uploader": c.get("is_uploader"),
        "is_verified": c.get("is_verified"),
        "comment_url": c.get("comment_url"),
    }


def build_summary(comments_path: Path, meta: dict, opt: FetchOptions,
                  top_n: int | None = None, replies_per_thread: int | None = None,
                  max_comment_chars: int | None = None) -> dict:
    top_n = max(1, opt.top_n if top_n is None else top_n)
    replies_per_thread = max(0, opt.replies_per_thread if replies_per_thread is None else replies_per_thread)
    max_chars = max(40, opt.max_comment_chars if max_comment_chars is None else max_comment_chars)

    total = top_level = replies = declared = 0
    likes_sum = likes_max = 0
    hearted = paid = 0
    authors: dict[str, dict] = {}
    heap: list[tuple[int, str, dict]] = []
    min_ts = None
    max_ts = None

    for c in _load(comments_path):
        total += 1
        likes = int(c.get("like_count") or 0)
        likes_sum += likes
        likes_max = max(likes_max, likes)
        if c.get("hearted"):
            hearted += 1
        if c.get("paid"):
            paid += 1
        ts = c.get("published_at_approx")
        if ts:
            min_ts = ts if min_ts is None else min(min_ts, ts)
            max_ts = ts if max_ts is None else max(max_ts, ts)
        key = c.get("author_channel_id") or c.get("author") or "?"
        a = authors.setdefault(key, {"author": c.get("author") or "?",
                                     "author_channel_id": c.get("author_channel_id") or "",
                                     "comments": 0, "likes": 0})
        a["comments"] += 1
        a["likes"] += likes
        if c.get("is_reply"):
            replies += 1
        else:
            top_level += 1
            declared += int(c.get("reply_count") or 0)
            item = (likes, str(c.get("id") or ""), _comment_summary(c, max_chars))
            if len(heap) < top_n:
                heapq.heappush(heap, item)
            elif item[0] > heap[0][0]:
                heapq.heapreplace(heap, item)

    top = [x[2] for x in sorted(heap, key=lambda x: (x[0], x[1]), reverse=True)]
    top_ids = {c["id"] for c in top if c.get("id")}
    reply_map: dict[str, list[dict]] = {cid: [] for cid in top_ids}
    if top_ids and replies_per_thread > 0:
        for c in _load(comments_path):
            pid = c.get("parent_id")
            if pid in reply_map and len(reply_map[pid]) < replies_per_thread:
                reply_map[pid].append({
                    "id": c.get("id"),
                    "author": c.get("author"),
                    "text": short(c.get("text") or "", max_chars),
                    "like_count": c.get("like_count", 0),
                    "published_text": c.get("published_text"),
                    "hearted": c.get("hearted", False),
                })
    for c in top:
        rs = reply_map.get(c.get("id"), [])
        rs.sort(key=lambda x: int(x.get("like_count") or 0), reverse=True)
        c["replies"] = rs

    top_authors = sorted(authors.values(),
                         key=lambda a: (int(a["likes"]), int(a["comments"]), a["author"]),
                         reverse=True)[:15]

    scope = "top_level" if opt.top_level_only else "all"
    limit_reached = bool(opt.limit is not None and total >= opt.limit)
    if scope == "top_level":
        declared = 0
        missing = 0
        complete = not limit_reached
        missing_reason = "scope"
    else:
        missing = max(0, declared - replies)
        complete = (missing == 0) and not limit_reached
        missing_reason = "limit" if limit_reached else ("unavailable" if missing else "none")
    note = []
    if limit_reached:
        note.append(f"Stopped at the {opt.limit}-comment limit; more comments or replies may exist.")
    elif missing:
        note.append(f"YouTube did not serve {missing} declared reply/replies "
                    "(deleted, held, or unavailable through this extractor).")
    if scope == "top_level":
        note.append("Top-level comments only; replies were intentionally skipped.")

    return {
        "ok": True,
        "options": {"top_n": top_n, "replies_per_thread": replies_per_thread,
                    "max_comment_chars": max_chars},
        "video": meta.get("video") or {},
        "comments": {
            "total": total,
            "top_level": top_level,
            "replies": replies,
            "declared_replies": declared,
            "missing_replies": missing,
            "missing_reason": missing_reason,
            "complete": complete,
            "limit": opt.limit,
            "limit_reached": limit_reached,
            "scope": scope,
            "sort": opt.sort,
            "language": opt.language,
            "fetched_at": meta.get("fetched_at"),
            "elapsed_seconds": meta.get("elapsed_seconds"),
            "source": meta.get("source"),
            "note": " ".join(note) if note else "",
        },
        "stats": {
            "total_likes": likes_sum,
            "mean_likes": round(likes_sum / total, 2) if total else 0,
            "max_likes": likes_max,
            "unique_authors": len(authors),
            "hearted": hearted,
            "paid": paid,
            "time_min": min_ts,
            "time_max": max_ts,
            "time_min_iso": iso_from_ts(min_ts),
            "time_max_iso": iso_from_ts(max_ts),
            "pinned_available": False,
            "uploader_available": False,
        },
        "top_authors": top_authors,
        "top_comments": top,
    }
