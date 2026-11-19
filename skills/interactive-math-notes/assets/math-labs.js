/* ============================================================
   Interactive mathematics notes — lab engines
   Vanilla JS. No dependencies. One file, inlined by the builder.

   Labs are configured with a JSON block inside the lab:

     <script type="application/json" class="mathlab-config">
       { "f": "x^2 - 1", "xmin": -2, "xmax": 2 }
     <\/script>

   Expressions are authored content, not learner input. They are
   compiled with new Function so a note author can write ordinary
   mathematical notation (^, sin, exp, ...). Never interpolate
   learner-supplied text into a config expression.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- tiny helpers ---------- */

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function debounce(fn, delay) {
    var timer = null;
    return function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(fn, delay);
    };
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
      warn: readCss("--warn", "#985a00"),
      tip: readCss("--tip", "#6b4c8a"),
      euler: readCss("--math-euler", "#985a00"),
      heun: readCss("--math-heun", "#2f5d8a"),
      rk4: readCss("--math-rk4", "#2f6b4f"),
      exact: readCss("--math-exact", "#1e1b17"),
      error: readCss("--math-error", "#8f2d2d"),
      grid: readCss("--math-grid", "rgba(30,27,23,0.09)"),
      gridStrong: readCss("--math-grid-strong", "rgba(30,27,23,0.18)")
    };
  }

  /* ---------- expression compiler ---------- */

  function compile(expr) {
    if (expr === undefined || expr === null || String(expr).trim() === "") return null;
    var src = String(expr).trim();
    src = src.replace(/\^/g, "**").replace(/\bln\s*\(/g, "log(");
    var body =
      "var sin=Math.sin, cos=Math.cos, tan=Math.tan, " +
      "asin=Math.asin, acos=Math.acos, atan=Math.atan, atan2=Math.atan2, " +
      "exp=Math.exp, log=Math.log, log10=Math.log10, log2=Math.log2, " +
      "sqrt=Math.sqrt, cbrt=Math.cbrt, abs=Math.abs, min=Math.min, max=Math.max, " +
      "pow=Math.pow, floor=Math.floor, ceil=Math.ceil, round=Math.round, sign=Math.sign, " +
      "sinh=Math.sinh, cosh=Math.cosh, tanh=Math.tanh, " +
      "PI=Math.PI, E=Math.E, pi=Math.PI, e=Math.E; " +
      "return (" + src + ");";
    return new Function("x", "y", "t", body);
  }

  function safe(fn, x, y) {
    if (!fn) return NaN;
    try {
      var value = fn(x, y, 0);
      return typeof value === "number" ? value : NaN;
    } catch (err) {
      return NaN;
    }
  }

  function derivative(fn, x, y) {
    var h = 1e-5 * Math.max(1, Math.abs(x));
    return (safe(fn, x + h, y) - safe(fn, x - h, y)) / (2 * h);
  }

  /* ---------- DOM helpers ---------- */

  function readConfig(root) {
    var el = $("script.mathlab-config", root);
    if (!el) return {};
    try {
      return JSON.parse(el.textContent);
    } catch (err) {
      throw new Error("invalid mathlab-config JSON: " + err.message);
    }
  }

  function setStatus(root, text) {
    var el = $("[data-status]", root);
    if (el) el.textContent = text;
  }

  function setAria(canvas, text) {
    if (canvas) canvas.setAttribute("aria-label", text);
  }

  function setReadout(el, rows) {
    if (!el) return;
    el.replaceChildren();
    rows.forEach(function (row) {
      var dl = document.createElement("dl");
      dl.className = "mathlab__row";
      dl.style.margin = "0";
      var dt = document.createElement("dt");
      dt.textContent = row[0];
      var dd = document.createElement("dd");
      dd.textContent = row[1];
      dl.appendChild(dt);
      dl.appendChild(dd);
      el.appendChild(dl);
    });
  }

  function setTable(el, caption, headers, rows) {
    if (!el) return;
    el.replaceChildren();
    if (!rows.length) return;
    var table = document.createElement("table");
    var cap = document.createElement("caption");
    cap.textContent = caption;
    table.appendChild(cap);
    var thead = document.createElement("thead");
    var tr = document.createElement("tr");
    headers.forEach(function (header) {
      var th = document.createElement("th");
      th.textContent = header;
      tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);
    var tbody = document.createElement("tbody");
    rows.forEach(function (row) {
      var trb = document.createElement("tr");
      row.forEach(function (cell) {
        var td = document.createElement("td");
        td.textContent = String(cell);
        trb.appendChild(td);
      });
      tbody.appendChild(trb);
    });
    table.appendChild(tbody);
    el.appendChild(table);
  }

  function addRange(container, options) {
    var label = document.createElement("label");
    label.className = "mathlab__field" + (options.narrow ? " mathlab__field--narrow" : "");
    var span = document.createElement("span");
    span.textContent = options.label;
    var input = document.createElement("input");
    input.type = "range";
    input.min = String(options.min);
    input.max = String(options.max);
    input.step = String(options.step === undefined ? 0.01 : options.step);
    input.value = String(options.value);
    var output = document.createElement("output");
    function sync() {
      var value = parseFloat(input.value);
      output.textContent = options.format ? options.format(value) : String(value);
    }
    input.addEventListener("input", function () {
      sync();
      options.onInput(parseFloat(input.value));
    });
    label.appendChild(span);
    label.appendChild(input);
    label.appendChild(output);
    container.appendChild(label);
    sync();
    return input;
  }

  function addSelect(container, options) {
    var label = document.createElement("label");
    label.className = "mathlab__field";
    var span = document.createElement("span");
    span.textContent = options.label;
    var select = document.createElement("select");
    options.options.forEach(function (item) {
      var option = document.createElement("option");
      option.value = String(item[0]);
      option.textContent = item[1];
      if (String(item[0]) === String(options.value)) option.selected = true;
      select.appendChild(option);
    });
    select.addEventListener("change", function () {
      options.onChange(select.value);
    });
    label.appendChild(span);
    label.appendChild(select);
    container.appendChild(label);
    return select;
  }

  function addToggle(container, options) {
    var label = document.createElement("label");
    label.className = "mathlab__check";
    var input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !!options.value;
    input.addEventListener("change", function () {
      options.onChange(input.checked);
    });
    label.appendChild(input);
    var span = document.createElement("span");
    span.textContent = options.label;
    label.appendChild(span);
    container.appendChild(label);
    return input;
  }

  function addButton(container, options) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "btn" + (options.primary ? " btn--primary" : "") + (options.ghost ? " btn--ghost" : "");
    button.textContent = options.label;
    if (options.title) button.title = options.title;
    button.addEventListener("click", options.onClick);
    container.appendChild(button);
    return button;
  }

  function addHint(root, text) {
    var el = $("[data-hint]", root);
    if (el) el.textContent = text;
  }

  /* ---------- canvas helpers ---------- */

  function setupCanvas(canvas, fallbackHeight) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var parent = canvas.parentElement;
    var width = parent ? parent.clientWidth : canvas.clientWidth;
    width = Math.max(260, Math.floor(width));
    var height = parseInt(canvas.getAttribute("data-height") || String(fallbackHeight || 360), 10);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = "100%";
    canvas.style.height = height + "px";
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: width, h: height };
  }

  function makeView(w, h, xmin, xmax, ymin, ymax, pad) {
    var p = pad || { l: 44, r: 16, t: 18, b: 34 };
    var iw = Math.max(10, w - p.l - p.r);
    var ih = Math.max(10, h - p.t - p.b);
    return {
      sx: function (x) { return p.l + ((x - xmin) / (xmax - xmin)) * iw; },
      sy: function (y) { return h - p.b - ((y - ymin) / (ymax - ymin)) * ih; },
      ix: function (px) { return xmin + ((px - p.l) / iw) * (xmax - xmin); },
      iy: function (py) { return ymin + ((h - p.b - py) / ih) * (ymax - ymin); },
      xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax,
      pad: p, w: w, h: h, iw: iw, ih: ih
    };
  }

  function niceStep(range, target) {
    var raw = range / Math.max(1, target);
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var norm = raw / mag;
    var step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
    return step * mag;
  }

  function withClip(ctx, view, fn) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(view.pad.l, view.pad.t, view.iw, view.ih);
    ctx.clip();
    fn();
    ctx.restore();
  }

  function drawGrid(ctx, view, options) {
    var pal = palette();
    var opts = options || {};
    var xstep = niceStep(view.xmax - view.xmin, opts.xTicks || 7);
    var ystep = niceStep(view.ymax - view.ymin, opts.yTicks || 6);
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = pal.grid;
    ctx.fillStyle = pal.muted;
    ctx.font = '10px "IBM Plex Sans", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    var x = Math.ceil(view.xmin / xstep) * xstep;
    while (x <= view.xmax + 1e-9) {
      var px = view.sx(x);
      ctx.beginPath();
      ctx.moveTo(px, view.pad.t);
      ctx.lineTo(px, view.h - view.pad.b);
      ctx.stroke();
      if (Math.abs(x) > 1e-9) {
        ctx.fillText(fmt(x, Math.abs(xstep) < 1 ? 1 : 0), px, view.h - view.pad.b + 5);
      }
      x += xstep;
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    var y = Math.ceil(view.ymin / ystep) * ystep;
    while (y <= view.ymax + 1e-9) {
      var py = view.sy(y);
      ctx.beginPath();
      ctx.moveTo(view.pad.l, py);
      ctx.lineTo(view.w - view.pad.r, py);
      ctx.stroke();
      if (Math.abs(y) > 1e-9) {
        ctx.fillText(fmt(y, Math.abs(ystep) < 1 ? 1 : 0), view.pad.l - 5, py);
      }
      y += ystep;
    }
    // axes
    ctx.strokeStyle = pal.gridStrong;
    ctx.lineWidth = 1.3;
    if (view.ymin <= 0 && view.ymax >= 0) {
      var y0 = view.sy(0);
      ctx.beginPath();
      ctx.moveTo(view.pad.l, y0);
      ctx.lineTo(view.w - view.pad.r, y0);
      ctx.stroke();
    }
    if (view.xmin <= 0 && view.xmax >= 0) {
      var x0 = view.sx(0);
      ctx.beginPath();
      ctx.moveTo(x0, view.pad.t);
      ctx.lineTo(x0, view.h - view.pad.b);
      ctx.stroke();
    }
    ctx.restore();
  }

  function plotFunction(ctx, fn, view, options) {
    var opts = options || {};
    var pal = palette();
    var color = opts.color || pal.ink;
    var width = opts.width || 1.9;
    var dash = opts.dash || [];
    var samples = Math.max(260, Math.floor(view.w * 1.5));
    withClip(ctx, view, function () {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      var started = false;
      var previous = null;
      for (var i = 0; i <= samples; i += 1) {
        var x = view.xmin + ((view.xmax - view.xmin) * i) / samples;
        var y = safe(fn, x, 0);
        if (!isFinite(y)) {
          started = false;
          previous = null;
          continue;
        }
        var px = view.sx(x);
        var py = view.sy(y);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else if (previous !== null && Math.abs(y - previous) > (view.ymax - view.ymin) * 1.8) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
        previous = y;
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  function drawSegment(ctx, view, x1, y1, x2, y2, color, width, dash) {
    withClip(ctx, view, function () {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = width || 1.5;
      ctx.setLineDash(dash || []);
      ctx.moveTo(view.sx(x1), view.sy(y1));
      ctx.lineTo(view.sx(x2), view.sy(y2));
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  function drawDot(ctx, view, x, y, color, radius, label) {
    var px = view.sx(x);
    var py = view.sy(y);
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, radius || 4, 0, Math.PI * 2);
    ctx.fillStyle = color || palette().accent;
    ctx.fill();
    ctx.strokeStyle = palette().sheet;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    if (label) {
      ctx.font = '600 11px "IBM Plex Sans", system-ui, sans-serif';
      ctx.fillStyle = palette().ink;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(label, px + 7, py - 5);
    }
    ctx.restore();
  }

  function drawPolyline(ctx, view, points, color, width, dash) {
    if (!points || points.length < 2) return;
    withClip(ctx, view, function () {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = width || 1.9;
      ctx.setLineDash(dash || []);
      points.forEach(function (point, index) {
        var px = view.sx(point.x);
        var py = view.sy(point.y);
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  function arrowHead(ctx, x, y, angle, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, size * 0.45);
    ctx.lineTo(-size, -size * 0.45);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function bindDrag(canvas, onMove, onEnd) {
    var dragging = false;
    function point(event) {
      var rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }
    canvas.addEventListener("pointerdown", function (event) {
      dragging = true;
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(event.pointerId); } catch (err) {}
      }
      onMove(point(event));
      event.preventDefault();
    });
    canvas.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      onMove(point(event));
      event.preventDefault();
    });
    function stop(event) {
      if (!dragging) return;
      dragging = false;
      if (onEnd) onEnd();
      event.preventDefault();
    }
    canvas.addEventListener("pointerup", stop);
    canvas.addEventListener("pointercancel", stop);
    canvas.addEventListener("pointerleave", function (event) {
      if (dragging && event.buttons === 0) stop(event);
    });
  }

  function autoRange(fn, xmin, xmax, includeZero) {
    var min = Infinity;
    var max = -Infinity;
    for (var i = 0; i <= 220; i += 1) {
      var x = xmin + ((xmax - xmin) * i) / 220;
      var y = safe(fn, x, 0);
      if (!isFinite(y)) continue;
      if (y < min) min = y;
      if (y > max) max = y;
    }
    if (!isFinite(min) || !isFinite(max)) return [-1, 1];
    if (includeZero) {
      min = Math.min(min, 0);
      max = Math.max(max, 0);
    }
    var span = max - min;
    if (span < 1e-9) span = 1;
    return [min - span * 0.14, max + span * 0.14];
  }

  /* ---------- lab registry ---------- */

  var LAB_INIT = {};
  var LAB_RENDERS = [];
  var rerenderScheduled = false;

  function register(render) {
    LAB_RENDERS.push(render);
  }

  function rerenderAll() {
    if (rerenderScheduled) return;
    rerenderScheduled = true;
    window.requestAnimationFrame(function () {
      rerenderScheduled = false;
      LAB_RENDERS.forEach(function (render) {
        try { render(); } catch (err) { console.error(err); }
      });
    });
  }

  /* ============================================================
     1. Secant → tangent lab
     ============================================================ */

  LAB_INIT.plot = function (root) {
    var cfg = readConfig(root);
    var f = compile(cfg.f);
    if (!f) throw new Error("plot lab needs an f expression");
    var df = compile(cfg.df);
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var readout = $("[data-readout]", root);
    var state = {
      x0: cfg.x0 === undefined ? 1 : Number(cfg.x0),
      h: cfg.h === undefined ? 1 : Math.abs(Number(cfg.h)),
      tangent: true,
      secant: true
    };
    var yRange = (cfg.ymin !== undefined && cfg.ymax !== undefined)
      ? [Number(cfg.ymin), Number(cfg.ymax)]
      : autoRange(f, Number(cfg.xmin), Number(cfg.xmax), false);

    var x0Input;
    var hInput;

    function render() {
      var size = setupCanvas(canvas, 360);
      var view = makeView(size.w, size.h, Number(cfg.xmin), Number(cfg.xmax), yRange[0], yRange[1]);
      var pal = palette();
      var ctx = size.ctx;
      ctx.clearRect(0, 0, size.w, size.h);
      drawGrid(ctx, view);
      plotFunction(ctx, f, view, { color: pal.ink, width: 2.1 });

      var x0 = state.x0;
      var f0 = safe(f, x0, 0);
      var slope = df ? df(x0, 0, 0) : derivative(f, x0, 0);
      var x1 = x0 + state.h;
      var f1 = safe(f, x1, 0);
      var secant = state.h === 0 ? slope : (f1 - f0) / state.h;

      if (state.secant && isFinite(secant) && Math.abs(state.h) > 1e-9) {
        var ext = (view.xmax - view.xmin) * 0.5;
        drawSegment(ctx, view, x0 - ext, f0 - secant * ext, x0 + ext, f0 + secant * ext, pal.def, 1.4, [6, 4]);
        drawDot(ctx, view, x1, f1, pal.def, 3.5, "x₀+h");
      }
      if (state.tangent) {
        var ext2 = (view.xmax - view.xmin) * 0.5;
        drawSegment(ctx, view, x0 - ext2, f0 - slope * ext2, x0 + ext2, f0 + slope * ext2, pal.accent, 1.6, []);
      }
      drawDot(ctx, view, x0, f0, pal.accent, 4.3, "x₀");

      if (cfg.label) {
        ctx.save();
        ctx.font = '600 12px "IBM Plex Sans", system-ui, sans-serif';
        ctx.fillStyle = pal.ink2;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(cfg.label, view.pad.l + 6, view.pad.t + 4);
        ctx.restore();
      }

      setAria(canvas, "Graph of f. Secant slope at x0 is " + fmt(secant) + ", tangent slope is " + fmt(slope) + ".");
      setReadout(readout, [
        ["x₀", fmt(x0)],
        ["f(x₀)", fmt(f0)],
        ["x₀ + h", fmt(x1)],
        ["f(x₀ + h)", fmt(f1)],
        ["secant slope", fmt(secant, 4)],
        ["tangent slope f′(x₀)", fmt(slope, 4)],
        ["difference", fmt(secant - slope, 4)]
      ]);
      setStatus(root,
        "At x₀ = " + fmt(x0) + ", the secant slope over h = " + fmt(state.h) +
        " is " + fmt(secant, 4) + "; the tangent slope is " + fmt(slope, 4) +
        ". Shrink h and watch the secant rotate into the tangent.");
    }

    x0Input = addRange(controls, {
      label: "x₀",
      min: Number(cfg.xmin), max: Number(cfg.xmax),
      step: (Number(cfg.xmax) - Number(cfg.xmin)) / 240,
      value: state.x0,
      format: function (v) { return fmt(v); },
      onInput: function (v) { state.x0 = v; render(); }
    });
    hInput = addRange(controls, {
      label: "h",
      min: 0.01, max: Math.min(2, (Number(cfg.xmax) - Number(cfg.xmin)) / 2),
      step: 0.01, value: state.h,
      format: function (v) { return fmt(v, 2); },
      onInput: function (v) { state.h = v; render(); }
    });
    addToggle(controls, {
      label: "secant", value: true,
      onChange: function (value) { state.secant = value; render(); }
    });
    addToggle(controls, {
      label: "tangent", value: true,
      onChange: function (value) { state.tangent = value; render(); }
    });
    addButton(controls, {
      label: "Reset", ghost: true,
      onClick: function () {
        state.x0 = cfg.x0 === undefined ? 1 : Number(cfg.x0);
        state.h = cfg.h === undefined ? 1 : Math.abs(Number(cfg.h));
        x0Input.value = String(state.x0);
        hInput.value = String(state.h);
        x0Input.dispatchEvent(new Event("input"));
        hInput.dispatchEvent(new Event("input"));
        render();
      }
    });
    addHint(root, "Drag the graph horizontally to move x₀. The slider is the keyboard-accessible equivalent.");

    bindDrag(canvas, function (point) {
      var size = setupCanvas(canvas, 360);
      var view = makeView(size.w, size.h, Number(cfg.xmin), Number(cfg.xmax), yRange[0], yRange[1]);
      state.x0 = clamp(view.ix(point.x), Number(cfg.xmin), Number(cfg.xmax));
      x0Input.value = String(state.x0);
      x0Input.dispatchEvent(new Event("input"));
      render();
    });

    register(render);
    render();
  };

  /* ============================================================
     2. Riemann sum / numerical integration lab
     ============================================================ */

  LAB_INIT.riemann = function (root) {
    var cfg = readConfig(root);
    var f = compile(cfg.f);
    if (!f) throw new Error("riemann lab needs an f expression");
    var a = Number(cfg.a);
    var b = Number(cfg.b);
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var readout = $("[data-readout]", root);
    var table = $("[data-table]", root);
    var state = { n: cfg.n ? Number(cfg.n) : 4, method: cfg.method || "midpoint" };

    function exactValue() {
      if (typeof cfg.exact === "number") return cfg.exact;
      return simpson(2000);
    }

    function sampleSum(n, method) {
      var even = method === "simpson" ? n + (n % 2) : n;
      var h = (b - a) / even;
      var total = 0;
      var i;
      if (method === "left") {
        for (i = 0; i < even; i += 1) total += safe(f, a + i * h, 0);
        return total * h;
      }
      if (method === "right") {
        for (i = 1; i <= even; i += 1) total += safe(f, a + i * h, 0);
        return total * h;
      }
      if (method === "midpoint") {
        for (i = 0; i < even; i += 1) total += safe(f, a + (i + 0.5) * h, 0);
        return total * h;
      }
      if (method === "trapezoid") {
        for (i = 0; i < even; i += 1) {
          total += (safe(f, a + i * h, 0) + safe(f, a + (i + 1) * h, 0)) / 2;
        }
        return total * h;
      }
      // Simpson
      total = safe(f, a, 0) + safe(f, b, 0);
      for (i = 1; i < even; i += 1) {
        total += (i % 2 === 1 ? 4 : 2) * safe(f, a + i * h, 0);
      }
      return (total * h) / 3;
    }

    function simpson(n) {
      var even = n + (n % 2);
      var h = (b - a) / even;
      var total = safe(f, a, 0) + safe(f, b, 0);
      for (var i = 1; i < even; i += 1) {
        total += (i % 2 === 1 ? 4 : 2) * safe(f, a + i * h, 0);
      }
      return (total * h) / 3;
    }

    function yRange() {
      var range = autoRange(f, a, b, true);
      return [range[0], range[1]];
    }

    function drawRiemann(ctx, view, n, method) {
      var pal = palette();
      var even = method === "simpson" ? n + (n % 2) : n;
      var h = (b - a) / even;
      var i;
      ctx.save();
      withClip(ctx, view, function () {
        ctx.fillStyle = pal.accentSoft;
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 0.8;
        if (method === "left" || method === "right" || method === "midpoint") {
          for (i = 0; i < even; i += 1) {
            var x = method === "left" ? a + i * h : method === "right" ? a + (i + 1) * h : a + (i + 0.5) * h;
            var y = safe(f, x, 0);
            var px1 = view.sx(a + i * h);
            var px2 = view.sx(a + (i + 1) * h);
            var py0 = view.sy(0);
            var py1 = view.sy(y);
            ctx.beginPath();
            ctx.rect(px1, Math.min(py0, py1), Math.max(0.5, px2 - px1), Math.abs(py1 - py0));
            ctx.fill();
            ctx.stroke();
          }
        } else if (method === "trapezoid") {
          for (i = 0; i < even; i += 1) {
            var xa = a + i * h;
            var xb = xa + h;
            var ya = safe(f, xa, 0);
            var yb = safe(f, xb, 0);
            ctx.beginPath();
            ctx.moveTo(view.sx(xa), view.sy(0));
            ctx.lineTo(view.sx(xa), view.sy(ya));
            ctx.lineTo(view.sx(xb), view.sy(yb));
            ctx.lineTo(view.sx(xb), view.sy(0));
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        } else {
          for (i = 0; i < even; i += 2) {
            var q0 = a + i * h;
            var q1 = q0 + h;
            var q2 = q0 + 2 * h;
            var y0 = safe(f, q0, 0);
            var y1 = safe(f, q1, 0);
            var y2 = safe(f, q2, 0);
            ctx.beginPath();
            ctx.moveTo(view.sx(q0), view.sy(0));
            for (var k = 0; k <= 24; k += 1) {
              var xx = q0 + (2 * h * k) / 24;
              var lag = y0 * ((xx - q1) * (xx - q2)) / ((q0 - q1) * (q0 - q2))
                + y1 * ((xx - q0) * (xx - q2)) / ((q1 - q0) * (q1 - q2))
                + y2 * ((xx - q0) * (xx - q1)) / ((q2 - q0) * (q2 - q1));
              ctx.lineTo(view.sx(xx), view.sy(lag));
            }
            ctx.lineTo(view.sx(q2), view.sy(0));
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        }
      });
      ctx.restore();
    }

    function render() {
      var size = setupCanvas(canvas, 360);
      var yr = yRange();
      var view = makeView(size.w, size.h, a, b, yr[0], yr[1]);
      var pal = palette();
      var ctx = size.ctx;
      ctx.clearRect(0, 0, size.w, size.h);
      drawGrid(ctx, view);
      drawRiemann(ctx, view, state.n, state.method);
      plotFunction(ctx, f, view, { color: pal.ink, width: 2.1 });

      var sum = sampleSum(state.n, state.method);
      var exact = exactValue();
      var error = Math.abs(sum - exact);
      var nEff = state.method === "simpson" ? state.n + (state.n % 2) : state.n;

      var ns = [4, 8, 16, 32, 64];
      var rows = ns.map(function (n) {
        var value = sampleSum(n, state.method);
        var err = Math.abs(value - exact);
        return [String(n), fmt(value, 5), fmt(err, 5), err === 0 ? "—" : ""];
      });
      for (var r = 1; r < rows.length; r += 1) {
        var prev = Math.abs(sampleSum(ns[r - 1], state.method) - exact);
        var curr = Math.abs(sampleSum(ns[r], state.method) - exact);
        rows[r][3] = prev > 1e-12 && curr > 1e-12 ? "×" + fmt(prev / curr, 2) : "—";
      }
      setTable(table, "Error when n doubles", ["n", "estimate", "|error|", "ratio"], rows);

      setAria(canvas, "Riemann sum with n=" + nEff + ", estimate " + fmt(sum, 5) + ", exact " + fmt(exact, 5) + ".");
      setReadout(readout, [
        ["method", state.method],
        ["n", String(nEff)],
        ["estimate", fmt(sum, 5)],
        ["exact", fmt(exact, 5)],
        ["|error|", fmt(error, 5)],
        ["h", fmt((b - a) / nEff, 4)]
      ]);
      setStatus(root,
        "n = " + nEff + ", " + state.method + ": estimate = " + fmt(sum, 5) +
        ", exact = " + fmt(exact, 5) + ", error = " + fmt(error, 5) +
        ". Doubling n is the experiment: read the ratio in the table, not just the shrinking number.");
    }

    addRange(controls, {
      label: "subintervals n",
      min: 2, max: 64, step: 1, value: state.n,
      format: function (v) { return String(Math.round(v)); },
      onInput: function (v) { state.n = Math.round(v); render(); }
    });
    addSelect(controls, {
      label: "rule",
      value: state.method,
      options: [
        ["left", "left endpoint"],
        ["right", "right endpoint"],
        ["midpoint", "midpoint"],
        ["trapezoid", "trapezoid"],
        ["simpson", "Simpson"]
      ],
      onChange: function (value) { state.method = value; render(); }
    });
    addButton(controls, {
      label: "Reset", ghost: true,
      onClick: function () { state.n = 4; state.method = "midpoint"; rerenderAll(); }
    });
    addHint(root, "For Simpson, n is rounded up to an even number. The table is the important object: it shows the order of the method.");

    register(render);
    render();
  };

  /* ============================================================
     3. Slope field + Euler / Heun / RK4
     ============================================================ */

  LAB_INIT.slope = function (root) {
    var cfg = readConfig(root);
    var f = compile(cfg.f);
    if (!f) throw new Error("slope lab needs an f(x,y) expression");
    var exact = compile(cfg.exact);
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var readout = $("[data-readout]", root);
    var table = $("[data-table]", root);
    var xmin = Number(cfg.xmin);
    var xmax = Number(cfg.xmax);
    var ymin = Number(cfg.ymin);
    var ymax = Number(cfg.ymax);
    var x0 = Number(cfg.x0);
    var xend = Number(cfg.xend === undefined ? xmax : cfg.xend);
    var state = {
      y0: Number(cfg.y0),
      h: Number(cfg.h || 0.25),
      shown: 1,
      playing: false,
      methods: { euler: true, heun: true, rk4: true }
    };
    var timer = null;
    var solutions = {};

    function integrate(method) {
      var points = [{ x: x0, y: state.y0 }];
      var x = x0;
      var y = state.y0;
      var steps = Math.max(1, Math.round((xend - x0) / state.h));
      for (var i = 0; i < steps; i += 1) {
        var k1 = safe(f, x, y);
        var nextX = x + state.h;
        var nextY;
        if (method === "euler") {
          nextY = y + state.h * k1;
        } else if (method === "heun") {
          var k2 = safe(f, nextX, y + state.h * k1);
          nextY = y + (state.h / 2) * (k1 + k2);
        } else {
          var k2r = safe(f, x + state.h / 2, y + (state.h / 2) * k1);
          var k3r = safe(f, x + state.h / 2, y + (state.h / 2) * k2r);
          var k4r = safe(f, nextX, y + state.h * k3r);
          nextY = y + (state.h / 6) * (k1 + 2 * k2r + 2 * k3r + k4r);
        }
        if (!isFinite(nextY)) break;
        x = nextX;
        y = nextY;
        points.push({ x: x, y: y });
      }
      return points;
    }

    function rebuild() {
      solutions = {
        euler: integrate("euler"),
        heun: integrate("heun"),
        rk4: integrate("rk4")
      };
      state.shown = Math.min(state.shown, maxSteps());
      if (state.shown < 1) state.shown = 1;
    }

    function maxSteps() {
      return Math.max(1, Math.round((xend - x0) / state.h));
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
      state.playing = false;
    }

    function valueAt(points, index) {
      if (!points || !points.length) return NaN;
      return points[Math.min(index, points.length - 1)].y;
    }

    function render() {
      var size = setupCanvas(canvas, 380);
      var view = makeView(size.w, size.h, xmin, xmax, ymin, ymax);
      var pal = palette();
      var ctx = size.ctx;
      ctx.clearRect(0, 0, size.w, size.h);
      drawGrid(ctx, view, { xTicks: 7, yTicks: 7 });

      // slope field
      var nx = 19;
      var ny = 14;
      ctx.save();
      withClip(ctx, view, function () {
        for (var i = 0; i <= nx; i += 1) {
          for (var j = 0; j <= ny; j += 1) {
            var x = xmin + ((xmax - xmin) * i) / nx;
            var y = ymin + ((ymax - ymin) * j) / ny;
            var m = safe(f, x, y);
            if (!isFinite(m)) continue;
            var px = view.sx(x);
            var py = view.sy(y);
            var length = 8;
            var dx = length / Math.sqrt(1 + m * m);
            var dy = (-m * dx);
            ctx.beginPath();
            ctx.strokeStyle = pal.gridStrong;
            ctx.lineWidth = 1;
            ctx.moveTo(px - dx, py - dy);
            ctx.lineTo(px + dx, py + dy);
            ctx.stroke();
          }
        }
      });
      ctx.restore();

      // exact solution
      if (exact) {
        var ep = [];
        for (var k = 0; k <= 220; k += 1) {
          var ex = x0 + ((xend - x0) * k) / 220;
          var ey = safe(exact, ex, 0);
          if (isFinite(ey)) ep.push({ x: ex, y: ey });
        }
        drawPolyline(ctx, view, ep, pal.exact, 1.6, [5, 4]);
      }

      // numeric solutions
      var methods = [
        ["euler", pal.euler],
        ["heun", pal.heun],
        ["rk4", pal.rk4]
      ];
      methods.forEach(function (item) {
        if (!state.methods[item[0]]) return;
        var pts = solutions[item[0]].slice(0, state.shown + 1);
        drawPolyline(ctx, view, pts, item[1], 2.1, []);
        if (pts.length) {
          var last = pts[pts.length - 1];
          drawDot(ctx, view, last.x, last.y, item[1], 3.2);
        }
      });

      // initial condition marker
      drawDot(ctx, view, x0, state.y0, pal.accent, 4.2, "y(x₀)");

      var index = Math.min(state.shown, maxSteps());
      var x = x0 + index * state.h;
      var eulerY = valueAt(solutions.euler, index);
      var heunY = valueAt(solutions.heun, index);
      var rk4Y = valueAt(solutions.rk4, index);
      var exactY = exact ? safe(exact, x, 0) : NaN;

      var rows = [];
      for (var s = Math.max(0, index - 5); s <= index; s += 1) {
        rows.push([
          String(s),
          fmt(x0 + s * state.h, 3),
          fmt(valueAt(solutions.euler, s), 4),
          fmt(valueAt(solutions.heun, s), 4),
          fmt(valueAt(solutions.rk4, s), 4),
          exact ? fmt(safe(exact, x0 + s * state.h, 0), 4) : "—"
        ]);
      }
      setTable(table, "Last steps", ["step", "x", "Euler", "Heun", "RK4", "exact"], rows);

      var status = "Step " + index + " / " + maxSteps() + " at x = " + fmt(x, 3) +
        ". Euler = " + fmt(eulerY, 4) + ", Heun = " + fmt(heunY, 4) +
        ", RK4 = " + fmt(rk4Y, 4);
      if (exact) {
        status += ", exact = " + fmt(exactY, 4) +
          "; RK4 error = " + fmt(Math.abs(rk4Y - exactY), 5) +
          ", Euler error = " + fmt(Math.abs(eulerY - exactY), 5) + ".";
      } else {
        status += ". Compare how the three rules bend away from the same slope field.";
      }
      if (state.shown >= maxSteps()) status += " End of interval.";
      setStatus(root, status);

      setAria(canvas, "Slope field with Euler, Heun and RK4 solutions. At x=" + fmt(x) + ", RK4 is " + fmt(rk4Y) + ".");
      setReadout(readout, [
        ["ODE", "y′ = " + String(cfg.f)],
        ["step h", fmt(state.h, 2)],
        ["current x", fmt(x, 3)],
        ["Euler", fmt(eulerY, 5)],
        ["Heun", fmt(heunY, 5)],
        ["RK4", fmt(rk4Y, 5)],
        ["exact", exact ? fmt(exactY, 5) : "not supplied"],
        ["RK4 |error|", exact ? fmt(Math.abs(rk4Y - exactY), 5) : "—"]
      ]);
    }

    function advance() {
      if (state.shown >= maxSteps()) {
        stop();
        render();
        return;
      }
      state.shown += 1;
      render();
    }

    function play() {
      if (state.playing) {
        stop();
        render();
        return;
      }
      if (state.shown >= maxSteps()) state.shown = 1;
      state.playing = true;
      timer = window.setInterval(advance, 260);
      render();
    }

    function reset() {
      stop();
      state.y0 = Number(cfg.y0);
      state.h = Number(cfg.h || 0.25);
      state.shown = 1;
      rebuild();
      render();
    }

    addRange(controls, {
      label: "step h",
      min: 0.05, max: 0.5, step: 0.05, value: state.h,
      format: function (v) { return fmt(v, 2); },
      onInput: function (v) { stop(); state.h = v; state.shown = 1; rebuild(); render(); }
    });
    addToggle(controls, { label: "Euler", value: true, onChange: function (v) { state.methods.euler = v; render(); } });
    addToggle(controls, { label: "Heun", value: true, onChange: function (v) { state.methods.heun = v; render(); } });
    addToggle(controls, { label: "RK4", value: true, onChange: function (v) { state.methods.rk4 = v; render(); } });
    addButton(controls, {
      label: "Step", primary: true,
      onClick: function () { stop(); advance(); }
    });
    addButton(controls, { label: "Play", onClick: play });
    addButton(controls, {
      label: "Run to end", ghost: true,
      onClick: function () { stop(); state.shown = maxSteps(); render(); }
    });
    addButton(controls, { label: "Reset", ghost: true, onClick: reset });
    addHint(root, "Drag vertically on the graph to change y(x₀). Step reveals one h-step for all three methods at once.");

    bindDrag(canvas, function (point) {
      stop();
      var size = setupCanvas(canvas, 380);
      var view = makeView(size.w, size.h, xmin, xmax, ymin, ymax);
      state.y0 = clamp(view.iy(point.y), ymin + 0.02 * (ymax - ymin), ymax - 0.02 * (ymax - ymin));
      state.shown = 1;
      rebuild();
      render();
    });

    window.addEventListener("beforeprint", function () {
      state.shown = maxSteps();
      render();
    });

    rebuild();
    register(render);
    render();
  };

  /* ============================================================
     4. Phase portrait for x' = Ax
     ============================================================ */

  LAB_INIT.phase = function (root) {
    var cfg = readConfig(root);
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var readout = $("[data-readout]", root);
    var state = {
      a: Number(cfg.a === undefined ? -0.4 : cfg.a),
      b: Number(cfg.b === undefined ? 1 : cfg.b),
      c: Number(cfg.c === undefined ? -1 : cfg.c),
      d: Number(cfg.d === undefined ? -0.4 : cfg.d),
      range: Number(cfg.range || 3),
      starts: []
    };
    var preset = cfg.preset || "stable spiral";

    var PRESETS = {
      "stable node": [ -1, 0, 0, -2 ],
      "saddle": [ 1, 0, 0, -1 ],
      "center": [ 0, 1, -1, 0 ],
      "stable spiral": [ -0.4, 1, -1, -0.4 ],
      "unstable spiral": [ 0.3, 1, -1, 0.3 ],
      "shear": [ 0, 1, 0, 0 ]
    };

    function defaultStarts() {
      return [{ x: 1.15, y: 0.55 }, { x: -1.05, y: 0.9 }, { x: 0.4, y: -1.3 }];
    }

    state.starts = defaultStarts();

    function classify() {
      var tr = state.a + state.d;
      var det = state.a * state.d - state.b * state.c;
      var disc = tr * tr - 4 * det;
      var type;
      var stable;
      if (det < -1e-9) {
        type = "saddle";
        stable = "unstable (saddle)";
      } else if (det > 1e-9) {
        if (disc > 1e-9) {
          type = tr < 0 ? "stable node" : "unstable node";
          stable = tr < 0 ? "asymptotically stable" : "unstable";
        } else if (disc < -1e-9) {
          type = Math.abs(tr) < 1e-9 ? "center" : (tr < 0 ? "stable spiral" : "unstable spiral");
          stable = Math.abs(tr) < 1e-9 ? "neutrally stable" : (tr < 0 ? "asymptotically stable" : "unstable");
        } else {
          type = tr < 0 ? "stable degenerate node" : "unstable degenerate node";
          stable = tr < 0 ? "asymptotically stable" : "unstable";
        }
      } else {
        type = "degenerate (det ≈ 0)";
        stable = "neutral / non-isolated";
      }
      return { tr: tr, det: det, disc: disc, type: type, stable: stable };
    }

    function eigen() {
      var tr = state.a + state.d;
      var det = state.a * state.d - state.b * state.c;
      var disc = tr * tr - 4 * det;
      if (disc >= 0) {
        var root = Math.sqrt(disc);
        var l1 = (tr + root) / 2;
        var l2 = (tr - root) / 2;
        return { real: true, l1: l1, l2: l2 };
      }
      return { real: false, re: tr / 2, im: Math.sqrt(-disc) / 2 };
    }

    function field(x, y) {
      return { x: state.a * x + state.b * y, y: state.c * x + state.d * y };
    }

    function trajectory(sx, sy) {
      var points = [{ x: sx, y: sy }];
      var x = sx;
      var y = sy;
      var h = 0.025;
      for (var i = 0; i < 900; i += 1) {
        var k1 = field(x, y);
        var k2 = field(x + (h / 2) * k1.x, y + (h / 2) * k1.y);
        var k3 = field(x + (h / 2) * k2.x, y + (h / 2) * k2.y);
        var k4 = field(x + h * k3.x, y + h * k3.y);
        x += (h / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x);
        y += (h / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y);
        if (!isFinite(x) || !isFinite(y)) break;
        if (Math.abs(x) > state.range * 2.5 || Math.abs(y) > state.range * 2.5) {
          points.push({ x: x, y: y });
          break;
        }
        points.push({ x: x, y: y });
      }
      return points;
    }

    function render() {
      var size = setupCanvas(canvas, 380);
      var r = state.range;
      var view = makeView(size.w, size.h, -r, r, -r, r);
      var pal = palette();
      var ctx = size.ctx;
      ctx.clearRect(0, 0, size.w, size.h);
      drawGrid(ctx, view, { xTicks: 7, yTicks: 7 });

      // vector field
      ctx.save();
      withClip(ctx, view, function () {
        var n = 15;
        for (var i = 0; i <= n; i += 1) {
          for (var j = 0; j <= n; j += 1) {
            var x = -r + (2 * r * i) / n;
            var y = -r + (2 * r * j) / n;
            var v = field(x, y);
            var norm = Math.hypot(v.x, v.y);
            if (norm < 1e-9) continue;
            var px = view.sx(x);
            var py = view.sy(y);
            var len = 12;
            var ux = (v.x / norm) * len;
            var uy = (-v.y / norm) * len;
            ctx.beginPath();
            ctx.strokeStyle = pal.gridStrong;
            ctx.lineWidth = 1;
            ctx.moveTo(px - ux / 2, py - uy / 2);
            ctx.lineTo(px + ux / 2, py + uy / 2);
            ctx.stroke();
            arrowHead(ctx, px + ux / 2, py + uy / 2, Math.atan2(uy, ux), 4.2, pal.gridStrong);
          }
        }
      });
      ctx.restore();

      // nullclines
      var pal2 = palette();
      if (Math.abs(state.b) > 1e-7) {
        drawSegment(ctx, view, -r, (-state.a / state.b) * -r, r, (-state.a / state.b) * r, pal2.heun, 1.1, [5, 5]);
      }
      if (Math.abs(state.d) > 1e-7) {
        drawSegment(ctx, view, -r, (-state.c / state.d) * -r, r, (-state.c / state.d) * r, pal2.euler, 1.1, [2, 4]);
      }

      // eigenlines
      var ev = eigen();
      if (ev.real) {
        [[ev.l1, pal2.accent], [ev.l2, pal2.accentSoft]].forEach(function (pair) {
          var lambda = pair[0];
          var dx = Math.abs(state.b) > 1e-7 ? state.b : lambda - state.d;
          var dy = Math.abs(state.b) > 1e-7 ? lambda - state.a : state.c;
          var norm = Math.hypot(dx, dy);
          if (norm < 1e-9) return;
          var ux = (dx / norm) * r * 1.4;
          var uy = (dy / norm) * r * 1.4;
          drawSegment(ctx, view, -ux, -uy, ux, uy, pair[1], 1.1, [3, 3]);
        });
      }

      // trajectories
      state.starts.slice(0, 6).forEach(function (start, index) {
        var forward = trajectory(start.x, start.y);
        var backward = trajectory(-start.x, -start.y);
        var color = index === 0 ? pal2.accent : index === 1 ? pal2.def : index === 2 ? pal2.ex : pal2.tip;
        drawPolyline(ctx, view, forward, color, 1.7, []);
        drawPolyline(ctx, view, backward, color, 1.1, [4, 4]);
        drawDot(ctx, view, start.x, start.y, color, 3.1);
      });

      var info = classify();
      var eigenText;
      if (ev.real) {
        eigenText = "λ₁ = " + fmt(ev.l1, 3) + ", λ₂ = " + fmt(ev.l2, 3);
      } else {
        eigenText = fmt(ev.re, 3) + " ± " + fmt(ev.im, 3) + "\u2009i";
      }

      setAria(canvas, "Phase portrait. " + info.type + ". Trajectories " + info.stable + ".");
      setReadout(readout, [
        ["matrix", "[" + fmt(state.a, 2) + " " + fmt(state.b, 2) + "; " + fmt(state.c, 2) + " " + fmt(state.d, 2) + "]"],
        ["trace τ", fmt(info.tr, 3)],
        ["determinant Δ", fmt(info.det, 3)],
        ["discriminant", fmt(info.disc, 3)],
        ["eigenvalues", eigenText],
        ["type", info.type],
        ["stability", info.stable]
      ]);
      setStatus(root,
        "τ = " + fmt(info.tr, 2) + ", Δ = " + fmt(info.det, 2) + ", τ² − 4Δ = " + fmt(info.disc, 2) +
        " → " + info.type + " (" + info.stable + "). Click the plane to add a trajectory; dashed lines are nullclines.");
    }

    function syncInputs() {
      $$("[data-matrix-input]", controls).forEach(function (input) {
        input.value = String(state[input.getAttribute("data-matrix-input")]);
        input.dispatchEvent(new Event("input"));
      });
    }

    addSelect(controls, {
      label: "preset",
      value: preset,
      options: Object.keys(PRESETS).map(function (name) { return [name, name]; }),
      onChange: function (name) {
        var values = PRESETS[name];
        if (!values) return;
        state.a = values[0]; state.b = values[1]; state.c = values[2]; state.d = values[3];
        state.starts = defaultStarts();
        syncInputs();
        render();
      }
    });
    ["a", "b", "c", "d"].forEach(function (key) {
      var input = addRange(controls, {
        label: key,
        min: -2, max: 2, step: 0.05, value: state[key],
        narrow: true,
        format: function (v) { return fmt(v, 2); },
        onInput: function (v) { state[key] = v; state.starts = defaultStarts(); render(); }
      });
      input.setAttribute("data-matrix-input", key);
    });
    addButton(controls, {
      label: "Reset trajectories", ghost: true,
      onClick: function () { state.starts = defaultStarts(); render(); }
    });
    addHint(root, "Trace τ and determinant Δ classify a 2×2 linear system. Drag or click the plot to add a starting point.");

    bindDrag(canvas, function (point) {
      var size = setupCanvas(canvas, 380);
      var r = state.range;
      var view = makeView(size.w, size.h, -r, r, -r, r);
      var x = clamp(view.ix(point.x), -r * 0.98, r * 0.98);
      var y = clamp(view.iy(point.y), -r * 0.98, r * 0.98);
      if (state.starts.length >= 6) state.starts.shift();
      state.starts.push({ x: x, y: y });
      render();
    });

    register(render);
    render();
  };

  // Expose the remaining initializers below; they are registered on the same object.
  window.__MATH_LABS__ = { init: LAB_INIT, rerender: rerenderAll, register: register, helpers: {
    compile: compile, fmt: fmt, palette: palette, setupCanvas: setupCanvas, makeView: makeView,
    drawGrid: drawGrid, plotFunction: plotFunction, drawSegment: drawSegment, drawDot: drawDot,
    drawPolyline: drawPolyline, arrowHead: arrowHead, bindDrag: bindDrag, addRange: addRange,
    addSelect: addSelect, addToggle: addToggle, addButton: addButton, addHint: addHint,
    setReadout: setReadout, setTable: setTable, setStatus: setStatus, setAria: setAria,
    readConfig: readConfig, safe: safe, derivative: derivative, autoRange: autoRange, clamp: clamp,
    withClip: withClip, debounce: debounce
  } };

  // The rest of the file continues below. This assignment lets each lab
  // initializer use the shared helpers without leaking globals.
})();

/* ============================================================
   Remaining labs. They share the helper object exported above so
   the file can stay a single inlined script without globals
   beyond one deliberate namespace.
   ============================================================ */

(function () {
  "use strict";

  var H = window.__MATH_LABS__.helpers;
  var LAB_INIT = window.__MATH_LABS__.init;
  var register = window.__MATH_LABS__.register;
  var rerenderAll = window.__MATH_LABS__.rerender;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fmt = H.fmt;
  var compile = H.compile;
  var palette = H.palette;
  var setupCanvas = H.setupCanvas;
  var makeView = H.makeView;
  var drawGrid = H.drawGrid;
  var plotFunction = H.plotFunction;
  var drawSegment = H.drawSegment;
  var drawDot = H.drawDot;
  var drawPolyline = H.drawPolyline;
  var arrowHead = H.arrowHead;
  var bindDrag = H.bindDrag;
  var addRange = H.addRange;
  var addSelect = H.addSelect;
  var addToggle = H.addToggle;
  var addButton = H.addButton;
  var addHint = H.addHint;
  var setReadout = H.setReadout;
  var setTable = H.setTable;
  var setStatus = H.setStatus;
  var setAria = H.setAria;
  var readConfig = H.readConfig;
  var safe = H.safe;
  var derivative = H.derivative;
  var autoRange = H.autoRange;
  var clamp = H.clamp;
  var withClip = H.withClip;
  var debounce = H.debounce;

  /* ============================================================
     5. 3D surface, contour map, tangent plane
     ============================================================ */

  LAB_INIT.surface = function (root) {
    var cfg = readConfig(root);
    var canvas = $("[data-canvas]", root);
    var contourCanvas = $("[data-canvas2]", root);
    var controls = $("[data-controls]", root);
    var readout = $("[data-readout]", root);
    var xmin = Number(cfg.xmin === undefined ? -2 : cfg.xmin);
    var xmax = Number(cfg.xmax === undefined ? 2 : cfg.xmax);
    var ymin = Number(cfg.ymin === undefined ? -2 : cfg.ymin);
    var ymax = Number(cfg.ymax === undefined ? 2 : cfg.ymax);

    var PRESETS = {
      "paraboloid": "x^2 + y^2",
      "saddle": "x^2 - y^2",
      "gaussian": "2*exp(-(x^2 + y^2))",
      "ripples": "0.8*sin(2*sqrt(x^2 + y^2))",
      "cone": "sqrt(x^2 + y^2)",
      "monkey saddle": "x^3 - 3*x*y^2"
    };

    var state = {
      fn: compile(cfg.f || "x^2 + y^2"),
      preset: cfg.preset || "paraboloid",
      x0: Number(cfg.x0 === undefined ? 0.8 : cfg.x0),
      y0: Number(cfg.y0 === undefined ? 0.6 : cfg.y0),
      yaw: 0.72,
      pitch: 0.55,
      zoom: 1,
      surface: true,
      mesh: true,
      tangent: true,
      normal: true
    };
    if (!state.fn) throw new Error("surface lab needs an f(x,y) expression");

    var x0Input;
    var y0Input;
    var scheduled = false;

    function schedule() {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(function () {
        scheduled = false;
        render();
      });
    }

    function grid(n) {
      var xs = [];
      var ys = [];
      var zs = [];
      var i;
      var j;
      for (i = 0; i < n; i += 1) {
        xs.push(xmin + ((xmax - xmin) * i) / (n - 1));
        ys.push(ymin + ((ymax - ymin) * i) / (n - 1));
      }
      var zmin = Infinity;
      var zmax = -Infinity;
      for (i = 0; i < n; i += 1) {
        zs[i] = [];
        for (j = 0; j < n; j += 1) {
          var z = safe(state.fn, xs[i], ys[j]);
          if (!isFinite(z)) z = NaN;
          zs[i][j] = z;
          if (isFinite(z)) {
            if (z < zmin) zmin = z;
            if (z > zmax) zmax = z;
          }
        }
      }
      if (!isFinite(zmin) || !isFinite(zmax)) { zmin = -1; zmax = 1; }
      if (zmax - zmin < 1e-9) { zmin -= 1; zmax += 1; }
      return { xs: xs, ys: ys, zs: zs, zmin: zmin, zmax: zmax };
    }

    function projector(size, bounds) {
      var xr = (xmax - xmin) / 2 || 1;
      var yr = (ymax - ymin) / 2 || 1;
      var zr = (bounds.zmax - bounds.zmin) / 2 || 1;
      var cx = (xmax + xmin) / 2;
      var cy = (ymax + ymin) / 2;
      var cz = (bounds.zmax + bounds.zmin) / 2;
      var scale = Math.min(size.w, size.h) * 0.38 * state.zoom;
      var cyaw = Math.cos(state.yaw);
      var syaw = Math.sin(state.yaw);
      var cp = Math.cos(state.pitch);
      var sp = Math.sin(state.pitch);
      return function (x, y, z) {
        var nx = (x - cx) / xr;
        var ny = (y - cy) / yr;
        var nz = ((z - cz) / zr) * 1.15;
        var x1 = nx * cyaw - ny * syaw;
        var y1 = nx * syaw + ny * cyaw;
        var y2 = y1 * sp + nz * cp;
        var depth = y1 * cp - nz * sp;
        return {
          x: size.w * 0.5 + x1 * scale,
          y: size.h * 0.53 - y2 * scale,
          depth: depth
        };
      };
    }

    function surfaceColor(t) {
      var stops = [
        [47, 93, 138],
        [72, 139, 128],
        [166, 178, 106],
        [214, 166, 84],
        [176, 95, 68]
      ];
      t = clamp(t, 0, 1) * (stops.length - 1);
      var i = Math.min(stops.length - 2, Math.floor(t));
      var f = t - i;
      var a = stops[i];
      var b = stops[i + 1];
      return "rgb(" + Math.round(a[0] + (b[0] - a[0]) * f) + "," +
        Math.round(a[1] + (b[1] - a[1]) * f) + "," +
        Math.round(a[2] + (b[2] - a[2]) * f) + ")";
    }

    function contourLevels(bounds) {
      var levels = [];
      var count = 9;
      for (var i = 1; i <= count; i += 1) {
        levels.push(bounds.zmin + ((bounds.zmax - bounds.zmin) * i) / (count + 1));
      }
      return levels;
    }

    function contourSegments(bounds, level) {
      var segs = [];
      var n = bounds.xs.length;
      for (var i = 0; i < n - 1; i += 1) {
        for (var j = 0; j < n - 1; j += 1) {
          var x0 = bounds.xs[i];
          var x1 = bounds.xs[i + 1];
          var y0 = bounds.ys[j];
          var y1 = bounds.ys[j + 1];
          var v0 = bounds.zs[i][j];
          var v1 = bounds.zs[i + 1][j];
          var v2 = bounds.zs[i + 1][j + 1];
          var v3 = bounds.zs[i][j + 1];
          if (![v0, v1, v2, v3].every(isFinite)) continue;
          var pts = [];
          function edge(xa, ya, va, xb, yb, vb) {
            if (va === vb) return;
            if ((va - level) * (vb - level) > 0) return;
            var t = (level - va) / (vb - va);
            if (t >= 0 && t <= 1) pts.push([xa + (xb - xa) * t, ya + (yb - ya) * t]);
          }
          edge(x0, y0, v0, x1, y0, v1);
          edge(x1, y0, v1, x1, y1, v2);
          edge(x1, y1, v2, x0, y1, v3);
          edge(x0, y1, v3, x0, y0, v0);
          if (pts.length >= 2) segs.push([pts[0], pts[1]]);
          if (pts.length === 4) segs.push([pts[2], pts[3]]);
        }
      }
      return segs;
    }

    function drawAxes3D(ctx, size, proj, bounds) {
      var pal = palette();
      ctx.save();
      ctx.strokeStyle = pal.ruleStrong;
      ctx.fillStyle = pal.muted;
      ctx.lineWidth = 1;
      ctx.font = '10px "IBM Plex Sans", system-ui, sans-serif';
      var base = proj(xmin, ymin, bounds.zmin);
      var xEnd = proj(xmax, ymin, bounds.zmin);
      var yEnd = proj(xmin, ymax, bounds.zmin);
      var zEnd = proj(xmin, ymin, bounds.zmax);
      ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(xEnd.x, xEnd.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(yEnd.x, yEnd.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(zEnd.x, zEnd.y); ctx.stroke();
      ctx.fillText("x", xEnd.x + 4, xEnd.y + 3);
      ctx.fillText("y", yEnd.x + 4, yEnd.y + 3);
      ctx.fillText("z", zEnd.x + 4, zEnd.y - 4);
      ctx.restore();
    }

    function render3D(bounds) {
      var size = setupCanvas(canvas, 420);
      var ctx = size.ctx;
      var pal = palette();
      var proj = projector(size, bounds);
      ctx.clearRect(0, 0, size.w, size.h);

      var n = size.w < 480 ? 26 : 36;
      var g = grid(n);
      var quads = [];
      var i;
      var j;
      for (i = 0; i < n - 1; i += 1) {
        for (j = 0; j < n - 1; j += 1) {
          var v00 = g.zs[i][j];
          var v10 = g.zs[i + 1][j];
          var v11 = g.zs[i + 1][j + 1];
          var v01 = g.zs[i][j + 1];
          if (![v00, v10, v11, v01].every(isFinite)) continue;
          var p00 = proj(g.xs[i], g.ys[j], v00);
          var p10 = proj(g.xs[i + 1], g.ys[j], v10);
          var p11 = proj(g.xs[i + 1], g.ys[j + 1], v11);
          var p01 = proj(g.xs[i], g.ys[j + 1], v01);
          var avgZ = (v00 + v10 + v11 + v01) / 4;
          quads.push({
            pts: [p00, p10, p11, p01],
            depth: (p00.depth + p10.depth + p11.depth + p01.depth) / 4,
            color: surfaceColor((avgZ - g.zmin) / (g.zmax - g.zmin))
          });
        }
      }
      quads.sort(function (a, b) { return a.depth - b.depth; });
      if (state.surface) {
        ctx.save();
        quads.forEach(function (quad) {
          ctx.beginPath();
          ctx.moveTo(quad.pts[0].x, quad.pts[0].y);
          for (var k = 1; k < 4; k += 1) ctx.lineTo(quad.pts[k].x, quad.pts[k].y);
          ctx.closePath();
          ctx.fillStyle = quad.color;
          ctx.globalAlpha = 0.94;
          ctx.fill();
          if (state.mesh) {
            ctx.globalAlpha = 0.22;
            ctx.strokeStyle = pal.ink;
            ctx.lineWidth = 0.45;
            ctx.stroke();
          }
        });
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      drawAxes3D(ctx, size, proj, bounds);

      var z0 = safe(state.fn, state.x0, state.y0);
      var eps = 1e-5;
      var fx = (safe(state.fn, state.x0 + eps, state.y0) - safe(state.fn, state.x0 - eps, state.y0)) / (2 * eps);
      var fy = (safe(state.fn, state.x0, state.y0 + eps) - safe(state.fn, state.x0, state.y0 - eps)) / (2 * eps);
      var grad = Math.hypot(fx, fy);

      if (state.tangent && isFinite(z0)) {
        var half = Math.min(xmax - xmin, ymax - ymin) * 0.16;
        var corners = [
          [state.x0 - half, state.y0 - half],
          [state.x0 + half, state.y0 - half],
          [state.x0 + half, state.y0 + half],
          [state.x0 - half, state.y0 + half]
        ];
        var plane = corners.map(function (c) {
          var z = z0 + fx * (c[0] - state.x0) + fy * (c[1] - state.y0);
          return proj(c[0], c[1], z);
        });
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(plane[0].x, plane[0].y);
        for (var q = 1; q < plane.length; q += 1) ctx.lineTo(plane[q].x, plane[q].y);
        ctx.closePath();
        ctx.fillStyle = pal.accent;
        ctx.globalAlpha = 0.2;
        ctx.fill();
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
      }

      if (state.normal && isFinite(z0)) {
        var vlen = Math.min(xmax - xmin, ymax - ymin) * 0.55;
        var norm = Math.hypot(fx, fy, 1) || 1;
        var tip = proj(
          state.x0 - (fx / norm) * vlen,
          state.y0 - (fy / norm) * vlen,
          z0 + (1 / norm) * vlen * 3.2
        );
        var baseP = proj(state.x0, state.y0, z0);
        ctx.save();
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(baseP.x, baseP.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.stroke();
        arrowHead(ctx, tip.x, tip.y, Math.atan2(tip.y - baseP.y, tip.x - baseP.x), 5, pal.ink);
        ctx.restore();
      }

      var point = proj(state.x0, state.y0, z0);
      ctx.save();
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4.6, 0, Math.PI * 2);
      ctx.fillStyle = pal.accent;
      ctx.fill();
      ctx.strokeStyle = pal.sheet;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = pal.ink;
      ctx.font = '600 11px "IBM Plex Sans", system-ui, sans-serif';
      ctx.fillText("P", point.x + 7, point.y - 6);
      ctx.restore();

      setAria(canvas, "3D surface of " + String(cfg.f || "f") + ". At (" + fmt(state.x0, 2) + ", " + fmt(state.y0, 2) + "), f=" + fmt(z0) + ", gradient magnitude " + fmt(grad) + ".");
      return { z0: z0, fx: fx, fy: fy, grad: grad, g: g };
    }

    function renderContour(bounds) {
      if (!contourCanvas) return;
      var size = setupCanvas(contourCanvas, 230);
      var ctx = size.ctx;
      var pal = palette();
      var view = makeView(size.w, size.h, xmin, xmax, ymin, ymax, { l: 34, r: 12, t: 12, b: 26 });
      ctx.clearRect(0, 0, size.w, size.h);
      drawGrid(ctx, view, { xTicks: 5, yTicks: 5 });

      var levels = contourLevels(bounds);
      ctx.save();
      withClip(ctx, view, function () {
        levels.forEach(function (level, index) {
          var segs = contourSegments(bounds, level);
          ctx.beginPath();
          ctx.strokeStyle = index % 2 === 0 ? pal.ink2 : pal.muted;
          ctx.globalAlpha = 0.55;
          ctx.lineWidth = 0.9;
          segs.forEach(function (seg) {
            ctx.moveTo(view.sx(seg[0][0]), view.sy(seg[0][1]));
            ctx.lineTo(view.sx(seg[1][0]), view.sy(seg[1][1]));
          });
          ctx.stroke();
        });
      });
      ctx.restore();
      ctx.globalAlpha = 1;

      var eps = 1e-5;
      var fx = (safe(state.fn, state.x0 + eps, state.y0) - safe(state.fn, state.x0 - eps, state.y0)) / (2 * eps);
      var fy = (safe(state.fn, state.x0, state.y0 + eps) - safe(state.fn, state.x0, state.y0 - eps)) / (2 * eps);
      var grad = Math.hypot(fx, fy);
      if (isFinite(grad) && grad > 1e-9) {
        var len = Math.min(xmax - xmin, ymax - ymin) * 0.22;
        var ux = (fx / grad) * len;
        var uy = (fy / grad) * len;
        var x1 = state.x0 + ux;
        var y1 = state.y0 + uy;
        ctx.save();
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(view.sx(state.x0), view.sy(state.y0));
        ctx.lineTo(view.sx(x1), view.sy(y1));
        ctx.stroke();
        arrowHead(ctx, view.sx(x1), view.sy(y1), Math.atan2(view.sy(y1) - view.sy(state.y0), view.sx(x1) - view.sx(state.x0)), 6, pal.accent);
        ctx.restore();
      }
      drawDot(ctx, view, state.x0, state.y0, pal.accent, 3.5);
      ctx.save();
      ctx.fillStyle = pal.muted;
      ctx.font = '10px "IBM Plex Sans", system-ui, sans-serif';
      ctx.fillText("level curves + ∇f at P", view.pad.l + 4, view.pad.t + 3);
      ctx.restore();
      setAria(contourCanvas, "Contour map with level curves and gradient arrow at the selected point.");
    }

    function render() {
      var bounds = grid(34);
      var info = render3D(bounds);
      renderContour(bounds);
      var z0 = info.z0;
      var sx = info.fx < 0 ? " − " : " + ";
      var sy = info.fy < 0 ? " − " : " + ";
      var plane = "z = " + fmt(z0, 3) + sx + fmt(Math.abs(info.fx), 3) + "(x − " + fmt(state.x0, 2) + ")" + sy + fmt(Math.abs(info.fy), 3) + "(y − " + fmt(state.y0, 2) + ")";
      setReadout(readout, [
        ["f(x₀, y₀)", fmt(z0, 4)],
        ["∂f/∂x", fmt(info.fx, 4)],
        ["∂f/∂y", fmt(info.fy, 4)],
        ["|∇f|", fmt(info.grad, 4)],
        ["tangent plane", plane]
      ]);
      setStatus(root,
        "At P = (" + fmt(state.x0, 2) + ", " + fmt(state.y0, 2) + "), f = " + fmt(z0, 4) +
        " and ∇f = (" + fmt(info.fx, 3) + ", " + fmt(info.fy, 3) + "). The gradient is perpendicular to the level curve through P and points uphill; " +
        "the tangent plane is the linearisation shown in the 3D view. Drag the surface to orbit; click the contour map to move P.");
    }

    addSelect(controls, {
      label: "surface",
      value: state.preset,
      options: Object.keys(PRESETS).map(function (name) { return [name, name]; }),
      onChange: function (name) {
        if (!PRESETS[name]) return;
        state.preset = name;
        state.fn = compile(PRESETS[name]);
        state.zoom = 1;
        render();
      }
    });
    x0Input = addRange(controls, {
      label: "x₀", min: xmin, max: xmax, step: (xmax - xmin) / 120, value: state.x0,
      narrow: true, format: function (v) { return fmt(v, 2); },
      onInput: function (v) { state.x0 = v; render(); }
    });
    y0Input = addRange(controls, {
      label: "y₀", min: ymin, max: ymax, step: (ymax - ymin) / 120, value: state.y0,
      narrow: true, format: function (v) { return fmt(v, 2); },
      onInput: function (v) { state.y0 = v; render(); }
    });
    addToggle(controls, { label: "surface", value: true, onChange: function (v) { state.surface = v; render(); } });
    addToggle(controls, { label: "mesh", value: true, onChange: function (v) { state.mesh = v; render(); } });
    addToggle(controls, { label: "tangent plane", value: true, onChange: function (v) { state.tangent = v; render(); } });
    addToggle(controls, { label: "normal", value: true, onChange: function (v) { state.normal = v; render(); } });
    addButton(controls, {
      label: "Reset view", ghost: true,
      onClick: function () { state.yaw = 0.72; state.pitch = 0.55; state.zoom = 1; render(); }
    });
    addHint(root, "Drag the surface to orbit. Drag the small contour map to move P; the sliders do the same from the keyboard.");

    var drag3d = false;
    var last = null;
    function pointOf(event) {
      var rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }
    canvas.addEventListener("pointerdown", function (event) {
      drag3d = true;
      last = pointOf(event);
      if (canvas.setPointerCapture) { try { canvas.setPointerCapture(event.pointerId); } catch (err) {} }
      event.preventDefault();
    });
    canvas.addEventListener("pointermove", function (event) {
      if (!drag3d) return;
      var p = pointOf(event);
      state.yaw += (p.x - last.x) * 0.009;
      state.pitch = clamp(state.pitch - (p.y - last.y) * 0.009, -0.15, 1.35);
      last = p;
      schedule();
      event.preventDefault();
    });
    function end3d(event) {
      if (!drag3d) return;
      drag3d = false;
      if (event) event.preventDefault();
    }
    canvas.addEventListener("pointerup", end3d);
    canvas.addEventListener("pointercancel", end3d);

    if (contourCanvas) {
      bindDrag(contourCanvas, function (point) {
        var size = setupCanvas(contourCanvas, 230);
        var view = makeView(size.w, size.h, xmin, xmax, ymin, ymax, { l: 34, r: 12, t: 12, b: 26 });
        state.x0 = clamp(view.ix(point.x), xmin, xmax);
        state.y0 = clamp(view.iy(point.y), ymin, ymax);
        if (x0Input) x0Input.value = String(state.x0);
        if (y0Input) y0Input.value = String(state.y0);
        render();
      });
    }

    window.addEventListener("beforeprint", render);
    register(render);
    render();
  };

  /* ============================================================
     6. Root finding: bisection / Newton / secant
     ============================================================ */

  LAB_INIT.root = function (root) {
    var cfg = readConfig(root);
    var f = compile(cfg.f);
    if (!f) throw new Error("root lab needs an f expression");
    var df = compile(cfg.df);
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var readout = $("[data-readout]", root);
    var table = $("[data-table]", root);
    var a = Number(cfg.a === undefined ? 1 : cfg.a);
    var b = Number(cfg.b === undefined ? 2 : cfg.b);
    var x0 = Number(cfg.x0 === undefined ? (a + b) / 2 : cfg.x0);
    var x1 = Number(cfg.x1 === undefined ? x0 + 0.1 : cfg.x1);
    var rootValue = typeof cfg.root === "number" ? cfg.root : null;
    var state = {
      method: cfg.method || "newton",
      tol: Number(cfg.tol || 1e-6),
      a: a,
      b: b,
      x: x0,
      x0: x0,
      x1: x1,
      iter: 0,
      history: [],
      bracket: [a, b],
      done: false,
      comparison: ""
    };
    var timer = null;

    function reset() {
      if (timer) { window.clearInterval(timer); timer = null; }
      state.a = a;
      state.b = b;
      state.x = x0;
      state.x0 = x0;
      state.x1 = x1;
      state.iter = 0;
      state.history = [];
      state.bracket = [a, b];
      state.done = false;
      state.comparison = "";
      render();
    }

    function errFor(x, fallback) {
      if (rootValue !== null) return Math.abs(x - rootValue);
      return typeof fallback === "number" && isFinite(fallback) ? fallback : Math.abs(safe(f, x, 0));
    }

    function step() {
      if (state.done) return;
      var newX = state.x;
      var fx = 0;
      var err = 0;
      var note = "";
      if (state.method === "bisection") {
        var mid = (state.bracket[0] + state.bracket[1]) / 2;
        var fa = safe(f, state.bracket[0], 0);
        var fm = safe(f, mid, 0);
        if (fa * fm <= 0) state.bracket[1] = mid;
        else state.bracket[0] = mid;
        newX = mid;
        fx = fm;
        err = (state.bracket[1] - state.bracket[0]) / 2;
        note = "The sign change is in [" + fmt(state.bracket[0], 4) + ", " + fmt(state.bracket[1], 4) + "], so the error bound halves.";
      } else if (state.method === "secant") {
        var sx0;
        var sx1;
        if (state.history.length >= 2) {
          sx0 = state.history[state.history.length - 2].x;
          sx1 = state.history[state.history.length - 1].x;
        } else {
          sx0 = state.x0;
          sx1 = state.x1;
        }
        var f0 = safe(f, sx0, 0);
        var f1 = safe(f, sx1, 0);
        if (Math.abs(f1 - f0) < 1e-14) {
          state.done = true;
          setStatus(root, "The secant is horizontal (f(x₁) = f(x₀)); the method cannot continue. Restart with a different pair.");
          return;
        }
        newX = sx1 - f1 * (sx1 - sx0) / (f1 - f0);
        fx = safe(f, newX, 0);
        err = Math.abs(newX - sx1);
        note = "The next x is where the secant through the last two iterates crosses y = 0.";
      } else {
        var current = state.x;
        var fc = safe(f, current, 0);
        var slope = df ? df(current, 0, 0) : derivative(f, current, 0);
        if (Math.abs(slope) < 1e-13) {
          state.done = true;
          setStatus(root, "The derivative is (numerically) zero at x = " + fmt(current) + "; Newton's tangent is horizontal. Restart with a different x₀.");
          return;
        }
        newX = current - fc / slope;
        fx = safe(f, newX, 0);
        err = Math.abs(newX - current);
        note = "The tangent at x = " + fmt(current, 4) + " crosses the axis at the next iterate.";
      }
      state.iter += 1;
      state.x = newX;
      if (state.method === "bisection") state.x = (state.bracket[0] + state.bracket[1]) / 2;
      state.history.push({
        i: state.iter,
        x: state.x,
        fx: safe(f, state.x, 0),
        err: errFor(state.x, err)
      });
      if (Math.abs(state.history[state.history.length - 1].fx) < state.tol || err < state.tol) {
        state.done = true;
      }
      render(note);
    }

    function pureBisection() {
      var lo = a;
      var hi = b;
      var steps = 0;
      var mid = (lo + hi) / 2;
      while (steps < 60 && (hi - lo) / 2 > state.tol) {
        mid = (lo + hi) / 2;
        var fm = safe(f, mid, 0);
        if (safe(f, lo, 0) * fm <= 0) hi = mid;
        else lo = mid;
        steps += 1;
      }
      return { steps: steps, x: mid, err: (hi - lo) / 2 };
    }

    function pureNewton() {
      var x = x0;
      var steps = 0;
      var err = Infinity;
      while (steps < 60) {
        var fx = safe(f, x, 0);
        var slope = df ? df(x, 0, 0) : derivative(f, x, 0);
        if (Math.abs(slope) < 1e-14) break;
        var next = x - fx / slope;
        err = Math.abs(next - x);
        x = next;
        steps += 1;
        if (err < state.tol) break;
      }
      return { steps: steps, x: x, err: err };
    }

    function pureSecant() {
      var p0 = x0;
      var p1 = x1;
      var steps = 0;
      var err = Infinity;
      while (steps < 60) {
        var f0 = safe(f, p0, 0);
        var f1 = safe(f, p1, 0);
        if (Math.abs(f1 - f0) < 1e-14) break;
        var next = p1 - f1 * (p1 - p0) / (f1 - f0);
        err = Math.abs(next - p1);
        p0 = p1;
        p1 = next;
        steps += 1;
        if (err < state.tol) break;
      }
      return { steps: steps, x: p1, err: err };
    }

    function compareAll() {
      var bi = pureBisection();
      var ne = pureNewton();
      var se = pureSecant();
      state.comparison = "Bisection: " + bi.steps + " steps; Newton: " + ne.steps + " steps; Secant: " + se.steps + " steps (tolerance " + state.tol + ").";
    }

    function render(note) {
      var size = setupCanvas(canvas, 380);
      var lo = Math.min(a, b, x0, x1) - 0.45;
      var hi = Math.max(a, b, x0, x1) + 0.45;
      var yr = autoRange(f, lo, hi, true);
      var view = makeView(size.w, size.h, lo, hi, yr[0], yr[1]);
      var pal = palette();
      var ctx = size.ctx;
      ctx.clearRect(0, 0, size.w, size.h);
      drawGrid(ctx, view);
      plotFunction(ctx, f, view, { color: pal.ink, width: 2.1 });

      if (state.method === "bisection" && state.bracket) {
        var bx0 = view.sx(state.bracket[0]);
        var bx1 = view.sx(state.bracket[1]);
        ctx.save();
        ctx.fillStyle = pal.accentSoft;
        ctx.fillRect(bx0, view.pad.t, Math.max(1, bx1 - bx0), view.ih);
        ctx.restore();
        drawSegment(ctx, view, state.bracket[0], yr[0], state.bracket[0], yr[1], pal.accent, 1, [3, 3]);
        drawSegment(ctx, view, state.bracket[1], yr[0], state.bracket[1], yr[1], pal.accent, 1, [3, 3]);
      }

      if (state.method === "newton") {
        var fc = safe(f, state.x, 0);
        var slope = df ? df(state.x, 0, 0) : derivative(f, state.x, 0);
        var span = (hi - lo) * 0.5;
        drawSegment(ctx, view, state.x - span, fc - slope * span, state.x + span, fc + slope * span, pal.heun, 1.3, [6, 4]);
      }
      if (state.method === "secant" && state.history.length >= 2) {
        var p0 = state.history[state.history.length - 2];
        var p1 = state.history[state.history.length - 1];
        var slopeS = (p1.fx - p0.fx) / (p1.x - p0.x);
        var spanS = (hi - lo) * 0.45;
        drawSegment(ctx, view, p1.x - spanS, p1.fx - slopeS * spanS, p1.x + spanS, p1.fx + slopeS * spanS, pal.heun, 1.2, [5, 4]);
      }

      if (rootValue !== null) {
        drawSegment(ctx, view, rootValue, yr[0], rootValue, yr[1], pal.ex, 1, [2, 4]);
        drawDot(ctx, view, rootValue, 0, pal.ex, 3.2, "r");
      }
      drawDot(ctx, view, state.x, safe(f, state.x, 0), pal.accent, 4.2, "x" + (state.iter ? "ₙ" : "₀"));

      var rows = state.history.slice(-8).map(function (item) {
        return [String(item.i), fmt(item.x, 6), fmt(item.fx, 5), fmt(item.err, 5)];
      });
      if (!rows.length) {
        rows.push(["0", fmt(state.x, 6), fmt(safe(f, state.x, 0), 5), rootValue !== null ? fmt(Math.abs(state.x - rootValue), 5) : "—"]);
      }
      setTable(table, "Iterations", ["k", "xₖ", "f(xₖ)", "error"], rows);

      var lastErr = state.history.length ? state.history[state.history.length - 1].err : NaN;
      setAria(canvas, "Root finding with " + state.method + ". Current x=" + fmt(state.x, 6) + ", f=" + fmt(safe(f, state.x, 0), 5) + ".");
      setReadout(readout, [
        ["method", state.method],
        ["iteration", String(state.iter)],
        ["x", fmt(state.x, 6)],
        ["f(x)", fmt(safe(f, state.x, 0), 6)],
        ["error", isFinite(lastErr) ? fmt(lastErr, 6) : "—"],
        ["tolerance", String(state.tol)]
      ]);
      var status = "Method: " + state.method + ". Iteration " + state.iter + " gives x = " + fmt(state.x, 6) +
        ", f(x) = " + fmt(safe(f, state.x, 0), 6);
      if (isFinite(lastErr)) status += ", error estimate = " + fmt(lastErr, 6);
      status += ". " + (note || "");
      if (state.done) status += " Tolerance reached; stop and check the residual, not only the step size.";
      if (state.comparison) status += " " + state.comparison;
      setStatus(root, status);
    }

    addSelect(controls, {
      label: "method",
      value: state.method,
      options: [["bisection", "bisection"], ["newton", "Newton"], ["secant", "secant"]],
      onChange: function (value) { state.method = value; reset(); }
    });
    addSelect(controls, {
      label: "tolerance",
      value: String(state.tol),
      options: [["0.001", "1e−3"], ["0.000001", "1e−6"], ["0.000000001", "1e−9"]],
      onChange: function (value) { state.tol = Number(value); reset(); }
    });
    addButton(controls, {
      label: "Step", primary: true,
      onClick: function () { if (timer) { window.clearInterval(timer); timer = null; } step(); }
    });
    addButton(controls, {
      label: "Run",
      onClick: function () {
        if (timer) { window.clearInterval(timer); timer = null; return; }
        timer = window.setInterval(function () {
          if (state.done) { window.clearInterval(timer); timer = null; return; }
          step();
        }, 230);
      }
    });
    addButton(controls, {
      label: "Compare all", ghost: true,
      onClick: function () { compareAll(); render(); }
    });
    addButton(controls, { label: "Reset", ghost: true, onClick: reset });
    addHint(root, "Newton and secant are fast but local. Bisection is slow and safe when f(a) and f(b) have opposite signs.");

    register(render);
    render();
  };

  /* ============================================================
     7. Polynomial interpolation and the Runge phenomenon
     ============================================================ */

  LAB_INIT.interp = function (root) {
    var cfg = readConfig(root);
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var readout = $("[data-readout]", root);
    var a = Number(cfg.xmin === undefined ? -1 : cfg.xmin);
    var b = Number(cfg.xmax === undefined ? 1 : cfg.xmax);
    var PRESETS = {
      "Runge 1/(1+25x²)": "1/(1+25*x^2)",
      "sin(3x)": "sin(3*x)",
      "exp(x)": "exp(x)",
      "|x|": "abs(x)"
    };
    var state = {
      n: Number(cfg.n || 9),
      dist: cfg.dist || "equidistant",
      preset: cfg.preset || "Runge 1/(1+25x²)",
      fn: compile(cfg.f || PRESETS["Runge 1/(1+25x²)"]),
      showError: true
    };
    if (!state.fn) throw new Error("interp lab needs an f expression");

    function nodes() {
      var list = [];
      var i;
      if (state.dist === "chebyshev") {
        for (i = 0; i < state.n; i += 1) {
          var t = Math.cos((Math.PI * (2 * i + 1)) / (2 * state.n));
          list.push((a + b) / 2 + ((b - a) / 2) * t);
        }
        list.sort(function (p, q) { return p - q; });
      } else {
        for (i = 0; i < state.n; i += 1) list.push(a + ((b - a) * i) / (state.n - 1));
      }
      return list;
    }

    function lagrange(x, xs, ys) {
      var total = 0;
      for (var i = 0; i < xs.length; i += 1) {
        var term = ys[i];
        for (var j = 0; j < xs.length; j += 1) {
          if (j === i) continue;
          term *= (x - xs[j]) / (xs[i] - xs[j]);
        }
        total += term;
      }
      return total;
    }

    function maxError(xs, ys) {
      var max = 0;
      for (var i = 0; i <= 400; i += 1) {
        var x = a + ((b - a) * i) / 400;
        var err = Math.abs(safe(state.fn, x, 0) - lagrange(x, xs, ys));
        if (isFinite(err) && err > max) max = err;
      }
      return max;
    }

    function render() {
      var size = setupCanvas(canvas, 380);
      var xs = nodes();
      var ys = xs.map(function (x) { return safe(state.fn, x, 0); });
      var yr = autoRange(state.fn, a, b, false);
      var view = makeView(size.w, size.h, a, b, yr[0], yr[1]);
      var pal = palette();
      var ctx = size.ctx;
      ctx.clearRect(0, 0, size.w, size.h);
      drawGrid(ctx, view);

      plotFunction(ctx, state.fn, view, { color: pal.ink, width: 2.0, dash: [6, 4] });
      var poly = [];
      for (var i = 0; i <= 420; i += 1) {
        var x = a + ((b - a) * i) / 420;
        poly.push({ x: x, y: lagrange(x, xs, ys) });
      }
      drawPolyline(ctx, view, poly, pal.accent, 2.0, []);
      xs.forEach(function (node, index) {
        drawDot(ctx, view, node, ys[index], pal.def, 3.2);
      });

      var err = maxError(xs, ys);
      if (state.showError && err > 1e-12) {
        var strip = (view.ymax - view.ymin) * 0.26;
        var errPoints = [];
        for (var k = 0; k <= 300; k += 1) {
          var xx = a + ((b - a) * k) / 300;
          var ee = Math.abs(safe(state.fn, xx, 0) - lagrange(xx, xs, ys));
          errPoints.push({ x: xx, y: view.ymin + (ee / err) * strip });
        }
        drawPolyline(ctx, view, errPoints, pal.error, 1.2, [3, 4]);
        ctx.save();
        ctx.font = '10px "IBM Plex Sans", system-ui, sans-serif';
        ctx.fillStyle = pal.error;
        ctx.fillText("|f − p|, scaled into the lower band", view.pad.l + 6, view.sy(view.ymin + strip * 0.55));
        ctx.restore();
      }

      setAria(canvas, "Interpolation with " + state.n + " " + state.dist + " nodes. Maximum error " + fmt(err, 5) + ".");
      setReadout(readout, [
        ["nodes", String(state.n)],
        ["degree", String(state.n - 1)],
        ["distribution", state.dist],
        ["max |f − p|", fmt(err, 6)],
        ["node spacing", state.dist === "equidistant" ? fmt((b - a) / (state.n - 1), 4) : "clustered at ends"]
      ]);
      var status = state.n + " " + state.dist + " nodes, degree " + (state.n - 1) +
        " interpolant, max error " + fmt(err, 6) + " on [" + fmt(a, 2) + ", " + fmt(b, 2) + "].";
      if (state.dist === "equidistant" && state.n >= 9) {
        status += " Watch the endpoints: equidistant nodes can make a high-degree interpolant oscillate (Runge). Switch to Chebyshev and compare the maximum error.";
      } else if (state.dist === "chebyshev") {
        status += " Chebyshev nodes cluster near the endpoints; they usually reduce the maximum error for the same degree.";
      }
      setStatus(root, status);
    }

    addSelect(controls, {
      label: "function",
      value: state.preset,
      options: Object.keys(PRESETS).map(function (name) { return [name, name]; }),
      onChange: function (name) {
        state.preset = name;
        state.fn = compile(PRESETS[name]);
        render();
      }
    });
    addRange(controls, {
      label: "nodes n",
      min: 3, max: 15, step: 1, value: state.n,
      format: function (v) { return String(Math.round(v)); },
      onInput: function (v) { state.n = Math.round(v); render(); }
    });
    addSelect(controls, {
      label: "nodes",
      value: state.dist,
      options: [["equidistant", "equidistant"], ["chebyshev", "Chebyshev"]],
      onChange: function (value) { state.dist = value; render(); }
    });
    addToggle(controls, {
      label: "show error", value: true,
      onChange: function (value) { state.showError = value; render(); }
    });
    addHint(root, "Increase n in both distributions. The interesting comparison is the maximum error, not the picture near the middle.");

    register(render);
    render();
  };

  /* ============================================================
     8. 2D linear map / eigenvector lab
     ============================================================ */

  LAB_INIT.matrix = function (root) {
    var cfg = readConfig(root);
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var readout = $("[data-readout]", root);
    var state = {
      a: Number(cfg.a === undefined ? 1 : cfg.a),
      b: Number(cfg.b === undefined ? 0.5 : cfg.b),
      c: Number(cfg.c === undefined ? 0.2 : cfg.c),
      d: Number(cfg.d === undefined ? 1 : cfg.d),
      vx: Number(cfg.vx === undefined ? 1.2 : cfg.vx),
      vy: Number(cfg.vy === undefined ? 0.7 : cfg.vy)
    };
    var PRESETS = {
      "identity": [1, 0, 0, 1],
      "rotate 30°": [Math.cos(Math.PI / 6), -Math.sin(Math.PI / 6), Math.sin(Math.PI / 6), Math.cos(Math.PI / 6)],
      "shear": [1, 1, 0, 1],
      "reflect x": [1, 0, 0, -1],
      "project onto x": [1, 0, 0, 0],
      "scale 1.5": [1.5, 0, 0, 1.5]
    };
    var angleInput;
    var preset = cfg.preset || "identity";

    function apply(x, y) {
      return { x: state.a * x + state.b * y, y: state.c * x + state.d * y };
    }

    function eigen() {
      var tr = state.a + state.d;
      var det = state.a * state.d - state.b * state.c;
      var disc = tr * tr - 4 * det;
      if (disc >= 0) {
        var r = Math.sqrt(disc);
        return { real: true, l1: (tr + r) / 2, l2: (tr - r) / 2, det: det };
      }
      return { real: false, re: tr / 2, im: Math.sqrt(-disc) / 2, det: det };
    }

    function drawArrow(ctx, view, x1, y1, x2, y2, color, width) {
      var px1 = view.sx(x1);
      var py1 = view.sy(y1);
      var px2 = view.sx(x2);
      var py2 = view.sy(y2);
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width || 1.7;
      ctx.beginPath();
      ctx.moveTo(px1, py1);
      ctx.lineTo(px2, py2);
      ctx.stroke();
      arrowHead(ctx, px2, py2, Math.atan2(py2 - py1, px2 - px1), 6, color);
      ctx.restore();
    }

    function render() {
      var size = setupCanvas(canvas, 380);
      var r = 3.2;
      var view = makeView(size.w, size.h, -r, r, -r, r);
      var pal = palette();
      var ctx = size.ctx;
      ctx.clearRect(0, 0, size.w, size.h);
      drawGrid(ctx, view);
      var i;
      var t;

      // original grid
      ctx.save();
      withClip(ctx, view, function () {
        ctx.strokeStyle = pal.grid;
        ctx.lineWidth = 0.8;
        for (i = -3; i <= 3; i += 1) {
          ctx.beginPath();
          ctx.moveTo(view.sx(i), view.sy(-3));
          ctx.lineTo(view.sx(i), view.sy(3));
          ctx.moveTo(view.sx(-3), view.sy(i));
          ctx.lineTo(view.sx(3), view.sy(i));
          ctx.stroke();
        }
      });
      ctx.restore();

      // transformed grid
      ctx.save();
      withClip(ctx, view, function () {
        ctx.strokeStyle = pal.heun;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1;
        for (i = -3; i <= 3; i += 1) {
          ctx.beginPath();
          for (t = 0; t <= 40; t += 1) {
            var yy = -3 + (6 * t) / 40;
            var p = apply(i, yy);
            if (t === 0) ctx.moveTo(view.sx(p.x), view.sy(p.y));
            else ctx.lineTo(view.sx(p.x), view.sy(p.y));
          }
          ctx.stroke();
          ctx.beginPath();
          for (t = 0; t <= 40; t += 1) {
            var xx = -3 + (6 * t) / 40;
            var q = apply(xx, i);
            if (t === 0) ctx.moveTo(view.sx(q.x), view.sy(q.y));
            else ctx.lineTo(view.sx(q.x), view.sy(q.y));
          }
          ctx.stroke();
        }
      });
      ctx.restore();
      ctx.globalAlpha = 1;

      // unit square image
      var sq = [[0, 0], [1, 0], [1, 1], [0, 1]].map(function (p) { return apply(p[0], p[1]); });
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(view.sx(sq[0].x), view.sy(sq[0].y));
      for (i = 1; i < 4; i += 1) ctx.lineTo(view.sx(sq[i].x), view.sy(sq[i].y));
      ctx.closePath();
      ctx.fillStyle = pal.accentSoft;
      ctx.fill();
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.restore();

      // eigenlines
      var ev = eigen();
      if (ev.real) {
        [[ev.l1, pal.accent], [ev.l2, pal.def]].forEach(function (pair) {
          var lambda = pair[0];
          var dx = Math.abs(state.b) > 1e-7 ? state.b : lambda - state.d;
          var dy = Math.abs(state.b) > 1e-7 ? lambda - state.a : state.c;
          var norm = Math.hypot(dx, dy);
          if (norm < 1e-9) return;
          var ux = (dx / norm) * r;
          var uy = (dy / norm) * r;
          drawSegment(ctx, view, -ux, -uy, ux, uy, pair[1], 1.2, [4, 4]);
        });
      }

      // vector and image
      var image = apply(state.vx, state.vy);
      drawArrow(ctx, view, 0, 0, state.vx, state.vy, pal.muted, 1.3);
      drawArrow(ctx, view, 0, 0, image.x, image.y, pal.accent, 2.0);
      drawDot(ctx, view, state.vx, state.vy, pal.muted, 3.2, "v");
      drawDot(ctx, view, image.x, image.y, pal.accent, 3.4, "Av");

      var det = state.a * state.d - state.b * state.c;
      var eigenText = ev.real ? "λ₁=" + fmt(ev.l1, 3) + ", λ₂=" + fmt(ev.l2, 3) : fmt(ev.re, 3) + " ± " + fmt(ev.im, 3) + "\u2009i";
      setAria(canvas, "Linear map with determinant " + fmt(det, 3) + ". Vector v maps to Av.");
      setReadout(readout, [
        ["matrix", "[" + fmt(state.a, 2) + " " + fmt(state.b, 2) + "; " + fmt(state.c, 2) + " " + fmt(state.d, 2) + "]"],
        ["v", "(" + fmt(state.vx, 2) + ", " + fmt(state.vy, 2) + ")"],
        ["Av", "(" + fmt(image.x, 2) + ", " + fmt(image.y, 2) + ")"],
        ["det A", fmt(det, 4)],
        ["area scale", fmt(Math.abs(det), 4)],
        ["eigenvalues", eigenText]
      ]);
      var status = "det A = " + fmt(det, 3) + " scales area by |det| = " + fmt(Math.abs(det), 3);
      status += det < 0 ? " and reverses orientation." : " and preserves orientation.";
      if (ev.real) {
        status += " The dashed lines are eigen-directions: vectors on them are only stretched by λ. Drag the grey vector to test.";
      } else {
        status += " The eigenvalues are complex: no real eigen-direction; the map rotates and scales.";
      }
      setStatus(root, status);
    }

    function syncAngle() {
      if (!angleInput) return;
      var angle = Math.atan2(state.vy, state.vx) * 180 / Math.PI;
      if (angle < 0) angle += 360;
      angleInput.value = String(angle);
      angleInput.dispatchEvent(new Event("input"));
    }

    addSelect(controls, {
      label: "preset",
      value: preset,
      options: Object.keys(PRESETS).map(function (name) { return [name, name]; }),
      onChange: function (name) {
        var m = PRESETS[name];
        if (!m) return;
        state.a = m[0]; state.b = m[1]; state.c = m[2]; state.d = m[3];
        syncAngle();
        rerenderAll();
      }
    });
    ["a", "b", "c", "d"].forEach(function (key) {
      addRange(controls, {
        label: key, min: -2, max: 2, step: 0.05, value: state[key], narrow: true,
        format: function (v) { return fmt(v, 2); },
        onInput: function (v) { state[key] = v; render(); }
      });
    });
    angleInput = addRange(controls, {
      label: "vector angle",
      min: 0, max: 360, step: 1, value: 30,
      format: function (v) { return String(Math.round(v)) + "°"; },
      onInput: function (v) {
        var rad = (v * Math.PI) / 180;
        var mag = Math.max(0.2, Math.hypot(state.vx, state.vy));
        state.vx = mag * Math.cos(rad);
        state.vy = mag * Math.sin(rad);
        render();
      }
    });
    addButton(controls, {
      label: "Reset", ghost: true,
      onClick: function () {
        state.a = 1; state.b = 0.5; state.c = 0.2; state.d = 1;
        state.vx = 1.2; state.vy = 0.7;
        syncAngle();
        rerenderAll();
      }
    });
    addHint(root, "Drag the grey vector. The coloured arrow is Av; the unit square shows the area scale.");

    bindDrag(canvas, function (point) {
      var size = setupCanvas(canvas, 380);
      var view = makeView(size.w, size.h, -3.2, 3.2, -3.2, 3.2);
      var x = view.ix(point.x);
      var y = view.iy(point.y);
      var mag = clamp(Math.hypot(x, y), 0.2, 2.6);
      var angle = Math.atan2(y, x);
      state.vx = mag * Math.cos(angle);
      state.vy = mag * Math.sin(angle);
      syncAngle();
      render();
    });

    register(render);
    render();
  };

  /* ============================================================
     Quiz
     ============================================================ */

  function readStore(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
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
      setStatus(root, "Quiz data is not valid JSON.");
      return;
    }
    if (!Array.isArray(QUESTIONS) || !QUESTIONS.length) return;

    var questionsEl = $("[data-quiz-questions]", root);
    var progressEl = $("[data-quiz-progress]", root);
    var scoreEl = $("[data-quiz-score]", root);
    var resetBtn = $("[data-quiz-reset]", root);
    var retryBtn = $("[data-quiz-retry]", root);
    var storageKey = "math-note-quiz:" + (root.getAttribute("data-quiz-id") || document.title || "default");
    var answers = readStore(storageKey, {});
    if (!answers || typeof answers !== "object") answers = {};

    function answeredCount() {
      return Object.keys(answers).filter(function (key) {
        return answers[key] !== null && answers[key] !== undefined;
      }).length;
    }

    function correctCount() {
      return Object.keys(answers).reduce(function (total, key) {
        var i = parseInt(key, 10);
        return total + (QUESTIONS[i] && answers[key] === QUESTIONS[i].answer ? 1 : 0);
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

    function markQuestion(questionEl, i) {
      var chosen = answers[i];
      var isAnswered = chosen !== undefined && chosen !== null;
      questionEl.classList.toggle("is-answered", isAnswered);
      var buttons = $$(".quiz__option", questionEl);
      buttons.forEach(function (button, j) {
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
        wrap.className = "quiz__question";
        wrap.setAttribute("data-q", String(i));

        var prompt = document.createElement("p");
        prompt.className = "quiz__prompt";
        var num = document.createElement("span");
        num.className = "qnum";
        num.textContent = String(i + 1).padStart(2, "0");
        prompt.appendChild(num);
        prompt.appendChild(document.createTextNode(" " + question.prompt));
        wrap.appendChild(prompt);

        var options = document.createElement("div");
        options.className = "quiz__options";
        question.options.forEach(function (option, j) {
          var button = document.createElement("button");
          button.type = "button";
          button.className = "quiz__option";
          button.textContent = option;
          button.addEventListener("click", function () {
            if (answers[i] !== undefined && answers[i] !== null) return;
            answers[i] = j;
            writeStore(storageKey, answers);
            markQuestion(wrap, i);
            updateBar();
          });
          options.appendChild(button);
        });
        wrap.appendChild(options);

        var explain = document.createElement("p");
        explain.className = "quiz__explain";
        explain.setAttribute("role", "status");
        explain.setAttribute("aria-live", "polite");
        var strong = document.createElement("strong");
        strong.textContent = "Why: ";
        explain.appendChild(strong);
        explain.appendChild(document.createTextNode(question.explain));
        wrap.appendChild(explain);

        questionsEl.appendChild(wrap);
        markQuestion(wrap, i);
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
    if (retryBtn) {
      retryBtn.addEventListener("click", function () {
        var kept = {};
        Object.keys(answers).forEach(function (key) {
          var i = parseInt(key, 10);
          if (QUESTIONS[i] && answers[key] === QUESTIONS[i].answer) kept[i] = answers[key];
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
    $$("[data-math-lab]").forEach(function (root) {
      if (root.getAttribute("data-math-ready") === "1") return;
      var kind = root.getAttribute("data-math-lab");
      var init = LAB_INIT[kind];
      if (!init) {
        setStatus(root, "Unknown lab type: " + kind);
        console.warn("Unknown math lab", kind);
        return;
      }
      try {
        init(root);
        root.setAttribute("data-math-ready", "1");
      } catch (err) {
        console.error(err);
        setStatus(root, "This lab failed to render: " + err.message);
      }
    });
    $$("[data-math-quiz]").forEach(initQuiz);
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
})();
