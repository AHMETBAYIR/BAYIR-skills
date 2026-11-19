#!/usr/bin/env python3
"""Run MATLAB code through MatLivre's headless MCP server.

MatLivre is installed at ~/.local/bin/matlivre. `matlivre --mcp` exposes
`run_code` over JSON-RPC and returns both text output and PNG figures. This
script is the bridge used while authoring a note: compute the numbers, save a
publication figure, or check the readout of a lab against an independent
MATLAB implementation.

Usage:
    python3 matlivre_mcp.py --code-file check.m --out-dir ./out
    python3 matlivre_mcp.py --code "disp(2+3*4)" --out-dir ./out
    python3 matlivre_mcp.py --code-file figure.m --out-dir ./out --name ode

It writes:
    <out-dir>/<name>.txt      text output
    <out-dir>/<name>-fig1.png first returned figure, etc.

The CLI binary cannot render figures (it has no editor renderer). Use this
MCP path, or the MatLivre GUI, when a figure is required.
"""

from __future__ import annotations

import argparse
import base64
import json
import select
import subprocess
import sys
import time
from pathlib import Path


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
    parser.add_argument("--matlivre", default="matlivre", help="MatLivre executable")
    args = parser.parse_args()

    if args.code_file:
        code = Path(args.code_file).expanduser().read_text(encoding="utf-8")
    else:
        code = args.code

    out_dir = Path(args.out_dir).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    process = subprocess.Popen(
        [args.matlivre, "--mcp"],
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
