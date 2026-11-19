# Lab markup and configuration

Every lab is a `<div class="mselab" data-mse-lab="...">`. The JavaScript builds the controls and the readout, so the HTML stays short. A lab without `data-canvas` or `data-controls` will not initialise.

## 1. Generic shell

```html
<div class="mselab" data-mse-lab="KIND">
  <div class="mselab__head">
    <p class="mselab__eyebrow">Lab 01 · topic</p>
    <h3>Short title that names the action</h3>
    <p>One sentence: what the learner should change and notice.</p>
  </div>

  <details class="predict">
    <summary>Predict first</summary>
    <p>Ask for a commitment before the controls reveal the answer.</p>
  </details>

  <div class="mselab__controls" data-controls></div>

  <div class="mselab__grid">
    <div class="mselab__viz">
      <div class="mselab__canvas-wrap">
        <canvas class="mselab__canvas" data-canvas data-height="380"
                role="img" aria-label="Describe the figure and the current value"></canvas>
      </div>
      <p class="mselab__caption">What the axes, colours, and markers mean.</p>
    </div>
    <div class="mselab__panel">
      <div class="mselab__readout" data-readout></div>
      <p class="mselab__status" data-status role="status" aria-live="polite"></p>
      <p class="mselab__hint" data-hint></p>
    </div>
  </div>

  <p class="mselab__print">Static sentence with the key number for the printed page.</p>

  <script type="application/json" class="mselab-config">
    {"preset": "..."}
  </script>
</div>
```

- `data-canvas` is required.
- `data-readout`, `data-status`, `data-hint` are optional but recommended.
- `data-height` is CSS pixels; the engine handles device pixel ratio.
- Always include `role="img"` and an `aria-label` on the canvas.
- The JSON block must not contain a literal `</script>`.

## 2. `crystal` — unit cell

```html
<script type="application/json" class="mselab-config">
  {"structure": "fcc", "a": 3.615, "mass": 63.55, "species": "Cu", "showBonds": false}
</script>
```

| Key | Type | Default | Meaning |
|---|---|---|---|
| `structure` | string | `fcc` | `sc`, `bcc`, `fcc`, `diamond`, `nacl` |
| `a` | number | 3.615 | lattice parameter, Å |
| `mass` | number | 63.55 | g/mol per atom or formula unit |
| `showBonds` | boolean | false | draw nearest-neighbour bonds |
| `showPlane` | boolean | false | draw a Miller plane |
| `plane` | [h,k,l] | [1,1,1] | initial plane indices |
| `species` | string | `Cu` | label only; used in the readout |

Readout: structure, `a`, atoms/cell, coordination `Z`, packing fraction, nearest-neighbour distance, density, cell volume, and — when the plane is on — `(hkl)`, `d`, atoms per 2D cell, planar density.

**Plane method:** the lab intersects `h x + k y + l z = 1` with the cell, highlights atom centres on the slice, and computes planar density by reducing the projected atoms modulo the 2D lattice. For FCC Cu: `(100) 0.153`, `(110) 0.108`, `(111) 0.177` atoms/Å².

**Teaching notes:** corner atoms are shared by eight cells. The readout’s “atoms/cell” is the basis count, not the number of spheres drawn. For NaCl, the two species are drawn in different colours; the formula unit is 4 per cell.

## 3. `phase` — binary eutectic diagram

```html
<script type="application/json" class="mselab-config">
  {"preset": "pb-sn"}
</script>
```

Built-in presets: `pb-sn`, `al-si`. To add a system, pass a `presets` object:

```json
{
  "preset": "my-system",
  "presets": {
    "my-system": {
      "name": "A–B (eutectic)",
      "A": "A", "B": "B",
      "tmin": 0, "tmax": 500,
      "tmA": 450, "tmB": 300,
      "xe": 0.45, "te": 200,
      "aMax": 0.12, "bMax": 0.04,
      "x0": 0.30, "t0": 260
    }
  }
}
```

