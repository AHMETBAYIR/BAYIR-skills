#!/usr/bin/env python3
"""Firefox Marionette smoke test for an interactive medical note.

It connects to an already-running Firefox started with `--marionette`
(port 2828 by default), navigates to a local HTML file, checks that labs and
quizzes initialised, optionally exercises the first preset of every lab,
checks 390 px overflow, writes a screenshot, and can print to PDF.

Usage:
    python3 verify_page.py ~/notes/tip/topic.html --shot evidence/topic.png
    python3 verify_page.py ~/notes/tip/topic.html --pdf evidence/topic.pdf

Start Firefox first (bionic-runtime):
    MOZ_SHM_NO_SEALS=1 MOZ_DISABLE_CONTENT_SANDBOX=1 MOZ_DISABLE_GPU_SANDBOX=1 \
      MOZ_ENABLE_WAYLAND=0 glibc-gui-run \
      "$HOME/Apps/glibc/firefox/firefox-bin" -no-remote \
      -profile "$HOME/.mozilla/firefox/med-test" --marionette about:blank
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import shutil
import socket
import subprocess
import sys
import time
from pathlib import Path


class Marionette:
    def __init__(self, host: str = "127.0.0.1", port: int = 2828, timeout: float = 30.0):
        self.sock = socket.create_connection((host, port), timeout=timeout)
        self.sock.settimeout(timeout)
        self.next_id = 1
        self.handshake = self._recv()

    def _send(self, obj) -> None:
        data = json.dumps(obj)
        self.sock.sendall(f"{len(data)}:{data}".encode("utf-8"))

    def _recv(self):
        buffer = b""
        while b":" not in buffer:
            chunk = self.sock.recv(1)
            if not chunk:
                raise ConnectionError("Marionette closed the connection")
            buffer += chunk
        length_text, rest = buffer.split(b":", 1)
        length = int(length_text)
        while len(rest) < length:
            chunk = self.sock.recv(length - len(rest))
            if not chunk:
                raise ConnectionError("Marionette closed the connection")
            rest += chunk
        return json.loads(rest[:length].decode("utf-8"))

    def cmd(self, name: str, params: dict | None = None):
        message_id = self.next_id
        self.next_id += 1
        self._send([0, message_id, name, params or {}])
        response = self._recv()
        if response[1] != message_id:
            raise RuntimeError(f"unexpected Marionette response: {response[:2]}")
        if response[2] is not None:
            raise RuntimeError(f"{name}: {response[2]}")
        return response[3]

    def new_session(self) -> str:
        result = self.cmd("WebDriver:NewSession", {"capabilities": {}})
        return result.get("sessionId", "")

    def set_window(self, width: int, height: int) -> None:
        self.cmd("WebDriver:SetWindowRect", {"width": width, "height": height, "x": 0, "y": 0})

    def navigate(self, url: str) -> None:
        self.cmd("WebDriver:Navigate", {"url": url})

    def execute(self, script: str, args: list | None = None):
        return self.cmd("WebDriver:ExecuteScript", {"script": script, "args": args or []}).get("value")

    def screenshot(self, path: Path) -> int:
        try:
            encoded = self.cmd("WebDriver:TakeScreenshot", {}).get("value", "")
        except RuntimeError as exc:
            if "maximum allowed screenshot height" not in str(exc):
                raise
            # Very long dossiers exceed Firefox's full-page bitmap limit; fall
            # back to the current viewport rather than failing the whole test.
            encoded = self.cmd("WebDriver:TakeScreenshot", {"full": False}).get("value", "")
        data = base64.b64decode(encoded)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return len(data)

    def print_pdf(self, path: Path) -> int:
        result = self.cmd("WebDriver:Print", {
            "page": {"width": 21.0, "height": 29.7},
            "margin": {"top": 1.6, "bottom": 1.8, "left": 1.5, "right": 1.5},
            "orientation": "portrait",
            "scale": 1.0,
            "background": True,
        })
        data = base64.b64decode(result.get("value", ""))
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return len(data)

    def close(self) -> None:
        try:
            self.cmd("Marionette:Quit", {"flags": ["eForceQuit"]})
        except Exception:
            pass
        try:
            self.sock.close()
        except Exception:
            pass


PROBE = r"""
const labs = Array.from(document.querySelectorAll('[data-med-lab]')).map(el => ({
  kind: el.getAttribute('data-med-lab'),
  readout: (el.querySelector('[data-readout]') || {}).innerText || '',
  status: (el.querySelector('[data-status]') || {}).innerText || '',
  canvas: !!el.querySelector('canvas'),
  buttons: el.querySelectorAll('.medbtn').length,
  printFallback: !!el.querySelector('[data-print]')
}));
const quiz = document.querySelector('[data-med-quiz]');
const body = document.body.innerText;
return {
  title: document.title,
  url: location.href,
  labs,
  labCount: labs.length,
  emptyReadouts: labs.filter(l => !l.readout.trim()).length,
  canvasCount: document.querySelectorAll('canvas').length,
  katex: document.querySelectorAll('.katex').length,
  rawDoubleDollar: body.includes('$$'),
  quizQuestions: quiz ? quiz.querySelectorAll('.medquiz__question').length : 0,
  safety: /eğitim amaçlı|eğitim sınırı|klinik tavsiye|clinical advice|not a diagnostic/i.test(body),
  h2: document.querySelectorAll('h2').length,
  links: document.querySelectorAll('a[href^="http"]').length,
  errors: (window.__MED_LABS__ && window.__MED_LABS__.errors) || [],
  viewport: { w: window.innerWidth, h: window.innerHeight },
  scrollWidth: document.documentElement.scrollWidth
};
"""

EXERCISE = r"""
const results = [];
document.querySelectorAll('[data-med-lab]').forEach(el => {
  const before = (el.querySelector('[data-readout]') || {}).innerText || '';
  const range = el.querySelector('input[type="range"]');
  const select = el.querySelector('select');
  if (range) {
    const old = Number(range.value);
    const min = Number(range.min);
    const max = Number(range.max);
    range.value = String(old === max ? min : max);
    range.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (select && select.options.length > 1) {
    select.selectedIndex = select.selectedIndex === 0 ? 1 : 0;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    const buttons = el.querySelectorAll('.medbtn');
    const btn = buttons.length > 1 ? buttons[1] : buttons[0];
    if (btn) btn.click();
  }
  const after = (el.querySelector('[data-readout]') || {}).innerText || '';
  results.push({
    kind: el.getAttribute('data-med-lab'),
    changed: before !== after,
    afterLen: after.length,
    statusLen: ((el.querySelector('[data-status]') || {}).innerText || '').length
  });
});
return results;
"""

QUIZ = r"""
const q = document.querySelector('[data-med-quiz] .medquiz__question');
if (!q) return null;
const opt = q.querySelector('.medquiz__option');
if (!opt) return null;
opt.click();
return {
  answered: q.classList.contains('is-answered'),
  explainLen: ((q.querySelector('.medquiz__explain') || {}).innerText || '').length,
  score: ((document.querySelector('[data-quiz-score]') || {}).innerText || '')
};
"""


def start_firefox(port: int, log_path: Path | None = None) -> subprocess.Popen:
    """Start the supported Firefox wrapper with Marionette enabled."""
    runner = shutil.which("glibc-gui-run")
    binary = Path.home() / "Apps" / "glibc" / "firefox" / "firefox-bin"
    profile = Path.home() / ".mozilla" / "firefox" / "med-test"
    profile.mkdir(parents=True, exist_ok=True)
    if not runner or not binary.is_file():
        raise RuntimeError("glibc-gui-run or Firefox binary not found")
    env = dict(os.environ)
    env.update({
        "MOZ_SHM_NO_SEALS": "1",
        "MOZ_DISABLE_CONTENT_SANDBOX": "1",
        "MOZ_DISABLE_GPU_SANDBOX": "1",
        "MOZ_ENABLE_WAYLAND": "0",
    })
    log = open(log_path or (Path.home() / ".cache" / "med-notes-firefox.log"), "ab")
    return subprocess.Popen([
        runner, str(binary), "-no-remote",
        "-profile", str(profile), "--marionette", "about:blank",
    ], env=env, stdout=log, stderr=subprocess.STDOUT)


def wait_for_port(port: int, timeout: float = 30.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=1):
                return True
        except OSError:
            time.sleep(0.4)
    return False


def main() -> int:
    parser = argparse.ArgumentParser(description="Firefox Marionette smoke test for a medical note.")
    parser.add_argument("html", help="Built HTML note")
    parser.add_argument("--port", type=int, default=2828)
    parser.add_argument("--width", type=int, default=1200)
    parser.add_argument("--height", type=int, default=900)
    parser.add_argument("--shot", help="Screenshot output path")
    parser.add_argument("--pdf", help="PDF output path")
    parser.add_argument("--exercise", action="store_true", help="Click the first preset in every lab")
    parser.add_argument("--quiz", action="store_true", help="Click the first answer in the first quiz")
    parser.add_argument("--no-close", action="store_true", help="Keep the Firefox session open")
    parser.add_argument("--start", action="store_true", help="Start Firefox with Marionette if none is running")
    parser.add_argument("--log", help="Firefox log path when --start is used")
    args = parser.parse_args()

    path = Path(args.html).expanduser().resolve()
    if not path.is_file():
        print(f"error: file not found: {path}", file=sys.stderr)
        return 2

    owned = False
    try:
        session = Marionette(port=args.port)
    except Exception as exc:
        if not args.start:
            print(f"error: cannot connect to Marionette on 127.0.0.1:{args.port}: {exc}", file=sys.stderr)
            print("Start Firefox with --marionette, or pass --start.", file=sys.stderr)
            return 2
        try:
            log_path = Path(args.log).expanduser().resolve() if args.log else None
            start_firefox(args.port, log_path)
            owned = True
            if not wait_for_port(args.port):
                print("error: Firefox started but Marionette did not open the port", file=sys.stderr)
                return 2
            session = Marionette(port=args.port)
        except Exception as start_exc:
            print(f"error: could not start Firefox: {start_exc}", file=sys.stderr)
            return 2

    fails: list[str] = []
    warns: list[str] = []

    try:
        session.new_session()
        session.set_window(args.width, args.height)
        session.navigate(path.as_uri())
        time.sleep(1.5)
        probe = session.execute(PROBE)
        print(path)
        print(f"  title: {probe.get('title', '')[:90]}")
        print(f"  labs: {probe.get('labCount')}  canvases: {probe.get('canvasCount')}  katex: {probe.get('katex')}  quiz: {probe.get('quizQuestions')}")

        if probe.get("labCount", 0) == 0:
            warns.append("no labs found (prose-only page?)")
        if probe.get("emptyReadouts", 0):
            fails.append(f"{probe['emptyReadouts']} lab(s) have an empty readout")
        if probe.get("canvasCount", 0) < probe.get("labCount", 0):
            fails.append("fewer canvases than labs")
        if probe.get("rawDoubleDollar"):
            warns.append("raw $$ found in visible text")
        if not probe.get("safety"):
            fails.append("clinical-safety statement not found")
        if probe.get("h2", 0) < 4:
            warns.append("fewer than 4 h2 sections")
        errors = probe.get("errors") or []
        if errors:
            fails.append("JS errors: " + "; ".join(str(e) for e in errors[:3]))

        if args.exercise and probe.get("labCount", 0):
            results = session.execute(EXERCISE) or []
            for item in results:
                if not item.get("changed"):
                    fails.append(f"lab {item.get('kind')} readout did not change after preset click")
                if item.get("statusLen", 0) < 20:
                    warns.append(f"lab {item.get('kind')} has a short status line")

        if args.quiz and probe.get("quizQuestions", 0):
            quiz = session.execute(QUIZ)
            if not quiz or not quiz.get("answered"):
                fails.append("quiz did not enter answered state")
            elif quiz.get("explainLen", 0) < 24:
                fails.append("quiz explanation is too short")
            else:
                print(f"  quiz: {quiz.get('score')} · explanation {quiz.get('explainLen')} chars")

        # Mobile width check
        session.set_window(390, 844)
        time.sleep(0.8)
        mobile = session.execute(PROBE)
        mobile_width = mobile.get("viewport", {}).get("w", 390)
        overflow = mobile.get("scrollWidth", 0) - mobile_width
        print(f"  mobile: {mobile_width} px, overflow {overflow} px")
        if mobile_width > 420:
            warns.append(f"Firefox clamped the window to {mobile_width} px; exact 390 px check unavailable")
        if overflow > 2:
            fails.append(f"horizontal overflow at {mobile_width} px: {overflow} px")
        session.set_window(args.width, args.height)

        if args.shot:
            size = session.screenshot(Path(args.shot).expanduser().resolve())
            print(f"  screenshot: {args.shot} ({size / 1024:.0f} kB)")

        if args.pdf:
            size = session.print_pdf(Path(args.pdf).expanduser().resolve())
            print(f"  pdf: {args.pdf} ({size / 1024:.0f} kB)")

        for message in warns:
            print(f"  WARN  {message}")
        for message in fails:
            print(f"  FAIL  {message}")
        if fails:
            print(f"\n{len(fails)} failure(s), {len(warns)} warning(s)")
            return 1
        print(f"  PASS  no smoke-test failures ({len(warns)} warning(s))")
        return 0
    finally:
        if owned and not args.no_close:
            session.close()


if __name__ == "__main__":
    raise SystemExit(main())
