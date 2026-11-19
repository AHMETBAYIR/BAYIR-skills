/* ============================================================
   Interactive materials science notes — lab engines
   Vanilla JS, no dependencies, one file, inlined by the builder.

   A lab is declared as:

     <div class="bmelab" data-bme-lab="phase">
       ... <canvas data-canvas></canvas> ...
       <script type="application/json" class="bmelab-config">
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
      alpha: readCss("--bme-alpha", "#2f5d8a"),
      beta: readCss("--bme-beta", "#9a3b32"),
      liquid: readCss("--bme-liquid", "#b07a2a"),
      grid: readCss("--bme-grid", "rgba(30,27,23,0.10)"),
      gridStrong: readCss("--bme-grid-strong", "rgba(30,27,23,0.22)"),
      atomA: readCss("--bme-atom-a", "#6f93b8"),
      atomB: readCss("--bme-atom-b", "#c07a6a"),
      atomEdge: readCss("--bme-atom-edge", "rgba(30,27,23,0.35)")
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
    wrap.className = "bmefield";
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
    wrap.className = "bmefield";
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
    button.className = "bmebtn";
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
    button.className = "bmebtn" + (opts.ghost ? " bmebtn--ghost" : "");
    button.textContent = opts.label;
    button.addEventListener("click", function () { if (opts.onClick) opts.onClick(); });
    controls.appendChild(button);
    return button;
  }

  function readConfig(root) {
    var el = $("script.bmelab-config", root);
    if (!el) return {};
    try {
      return JSON.parse(el.textContent);
    } catch (err) {
      setStatus(root, "This lab has an invalid JSON config.");
      console.error("Invalid bmelab-config", err);
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
     Interactive biomedical engineering notes — lab engines
     Vanilla JS. No dependencies. One file.
     ============================================================ */

  var LAB = {};

  /* ---------------- local helpers ---------------- */

  function addText(controls, opts) {
    var wrap = document.createElement("label");
    wrap.className = "bmefield";
    wrap.style.minWidth = opts.wide ? "100%" : "12rem";
    var label = document.createElement("span");
    label.textContent = opts.label;
    wrap.appendChild(label);
    var input = document.createElement("input");
    input.type = "text";
    input.value = opts.value || "";
    input.spellcheck = false;
    input.autocomplete = "off";
    input.style.font = '500 0.78rem/1.3 "IBM Plex Mono", ui-monospace, monospace';
    input.style.padding = "0.35rem 0.4rem";
    input.style.border = "1px solid var(--rule-strong)";
    input.style.borderRadius = "var(--radius)";
    input.style.background = "var(--sheet)";
    input.style.color = "var(--ink)";
    input.style.width = "100%";
    input.addEventListener("input", function () {
      if (opts.onInput) opts.onInput(input.value.toUpperCase().replace(/[^ACGTN]/g, ""));
    });
    wrap.appendChild(input);
    controls.appendChild(wrap);
    return input;
  }

  function axes(ctx, box, xmin, xmax, ymin, ymax, opts) {
    var pal = palette();
    opts = opts || {};
    ctx.save();
    ctx.strokeStyle = pal.ruleStrong;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(box.x, box.y);
    ctx.lineTo(box.x, box.y + box.h);
    ctx.lineTo(box.x + box.w, box.y + box.h);
    ctx.stroke();
    ctx.strokeStyle = pal.grid;
    ctx.setLineDash([2, 3]);
    var xt = ticks(xmin, xmax, opts.xTicks || 5);
    xt.forEach(function (v) {
      var px = box.x + (v - xmin) / (xmax - xmin) * box.w;
      ctx.beginPath(); ctx.moveTo(px, box.y); ctx.lineTo(px, box.y + box.h); ctx.stroke();
    });
    var yt = ticks(ymin, ymax, opts.yTicks || 5);
    yt.forEach(function (v) {
      var py = box.y + box.h - (v - ymin) / (ymax - ymin) * box.h;
      ctx.beginPath(); ctx.moveTo(box.x, py); ctx.lineTo(box.x + box.w, py); ctx.stroke();
    });
    ctx.restore();
    label(ctx, opts.xLabel || "", box.x + box.w / 2, box.y + box.h + 26, pal.muted, 11, "center");
    ctx.save();
    ctx.translate(box.x - 40, box.y + box.h / 2);
    ctx.rotate(-Math.PI / 2);
    label(ctx, opts.yLabel || "", 0, 0, pal.muted, 11, "center");
    ctx.restore();
    return { xt: xt, yt: yt };
  }

  function plot(box, xmin, xmax, ymin, ymax, x, y) {
    return {
      x: box.x + (x - xmin) / (xmax - xmin) * box.w,
      y: box.y + box.h - (y - ymin) / (ymax - ymin) * box.h
    };
  }

  function arrow(ctx, x1, y1, x2, y2, color, width, head) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width || 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    var a = Math.atan2(y2 - y1, x2 - x1);
    var h = head || 8;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - h * Math.cos(a - 0.4), y2 - h * Math.sin(a - 0.4));
    ctx.lineTo(x2 - h * Math.cos(a + 0.4), y2 - h * Math.sin(a + 0.4));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* ============================================================
     1. Elbow joint: moment arm and joint reaction force
     ============================================================ */

  LAB.joint = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var state = { angle: 90, load: 10, a: 0.30, b: 0.035, d: 0.35 };
    var G = 9.81;

    function model() {
      var th = state.angle * Math.PI / 180;
      var u = [Math.sin(th), -Math.cos(th)];
      var A = [0, state.a];
      var B = [state.b * u[0], state.b * u[1]];
      var P = [state.d * u[0], state.d * u[1]];
      var L = Math.hypot(A[0] - B[0], A[1] - B[1]);
      var um = [(A[0] - B[0]) / L, (A[1] - B[1]) / L];
      var r = Math.abs(B[0] * um[1] - B[1] * um[0]);
      var W = -state.load * G;
      var torque = Math.abs(state.load * G * state.d * Math.sin(th));
      var Fm = r > 1e-6 ? torque / r : Infinity;
      var Rx = -(Fm * um[0]);
      var Ry = -(Fm * um[1] + W);
      return { u: u, A: A, B: B, P: P, L: L, um: um, r: r, Fm: Fm, torque: torque, R: Math.hypot(Rx, Ry) };
    }

    function draw() {
      var c = setupCanvas(canvas, 400);
      var ctx = c.ctx, w = c.w, h = c.h, pal = palette();
      var m = model();
      var scale = Math.min((w - 150) / 0.55, (h - 110) / 0.42);
      var ex = w * 0.42, ey = h * 0.60;
      function px(p) { return [ex + p[0] * scale, ey - p[1] * scale]; }

      var S = px([0, state.a]);
      var E = [ex, ey];
      var B = px(m.B);
      var P = px(m.P);

      // angle arc
      ctx.save();
      ctx.strokeStyle = pal.ruleStrong;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(ex, ey, 46, Math.PI / 2 - Math.PI / 2, Math.PI / 2 - state.angle * Math.PI / 180 + Math.PI / 2, true);
      ctx.stroke();
      ctx.restore();
      label(ctx, state.angle.toFixed(0) + "°", ex + 52, ey - 10, pal.muted, 11);

      // upper arm and forearm
      ctx.save();
      ctx.strokeStyle = pal.ink2;
      ctx.lineWidth = 13;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(E[0], E[1]); ctx.lineTo(S[0], S[1]); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(E[0], E[1]); ctx.lineTo(P[0], P[1]); ctx.stroke();
      ctx.restore();

      // joint markers
      dot(ctx, E[0], E[1], 6, pal.sheet, pal.ink);
      dot(ctx, S[0], S[1], 7, pal.accentSoft, pal.accent);
      dot(ctx, P[0], P[1], 9, pal.accentSoft, pal.accent);

      // muscle
      line(ctx, B[0], B[1], S[0], S[1], pal.beta, 2, [5, 4]);
      label(ctx, "biceps", B[0] - 56, B[1] - 10, pal.beta, 11);

      // load
      arrow(ctx, P[0], P[1] + 6, P[0], P[1] + 54, pal.ink, 2.2, 9);
      label(ctx, state.load.toFixed(0) + " kg", P[0] + 10, P[1] + 48, pal.ink, 11);

      // muscle force arrow
      var flen = Math.min(70, 18 + m.Fm / 40);
      arrow(ctx, B[0], B[1], B[0] + m.um[0] * flen, B[1] - m.um[1] * flen, pal.accent, 2.4, 9);
      label(ctx, fmt(m.Fm, 0) + " N", B[0] + m.um[0] * flen + 4, B[1] - m.um[1] * flen - 6, pal.accent, 11);

      // joint reaction
      var rl = Math.min(58, 14 + m.R / 45);
      arrow(ctx, E[0], E[1], E[0] - 0.6 * rl, E[1] + 0.8 * rl, pal.def, 2, 8);
      label(ctx, "R", E[0] - 0.6 * rl - 12, E[1] + 0.8 * rl + 12, pal.def, 11);

      // readout
      setReadout(root, [
        ["Moment arm r", fmt(m.r * 100, 1) + " cm"],
        ["Muscle force", fmt(m.Fm, 0) + " N"],
        ["Joint reaction", fmt(m.R, 0) + " N"],
        ["Load torque", fmt(m.torque, 1) + " N·m"],
        ["Load lever", fmt(state.d * Math.sin(state.angle * Math.PI / 180) * 100, 1) + " cm"]
      ]);
      var status;
      if (state.angle < 15) status = "Near full extension the moment arm approaches zero: the required muscle force diverges. That is why the joint is vulnerable there, not because the load is larger.";
      else if (m.r > 0.029) status = "The moment arm peaks near 97° for these dimensions, slightly past a right angle. Muscle force is torque divided by this arm.";
      else status = "Both the load lever and the muscle moment arm change with angle; they do not peak together.";
      setStatus(root, status);
      setAria(canvas, "Elbow at " + state.angle.toFixed(0) + " degrees, load " + state.load.toFixed(0) + " kg, muscle force " + fmt(m.Fm, 0) + " newtons, joint reaction " + fmt(m.R, 0) + " newtons.");
    }

    addRange(controls, {
      label: "Flexion angle", min: 5, max: 140, step: 1, value: state.angle,
      format: function (v) { return v.toFixed(0) + "°"; },
      onInput: function (v) { state.angle = v; draw(); }
    });
    addRange(controls, {
      label: "Load", min: 0, max: 30, step: 0.5, value: state.load,
      format: function (v) { return v.toFixed(1) + " kg"; },
      onInput: function (v) { state.load = v; draw(); }
    });
    addButton(controls, {
      label: "Reset", ghost: true,
      onClick: function () { state.angle = 90; state.load = 10; window.__BME_LABS__.rerender(); }
    });
    addHint(root, "Moment arm r = ab sin θ / L, with a = 30 cm (origin), b = 3.5 cm (insertion). Force is torque ÷ r. Try 70° and 90° and compare.");
    LAB_RENDERS.push(draw);
    draw();
  };

  /* ============================================================
     2. Viscoelasticity: Kelvin–Voigt vs Maxwell
     ============================================================ */

  LAB.visco = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var state = { model: "kv", test: "creep", E: 1.0, eta: 5.0, sigma: 0.2, t: 10, T: 30 };

    function tau() { return state.eta / state.E; }

    function strain(model, t) {
      if (model === "kv") return state.sigma / state.E * (1 - Math.exp(-t / tau()));
      return state.sigma / state.E + state.sigma * t / state.eta;
    }
    function stress(model, t) {
      if (model === "kv") return state.sigma;
      return state.sigma * Math.exp(-t / tau());
    }

    function draw() {
      var c = setupCanvas(canvas, 360);
      var ctx = c.ctx, w = c.w, h = c.h, pal = palette();
      var box = { x: 62, y: 22, w: w - 92, h: h - 78 };
      var isCreep = state.test === "creep";
      var vals = [];
      for (var i = 0; i <= 120; i += 1) {
        var t = state.T * i / 120;
        vals.push(isCreep ? strain(state.model, t) : stress(state.model, t));
        vals.push(isCreep ? strain(state.model === "kv" ? "maxwell" : "kv", t) : stress(state.model === "kv" ? "maxwell" : "kv", t));
      }
      var ymax = Math.max.apply(null, vals) * 1.12 || 1;
      var ymin = 0;
      axes(ctx, box, 0, state.T, ymin, ymax, {
        xLabel: "time (s)",
        yLabel: isCreep ? "strain ε" : "stress σ (MPa)",
        xTicks: 6, yTicks: 5
      });

      function curve(model, color, width, dash) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        if (dash) ctx.setLineDash(dash);
        ctx.beginPath();
        for (var i = 0; i <= 240; i += 1) {
          var t = state.T * i / 240;
          var y = isCreep ? strain(model, t) : stress(model, t);
          var p = plot(box, 0, state.T, ymin, ymax, t, y);
          if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.restore();
      }

      curve(state.model, pal.accent, 2.4);
      curve(state.model === "kv" ? "maxwell" : "kv", pal.muted, 1.4, [5, 4]);

      var cur = isCreep ? strain(state.model, state.t) : stress(state.model, state.t);
      var p = plot(box, 0, state.T, ymin, ymax, state.t, cur);
      line(ctx, p.x, box.y, p.x, box.y + box.h, pal.ruleStrong, 1, [3, 3]);
      dot(ctx, p.x, p.y, 4.5, pal.accent, pal.sheet);

      label(ctx, "solid: " + (state.model === "kv" ? "Kelvin–Voigt" : "Maxwell"), box.x + 8, box.y + 14, pal.accent, 11);
      label(ctx, "dashed: " + (state.model === "kv" ? "Maxwell" : "Kelvin–Voigt"), box.x + 8, box.y + 30, pal.muted, 11);

      var inf = state.model === "kv" ? state.sigma / state.E : Infinity;
      setReadout(root, [
        ["τ = η/E", fmt(tau(), 2) + " s"],
        [isCreep ? "ε at cursor" : "σ at cursor", fmt(cur, 4) + (isCreep ? "" : " MPa")],
        [isCreep ? "ε(∞)" : "σ(∞)", isFinite(inf) ? fmt(inf, 4) : "→ 0 (Maxwell)"],
        ["Instant response", fmt(state.model === "kv" ? 0 : state.sigma / state.E, 4)],
        ["Maxwell slope", fmt(state.sigma / state.eta, 4) + " s⁻¹"]
      ]);
      var status;
      if (state.model === "kv") {
        status = isCreep
          ? "Kelvin–Voigt has no instantaneous strain: the dashpot blocks the step, and the spring fills in with time constant τ."
          : "A Kelvin–Voigt solid cannot relax at constant strain: its stress stays at σ₀. Only the Maxwell model relaxes.";
      } else {
        status = isCreep
          ? "Maxwell creeps linearly forever at rate σ₀/η; it is a fluid, not a solid."
          : "Maxwell relaxes exponentially with τ = η/E. The initial stress is σ₀.";
      }
      setStatus(root, status);
      setAria(canvas, "Graph of " + (isCreep ? "strain" : "stress") + " versus time for " + state.model + " and the comparison model.");
    }

    addSelect(controls, {
      label: "Model", value: state.model,
      options: [{ value: "kv", label: "Kelvin–Voigt (solid)" }, { value: "maxwell", label: "Maxwell (fluid)" }],
      onChange: function (v) { state.model = v; draw(); }
    });
    addSelect(controls, {
      label: "Test", value: state.test,
      options: [{ value: "creep", label: "Creep (constant stress)" }, { value: "relax", label: "Relaxation (constant strain)" }],
      onChange: function (v) { state.test = v; draw(); }
    });
    addRange(controls, {
      label: "E", min: 0.2, max: 5, step: 0.1, value: state.E,
      format: function (v) { return v.toFixed(1) + " MPa"; },
      onInput: function (v) { state.E = v; draw(); }
    });
    addRange(controls, {
      label: "η", min: 0.5, max: 20, step: 0.5, value: state.eta,
      format: function (v) { return v.toFixed(1) + " MPa·s"; },
      onInput: function (v) { state.eta = v; draw(); }
    });
    addRange(controls, {
      label: "Stress σ₀", min: 0.05, max: 1, step: 0.01, value: state.sigma,
      format: function (v) { return v.toFixed(2) + " MPa"; },
      onInput: function (v) { state.sigma = v; draw(); }
    });
    addRange(controls, {
      label: "Cursor", min: 0, max: 30, step: 0.5, value: state.t,
      format: function (v) { return v.toFixed(1) + " s"; },
      onInput: function (v) { state.t = v; draw(); }
    });
    addHint(root, "τ = η/E. At t = τ, Kelvin–Voigt has reached 63.2% of its final strain; Maxwell has fallen to 36.8% of its initial stress.");
    LAB_RENDERS.push(draw);
    draw();
  };

  /* ============================================================
     3. Oxygen diffusion limit in a tissue construct
     ============================================================ */

  LAB.oxygen = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var state = { D: 2.0e-9, C0: 0.10, q: 0.02, L: 150e-6, Cmin: 0.005 };

    function profile(x) {
      return state.C0 - (state.q / state.D) * (state.L * x - x * x / 2);
    }
    function lcrit() { return Math.sqrt(2 * state.D * state.C0 / state.q); }

    function draw() {
      var c = setupCanvas(canvas, 360);
      var ctx = c.ctx, w = c.w, h = c.h, pal = palette();
      var box = { x: 66, y: 22, w: w - 96, h: h - 80 };
      var L = state.L;
      var ymax = state.C0 * 1.12;
      axes(ctx, box, 0, L * 1e6, 0, ymax, {
        xLabel: "depth from surface (µm)", yLabel: "C (mol/m³)", xTicks: 5, yTicks: 5
      });

      // critical thickness marker
      var lc = lcrit();
      if (lc * 1e6 <= L * 1e6) {
        var px = plot(box, 0, L * 1e6, 0, ymax, lc * 1e6, 0).x;
        line(ctx, px, box.y, px, box.y + box.h, pal.accent, 1.4, [4, 4]);
        label(ctx, "L_crit", px + 4, box.y + 16, pal.accent, 11);
      }

      // hypoxic band
      var cm = state.Cmin;
      if (cm < ymax) {
        var py = plot(box, 0, L * 1e6, 0, ymax, cm, 0).y;
        ctx.save();
        ctx.fillStyle = pal.accentSoft;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(box.x, py, box.w, box.y + box.h - py);
        ctx.restore();
        label(ctx, "hypoxic floor", box.x + box.w - 6, py - 6, pal.accent, 10, "right");
      }

      ctx.save();
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (var i = 0; i <= 120; i += 1) {
        var x = L * i / 120;
        var y = Math.max(0, profile(x));
        var p = plot(box, 0, L * 1e6, 0, ymax, x * 1e6, y);
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.restore();

      var center = profile(L);
      var viable = 0;
      for (var j = 0; j <= 400; j += 1) {
        if (profile(L * j / 400) >= state.Cmin) viable = L * j / 400;
      }
      setReadout(root, [
        ["L_crit = √(2DC₀/q)", fmt(lcrit() * 1e6, 0) + " µm"],
        ["C at centre", fmt(Math.max(0, center), 4) + " mol/m³"],
        ["C at surface", fmt(state.C0, 3) + " mol/m³"],
        ["Viable depth", fmt(viable * 1e6, 0) + " µm"],
        ["Centre / surface", fmt(Math.max(0, center) / state.C0 * 100, 0) + "%"]
      ]);
      var status;
      if (center >= state.Cmin) status = "The centre stays above the hypoxic floor. L_crit scales as √(D C₀ / q): doubling q shrinks it by √2, not by 2.";
      else status = "The centre is hypoxic. L_crit is the half-thickness at which C reaches zero; viable tissue is thinner than that because cells need a floor, not zero.";
      setStatus(root, status);
      setAria(canvas, "Oxygen concentration profile through a " + (L * 1e6).toFixed(0) + " micrometre construct; critical half-thickness " + (lcrit() * 1e6).toFixed(0) + " micrometres.");
    }

    addRange(controls, {
      label: "Diffusivity D", min: 0.5, max: 5, step: 0.1, value: state.D * 1e9,
      format: function (v) { return v.toFixed(1) + "×10⁻⁹ m²/s"; },
      onInput: function (v) { state.D = v * 1e-9; draw(); }
    });
    addRange(controls, {
      label: "Surface C₀", min: 0.03, max: 0.2, step: 0.005, value: state.C0,
      format: function (v) { return v.toFixed(3) + " mol/m³"; },
      onInput: function (v) { state.C0 = v; draw(); }
    });
    addRange(controls, {
      label: "Consumption q", min: 0.005, max: 0.05, step: 0.001, value: state.q,
      format: function (v) { return v.toFixed(3) + " mol/(m³·s)"; },
      onInput: function (v) { state.q = v; draw(); }
    });
    addRange(controls, {
      label: "Half-thickness L", min: 50, max: 300, step: 5, value: state.L * 1e6,
      format: function (v) { return v.toFixed(0) + " µm"; },
      onInput: function (v) { state.L = v * 1e-6; draw(); }
    });
    addHint(root, "Steady state: D C″ = q with zero flux at the centre. The textbook 100–200 µm is not a constant; it follows from D, C₀ and q.");
    LAB_RENDERS.push(draw);
    draw();
  };

  /* ============================================================
     4. Stenosis: viscous + convective pressure drop
     ============================================================ */

  LAB.stenosis = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var state = { ratio: 0.6, Q: 5e-6, Ls: 0.01, mu: 0.0035, rho: 1060, r0: 0.005 };

    function drop(ratio) {
      var rs = state.r0 * ratio;
      var vs = state.Q / (Math.PI * rs * rs);
      var v0 = state.Q / (Math.PI * state.r0 * state.r0);
      var rv = 8 * state.mu * state.Ls / (Math.PI * Math.pow(rs, 4));
      var visc = rv * state.Q;
      var conv = 0.5 * state.rho * (vs * vs - v0 * v0);
      return { visc: visc, conv: conv, total: visc + conv, vs: vs, v0: v0, re: state.rho * vs * 2 * rs / state.mu };
    }

    function draw() {
      var c = setupCanvas(canvas, 380);
      var ctx = c.ctx, w = c.w, h = c.h, pal = palette();
      var box = { x: 72, y: 18, w: w - 102, h: h - 82 };
      var ys = [];
      for (var i = 0; i <= 100; i += 1) {
        var rr = 0.15 + 0.85 * i / 100;
        ys.push(Math.max(1e-3, drop(rr).total));
      }
      var ymax = Math.max.apply(null, ys) * 1.4;
      axes(ctx, box, 0.15, 1, 0.001, ymax, {
        xLabel: "radius ratio r/r₀", yLabel: "ΔP (Pa)", xTicks: 5, yTicks: 5
      });
      // log y labels
      ctx.save();
      ctx.font = '500 10px "IBM Plex Sans", system-ui, sans-serif';
      ctx.fillStyle = pal.muted;
      ctx.textAlign = "right";
      ticks(0.001, ymax, 5).forEach(function (v) {
        if (v <= 0) return;
        var py = box.y + box.h - (Math.log10(v) - Math.log10(0.001)) / (Math.log10(ymax) - Math.log10(0.001)) * box.h;
        ctx.fillText(fmt(v, 2), box.x - 6, py + 3);
      });
      ctx.restore();

      function curve(key, color, width, dash) {
        ctx.save();
        ctx.strokeStyle = color; ctx.lineWidth = width;
        if (dash) ctx.setLineDash(dash);
        ctx.beginPath();
        for (var i = 0; i <= 200; i += 1) {
          var rr = 0.15 + 0.85 * i / 200;
          var val = Math.max(1e-4, drop(rr)[key]);
          var px = box.x + (rr - 0.15) / 0.85 * box.w;
          var py = box.y + box.h - (Math.log10(val) - Math.log10(0.001)) / (Math.log10(ymax) - Math.log10(0.001)) * box.h;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke(); ctx.restore();
      }
      curve("visc", pal.def, 1.5, [5, 4]);
      curve("conv", pal.beta, 1.5, [2, 3]);
      curve("total", pal.accent, 2.6);

      var d = drop(state.ratio);
      var val = Math.max(1e-4, d.total);
      var px = box.x + (state.ratio - 0.15) / 0.85 * box.w;
      var py = box.y + box.h - (Math.log10(val) - Math.log10(0.001)) / (Math.log10(ymax) - Math.log10(0.001)) * box.h;
      line(ctx, px, box.y, px, box.y + box.h, pal.ruleStrong, 1, [3, 3]);
      dot(ctx, px, py, 4.5, pal.accent, pal.sheet);

      label(ctx, "total", box.x + 8, box.y + 14, pal.accent, 11);
      label(ctx, "viscous", box.x + 8, box.y + 30, pal.def, 11);
      label(ctx, "convective", box.x + 8, box.y + 46, pal.beta, 11);

      setReadout(root, [
        ["Viscous ΔP", fmt(d.visc, 1) + " Pa"],
        ["Convective ΔP", fmt(d.conv, 1) + " Pa"],
        ["Total ΔP", fmt(d.total, 1) + " Pa"],
        ["V_s", fmt(d.vs, 2) + " m/s"],
        ["Re (stenosis)", fmt(d.re, 0)]
      ]);
      var share = d.total > 0 ? d.conv / d.total * 100 : 0;
      var status = "Convective loss is " + fmt(share, 0) + "% of the total. A Poiseuille-only model misses the narrowing jet; below r/r₀ ≈ 0.3 the convective term dominates.";
      if (d.re > 2000) status += " Re > 2000: the flow is no longer laminar and this model is only a scaling argument.";
      setStatus(root, status);
      setAria(canvas, "Pressure drop versus radius ratio; total " + d.total.toFixed(1) + " pascals at ratio " + state.ratio.toFixed(2) + ".");
    }

    addRange(controls, {
      label: "Radius ratio", min: 0.15, max: 1, step: 0.01, value: state.ratio,
      format: function (v) { return v.toFixed(2); },
      onInput: function (v) { state.ratio = v; draw(); }
    });
    addRange(controls, {
      label: "Flow Q", min: 1, max: 10, step: 0.5, value: state.Q * 1e6,
      format: function (v) { return v.toFixed(1) + " mL/s"; },
      onInput: function (v) { state.Q = v * 1e-6; draw(); }
    });
    addRange(controls, {
      label: "Stenosis length", min: 2, max: 30, step: 1, value: state.Ls * 1e3,
      format: function (v) { return v.toFixed(0) + " mm"; },
      onInput: function (v) { state.Ls = v * 1e-3; draw(); }
    });
    addHint(root, "ΔP = 8μL_sQ/(πR_s⁴) + ½ρ(V_s² − V₀²). The first term is viscous, the second is the convective jet. Both diverge as r → 0.");
    LAB_RENDERS.push(draw);
    draw();
  };

  /* ============================================================
     5. Synthetic ECG and the limb leads
     ============================================================ */

  LAB.ecg = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var state = { hr: 72, axis: 60, noise: 0.01, t: 2.5 };

    function gauss(t, mu, sigma, amp) {
      return amp * Math.exp(-0.5 * Math.pow((t - mu) / sigma, 2));
    }
    function beat(tt) {
      // tt is time relative to R peak
      return gauss(tt, -0.18, 0.028, 0.12) + gauss(tt, -0.03, 0.009, -0.10) +
        gauss(tt, 0, 0.010, 1.0) + gauss(tt, 0.035, 0.012, -0.22) +
        gauss(tt, 0.28, 0.055, 0.30);
    }
    function proj(leadAngle) {
      return Math.cos((state.axis - leadAngle) * Math.PI / 180);
    }
    function trace(leadAngle, n, dt) {
      var out = [];
      var period = 60 / state.hr;
      for (var i = 0; i < n; i += 1) {
        var t = i * dt;
        var phase = (t % period) - 0.35 * period;
        var v = beat(phase) * proj(leadAngle);
        v += 0.04 * Math.sin(2 * Math.PI * 0.33 * t);
        v += (Math.random() - 0.5) * state.noise;
        out.push(v);
      }
      return out;
    }

    function draw() {
      var c = setupCanvas(canvas, 400);
      var ctx = c.ctx, w = c.w, h = c.h, pal = palette();
      var n = 900, dt = state.t / n;
      var leads = [
        { name: "I", angle: 0, color: pal.def },
        { name: "II", angle: 60, color: pal.accent },
        { name: "III", angle: 120, color: pal.beta }
      ];
      var traces = leads.map(function (l) { return trace(l.angle, n, dt); });
      var rowH = (h - 54) / 3;
      var x0 = 48, x1 = w - 18;
      var ymax = 1.4;

      ctx.save();
      ctx.strokeStyle = pal.grid;
      ctx.lineWidth = 1;
      for (var gx = 0; gx <= 10; gx += 1) {
        var px = x0 + (x1 - x0) * gx / 10;
        ctx.beginPath(); ctx.moveTo(px, 12); ctx.lineTo(px, 12 + rowH * 3); ctx.stroke();
      }
      ctx.restore();

      leads.forEach(function (l, idx) {
        var base = 12 + rowH * idx + rowH * 0.62;
        var amp = rowH * 0.38 / ymax;
        ctx.save();
        ctx.strokeStyle = l.color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (var i = 0; i < n; i += 1) {
          var px = x0 + (x1 - x0) * i / (n - 1);
          var py = base - traces[idx][i] * amp;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();
        label(ctx, "Lead " + l.name, 8, base - rowH * 0.30, l.color, 11, "left", "middle", 600);
        label(ctx, fmt(proj(l.angle), 2) + "×", 8, base + rowH * 0.28, pal.muted, 10);
      });

      // identity check II = I + III
      var maxErr = 0;
      for (var i = 0; i < n; i += 1) {
        maxErr = Math.max(maxErr, Math.abs(traces[1][i] - (traces[0][i] + traces[2][i])));
      }
      var qrs = 0.08;
      setReadout(root, [
        ["Heart rate", state.hr.toFixed(0) + " bpm"],
        ["RR interval", fmt(60 / state.hr, 2) + " s"],
        ["QRS duration", fmt(qrs * 1000, 0) + " ms"],
        ["Axis", state.axis.toFixed(0) + "°"],
        ["II − (I + III)", fmt(maxErr, 6) + " mV"]
      ]);
      setStatus(root, "Lead II is not independent: II = I + III holds by construction, and the error line stays at zero. A left axis deviation makes lead III negative.");
      setAria(canvas, "Three stacked limb-lead traces at " + state.hr.toFixed(0) + " beats per minute; lead two equals lead one plus lead three.");

      // axis gauge
      var gx = w - 54, gy = h - 34, gr = 24;
      ctx.save();
      ctx.strokeStyle = pal.ruleStrong;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(gx, gy, gr, 0, Math.PI * 2); ctx.stroke();
      var a = -state.axis * Math.PI / 180;
      arrow(ctx, gx, gy, gx + gr * Math.cos(a), gy + gr * Math.sin(a), pal.accent, 2, 7);
      label(ctx, "axis", gx, gy + gr + 14, pal.muted, 9, "center");
      ctx.restore();
    }

    addRange(controls, {
      label: "Heart rate", min: 40, max: 160, step: 1, value: state.hr,
      format: function (v) { return v.toFixed(0) + " bpm"; },
      onInput: function (v) { state.hr = v; draw(); }
    });
    addRange(controls, {
      label: "Electrical axis", min: -90, max: 180, step: 1, value: state.axis,
      format: function (v) { return v.toFixed(0) + "°"; },
      onInput: function (v) { state.axis = v; draw(); }
    });
    addRange(controls, {
      label: "Noise", min: 0, max: 0.08, step: 0.005, value: state.noise,
      format: function (v) { return fmt(v * 1000, 0) + " µV"; },
      onInput: function (v) { state.noise = v; draw(); }
    });
    addHint(root, "The traces are synthetic, not patient data. The lead projections follow cos(axis − lead angle); the identity II = I + III is exact.");
    LAB_RENDERS.push(draw);
    draw();
  };

  /* ============================================================
     6. Michaelis–Menten enzyme / biosensor calibration
     ============================================================ */

  LAB.michaelis = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var state = { vmax: 100, km: 50, s: 50, inhib: "none", i: 0, ki: 50 };

    function rates() {
      var factor = 1;
      var kmApp = state.km;
      var vmaxApp = state.vmax;
      if (state.inhib === "comp") kmApp = state.km * (1 + state.i / state.ki);
      if (state.inhib === "noncomp") vmaxApp = state.vmax / (1 + state.i / state.ki);
      var v = vmaxApp * state.s / (kmApp + state.s);
      return { v: v, kmApp: kmApp, vmaxApp: vmaxApp, factor: factor };
    }

    function draw() {
      var c = setupCanvas(canvas, 360);
      var ctx = c.ctx, w = c.w, h = c.h, pal = palette();
      var box = { x: 64, y: 20, w: w - 94, h: h - 78 };
      var smax = Math.max(500, state.km * 8);
      axes(ctx, box, 0, smax, 0, 110, {
        xLabel: "[S] (µM)", yLabel: "v (nmol/s or µA)", xTicks: 6, yTicks: 5
      });

      function curve(km, vmax, color, width, dash) {
        ctx.save();
        ctx.strokeStyle = color; ctx.lineWidth = width;
        if (dash) ctx.setLineDash(dash);
        ctx.beginPath();
        for (var i = 0; i <= 160; i += 1) {
          var s = smax * i / 160;
          var v = vmax * s / (km + s);
          var p = plot(box, 0, smax, 0, 110, s, v);
          if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke(); ctx.restore();
      }

      curve(state.km, state.vmax, pal.muted, 1.4, [5, 4]);
      var r = rates();
      curve(r.kmApp, r.vmaxApp, pal.accent, 2.5);

      var p = plot(box, 0, smax, 0, 110, state.s, r.v);
      line(ctx, p.x, box.y, p.x, box.y + box.h, pal.ruleStrong, 1, [3, 3]);
      line(ctx, box.x, p.y, p.x, p.y, pal.ruleStrong, 1, [3, 3]);
      dot(ctx, p.x, p.y, 4.5, pal.accent, pal.sheet);

      label(ctx, "uninhibited", box.x + 8, box.y + 14, pal.muted, 11);
      label(ctx, state.inhib === "none" ? "current" : state.inhib, box.x + 8, box.y + 30, pal.accent, 11);

      setReadout(root, [
        ["v at [S]", fmt(r.v, 1)],
        ["% of Vmax", fmt(r.v / r.vmaxApp * 100, 0) + "%"],
        ["K_m,app", fmt(r.kmApp, 1) + " µM"],
        ["V_max,app", fmt(r.vmaxApp, 1)],
        ["K_m / K_m,app", fmt(state.km / r.kmApp, 2)]
      ]);
      var status;
      if (state.inhib === "none") status = "At [S] = K_m the rate is exactly half of V_max. K_m is a kinetic constant, not a binding affinity.";
      else if (state.inhib === "comp") status = "Competitive inhibition raises K_m,app but leaves V_max unchanged: at saturating [S] the substrate outcompetes the inhibitor.";
      else status = "Non-competitive inhibition lowers V_max,app but leaves K_m unchanged: the inhibitor does not compete for the active site.";
      setStatus(root, status);
      setAria(canvas, "Michaelis-Menten curve; current rate " + r.v.toFixed(1) + " at substrate " + state.s + " micromolar.");
    }

    addRange(controls, {
      label: "V_max", min: 20, max: 200, step: 5, value: state.vmax,
      format: function (v) { return v.toFixed(0); },
      onInput: function (v) { state.vmax = v; draw(); }
    });
    addRange(controls, {
      label: "K_m", min: 5, max: 200, step: 5, value: state.km,
      format: function (v) { return v.toFixed(0) + " µM"; },
      onInput: function (v) { state.km = v; draw(); }
    });
    addRange(controls, {
      label: "[S]", min: 1, max: 400, step: 1, value: state.s,
      format: function (v) { return v.toFixed(0) + " µM"; },
      onInput: function (v) { state.s = v; draw(); }
    });
    addSelect(controls, {
      label: "Inhibition", value: state.inhib,
      options: [
        { value: "none", label: "None" },
        { value: "comp", label: "Competitive" },
        { value: "noncomp", label: "Non-competitive" }
      ],
      onChange: function (v) { state.inhib = v; draw(); }
    });
    addRange(controls, {
      label: "[I]", min: 0, max: 200, step: 5, value: state.i,
      format: function (v) { return v.toFixed(0) + " µM"; },
      onInput: function (v) { state.i = v; draw(); }
    });
    addRange(controls, {
      label: "K_i", min: 5, max: 200, step: 5, value: state.ki,
      format: function (v) { return v.toFixed(0) + " µM"; },
      onInput: function (v) { state.ki = v; draw(); }
    });
    addHint(root, "A calibration curve is empirical: sensitivity, limit of detection and selectivity must be reported together. This model is the idealised steady state.");
    LAB_RENDERS.push(draw);
    draw();
  };

  /* ============================================================
     7. CT Hounsfield units and windowing
     ============================================================ */

  LAB.ct = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var state = { level: 40, width: 400, probe: null };
    var N = 240;
    var hu = new Float32Array(N * N);

    function buildPhantom() {
      for (var y = 0; y < N; y += 1) {
        for (var x = 0; x < N; x += 1) {
          var nx = (x - N / 2) / (N * 0.42);
          var ny = (y - N / 2) / (N * 0.46);
          var r = Math.sqrt(nx * nx + ny * ny);
          var value = -1000;
          if (r < 1) {
            value = 40;
            if (r > 0.88) value = -90;
            var lx = (x - N * 0.36) / (N * 0.13);
            var ly = (y - N * 0.42) / (N * 0.17);
            if (lx * lx + ly * ly < 1) value = -820;
            var rx = (x - N * 0.64) / (N * 0.13);
            var ry = (y - N * 0.42) / (N * 0.17);
            if (rx * rx + ry * ry < 1) value = -820;
            var sx = (x - N * 0.5) / (N * 0.055);
            var sy = (y - N * 0.76) / (N * 0.06);
            if (sx * sx + sy * sy < 1) value = 1000;
            var tx = (x - N * 0.5) / (N * 0.05);
            var ty = (y - N * 0.60) / (N * 0.045);
            if (tx * tx + ty * ty < 1) value = 60;
          }
          hu[y * N + x] = value;
        }
      }
    }
    buildPhantom();

    function layout(w, h) {
      var narrow = w < 480;
      var size = narrow ? Math.min(w - 32, h - 168) : Math.min(w - 150, h - 40);
      var x0 = narrow ? (w - size) / 2 : 16;
      var y0 = narrow ? 8 : (h - size) / 2;
      return { size: size, x0: x0, y0: y0, narrow: narrow };
    }

    function draw() {
      var c = setupCanvas(canvas, 380);
      var ctx = c.ctx, w = c.w, h = c.h, pal = palette();
      var L = layout(w, h);
      var size = L.size, x0 = L.x0, y0 = L.y0;
      var lo = state.level - state.width / 2;
      var hi = state.level + state.width / 2;
      var img = ctx.createImageData(N, N);
      for (var i = 0; i < N * N; i += 1) {
        var v = (hu[i] - lo) / (hi - lo);
        v = Math.max(0, Math.min(1, v));
        var g = Math.round(v * 255);
        img.data[i * 4] = g;
        img.data[i * 4 + 1] = g;
        img.data[i * 4 + 2] = g;
        img.data[i * 4 + 3] = 255;
      }
      // draw to an offscreen canvas then scale
      var off = document.createElement("canvas");
      off.width = N; off.height = N;
      off.getContext("2d").putImageData(img, 0, 0);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, x0, y0, size, size);
      ctx.restore();
      ctx.strokeStyle = pal.ruleStrong;
      ctx.strokeRect(x0, y0, size, size);

      // probe crosshair
      if (state.probe) {
        var px = x0 + state.probe.x * size;
        var py = y0 + state.probe.y * size;
        ctx.save();
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px - 10, py); ctx.lineTo(px + 10, py); ctx.moveTo(px, py - 10); ctx.lineTo(px, py + 10); ctx.stroke();
        ctx.restore();
      }

      // legend
      var items = [["air", -1000], ["fat", -90], ["lung", -820], ["water", 0], ["muscle", 40], ["bone", 1000]];
      if (L.narrow) {
        var ly = y0 + size + 18;
        label(ctx, "WINDOW " + fmt(lo, 0) + " … " + fmt(hi, 0) + " HU", x0, ly, pal.muted, 9);
        items.forEach(function (item, idx) {
          var col = idx % 3, row = Math.floor(idx / 3);
          var lx2 = x0 + col * (size / 3);
          var yy = ly + 22 + row * 26;
          var vv2 = Math.max(0, Math.min(1, (item[1] - lo) / (hi - lo)));
          ctx.fillStyle = "rgb(" + Math.round(vv2 * 255) + "," + Math.round(vv2 * 255) + "," + Math.round(vv2 * 255) + ")";
          ctx.fillRect(lx2, yy - 8, 14, 14);
          ctx.strokeStyle = pal.ruleStrong; ctx.strokeRect(lx2, yy - 8, 14, 14);
          label(ctx, item[0], lx2 + 18, yy + 4, pal.ink2, 9);
        });
      } else {
        var lx = x0 + size + 16;
        label(ctx, "WINDOW", lx, y0 + 14, pal.muted, 10, "left", "middle", 600);
        label(ctx, fmt(lo, 0) + " … " + fmt(hi, 0), lx, y0 + 32, pal.ink, 11);
        label(ctx, "HU", lx, y0 + 46, pal.muted, 9);
        items.forEach(function (item, idx) {
          var yy = y0 + 72 + idx * 26;
          var vv = Math.max(0, Math.min(1, (item[1] - lo) / (hi - lo)));
          ctx.fillStyle = "rgb(" + Math.round(vv * 255) + "," + Math.round(vv * 255) + "," + Math.round(vv * 255) + ")";
          ctx.fillRect(lx, yy - 8, 16, 16);
          ctx.strokeStyle = pal.ruleStrong;
          ctx.strokeRect(lx, yy - 8, 16, 16);
          label(ctx, item[0], lx + 22, yy + 4, pal.ink2, 10);
        });
      }

      var probeText = "—";
      if (state.probe) {
        var ix = Math.floor(state.probe.x * N), iy = Math.floor(state.probe.y * N);
        if (ix >= 0 && ix < N && iy >= 0 && iy < N) probeText = fmt(hu[iy * N + ix], 0) + " HU";
      }
      setReadout(root, [
        ["Window level", fmt(state.level, 0) + " HU"],
        ["Window width", fmt(state.width, 0) + " HU"],
        ["Display range", fmt(lo, 0) + " … " + fmt(hi, 0)],
        ["Probe", probeText],
        ["Contrast", state.width < 200 ? "soft tissue" : "wide / bone"]
      ]);
      setStatus(root, "HU is defined by μ, not by a display grey: HU = 1000(μ − μ_water)/μ_water. Windowing is a display choice; it cannot create contrast that the acquisition did not measure.");
      setAria(canvas, "Synthetic CT slice windowed at level " + state.level + " and width " + state.width + " Hounsfield units.");
    }

    bindPointer(canvas, function (p) {
      var L = layout(canvas.__cssW, canvas.__cssH);
      var size = L.size, x0 = L.x0, y0 = L.y0;
      state.probe = { x: (p.x - x0) / size, y: (p.y - y0) / size };
      if (state.probe.x < 0 || state.probe.x > 1 || state.probe.y < 0 || state.probe.y > 1) state.probe = null;
      draw();
    }, function () {});

    addRange(controls, {
      label: "Window level", min: -1000, max: 1000, step: 10, value: state.level,
      format: function (v) { return v.toFixed(0) + " HU"; },
      onInput: function (v) { state.level = v; draw(); }
    });
    addRange(controls, {
      label: "Window width", min: 20, max: 2000, step: 10, value: state.width,
      format: function (v) { return v.toFixed(0) + " HU"; },
      onInput: function (v) { state.width = v; draw(); }
    });
    addButton(controls, {
      label: "Soft tissue", onClick: function () { state.level = 40; state.width = 400; window.__BME_LABS__.rerender(); }
    });
    addButton(controls, {
      label: "Bone", onClick: function () { state.level = 500; state.width = 1500; window.__BME_LABS__.rerender(); }
    });
    addHint(root, "Point at the image to probe HU. A narrow width stretches a small HU range across the whole grey scale; it does not add information.");
    LAB_RENDERS.push(draw);
    draw();
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
    var storageKey = "bme-note-quiz:" + (root.getAttribute("data-quiz-id") || document.title || "default");
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
      $$(".bmequiz__option", questionEl).forEach(function (button, j) {
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
        wrap.className = "bmequiz__question";
        wrap.setAttribute("data-q", String(i));

        var prompt = document.createElement("p");
        prompt.className = "bmequiz__prompt";
        var num = document.createElement("span");
        num.className = "qnum";
        num.textContent = String(i + 1).padStart(2, "0");
        prompt.appendChild(num);
        prompt.appendChild(document.createTextNode(" " + question.prompt));
        wrap.appendChild(prompt);

        var options = document.createElement("div");
        options.className = "bmequiz__options";
        question.options.forEach(function (option, j) {
          var button = document.createElement("button");
          button.type = "button";
          button.className = "bmequiz__option";
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
        explain.className = "bmequiz__explain";
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
    exportBtn.className = "bmebtn";
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
    $$("[data-bme-lab]").forEach(function (root) {
      if (root.getAttribute("data-bme-ready") === "1") return;
      var kind = root.getAttribute("data-bme-lab");
      var init = LAB[kind];
      if (!init) {
        setStatus(root, "Unknown lab type: " + kind);
        console.warn("Unknown BME lab", kind);
        return;
      }
      try {
        init(root);
        root.setAttribute("data-bme-ready", "1");
      } catch (err) {
        console.error(err);
        setStatus(root, "This lab failed to render: " + err.message);
      }
    });
    $$("[data-bme-quiz]").forEach(initQuiz);
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

  window.__BME_LABS__ = {
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
