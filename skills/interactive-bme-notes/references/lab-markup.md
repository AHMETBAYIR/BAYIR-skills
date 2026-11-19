# BME lab markup

A lab is a `<div class="bmelab" data-bme-lab="KIND">` containing a head, a prediction, controls, a canvas, a readout, a status line, and a JSON config. The engine reads the config and wires the controls.

## Minimal copy-paste

```html
<div class="bmelab" data-bme-lab="joint">
  <div class="bmelab__head">
    <p class="bmelab__eyebrow">Lab 01 · biyomekanik</p>
    <h3>Dirsek açısını değiştir, kas kuvvetini oku</h3>
    <p>Açıyı ve yükü değiştirin; moment kolu, kas kuvveti ve eklem reaksiyonu güncellenir.</p>
  </div>
  <details class="predict"><summary>Önce tahmin et</summary>
    <p>90°'de kas kuvveti ~1000 N ise, 60°'de artar mı, azalır mı?</p>
  </details>
  <div class="bmelab__controls" data-controls></div>
  <div class="bmelab__grid">
    <div class="bmelab__viz">
      <div class="bmelab__canvas-wrap">
        <canvas class="bmelab__canvas" data-canvas data-height="400" role="img"
                aria-label="Dirsek açısı, yük ve kas kuvveti"></canvas>
      </div>
      <p class="bmelab__caption">Üst kol a=30 cm, yapışma b=3.5 cm, yük kolu d=35 cm.</p>
    </div>
    <div class="bmelab__panel">
      <div class="bmelab__readout" data-readout></div>
      <p class="bmelab__status" data-status role="status" aria-live="polite"></p>
      <p class="bmelab__hint" data-hint></p>
    </div>
  </div>
  <p class="bmelab__print">Baskı özeti: r = ab sinθ / L; 90°'de r ≈ 3.48 cm, F_m ≈ 988 N.</p>
  <script type="application/json" class="bmelab-config">{"angle":90,"load":10}</script>
</div>
```

Every lab needs:

- `data-bme-lab` on the root, matching `KNOWN_LABS` in `validate_note.py`;
- `data-controls`, `data-canvas`, `data-readout`, `data-status`;
- a `<details class="predict">` prompt;
- an `<h3>` title;
- an `aria-label` and `role="img"` on the canvas;
- a `<script class="bmelab-config">` JSON object (may be `{}`);
- a `.bmelab__print` fallback sentence.

## Config schemas

| Lab | Keys | Defaults | Notes |
|---|---|---|---|
| `joint` | `angle` (deg), `load` (kg) | 90, 10 | `a=0.30 m`, `b=0.035 m`, `d=0.35 m` fixed |
| `visco` | `model` (`kv`/`maxwell`), `test` (`creep`/`relax`), `E` (MPa), `eta` (MPa·s), `sigma` (MPa), `t` (s) | kv, creep, 1.0, 5.0, 0.2, 10 | `T=30 s` fixed |
| `oxygen` | `D` (m²/s), `C0` (mol/m³), `q` (mol m⁻³ s⁻¹), `L` (m) | 2e-9, 0.1, 0.02, 1.5e-4 | `Cmin=0.005` fixed |
| `stenosis` | `ratio`, `Q` (m³/s), `Ls` (m) | 0.6, 5e-6, 0.01 | `mu=0.0035 Pa·s`, `rho=1060`, `r0=0.005 m` fixed |
| `ecg` | `hr` (bpm), `axis` (deg), `noise` (mV) | 72, 60, 0.01 | synthetic; 2.5 s window |
| `michaelis` | `vmax`, `km`, `s`, `inhib` (`none`/`comp`/`noncomp`), `i`, `ki` | 100, 50, 50, none, 0, 50 | units arbitrary but consistent |
| `ct` | `level` (HU), `width` (HU) | 40, 400 | synthetic 240×240 phantom |

## Engine API

The engine file is an IIFE. It exposes:

```js
window.__BME_LABS__ = {
  register(kind, init),   // add a lab
  onRender(fn),          // re-run fn on theme/resize
  init(),                // scan the DOM
  rerender(),            // redraw all
  palette(),             // CSS-variable colours
  helpers: { $, $$, clamp, fmt, fmtInt, pct, palette, setupCanvas,
             bindPointer, setAria, setStatus, setReadout, addHint,
             addRange, addSelect, addToggle, addButton, addText,
             readConfig, line, dot, label, ticks }
};
```

A custom engine:

```js
(function () {
  var LAB = {};
  LAB.myLab = function (root) {
    var canvas = root.querySelector("[data-canvas]");
    var controls = root.querySelector("[data-controls]");
    var state = Object.assign({ x: 1 }, window.__BME_LABS__.helpers.readConfig(root));
    function draw() {
      var c = window.__BME_LABS__.helpers.setupCanvas(canvas, 340);
      // draw with c.ctx, c.w, c.h
      window.__BME_LABS__.helpers.setReadout(root, [["x", state.x.toFixed(2)]]);
      window.__BME_LABS__.helpers.setStatus(root, "Why the number is what it is.");
    }
    window.__BME_LABS__.helpers.addRange(controls, {
      label: "x", min: 0, max: 10, step: 0.1, value: state.x,
      format: function (v) { return v.toFixed(1); },
      onInput: function (v) { state.x = v; draw(); }
    });
    window.__BME_LABS__.onRender(draw);
    draw();
  };
  window.__BME_LABS__.register("myLab", LAB.myLab);
  window.__BME_LABS__.init();
})();
```

Build it with `--extra-js` and `--extra-css`. The builder rejects a closing `</script>` inside the JS.

## Design constraints

- Canvas CSS width is measured at draw time; keep the fallback height in `data-height`.
- Use `setupCanvas` for DPR scaling; do not set `width`/`height` attributes yourself.
- Use CSS variables via `palette()` so dark mode works.
- Pair every colour with a label or pattern.
- Call `setAria` after each draw with the current numeric state.
- Never put the answer in the readout before the learner acts; the prediction comes first.
- Keep the readout to 4–7 rows. Longer tables belong in the prose.

## Print

The stylesheet hides controls, hints, and quiz buttons in print. The canvas remains as the current state. Add a `.bmelab__print` sentence with the key number so the printout is self-contained.

## Accessibility

- Canvas: `role="img"` + `aria-label` that changes with state.
- Status: `role="status"` + `aria-live="polite"`.
- Controls: native `<input type="range">`, `<select>`, `<button>`; label wraps the control.
- Keyboard: Tab reaches every control; focus-visible outline is defined.
- Reduced motion: transitions are suppressed by the stylesheet.
- Do not encode a category by hue alone; add text, hatch, or a shape.
