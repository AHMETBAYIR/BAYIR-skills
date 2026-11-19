# Desktop verification: check the note in a real browser

The fast loop is `terminal-browser` at 390 px. The **delivery gate** is a real
browser window on a real desktop session, because it catches what a headless
mobile viewport cannot: KaTeX glyph fallback, equation numbering, two-column lab
layout, font smoothing, and canvas rendering in a real engine.

Nothing here is tied to one machine. The script discovers the session, the
browser and a capture tool, and reports `BLOCKED` instead of guessing.

## Preconditions

- a desktop session you can see, X11 or Wayland (`$DISPLAY` or
  `$WAYLAND_DISPLAY` set in the shell that runs the check);
- a browser: `$BROWSER`, or `firefox`, `chromium`, `chromium-browser`,
  `google-chrome`, `brave-browser` on `PATH`;
- optionally a screenshot tool — the render check still counts without one;
- a note that already passes `validate_note.py` and `check_ee.py`.

| Tool | Debian/Ubuntu | Fedora | Arch | macOS | Termux |
|---|---|---|---|---|---|
| browser | `firefox` / `chromium` | `firefox` / `chromium` | `firefox` / `chromium` | `brew install --cask firefox` | `pkg install firefox` (X11 app) |
| `xdotool` (X11 window control) | `xdotool` | `xdotool` | `xdotool` | needs XQuartz | `pkg install xdotool` |
| `import` (X11 capture) | `imagemagick` | `ImageMagick` | `imagemagick` | `brew install imagemagick` | `pkg install imagemagick` |
| `grim` (Wayland capture) | `grim` | `grim` | `grim` | — | — |
| `gnome-screenshot` | `gnome-screenshot` | `gnome-screenshot` | `gnome-screenshot` | — | — |
| `spectacle` | `spectacle` | `spectacle` | `spectacle` | — | `pkg install spectacle` |
| `xwd` (last resort, raw XWD) | `x11-apps` | `xorg-x11-apps` | `xorg-xwd` | — | `pkg install xwd` |

The script needs no root, no container and no rootfs; it never stops the
desktop.

## One-command check

`interactive-bme-notes` and `interactive-mbg-notes` ship
`scripts/verify_desktop.sh`. EE does not: borrow the BME copy and edit the
`--out`/paths, or use the manual path below.

```sh
~/.agents/skills/interactive-bme-notes/scripts/verify_desktop.sh \
  ~/notes/electronics/courses/<course>/<topic>.html \
  verification/screenshot-desktop.png --scroll 2
```

| Env | Meaning |
|---|---|
| `BROWSER` | browser command, extra args allowed |
| `FIREFOX_WRAPPER` | explicit launcher override, optional |
| `NOTE_EVIDENCE_DIR` | screenshot directory when `out.png` is omitted (default `~/notes/evidence/`) |
| `DISPLAY`, `WAYLAND_DISPLAY`, `XAUTHORITY` | used as-is, never forced |

Output is `PASS wid=… bytes=… title=…` (or `PARTIAL … expected=…`) plus
`shot=<path>`. Exit codes: 0 PASS/PARTIAL, 2 usage, 3 blocked (no session or no
browser), 4 no window appeared, 5 a capture tool exists but failed. If it prints
`BLOCKED`, do not claim a desktop pass.

## What the script does

