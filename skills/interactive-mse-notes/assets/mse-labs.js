/* ============================================================
   Interactive materials science notes — lab engines
   Vanilla JS, no dependencies, one file, inlined by the builder.

   A lab is declared as:

     <div class="mselab" data-mse-lab="phase">
       ... <canvas data-canvas></canvas> ...
       <script type="application/json" class="mselab-config">
         { "preset": "pb-sn" }
       <\/script>
     </div>

   Config is authored content. It is parsed as JSON, never evaluated.
   ============================================================ */

(function () {
  "use strict";

  var LAB_RENDERS = [];
  var rerenderTimer = null;

  /* ---------------- helpers ---------------- */

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function fmt(value, digits) {
    if (typeof value !== "number" || !isFinite(value)) return "—";
    var d = digits === undefined ? 3 : digits;
    if (Math.abs(value) < 5e-13) value = 0;
    var abs = Math.abs(value);
    if (abs !== 0 && (abs < 1e-3 || abs >= 1e5)) return value.toExponential(2);
    var text = value.toFixed(d);
    if (text.indexOf(".") >= 0) text = text.replace(/0+$/, "").replace(/\.$/, "");
    return text === "-0" ? "0" : text;
  }

  function fmtInt(value) {
    return typeof value === "number" && isFinite(value) ? String(Math.round(value)) : "—";
  }

  function pct(value, digits) {
    return fmt(value * 100, digits === undefined ? 1 : digits) + "%";
  }

  function readCss(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function palette() {
    return {
      ink: readCss("--ink", "#1e1b17"),
      ink2: readCss("--ink-2", "#4d473f"),
      muted: readCss("--muted", "#7d7468"),
      rule: readCss("--rule", "#d8d0c1"),
      ruleStrong: readCss("--rule-strong", "#b9ae9b"),
      sheet: readCss("--sheet", "#fffdf8"),
      accent: readCss("--accent", "#8f2d2d"),
      accentSoft: readCss("--accent-soft", "#f2e6e2"),
      def: readCss("--def", "#2f5d8a"),
      ex: readCss("--ex", "#2f6b4f"),
      alpha: readCss("--mse-alpha", "#2f5d8a"),
      beta: readCss("--mse-beta", "#9a3b32"),
      liquid: readCss("--mse-liquid", "#b07a2a"),
      grid: readCss("--mse-grid", "rgba(30,27,23,0.10)"),
      gridStrong: readCss("--mse-grid-strong", "rgba(30,27,23,0.22)"),
      atomA: readCss("--mse-atom-a", "#6f93b8"),
      atomB: readCss("--mse-atom-b", "#c07a6a"),
      atomEdge: readCss("--mse-atom-edge", "rgba(30,27,23,0.35)")
    };
  }

  function setupCanvas(canvas, fallbackHeight) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    var rect = canvas.getBoundingClientRect();
    var parent = canvas.parentNode;
    var cssW = Math.round(rect.width || (parent && parent.clientWidth) || 640);
    if (cssW < 220) cssW = 220;
    var cssH = fallbackHeight || parseInt(canvas.getAttribute("data-height"), 10) || 340;
    var pixelW = Math.round(cssW * dpr);
    var pixelH = Math.round(cssH * dpr);
    if (canvas.width !== pixelW || canvas.height !== pixelH) {
      canvas.width = pixelW;
      canvas.height = pixelH;
    }
    canvas.style.height = cssH + "px";
    canvas.__cssW = cssW;
    canvas.__cssH = cssH;
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    return { w: cssW, h: cssH, ctx: ctx };
  }

  function bindPointer(canvas, onPoint, onStart) {
    var active = false;

    function point(event) {
      var rect = canvas.getBoundingClientRect();
      var w = canvas.__cssW || rect.width;
      var h = canvas.__cssH || rect.height;
      return {
        x: (event.clientX - rect.left) * (w / rect.width),
        y: (event.clientY - rect.top) * (h / rect.height)
      };
    }

    canvas.addEventListener("pointerdown", function (event) {
      active = true;
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(event.pointerId); } catch (err) {}
      }
      if (onStart) onStart(point(event));
      onPoint(point(event));
      event.preventDefault();
    });
    canvas.addEventListener("pointermove", function (event) {
      if (!active) return;
      onPoint(point(event));
      event.preventDefault();
    });
    function stop() { active = false; }
    canvas.addEventListener("pointerup", stop);
    canvas.addEventListener("pointercancel", stop);
    canvas.addEventListener("pointerleave", function () { if (active) active = false; });
  }

  function setAria(canvas, text) {
    canvas.setAttribute("aria-label", text);
  }

  function setStatus(root, text) {
    var el = $("[data-status]", root);
    if (el) el.textContent = text;
  }

  function setReadout(root, rows) {
    var host = $("[data-readout]", root);
    if (!host) return;
    var dl = document.createElement("dl");
    rows.forEach(function (row) {
      var line = document.createElement("div");
      line.className = "row";
      var dt = document.createElement("dt");
      dt.textContent = row[0];
      var dd = document.createElement("dd");
      dd.textContent = row[1];
      line.appendChild(dt);
      line.appendChild(dd);
      dl.appendChild(line);
    });
    host.replaceChildren(dl);
  }

  function addHint(root, text) {
    var el = $("[data-hint]", root);
    if (el) el.textContent = text;
  }

  function addRange(controls, opts) {
    var wrap = document.createElement("label");
    wrap.className = "msefield";
    var label = document.createElement("span");
    label.textContent = opts.label;
    wrap.appendChild(label);
    var input = document.createElement("input");
    input.type = "range";
    input.min = String(opts.min);
    input.max = String(opts.max);
    input.step = String(opts.step === undefined ? 0.01 : opts.step);
    input.value = String(opts.value);
    var out = document.createElement("output");
    function show() { out.textContent = opts.format ? opts.format(Number(input.value)) : fmt(Number(input.value)); }
    input.addEventListener("input", function () {
      show();
      if (opts.onInput) opts.onInput(Number(input.value));
    });
    wrap.appendChild(input);
    wrap.appendChild(out);
    controls.appendChild(wrap);
    show();
    return input;
  }

  function addSelect(controls, opts) {
    var wrap = document.createElement("label");
    wrap.className = "msefield";
    var label = document.createElement("span");
    label.textContent = opts.label;
    wrap.appendChild(label);
    var select = document.createElement("select");
    opts.options.forEach(function (option) {
      var el = document.createElement("option");
      el.value = String(option.value);
      el.textContent = option.label;
      if (String(option.value) === String(opts.value)) el.selected = true;
      select.appendChild(el);
    });
    select.addEventListener("change", function () {
      if (opts.onChange) opts.onChange(select.value);
    });
    wrap.appendChild(select);
    controls.appendChild(wrap);
    return select;
  }

  function addToggle(controls, opts) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "msebtn";
    button.textContent = opts.label;
    button.setAttribute("aria-pressed", opts.value ? "true" : "false");
    button.addEventListener("click", function () {
      var next = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", next ? "true" : "false");
      if (opts.onChange) opts.onChange(next);
    });
    controls.appendChild(button);
    return button;
  }

  function addButton(controls, opts) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "msebtn" + (opts.ghost ? " msebtn--ghost" : "");
    button.textContent = opts.label;
    button.addEventListener("click", function () { if (opts.onClick) opts.onClick(); });
    controls.appendChild(button);
    return button;
  }

  function readConfig(root) {
    var el = $("script.mselab-config", root);
    if (!el) return {};
    try {
      return JSON.parse(el.textContent);
    } catch (err) {
      setStatus(root, "This lab has an invalid JSON config.");
      console.error("Invalid mselab-config", err);
      return {};
    }
  }

  function label(ctx, text, x, y, color, size, align, baseline, weight) {
    ctx.save();
    ctx.font = (weight || 500) + " " + (size || 11) + 'px "IBM Plex Sans", system-ui, sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = align || "left";
    ctx.textBaseline = baseline || "alphabetic";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function line(ctx, x1, y1, x2, y2, color, width, dash) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 1;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function dot(ctx, x, y, radius, fill, ring) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (ring) {
      ctx.strokeStyle = ring;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.restore();
  }

  function ticks(min, max, count) {
    var span = max - min;
    if (span <= 0) return [min];
    var raw = span / Math.max(1, count);
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var norm = raw / mag;
    var step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag;
    var out = [];
    var first = Math.ceil(min / step) * step;
    for (var v = first; v <= max + step * 1e-6; v += step) {
      out.push(Math.abs(v) < step * 1e-6 ? 0 : v);
    }
    return out;
  }

  /* ============================================================
     1. Crystal structure viewer
     ============================================================ */

  var STRUCTS = {
    sc: {
      label: "Simple cubic (SC)",
      n: 1, Z: 6, apf: 0.524, rFrac: 0.5,
      atoms: function () {
        return corners("A");
      },
      note: "Po is the only common SC element; the structure is mainly a teaching baseline."
    },
    bcc: {
      label: "Body-centred cubic (BCC)",
      n: 2, Z: 8, apf: 0.680, rFrac: Math.sqrt(3) / 4,
      atoms: function () {
        return corners("A").concat([{ f: [0.5, 0.5, 0.5], s: "A" }]);
      },
      note: "Fe(α), W, Mo, Cr, V. Slip is easy because no close-packed plane exists."
    },
    fcc: {
      label: "Face-centred cubic (FCC)",
      n: 4, Z: 12, apf: 0.740, rFrac: Math.sqrt(2) / 4,
      atoms: function () {
        return corners("A").concat(faces("A"));
      },
      note: "Cu, Al, Ni, Ag, Au, γ-Fe. Four {111} slip planes give high ductility."
    },
    diamond: {
      label: "Diamond cubic",
      n: 8, Z: 4, apf: 0.340, rFrac: Math.sqrt(3) / 8,
      atoms: function () {
        return corners("A").concat(faces("A"), [
          { f: [0.25, 0.25, 0.25], s: "A" },
          { f: [0.75, 0.75, 0.25], s: "A" },
          { f: [0.75, 0.25, 0.75], s: "A" },
          { f: [0.25, 0.75, 0.75], s: "A" }
        ]);
      },
      note: "Si, Ge, diamond. Tetrahedral bonding: hard, brittle, a semiconductor."
    },
    nacl: {
      label: "Rock salt (NaCl)",
      n: 4, Z: 6, apf: 0.667, rFrac: 0.5,
      radii: { A: 0.18, B: 0.32 },
      atoms: function () {
        return corners("A").concat(faces("A"), edges("B"), [{ f: [0.5, 0.5, 0.5], s: "B" }]);
      },
      note: "NaCl, MgO, LiF. Two interpenetrating FCC lattices; unlike ions touch along the cube edge."
    }
  };

  function corners(species) {
    var out = [];
    for (var x = 0; x <= 1; x += 1) {
      for (var y = 0; y <= 1; y += 1) {
        for (var z = 0; z <= 1; z += 1) out.push({ f: [x, y, z], s: species });
      }
    }
    return out;
  }

  function faces(species) {
    return [
      { f: [0.5, 0.5, 0], s: species }, { f: [0.5, 0.5, 1], s: species },
      { f: [0.5, 0, 0.5], s: species }, { f: [0.5, 1, 0.5], s: species },
      { f: [0, 0.5, 0.5], s: species }, { f: [1, 0.5, 0.5], s: species }
    ];
  }

  function edges(species) {
    return [
      { f: [0.5, 0, 0], s: species }, { f: [0.5, 1, 0], s: species },
      { f: [0.5, 0, 1], s: species }, { f: [0.5, 1, 1], s: species },
      { f: [0, 0.5, 0], s: species }, { f: [1, 0.5, 0], s: species },
      { f: [0, 0.5, 1], s: species }, { f: [1, 0.5, 1], s: species },
      { f: [0, 0, 0.5], s: species }, { f: [1, 0, 0.5], s: species },
      { f: [0, 1, 0.5], s: species }, { f: [1, 1, 0.5], s: species }
    ];
  }

  function rotatePoint(p, yaw, pitch) {
    var cy = Math.cos(yaw), sy = Math.sin(yaw);
    var x = p[0] * cy - p[2] * sy;
    var z = p[0] * sy + p[2] * cy;
    var cp = Math.cos(pitch), sp = Math.sin(pitch);
    var y = p[1] * cp - z * sp;
    var z2 = p[1] * sp + z * cp;
    return [x, y, z2];
  }

  /* ---- Miller-plane geometry (cubic, fractional coordinates) ---- */

  function planeBasis(h, k, l) {
    var candidates = [];
    for (var i = -4; i <= 4; i += 1) {
      for (var j = -4; j <= 4; j += 1) {
        for (var m = -4; m <= 4; m += 1) {
          if (i === 0 && j === 0 && m === 0) continue;
          if (h * i + k * j + l * m !== 0) continue;
          candidates.push([i, j, m]);
        }
      }
    }
    candidates.sort(function (p, q) {
      return (p[0] * p[0] + p[1] * p[1] + p[2] * p[2]) -
             (q[0] * q[0] + q[1] * q[1] + q[2] * q[2]);
    });
    var u = candidates[0];
    var v = null;
    for (var n = 1; n < candidates.length; n += 1) {
      var w = candidates[n];
      var cx = u[1] * w[2] - u[2] * w[1];
      var cy = u[2] * w[0] - u[0] * w[2];
      var cz = u[0] * w[1] - u[1] * w[0];
      if (cx || cy || cz) { v = w; break; }
    }
    return [u, v];
  }

  function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

  function cross3(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  function norm3(a) { return Math.sqrt(dot3(a, a)); }

  function planeCount(atoms, h, k, l, offset) {
    var basis = planeBasis(h, k, l);
    var u = basis[0], v = basis[1];
    if (!u || !v) return { count: 0, area: 0, seen: [] };
    var e1 = [u[0] / norm3(u), u[1] / norm3(u), u[2] / norm3(u)];
    var vd = dot3(v, e1);
    var perp = [v[0] - vd * e1[0], v[1] - vd * e1[1], v[2] - vd * e1[2]];
    var e2 = [perp[0] / norm3(perp), perp[1] / norm3(perp), perp[2] / norm3(perp)];
    var Ux = norm3(u), Vy = norm3(perp), Vx = vd;
    var seen = {};
    var count = 0;

    for (var i = -2; i <= 2; i += 1) {
      for (var j = -2; j <= 2; j += 1) {
        for (var m = -2; m <= 2; m += 1) {
          atoms.forEach(function (atom) {
            var f = atom.f || atom;
            var x = f[0] + i, y = f[1] + j, z = f[2] + m;
            var s = h * x + k * y + l * z;
            if (Math.abs(s - offset) > 0.02) return;
            var px = x * e1[0] + y * e1[1] + z * e1[2];
            var py = x * e2[0] + y * e2[1] + z * e2[2];
            var p = (px * Vy - py * Vx) / (Ux * Vy);
            var q = (Ux * py) / (Ux * Vy);
            p -= Math.floor(p);
            q -= Math.floor(q);
            p = Math.round(p * 1000) / 1000;
            q = Math.round(q * 1000) / 1000;
            if (p >= 1) p = 0;
            if (q >= 1) q = 0;
            if (p < 0) p = 0;
            if (q < 0) q = 0;
            var key = p.toFixed(3) + "," + q.toFixed(3);
            if (!seen[key]) { seen[key] = 1; count += 1; }
          });
        }
      }
    }
    return { count: count, area: norm3(cross3(u, v)), seen: Object.keys(seen) };
  }

  function planeInfo(atoms, h, k, l, a) {
    if (!h && !k && !l) return null;
    var first = planeCount(atoms, h, k, l, 1);
    var chosen = first.count > 0 ? { count: first.count, area: first.area, offset: 1 } : null;
    if (!chosen) {
      var zero = planeCount(atoms, h, k, l, 0);
      chosen = { count: zero.count, area: zero.area, offset: 0 };
    }
    var area = chosen.area * a * a;
    var d = a / Math.sqrt(h * h + k * k + l * l);
    return {
      h: h, k: k, l: l, offset: chosen.offset,
      count: chosen.count, area: area, d: d,
      pd: area > 0 ? chosen.count / area : 0
    };
  }

  function planePolygon(h, k, l, offset) {
    var corners = [];
    for (var i = 0; i < 8; i += 1) {
      corners.push([(i & 1) ? 1 : 0, (i & 2) ? 1 : 0, (i & 4) ? 1 : 0]);
    }
    var pairs = [[0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3], [2, 6], [3, 7], [4, 5], [4, 6], [5, 7], [6, 7]];
    var points = [];

    function pushUnique(p) {
      for (var i = 0; i < points.length; i += 1) {
        if (Math.abs(points[i][0] - p[0]) < 1e-6 &&
            Math.abs(points[i][1] - p[1]) < 1e-6 &&
            Math.abs(points[i][2] - p[2]) < 1e-6) return;
      }
      points.push(p);
    }

    pairs.forEach(function (pair) {
      var p0 = corners[pair[0]], p1 = corners[pair[1]];
      var f0 = h * p0[0] + k * p0[1] + l * p0[2] - offset;
      var f1 = h * p1[0] + k * p1[1] + l * p1[2] - offset;
      if (Math.abs(f0) < 1e-9) pushUnique(p0);
      if (Math.abs(f1) < 1e-9) pushUnique(p1);
      if (f0 * f1 < 0) {
        var t = f0 / (f0 - f1);
        pushUnique([p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, p0[2] + (p1[2] - p0[2]) * t]);
      }
    });

    if (points.length < 3) return [];

    var c = [0, 0, 0];
    points.forEach(function (p) { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; });
    c = [c[0] / points.length, c[1] / points.length, c[2] / points.length];

    var basis = planeBasis(h, k, l);
    var u = basis[0], v = basis[1];
    var e1 = [u[0] / norm3(u), u[1] / norm3(u), u[2] / norm3(u)];
    var vd = dot3(v, e1);
    var perp = [v[0] - vd * e1[0], v[1] - vd * e1[1], v[2] - vd * e1[2]];
    var e2 = [perp[0] / norm3(perp), perp[1] / norm3(perp), perp[2] / norm3(perp)];

    points.sort(function (p, q) {
      var pp = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
      var qq = [q[0] - c[0], q[1] - c[1], q[2] - c[2]];
      return Math.atan2(dot3(pp, e2), dot3(pp, e1)) - Math.atan2(dot3(qq, e2), dot3(qq, e1));
    });
    return points;
  }

  function polygonArea(points, a) {
    if (points.length < 3) return 0;
    var sum = [0, 0, 0];
    for (var i = 0; i < points.length; i += 1) {
      var p = points[i], q = points[(i + 1) % points.length];
      var pr = [p[0] * a, p[1] * a, p[2] * a];
      var qr = [q[0] * a, q[1] * a, q[2] * a];
      var cross = cross3(pr, qr);
      sum[0] += cross[0]; sum[1] += cross[1]; sum[2] += cross[2];
    }
    return norm3(sum) / 2;
  }

  var LAB = {};

  LAB.crystal = function (root) {
    var cfg = readConfig(root);
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var state = {
      key: cfg.structure || "fcc",
      a: Number(cfg.a) || 3.615,
      yaw: -0.62,
      pitch: 0.42,
      dragging: false,
      auto: false,
      showBonds: !!cfg.showBonds,
      showPlane: !!cfg.showPlane,
      plane: Array.isArray(cfg.plane) && cfg.plane.length === 3 ? cfg.plane.map(Number) : [1, 1, 1],
      charge: cfg.species || "Cu",
      mass: Number(cfg.mass) || 63.55
    };
    var raf = null;
    var last = 0;

    function current() { return STRUCTS[state.key] || STRUCTS.fcc; }

    function render() {
      var size = setupCanvas(canvas, 400);
      var ctx = size.ctx;
      var pal = palette();
      var s = current();
      var w = size.w, h = size.h;
      var cx = w / 2, cy = h / 2 - 6;
      var k = Math.min(w, h) / (state.a * 2.55);
      var fov = state.a * 4.4;

      ctx.fillStyle = pal.sheet;
      ctx.fillRect(0, 0, w, h);

      /* cell edges are drawn after the atoms so the box stays legible */
      var c = [];
      for (var i = 0; i < 8; i += 1) {
        var f = [(i & 1) ? 1 : 0, (i & 2) ? 1 : 0, (i & 4) ? 1 : 0];
        c.push(project(f));
      }
      var edgePairs = [[0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3], [2, 6], [3, 7], [4, 5], [4, 6], [5, 7], [6, 7]];

      function project(frac) {
        var p = [(frac[0] - 0.5) * state.a, (frac[1] - 0.5) * state.a, (frac[2] - 0.5) * state.a];
        var r = rotatePoint(p, state.yaw, state.pitch);
        var persp = fov / (fov + r[2] * 0.75);
        return { x: cx + r[0] * k * persp, y: cy - r[1] * k * persp, z: r[2] };
      }

      var atoms = s.atoms().map(function (atom) {
        var p = project(atom.f);
        p.s = atom.s;
        p.f = atom.f;
        return p;
      }).sort(function (p, q) { return p.z - q.z; });

      var plane = state.showPlane
        ? planeInfo(atoms.map(function (p) { return { f: p.f }; }), state.plane[0], state.plane[1], state.plane[2], state.a)
        : null;
      var poly = plane ? planePolygon(plane.h, plane.k, plane.l, plane.offset).map(project) : [];
      if (plane) {
        atoms.forEach(function (p) {
          var sVal = plane.h * p.f[0] + plane.k * p.f[1] + plane.l * p.f[2];
          p.onPlane = Math.abs(sVal - plane.offset) < 0.02;
        });
      }

      if (plane && poly.length > 2) {
        ctx.save();
        ctx.beginPath();
        poly.forEach(function (p, index) {
          if (index === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fillStyle = pal.accent;
        ctx.globalAlpha = 0.13;
        ctx.fill();
        ctx.restore();
      }

      /* nearest-neighbour bonds */
      if (state.showBonds) {
        var minDist = Infinity;
        for (var a1 = 0; a1 < atoms.length; a1 += 1) {
          for (var b1 = a1 + 1; b1 < atoms.length; b1 += 1) {
            var dx = atoms[a1].x - atoms[b1].x;
            var dy = atoms[a1].y - atoms[b1].y;
            var dd = Math.sqrt(dx * dx + dy * dy);
            if (dd > 1 && dd < minDist) minDist = dd;
          }
        }
        for (var a2 = 0; a2 < atoms.length; a2 += 1) {
          for (var b2 = a2 + 1; b2 < atoms.length; b2 += 1) {
            var ddx = atoms[a2].x - atoms[b2].x;
            var ddy = atoms[a2].y - atoms[b2].y;
            var dist = Math.sqrt(ddx * ddx + ddy * ddy);
            if (dist <= minDist * 1.08 && dist > 0.5) {
              line(ctx, atoms[a2].x, atoms[a2].y, atoms[b2].x, atoms[b2].y, pal.accent, 0.9, null);
            }
          }
        }
      }

      /* atoms, far to near */
      var radii = s.radii || { A: s.rFrac, B: s.rFrac };
      atoms.forEach(function (p) {
        var persp = fov / (fov + p.z * 0.75);
        var r = Math.max(2.2, radii[p.s] * state.a * k * persp * 0.9);
        var base = p.s === "B" ? pal.atomB : pal.atomA;
        var grad = ctx.createRadialGradient(p.x - r * 0.36, p.y - r * 0.42, r * 0.12, p.x, p.y, r);
        grad.addColorStop(0, shade(base, 1.42));
        grad.addColorStop(0.55, base);
        grad.addColorStop(1, shade(base, 0.58));
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = pal.atomEdge;
        ctx.lineWidth = 0.7;
        ctx.stroke();
        if (p.onPlane) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 1.6, 0, Math.PI * 2);
          ctx.strokeStyle = pal.accent;
          ctx.lineWidth = 1.8;
          ctx.stroke();
        }
      });

      if (plane && poly.length > 2) {
        ctx.save();
        ctx.beginPath();
        poly.forEach(function (p, index) {
          if (index === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 1.7;
        ctx.stroke();
        ctx.restore();
      }

      edgePairs.forEach(function (pair) {
        line(ctx, c[pair[0]].x, c[pair[0]].y, c[pair[1]].x, c[pair[1]].y, pal.ruleStrong, 1, [3, 3]);
      });

      if (state.key === "nacl") {
        label(ctx, "● Na⁺", 12, h - 14, pal.atomA, 11, "left", "alphabetic", 600);
        label(ctx, "● Cl⁻", 70, h - 14, pal.atomB, 11, "left", "alphabetic", 600);
      }

      /* readout */
      var n = s.n;
      var volume = Math.pow(state.a * 1e-8, 3);
      var density = (n * state.mass) / (6.02214076e23 * volume);
      var nn = nearestDistance(state.key, state.a);
      var rows = [
        ["Structure", s.label],
        ["Lattice parameter a", fmt(state.a, 3) + " Å"],
        ["Atoms / cell", fmtInt(n)],
        ["Coordination Z", fmtInt(s.Z)],
        ["Packing fraction", fmt(s.apf, 3)],
        ["Nearest neighbour", fmt(nn, 3) + " Å"],
        ["Density", fmt(density, 3) + " g/cm³"],
        ["Cell volume", fmt(Math.pow(state.a, 3), 2) + " Å³"]
      ];
      if (plane) {
        rows.push(["Plane (hkl)", "(" + plane.h + plane.k + plane.l + ")"]);
        rows.push(["d-spacing", fmt(plane.d, 3) + " Å"]);
        rows.push(["Atoms / 2D cell", fmtInt(plane.count)]);
        rows.push(["Planar density", fmt(plane.pd, 3) + " Å⁻²"]);
      }
      setReadout(root, rows);

      setStatus(root,
        s.label + ": " + n + " atom" + (n === 1 ? "" : "s") + " per cell, Z = " + s.Z +
        ". The hard-sphere model fills " + pct(s.apf, 1) + " of the cell. " +
        (plane
          ? "The highlighted (" + plane.h + plane.k + plane.l + ") slice has d = " + fmt(plane.d, 3) +
            " Å and " + plane.count + " atom" + (plane.count === 1 ? "" : "s") +
            " per 2D cell, so the planar density is " + fmt(plane.pd, 3) + " atoms/Å². "
          : "") +
        s.note);

      setAria(canvas,
        s.label + " unit cell with lattice parameter " + fmt(state.a, 3) +
        " angstrom, coordination number " + s.Z + ", packing fraction " + fmt(s.apf, 3) +
        (plane ? ", plane (" + plane.h + plane.k + plane.l + "), planar density " + fmt(plane.pd, 3) + " atoms per square angstrom" : "") + ".");
    }

    function nearestDistance(key, a) {
      if (key === "sc") return a;
      if (key === "bcc") return a * Math.sqrt(3) / 2;
      if (key === "fcc") return a / Math.SQRT2;
      if (key === "diamond") return a * Math.sqrt(3) / 4;
      if (key === "nacl") return a / 2;
      return a;
    }

    function shade(hex, factor) {
      var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
      if (!m) return hex;
      var rgb = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
      return "rgb(" + rgb.map(function (v) {
        return clamp(Math.round(v * factor), 0, 255);
      }).join(",") + ")";
    }

    addSelect(controls, {
      label: "Structure",
      value: state.key,
      options: Object.keys(STRUCTS).map(function (key) {
        return { value: key, label: STRUCTS[key].label };
      }),
      onChange: function (value) {
        state.key = value;
        var defaults = { sc: [2.87, 58.69, "Po"], bcc: [2.87, 55.85, "Fe"], fcc: [3.615, 63.55, "Cu"], diamond: [5.431, 28.09, "Si"], nacl: [5.64, 58.44, "NaCl"] }[value];
        state.a = defaults[0];
        state.mass = defaults[1];
        state.charge = defaults[2];
        aInput.value = String(state.a);
        aInput.dispatchEvent(new Event("input"));
      }
    });

    var aInput = addRange(controls, {
      label: "Lattice parameter a",
      min: 2.4, max: 6.4, step: 0.005, value: state.a,
      format: function (v) { return fmt(v, 3) + " Å"; },
      onInput: function (v) { state.a = v; render(); }
    });

    ["h", "k", "l"].forEach(function (axis, index) {
      addSelect(controls, {
        label: "Miller " + axis,
        value: String(state.plane[index]),
        options: [0, 1, 2, 3].map(function (v) { return { value: v, label: String(v) }; }),
        onChange: function (value) {
          state.plane[index] = Number(value);
          render();
        }
      });
    });

    addToggle(controls, {
      label: "Show plane",
      value: state.showPlane,
      onChange: function (value) { state.showPlane = value; render(); }
    });

    addToggle(controls, {
      label: "Neighbour bonds",
      value: state.showBonds,
      onChange: function (value) { state.showBonds = value; render(); }
    });

    addToggle(controls, {
      label: "Auto-rotate",
      value: false,
      onChange: function (value) {
        state.auto = value;
        if (value) startLoop(); else stopLoop();
      }
    });

    addButton(controls, {
      label: "Reset view", ghost: true,
      onClick: function () {
        state.yaw = -0.62;
        state.pitch = 0.42;
        render();
      }
    });

    function startLoop() {
      last = 0;
      function frame(t) {
        if (!state.auto) return;
        if (!last) last = t;
        state.yaw += (t - last) * 0.00035;
        last = t;
        render();
        raf = window.requestAnimationFrame(frame);
      }
      raf = window.requestAnimationFrame(frame);
    }

    function stopLoop() {
      state.auto = false;
      if (raf) window.cancelAnimationFrame(raf);
      raf = null;
    }

    bindPointer(canvas, function (p) {
      if (state.dragging) {
        state.yaw += (p.x - state.dragging.x) * 0.01;
        state.pitch = clamp(state.pitch - (p.y - state.dragging.y) * 0.01, -1.45, 1.45);
        state.dragging = p;
        render();
      }
    }, function (p) {
      state.dragging = p;
      stopLoop();
    });

    canvas.addEventListener("pointerup", function () { state.dragging = false; });
    canvas.addEventListener("pointercancel", function () { state.dragging = false; });

    addHint(root, "Drag the cell to rotate it. The sliders and buttons are the keyboard path.");
    LAB_RENDERS.push(render);
    render();
  };

  /* ============================================================
     2. Binary phase diagram + lever rule
     ============================================================ */

  var PHASE_PRESETS = {
    "pb-sn": {
      name: "Pb–Sn (eutectic)",
      A: "Pb", B: "Sn",
      tmin: 0, tmax: 350,
      tmA: 327, tmB: 232,
      xe: 0.619, te: 183,
      aMax: 0.19, bMax: 0.03,
      x0: 0.40, t0: 200,
      note: "Classic solder system. The eutectic 61.9 wt% Sn melts at 183 °C."
    },
    "al-si": {
      name: "Al–Si (eutectic)",
      A: "Al", B: "Si",
      tmin: 300, tmax: 750,
      tmA: 660, tmB: 1414,
      xe: 0.122, te: 577,
      aMax: 0.015, bMax: 0.01,
      x0: 0.07, t0: 600,
      note: "Casting alloy system. Small Si additions lower the melting point sharply."
    }
  };

  function interpSorted(points, value, inIndex, outIndex) {
    if (!Array.isArray(points) || points.length < 2) return null;
    var pts = points.slice().sort(function (a, b) { return a[inIndex] - b[inIndex]; });
    if (value <= pts[0][inIndex]) return pts[0][outIndex];
    if (value >= pts[pts.length - 1][inIndex]) return pts[pts.length - 1][outIndex];
    for (var i = 0; i < pts.length - 1; i += 1) {
      var a = pts[i], b = pts[i + 1];
      if (value >= a[inIndex] && value <= b[inIndex]) {
        var t = (value - a[inIndex]) / (b[inIndex] - a[inIndex] || 1);
        return a[outIndex] + (b[outIndex] - a[outIndex]) * t;
      }
    }
    return pts[pts.length - 1][outIndex];
  }

  function tableCross(points, temperature, pick) {
    if (!Array.isArray(points) || points.length < 2) return null;
    var pts = points.slice().sort(function (a, b) { return a[0] - b[0]; });
    var xs = [];
    for (var i = 0; i < pts.length - 1; i += 1) {
      var a = pts[i], b = pts[i + 1];
      if (a[1] === b[1]) continue;
      if ((temperature - a[1]) * (temperature - b[1]) <= 0) {
        var t = (temperature - a[1]) / (b[1] - a[1]);
        xs.push(a[0] + (b[0] - a[0]) * t);
      }
    }
    if (!xs.length) return null;
    return pick === "min" ? Math.min.apply(null, xs) : Math.max.apply(null, xs);
  }

  function phaseGeometry(p, curved) {
    var ex = curved ? { L: 0.82, S: 0.82, Q: 0.45 } : { L: 1, S: 1, Q: 0.65 };
    var tbl = p.table || {};

    function liquidus(x) {
      if (tbl.liquidus) return interpSorted(tbl.liquidus, x, 0, 1);
      if (x <= p.xe) {
        return p.tmA - (p.tmA - p.te) * Math.pow(clamp(x / p.xe, 0, 1), ex.L);
      }
      return p.te + (p.tmB - p.te) * Math.pow(clamp((x - p.xe) / (1 - p.xe), 0, 1), ex.L);
    }

    function alphaSolidus(T) {
      if (T >= p.te) {
        if (tbl.solidusA) return interpSorted(tbl.solidusA, T, 0, 1);
        return p.aMax * Math.pow(clamp((p.tmA - T) / (p.tmA - p.te), 0, 1), ex.S);
      }
      if (tbl.solvusA) return interpSorted(tbl.solvusA, T, 0, 1);
      return p.aMax * Math.pow(clamp(T / p.te, 0, 1), ex.Q);
    }

    function betaSolidus(T) {
      if (T >= p.te) {
        if (tbl.solidusB) return interpSorted(tbl.solidusB, T, 0, 1);
        return 1 - p.bMax * Math.pow(clamp((p.tmB - T) / (p.tmB - p.te), 0, 1), ex.S);
      }
      if (tbl.solvusB) return interpSorted(tbl.solvusB, T, 0, 1);
      return 1 - p.bMax * Math.pow(clamp(T / p.te, 0, 1), ex.Q);
    }

    function liquidCompA(T) {
      if (tbl.liquidus) {
        var xa = tableCross(tbl.liquidus, T, "min");
        if (xa !== null) return xa;
      }
      if (T >= p.tmA) return 0;
      if (T <= p.te) return p.xe;
      var u = Math.pow(clamp((p.tmA - T) / (p.tmA - p.te), 0, 1), 1 / ex.L);
      return p.xe * u;
    }

    function liquidCompB(T) {
      if (tbl.liquidus) {
        var xb = tableCross(tbl.liquidus, T, "max");
        if (xb !== null) return xb;
      }
      if (T >= p.tmB) return 1;
      if (T <= p.te) return p.xe;
      var u = Math.pow(clamp((T - p.te) / (p.tmB - p.te), 0, 1), 1 / ex.L);
      return p.xe + (1 - p.xe) * u;
    }

    return {
      liquidus: liquidus,
      alphaSolidus: alphaSolidus,
      betaSolidus: betaSolidus,
      liquidCompA: liquidCompA,
      liquidCompB: liquidCompB
    };
  }

  function phaseRegion(p, g, x, T) {
    if (T > g.liquidus(x)) return "L";
    if (T >= p.te) {
      if (x < p.xe) {
        if (T >= p.tmA) return "alpha";
        var xs = g.alphaSolidus(T);
        var xl = g.liquidCompA(T);
        if (x <= xs) return "alpha";
        if (x >= xl) return "L";
        return "alpha+L";
      }
      if (T >= p.tmB) return "beta";
      var xs2 = g.betaSolidus(T);
      var xl2 = g.liquidCompB(T);
      if (x >= xs2) return "beta";
      if (x <= xl2) return "L";
      return "beta+L";
    }
    var xa = g.alphaSolidus(T);
    var xb = g.betaSolidus(T);
    if (x <= xa) return "alpha";
    if (x >= xb) return "beta";
    return "alpha+beta";
  }

  LAB.phase = function (root) {
    var cfg = readConfig(root);
    var source = cfg.presets || PHASE_PRESETS;
    var presets = {};
    Object.keys(source).forEach(function (k) { presets[k] = Object.assign({}, source[k]); });
    var key = cfg.preset || "pb-sn";
    if (!presets[key]) key = Object.keys(presets)[0];
    if (cfg.table) presets[key].table = cfg.table;
    var p = presets[key];
    var canvas = $("[data-canvas]", root);
    var micro = $("[data-micro]", root);
    var controls = $("[data-controls]", root);
    var state = { x: p.x0, T: p.t0, key: key, curved: !!cfg.curved };

    function preset() { return presets[state.key]; }

    function regionAt(x, T) { return phaseRegion(preset(), phaseGeometry(preset(), state.curved), x, T); }

    function fractions(x, T) {
      var q = preset(), gg = phaseGeometry(q, state.curved);
      var region = phaseRegion(q, gg, x, T);
      if (region === "L" || region === "alpha" || region === "beta") {
        return { region: region, a: region === "alpha" ? 1 : 0, b: region === "beta" ? 1 : 0, l: region === "L" ? 1 : 0, xa: null, xb: null };
      }
      if (region === "alpha+L") {
        var xa = gg.alphaSolidus(T), xl = gg.liquidCompA(T);
        var fl = (x - xa) / (xl - xa);
        return { region: region, a: 1 - fl, b: 0, l: fl, xa: xa, xb: xl };
      }
      if (region === "beta+L") {
        var xb2 = gg.betaSolidus(T), xl2 = gg.liquidCompB(T);
        var fb = (xb2 - x) / (xb2 - xl2);
        return { region: region, a: 0, b: fb, l: 1 - fb, xa: xl2, xb: xb2 };
      }
      var xa3 = gg.alphaSolidus(T), xb3 = gg.betaSolidus(T);
      var fb3 = (x - xa3) / (xb3 - xa3);
      return { region: region, a: 1 - fb3, b: fb3, l: 0, xa: xa3, xb: xb3 };
    }

    function render() {
      var q = preset();
      var gg = phaseGeometry(q, state.curved);
      var size = setupCanvas(canvas, 390);
      var ctx = size.ctx, pal = palette();
      var w = size.w, h = size.h;
      var m = { l: 54, r: 18, t: 16, b: 42 };
      var iw = w - m.l - m.r, ih = h - m.t - m.b;

      function X(x) { return m.l + x * iw; }
      function Y(T) { return m.t + (1 - (T - q.tmin) / (q.tmax - q.tmin)) * ih; }

      ctx.fillStyle = pal.sheet;
      ctx.fillRect(0, 0, w, h);

      /* grid */
      ticks(q.tmin, q.tmax, 6).forEach(function (T) {
        line(ctx, m.l, Y(T), w - m.r, Y(T), pal.grid, 1, null);
        label(ctx, fmtInt(T), m.l - 7, Y(T) + 3, pal.muted, 9.5, "right");
      });
      ticks(0, 1, 5).forEach(function (x) {
        line(ctx, X(x), m.t, X(x), h - m.b, pal.grid, 1, null);
        label(ctx, fmtInt(x * 100), X(x), h - m.b + 14, pal.muted, 9.5, "center");
      });

      label(ctx, "temperature, °C", m.l, 10, pal.muted, 9.5, "left");
      label(ctx, "composition, wt% " + q.B, w - m.r, h - 8, pal.muted, 9.5, "right");

      /* phase boundaries */
      ctx.save();
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(X(0), Y(q.tmA));
      ctx.lineTo(X(q.xe), Y(q.te));
      ctx.lineTo(X(1), Y(q.tmB));
      ctx.stroke();

      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(X(0), Y(q.tmA));
      ctx.lineTo(X(q.aMax), Y(q.te));
      ctx.lineTo(X(gg.alphaSolidus(q.tmin)), Y(q.tmin));
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(X(1), Y(q.tmB));
      ctx.lineTo(X(1 - q.bMax), Y(q.te));
      ctx.lineTo(X(gg.betaSolidus(q.tmin)), Y(q.tmin));
      ctx.stroke();

      line(ctx, X(q.aMax), Y(q.te), X(1 - q.bMax), Y(q.te), pal.ink2, 1.2, [5, 4]);
      ctx.restore();

      /* region labels */
      label(ctx, "L", X(0.5), Y(q.tmax) + 18, pal.liquid, 12, "center", "middle", 700);
      label(ctx, "α + L", X(q.xe * 0.34), Y((q.tmA + q.te) / 2), pal.alpha, 11, "center", "middle", 600);
      label(ctx, "β + L", X(q.xe + (1 - q.xe) * 0.34), Y((q.tmB + q.te) / 2), pal.beta, 11, "center", "middle", 600);
      label(ctx, "α + β", X(0.5), Y((q.te + q.tmin) / 2), pal.ink2, 11, "center", "middle", 600);
      label(ctx, "α", X(q.aMax * 0.42), Y((q.te + q.tmin) / 2), pal.alpha, 11, "center", "middle", 600);
      label(ctx, "eutectic " + fmt(q.te, 0) + " °C", X(q.xe) + 6, Y(q.te) - 6, pal.muted, 9, "left");

      /* tie line */
      var fr = fractions(state.x, state.T);
      if (fr.xa !== null) {
        var y = Y(state.T);
        line(ctx, X(fr.xa), y, X(fr.xb), y, pal.accent, 2.4, null);
        dot(ctx, X(fr.xa), y, 3.4, pal.accent, pal.sheet);
        dot(ctx, X(fr.xb), y, 3.4, pal.accent, pal.sheet);
        label(ctx, fmt(fr.xa * 100, 1) + "%", X(fr.xa), y - 8, pal.ink2, 9, "center");
        label(ctx, fmt(fr.xb * 100, 1) + "%", X(fr.xb), y - 8, pal.ink2, 9, "center");
      }

      /* alloy point + construction lines */
      var px = X(state.x), py = Y(state.T);
      line(ctx, px, py, px, h - m.b, pal.gridStrong, 1, [2, 3]);
      line(ctx, px, py, m.l, py, pal.gridStrong, 1, [2, 3]);
      dot(ctx, px, py, 5.2, pal.accent, pal.sheet);

      setAria(canvas,
        q.name + " phase diagram. Alloy " + fmt(state.x * 100, 1) + " wt% " + q.B +
        " at " + fmt(state.T, 0) + " degrees Celsius, region " + fr.region + ".");

      /* readout */
      var names = { alpha: "α", beta: "β", L: "L" };
      var label1 = "Composition", label2 = "";
      if (fr.region === "alpha+L") { label1 = "α composition"; label2 = "L composition"; }
      else if (fr.region === "beta+L") { label1 = "L composition"; label2 = "β composition"; }
      else if (fr.region === "alpha+beta") { label1 = "α composition"; label2 = "β composition"; }
      var rows = [
        ["Alloy", fmt(state.x * 100, 1) + " wt% " + q.B],
        ["Temperature", fmt(state.T, 0) + " °C"],
        ["Region", fr.region.replace("alpha", "α").replace("beta", "β")],
        ["Phase fractions", fractionText(fr)],
        [label1, fr.xa === null ? fmt(state.x * 100, 1) + " wt% " + q.B : fmt(fr.xa * 100, 1) + " wt% " + q.B]
      ];
      if (label2) rows.push([label2, fmt(fr.xb * 100, 1) + " wt% " + q.B]);
      rows.push(["Boundaries", q.table ? "imported table" : (state.curved ? "curved fit" : "parametric")]);
      setReadout(root, rows);

      drawBar(root, fr);
      drawMicro(micro, q, state.x, state.T, fr);

      var msg;
      if (fr.region === "L") {
        msg = "Single-phase liquid. The composition of the liquid equals the alloy composition; cooling will not change it until the liquidus is reached.";
      } else if (fr.region === "alpha" || fr.region === "beta") {
        msg = "Single-phase " + (fr.region === "alpha" ? "α" : "β") + ". No lever rule is needed: the phase composition is the alloy composition.";
      } else {
        msg = "Two-phase region " + fr.region.replace("alpha", "α").replace("beta", "β") +
          ". Tie line from " + fmt(fr.xa * 100, 1) + " to " + fmt(fr.xb * 100, 1) + " wt% " + q.B +
          ". Lever rule: " + leverText(fr) + " The phase fraction is a ratio of segment lengths, not a ratio of compositions.";
      }
      var modelNote = q.table
        ? " Boundaries are interpolated from the imported table."
        : (state.curved
          ? " Boundaries use a curved teaching fit, not a CALPHAD calculation."
          : " Boundaries use the parametric teaching model; switch to curved to see the difference.");
      setStatus(root, msg + modelNote);
    }

    function fractionText(fr) {
      var parts = [];
      if (fr.a > 0.0005) parts.push("α " + pct(fr.a, 1));
      if (fr.b > 0.0005) parts.push("β " + pct(fr.b, 1));
      if (fr.l > 0.0005) parts.push("L " + pct(fr.l, 1));
      return parts.length ? parts.join(" · ") : "—";
    }

    function leverText(fr) {
      if (fr.region === "alpha+L") {
        return "f_L = (" + fmt(state.x * 100, 1) + " − " + fmt(fr.xa * 100, 1) + ") / (" + fmt(fr.xb * 100, 1) + " − " + fmt(fr.xa * 100, 1) + ") = " + fmt(fr.l, 2) + ".";
      }
      if (fr.region === "beta+L") {
        return "f_β = (" + fmt(fr.xb * 100, 1) + " − " + fmt(state.x * 100, 1) + ") / (" + fmt(fr.xb * 100, 1) + " − " + fmt(fr.xa * 100, 1) + ") = " + fmt(fr.b, 2) + ".";
      }
      return "f_β = (" + fmt(state.x * 100, 1) + " − " + fmt(fr.xa * 100, 1) + ") / (" + fmt(fr.xb * 100, 1) + " − " + fmt(fr.xa * 100, 1) + ") = " + fmt(fr.b, 2) + ".";
    }

    function drawBar(host, fr) {
      var bar = $("[data-bar]", host);
      if (!bar) return;
      bar.replaceChildren();
      var parts = [
        ["alpha", fr.a, "α"],
        ["beta", fr.b, "β"],
        ["liquid", fr.l, "L"]
      ].filter(function (entry) { return entry[1] > 0.0005; });
      if (!parts.length) parts = [["empty", 1, "—"]];
      parts.forEach(function (entry) {
        var seg = document.createElement("div");
        seg.className = "msebar__part msebar__part--" + entry[0];
        seg.style.width = (entry[1] * 100).toFixed(2) + "%";
        seg.textContent = entry[2];
        seg.title = entry[2] + " " + pct(entry[1], 1);
        bar.appendChild(seg);
      });
    }

    function drawMicro(cv, q, x, T, fr) {
      if (!cv) return;
      var size = setupCanvas(cv, 132);
      var ctx = size.ctx, pal = palette();
      var w = size.w, h = size.h;
      ctx.fillStyle = pal.sheet;
      ctx.fillRect(0, 0, w, h);

      var region = fr.region;
      var labelText = "";

      function liquidBg() {
        ctx.fillStyle = pal.sheet;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = pal.liquid;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
        for (var i = 0; i < 80; i += 1) {
          dot(ctx, (i * 37 + 11) % w, (i * 53 + 7) % h, 1.3, pal.liquid, null);
        }
      }

      function grains(color, count) {
        for (var i = 0; i < count; i += 1) {
          var gx = (i % 2) * w * 0.44 + w * 0.16;
          var gy = (i > 1 ? 0.62 : 0.30) * h;
          ctx.beginPath();
          ctx.arc(gx, gy, Math.min(w, h) * 0.16, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = pal.ink2;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      if (region === "L") {
        liquidBg();
        labelText = "liquid";
      } else if (region === "alpha+L" || region === "beta+L") {
        liquidBg();
        grains(region === "alpha+L" ? pal.atomA : pal.atomB, 4);
        labelText = region === "alpha+L" ? "primary α + liquid" : "primary β + liquid";
      } else if (region === "alpha" || region === "beta") {
        var base = region === "alpha" ? pal.atomA : pal.atomB;
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = pal.ruleStrong;
        ctx.lineWidth = 1;
        for (var gx = 12; gx < w; gx += 34) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx + 12, h);
          ctx.stroke();
        }
        labelText = region === "alpha" ? "α grains" : "β grains";
      } else {
        /* eutectic matrix: fine lamellae */
        ctx.fillStyle = pal.atomA;
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = pal.atomB;
        ctx.lineWidth = 2.2;
        for (var y = -h; y < h * 2; y += 7) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y + w * 0.28);
          ctx.stroke();
        }
        if (Math.abs(x - q.xe) < 0.02) {
          labelText = "eutectic lamellae (α + β)";
        } else {
          grains(x < q.xe ? pal.atomA : pal.atomB, 4);
          labelText = x < q.xe ? "primary α + eutectic" : "primary β + eutectic";
        }
      }

      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, h - 18, w, 18);
      label(ctx, labelText + " · schematic", 6, h - 5, "#fffdf8", 9, "left");
    }

    /* controls */
    addSelect(controls, {
      label: "System",
      value: state.key,
      options: Object.keys(presets).map(function (k) {
        return { value: k, label: presets[k].name };
      }),
      onChange: function (value) {
        state.key = value;
        var next = presets[value];
        state.x = next.x0;
        state.T = next.t0;
        xInput.min = "0"; xInput.max = "1"; xInput.value = String(state.x);
        tInput.min = String(next.tmin); tInput.max = String(next.tmax); tInput.value = String(state.T);
        xInput.dispatchEvent(new Event("input"));
        tInput.dispatchEvent(new Event("input"));
        render();
      }
    });

    var xInput = addRange(controls, {
      label: "Composition x",
      min: 0, max: 1, step: 0.002, value: state.x,
      format: function (v) { return fmt(v * 100, 1) + " wt% " + preset().B; },
      onInput: function (v) { state.x = v; render(); }
    });

    var tInput = addRange(controls, {
      label: "Temperature",
      min: p.tmin, max: p.tmax, step: 1, value: state.T,
      format: function (v) { return fmt(v, 0) + " °C"; },
      onInput: function (v) { state.T = v; render(); }
    });

    addToggle(controls, {
      label: "Curved boundaries",
      value: state.curved,
      onChange: function (value) { state.curved = value; render(); }
    });

    addButton(controls, {
      label: "Go to eutectic",
      onClick: function () {
        var q = preset();
        state.x = q.xe;
        state.T = q.te - (q.te - q.tmin) * 0.04;
        xInput.value = String(state.x);
        tInput.value = String(state.T);
        xInput.dispatchEvent(new Event("input"));
        tInput.dispatchEvent(new Event("input"));
        render();
      }
    });

    addButton(controls, {
      label: "Reset", ghost: true,
      onClick: function () {
        var q = preset();
        state.x = q.x0;
        state.T = q.t0;
        xInput.value = String(state.x);
        tInput.value = String(state.T);
        xInput.dispatchEvent(new Event("input"));
        tInput.dispatchEvent(new Event("input"));
        render();
      }
    });

    bindPointer(canvas, function (pt) {
      var size = { w: canvas.__cssW || 600, h: canvas.__cssH || 390 };
      var m2 = { l: 54, r: 18, t: 16, b: 42 };
      var q = preset();
      var x = clamp((pt.x - m2.l) / (size.w - m2.l - m2.r), 0, 1);
      var T = q.tmin + (1 - clamp((pt.y - m2.t) / (size.h - m2.t - m2.b), 0, 1)) * (q.tmax - q.tmin);
      state.x = x;
      state.T = Math.round(T);
      xInput.value = String(state.x);
      tInput.value = String(state.T);
      xInput.dispatchEvent(new Event("input"));
      tInput.dispatchEvent(new Event("input"));
      render();
    });

    addHint(root, "Click or drag on the diagram to move the alloy. The two sliders are the keyboard-accessible path.");
    LAB_RENDERS.push(render);
    render();
  };

  /* ============================================================
     3. Stress–strain
     ============================================================ */

  var STRESS_PRESETS = {
    steel: { name: "Mild steel", E: 200, sy: 250, su: 400, eu: 0.20, ef: 0.26, brittle: false },
    al: { name: "Al 6061-T6", E: 69, sy: 276, su: 310, eu: 0.10, ef: 0.13, brittle: false },
    nylon: { name: "Nylon 6,6", E: 3, sy: 80, su: 90, eu: 0.22, ef: 0.60, brittle: false },
    cast: { name: "Grey cast iron", E: 170, sy: 0, su: 300, eu: 0.00176, ef: 0.00176, brittle: true }
  };

  function stressAt(m, eps) {
    if (eps <= 0) return 0;
    var Empa = m.E * 1000;
    if (m.brittle) return eps <= m.ef ? Math.min(m.su, Empa * eps) : 0;
    var ey = m.sy / Empa;
    if (eps <= ey) return Empa * eps;
    if (eps <= m.eu) {
      var t = (eps - ey) / Math.max(1e-9, m.eu - ey);
      return m.sy + (m.su - m.sy) * Math.pow(t, 0.38);
    }
    if (eps <= m.ef) {
      var t2 = (eps - m.eu) / Math.max(1e-9, m.ef - m.eu);
      return m.su * (1 - 0.45 * Math.pow(t2, 1.35));
    }
    return 0;
  }

  LAB.stress = function (root) {
    var cfg = readConfig(root);
    var presets = cfg.presets || STRESS_PRESETS;
    var key = cfg.preset || "steel";
    if (!presets[key]) key = Object.keys(presets)[0];
    var state = { key: key, eps: Math.min(Number(cfg.strain) || 0.02, presets[key].ef * 0.9), showTrue: false, showOffset: true };
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);

    function mat() { return presets[state.key]; }

    function render() {
      var m = mat();
      var size = setupCanvas(canvas, 380);
      var ctx = size.ctx, pal = palette();
      var w = size.w, h = size.h;
      var mm = { l: 58, r: 18, t: 16, b: 40 };
      var iw = w - mm.l - mm.r, ih = h - mm.t - mm.b;
      var xmax = m.ef * 1.06;
      var ymax = m.su * 1.14;

      function X(e) { return mm.l + (e / xmax) * iw; }
      function Y(s) { return mm.t + (1 - s / ymax) * ih; }

      ctx.fillStyle = pal.sheet;
      ctx.fillRect(0, 0, w, h);

      ticks(0, xmax, 5).forEach(function (e) {
        line(ctx, X(e), mm.t, X(e), h - mm.b, pal.grid, 1, null);
        label(ctx, fmt(e * 100, 0), X(e), h - mm.b + 14, pal.muted, 9.5, "center");
      });
      ticks(0, ymax, 5).forEach(function (s) {
        line(ctx, mm.l, Y(s), w - mm.r, Y(s), pal.grid, 1, null);
        label(ctx, fmt(s, 0), mm.l - 7, Y(s) + 3, pal.muted, 9.5, "right");
      });
      label(ctx, "stress, MPa", mm.l, 10, pal.muted, 9.5, "left");
      label(ctx, "strain, %", w - mm.r, h - 8, pal.muted, 9.5, "right");

      var N = 520;
      var points = [];
      for (var i = 0; i <= N; i += 1) {
        var eps = (i / N) * m.ef;
        var sig = stressAt(m, eps);
        var px = state.showTrue ? Math.log(1 + eps) : eps;
        var py = state.showTrue ? sig * (1 + eps) : sig;
        points.push({ x: X(px), y: Y(py), e: eps });
      }

      /* toughness fill up to cursor */
      var cursorSig = stressAt(m, state.eps);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(X(0), Y(0));
      points.forEach(function (p) {
        if (p.e <= state.eps + 1e-9) ctx.lineTo(p.x, p.y);
      });
      ctx.lineTo(X(state.showTrue ? Math.log(1 + state.eps) : state.eps), Y(0));
      ctx.closePath();
      ctx.fillStyle = pal.accentSoft;
      ctx.globalAlpha = 0.75;
      ctx.fill();
      ctx.restore();

      /* the 0.2% construction is shown in the zoom inset below, not at full scale */

      /* curve */
      ctx.save();
      ctx.beginPath();
      points.forEach(function (p, index) {
        if (index === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 2.1;
      ctx.stroke();
      ctx.restore();

      /* zoom inset: the 0.2% offset only makes sense near the origin */
      if (state.showOffset && !m.brittle) {
        var ey0 = m.sy / (m.E * 1000);
        var exMax = Math.min(m.ef, Math.max(ey0 * 2.4, 0.004));
        var ew = iw * 0.34, eh = ih * 0.34;
        var ex0 = mm.l + iw - ew - 6, ey0px = mm.t + ih - eh - 6;
        var iyMax = m.sy * 1.35;

        function IX(e) { return ex0 + (e / exMax) * ew; }
        function IY(s) { return ey0px + eh - (s / iyMax) * eh; }

        ctx.save();
        ctx.fillStyle = pal.sheet;
        ctx.globalAlpha = 0.96;
        ctx.fillRect(ex0, ey0px, ew, eh);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = pal.ruleStrong;
        ctx.lineWidth = 1;
        ctx.strokeRect(ex0, ey0px, ew, eh);

        ctx.beginPath();
        for (var q = 0; q <= 160; q += 1) {
          var e = (q / 160) * exMax;
          var s = stressAt(m, e);
          if (q === 0) ctx.moveTo(IX(e), IY(s)); else ctx.lineTo(IX(e), IY(s));
        }
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        var offEnd = Math.min(exMax, 0.002 + iyMax / (m.E * 1000));
        line(ctx, IX(0.002), IY(0), IX(offEnd), IY(m.E * 1000 * (offEnd - 0.002)), pal.def, 1, [3, 3]);
        dot(ctx, IX(ey0), IY(m.sy), 2.4, pal.accent, pal.sheet);
        label(ctx, "zoom 0–" + fmt(exMax * 100, 2) + "%", ex0 + 5, ey0px + 11, pal.muted, 8);
        label(ctx, "0.2%", IX(0.002) + 3, IY(0) - 3, pal.def, 7.5);
        ctx.restore();
      }

      /* UTS + yield markers */
      var utsX = state.showTrue ? Math.log(1 + m.eu) : m.eu;
      var utsY = state.showTrue ? m.su * (1 + m.eu) : m.su;
      line(ctx, mm.l, Y(utsY), X(utsX), Y(utsY), pal.ruleStrong, 1, [3, 3]);
      dot(ctx, X(utsX), Y(utsY), 3, pal.ink2, pal.sheet);
      label(ctx, "UTS", X(utsX) + 4, Y(utsY) - 5, pal.muted, 8.5, "left");

      /* cursor */
      var curX = state.showTrue ? Math.log(1 + state.eps) : state.eps;
      var curY = state.showTrue ? cursorSig * (1 + state.eps) : cursorSig;
      line(ctx, X(curX), Y(0), X(curX), Y(curY), pal.accent, 1.6, null);
      dot(ctx, X(curX), Y(curY), 4.6, pal.accent, pal.sheet);
      label(ctx, fmt(cursorSig, 0) + " MPa", X(curX) + 7, Y(curY) - 7, pal.accent, 9.5, "left", "alphabetic", 600);

      /* readout */
      var ey = m.brittle ? m.ef : m.sy / (m.E * 1000);
      var offset = offsetYield(m);
      var toughness = integrate(m, m.ef);
      var resilience = m.brittle ? 0.5 * m.su * m.ef : (m.sy * m.sy) / (2 * m.E * 1000);
      setReadout(root, [
        ["Material", m.name],
        ["Stress at cursor", fmt(cursorSig, 1) + " MPa"],
        ["Strain at cursor", fmt(state.eps * 100, 2) + "%"],
        ["Young's modulus", fmt(m.E, 0) + " GPa"],
        ["Yield strength", m.brittle ? "—" : fmt(m.sy, 0) + " MPa"],
        ["UTS", fmt(m.su, 0) + " MPa"],
        ["Toughness (area)", fmt(toughness, 1) + " MJ/m³"],
        ["Resilience", fmt(resilience, 2) + " MJ/m³"],
        ["True stress", fmt(cursorSig * (1 + state.eps), 1) + " MPa"],
        ["True strain", fmt(Math.log(1 + state.eps) * 100, 2) + "%"],
        ["0.2% offset yield", offset === null ? "—" : fmt(offset, 0) + " MPa"]
      ]);

      setStatus(root,
        (state.showTrue ? "True" : "Engineering") + " curve for " + m.name +
        ". The shaded area is the energy absorbed per unit volume up to ε = " + fmt(state.eps * 100, 1) + "%. " +
        (m.brittle
          ? "A brittle material has no yield plateau: it separates while still elastic."
          : "The 0.2% offset construction is how yield is defined when the curve has no sharp knee."));

      setAria(canvas,
        "Stress-strain curve for " + m.name + ". Cursor at " + fmt(state.eps * 100, 1) +
        " percent strain, stress " + fmt(cursorSig, 0) + " megapascal.");

      drawKeyTable(root, m, ey);
    }

    function offsetYield(m) {
      if (m.brittle) return null;
      var Empa = m.E * 1000;
      var best = null;
      for (var i = 0; i <= 4000; i += 1) {
        var e = 0.002 + (i / 4000) * (m.ef - 0.002);
        var diff = stressAt(m, e) - Empa * (e - 0.002);
        if (diff <= 0) {
          best = Empa * (e - 0.002);
          break;
        }
      }
      return best;
    }

    function integrate(m, upto) {
      var n = 1200;
      var sum = 0;
      for (var i = 0; i < n; i += 1) {
        var e1 = (i / n) * upto;
        var e2 = ((i + 1) / n) * upto;
        sum += 0.5 * (stressAt(m, e1) + stressAt(m, e2)) * (e2 - e1);
      }
      return sum; /* MPa = MJ/m^3 */
    }

    function drawKeyTable(root, m, ey) {
      var host = $("[data-table]", root);
      if (!host) return;
      var rows = [
        ["yield", m.brittle ? "—" : fmt(m.sy, 0) + " MPa", m.brittle ? "—" : pct(ey * 100, 2)],
        ["UTS", fmt(m.su, 0) + " MPa", pct(m.eu * 100, 1)],
        ["fracture", fmt(stressAt(m, m.ef * 0.999), 0) + " MPa", pct(m.ef * 100, 1)]
      ];
      var table = document.createElement("table");
      table.className = "msetable";
      var caption = document.createElement("caption");
      caption.textContent = "Key points";
      table.appendChild(caption);
      var head = document.createElement("tr");
      ["point", "stress", "strain"].forEach(function (t) {
        var th = document.createElement("th");
        th.textContent = t;
        head.appendChild(th);
      });
      table.appendChild(head);
      rows.forEach(function (row) {
        var tr = document.createElement("tr");
        row.forEach(function (cell) {
          var td = document.createElement("td");
          td.textContent = cell;
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });
      host.replaceChildren(table);
    }

    addSelect(controls, {
      label: "Material",
      value: state.key,
      options: Object.keys(presets).map(function (k) {
        return { value: k, label: presets[k].name };
      }),
      onChange: function (value) {
        state.key = value;
        var next = presets[value];
        state.eps = Math.min(state.eps, next.ef * 0.9);
        eInput.max = String(next.ef);
        eInput.value = String(state.eps);
        eInput.dispatchEvent(new Event("input"));
        render();
      }
    });

    var eInput = addRange(controls, {
      label: "Strain cursor",
      min: 0, max: mat().ef, step: 0.0005, value: state.eps,
      format: function (v) { return fmt(v * 100, 2) + "%"; },
      onInput: function (v) { state.eps = Math.min(v, mat().ef); render(); }
    });

    addToggle(controls, {
      label: "True stress–strain",
      value: state.showTrue,
      onChange: function (value) { state.showTrue = value; render(); }
    });

    addToggle(controls, {
      label: "0.2% offset",
      value: state.showOffset,
      onChange: function (value) { state.showOffset = value; render(); }
    });

    addButton(controls, {
      label: "Reset", ghost: true,
      onClick: function () {
        state.eps = 0.02;
        eInput.value = String(state.eps);
        eInput.dispatchEvent(new Event("input"));
        render();
      }
    });

    bindPointer(canvas, function (pt) {
      var size = { w: canvas.__cssW || 600, h: canvas.__cssH || 380 };
      var mm2 = { l: 58, r: 18, t: 16, b: 40 };
      var m = mat();
      var xmax = m.ef * 1.06;
      var e = clamp((pt.x - mm2.l) / (size.w - mm2.l - mm2.r), 0, 1) * xmax;
      if (state.showTrue) e = Math.exp(e) - 1;
      state.eps = clamp(e, 0, m.ef);
      eInput.max = String(m.ef);
      eInput.value = String(state.eps);
      eInput.dispatchEvent(new Event("input"));
      render();
    });

    addHint(root, "Drag or use the slider to move the strain cursor. Toggle true stress to see the curve shift.");
    LAB_RENDERS.push(render);
    render();
  };

  /* ============================================================
     4. Diffusion profile
     ============================================================ */

  var DIFF_PRESETS = {
    "c-fe": { name: "C in γ-Fe", D0: 2.3e-5, Q: 148, T: 950, Cs: 1.0, C0: 0.1, xmax: 1200, gas: "CH₄" },
    "n-fe": { name: "N in γ-Fe", D0: 9.1e-5, Q: 168, T: 1000, Cs: 0.8, C0: 0.05, xmax: 800, gas: "NH₃" },
    "cu-al": { name: "Cu in Al", D0: 6.5e-5, Q: 136, T: 500, Cs: 2.0, C0: 0.0, xmax: 600, gas: "Cu film" },
    "h-pd": { name: "H in Pd", D0: 2.2e-7, Q: 22, T: 300, Cs: 1.0, C0: 0.0, xmax: 200, gas: "H₂" }
  };

  function erf(x) {
    var sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return sign * y;
  }

  LAB.diffusion = function (root) {
    var cfg = readConfig(root);
    var presets = cfg.presets || DIFF_PRESETS;
    var key = cfg.preset || "c-fe";
    if (!presets[key]) key = Object.keys(presets)[0];
    var state = { key: key, T: presets[key].T, hours: 1, Cs: presets[key].Cs };
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);

    function mat() { return presets[state.key]; }

    function D() {
      var q = mat();
      return q.D0 * Math.exp(-q.Q * 1000 / (8.314462618 * (state.T + 273.15)));
    }

    function profile(xMicron, hours, Cs) {
      var q = mat();
      var t = Math.max(1e-6, hours * 3600);
      var d = D();
      var z = (xMicron * 1e-6) / (2 * Math.sqrt(d * t));
      return q.C0 + (Cs - q.C0) * (1 - erf(z));
    }

    function render() {
      var q = mat();
      var d = D();
      var t = state.hours * 3600;
      var size = setupCanvas(canvas, 360);
      var ctx = size.ctx, pal = palette();
      var w = size.w, h = size.h;
      var m = { l: 54, r: 18, t: 18, b: 40 };
      var iw = w - m.l - m.r, ih = h - m.t - m.b;
      var ymax = Math.max(state.Cs, q.C0) * 1.12;

      function X(x) { return m.l + (x / q.xmax) * iw; }
      function Y(c) { return m.t + (1 - c / ymax) * ih; }

      ctx.fillStyle = pal.sheet;
      ctx.fillRect(0, 0, w, h);

      ticks(0, q.xmax, 5).forEach(function (x) {
        line(ctx, X(x), m.t, X(x), h - m.b, pal.grid, 1, null);
        label(ctx, fmtInt(x), X(x), h - m.b + 14, pal.muted, 9.5, "center");
      });
      ticks(0, ymax, 5).forEach(function (c) {
        line(ctx, m.l, Y(c), w - m.r, Y(c), pal.grid, 1, null);
        label(ctx, fmt(c, 1), m.l - 7, Y(c) + 3, pal.muted, 9.5, "right");
      });
      label(ctx, "concentration, wt%", m.l, 10, pal.muted, 9.5, "left");
      label(ctx, "depth, µm", w - m.r, h - 8, pal.muted, 9.5, "right");

      /* ghost profiles at t/4 and 4t */
      [[0.25, pal.ruleStrong, [4, 4]], [4, pal.ruleStrong, [4, 4]]].forEach(function (ghost) {
        ctx.save();
        ctx.beginPath();
        for (var i = 0; i <= 300; i += 1) {
          var x = (i / 300) * q.xmax;
          var c = profile(x, state.hours * ghost[0], state.Cs);
          var px = X(x), py = Y(c);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = ghost[1];
        ctx.lineWidth = 1;
        ctx.setLineDash(ghost[2]);
        ctx.stroke();
        ctx.restore();
      });

      /* main profile */
      ctx.save();
      ctx.beginPath();
      for (var j = 0; j <= 360; j += 1) {
        var xx = (j / 360) * q.xmax;
        var cc = profile(xx, state.hours, state.Cs);
        var pxx = X(xx), pyy = Y(cc);
        if (j === 0) ctx.moveTo(pxx, pyy); else ctx.lineTo(pxx, pyy);
      }
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 2.1;
      ctx.stroke();
      ctx.restore();

      /* surface line */
      line(ctx, X(0), m.t, X(0), h - m.b, pal.accent, 1.4, null);

      /* 50% depth */
      var target = q.C0 + 0.5 * (state.Cs - q.C0);
      var x50 = null;
      for (var k = 0; k <= 4000; k += 1) {
        var xk = (k / 4000) * q.xmax;
        if (profile(xk, state.hours, state.Cs) <= target) { x50 = xk; break; }
      }
      if (x50 !== null) {
        line(ctx, X(x50), Y(target), X(x50), Y(0), pal.accent, 1.2, [4, 4]);
        dot(ctx, X(x50), Y(target), 3.4, pal.accent, pal.sheet);
        label(ctx, "x₅₀ = " + fmtInt(x50) + " µm", X(x50) + 6, Y(target) - 8, pal.accent, 9, "left", "alphabetic", 600);
      }

      /* readout */
      var sqrtDt = Math.sqrt(d * t) * 1e6;
      var surface = profile(0.0001, state.hours, state.Cs);
      setReadout(root, [
        ["System", q.name],
        ["Temperature", fmt(state.T, 0) + " °C"],
        ["D", d.toExponential(2) + " m²/s"],
        ["√(Dt)", fmt(sqrtDt, 1) + " µm"],
        ["x at 50%", x50 === null ? ">" + fmtInt(q.xmax) + " µm" : fmt(x50, 1) + " µm"],
        ["C at surface", fmt(surface, 2) + " wt%"],
        ["C at 100 µm", fmt(profile(100, state.hours, state.Cs), 2) + " wt%"],
        ["C at 500 µm", fmt(profile(500, state.hours, state.Cs), 2) + " wt%"]
      ]);

      setStatus(root,
        "Fick's second law with a constant surface concentration: C(x,t) = C₀ + (Cₛ − C₀)[1 − erf(x/2√(Dt))]. " +
        "At " + fmt(state.T, 0) + " °C, D = " + d.toExponential(2) + " m²/s, so √(Dt) = " + fmtInt(sqrtDt) + " µm. " +
        "Quadrupling the time doubles the penetration depth, not quadruples it.");

      setAria(canvas,
        "Concentration-depth profile for " + q.name + " at " + fmt(state.T, 0) +
        " degrees Celsius after " + fmt(state.hours, 2) + " hours. Fifty percent depth " +
        (x50 === null ? "beyond the plotted range" : fmt(x50, 0) + " micrometres") + ".");

      drawArrhenius(root, q, d);
    }

    function drawArrhenius(root, q, d) {
      var host = $("[data-table]", root);
      if (!host) return;
      var rows = [];
      [0.25, 1, 4, 16].forEach(function (hours) {
        var dt = Math.sqrt(d * hours * 3600) * 1e6;
        rows.push([fmt(hours, 2) + " h", fmtInt(dt) + " µm", "×" + fmt(Math.sqrt(hours), 1)]);
      });
      var table = document.createElement("table");
      table.className = "msetable";
      var caption = document.createElement("caption");
      caption.textContent = "Scaling check · same D";
      table.appendChild(caption);
      var head = document.createElement("tr");
      ["time", "√(Dt)", "vs 1 h"].forEach(function (t) {
        var th = document.createElement("th");
        th.textContent = t;
        head.appendChild(th);
      });
      table.appendChild(head);
      rows.forEach(function (row) {
        var tr = document.createElement("tr");
        row.forEach(function (cell) {
          var td = document.createElement("td");
          td.textContent = cell;
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });
      host.replaceChildren(table);
    }

    addSelect(controls, {
      label: "System",
      value: state.key,
      options: Object.keys(presets).map(function (k) {
        return { value: k, label: presets[k].name };
      }),
      onChange: function (value) {
        state.key = value;
        var next = presets[value];
        state.T = next.T;
        state.Cs = next.Cs;
        state.hours = 1;
        TInput.value = String(state.T);
        tInput.value = String(1000 * Math.log(1 / 0.05) / Math.log(100 / 0.05));
        TInput.dispatchEvent(new Event("input"));
        tInput.dispatchEvent(new Event("input"));
        render();
      }
    });

    var TInput = addRange(controls, {
      label: "Temperature",
      min: 200, max: 1200, step: 5, value: state.T,
      format: function (v) { return fmt(v, 0) + " °C"; },
      onInput: function (v) { state.T = v; render(); }
    });

    var tInput = addRange(controls, {
      label: "Time (log)",
      min: 0, max: 1000, step: 1, value: 394,
      format: function (v) {
        var hmin = 0.05, hmax = 100;
        return fmt(hmin * Math.pow(hmax / hmin, v / 1000), 2) + " h";
      },
      onInput: function (v) {
        var hmin = 0.05, hmax = 100;
        state.hours = hmin * Math.pow(hmax / hmin, v / 1000);
        render();
      }
    });
    state.hours = 1;
    tInput.value = String(1000 * Math.log(1 / 0.05) / Math.log(100 / 0.05));
    tInput.dispatchEvent(new Event("input"));

    addRange(controls, {
      label: "Surface Cₛ",
      min: 0.05, max: 2.5, step: 0.05, value: state.Cs,
      format: function (v) { return fmt(v, 2) + " wt%"; },
      onInput: function (v) { state.Cs = v; render(); }
    });

    addButton(controls, {
      label: "Reset", ghost: true,
      onClick: function () {
        var next = mat();
        state.T = next.T;
        state.Cs = next.Cs;
        state.hours = 1;
        TInput.value = String(state.T);
        tInput.value = String(1000 * Math.log(1 / 0.05) / Math.log(100 / 0.05));
        TInput.dispatchEvent(new Event("input"));
        tInput.dispatchEvent(new Event("input"));
        render();
      }
    });

    addHint(root, "Temperature changes D exponentially; time changes the penetration only as √t. The dashed profiles are t/4 and 4t.");
    LAB_RENDERS.push(render);
    render();
  };

  /* ============================================================
     5. Powder XRD
     ============================================================ */

  /* Cromer–Mann coefficients (International Tables, Vol C).
     f(s) = sum a_i exp(-b_i s^2) + c, with s = sin(theta)/lambda in Å^-1. */
  var CM = {
    C:   { a: [2.31, 1.02, 1.5886, 0.865], b: [20.8439, 10.2075, 0.5687, 51.6512], c: 0.2156 },
    N:   { a: [12.2126, 3.1322, 2.0125, 1.1663], b: [0.0057, 9.8933, 28.9975, 0.5826], c: -11.529 },
    O:   { a: [3.0485, 2.2868, 1.5463, 0.867], b: [13.2771, 5.7011, 0.3239, 32.9089], c: 0.2508 },
    Na:  { a: [4.7626, 3.1736, 1.2674, 1.1128], b: [3.285, 8.8422, 0.3136, 129.424], c: 0.676 },
    Mg:  { a: [5.4204, 2.1735, 1.2269, 2.3073], b: [2.8275, 79.2611, 0.3808, 7.1937], c: 0.8584 },
    Al:  { a: [6.4202, 1.9002, 1.5936, 1.9646], b: [3.0387, 0.7426, 31.5472, 85.0886], c: 1.1151 },
    Si:  { a: [6.2915, 3.0353, 1.9891, 1.541], b: [2.4386, 32.3337, 0.6785, 81.6937], c: 1.1407 },
    Cl:  { a: [11.4604, 7.1964, 6.2556, 1.6455], b: [0.0104, 1.1662, 18.5194, 47.7784], c: -9.5574 },
    Ti:  { a: [9.7595, 7.3558, 1.6991, 1.9021], b: [7.8508, 0.5, 35.6338, 116.105], c: 1.2807 },
    Cr:  { a: [10.6406, 7.3537, 3.324, 1.4922], b: [6.1038, 0.392, 20.2626, 98.7399], c: 1.1832 },
    Fe:  { a: [11.7695, 7.3573, 3.5222, 2.3045], b: [4.7611, 0.3072, 15.3535, 76.8805], c: 1.0369 },
    Ni:  { a: [12.8376, 7.292, 4.4438, 2.38], b: [3.8785, 0.2565, 12.1763, 66.3421], c: 1.0341 },
    Cu:  { a: [13.338, 7.1676, 5.6158, 1.6735], b: [3.5828, 0.247, 11.3966, 64.8126], c: 1.191 },
    Ge:  { a: [16.0816, 6.3747, 3.7068, 3.683], b: [2.8509, 0.2516, 11.4468, 54.7625], c: 2.1313 },
    Mo:  { a: [3.7025, 17.2356, 12.8876, 3.7429], b: [0.2772, 1.0958, 11.004, 61.6584], c: 4.3875 },
    Ag:  { a: [19.2808, 16.6885, 4.8045, 1.0463], b: [0.6446, 7.4726, 24.6605, 99.8156], c: 5.179 },
    Sn:  { a: [19.1889, 19.1005, 4.4585, 2.4663], b: [5.8303, 0.5031, 26.8909, 83.9571], c: 4.7821 },
    W:   { a: [29.0818, 15.43, 14.4327, 5.11982], b: [1.72029, 9.2259, 0.321703, 57.056], c: 9.8875 },
    Au:  { a: [16.8819, 18.5913, 25.5582, 5.86], b: [0.4611, 8.6216, 1.4826, 36.3956], c: 12.0658 },
    Pb:  { a: [31.0617, 13.0637, 18.442, 5.9696], b: [0.6902, 2.3576, 8.618, 47.2579], c: 13.4118 },
    Po:  { a: [34.6726, 15.4733, 13.1138, 7.02588], b: [0.700999, 3.55078, 9.55642, 47.0045], c: 13.677 }
  };

  function formFactor(element, s) {
    var cm = CM[element];
    if (!cm) return 1;
    var s2 = s * s;
    var f = cm.c;
    for (var i = 0; i < 4; i += 1) f += cm.a[i] * Math.exp(-cm.b[i] * s2);
    return f;
  }

  var XRD_STRUCTS = {
    sc: {
      label: "Simple cubic", rule: "all", element: "Po",
      f2: function (h, k, l, s, el) { var f = formFactor(el, s); return f * f; }
    },
    bcc: {
      label: "BCC", rule: "bcc", element: "Fe",
      f2: function (h, k, l, s, el) {
        if ((h + k + l) % 2 !== 0) return 0;
        var f = formFactor(el, s);
        return 4 * f * f;
      }
    },
    fcc: {
      label: "FCC", rule: "fcc", element: "Cu",
      f2: function (h, k, l, s, el) {
        if (!allEven(h, k, l) && !allOdd(h, k, l)) return 0;
        var f = formFactor(el, s);
        return 16 * f * f;
      }
    },
    diamond: {
      label: "Diamond cubic", rule: "diamond", element: "Si",
      f2: function (h, k, l, s, el) {
        var f = formFactor(el, s);
        if (allOdd(h, k, l)) return 32 * f * f;
        if (allEven(h, k, l) && (h + k + l) % 4 === 0) return 64 * f * f;
        return 0;
      }
    },
    nacl: {
      label: "Rock salt (NaCl)", rule: "nacl", element: "Na–Cl",
      f2: function (h, k, l, s) {
        var fNa = formFactor("Na", s), fCl = formFactor("Cl", s);
        if (allEven(h, k, l)) return 16 * Math.pow(fNa + fCl, 2);
        if (allOdd(h, k, l)) return 16 * Math.pow(fNa - fCl, 2);
        return 0;
      }
    }
  };

  function allEven(h, k, l) { return h % 2 === 0 && k % 2 === 0 && l % 2 === 0; }
  function allOdd(h, k, l) { return Math.abs(h % 2) === 1 && Math.abs(k % 2) === 1 && Math.abs(l % 2) === 1; }

  function multiplicity(h, k, l) {
    var seen = {};
    var perms = [[h, k, l], [h, l, k], [k, h, l], [k, l, h], [l, h, k], [l, k, h]];
    perms.forEach(function (p) {
      for (var mask = 0; mask < 8; mask += 1) {
        var v = p.map(function (val, index) {
          if (val === 0) return 0;
          return (mask & (1 << index)) ? -val : val;
        });
        seen[v.join(",")] = true;
      }
    });
    return Object.keys(seen).length;
  }

  LAB.xrd = function (root) {
    var cfg = readConfig(root);
    var state = {
      key: cfg.structure || "fcc",
      a: Number(cfg.a) || 3.615,
      lambda: Number(cfg.lambda) || 1.5406
    };
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);

    function peaks() {
      var s = XRD_STRUCTS[state.key] || XRD_STRUCTS.fcc;
      var out = [];
      /* Enumerate each symmetry family once: h >= k >= l >= 0. The
         multiplicity factor below restores the equivalent reflections. */
      for (var h = 0; h <= 7; h += 1) {
        for (var k = 0; k <= h; k += 1) {
          for (var l = 0; l <= k; l += 1) {
            if (h === 0 && k === 0 && l === 0) continue;
            var n = h * h + k * k + l * l;
            var d = state.a / Math.sqrt(n);
            var sinTheta = state.lambda / (2 * d);
            if (sinTheta <= 0 || sinTheta >= 1) continue;
            var sVal = sinTheta / state.lambda;
            var structureFactor = s.f2(h, k, l, sVal, cfg.element || s.element);
            if (!structureFactor) continue;
            var twoTheta = 2 * Math.asin(sinTheta) * 180 / Math.PI;
            if (twoTheta < 10 || twoTheta > 120) continue;
            var theta = twoTheta * Math.PI / 360;
            var lp = (1 + Math.cos(2 * theta) * Math.cos(2 * theta)) / (Math.sin(theta) * Math.sin(theta) * Math.cos(theta));
            /* Debye–Waller damping, B = 0.6 Å². No absorption or texture. */
            var dw = Math.exp(-1.2 * sVal * sVal);
            var intensity = structureFactor * multiplicity(h, k, l) * lp * dw;
            out.push({ h: h, k: k, l: l, d: d, tt: twoTheta, i: intensity });
          }
        }
      }
      out.sort(function (p, q) { return p.tt - q.tt; });
      var merged = [];
      out.forEach(function (p) {
        var last = merged[merged.length - 1];
        if (last && Math.abs(last.tt - p.tt) < 0.08) {
          last.i += p.i;
        } else {
          merged.push({ h: p.h, k: p.k, l: p.l, d: p.d, tt: p.tt, i: p.i });
        }
      });
      var max = merged.reduce(function (mx, p) { return Math.max(mx, p.i); }, 0) || 1;
      merged.forEach(function (p) { p.rel = p.i / max; });
      return merged;
    }

    function render() {
      var ps = peaks();
      var size = setupCanvas(canvas, 380);
      var ctx = size.ctx, pal = palette();
      var w = size.w, h = size.h;
      var m = { l: 46, r: 18, t: 38, b: 44 };
      var iw = w - m.l - m.r, ih = h - m.t - m.b;

      function X(tt) { return m.l + ((tt - 10) / 110) * iw; }
      function Y(rel) { return m.t + (1 - rel) * ih; }

      ctx.fillStyle = pal.sheet;
      ctx.fillRect(0, 0, w, h);

      ticks(10, 120, 6).forEach(function (tt) {
        line(ctx, X(tt), m.t, X(tt), h - m.b, pal.grid, 1, null);
        label(ctx, fmt(tt, 0), X(tt), h - m.b + 14, pal.muted, 9.5, "center");
      });
      [0, 0.25, 0.5, 0.75, 1].forEach(function (rel) {
        line(ctx, m.l, Y(rel), w - m.r, Y(rel), pal.grid, 1, null);
        label(ctx, fmt(rel * 100, 0), m.l - 7, Y(rel) + 3, pal.muted, 9.5, "right");
      });
      label(ctx, "intensity, %", m.l, 10, pal.muted, 9.5, "left");
      label(ctx, "2θ, degrees", w - m.r, h - 8, pal.muted, 9.5, "right");

      /* sticks */
      ps.forEach(function (p, index) {
        var x = X(p.tt);
        var top = Y(p.rel);
        line(ctx, x, h - m.b, x, top, pal.accent, 2, null);
        if (p.rel > 0.03) {
          ctx.save();
          ctx.translate(x - 3, top - 4);
          ctx.rotate(-Math.PI / 2);
          ctx.font = '600 8.5px "IBM Plex Sans", system-ui, sans-serif';
          ctx.fillStyle = pal.ink2;
          ctx.textAlign = "left";
          ctx.fillText("(" + p.h + p.k + p.l + ")", 0, 0);
          ctx.restore();
        }
      });

      /* baseline */
      line(ctx, m.l, h - m.b, w - m.r, h - m.b, pal.ruleStrong, 1.2, null);

      var first = ps.slice(0, 6);
      setReadout(root, [
        ["Structure", XRD_STRUCTS[state.key].label],
        ["Element", cfg.element || XRD_STRUCTS[state.key].element],
        ["a", fmt(state.a, 3) + " Å"],
        ["λ", fmt(state.lambda, 4) + " Å"],
        ["First peak", first[0] ? "(" + first[0].h + first[0].k + first[0].l + ") at " + fmt(first[0].tt, 2) + "°" : "—"],
        ["d of first", first[0] ? fmt(first[0].d, 3) + " Å" : "—"],
        ["Peaks in range", fmtInt(ps.length)],
        ["Strongest", strongest(ps)]
      ]);

      setStatus(root,
        "Bragg's law, λ = 2d sin θ, with d = a/√(h² + k² + l²) for a cubic cell. " +
        "The allowed (hkl) sequence is a fingerprint: BCC needs h + k + l even, FCC needs all-odd or all-even, diamond forbids 200. " +
        "Heights use Cromer–Mann form factors, multiplicity, Lorentz–polarisation and a Debye–Waller factor; no absorption, texture or Kα2 splitting.");

      setAria(canvas,
        "Powder X-ray diffraction pattern for " + XRD_STRUCTS[state.key].label +
        ", lattice parameter " + fmt(state.a, 3) + " angstrom, wavelength " + fmt(state.lambda, 4) +
        " angstrom. " + ps.length + " peaks between 10 and 120 degrees.");

      drawPeakTable(root, first);
    }

    function strongest(ps) {
      var best = ps.reduce(function (a, b) { return b.rel > a.rel ? b : a; }, ps[0]);
      return best ? "(" + best.h + best.k + best.l + ") " + fmt(best.tt, 1) + "°" : "—";
    }

    function drawPeakTable(root, ps) {
      var host = $("[data-table]", root);
      if (!host) return;
      var table = document.createElement("table");
      table.className = "msetable";
      var caption = document.createElement("caption");
      caption.textContent = "First reflections";
      table.appendChild(caption);
      var head = document.createElement("tr");
      ["hkl", "2θ", "d (Å)", "I (%)"].forEach(function (t) {
        var th = document.createElement("th");
        th.textContent = t;
        head.appendChild(th);
      });
      table.appendChild(head);
      ps.forEach(function (p) {
        var tr = document.createElement("tr");
        [("(" + p.h + p.k + p.l + ")"), fmt(p.tt, 2) + "°", fmt(p.d, 3), fmt(p.rel * 100, 0)].forEach(function (cell) {
          var td = document.createElement("td");
          td.textContent = cell;
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });
      host.replaceChildren(table);
    }

    addSelect(controls, {
      label: "Structure",
      value: state.key,
      options: Object.keys(XRD_STRUCTS).map(function (k) {
        return { value: k, label: XRD_STRUCTS[k].label };
      }),
      onChange: function (value) {
        state.key = value;
        state.a = { sc: 3.35, bcc: 2.87, fcc: 3.615, diamond: 5.431, nacl: 5.64 }[value];
        aInput.value = String(state.a);
        aInput.dispatchEvent(new Event("input"));
      }
    });

    var aInput = addRange(controls, {
      label: "Lattice parameter a",
      min: 2.6, max: 6.2, step: 0.005, value: state.a,
      format: function (v) { return fmt(v, 3) + " Å"; },
      onInput: function (v) { state.a = v; render(); }
    });

    addSelect(controls, {
      label: "Radiation λ",
      value: String(state.lambda),
      options: [
        { value: "1.5406", label: "Cu Kα 1.5406 Å" },
        { value: "1.789", label: "Co Kα 1.789 Å" },
        { value: "0.7107", label: "Mo Kα 0.7107 Å" }
      ],
      onChange: function (value) { state.lambda = Number(value); render(); }
    });

    addButton(controls, {
      label: "Reset", ghost: true,
      onClick: function () {
        state.a = { sc: 3.35, bcc: 2.87, fcc: 3.615, diamond: 5.431, nacl: 5.64 }[state.key];
        aInput.value = String(state.a);
        aInput.dispatchEvent(new Event("input"));
        render();
      }
    });

    addHint(root, "Read the pattern as a set of spacings, not a set of heights: peak positions give the cell, peak rules give the lattice type.");
    LAB_RENDERS.push(render);
    render();
  };

  /* ============================================================
     Quiz
     ============================================================ */

  function readStore(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      var value = JSON.parse(raw);
      return value === null || value === undefined ? fallback : value;
    } catch (err) {
      return fallback;
    }
  }

  function writeStore(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (err) {}
  }

  function initQuiz(root) {
    var dataEl = $("script.quiz-data", root);
    if (!dataEl) return;
    var QUESTIONS;
    try {
      QUESTIONS = JSON.parse(dataEl.textContent);
    } catch (err) {
      console.error("Quiz JSON is invalid", err);
      return;
    }
    if (!Array.isArray(QUESTIONS) || !QUESTIONS.length) return;

    var questionsEl = $("[data-quiz-questions]", root);
    var progressEl = $("[data-quiz-progress]", root);
    var scoreEl = $("[data-quiz-score]", root);
    var resetBtn = $("[data-quiz-reset]", root);
    var retryBtn = $("[data-quiz-retry]", root);
    var storageKey = "mse-note-quiz:" + (root.getAttribute("data-quiz-id") || document.title || "default");
    var answers = readStore(storageKey, {});
    if (!answers || typeof answers !== "object") answers = {};

    function answeredCount() {
      return Object.keys(answers).filter(function (k) {
        return answers[k] !== null && answers[k] !== undefined;
      }).length;
    }

    function correctCount() {
      return Object.keys(answers).reduce(function (total, k) {
        var i = parseInt(k, 10);
        return total + (QUESTIONS[i] && answers[k] === QUESTIONS[i].answer ? 1 : 0);
      }, 0);
    }

    function updateBar() {
      var total = QUESTIONS.length;
      var answered = answeredCount();
      var correct = correctCount();
      if (progressEl) progressEl.textContent = answered + " / " + total + " answered";
      if (scoreEl) scoreEl.textContent = correct + " correct";
      if (retryBtn) {
        var missed = answered - correct;
        retryBtn.hidden = missed <= 0;
        retryBtn.textContent = "Retry " + missed + " missed";
      }
    }

    function mark(questionEl, i) {
      var chosen = answers[i];
      var isAnswered = chosen !== undefined && chosen !== null;
      questionEl.classList.toggle("is-answered", isAnswered);
      $$(".msequiz__option", questionEl).forEach(function (button, j) {
        button.disabled = isAnswered;
        button.classList.remove("is-correct", "is-wrong");
        button.setAttribute("aria-pressed", isAnswered && chosen === j ? "true" : "false");
        if (isAnswered && j === QUESTIONS[i].answer) button.classList.add("is-correct");
        if (isAnswered && chosen === j && j !== QUESTIONS[i].answer) button.classList.add("is-wrong");
      });
    }

    function build() {
      if (!questionsEl) return;
      questionsEl.replaceChildren();
      QUESTIONS.forEach(function (question, i) {
        var wrap = document.createElement("div");
        wrap.className = "msequiz__question";
        wrap.setAttribute("data-q", String(i));

        var prompt = document.createElement("p");
        prompt.className = "msequiz__prompt";
        var num = document.createElement("span");
        num.className = "qnum";
        num.textContent = String(i + 1).padStart(2, "0");
        prompt.appendChild(num);
        prompt.appendChild(document.createTextNode(" " + question.prompt));
        wrap.appendChild(prompt);

        var options = document.createElement("div");
        options.className = "msequiz__options";
        question.options.forEach(function (option, j) {
          var button = document.createElement("button");
          button.type = "button";
          button.className = "msequiz__option";
          button.textContent = option;
          button.addEventListener("click", function () {
            if (answers[i] !== undefined && answers[i] !== null) return;
            answers[i] = j;
            writeStore(storageKey, answers);
            mark(wrap, i);
            updateBar();
          });
          options.appendChild(button);
        });
        wrap.appendChild(options);

        var explain = document.createElement("p");
        explain.className = "msequiz__explain";
        explain.setAttribute("role", "status");
        explain.setAttribute("aria-live", "polite");
        var strong = document.createElement("strong");
        strong.textContent = "Why: ";
        explain.appendChild(strong);
        explain.appendChild(document.createTextNode(question.explain));
        wrap.appendChild(explain);

        questionsEl.appendChild(wrap);
        mark(wrap, i);
      });
      updateBar();
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        answers = {};
        writeStore(storageKey, answers);
        build();
      });
    }

    /* A local record, not a gradebook: the student can submit the JSON. */
    var exportBtn = document.createElement("button");
    exportBtn.type = "button";
    exportBtn.className = "msebtn";
    exportBtn.textContent = "Export results";
    exportBtn.title = "Download a local JSON record; this is not a gradebook.";
    exportBtn.addEventListener("click", function () {
      var record = {
        quiz: root.getAttribute("data-quiz-id") || document.title,
        exported: new Date().toISOString(),
        answered: answeredCount(),
        correct: correctCount(),
        total: QUESTIONS.length,
        note: "Local self-check record. Not a gradebook.",
        questions: QUESTIONS.map(function (question, i) {
          var chosen = answers[i];
          return {
            prompt: question.prompt,
            options: question.options,
            answer: question.answer,
            chosen: chosen === undefined ? null : chosen,
            correct: chosen === question.answer,
            explain: question.explain
          };
        })
      };
      var blob = new Blob([JSON.stringify(record, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "quiz-" + (root.getAttribute("data-quiz-id") || "results") + ".json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    });
    if (resetBtn && resetBtn.parentNode) {
      resetBtn.parentNode.insertBefore(exportBtn, resetBtn);
    } else if (scoreEl && scoreEl.parentNode) {
      scoreEl.parentNode.appendChild(exportBtn);
    }
    if (retryBtn) {
      retryBtn.addEventListener("click", function () {
        var kept = {};
        Object.keys(answers).forEach(function (k) {
          var i = parseInt(k, 10);
          if (QUESTIONS[i] && answers[k] === QUESTIONS[i].answer) kept[i] = answers[k];
        });
        answers = kept;
        writeStore(storageKey, answers);
        build();
      });
    }
    build();
  }

  /* ============================================================
     Boot
     ============================================================ */

  function initAll() {
    $$("[data-mse-lab]").forEach(function (root) {
      if (root.getAttribute("data-mse-ready") === "1") return;
      var kind = root.getAttribute("data-mse-lab");
      var init = LAB[kind];
      if (!init) {
        setStatus(root, "Unknown lab type: " + kind);
        console.warn("Unknown MSE lab", kind);
        return;
      }
      try {
        init(root);
        root.setAttribute("data-mse-ready", "1");
      } catch (err) {
        console.error(err);
        setStatus(root, "This lab failed to render: " + err.message);
      }
    });
    $$("[data-mse-quiz]").forEach(initQuiz);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  if (window.MutationObserver) {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.attributeName === "data-theme") rerenderAll();
      });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }
  window.addEventListener("resize", debounce(rerenderAll, 160));

  function debounce(fn, delay) {
    return function () {
      window.clearTimeout(rerenderTimer);
      rerenderTimer = window.setTimeout(fn, delay);
    };
  }

  function rerenderAll() {
    window.requestAnimationFrame(function () {
      LAB_RENDERS.forEach(function (fn) {
        try { fn(); } catch (err) { console.error(err); }
      });
    });
  }

  window.__MSE_LABS__ = {
    register: function (kind, init) { LAB[kind] = init; },
    onRender: function (fn) { LAB_RENDERS.push(fn); },
    init: initAll,
    rerender: rerenderAll,
    palette: palette,
    helpers: {
      $: $, $$: $$, clamp: clamp, fmt: fmt, fmtInt: fmtInt, pct: pct,
      palette: palette, setupCanvas: setupCanvas, bindPointer: bindPointer,
      setAria: setAria, setStatus: setStatus, setReadout: setReadout,
      addHint: addHint, addRange: addRange, addSelect: addSelect,
      addToggle: addToggle, addButton: addButton, readConfig: readConfig,
      line: line, dot: dot, label: label, ticks: ticks
    }
  };
})();
