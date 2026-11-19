"""Small shared helpers for yt-transcript."""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path


def eprint(*args, **kwargs) -> None:
    print(*args, file=sys.stderr, **kwargs)


def which(name: str) -> str | None:
    return shutil.which(name)


def run_cmd(cmd: list[str], timeout: int = 120, env: dict | None = None,
            check: bool = True) -> subprocess.CompletedProcess:
    e = os.environ.copy()
    if env:
        e.update(env)
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout,
                           env=e, check=False)
    except FileNotFoundError as exc:
        raise RuntimeError(f"command not found: {cmd[0]}") from exc
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError(f"timed out after {timeout}s: {' '.join(cmd[:3])}") from exc
    if check and p.returncode != 0:
        err = (p.stderr or p.stdout or "").strip().splitlines()
        tail = " | ".join(err[-3:]) if err else f"exit {p.returncode}"
        raise RuntimeError(f"{cmd[0]} failed: {tail}")
    return p


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


def fmt_ts(seconds: float, millis: bool = False) -> str:
    seconds = max(0.0, float(seconds or 0))
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    if millis:
        return f"{h:02d}:{m:02d}:{s:06.3f}"
    return f"{h:02d}:{m:02d}:{int(s):02d}"


def parse_ts(value: str) -> float:
    parts = str(value).strip().split(":")
    try:
        nums = [float(x) for x in parts]
    except ValueError as exc:
        raise ValueError(f"bad timestamp: {value!r}") from exc
    if len(nums) == 1:
        return nums[0]
    if len(nums) == 2:
        return nums[0] * 60 + nums[1]
    if len(nums) == 3:
        return nums[0] * 3600 + nums[1] * 60 + nums[2]
    raise ValueError(f"bad timestamp: {value!r}")


def human_duration(seconds: float | None) -> str:
    if not seconds:
        return "?"
    seconds = int(seconds)
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    if h:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def slugify(text: str, maxlen: int = 60) -> str:
    text = re.sub(r"[^\w\s.-]+", "", text, flags=re.UNICODE).strip()
    text = re.sub(r"[\s_.-]+", "-", text).strip("-")
    return (text[:maxlen].rstrip("-") or "video")


def now_ms() -> int:
    return int(time.time() * 1000)


def shorten(text: str, max_chars: int | None) -> str:
    if not max_chars or len(text) <= max_chars:
        return text
    cut = text[:max_chars]
    pos = max(cut.rfind(". "), cut.rfind("! "), cut.rfind("? "), cut.rfind("\n"))
    if pos > max_chars * 0.6:
        return cut[: pos + 1].rstrip()
    pos = cut.rfind(" ")
    return (cut[:pos] if pos > 0 else cut).rstrip() + " …"
