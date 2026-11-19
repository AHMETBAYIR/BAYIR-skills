#!/usr/bin/env python3
"""Run MATLAB code through a MatLivre MCP server (optional).

MatLivre is a clean-room MATLAB-compatible runtime; `matlivre --mcp` exposes
`run_code` over JSON-RPC and returns both text output and PNG figures. This
script is the bridge used while authoring a note: compute the numbers, save a
publication figure, or check the readout of a lab against an independent
MATLAB implementation.

MatLivre is optional. MATLAB or Octave run the same `.m` checks. Use this
script only when MatLivre is installed and you want its MCP figure output.

Binary resolution, first match wins:
    1. --matlivre PATH
    2. $MATLIVRE_BIN
    3. `matlivre` on PATH
    4. ~/.local/bin, ~/.local/lib/matlivre, /usr/local/bin, /usr/bin

Usage:
    python3 matlivre_mcp.py --code-file check.m --out-dir ./out
    python3 matlivre_mcp.py --code "disp(2+3*4)" --out-dir ./out
    python3 matlivre_mcp.py --code-file figure.m --out-dir ./out --name ode

It writes:
    <out-dir>/<name>.txt       text output
    <out-dir>/<name>-fig.png   first returned figure; -fig2.png, ... after that

With no MatLivre installed it prints an install hint and exits 2.

The CLI binary cannot render figures (it has no editor renderer). Use this
MCP path, or the MatLivre GUI, when a figure is required.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import select
import shutil
import subprocess
import sys
import time
from pathlib import Path

FALLBACK_BINARIES = [
    "~/.local/bin/matlivre",
    "~/.local/lib/matlivre/matlivre",
    "/usr/local/bin/matlivre",
    "/usr/bin/matlivre",
]


def _executable(candidate: str) -> str | None:
    """Return an absolute path for an executable candidate, or None."""
    path = Path(candidate).expanduser()
    if path.is_file() and os.access(path, os.X_OK):
        return str(path)
    return shutil.which(candidate)


def resolve_matlivre(explicit: str | None) -> str | None:
    """Find the matlivre executable without assuming a personal install path."""
    if explicit:
        return _executable(explicit)
    env = os.environ.get("MATLIVRE_BIN")
    if env:
        found = _executable(env)
        if found:
            return found
        print(f"warning: $MATLIVRE_BIN={env!r} is not executable; still searching", file=sys.stderr)
    found = shutil.which("matlivre")
    if found:
        return found
    for candidate in FALLBACK_BINARIES:
        found = _executable(candidate)
        if found:
            return found
    return None


def missing_matlivre_message() -> str:
    looked = ["$MATLIVRE_BIN", "`matlivre` on PATH"] + FALLBACK_BINARIES
    return (
        "error: no `matlivre` executable found.\n"
        "\n"
        "MatLivre is optional. Point the bridge at it explicitly:\n"
        "    export MATLIVRE_BIN=/path/to/matlivre\n"
        "    python3 matlivre_mcp.py --matlivre /path/to/matlivre ...\n"
        "\n"
        "Looked at: " + ", ".join(looked) + "\n"
        "\n"
        "No MatLivre? Run the same .m file with a MATLAB-compatible oracle:\n"
        "    octave --no-gui check.m        # free: apt install octave, brew install octave\n"
        "    matlab -batch \"run('check.m')\"  # licensed\n"
        "For figure export see references/matlivre.md."
    )


def send(process: subprocess.Popen, message: dict) -> None:
    assert process.stdin is not None
    process.stdin.write(json.dumps(message) + "\n")
    process.stdin.flush()


def receive(process: subprocess.Popen, timeout: float = 120.0) -> dict:
    assert process.stdout is not None
    ready, _, _ = select.select([process.stdout], [], [], timeout)
    if not ready:
        raise TimeoutError(f"MatLivre did not answer within {timeout:.0f}s")
    line = process.stdout.readline()
    if not line:
        stderr = process.stderr.read() if process.stderr else ""
        raise RuntimeError(f"MatLivre exited unexpectedly. stderr:\n{stderr}")
    return json.loads(line)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run code in MatLivre over MCP.")
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--code", help="MATLAB code to run")
    source.add_argument("--code-file", help=".m file to run")
    parser.add_argument("--out-dir", default="matlivre-out", help="Directory for text and PNG output")
    parser.add_argument("--name", default="run", help="Output basename")
    parser.add_argument("--timeout", type=float, default=120.0, help="Seconds per request")
    parser.add_argument("--matlivre", default=None,
                        help="MatLivre executable (default: $MATLIVRE_BIN, then matlivre on PATH)")
    args = parser.parse_args()

    binary = resolve_matlivre(args.matlivre)
    if binary is None:
        print(missing_matlivre_message(), file=sys.stderr)
        return 2

    if args.code_file:
        code = Path(args.code_file).expanduser().read_text(encoding="utf-8")
    else:
        code = args.code

    out_dir = Path(args.out_dir).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    process = subprocess.Popen(
        [binary, "--mcp"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
    )
    try:
        send(process, {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2025-06-18",
                "capabilities": {},
                "clientInfo": {"name": "interactive-math-notes", "version": "1"},
            },
        })
        init = receive(process, args.timeout)
        if "error" in init:
            raise RuntimeError(init["error"])
        send(process, {"jsonrpc": "2.0", "method": "notifications/initialized"})
        send(process, {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {"name": "run_code", "arguments": {"code": code}},
        })
        response = receive(process, args.timeout)
    finally:
        try:
            process.stdin.close()
        except Exception:
            pass
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()

    if "error" in response:
        print(json.dumps(response["error"], indent=2), file=sys.stderr)
        return 1
    result = response.get("result", {})
    content = result.get("content", [])
    text_parts: list[str] = []
    image_index = 0
    written: list[Path] = []
    for item in content:
        if item.get("type") == "text":
            text_parts.append(item.get("text", ""))
        elif item.get("type") == "image":
            image_index += 1
            suffix = f"-fig{image_index}.png" if image_index > 1 else "-fig.png"
            path = out_dir / f"{args.name}{suffix}"
            path.write_bytes(base64.b64decode(item["data"]))
            written.append(path)

    text_path = out_dir / f"{args.name}.txt"
    text_path.write_text("".join(text_parts) or "(no output)\n", encoding="utf-8")
    written.insert(0, text_path)

    for path in written:
        print(path)
    if result.get("isError"):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
