/* ============================================================
   micro — synthetic micrograph + linear-intercept grain size
   Deterministic jittered-hex Voronoi field, no external image.
   Load after mse-labs.js. Registers one lab: data-mse-lab="micro".

   Config: {"seed":7,"fieldUm":500,"grain":55,"angle":0,
            "showBoundaries":true}
   fieldUm is one of 250, 500, 1000 µm. grain is 0 (coarse) … 100 (fine).
   ============================================================ */

(function () {
  "use strict";

  var api = window.__MSE_LABS__;
  if (!api) {
    console.error("mse-labs.js must load first");
    return;
  }
  var h = api.helpers;

  var DEFAULT_FIELD_UM = 500;  /* default specimen field width and height, micrometres */
  var DEFAULT_SEED = 7;
  var DEFAULT_GRAIN = 55;      /* 0 coarse … 100 fine */
  var ASTMA = -6.6438;
  var ASTMB = -3.288;
  var EPS_BORDER = 1e-7;
  var QUANT = 1e5;             /* edge-key quantisation, 1e-5 field units */

  /* ---------------- seeded PRNG ---------------- */

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hash32(i, j, seed) {
    var n = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(seed, 1442695041)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177) | 0;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  /* ---------------- geometry ---------------- */

  /* Keep the part of a convex polygon where (p - m)·n <= 0.
     This is the half-plane nearer to c than to the neighbour at c + n. */
  function clipHalf(poly, mx, my, nx, ny) {
    var out = [];
    for (var i = 0; i < poly.length; i += 1) {
      var A = poly[i];
      var B = poly[(i + 1) % poly.length];
      var da = (A.x - mx) * nx + (A.y - my) * ny;
      var db = (B.x - mx) * nx + (B.y - my) * ny;
      if (da <= 0) out.push(A);
      if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
        var t = da / (da - db);
        out.push({ x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t });
      }
    }
    return out;
  }

  function polygonArea(poly) {
    var sum = 0;
    for (var i = 0; i < poly.length; i += 1) {
      var A = poly[i];
      var B = poly[(i + 1) % poly.length];
      sum += A.x * B.y - B.x * A.y;
    }
    return Math.abs(sum) / 2;
  }

  function onSameBorder(A, B) {
    return (Math.abs(A.x) < EPS_BORDER && Math.abs(B.x) < EPS_BORDER) ||
      (Math.abs(A.x - 1) < EPS_BORDER && Math.abs(B.x - 1) < EPS_BORDER) ||
      (Math.abs(A.y) < EPS_BORDER && Math.abs(B.y) < EPS_BORDER) ||
      (Math.abs(A.y - 1) < EPS_BORDER && Math.abs(B.y - 1) < EPS_BORDER);
  }

  function edgeKey(A, B) {
    var ax = Math.round(A.x * QUANT);
    var ay = Math.round(A.y * QUANT);
    var bx = Math.round(B.x * QUANT);
    var by = Math.round(B.y * QUANT);
    if (ax > bx || (ax === bx && ay > by)) {
      var tx = ax, ty = ay;
      ax = bx; ay = by; bx = tx; by = ty;
    }
    return ax + "," + ay + "|" + bx + "," + by;
  }

  function pitchUmFor(value) {
    /* 75 µm lattice pitch at 0, 20 µm at 100 */
    return 75 - 0.55 * value;
  }

  /* ---------------- field construction ---------------- */

  function buildField(seed, pitch) {
    var rand = mulberry32((seed >>> 0) ^ 0x9E3779B9);
    var dy = pitch * Math.sqrt(3) / 2;
    var jmin = -2;
    var jmax = Math.ceil(1 / dy) + 2;
    var imin = -2;
    var imax = Math.ceil(1 / pitch) + 2;
    var map = {};
    var centers = [];
    var i, j;

    for (j = jmin; j <= jmax; j += 1) {
      for (i = imin; i <= imax; i += 1) {
        /* draw the jitter for every lattice point so the sequence depends
           only on the seed, not on which points fall inside the field */
        var jx = (rand() - 0.5) * 0.52 * pitch;
        var jy = (rand() - 0.5) * 0.52 * pitch;
        var cx = i * pitch + ((j & 1) ? pitch / 2 : 0) + jx;
        var cy = j * dy + jy;
        if (cx < -0.6 || cx > 1.6 || cy < -0.6 || cy > 1.6) continue;
        var c = { i: i, j: j, x: cx, y: cy };
        map[i + "," + j] = c;
        centers.push(c);
      }
    }

    var polygons = [];
    var edges = [];
    var seen = {};
    var di, dj, k;

    centers.forEach(function (c) {
      if (c.x < -0.25 || c.x > 1.25 || c.y < -0.25 || c.y > 1.25) return;
      var poly = [
        { x: 0, y: 0 }, { x: 1, y: 0 },
        { x: 1, y: 1 }, { x: 0, y: 1 }
      ];
      for (dj = -2; dj <= 2; dj += 1) {
        for (di = -2; di <= 2; di += 1) {
          if (di === 0 && dj === 0) continue;
          var n = map[(c.i + di) + "," + (c.j + dj)];
          if (!n) continue;
          var nx = n.x - c.x;
          var ny = n.y - c.y;
          poly = clipHalf(poly, (c.x + n.x) / 2, (c.y + n.y) / 2, nx, ny);
          if (poly.length < 3) break;
        }
        if (poly.length < 3) break;
      }
      if (poly.length < 3 || polygonArea(poly) < 1e-9) return;

      polygons.push({
        poly: poly,
        tint: hash32(c.i, c.j, seed)
      });

      for (k = 0; k < poly.length; k += 1) {
        var A = poly[k];
        var B = poly[(k + 1) % poly.length];
        if (onSameBorder(A, B)) continue; /* specimen edge, not a grain boundary */
        var key = edgeKey(A, B);
        if (seen[key]) continue;
        seen[key] = true;
        edges.push({ a: { x: A.x, y: A.y }, b: { x: B.x, y: B.y } });
      }
    });

    return {
      key: seed + ":" + pitch.toFixed(6),
      seed: seed,
      pitch: pitch,
      polygons: polygons,
      edges: edges,
      count: polygons.length
    };
  }

  /* ---------------- line geometry ---------------- */

  function chordOf(anchor, radians) {
    var dx = Math.cos(radians);
    var dy = Math.sin(radians);
    var t0 = -Infinity;
    var t1 = Infinity;
    var ta, tb, tmp;

    if (Math.abs(dx) < 1e-12) {
      if (anchor.x < -1e-9 || anchor.x > 1 + 1e-9) return null;
    } else {
      ta = (0 - anchor.x) / dx;
      tb = (1 - anchor.x) / dx;
      if (ta > tb) { tmp = ta; ta = tb; tb = tmp; }
      t0 = Math.max(t0, ta);
      t1 = Math.min(t1, tb);
    }

    if (Math.abs(dy) < 1e-12) {
      if (anchor.y < -1e-9 || anchor.y > 1 + 1e-9) return null;
    } else {
      ta = (0 - anchor.y) / dy;
      tb = (1 - anchor.y) / dy;
      if (ta > tb) { tmp = ta; ta = tb; tb = tmp; }
      t0 = Math.max(t0, ta);
      t1 = Math.min(t1, tb);
    }

    if (!isFinite(t0) || !isFinite(t1) || t1 - t0 < 1e-9) return null;
    return {
      t0: t0,
      t1: t1,
      dx: dx,
      dy: dy,
      p0: { x: anchor.x + dx * t0, y: anchor.y + dy * t0 },
      p1: { x: anchor.x + dx * t1, y: anchor.y + dy * t1 }
    };
  }

  function intersections(field, anchor, chord) {
    var hits = [];
    var dx = chord.dx;
    var dy = chord.dy;
    var lo = chord.t0 + 2e-4;
    var hi = chord.t1 - 2e-4;
    var tol = 1e-6;

    field.edges.forEach(function (edge) {
      var A = edge.a;
      var B = edge.b;
      var ex = B.x - A.x;
      var ey = B.y - A.y;
      var den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-12) return;
      var ax = A.x - anchor.x;
      var ay = A.y - anchor.y;
      var t = (ax * ey - ay * ex) / den;
      if (t <= lo || t >= hi) return;
      var u = (ax * dy - ay * dx) / den;
      if (u < 0 || u > 1) return;
      for (var i = 0; i < hits.length; i += 1) {
        if (Math.abs(hits[i].t - t) < tol) return; /* shared vertex: count once */
      }
      hits.push({ t: t, edge: edge, x: anchor.x + dx * t, y: anchor.y + dy * t });
    });

    hits.sort(function (p, q) { return p.t - q.t; });
    return hits;
  }

  /* ---------------- lab ---------------- */

  function init(root) {
    var cfg = h.readConfig(root);
    var canvas = h.$("[data-canvas]", root);
    var controls = h.$("[data-controls]", root);
    if (!canvas || !controls) return;

    var state = {
      seed: Number(cfg.seed) || DEFAULT_SEED,
      fieldUm: Number(cfg.fieldUm) || DEFAULT_FIELD_UM,
      grain: cfg.grain === undefined ? DEFAULT_GRAIN : h.clamp(Number(cfg.grain), 0, 100),
      angle: cfg.angle === undefined ? 0 : h.clamp(Number(cfg.angle), 0, 180),
      anchor: { x: 0.5, y: 0.5 },
      showBoundaries: cfg.showBoundaries === undefined ? true : !!cfg.showBoundaries,
      geom: null
    };
    var cache = null;
    if (state.fieldUm !== 250 && state.fieldUm !== 500 && state.fieldUm !== 1000) {
      state.fieldUm = DEFAULT_FIELD_UM;
    }

    function field() {
      var pitchNorm = pitchUmFor(state.grain) / state.fieldUm;
      var key = state.seed + ":" + pitchNorm.toFixed(6);
      if (!cache || cache.key !== key) cache = buildField(state.seed, pitchNorm);
      return cache;
    }

    function render() {
      var f = field();
      var rect = canvas.getBoundingClientRect();
      var cssW = Math.round(rect.width || (canvas.parentNode && canvas.parentNode.clientWidth) || 640);
      var canvasH = Math.round(h.clamp(cssW * 0.92 + 96, 320, 470));
      var size = h.setupCanvas(canvas, canvasH);
      var ctx = size.ctx;
      var pal = h.palette();
      var w = size.w;
      var hgt = size.h;
      var margin = { l: 16, r: 16, t: 26, b: 64 };
      var fieldPx = Math.min(w - margin.l - margin.r, hgt - margin.t - margin.b);
      if (fieldPx < 160) fieldPx = 160;
      var fx = (w - fieldPx) / 2;
      var fy = margin.t;
      var umPerPx = state.fieldUm / fieldPx;
      state.geom = { fx: fx, fy: fy, fieldPx: fieldPx };

      function X(nx) { return fx + nx * fieldPx; }
      function Y(ny) { return fy + ny * fieldPx; }

      ctx.fillStyle = pal.sheet;
      ctx.fillRect(0, 0, w, hgt);

      /* grain fills: a subtle deterministic tint per grain, batched by tint level */
      var buckets = [[], [], [], [], [], []];
      f.polygons.forEach(function (grain) {
        var level = Math.min(5, Math.floor(grain.tint * 6));
        buckets[level].push(grain.poly);
      });
      ctx.save();
      ctx.fillStyle = pal.ink;
      buckets.forEach(function (group, level) {
        if (!group.length) return;
        ctx.globalAlpha = 0.018 + 0.062 * ((level + 0.5) / 6);
        ctx.beginPath();
        group.forEach(function (poly) {
          ctx.moveTo(X(poly[0].x), Y(poly[0].y));
          for (var i = 1; i < poly.length; i += 1) ctx.lineTo(X(poly[i].x), Y(poly[i].y));
          ctx.closePath();
        });
        ctx.fill();
      });
      ctx.restore();

      /* grain boundaries, one batched path */
      if (state.showBoundaries) {
        ctx.save();
        ctx.strokeStyle = pal.ink2;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        f.edges.forEach(function (edge) {
          ctx.moveTo(X(edge.a.x), Y(edge.a.y));
          ctx.lineTo(X(edge.b.x), Y(edge.b.y));
        });
        ctx.stroke();
        ctx.restore();
      }

      /* measurement chord */
      var radians = state.angle * Math.PI / 180;
      var ch = chordOf(state.anchor, radians);
      var hits = ch ? intersections(f, state.anchor, ch) : [];
      var lengthUm = ch ? (ch.t1 - ch.t0) * state.fieldUm : 0;
      var n = hits.length;
      var meanUm = n > 0 ? lengthUm / n : NaN;
      var meanMm = meanUm / 1000;
      var G = n > 0 ? ASTMA * Math.log10(meanMm) + ASTMB : NaN;

      if (state.showBoundaries) {
        hits.forEach(function (hit) {
          h.line(ctx, X(hit.edge.a.x), Y(hit.edge.a.y), X(hit.edge.b.x), Y(hit.edge.b.y), pal.accent, 1.7, null);
        });
      }

      if (ch) {
        var x0 = X(ch.p0.x), y0 = Y(ch.p0.y);
        var x1 = X(ch.p1.x), y1 = Y(ch.p1.y);
        h.line(ctx, x0, y0, x1, y1, pal.accent, 1.9, null);

        /* end ticks perpendicular to the line */
        var tick = 5;
        var nx = -Math.sin(radians);
        var ny = Math.cos(radians);
        h.line(ctx, x0 - nx * tick, y0 - ny * tick, x0 + nx * tick, y0 + ny * tick, pal.accent, 1.6, null);
        h.line(ctx, x1 - nx * tick, y1 - ny * tick, x1 + nx * tick, y1 + ny * tick, pal.accent, 1.6, null);

        hits.forEach(function (hit) {
          h.dot(ctx, X(hit.x), Y(hit.y), 2.6, pal.accent, pal.sheet);
        });
      }

      /* specimen frame + labels */
      ctx.save();
      ctx.strokeStyle = pal.ruleStrong;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(fx, fy, fieldPx, fieldPx);
      ctx.restore();

      h.label(ctx, "synthetic field · " + state.fieldUm + " × " + state.fieldUm + " µm", fx, fy - 9, pal.muted, 9.5, "left");
      h.label(ctx, "θ = " + h.fmt(state.angle, 0) + "° · seed " + state.seed,
        fx + fieldPx, fy - 9, pal.muted, 9.5, "right");

      /* scale bar */
      var barUm = state.fieldUm <= 250 ? 50 : 100;
      var barPx = barUm / umPerPx;
      var bx = fx + 4;
      var by = fy + fieldPx + 26;
      h.line(ctx, bx, by, bx + barPx, by, pal.ink, 3, null);
      h.line(ctx, bx, by - 5, bx, by + 5, pal.ink, 1.5, null);
      h.line(ctx, bx + barPx, by - 5, bx + barPx, by + 5, pal.ink, 1.5, null);
      h.label(ctx, barUm + " µm", bx + barPx / 2, by - 8, pal.ink2, 9.5, "center");
      h.label(ctx, h.fmt(umPerPx, 2) + " µm/px", fx + fieldPx, by + 16, pal.muted, 9.5, "right");
      h.label(ctx, "lattice pitch " + h.fmt(pitchUmFor(state.grain), 0) + " µm",
        bx, by + 16, pal.muted, 9.5, "left");

      /* readout */
      h.setReadout(root, [
        ["Field", state.fieldUm + " × " + state.fieldUm + " µm"],
        ["Scale", h.fmt(umPerPx, 2) + " µm/px"],
        ["Lattice pitch (model)", h.fmt(pitchUmFor(state.grain), 0) + " µm"],
        ["Line length", h.fmt(lengthUm, 0) + " µm"],
        ["Intersections", h.fmtInt(n)],
        ["Mean intercept L", n > 0 ? h.fmt(meanUm, 1) + " µm" : "—"],
        ["ASTM G", n > 0 ? h.fmt(G, 2) : "—"],
        ["Seed", String(state.seed)]
      ]);

      /* status */
      var status;
      if (!ch) {
        status = "The measurement line falls outside the field. Drag it back across the grains.";
      } else if (n === 0) {
        status = "This traverse crossed no internal grain boundary: the chord sits inside one grain, or the count is too low to mean anything. Move the line or choose finer grains.";
      } else {
        status = "One traverse of " + h.fmt(lengthUm, 0) + " µm crossed " + n +
          " grain boundaries, so L = " + h.fmt(lengthUm, 0) + " / " + n + " = " + h.fmt(meanUm, 1) +
          " µm = " + h.fmt(meanMm, 4) + " mm. ASTM E112: G = −6.6438 log₁₀(L/mm) − 3.288 = " +
          h.fmt(G, 2) + ". The field is synthetic (jittered hexagonal grains, seed " + state.seed +
          "), not a micrograph, and one line is one sample: " +
          (n < 8 ? "at this count the scatter is large — rotate the line or press New field." :
            "rotate the line and change the field to see the scatter.");
      }
      h.setStatus(root, status);

      h.setAria(canvas,
        "Synthetic micrograph, seed " + state.seed + ", " + state.fieldUm + " by " + state.fieldUm +
        " micrometre field, lattice pitch " + h.fmt(pitchUmFor(state.grain), 0) +
        " micrometres. Measurement line at " + h.fmt(state.angle, 0) + " degrees crosses " + n +
        " grain boundaries over " + h.fmt(lengthUm, 0) + " micrometres. Mean intercept " +
        (n > 0 ? h.fmt(meanUm, 1) + " micrometres, ASTM grain size " + h.fmt(G, 2) : "not defined") +
        ".");

      /* printed state follows the current measurement */
      var printEl = h.$(".mselab__print", root);
      if (printEl) {
        printEl.textContent = "Printed state: seed " + state.seed + ", " + state.fieldUm + " × " + state.fieldUm +
          " µm field, " + h.fmt(state.angle, 0) + "° traverse of " + h.fmt(lengthUm, 0) +
          " µm crossing " + n + " boundaries; L = " +
          (n > 0 ? h.fmt(meanUm, 1) + " µm, ASTM G = " + h.fmt(G, 2) : "—") +
          ". The field is a synthetic jittered-hex tiling; one traverse is a sample.";
      }
    }

    /* ---------------- controls ---------------- */

    h.addRange(controls, {
      label: "Grain size (coarse → fine)",
      min: 0, max: 100, step: 1, value: state.grain,
      format: function (v) { return h.fmt(pitchUmFor(v), 0) + " µm pitch"; },
      onInput: function (v) { state.grain = v; render(); }
    });

    h.addSelect(controls, {
      label: "Field width",
      value: String(state.fieldUm),
      options: [
        { value: "250", label: "250 µm (high mag)" },
        { value: "500", label: "500 µm (standard)" },
        { value: "1000", label: "1000 µm (low mag)" }
      ],
      onChange: function (value) { state.fieldUm = Number(value); render(); }
    });

    var angleInput = h.addRange(controls, {
      label: "Line angle",
      min: 0, max: 180, step: 1, value: state.angle,
      format: function (v) { return h.fmt(v, 0) + "°"; },
      onInput: function (v) { state.angle = v; render(); }
    });

    h.addToggle(controls, {
      label: "Show boundaries",
      value: state.showBoundaries,
      onChange: function (value) { state.showBoundaries = value; render(); }
    });

    h.addButton(controls, {
      label: "New field · seed + 1",
      onClick: function () {
        state.seed += 1;
        render();
      }
    });

    h.addButton(controls, {
      label: "Reset line",
      ghost: true,
      onClick: function () {
        state.anchor.x = 0.5;
        state.anchor.y = 0.5;
        state.angle = 0;
        angleInput.value = "0";
        angleInput.dispatchEvent(new Event("input"));
        render();
      }
    });

    h.bindPointer(canvas, function (p) {
      var g = state.geom;
      if (!g) return;
      var nx = (p.x - g.fx) / g.fieldPx;
      var ny = (p.y - g.fy) / g.fieldPx;
      state.anchor.x = h.clamp(nx, 0.01, 0.99);
      state.anchor.y = h.clamp(ny, 0.01, 0.99);
      render();
    });

    h.addHint(root,
      "Drag on the field to slide the line; the angle slider rotates it. The lattice pitch is not L: " +
      "a line enters and leaves each grain, so the mean intercept is roughly half the pitch. One traverse " +
      "is one sample — count several lines or fields before trusting G.");

    api.onRender(render);
    render();
  }

  api.register("micro", init);
  api.init();
})();
