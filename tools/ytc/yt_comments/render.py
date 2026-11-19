"""Markdown/text rendering for comment summaries."""

from __future__ import annotations

from .util import fmt_date_ts, human_int


def _video(s: dict) -> dict:
    return s.get("video") or {}


def render_summary_md(s: dict) -> str:
    v = _video(s)
    c = s.get("comments") or {}
    st = s.get("stats") or {}
    lines = [f"# Comments: {v.get('title') or v.get('id') or 'YouTube video'}", ""]
    lines.append(f"- **URL:** {v.get('url') or ''}")
    if v.get("channel"):
        lines.append(f"- **Channel:** {v['channel']}")
    lines.append(f"- **Fetched:** {c.get('fetched_at') or '?'}")
    lines.append(f"- **Sort:** {c.get('sort') or '?'} | **Scope:** {c.get('scope') or '?'} | "
                 f"**Language:** {c.get('language') or '?'}")
    lines.append("")
    lines.append("## Completeness")
    lines.append("")
    lines.append(f"- **Total:** {c.get('total', 0)} "
                 f"({c.get('top_level', 0)} top-level + {c.get('replies', 0)} replies)")
    lines.append(f"- **Declared replies:** {c.get('declared_replies', 0)}")
    lines.append(f"- **Missing replies:** {c.get('missing_replies', 0)}")
    lines.append(f"- **Complete in scope:** {'yes' if c.get('complete') else 'no'}")
    if c.get("note"):
        lines.append(f"- **Note:** {c['note']}")
    lines.append("")
    lines.append("## Stats")
    lines.append("")
    lines.append(f"- Likes: {human_int(st.get('total_likes'))} total, "
                 f"{st.get('mean_likes', 0)} mean, {human_int(st.get('max_likes'))} max")
    lines.append(f"- Authors: {human_int(st.get('unique_authors'))} unique")
    if st.get("hearted"):
        lines.append(f"- Creator-hearted comments: {st['hearted']}")
    if st.get("time_min_iso") or st.get("time_max_iso"):
        lines.append(f"- Approximate time range: {st.get('time_min_iso') or '?'} → "
                     f"{st.get('time_max_iso') or '?'} (derived from relative text)")
    lines.append("")
    lines.append("## Top comments")
    lines.append("")
    for i, cm in enumerate(s.get("top_comments") or [], 1):
        author = cm.get("author") or "?"
        lines.append(f"### {i}. {author} — {human_int(cm.get('like_count'))} likes")
        if cm.get("published_text"):
            lines.append(f"*{cm['published_text']}*")
        lines.append("")
        lines.append(cm.get("text") or "")
        lines.append("")
        for r in cm.get("replies") or []:
            lines.append(f"> **{r.get('author') or '?'}** "
                         f"({human_int(r.get('like_count'))} likes): {r.get('text') or ''}")
            lines.append("")
    if s.get("top_authors"):
        lines.append("## Top authors")
        lines.append("")
        for a in s["top_authors"][:10]:
            lines.append(f"- {a.get('author') or '?'} — {a.get('comments', 0)} comments, "
                         f"{human_int(a.get('likes'))} likes")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def render_top_text(s: dict, n: int = 10) -> str:
    v = _video(s)
    lines = [f"{v.get('title') or v.get('id') or 'YouTube video'}",
             f"{v.get('url') or ''}", ""]
    for i, cm in enumerate((s.get("top_comments") or [])[:n], 1):
        lines.append(f"{i}. {cm.get('author') or '?'} — {human_int(cm.get('like_count'))} likes "
                     f"({cm.get('published_text') or '?'})")
        lines.append(cm.get("text") or "")
        if cm.get("replies"):
            lines.append("   replies:")
            for r in cm["replies"]:
                lines.append(f"   - {r.get('author') or '?'}: {r.get('text') or ''}")
        lines.append("")
    c = s.get("comments") or {}
    lines.append(f"[{c.get('total', 0)} comments; {c.get('replies', 0)} replies; "
                 f"complete={c.get('complete')}; {c.get('note') or ''}]")
    return "\n".join(lines).rstrip() + "\n"


def render_comment_text(c: dict) -> str:
    return (f"{c.get('author') or '?'} — {human_int(c.get('like_count'))} likes — "
            f"{c.get('published_text') or '?'}\n{c.get('text') or ''}")


def render_comment_md(c: dict) -> str:
    return (f"- **{c.get('author') or '?'}** ({human_int(c.get('like_count'))} likes, "
            f"{fmt_date_ts(c.get('published_at_approx'))}): {c.get('text') or ''}")
