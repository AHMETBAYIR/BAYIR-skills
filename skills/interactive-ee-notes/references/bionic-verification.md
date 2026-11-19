# Bionic / Firefox verification

The live desktop is Plasma/Wayland on Termux. Verify the page in the real
session, not only in a headless browser. This environment is documented in the
`bionic-runtime` skill.

## 1. First checks

```sh
pgrep -f '[p]lasmashell' && echo plasma-running
pgrep -f '[k]win_wayland' && echo kwin-running
```

If the desktop is not running, start it from Termux:

```sh
start-termux-plasma
```

Do not call `stop-termux-plasma` as a test cleanup step.

## 2. Open the note

Use the glibc Firefox wrapper, not bare `firefox`:

```sh
$HOME/Apps/glibc/launch/firefox.sh "file:///absolute/path/note.html"
```

For the self-test:

```sh
$HOME/Apps/glibc/launch/firefox.sh "file:///absolute/path/note.html?selftest=1"
```

The wrapper sets the Gecko-safe environment and opens Firefox in X11/Xwayland
mode. Do not substitute Chromium/Electron.

## 3. Capture the live desktop

```sh
$HOME/Apps/glibc/bin/wayland-screenshot.sh /absolute/path/note.png
```

The helper copies the live session's Wayland/Xwayland/D-Bus environment, wakes
the display, uses Spectacle, and rejects a black capture. Do not call
`spectacle` directly unless debugging the helper.

## 4. What to inspect

- **360 px**: use Firefox responsive mode or resize the window; no horizontal
  scroll; controls wrap; canvas labels legible.
- **Dark mode**: toggle the theme; lab colours retain contrast; canvas is
  repainted (the core observes `data-theme`).
- **Print**: `Ctrl+P`; controls/gate hidden; current canvas/readout/static
  sentence visible; no lab split across pages; solutions expanded.
- **Keyboard**: Tab through every control; arrows change ranges; focus visible.
- **Offline**: disable network; reload `file://`; no requests, no raw `$...$`,
  no console errors.
- **Selftest**: `?selftest=1`; badge `SELFTEST OK`; check the console for the
  per-check lines; `window.__EE_SELFTEST__.ok` is true.
- **Content**: compare three headline numbers with `check_ee.py`.

## 5. Screenshot evidence

Store evidence under the note's `verification/` folder:

```
verification/
  screenshot-360.png
  screenshot-desktop.png
  print.pdf
  selftest.txt
  check.txt
  caveats.md
```

A screenshot proves the page rendered; it does not prove the physics. Report
both the screenshot and the numeric oracle output.

## 6. Common failures

| Symptom | Likely cause | Fix |
|---|---|---|
| blank canvas | draw called before layout; width 0 | let `ResizeObserver` fire; check `data-height` |
| canvas blurry | DPR not applied | `E.canvas` sets backing store; do not set width/height manually |
| raw `$...$` | KaTeX CDN removed but content uses `$` | use HTML math or build without `--offline` |
| no lab | engine not injected / name mismatch | check `data-ee-lab` vs `assets/labs/*.js`; builder fails closed |
| controls do nothing | `data-param` missing/typo | match engine state keys |
| gate never unlocks | `data-answer` missing or no `data-opt` | inspect markup |
| print cuts a lab | no `break-inside:avoid` | add the class / check print CSS |
| dark mode unreadable | hard-coded hex in engine | use `E.palette()` |
| file won't load offline | remote font/KaTeX/ES module | build with `--offline`, classic scripts |

## 7. Reporting

Final message:

- absolute path,
- launch command,
- engine list and section list,
- `check_ee.py` and `validate_note.py` output,
- screenshot path,
- PASS / PARTIAL / BLOCKED and the exact caveat,
- "root/proot/chroot not used".
