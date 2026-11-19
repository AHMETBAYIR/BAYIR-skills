# Lab markup and configuration

Every lab is a `<div class="mathlab" data-math-lab="...">` containing a JSON config block. The JavaScript builds the controls and readout, so the HTML stays short.

## 1. Generic shell

```html
<div class="mathlab" data-math-lab="plot">
  <div class="mathlab__head">
    <p class="mathlab__eyebrow">Lab 01 · derivative</p>
    <h3>Short lab title</h3>
    <p>One sentence: what the learner should try.</p>
  </div>

  <details class="predict">
    <summary>Predict first</summary>
    <p>Ask for a commitment before the controls reveal the answer.</p>
  </details>

  <div class="mathlab__controls" data-controls></div>

  <div class="mathlab__grid">
    <div class="mathlab__viz">
      <div class="mathlab__canvas-wrap">
        <canvas class="mathlab__canvas" data-canvas data-height="380"
                role="img" aria-label="Describe the figure for a screen reader"></canvas>
      </div>
      <p class="mathlab__caption">What the axes, colors, and markers mean.</p>
    </div>
    <div class="mathlab__panel">
      <div class="mathlab__readout" data-readout></div>
      <p class="mathlab__status" data-status role="status" aria-live="polite"></p>
      <div class="mathlab__table" data-table></div>
      <p class="mathlab__hint" data-hint></p>
    </div>
  </div>

  <p class="mathlab__print">Static sentence for the printed page.</p>

  <script type="application/json" class="mathlab-config">
    {"f": "x^3 - 3*x", "xmin": -3, "xmax": 3}
  </script>
</div>
```

- `data-canvas` is required.
- `data-canvas2` is optional (surface contour map).
- `data-readout`, `data-status`, `data-table`, `data-hint` are optional but recommended.
- `data-height` is the CSS-pixel height; the script handles device pixel ratio.
- Always include `role="img"` and an `aria-label` on the canvas.

## 2. `plot` — secant to tangent

```html
<div class="mathlab" data-math-lab="plot">
  ...
  <script type="application/json" class="mathlab-config">
    {
      "f": "x^3 - 3*x",
      "df": "3*x^2 - 3",
      "xmin": -3, "xmax": 3,
      "ymin": -8, "ymax": 8,
      "x0": 1, "h": 1,
      "label": "f(x) = x³ − 3x"
    }
  </script>
</div>
```

- `f` (required): expression in `x`.
- `df` (optional): analytic derivative; if absent, a central difference is used.
- `xmin`, `xmax`, `x0`, `h`: required in practice.
- `ymin`, `ymax` (optional): if absent, the view auto-ranges.
- `label` (optional): a short label drawn on the canvas.

**Expression syntax:** `+ - * / ^`, `sin cos tan asin acos atan exp log log10 sqrt abs min max pow floor ceil round sign sinh cosh tanh`, constants `pi`/`PI`, `e`/`E`. `ln(x)` is accepted and maps to `log(x)`. Expressions are authored content, not learner input.

## 3. `riemann` — sums and order

```html
<div class="mathlab" data-math-lab="riemann">
  ...
  <script type="application/json" class="mathlab-config">
    {
      "f": "sin(x) + 1.2",
      "a": 0, "b": 3.141592653589793,
      "n": 4, "method": "midpoint"
    }
  </script>
</div>
```

- `f`, `a`, `b` required.
- `n` default 4; `method` one of `left`, `right`, `midpoint`, `trapezoid`, `simpson`.
- `exact` (optional number): if absent, a 2000-panel Simpson reference is used. If you state an exact value in prose, pass it here.
- The table computes errors for `n = 4, 8, 16, 32, 64`.

## 4. `slope` — slope field + Euler/Heun/RK4

```html
<div class="mathlab" data-math-lab="slope">
  ...
  <script type="application/json" class="mathlab-config">
    {
      "f": "y - x",
      "xmin": -0.2, "xmax": 2.2,
      "ymin": -3, "ymax": 3,
      "x0": 0, "y0": 0.5,
      "h": 0.25, "xend": 2,
      "exact": "x + 1 - 0.5*exp(x)"
    }
  </script>
</div>
```

- `f` is `y' = f(x,y)`.
- `x0`, `y0` initial condition; `xend` integration endpoint.
- `exact` optional; expression in `x`.
- Drag vertically to change `y0`; the sliders and buttons are the keyboard path.
- The table shows the last six steps.

## 5. `phase` — 2×2 linear systems

```html
<div class="mathlab" data-math-lab="phase">
  ...
  <script type="application/json" class="mathlab-config">
    {"a": -0.4, "b": 1, "c": -1, "d": -0.4, "range": 3, "preset": "stable spiral"}
  </script>
</div>
```

- Matrix `[[a,b],[c,d]]`.
- `range` is the half-width of the view.
- Presets: `stable node`, `saddle`, `center`, `stable spiral`, `unstable spiral`, `shear`.
- Click adds a trajectory (up to six).

## 6. `surface` — 3D surface + contour

