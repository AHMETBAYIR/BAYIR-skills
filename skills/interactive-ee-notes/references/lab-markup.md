# Lab markup and engine contract

The builder scans `data-ee-lab="<name>"`, loads `assets/labs/<name>.js`, and
inlines the core + only the used engines. A missing engine is a build error,
not a silent blank lab.

## 1. Full markup

```html
<div class="eelab" data-ee-lab="bode">
  <p class="eelab__eyebrow">Lab 2 · Frekans cevabı</p>
  <h3 id="lab-bode">Kesim frekansını bul</h3>
  <p class="eelab__hint">R veya C'yi değiştir; `f/f_c` ekseninde −3 dB noktasını izle.</p>

  <div class="eegate" data-gate data-answer="b"
       data-why="f_c=1/(2πRC); C iki katına çıkarsa f_c yarıya iner.">
    <p class="eegate__q">Tahmin: C iki katına çıkarsa kesim frekansı ne olur?</p>
    <div class="eegate__opts">
      <button class="eegate__opt" data-opt="a" type="button">İki katına çıkar</button>
      <button class="eegate__opt" data-opt="b" type="button">Yarıya iner</button>
      <button class="eegate__opt" data-opt="c" type="button">Değişmez</button>
    </div>
    <p class="eegate__why" hidden></p>
  </div>

  <div class="eelab__controls" data-controls>
    <label class="eefield">R (kΩ)
      <input type="range" data-param="r" data-default="1" min="0.1" max="10" step="0.1" data-digits="1">
      <output data-out="r"></output>
    </label>
    <label class="eefield">C (nF)
      <input type="range" data-param="c" data-default="100" min="1" max="1000" step="1" data-digits="0">
      <output data-out="c"></output>
    </label>
    <label class="eefield">Tip
      <select data-param="kind" data-default="lp">
        <option value="lp">Alçak geçiren</option>
        <option value="hp">Yüksek geçiren</option>
      </select>
    </label>
    <button type="button" data-reset>Sıfırla</button>
  </div>

  <div class="eelab__canvaswrap">
    <canvas data-canvas data-height="300"></canvas>
  </div>
  <p class="eelab__caption">Şekil: büyüklük (üst) ve faz (alt); kesikli çizgi `f_c`.</p>
  <div class="eelab__readout" data-readout></div>
  <p class="eelab__status" data-status aria-live="polite"></p>
  <p class="eelab__print" data-print></p>
</div>
```

## 2. Required hooks

| Hook | Owner | Meaning |
|---|---|---|
| `data-ee-lab="name"` | markup | engine id; file `assets/labs/name.js` |
| `data-controls` | markup | wrapper for inputs/reset |
| `data-param="x"` | input/select | state key; number for range/number, string for select, boolean for checkbox |
| `data-default="..."` | input/select | initial value; reset target |
| `data-digits="n"` | input | display digits in `data-out` |
| `data-out="x"` | output | live numeric/string display |
| `data-canvas` | canvas | one canvas; optional `data-height` |
| `data-readout` | div | engine returns `[[label, value], ...]` |
| `data-status` | p | causal sentence; `aria-live="polite"` |
| `data-print` | p | static sentence for print/no-JS |
| `data-reset` | button | restore defaults |
| `data-gate` | div | prediction gate |
| `data-answer="b"` | gate | correct option |
| `data-why="..."` | gate | explanation shown after commit |
| `data-opt="a"` | button | option id |
| `data-quiz` | div | quiz container |
| `.eequiz__q` | div | question; `data-answer`, `data-explain` |
| `.eequiz__opt` | button | option; `data-option` |

The static validator requires canvas, controls, readout, status, print and
reset. A gate is strongly recommended; a `<details class="predict">` is the
fallback for a static prose prediction.

## 3. Engine API

```js
(function () {
  "use strict";
  if (!window.EE) return;
  var E = window.EE;

  E.registerLab("myengine", function (s, el) {
    // 1. compute from s
    var x = s.r * 2;

    // 2. draw; E.canvas caches the draw function and handles DPR/resize
    E.canvas(el, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var ax = E.axes(ctx, {x: 0, y: 0, w: w, h: h}, {
        xmin: 0, xmax: 10, ymin: 0, ymax: 10,
        xlabel: "x", ylabel: "y"
      });
      E.line(ctx, [[ax.sx(0), ax.sy(0)], [ax.sx(10), ax.sy(10)]], {color: E.palette().blue});
    });

    // 3. return the teaching payload
    return {
      readout: E.readout([["x", E.fmt(x, 2), "V"]]),
      status: "R değişti; x = 2R. Nedeni: ...",
      tone: "ok",
      aria: "x = " + E.fmt(x, 2) + " volt.",
      print: "x = " + E.fmt(x, 2) + " V (statik yedek)."
    };
  });

  E.check("myengine: x=2 for r=1", function () { return true; });
})();
```

Rules:

- `compute` must be a small pure block (numbers/series), separate from drawing.
- Do not read the DOM in the computation except through `s`.
- Do not use `innerHTML` with user input.
- Use `E.fmt` for numbers, `E.palette()` for colours, `E.axes`/`E.logAxes`
  for axes, `E.line`/`E.dot`/`E.label` for marks.
- Do not hard-code pixel widths; use the `w`, `h` passed to the draw function.
- Keep the engine under ~200 lines; split or reuse core helpers above that.
- Every engine ends with 2–4 `E.check(...)` invariants.

## 4. Core helpers

| Helper | Use |
|---|---|
| `E.$`, `E.$$` | scoped query |
| `E.fmt(v, digits)` | number formatting, no trailing zeros |
| `E.pct`, `E.db`, `E.log10`, `E.Q`, `E.erfc` | engineering math |
| `E.canvas(el, draw)` | DPR-capped, resize-aware canvas |
| `E.axes(ctx, box, opts)` | linear axes; optional `xticks`/`yticks` arrays |
| `E.logAxes(ctx, box, opts)` | log-frequency x axis, linear y |
| `E.line`, `E.dash`, `E.arrow`, `E.label`, `E.dot` | primitives |
| `E.wire`, `E.resistorH/V`, `E.capacitorV`, `E.sourceV`, `E.ground`, `E.junction` | schematics |
| `E.readout(rows)` | `[[label, value, unit], ...]` |
| `E.registerLab(name, fn)` | register engine |
| `E.check(name, fn)` | selftest assertion |

## 5. Authoring checks

- The lab has one idea and one invariant.
- The default state does not reveal the gate answer.
- Every input changes at least one readout.
- The status line names the changed term and the mechanism.
- The readout uses units; no naked numbers.
- The print sentence makes sense without the canvas.
- The canvas is legible at 360 px; labels do not collide.
- The gate unlocks on any choice and explains both correct and wrong.
- `?selftest=1` passes.
- The file has no network request when built with `--offline`.
