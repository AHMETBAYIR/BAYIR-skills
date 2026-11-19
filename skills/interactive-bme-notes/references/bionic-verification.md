# Live desktop verification with bionic-runtime

The fast loop is `terminal-browser` at 390 px. The **delivery gate** is the real Plasma/Firefox session, because it catches what a headless mobile viewport cannot: KaTeX glyph fallback, equation numbering, two-column lab layout, font smoothing, and canvas rendering in Gecko.

This path uses the `bionic-runtime` skill. It does **not** use root, chroot, proot, or a rootfs, and it does **not** stop the desktop.

## Preconditions

```sh
gapp_doctor
switch-session status 2>/dev/null || true
pgrep -f '[p]lasmashell'
pgrep -f '[k]win_wayland'
```

You need:

- a live Plasma/Wayland session (`start-termux-plasma` if not);
- `$HOME/Apps/glibc/launch/firefox.sh`;
- `xdotool`, ImageMagick `import`, and the session's `XAUTHORITY`;
- a note that already passes `validate_note.py`.

Do not use Chromium/Electron; Firefox is the supported browser.

## One-command check

Each skill ships `scripts/verify_desktop.sh`:

```sh
~/.agents/skills/interactive-bme-notes/scripts/verify_desktop.sh \
  ~/notes/bme/topic.html ~/notes/evidence/topic-desktop.png --scroll 2
```

Output is `PASS wid=… bytes=… title=…` plus the screenshot path. If it prints `BLOCKED`, do not claim a desktop pass.

## What the script does

1. Reads `DISPLAY` (default `:0`) and resolves `XAUTHORITY` from the live `plasmashell` process.
2. Launches Firefox through the supported wrapper.
3. Opens a **new window** (`--new-window`), finds it, matches its title to the note's `<title>`, activates it, sizes it to 1000×1300, and optionally scrolls.
4. Captures the window with `import -window "$WID"`.
5. Prints `PASS` only if the window title matches the note's `<title>`; otherwise `PARTIAL`.
6. Leaves Firefox open unless `--close` is passed.

## Why not Spectacle?

On this runtime, `wayland-screenshot.sh` returned the desktop and window frames but the **Xwayland Firefox content was black**, even though the page had rendered (the title and DOM were correct). Capturing the X11 window directly worked:

```sh
export DISPLAY=:0
export XAUTHORITY="$(tr '\0' '\n' < /proc/$(pgrep -f '[p]lasmashell' | head -1)/environ | sed -n 's/^XAUTHORITY=//p')"
import -window "$WID" shot.png
```

This is a capture-path limitation, not a page bug. Record it in the evidence. For Wayland-native apps, keep using `wayland-screenshot.sh`.

## Manual path (when the script is not enough)

```sh
export DISPLAY=:0
export XAUTHORITY="$(tr '\0' '\n' < /proc/$(pgrep -f '[p]lasmashell' | head -1)/environ | sed -n 's/^XAUTHORITY=//p')"

HTML="$HOME/notes/bme/topic.html"
$HOME/Apps/glibc/launch/firefox.sh "file://$HTML" &

WID=$(xdotool search --onlyvisible --class firefox | tail -1)
xdotool getwindowname "$WID"
xdotool windowactivate --sync "$WID"
xdotool key --window "$WID" ctrl+Home
xdotool key --window "$WID" Page_Down
import -window "$WID" "$HOME/notes/evidence/topic.png"
```

Scroll with keyboard (`Page_Down`, `ctrl+Home`, `ctrl+End`); it is more reliable than wheel coordinates. Click with `Tab`/`Return` first; coordinate clicks need window-relative coordinates and scaling checks.

## Visual checklist

- [ ] KaTeX shows typeset math, not raw `$...$` or `\frac`.
- [ ] Equation numbers appear **once**; the author leaves `.equation__tag` empty and CSS numbers it.
- [ ] The lab is two columns on desktop, one column on phone; no overflow.
- [ ] Canvas has the same numbers as the readout.
- [ ] Turkish glyphs (`ş ğ İ ı ç`) render in headings, body, and captions.
- [ ] Buttons, selects, and sliders are reachable; focus is visible.
- [ ] Dark mode still has contrast (toggle in the page chrome).
- [ ] The Firefox warning bar (“security sandbox is disabled”) is expected on this runtime; note it, do not “fix” it with root.
- [ ] Print preview: controls hidden, current state visible.

## Evidence

Save under `~/notes/evidence/<date>-<topic>/`:

```
desktop-top.png
desktop-lab1.png
desktop-lab2.png
desktop-dark.png
console.txt        # if you captured any
notes.md           # PASS/PARTIAL/BLOCKED + caveat
```

Report **PASS** only if the page rendered and at least one lab showed the expected numeric state. A window that exists is not a pass.

## Known limits

- Firefox runs in X11/Xwayland mode here; Wayland-native capture may differ.
- Marionette is not exposed on this profile; do not depend on `localhost:2828`.
- The runtime has no `/dev/shm` sealing and disables the content sandbox; the warning bar is environmental.
- Desktop scaling can change window-relative coordinates; use keyboard navigation for anything important.
- Do not run `stop-termux-plasma` as test cleanup.
- Do not launch Chromium/Electron to “check quickly”.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Authorization required` from xdotool | `XAUTHORITY` unset | read it from `plasmashell` environ |
| Window found, content black | Spectacle captured Xwayland surface | use `import -window "$WID"` |
| `Firefox is already running` | same profile is open | use the existing window or a separate profile; do not kill the desktop |
| No window after 20 s | wrapper failed | tail `~/Apps/glibc/logs/firefox.log`; report BLOCKED |
| Math shows raw TeX | KaTeX failed to load (offline/CDN) | inline KaTeX or enable network; re-test |
| Equation number doubled | author put `(1)` inside `.equation__tag` | leave the tag empty |
