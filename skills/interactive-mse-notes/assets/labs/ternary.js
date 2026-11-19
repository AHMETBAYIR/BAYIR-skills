/* ============================================================
   Ternary composition reader + three-phase lever rule
   Lab module for interactive-mse-notes.

   Markup: <div class="mselab" data-mse-lab="ternary"> ... </div>
   Config: a JSON block with class "mselab-config" inside the lab root.

   Everything is vanilla JS. No libraries, no network, no innerHTML.
   The phase map is a schematic isothermal section built from straight
   teaching lines, not a CALPHAD calculation.
   ============================================================ */

(function () {
  "use strict";

  var api = window.__MSE_LABS__;
  if (!api) { console.error("mse-labs.js must load first"); return; }
  var h = api.helpers;

  var PHASES = ["alpha", "beta", "gamma"];
  var PHASE_WORD = { alpha: "alpha", beta: "beta", gamma: "gamma" };

  var DEFAULTS = {
    components: ["A", "B", "C"],
    basis: "at%",
    point: [0.42, 0.30, 0.28],
    corner: 0.85,
    threePhase: {
      alpha: [0.60, 0.20, 0.20],
      beta: [0.20, 0.60, 0.20],
      gamma: [0.20, 0.20, 0.60]
    },
    labels: { alpha: "α", beta: "β", gamma: "γ" }
  };

  /* ---------------- small utilities ---------------- */

  function number(value, fallback) {
    var n = Number(value);
    return isFinite(n) ? n : fallback;
  }

  function normalize3(value, fallback) {
    var out = [];
    if (Array.isArray(value) && value.length === 3) {
      for (var i = 0; i < 3; i += 1) {
        var v = Number(value[i]);
        if (!isFinite(v) || v < -1e-9) return fallback.slice();
        out.push(Math.max(0, v));
      }
      var sum = out[0] + out[1] + out[2];
      if (sum <= 1e-9) return fallback.slice();
      return [out[0] / sum, out[1] / sum, out[2] / sum];
    }
    return fallback.slice();
  }

  function clampBary(p) {
    var a = h.clamp(Number(p[0]) || 0, 0, 1);
    var b = h.clamp(Number(p[1]) || 0, 0, 1 - a);
    return [a, b, 1 - a - b];
  }

  function cssVar(name, fallback) {
    try {
      var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return value || fallback;
    } catch (err) {
      return fallback;
    }
  }

  function triArea(t) {
    return Math.abs(
      (t[1][0] - t[0][0]) * (t[2][1] - t[0][1]) -
      (t[2][0] - t[0][0]) * (t[1][1] - t[0][1])
    ) / 2;
  }

  /* ---------------- phase map geometry ---------------- */

  /**
   * Build the isothermal section from three phase compositions.
   *
   * Barycentric coordinates are (a, b, c) with a + b + c = 1.
   * A is the top vertex, B bottom-left, C bottom-right.
   *
   * The map is a tiling of the Gibbs triangle:
   *   3 single-phase lobes at the corners,
   *   3 two-phase bands along the binary edges,
   *   1 central three-phase triangle.
   *
   * `corner` is the value of the corner component at the point where a
   * single-phase field meets a binary edge (0.85 => the corner field keeps
   * the outer 15% of each adjacent edge).
   */
  function buildMap(cfg) {
    cfg = cfg && typeof cfg === "object" && !Array.isArray(cfg) ? cfg : {};
    var components = DEFAULTS.components.slice();
    if (Array.isArray(cfg.components) && cfg.components.length === 3) {
      components = cfg.components.map(function (value, i) {
        return typeof value === "string" && value.trim() ? value.trim() : DEFAULTS.components[i];
      });
    }

    var labels = {};
    PHASES.forEach(function (key) {
      var given = cfg.labels && cfg.labels[key];
      labels[key] = typeof given === "string" && given.trim() ? given.trim() : DEFAULTS.labels[key];
    });

    var tri = PHASES.map(function (key) {
      var raw = cfg.threePhase && cfg.threePhase[key];
      return normalize3(raw, DEFAULTS.threePhase[key]);
    });
    if (triArea(tri) < 1e-4) {
      tri = PHASES.map(function (key) { return DEFAULTS.threePhase[key].slice(); });
    }

    var basis = typeof cfg.basis === "string" && cfg.basis.trim() ? cfg.basis.trim() : DEFAULTS.basis;

    /* The phase compositions must sit inside the corner fields, otherwise
       the lobes fold over themselves. Push the corner outward if needed. */
    var selfMax = Math.max(tri[0][0], tri[1][1], tri[2][2]);
    var corner = h.clamp(number(cfg.corner, DEFAULTS.corner), 0.34, 0.98);
    if (corner <= selfMax + 1e-6) corner = Math.min(0.98, selfMax + 0.08);

    var alphaV = tri[0];
    var betaV = tri[1];
    var gammaV = tri[2];

    /* points on the binary edges where the two-phase bands start */
    var pAB = [corner, 1 - corner, 0];       /* alpha side of A-B */
    var qAB = [1 - corner, corner, 0];       /* beta side of A-B */
    var pAC = [corner, 0, 1 - corner];       /* alpha side of A-C */
    var qAC = [1 - corner, 0, corner];       /* gamma side of A-C */
    var pBC = [0, corner, 1 - corner];       /* beta side of B-C */
    var qBC = [0, 1 - corner, corner];       /* gamma side of B-C */

    var lobes = {
      alpha: [[1, 0, 0], pAB, alphaV, pAC],
      beta: [[0, 1, 0], qAB, betaV, pBC],
      gamma: [[0, 0, 1], qAC, gammaV, qBC]
    };

    /* Each band is a quadrilateral ordered
         [boundary point of end 0, boundary point of end 1,
          vertex of end 1, vertex of end 0]
       The bilinear patch between the binary edge (v = 0) and the
       invariant tie line (v = 1) defines a family of tie lines that
       works for any three phase compositions, not just a symmetric map. */
    var bands = [
      {
        key: "alpha+beta",
        pair: ["alpha", "beta"],
        poly: [pAB, qAB, betaV, alphaV]
      },
      {
        key: "beta+gamma",
        pair: ["beta", "gamma"],
        poly: [pBC, qBC, gammaV, betaV]
      },
      {
        key: "gamma+alpha",
        pair: ["gamma", "alpha"],
        poly: [qAC, pAC, alphaV, gammaV]
      }
    ];

    return {
      components: components,
      basis: basis,
      labels: labels,
      corner: corner,
      tri: tri,
      lobes: lobes,
      bands: bands
    };
  }

  /* ---------------- geometry tests in composition space ---------------- */

  function pointOnSegment(x, y, x1, y1, x2, y2, tol) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var len2 = dx * dx + dy * dy;
    if (len2 < 1e-18) return Math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1)) <= tol;
    var t = ((x - x1) * dx + (y - y1) * dy) / len2;
    if (t < -1e-9 || t > 1 + 1e-9) return false;
    var px = x1 + t * dx;
    var py = y1 + t * dy;
    return Math.sqrt((x - px) * (x - px) + (y - py) * (y - py)) <= tol;
  }

  function pointInPolygon(p, poly, tol) {
    var x = p[0];
    var y = p[1];
    var inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0];
      var yi = poly[i][1];
      var xj = poly[j][0];
      var yj = poly[j][1];
      if (pointOnSegment(x, y, xi, yi, xj, yj, tol)) return true;
      if ((yi > y) !== (yj > y)) {
        var xint = xi + (xj - xi) * (y - yi) / (yj - yi);
        if (x < xint) inside = !inside;
      }
    }
    return inside;
  }

  function segmentDistance(x, y, x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var len2 = dx * dx + dy * dy;
    var t = len2 < 1e-18 ? 0 : h.clamp(((x - x1) * dx + (y - y1) * dy) / len2, 0, 1);
    var px = x1 + t * dx;
    var py = y1 + t * dy;
    return Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
  }

  function polyDistance(p, poly) {
    if (pointInPolygon(p, poly, 1e-12)) return 0;
    var best = Infinity;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var d = segmentDistance(p[0], p[1], poly[j][0], poly[j][1], poly[i][0], poly[i][1]);
      if (d < best) best = d;
    }
    return best;
  }

  /* ---------------- reading the map ---------------- */

  function classify(p, map) {
    if (pointInPolygon(p, map.tri, 1e-9)) return { kind: "three" };

    for (var i = 0; i < PHASES.length; i += 1) {
      var key = PHASES[i];
      if (pointInPolygon(p, map.lobes[key], 1e-9)) return { kind: "single", phase: key };
    }

    for (var j = 0; j < map.bands.length; j += 1) {
      if (pointInPolygon(p, map.bands[j].poly, 1e-9)) return { kind: "two", band: map.bands[j] };
    }

    /* Should be unreachable when the polygons tile the triangle, but a
       missing-region bug must not blank the lab. */
    var best = { kind: "three" };
    var bestD = polyDistance(p, map.tri);
    PHASES.forEach(function (name) {
      var d = polyDistance(p, map.lobes[name]);
      if (d < bestD) { bestD = d; best = { kind: "single", phase: name }; }
    });
    map.bands.forEach(function (band) {
      var d = polyDistance(p, band.poly);
      if (d < bestD) { bestD = d; best = { kind: "two", band: band }; }
    });
    return best;
  }

  /**
   * Barycentric coordinates of a point with respect to a triangle whose
   * vertices are given in the same composition coordinates. This is the
   * ternary lever rule: w_i is the weight of vertex i, the area of the
   * sub-triangle opposite that vertex divided by the area of the whole.
   */
  function triangleWeights(p, tri) {
    var A = tri[0], B = tri[1], C = tri[2];
    var det = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1]);
    if (Math.abs(det) < 1e-12) return [1 / 3, 1 / 3, 1 / 3];
    var w1 = ((B[1] - C[1]) * (p[0] - C[0]) + (C[0] - B[0]) * (p[1] - C[1])) / det;
    var w2 = ((C[1] - A[1]) * (p[0] - C[0]) + (A[0] - C[0]) * (p[1] - C[1])) / det;
    return [w1, w2, 1 - w1 - w2];
  }

  function normalizeWeights(w) {
    var out = w.map(function (v) { return Math.max(0, v); });
    var sum = out[0] + out[1] + out[2];
    if (sum <= 1e-12) return [1 / 3, 1 / 3, 1 / 3];
    return [out[0] / sum, out[1] / sum, out[2] / sum];
  }

  /**
   * Invert the bilinear patch
   *   P(u,v) = (1-u)(1-v) pA + u(1-v) pB + u v vB + (1-u) v vA
   * for a point inside a two-phase band. u runs from the end-0 boundary
   * (u = 0) to the end-1 boundary (u = 1); v runs from the binary edge
   * (v = 0) to the invariant tie line (v = 1). Newton's method on the two
   * independent composition coordinates converges in a few steps.
   */
  function bilinearInverse(p, pA, pB, vB, vA) {
    var b = [pB[0] - pA[0], pB[1] - pA[1]];
    var c = [vA[0] - pA[0], vA[1] - pA[1]];
    var d = [pA[0] - pB[0] - vA[0] + vB[0], pA[1] - pB[1] - vA[1] + vB[1]];
    var u = 0.5;
    var v = 0.5;
    for (var n = 0; n < 24; n += 1) {
      var fx = pA[0] + b[0] * u + c[0] * v + d[0] * u * v - p[0];
      var fy = pA[1] + b[1] * u + c[1] * v + d[1] * u * v - p[1];
      var j11 = b[0] + d[0] * v;
      var j12 = c[0] + d[0] * u;
      var j21 = b[1] + d[1] * v;
      var j22 = c[1] + d[1] * u;
      var det = j11 * j22 - j12 * j21;
      if (Math.abs(det) < 1e-14) break;
      var du = (-fx * j22 + fy * j12) / det;
      var dv = (-fy * j11 + fx * j21) / det;
      u = h.clamp(u + du, 0, 1);
      v = h.clamp(v + dv, 0, 1);
      if (Math.abs(du) + Math.abs(dv) < 1e-13) break;
    }
    return { u: u, v: v };
  }

  function lerp3(a, b, t) {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t
    ];
  }

  function centroidOf(poly) {
    var c = [0, 0, 0];
    poly.forEach(function (v) {
      c[0] += v[0];
      c[1] += v[1];
      c[2] += v[2];
    });
    return [c[0] / poly.length, c[1] / poly.length, c[2] / poly.length];
  }

  /* ---------------- display rounding ---------------- */

  /**
   * Round three fractions to tenths of a percent with the largest-remainder
   * method, so the displayed values always add to exactly 100.0.
   */
  function tenths(values) {
    var raw = values.map(function (v) { return Math.max(0, v) * 1000; });
    var floors = raw.map(function (v) { return Math.floor(v); });
    var used = floors[0] + floors[1] + floors[2];
    var extra = Math.round(1000 - used);
    var order = raw.map(function (v, i) {
      return { i: i, frac: v - Math.floor(v) };
    }).sort(function (x, y) { return y.frac - x.frac; });
    var out = floors.slice();
    for (var n = 0; n < extra; n += 1) out[order[n % order.length].i] += 1;
    return out;
  }

  function pctTenths(t) {
    return (t / 10).toFixed(1) + "%";
  }

  /* Two-phase fractions need the same guarantee: the displayed pair must
     add to 100.0, so round the first and derive the second. */
  function tenthsPair(f1, f2) {
    var t1 = Math.round(h.clamp(f1, 0, 1) * 1000);
    return [t1, 1000 - t1];
  }

  function one(t) {
    return (t / 10).toFixed(1);
  }

  function residualText(v) {
    if (v * 100 < 1e-9) return "< 1e-9 pp";
    return h.fmt(v * 100, 6) + " pp";
  }

  function compText(p, map) {
    var t = tenths(p);
    return map.components[0] + " " + one(t[0]) + " · " +
      map.components[1] + " " + one(t[1]) + " · " +
      map.components[2] + " " + one(t[2]);
  }

  function joinPhases(map, keys) {
    return keys.map(function (key) { return map.labels[key]; }).join(" + ");
  }

  function regionLabel(map, info) {
    if (info.kind === "three") return joinPhases(map, PHASES);
    if (info.kind === "two") return joinPhases(map, info.band.pair);
    return map.labels[info.phase];
  }

  function basisSentence(map) {
    var b = String(map.basis || "").toLowerCase();
    if (b.indexOf("at") === 0 || b.indexOf("atom") === 0) {
      return "Because the axes are in " + map.basis + ", these are atomic fractions.";
    }
    if (b.indexOf("wt") === 0 || b.indexOf("mass") === 0) {
      return "Because the axes are in " + map.basis + ", these are mass fractions.";
    }
    if (b.indexOf("mol") === 0 || b.indexOf("mole") === 0) {
      return "Because the axes are in " + map.basis + ", these are molar fractions.";
    }
    return "The fractions use the same basis as the axes (" + map.basis + ").";
  }

  /* ---------------- canvas geometry ---------------- */

  function geometry(w, hgt) {
    var narrow = w < 420;
    var left = narrow ? 40 : 62;
    var top = narrow ? 20 : 24;
    var bottom = narrow ? 54 : 76;
    var availW = Math.max(120, w - 2 * left);
    var availH = Math.max(120, hgt - top - bottom);
    var side = Math.min(availW, availH / (Math.sqrt(3) / 2));
    var height = side * Math.sqrt(3) / 2;
    var cx = w / 2;
    var y0 = top + Math.max(0, (availH - height) / 2);
    return {
      side: side,
      height: height,
      cx: cx,
      cy: y0 + height / 2,
      A: { x: cx, y: y0 },
      B: { x: cx - side / 2, y: y0 + height },
      C: { x: cx + side / 2, y: y0 + height }
    };
  }

  function screenBary(pt, geo) {
    var A = geo.A, B = geo.B, C = geo.C;
    var det = (A.x - C.x) * (B.y - C.y) - (B.x - C.x) * (A.y - C.y);
    if (Math.abs(det) < 1e-9) return [1 / 3, 1 / 3, 1 / 3];
    var a = ((pt.x - C.x) * (B.y - C.y) - (B.x - C.x) * (pt.y - C.y)) / det;
    var b = ((A.x - C.x) * (pt.y - C.y) - (pt.x - C.x) * (A.y - C.y)) / det;
    return [a, b, 1 - a - b];
  }

  function closestOnSegment(pt, p1, p2) {
    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;
    var len2 = dx * dx + dy * dy;
    var t = len2 < 1e-18 ? 0 : h.clamp(((pt.x - p1.x) * dx + (pt.y - p1.y) * dy) / len2, 0, 1);
    return { x: p1.x + t * dx, y: p1.y + t * dy };
  }

  function compositionFromScreen(pt, geo) {
    var raw = screenBary(pt, geo);
    if (raw[0] >= -1e-6 && raw[1] >= -1e-6 && raw[2] >= -1e-6) {
      return clampBary(raw);
    }
    var edges = [[geo.A, geo.B], [geo.B, geo.C], [geo.C, geo.A]];
    var best = null;
    var bestD = Infinity;
    edges.forEach(function (edge) {
      var q = closestOnSegment(pt, edge[0], edge[1]);
      var d = (q.x - pt.x) * (q.x - pt.x) + (q.y - pt.y) * (q.y - pt.y);
      if (d < bestD) { bestD = d; best = q; }
    });
    return clampBary(screenBary(best, geo));
  }

  /* ============================================================
     Lab
     ============================================================ */

  function init(root) {
    var cfg = h.readConfig(root);
    if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) cfg = {};
    var canvas = h.$("[data-canvas]", root);
    var controls = h.$("[data-controls]", root);
    if (!canvas || !controls) return;

    var map = buildMap(cfg);
    var state = {
      p: clampBary(normalize3(cfg.point, DEFAULTS.point)),
      showMap: cfg.showPhaseMap !== false,
      showGrid: cfg.showGrid !== false
    };

    var aInput = null;
    var bInput = null;
    var view = null;

    function formatPercent(v) {
      return h.fmt(v, 1) + "%";
    }

    function syncRange(input, value, format) {
      if (!input) return;
      input.value = String(Math.round(value * 1000) / 1000);
      var out = input.parentNode ? input.parentNode.querySelector("output") : null;
      if (out) out.textContent = format(value);
    }

    function setComposition(p) {
      state.p = clampBary(p);
      syncRange(aInput, state.p[0] * 100, formatPercent);
      syncRange(bInput, state.p[1] * 100, formatPercent);
      render();
    }

    function render() {
      var size = h.setupCanvas(canvas, 460);
      var ctx = size.ctx;
      var pal = h.palette();
      var gammaColor = cssVar("--mse-gamma", pal.ex);
      var w = size.w;
      var hgt = size.h;
      var geo = geometry(w, hgt);
      var colors = { alpha: pal.alpha, beta: pal.beta, gamma: gammaColor };
      var p = state.p;
      view = geo;

      ctx.fillStyle = pal.sheet;
      ctx.fillRect(0, 0, w, hgt);

      function screen(v) {
        return {
          x: v[0] * geo.A.x + v[1] * geo.B.x + v[2] * geo.C.x,
          y: v[0] * geo.A.y + v[1] * geo.B.y + v[2] * geo.C.y
        };
      }

      function fillPoly(poly, color, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        poly.forEach(function (v, i) {
          var s = screen(v);
          if (i === 0) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
        });
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
      }

      function strokePoly(poly, color, width, dash) {
        ctx.save();
        ctx.beginPath();
        poly.forEach(function (v, i) {
          var s = screen(v);
          if (i === 0) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
        });
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width || 1;
        if (dash) ctx.setLineDash(dash);
        ctx.stroke();
        ctx.restore();
      }

      function seg(u, v, color, width, dash, alpha) {
        var s1 = screen(u);
        var s2 = screen(v);
        ctx.save();
        if (alpha !== undefined && alpha !== null) ctx.globalAlpha = alpha;
        h.line(ctx, s1.x, s1.y, s2.x, s2.y, color, width, dash);
        ctx.restore();
      }

      function outward(p1, p2) {
        var dx = p2.x - p1.x;
        var dy = p2.y - p1.y;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var nx = dy / len;
        var ny = -dx / len;
        var mx = (p1.x + p2.x) / 2;
        var my = (p1.y + p2.y) / 2;
        if ((mx - geo.cx) * nx + (my - geo.cy) * ny < 0) { nx = -nx; ny = -ny; }
        return { x: nx, y: ny };
      }

      function arrowHead(a, b, color) {
        var ang = Math.atan2(b.y - a.y, b.x - a.x);
        var s = 5.2;
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - s * Math.cos(ang - 0.42), b.y - s * Math.sin(ang - 0.42));
        ctx.lineTo(b.x - s * Math.cos(ang + 0.42), b.y - s * Math.sin(ang + 0.42));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      function axisTitle(p1, p2, n, text, offset) {
        var mx = (p1.x + p2.x) / 2 + n.x * offset;
        var my = (p1.y + p2.y) / 2 + n.y * offset;
        var angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        if (angle > Math.PI / 2 || angle < -Math.PI / 2) angle += Math.PI;
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(angle);
        ctx.font = '600 9px "IBM Plex Sans", system-ui, sans-serif';
        ctx.fillStyle = pal.muted;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, 0, 0);
        ctx.restore();
      }

      /* ---- grid: one family per component, every 10% ---- */
      if (state.showGrid) {
        for (var g = 1; g <= 9; g += 1) {
          var t = g / 10;
          seg([t, 1 - t, 0], [t, 0, 1 - t], pal.grid, 1, null);       /* A = t */
          seg([1 - t, t, 0], [0, t, 1 - t], pal.grid, 1, null);       /* B = t */
          seg([1 - t, 0, t], [0, 1 - t, t], pal.grid, 1, null);       /* C = t */
        }
      }

      /* ---- phase map ---- */
      if (state.showMap) {
        map.bands.forEach(function (band) {
          fillPoly(band.poly, pal.rule, 0.42);
        });
        PHASES.forEach(function (key) {
          fillPoly(map.lobes[key], colors[key], 0.22);
        });
        fillPoly(map.tri, pal.accentSoft, 0.9);

        /* internal phase boundaries */
        PHASES.forEach(function (key) {
          var lobe = map.lobes[key];
          seg(lobe[1], lobe[2], pal.ink, 1.25, null);
          seg(lobe[2], lobe[3], pal.ink, 1.25, null);
        });
        strokePoly(map.tri, pal.ink, 1.5, null);

        /* the three phase compositions at the invariant triangle */
        map.tri.forEach(function (v, i) {
          var s = screen(v);
          h.dot(ctx, s.x, s.y, 2.8, colors[PHASES[i]], pal.sheet);
        });
      }

      /* ---- Gibbs triangle outline ---- */
      strokePoly([[1, 0, 0], [0, 1, 0], [0, 0, 1]], pal.ink, 1.8, null);

      /* ---- constant-composition guides through the point ---- */
      var a = p[0], b = p[1], c = p[2];
      seg([a, 1 - a, 0], [a, 0, 1 - a], pal.accent, 1, [4, 4], 0.32);
      seg([1 - b, b, 0], [0, b, 1 - b], pal.accent, 1, [4, 4], 0.32);
      seg([1 - c, 0, c], [0, 1 - c, c], pal.accent, 1, [4, 4], 0.32);

      /* ---- ticks and axis arrows ---- */
      function drawScale(p1, p2, component, offset) {
        var n = outward(p1, p2);
        var i, tt, x, y;
        for (i = 1; i <= 9; i += 1) {
          tt = i / 10;
          x = p1.x + (p2.x - p1.x) * tt;
          y = p1.y + (p2.y - p1.y) * tt;
          h.line(ctx, x, y, x + n.x * 4.5, y + n.y * 4.5, pal.ruleStrong, 1, null);
          if (i % 2 === 0) {
            h.label(ctx, String(i * 10), x + n.x * (offset - 8), y + n.y * (offset - 8) + 3,
              pal.muted, 8.5, "center", "alphabetic");
          }
        }
        var q1 = {
          x: p1.x + (p2.x - p1.x) * 0.06 + n.x * offset,
          y: p1.y + (p2.y - p1.y) * 0.06 + n.y * offset
        };
        var q2 = {
          x: p1.x + (p2.x - p1.x) * 0.94 + n.x * offset,
          y: p1.y + (p2.y - p1.y) * 0.94 + n.y * offset
        };
        h.line(ctx, q1.x, q1.y, q2.x, q2.y, pal.muted, 1, null);
        arrowHead(q1, q2, pal.muted);
        axisTitle(p1, p2, n, component + ", " + map.basis, offset + 13);
      }

      var narrow = w < 420;
      var scaleOffset = narrow ? 18 : 28;

      /* A increases from B to A, B from C to B, C from A to C. */
      drawScale(geo.B, geo.A, map.components[0], scaleOffset);
      drawScale(geo.C, geo.B, map.components[1], scaleOffset);
      drawScale(geo.A, geo.C, map.components[2], scaleOffset);

      /* ---- vertex letters ---- */
      h.label(ctx, map.components[0], geo.A.x, geo.A.y - 11, pal.ink, 13, "center", "middle", 700);
      h.label(ctx, map.components[1], geo.B.x - 12, geo.B.y + 15, pal.ink, 13, "center", "middle", 700);
      h.label(ctx, map.components[2], geo.C.x + 12, geo.C.y + 15, pal.ink, 13, "center", "middle", 700);

      /* ---- region names ---- */
      if (state.showMap) {
        PHASES.forEach(function (key) {
          var lobe = map.lobes[key];
          var cen = [0, 0, 0];
          lobe.forEach(function (v) {
            cen[0] += v[0]; cen[1] += v[1]; cen[2] += v[2];
          });
          var n = lobe.length;
          var s = screen([cen[0] / n, cen[1] / n, cen[2] / n]);
          h.label(ctx, map.labels[key], s.x, s.y, colors[key], 13, "center", "middle", 700);
        });

        map.bands.forEach(function (band) {
          var cen = [0, 0, 0];
          band.poly.forEach(function (v) {
            cen[0] += v[0]; cen[1] += v[1]; cen[2] += v[2];
          });
          var n = band.poly.length;
          var s = screen([cen[0] / n, cen[1] / n, cen[2] / n]);
          h.label(ctx, joinPhases(map, band.pair), s.x, s.y, pal.ink2, 8.5, "center", "middle", 600);
        });

        var c0 = [0, 0, 0];
        map.tri.forEach(function (v) {
          c0[0] += v[0]; c0[1] += v[1]; c0[2] += v[2];
        });
        var centroid = [c0[0] / 3, c0[1] / 3, c0[2] / 3];
        /* Keep the region label away from the alloy point: when the point
           sits near the centroid, a label there would be unreadable. */
        var candidates = [centroid].concat(map.tri.map(function (v) {
          return lerp3(centroid, v, 0.42);
        }));
        var anchor = centroid;
        var anchorD = -1;
        candidates.forEach(function (cand) {
          var dx = cand[0] - p[0];
          var dy = cand[1] - p[1];
          var dz = cand[2] - p[2];
          var d = dx * dx + dy * dy + dz * dz;
          if (d > anchorD) { anchorD = d; anchor = cand; }
        });
        var cs = screen(anchor);
        h.label(ctx, joinPhases(map, PHASES), cs.x, cs.y, pal.ink2, 9, "center", "middle", 600);
      }

      /* ---- classification and construction ---- */
      var info = state.showMap ? classify(p, map) : null;

      if (info && info.kind === "three") {
        var weights = normalizeWeights(triangleWeights(p, map.tri));
        var ps = screen(p);
        map.tri.forEach(function (v, i) {
          var s = screen(v);
          h.line(ctx, ps.x, ps.y, s.x, s.y, colors[PHASES[i]], 1.3, [3, 3]);
        });
        var rep = [0, 0, 0];
        for (var i2 = 0; i2 < 3; i2 += 1) {
          for (var j2 = 0; j2 < 3; j2 += 1) {
            rep[j2] += weights[i2] * map.tri[i2][j2];
          }
        }
        info = { kind: "three", weights: weights, reproduced: rep };
      } else if (info && info.kind === "two") {
        var band = info.band;
        var pA = band.poly[0];
        var pB = band.poly[1];
        var vA = band.poly[3];
        var vB = band.poly[2];
        var uv = bilinearInverse(p, pA, pB, vB, vA);
        var e1 = lerp3(pA, vA, uv.v);
        var e2 = lerp3(pB, vB, uv.v);
        var f1 = 1 - uv.u;
        var f2 = uv.u;
        var ends = [
          { phase: band.pair[0], x: e1, f: f1 },
          { phase: band.pair[1], x: e2, f: f2 }
        ];
        var rep2 = [0, 0, 0];
        for (var k2 = 0; k2 < 3; k2 += 1) {
          rep2[k2] = ends[0].f * ends[0].x[k2] + ends[1].f * ends[1].x[k2];
        }
        info = { kind: "two", band: band, ends: ends, reproduced: rep2, bilinear: uv };
      }

      /* ---- draw the construction ---- */
      if (info && info.kind === "two") {
        var s1 = screen(info.ends[0].x);
        var s2 = screen(info.ends[1].x);
        h.line(ctx, s1.x, s1.y, s2.x, s2.y, pal.accent, 2.4, null);
        h.dot(ctx, s1.x, s1.y, 3.4, pal.accent, pal.sheet);
        h.dot(ctx, s2.x, s2.y, 3.4, pal.accent, pal.sheet);
        var ps0 = screen(p);
        var placeTieLabel = function (pe, text) {
          var dx = pe.x - ps0.x;
          var dy = pe.y - ps0.y;
          var len = Math.sqrt(dx * dx + dy * dy) || 1;
          h.label(ctx, text, pe.x + (dx / len) * 11, pe.y + (dy / len) * 11,
            pal.ink2, 9, "center", "middle", 600);
        };
        placeTieLabel(s1, map.labels[info.ends[0].phase]);
        placeTieLabel(s2, map.labels[info.ends[1].phase]);
      }

      /* ---- the composition point ---- */
      var pxy = screen(p);
      h.dot(ctx, pxy.x, pxy.y, 5.2, pal.accent, pal.sheet);

      /* Current composition chip, pinned to the empty top-left corner so
         it cannot cover the point or a region label. */
      var tag = compText(p, map);
      ctx.save();
      ctx.font = '600 9px "IBM Plex Sans", system-ui, sans-serif';
      var tagWidth = ctx.measureText(tag).width;
      ctx.globalAlpha = 0.94;
      ctx.fillStyle = pal.sheet;
      ctx.fillRect(10, 8, tagWidth + 22, 20);
      ctx.globalAlpha = 1;
      ctx.fillStyle = pal.accent;
      ctx.fillRect(10, 8, 3, 20);
      ctx.restore();
      h.label(ctx, tag, 20, 22, pal.ink2, 9, "left", "alphabetic", 600);

      /* ---- readout ---- */
      var ten = tenths(p);
      var rows = [
        [map.components[0], pctTenths(ten[0])],
        [map.components[1], pctTenths(ten[1])],
        [map.components[2], pctTenths(ten[2])],
        ["Σ composition", "100.0%"],
        ["Basis", map.basis]
      ];

      var statusText;
      var aria = "Ternary composition triangle. " + map.components[0] + " " + one(ten[0]) +
        " percent, " + map.components[1] + " " + one(ten[1]) +
        " percent, " + map.components[2] + " " + one(ten[2]) + " percent.";

      if (!state.showMap) {
        rows.push(["Phase map", "hidden"]);
        statusText = "Phase map hidden. Read the composition from the gridlines: " +
          map.components[0] + " is the height above the " + map.components[1] + "–" + map.components[2] +
          " edge; " + map.components[1] + " and " + map.components[2] +
          " are read along the other two families. Toggle the map back on to check the region and the phase fractions.";
      } else {
        rows.push(["Region", regionLabel(map, info)]);
        aria += " Region " + regionAria(map, info) + ".";

        if (info.kind === "three") {
          var ft = tenths(info.weights);
          rows.push(["f " + map.labels.alpha, pctTenths(ft[0])]);
          rows.push(["f " + map.labels.beta, pctTenths(ft[1])]);
          rows.push(["f " + map.labels.gamma, pctTenths(ft[2])]);
          rows.push(["Σ f", "1.000"]);
          rows.push(["Reproduces", compText(info.reproduced, map)]);
          rows.push(["Max residual", residualText(residualOf(info.reproduced, p))]);
          aria += " Phase fractions " + map.labels.alpha + " " + one(ft[0]) +
            " percent, " + map.labels.beta + " " + one(ft[1]) +
            " percent, " + map.labels.gamma + " " + one(ft[2]) + " percent.";

          statusText = "The point lies inside the " + joinPhases(map, PHASES) +
            " triangle. The three phase fractions are its barycentric coordinates with respect to that triangle: " +
            "each fraction is the area of the sub-triangle opposite the vertex divided by the area of the whole triangle. " +
            basisSentence(map) + " They sum to 1.000, and " + weightExpression(info.weights, map) +
            " returns " + compText(p, map) + " (residual " +
            residualText(residualOf(info.reproduced, p)) + ").";
        } else if (info.kind === "two") {
          var ft2 = tenthsPair(info.ends[0].f, info.ends[1].f);
          rows.push(["f " + map.labels[info.ends[0].phase], pctTenths(ft2[0])]);
          rows.push(["f " + map.labels[info.ends[1].phase], pctTenths(ft2[1])]);
          rows.push(["Tie-line ends", map.labels[info.ends[0].phase] + " ↔ " + map.labels[info.ends[1].phase]]);
          rows.push([map.labels[info.ends[0].phase] + " end", compText(info.ends[0].x, map)]);
          rows.push([map.labels[info.ends[1].phase] + " end", compText(info.ends[1].x, map)]);
          rows.push(["Σ f", "1.000"]);
          rows.push(["Max residual", residualText(residualOf(info.reproduced, p))]);
          aria += " Two-phase region. Phase fractions " +
            map.labels[info.ends[0].phase] + " " + one(ft2[0]) + " percent, " +
            map.labels[info.ends[1].phase] + " " + one(ft2[1]) + " percent.";
          statusText = "The point lies in the " + joinPhases(map, info.band.pair) +
            " two-phase band. The tie line through the point cuts the " +
            map.labels[info.ends[0].phase] + " and " + map.labels[info.ends[1].phase] +
            " boundaries. Lever rule along that tie line: f(" + map.labels[info.ends[0].phase] + ") = " +
            h.fmt(info.ends[0].f, 3) + ", f(" + map.labels[info.ends[1].phase] + ") = " +
            h.fmt(info.ends[1].f, 3) + ". " + basisSentence(map) +
            " The fractions sum to 1 and reproduce the alloy composition (residual " +
            residualText(residualOf(info.reproduced, p)) + ").";
        } else {
          rows.push(["f " + map.labels[info.phase], "1.000"]);
          rows.push(["Phase composition", compText(p, map)]);
          aria += " Single-phase " + PHASE_WORD[info.phase] + " field.";
          statusText = "The point lies inside the " + map.labels[info.phase] +
            " single-phase field. There is only one phase, so no tie line and no lever rule are needed: " +
            "the phase composition equals the alloy composition, " + compText(p, map) +
            ". A single-phase field is a region of solid solubility, not a compound of fixed composition.";
        }
      }

      h.setReadout(root, rows);
      h.setStatus(root, statusText);
      h.setAria(canvas, aria);
    }

    function residualOf(reproduced, p) {
      return Math.max(
        Math.abs(reproduced[0] - p[0]),
        Math.abs(reproduced[1] - p[1]),
        Math.abs(reproduced[2] - p[2])
      );
    }

    function weightExpression(weights, map) {
      return h.fmt(weights[0], 3) + " " + map.labels.alpha + " + " +
        h.fmt(weights[1], 3) + " " + map.labels.beta + " + " +
        h.fmt(weights[2], 3) + " " + map.labels.gamma;
    }

    function regionAria(map, info) {
      if (info.kind === "three") return PHASES.map(function (k) { return PHASE_WORD[k]; }).join(" plus ");
      if (info.kind === "two") return info.band.pair.map(function (k) { return PHASE_WORD[k]; }).join(" plus ");
      return PHASE_WORD[info.phase];
    }

    /* ---------------- controls ---------------- */

    h.addSelect(controls, {
      label: "Jump to",
      value: "three",
      options: [
        { value: "three", label: "Inside " + map.labels.alpha + "+" + map.labels.beta + "+" + map.labels.gamma },
        { value: "band", label: "Inside " + map.labels.alpha + "+" + map.labels.beta + " band" },
        { value: "corner", label: "Inside " + map.labels.alpha + " corner" },
        { value: "edge", label: "On the " + map.components[0] + "–" + map.components[1] + " edge" }
      ],
      onChange: function (value) {
        if (value === "band") {
          setComposition(centroidOf(map.bands[0].poly));
        } else if (value === "corner") {
          setComposition(centroidOf(map.lobes.alpha));
        } else if (value === "edge") {
          var band = map.bands[0];
          setComposition(lerp3(band.poly[0], band.poly[1], 0.5));
        } else {
          setComposition(centroidOf(map.tri));
        }
      }
    });

    aInput = h.addRange(controls, {
      label: "Component " + map.components[0],
      min: 0, max: 100, step: 0.1, value: state.p[0] * 100,
      format: formatPercent,
      onInput: function (v) {
        setComposition([v / 100, Math.min(state.p[1], 1 - v / 100), 0]);
      }
    });

    bInput = h.addRange(controls, {
      label: "Component " + map.components[1],
      min: 0, max: 100, step: 0.1, value: state.p[1] * 100,
      format: formatPercent,
      onInput: function (v) {
        setComposition([Math.min(state.p[0], 1 - v / 100), v / 100, 0]);
      }
    });

    h.addToggle(controls, {
      label: "Phase map",
      value: state.showMap,
      onChange: function (value) { state.showMap = value; render(); }
    });

    h.addToggle(controls, {
      label: "Gridlines",
      value: state.showGrid,
      onChange: function (value) { state.showGrid = value; render(); }
    });

    h.addButton(controls, {
      label: "Reset point", ghost: true,
      onClick: function () {
        setComposition(normalize3(cfg.point, DEFAULTS.point));
      }
    });

    h.bindPointer(canvas, function (pt) {
      if (!view) return;
      setComposition(compositionFromScreen(pt, view));
    });

    h.addHint(root,
      "Click or drag anywhere in the triangle. The " + map.components[0] + " and " +
      map.components[1] + " sliders are the keyboard path; " + map.components[2] +
      " = 100 − " + map.components[0] + " − " + map.components[1] +
      ". Turn the phase map off to practise reading the composition first, then back on to check the region.");

    api.onRender(render);
    render();
  }

  api.register("ternary", init);
  api.init();
})();