1. Resolves the session from `$DISPLAY`/`$WAYLAND_DISPLAY`. When both are
   unset (a bare shell, a cron job, an agent's own process), it reads them from
   a running compositor rather than guessing `:0`. `~/.Xauthority` is used when
   it is readable and `XAUTHORITY` is unset; the cookie path is read out of
   another process only as a last resort, which on a normal desktop never
   happens.
2. Probes X11 with `xdotool getdisplaygeometry` instead of assuming `:0`.
3. Resolves a browser: `$FIREFOX_WRAPPER`, `$BROWSER`, then the `PATH`
   candidates, then the Termux glibc wrapper path.
4. Opens a **new window** (`--new-window`), finds the new window id, matches its
   title against the note's `<title>`, activates it, sizes it to 1000×1300, and
   optionally scrolls with `Page_Down`.
5. Captures with `import -window "$WID"`, then `grim`, `gnome-screenshot`,
   `spectacle -b -n -o`, then `xwd`.
6. Prints `PASS` only if the title matched, otherwise `PARTIAL`; leaves the
   browser open unless `--close` is passed. Without X11 there is no window id to
   match, so that mode can only report `PARTIAL`.

## Why `import -window` instead of a Wayland tool

On Xwayland, several Wayland screenshot tools (Spectacle, `grim` on some
compositors) capture the Xwayland surface as **black** while the page itself is
rendered — the title and DOM are correct, the pixels are not. Capturing the X11
window directly returns the real page:

```sh
WID=$(xdotool search --onlyvisible --name . | tail -1)
import -window "$WID" shot.png
```

This is a capture-path limitation, not a page bug. Record it in the evidence.
For Wayland-native apps, use the compositor's own tool.

## Manual path (when the script is not enough)

```sh
firefox "file:///absolute/path/note.html?selftest=1" &
# or: chromium --new-window "file:///absolute/path/note.html?selftest=1" &
```

X11 window capture:

```sh
WID=$(xdotool search --onlyvisible --name . | tail -1)
xdotool getwindowname "$WID"
xdotool windowactivate --sync "$WID"
xdotool windowsize "$WID" 1000 1300
import -window "$WID" "verification/screenshot-desktop.png"
```

Other sessions: `grim shot.png` (Wayland), `gnome-screenshot -f shot.png`
(GNOME), `spectacle -b -n -o shot.png` (KDE), `screencapture -x shot.png`
(macOS).

Scroll with the keyboard (`Page_Down`, `ctrl+Home`, `ctrl+End`); it is more
reliable than wheel coordinates. Click with `Tab`/`Return` first; coordinate
clicks need window-relative coordinates and a scaling check.

## Visual checklist

- [ ] KaTeX shows typeset math, not raw `$...$` or `\frac`.
- [ ] Equation numbers appear **once**; the author leaves `.equation__tag` empty and CSS numbers it.
- [ ] The lab is two columns on desktop, one column on phone; no overflow.
- [ ] Canvas has the same numbers as the readout.
- [ ] Turkish glyphs (`ş ğ İ ı ç`) render in headings, body, and captions.
- [ ] Buttons, selects, and sliders are reachable; focus is visible; arrows change ranges.
- [ ] Dark mode still has contrast (toggle in the page chrome); the canvas repaints.
- [ ] **360 px**: Firefox responsive mode or a resized window; no horizontal scroll, controls wrap, canvas labels legible.
- [ ] **Offline**: disable the network, reload `file://`; no requests, no raw `$...$`, no console errors.
- [ ] **Selftest**: `?selftest=1`; badge `SELFTEST OK`; the console prints the per-check lines; `window.__EE_SELFTEST__.ok` is true.
- [ ] **Print preview**: controls/gate hidden, current canvas/readout/static sentence visible, no lab split across pages, solutions expanded.
- [ ] **Content**: compare three headline numbers with `check_ee.py`; the screenshot proves rendering, not the physics.

## Evidence

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

### Reporting

Final message:

- absolute path,
- launch command,
- engine list and section list,
- `check_ee.py` and `validate_note.py` output,
- screenshot path,
- PASS / PARTIAL / BLOCKED and the exact caveat,
- "root/proot/chroot not used".

## Known limits

- Wayland compositors may refuse programmatic window activation or resizing; the
  title match still works through Xwayland, the geometry may not.
- macOS has no X11 window control out of the box, so the script degrades to a
  screen capture and reports `PARTIAL`; use `screencapture -x` for evidence.
- Marionette is not exposed on a stock profile; do not depend on
  `localhost:2828`.
- Desktop scaling changes window-relative coordinates; use keyboard navigation
  for anything important.
- Test in the browser you will actually ship to. Do not add Electron or a
  second engine just to "check quickly".

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Authorization required` from `xdotool` | `XAUTHORITY` unset | export `XAUTHORITY` or run inside the session; `~/.Xauthority` is used automatically |
| Window found, content black | a Wayland tool captured the Xwayland surface | use `import -window "$WID"` |
| `Firefox is already running` | the same profile is open elsewhere | use the existing window or a separate profile; do not kill the session |
| No window after ~25 s | the launcher failed or the window is on another display | start the browser by hand and read its stderr; report `BLOCKED` |
| `BLOCKED: no screenshot tool` | no `import`/`grim`/`gnome-screenshot`/`spectacle`/`xwd` | the render check still counts; install one tool for evidence |
| Math shows raw TeX | KaTeX failed to load (offline/CDN) | inline KaTeX or enable network; re-test |
| Equation number doubled | author put `(1)` inside `.equation__tag` | leave the tag empty |
| Blank canvas | draw called before layout; width 0 | let `ResizeObserver` fire; check `data-height` |
| Canvas blurry | DPR not applied | `E.canvas` sets the backing store; do not set width/height manually |
| No lab | engine not injected, or name mismatch | check `data-ee-lab` against `assets/labs/*.js`; the builder fails closed |
| Controls do nothing | `data-param` missing/typo | match the engine state keys |
| Gate never unlocks | `data-answer` missing or no `data-opt` | inspect the markup |
| Print cuts a lab | no `break-inside: avoid` | add the class / check print CSS |
| Dark mode unreadable | hard-coded hex in the engine | use `E.palette()` |

## Appendix: Android / Termux session

Everything here still applies; these are the extra knobs of that setup.

- The desktop is Plasma/Wayland plus Xwayland on top of Termux: start it with
  `start-termux-plasma`, then `gapp_doctor` for the glibc runtime health check
  and `switch-session status` to confirm the session.
- The session is usually started by another process, so `XAUTHORITY` lives only
  in `plasmashell`'s environment — this is the one case where the script reads
  `/proc/<pid>/environ`:

  ```sh
  export DISPLAY=:0
  export XAUTHORITY="$(tr '\0' '\n' < /proc/$(pgrep -f '[p]lasmashell' | head -1)/environ | sed -n 's/^XAUTHORITY=//p')"
  ```

- Firefox is launched through `$HOME/Apps/glibc/launch/firefox.sh`, which sets
  the Gecko-safe environment; the script uses it as its last browser candidate
  when nothing else is on `PATH`.
- `$HOME/Apps/glibc/bin/wayland-screenshot.sh` copies the live session's
  Wayland/Xwayland/D-Bus environment, wakes the display, uses Spectacle, and
  rejects a black capture. Use it for Wayland-native apps; do not call
  `spectacle` directly unless debugging that helper.
- The Firefox warning bar ("security sandbox is disabled") is expected on this
  runtime: the kernel exposes no `/dev/shm` sealing. Note it in the evidence; do
  not "fix" it with root.
- Do not call `stop-termux-plasma` as test cleanup.
