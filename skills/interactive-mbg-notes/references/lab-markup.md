# MBG lab markup

A lab is a `<div class="mbglab" data-mbg-lab="KIND">` containing a head, a prediction, controls, a canvas, a readout, a status line, and a JSON config. The engine reads the config and wires the controls.

## Minimal copy-paste

```html
<div class="mbglab" data-mbg-lab="replication">
  <div class="mbglab__head">
    <p class="mbglab__eyebrow">Lab 01 · replikasyon</p>
    <h3>Origin sayısını değiştir, süreyi oku</h3>
    <p>Genom boyutu, origin sayısı ve çatal hızı replikasyon süresini belirler.</p>
  </div>
  <details class="predict"><summary>Önce tahmin et</summary>
    <p>50 000 origin ile süre 20 dk ise, 1 origin ile kaç yıl olur?</p>
  </details>
  <div class="mbglab__controls" data-controls></div>
  <div class="mbglab__grid">
    <div class="mbglab__viz">
      <div class="mbglab__canvas-wrap">
        <canvas class="mbglab__canvas" data-canvas data-height="340" role="img"
                aria-label="Replikasyon kabarcıkları ve çatal ilerlemesi"></canvas>
      </div>
      <p class="mbglab__caption">Her origin iki yönlü bir kabarcık açar; ölçek gösterim amaçlıdır.</p>
    </div>
    <div class="mbglab__panel">
      <div class="mbglab__readout" data-readout></div>
      <p class="mbglab__status" data-status role="status" aria-live="polite"></p>
      <p class="mbglab__hint" data-hint></p>
    </div>
  </div>
  <p class="mbglab__print">Baskı özeti: T = G/(2vN); 3.1 Gb, 50 000 origin, 1.5 kb/dk → 20.7 dk.</p>
  <script type="application/json" class="mbglab-config">{"G":3.1,"N":50000,"v":1.5}</script>
</div>
```

Every lab needs:

- `data-mbg-lab` on the root, matching `KNOWN_LABS` in `validate_note.py`;
- `data-controls`, `data-canvas`, `data-readout`, `data-status`;
- a `<details class="predict">` prompt;
- an `<h3>` title;
- an `aria-label` and `role="img"` on the canvas;
- a `<script class="mbglab-config">` JSON object (may be `{}`);
- a `.mbglab__print` fallback sentence.

## Config schemas

| Lab | Keys | Defaults | Notes |
|---|---|---|---|
| `replication` | `G` (Gb), `N` (int), `v` (kb/min), `okazaki` (nt), `mu` | 3.1, 50000, 1.5, 150, 1e-9 | progress is a separate slider |
| `splicing` | `mode` (`normal`/`skip2`/`retain1`/`alt3`), `strength` (0–100) | normal, 80 | synthetic 3-exon gene |
| `codon` | `seq` (string), `frame` (0–2), `code` (`std`/`mito`) | ATG…TAA, 0, std | sequence is sanitised to ACGTN |
| `operon` | `lac` (mM), `glc` (mM) | 0, 10 | teaching rate model |
| `hwe` | `p`, `N`, `s`, seed not exposed | 0.5, 1000, 0 | Wright–Fisher, 100 generations |
| `punnett` | `cross` (`mono`/`test`/`dihybrid`), `n` | mono, 160 | sampled, not hard-coded |
| `plasmid` | `G` (bp), `enzymes` (object) | 2686, all true | pUC19 sites fixed |
| `pcr` | `primer`, `cycles`, `eff`, `amplicon` | ATG…, 30, 0.9, 500 | Wallace + GC Tm |
| `crispr` | `seq`, `pam` (`NGG`/`NAG`), `mismatches`, `G` | synthetic 69 nt, NGG, 3, 3.1 | both strands scanned |

## Engine API

```js
window.__MBG_LABS__ = {
  register(kind, init),
  onRender(fn),
  init(),
  rerender(),
  palette(),
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
    var state = Object.assign({ n: 10 }, window.__MBG_LABS__.helpers.readConfig(root));
    function draw() {
      var c = window.__MBG_LABS__.helpers.setupCanvas(canvas, 340);
      // draw with c.ctx, c.w, c.h
      window.__MBG_LABS__.helpers.setReadout(root, [["n", String(state.n)]]);
      window.__MBG_LABS__.helpers.setStatus(root, "Why the number is what it is.");
    }
    window.__MBG_LABS__.helpers.addRange(controls, {
      label: "n", min: 1, max: 100, step: 1, value: state.n,
      format: function (v) { return v.toFixed(0); },
      onInput: function (v) { state.n = v; draw(); }
    });
    window.__MBG_LABS__.onRender(draw);
    draw();
  };
  window.__MBG_LABS__.register("myLab", LAB.myLab);
  window.__MBG_LABS__.init();
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
- Long sequences wrap; never shrink below 10 px font to fit a whole locus on one line.

## Print

The stylesheet hides controls, hints, and quiz buttons in print. The canvas remains as the current state. Add a `.mbglab__print` sentence with the key number so the printout is self-contained.

## Accessibility

- Canvas: `role="img"` + `aria-label` that changes with state.
- Status: `role="status"` + `aria-live="polite"`.
- Controls: native `<input type="range">`, `<select>`, `<button>`, `<input type="text">`; label wraps the control.
- Keyboard: Tab reaches every control; focus-visible outline is defined.
- Reduced motion: transitions are suppressed by the stylesheet.
- Do not encode a category by hue alone; add text, hatch, or a shape.
