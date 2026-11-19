# Lab markup

The builder injects `me-labs.css` and `me-labs.js`. A lab is authored HTML plus, for a custom engine, a small inline script. No framework, no build step inside the note.

## 1. Minimal lab shell

```html
<div class="melab" data-me-lab="section">
  <div class="melab__head">
    <p class="melab__eyebrow">Lab 01 · kesit</p>
    <h3>Aynı alan, farklı kesit</h3>
    <p>Bir cümle: neye bakmalı?</p>
  </div>

  <details class="predict">
    <summary>Tahmin et</summary>
    <p>Yüksekliği iki katına çıkarınca gerilme kaç kat değişir?</p>
  </details>

  <div class="melab__controls" data-controls>
    <label class="mefield">Genişlik b (mm)
      <input type="range" data-param="b" min="10" max="120" step="1"
             value="40" data-default="40">
      <output data-out="b">40</output>
    </label>
    <button type="button" data-reset>Sıfırla</button>
  </div>

  <div class="melab__canvaswrap">
    <canvas data-canvas data-height="320"></canvas>
  </div>
  <p class="melab__caption">Şekil ölçekli; tarafsız eksen kesikli.</p>

  <div class="melab__readout" data-readout></div>
  <p class="melab__status" data-status role="status"></p>
</div>
```

Required hooks: `data-me-lab`, `data-canvas`, `data-controls`, `data-readout`, `data-status`, `data-reset`. The validator warns if one is missing.

## 2. Built-in engine: section

`section` reads `shape` (`rect`, `circle`, `ibeam`), `b`, `h`, `d`, and optionally `bf`, `tf`, `tw`. It computes `A`, `I`, `W`, `r`, and mass per metre for steel, and draws the section with a neutral axis.

```html
<select data-param="shape" data-default="rect">
  <option value="rect">Dikdörtgen</option>
  <option value="circle">Daire</option>
  <option value="ibeam">I kesit</option>
</select>
```

## 3. Custom engine: use `ME.plot`

Put the data-generation in a normal `<script>` after the content. It runs after the lab layer is injected.

```html
<div class="melab" data-me-lab="custom" id="lab-damping">
  <canvas data-canvas data-height="300"></canvas>
  <div class="melab__controls" data-controls>
    <label class="mefield">Sönüm ζ
      <input type="range" data-param="zeta" min="0" max="0.5" step="0.01" value="0.05">
      <output data-out="zeta">0.05</output>
    </label>
  </div>
  <div class="melab__readout" data-readout></div>
  <p class="melab__status" data-status role="status"></p>
</div>

<script>
document.addEventListener("DOMContentLoaded", function () {
  var root = document.getElementById("lab-damping");
  var zeta = root.querySelector("[data-param=zeta]");
  var out = root.querySelector("[data-out=zeta]");
  var readout = root.querySelector("[data-readout]");
  var status = root.querySelector("[data-status]");

  function draw() {
    var z = parseFloat(zeta.value);
    out.textContent = z.toFixed(2);
    var pts = [];
    for (var r = 0; r <= 3; r += 0.02) {
      var x = 1 / Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * z * r, 2));
      pts.push([r, x]);
    }
    ME.plot(root.querySelector("canvas"), {
      xmin: 0, xmax: 3, ymin: 0, ymax: 6,
      xlabel: "frekans oranı r = ω/ωn", ylabel: "X / (F0/k)",
      series: [{ points: pts, color: ME.palette().accent, width: 2 }],
      vlines: [{ x: 1, label: "r = 1" }],
      ariaLabel: "Frekans tepkisi, zeta " + z.toFixed(2)
    });
    var peak = z < Math.SQRT1_2 ? 1 / (2 * z * Math.sqrt(1 - z * z)) : 1;
    readout.innerHTML = "";
    [["ζ", z.toFixed(2)], ["Tepe X/X0", peak.toFixed(2)]].forEach(function (row) {
      var dl = document.createElement("dl");
      var dt = document.createElement("dt"); dt.textContent = row[0];
      var dd = document.createElement("dd"); dd.textContent = row[1];
      dl.appendChild(dt); dl.appendChild(dd); readout.appendChild(dl);
    });
    status.textContent = z === 0
      ? "Sönümsüz: r=1'de sonsuz tepe. Gerçek sistemde her zaman bir miktar sönüm vardır."
      : "Tepe r=1'de değil, r=√(1−2ζ²)≈" + Math.sqrt(Math.max(0, 1 - 2 * z * z)).toFixed(2) + " civarında.";
  }
  zeta.addEventListener("input", draw);
  draw();
});
</script>
```

The inline script must wait for `DOMContentLoaded`: the builder injects `me-labs.js` after the note body, so an immediately-invoked script would run before `ME` exists. Code passed with `--extra-js` is injected after the lab layer and does not need the wrapper.

