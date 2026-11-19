"""Thin wrapper around youtube-comment-downloader with normalization."""

from __future__ import annotations

import re
from dataclasses import dataclass
from importlib.metadata import version as pkg_version
from typing import Iterator

import requests
from youtube_comment_downloader import (SORT_BY_POPULAR, SORT_BY_RECENT,
                                        YoutubeCommentDownloader)

from .util import canonical_url, parse_video_id, safe_int

SOURCE = "youtube-comment-downloader"


def engine_version() -> str:
    try:
        return pkg_version("youtube-comment-downloader")
    except Exception:  # noqa: BLE001
        return "unknown"


class NoCommentsError(RuntimeError):
    pass


@dataclass
class FetchOptions:
    sort: str = "top"
    limit: int | None = 1000
    language: str = "en"
    top_level_only: bool = False
    # Output controls used by summary.build_summary.
    top_n: int = 10
    replies_per_thread: int = 3
    max_comment_chars: int = 600


def _sort_value(sort: str) -> int:
    return SORT_BY_POPULAR if (sort or "top").lower().startswith("top") else SORT_BY_RECENT


def _clean_text(text: str) -> str:
    text = (text or "").replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("\u200b", "").replace("\ufeff", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _http_get(url: str, **kwargs):
    """GET with a Chrome TLS fingerprint when curl_cffi is installed."""
    try:
        from curl_cffi import requests as curl_requests
        return curl_requests.get(url, impersonate="chrome", **kwargs)
    except ImportError:
        return requests.get(url, **kwargs)


def video_meta(url: str, timeout: int = 25) -> dict:
    """Public oEmbed metadata; no cookies, no player JS."""
    vid = parse_video_id(url) or ""
    out = {"id": vid, "url": canonical_url(vid) if vid else url,
           "title": "", "channel": "", "channel_url": "", "thumbnail": ""}
    if not vid:
        return out
    try:
        r = _http_get(
            "https://www.youtube.com/oembed",
            params={"url": canonical_url(vid), "format": "json"},
            headers={"User-Agent": "ytc/0.1 (+https://github.com/egbertbouman/youtube-comment-downloader)"},
            timeout=timeout,
        )
        if r.status_code == 200:
            d = r.json()
            out.update({
                "title": d.get("title") or "",
                "channel": d.get("author_name") or "",
                "channel_url": d.get("author_url") or "",
                "thumbnail": d.get("thumbnail_url") or "",
            })
    except Exception:  # noqa: BLE001 - metadata is best-effort
        pass
    return out


def normalize(raw: dict, video_id: str) -> dict:
    cid = str(raw.get("cid") or "")
    is_reply = bool(raw.get("reply"))
    parent = cid.split(".", 1)[0] if (is_reply and "." in cid) else ""
    channel = str(raw.get("channel") or "")
    paid = raw.get("paid")
    try:
        published = int(float(raw.get("time_parsed"))) if raw.get("time_parsed") else None
    except (TypeError, ValueError):
        published = None
    return {
        "id": cid,
        "video_id": video_id,
        "parent_id": parent,
        "root_id": parent or cid,
        "depth": 1 if parent else 0,
        "is_reply": is_reply,
        "author": str(raw.get("author") or ""),
        "author_channel_id": channel,
        "author_url": f"https://www.youtube.com/channel/{channel}" if channel else "",
        "text": _clean_text(str(raw.get("text") or "")),
        "like_count": safe_int(raw.get("votes"), 0),
        "reply_count": 0 if is_reply else safe_int(raw.get("replies"), 0),
        "published_text": str(raw.get("time") or ""),
        "published_at_approx": published,
        "hearted": bool(raw.get("heart")),
        "paid": str(paid) if paid else None,
        # youtube-comment-downloader does not expose these.
        "is_pinned": None,
        "is_uploader": None,
        "is_verified": None,
        "comment_url": f"https://www.youtube.com/watch?v={video_id}&lc={cid}" if cid else "",
        "source": f"{SOURCE}/{engine_version()}",
    }


def iter_comments(url: str, opt: FetchOptions) -> Iterator[dict]:
    """Yield normalized comments, honoring the total limit exactly."""
    vid = parse_video_id(url)
    if not vid:
        raise ValueError(f"not a YouTube video URL: {url}")
    downloader = YoutubeCommentDownloader()
    generator = downloader.get_comments_from_url(
        canonical_url(vid), sort_by=_sort_value(opt.sort), language=opt.language or None,
    )
    if generator is None:
        raise NoCommentsError("comments are disabled or unavailable for this video")

    yielded = 0
    for raw in generator:
        if opt.top_level_only and raw.get("reply"):
            continue
        yield normalize(raw, vid)
        yielded += 1
        if opt.limit and yielded >= opt.limit:
            break
    if yielded == 0:
        raise NoCommentsError("no comments were returned (disabled, empty, or blocked)")