| Key | Meaning |
|---|---|
| `tmA`, `tmB` | melting points of the pure components, °C |
| `xe`, `te` | eutectic composition (fraction of B) and temperature |
| `aMax` | maximum solubility of B in α, fraction |
| `bMax` | maximum solubility of A in β, fraction |
| `x0`, `t0` | initial alloy point |
| `tmin`, `tmax` | axis range |
| `curved` | use the curved teaching fit (default false) |
| `table` | optional imported boundaries (see below) |

**Imported boundaries.** Add a `table` object to render real (e.g. pycalphad) curves instead of the parametric model. All arrays are sorted internally:

```json
{
  "preset": "pb-sn",
  "table": {
    "liquidus":  [[0.0, 327], [0.2, 280], [0.4, 225], [0.619, 183], [0.8, 205], [1.0, 232]],
    "solidusA":  [[183, 0.19], [230, 0.13], [280, 0.06], [327, 0.0]],
    "solidusB":  [[183, 0.97], [210, 0.99], [232, 1.0]],
    "solvusA":   [[0, 0.0], [100, 0.09], [183, 0.19]],
    "solvusB":   [[0, 1.0], [100, 0.985], [183, 0.97]]
  }
}
```

`liquidus` is `[x, T]`; `solidusA/B` and `solvusA/B` are `[T, x]`. The status line reports “imported table”. Generate the table with pycalphad/Thermo-Calc, cite the database and version, and do not call the result “calculated” unless you actually ran it.

**Required extra DOM:** a phase bar and a microstructure canvas inside the lab:

```html
<div class="msebar" data-bar aria-label="Phase fractions"></div>
<canvas data-micro data-height="132" role="img" aria-label="Schematic microstructure"></canvas>
```

The microstructure is a schematic: primary grains plus a eutectic matrix. It is not to scale and does not encode dendrite arm spacing.

## 4. `stress` — engineering/true stress–strain

```html
<script type="application/json" class="mselab-config">
  {"preset": "steel"}
</script>
```

Built-in presets: `steel`, `al`, `nylon`, `cast`. A custom preset:

```json
{
  "preset": "ti",
  "presets": {
    "ti": {"name": "Ti-6Al-4V", "E": 114, "sy": 880, "su": 950, "eu": 0.08, "ef": 0.14, "brittle": false}
  }
}
```

| Key | Unit | Meaning |
|---|---|---|
| `E` | GPa | Young's modulus |
| `sy` | MPa | yield strength (0 for a brittle material) |
| `su` | MPa | ultimate tensile strength |
| `eu` | — | strain at UTS (fraction) |
| `ef` | — | strain at fracture (fraction) |
| `brittle` | boolean | linear elastic to fracture; no yield/offset |

The curve is a teaching model: linear elastic, a power-law hardening branch, and a softening branch after UTS. It is not a tensile-test standard.

## 5. `diffusion` — error-function profile

```html
<script type="application/json" class="mselab-config">
  {"preset": "c-fe"}
</script>
```

Built-in: `c-fe`, `n-fe`, `cu-al`, `h-pd`. Custom:

```json
{
  "preset": "my-diffuser",
  "presets": {
    "my-diffuser": {
      "name": "Zn in Cu", "D0": 3.4e-5, "Q": 191,
      "T": 800, "Cs": 1.0, "C0": 0.0, "xmax": 1500, "gas": "Zn vapour"
    }
  }
}
```

| Key | Unit | Meaning |
|---|---|---|
| `D0` | m²/s | pre-exponential factor |
| `Q` | kJ/mol | activation energy |
| `T` | °C | default temperature |
| `Cs` | wt% | surface concentration |
| `C0` | wt% | initial concentration |
| `xmax` | µm | plot depth |

## 6. `xrd` — powder pattern

```html
<script type="application/json" class="mselab-config">
  {"structure": "fcc", "a": 3.615, "lambda": 1.5406}
</script>
```