`ME.plot` options: `xmin/xmax/ymin/ymax`, `xlabel/ylabel`, `series[{points,color,width,dash,type:"area",fill,label}]`, `hlines`, `vlines`, `bands`, `points`, `legend`, `footer`, `ariaLabel`.

## 4. Quiz

```html
<div class="mequiz" data-quiz>
  <div class="mequiz__q" data-answer="c"
       data-explain="W = I/c ve c = h/2 olduğu için W = bh²/6.">
    <p>Dikdörtgen kesitte W nedir?</p>
    <div class="mequiz__opts">
      <button class="mequiz__opt" data-option="a">bh³/12</button>
      <button class="mequiz__opt" data-option="b">bh³/6</button>
      <button class="mequiz__opt" data-option="c">bh²/6</button>
      <button class="mequiz__opt" data-option="d">bh²/12</button>
    </div>
    <p class="mequiz__why" hidden></p>
  </div>
</div>
```

The explanation must say **why**, not only “doğru”. Distractors should be the actual misconceptions.

## 5. Print fallback

- Put the current value in the status line; it prints.
- Add a static sentence before the lab: “Tipik durumda `I = 720 000 mm⁴`, `W = 24 000 mm³`.”
- Controls are hidden by the print stylesheet; the canvas and readout remain.
- Do not split a lab across pages (`break-inside: avoid-page` is already set).

## 6. Accessibility

- Canvas gets `role="img"` and an `aria-label` from the engine or the script.
- The readout is real text, not pixels.
- Keyboard: native inputs are reachable by Tab; the reset button is a `<button type="button">`.
- Do not encode tension/compression by colour alone; add `+`/`−` or “çekme/basınç”.
- Test at 200% zoom and with `prefers-reduced-motion: reduce`.

## 7. Selftest

Add `?selftest=1` to the page URL. The lab layer runs the registered checks and prints `SELFTEST OK` or a list of failures in the console and as a badge. Register a check from note-specific JS:

```js
ME.check("beam: PL/4 at midspan", function () {
  var M = 2000 * 4 / 4;
  return Math.abs(M - 2000) < 1e-9;
});
```

## 8. Built-in engines (v1.1)

All engines use the same shell. The only variable part is `data-me-lab` and the
`data-param` names. Build with `--labs beam,mohr` (or `--labs all`).

```html
<div class="melab" data-me-lab="beam">
  <div class="melab__head">...</div>
  <details class="predict"><summary>Tahmin et</summary><p>...</p></details>
  <div class="melab__controls" data-controls>
    <label class="mefield">Açıklık L (m)
      <input type="range" data-param="L" min="1" max="8" step="0.1" value="4" data-default="4">
      <output data-out="L">4</output>
    </label>
    <button type="button" data-reset>Sıfırla</button>
  </div>
  <div class="melab__canvaswrap"><canvas data-canvas data-height="380"></canvas></div>
  <div class="melab__readout" data-readout></div>
  <p class="melab__status" data-status role="status"></p>
</div>
```

| Engine | `data-param` | Defaults (verified) |
|---|---|---|
| `beam` | `support` (ss/cant), `L`, `P`, `a`, `w`, `E`, `sec` (rect/ibeam), `b`, `h`, `x` | 4 m, 2 kN, a=2, w=0, E=200, 60×100, x=2 |
| `mohr` | `sx`, `sy`, `txy` | 80, −20, 40 MPa |
| `pipe` | `D` (mm), `L` (m), `Q` (L/s), `eps` (mm), `K` | 52.5, 10, 3, 0.045, 4 |
| `fourbar` | `r1..r4` (mm), `th` (deg) | 100, 25, 70, 85, 60 |
| `vibration` | `m` (kg), `k` (kN/m), `z`, `F0` (N), `r` | 2, 20, 0.05, 50, 1 |
| `fit` | `d` (mm, 14.5–50), `hole` (H7/H8), `shaft` (f7/g6/h6/k6/p6) | 30, H7, p6 |
| `fem` | `n`, `L` (m), `A` (mm²), `E` (GPa), `P` (kN), `q` (N/mm), `profile` (uniform/taper) | 4, 1, 100, 200, 10, 0, uniform |

**Units inside the engines.** Beam `w` is N/mm (not kN/m). Pipe `Q` is L/s and
`D`/`eps` are mm. FEM uses N–mm–MPa; `q` is N/mm. Vibration `k` is kN/m and
`F0` is N. Fit uses µm for deviations and mm for limits.

**Checks.** Each engine registers its own `ME.check` assertions; add
`?selftest=1` and expect PASS. The same numbers are in
`scripts/check_me.py` (`beam`, `mohr`, `pipe`, `fourbar`, `vibration`, `fit`,
`fem`). If the page and the Python checker disagree, the page is wrong.

**Important.** `initLab` applies `data-default` on load and on reset. For a
select, put the default in `data-default` as well as `selected`; for a range,
`data-default` is the starting value. An output's precision is set with
`data-digits` on the **input**, not on the output.