```html
<div class="mathlab" data-math-lab="surface">
  ...
  <div class="mathlab__grid">
    <div class="mathlab__viz">
      <div class="mathlab__canvas-wrap">
        <canvas class="mathlab__canvas" data-canvas data-height="430" role="img" aria-label="3D surface"></canvas>
      </div>
    </div>
    <div class="mathlab__panel">
      <div class="mathlab__readout" data-readout></div>
      <p class="mathlab__status" data-status role="status" aria-live="polite"></p>
      <div class="mathlab__canvas-wrap" style="margin-top:0.8rem">
        <canvas class="mathlab__canvas mathlab__canvas--small" data-canvas2 data-height="235" role="img" aria-label="Contour map"></canvas>
      </div>
    </div>
  </div>
  <script type="application/json" class="mathlab-config">
    {
      "f": "x^2 + y^2",
      "xmin": -2, "xmax": 2, "ymin": -2, "ymax": 2,
      "x0": 0.8, "y0": 0.6,
      "preset": "paraboloid"
    }
  </script>
</div>
```

- Presets: `paraboloid`, `saddle`, `gaussian`, `ripples`, `cone`, `monkey saddle`.
- Drag the main canvas to orbit; drag the contour canvas to move `P`.
- The readout includes `f`, `f_x`, `f_y`, `|∇f|`, and the tangent-plane equation.
- The normal arrow uses an exaggerated vertical component so it remains visible; the printed equation is the quantitative claim.

## 7. `root` — bisection / Newton / secant

```html
<div class="mathlab" data-math-lab="root">
  ...
  <script type="application/json" class="mathlab-config">
    {
      "f": "x^3 - x - 2",
      "df": "3*x^2 - 1",
      "a": 1, "b": 2,
      "x0": 1.5, "x1": 1.6,
      "tol": 0.000001,
      "root": 1.5213797068045676
    }
  </script>
</div>
```

- `a`, `b` bracket; `x0` Newton start; `x1` secant second point.
- `df` optional; numeric derivative if absent.
- `root` optional; if present, the table reports the true error. If absent, it reports a step/bracket estimate.
- “Compare all” runs all three methods at the current tolerance.

## 8. `interp` — Lagrange interpolation

```html
<div class="mathlab" data-math-lab="interp">
  ...
  <script type="application/json" class="mathlab-config">
    {
      "f": "1/(1+25*x^2)",
      "xmin": -1, "xmax": 1,
      "n": 11, "dist": "equidistant",
      "preset": "Runge 1/(1+25x²)"
    }
  </script>
</div>
```

- `dist` is `equidistant` or `chebyshev`.
- Presets: `Runge 1/(1+25x²)`, `sin(3x)`, `exp(x)`, `|x|`.
- The readout reports the maximum error on the interval and the node spacing.
- The error curve is scaled into the lower band; it is not on the same vertical scale as `f`.

## 9. `matrix` — 2D linear map

```html
<div class="mathlab" data-math-lab="matrix">
  ...
  <script type="application/json" class="mathlab-config">
    {"a": 1, "b": 0.5, "c": 0.2, "d": 1, "vx": 1.2, "vy": 0.7, "preset": "identity"}
  </script>
</div>
```

- Presets: `identity`, `rotate 30°`, `shear`, `reflect x`, `project onto x`, `scale 1.5`.
- Drag the grey vector; the angle slider is the keyboard alternative.
- The readout reports `det`, area scale, and eigenvalues.

## 10. Quiz

```html
<div class="quiz" data-math-quiz data-quiz-id="topic-1">
  <div class="quiz__bar">
    <span data-quiz-progress>0 / 6 answered</span>
    <span data-quiz-score>0 correct</span>
  </div>
  <div data-quiz-questions></div>
  <div class="quiz__footer">
    <button type="button" class="btn" data-quiz-retry hidden>Retry missed</button>
    <button type="button" class="btn btn--ghost" data-quiz-reset>Reset</button>
  </div>
  <script type="application/json" class="quiz-data">
    [
      {
        "prompt": "Question text",
        "options": ["A", "B", "C", "D"],
        "answer": 1,
        "explain": "Why B is right and why the others are plausible mistakes."
      }
    ]
  </script>
</div>
```

- `data-quiz-id` is the localStorage key; keep it stable.
- `answer` is a zero-based index.
- Write the explanation before the distractors.
- Use plain text or Unicode; KaTeX in quiz prompts is not auto-rendered after the quiz builds. Keep quiz math simple.

## 11. Static print figure

```html
<figure class="figure figure--print-only">
  <div class="figure__canvas">
    <img src="../figures/topic.svg" alt="Describe the figure">
  </div>
  <figcaption><span class="figure__label"></span>Generated with MATLAB, Octave, or MatLivre; the interactive lab is the primary figure.</figcaption>
</figure>
```

The build script inlines local SVG files. It namespaces SVG ids so two figures can coexist on one page.

## 12. Validation

```bash
python3 "$SKILL/scripts/validate_note.py" ~/notes/math/topic.html
```

The validator checks structure, lab config JSON, canvas hooks, quiz data, duplicate ids, print CSS, and unresolved placeholders. It cannot check the mathematics; do that separately.