| Key | Meaning |
|---|---|
| `structure` | `sc`, `bcc`, `fcc`, `diamond`, `nacl` |
| `a` | lattice parameter, Å |
| `lambda` | wavelength, Å (Cu Kα 1.5406, Co 1.789, Mo 0.7107) |
| `element` | optional override for sc/bcc/fcc/diamond (e.g. `Fe`) |

The pattern is computed from Bragg's law and the cubic `d`-spacing. Intensities use Cromer–Mann form factors (International Tables, Vol C), multiplicity, Lorentz–polarisation, and a Debye–Waller factor `exp(-1.2 s²)`. The lab does not model absorption, texture, strain, or Kα1/Kα2 splitting.

## 7. Quiz

```html
<section class="msequiz" data-mse-quiz data-quiz-id="topic">
  <div class="msequiz__bar">
    <span data-quiz-progress></span>
    <span data-quiz-score></span>
    <button type="button" class="msebtn" data-quiz-retry hidden>Retry missed</button>
    <button type="button" class="msebtn" data-quiz-reset>Reset</button>
  </div>
  <div data-quiz-questions></div>
  <script type="application/json" class="quiz-data">
  [
    {
      "prompt": "Question with a plausible misconception?",
      "options": ["distractor 1", "correct", "distractor 2", "distractor 3"],
      "answer": 1,
      "explain": "Why the correct answer is correct and why the likely distractor is wrong."
    }
  ]
  </script>
</section>
```

- 4–10 questions. Each needs at least 3 options.
- `answer` is the zero-based index of the correct option.
- `explain` is shown after the learner answers. It must name the cause.
- `data-quiz-id` scopes the `localStorage` key. Use a stable, unique id.
- The engine adds an **Export results** button. It downloads a JSON record of the answers and explanations. This is a local record, not a gradebook; collect it through the user's own submission channel.

## 8. Topic-specific lab layer

Keep a custom lab in separate files and inline them:

```bash
python3 scripts/build_note.py \
  --content note.content.html --meta note.meta.json \
  --extra-css topic-labs.css --extra-js topic-labs.js \
  --out ~/notes/mse/topic.html
```

`topic-labs.js` runs after the generic engine. Expose a render function and register it with the kit if you need theme/resize re-rendering:

```js
(function () {
  "use strict";
  function init(root) {
    var canvas = root.querySelector("[data-canvas]");
    // ... draw ...
  }
  document.querySelectorAll('[data-mse-lab="my-lab"]').forEach(init);
})();
```

Do not depend on the internal `LAB` object; it is not a public API. If the custom lab needs the palette, copy the CSS variables or read them with `getComputedStyle`.

## 9. Extension modules (`--labs`)

The five extension labs are separate files in `assets/labs/`:

| Module | Lab | Config (initial) |
|---|---|---|
| `ttt` | TTT/CCT + cooling path | `{"coolingRate": 10, "hold": 0, "mode": "CCT"}` |
| `ashby` | selection chart | `{"preset": "e-rho", "exponent": "0.5", "minProperty": 0, "maxDensity": 20}` |
| `ternary` | composition + 3-phase lever | `{"components": ["A","B","C"], "point": [0.42,0.30,0.28], "threePhase": {...}}` |
| `band` | semiconductor band diagram | `{"material": "si", "type": "n", "doping": 1e16, "temperature": 300}` |
| `micro` | intercept grain size | `{"seed": 7, "fieldUm": 500, "grain": 55, "angle": 0}` |

Load them by name:

```bash
python3 scripts/build_note.py --content note.content.html --meta note.meta.json \
  --labs ttt,ashby,ternary,band,micro --out ~/notes/mse/topic.html
```

Each module calls the public kernel API:

```js
var api = window.__MSE_LABS__;
api.register("ttt", init);   // init(root) builds controls + render()
api.onRender(render);        // re-render on theme/resize
api.init();                  // initialise any not-yet-ready labs
```

The demo fragment and metadata for each module are in `assets/labs/<name>.demo.html` and `.demo.json`; build one with `--labs <name>`.
