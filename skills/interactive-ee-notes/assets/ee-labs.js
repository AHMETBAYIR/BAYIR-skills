/* ============================================================
   Interactive EE notes — shared lab core
   Vanilla JS, no dependencies, inlined by the builder.

   Public API (window.EE):
     EE.$ / EE.$$ / EE.clamp / EE.fmt / EE.fmtInt / EE.pct
     EE.db / EE.log10 / EE.erfc / EE.Q / EE.linspace
     EE.palette()
     EE.canvas(canvasEl, drawFn)
     EE.axes(ctx, box, opts)         linear axes
     EE.logAxes(ctx, box, opts)      log-frequency axes
     EE.line / EE.arrow / EE.label / EE.dot / EE.dash
     EE.wire / EE.resistorH / EE.resistorV / EE.capacitorV
     EE.sourceV / EE.ground / EE.junction
     EE.initLab(root, renderFn)
     EE.readout(rows) / EE.quiz(root)
     EE.check(name, fn) / EE.runChecks()
     EE.registerLab(name, renderFn)

   A lab is declared as:

     <div class="eelab" data-ee-lab="transient">
       <div data-gate data-answer="b" data-why="...">...</div>
       <div data-controls>
         <input type="range" data-param="r" data-default="1000" ...>
       </div>
       <canvas data-canvas></canvas>
       <div data-readout></div>
       <p data-status aria-live="polite"></p>
       <p class="eelab__print" data-print></p>
     </div>

   Config is authored content, parsed as data, never evaluated.
   ============================================================ */

(function () {
  "use strict";

  var checks = [];

  /* ---------------- helpers ---------------- */

  function $(selector, root) { return (root || document).querySelector(selector); }
  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function log10(v) { return Math.log(v) / Math.LN10; }
  function db(v) { return 20 * log10(Math.max(v, 1e-300)); }
  function linspace(a, b, n) {
    var out = [], i;
    for (i = 0; i < n; i++) out.push(a + (b - a) * i / (n - 1));
    return out;
  }
  function fmt(value, digits) {
    if (typeof value !== "number" || !isFinite(value)) return "—";
    var d = digits === undefined ? 3 : digits;
    if (Math.abs(value) < 5e-13) value = 0;
    var a = Math.abs(value);
    if (a !== 0 && (a < 1e-3 || a >= 1e5)) return value.toExponential(2);
    var text = value.toFixed(d);
    if (text.indexOf(".") >= 0) text = text.replace(/0+$/, "").replace(/\.$/, "");
    return text === "-0" ? "0" : text;
  }
  function fmtInt(value) {
    return typeof value === "number" && isFinite(value) ? String(Math.round(value)) : "—";
  }
  function pct(value, digits) { return fmt(value * 100, digits === undefined ? 1 : digits) + "%"; }

  /* A&S 7.1.26; |error| < 1.5e-7. */
  function erfc(x) {
    var z = Math.abs(x);
    var t = 1 / (1 + z / 2);
    var ans = t * Math.exp(-z * z - 1.26551223 +
      t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
      t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 +
      t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? ans : 2 - ans;
  }
  function Q(x) { return 0.5 * erfc(x / Math.SQRT2); }

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
      blue: readCss("--ee-blue", "#2f5d8a"),
      red: readCss("--ee-red", "#9a3b32"),
      green: readCss("--ee-green", "#2f6b4f"),
      amber: readCss("--ee-amber", "#b0502a"),
      cyan: readCss("--ee-cyan", "#2f6b7a"),
      grid: readCss("--ee-grid", "rgba(30,27,23,0.10)"),
      gridStrong: readCss("--ee-grid-strong", "rgba(30,27,23,0.22)"),
      band: readCss("--ee-band", "rgba(47,93,138,0.10)"),
      ok: readCss("--ee-ok", "#2f6b4f"),
      bad: readCss("--ee-bad", "#9a3b32")
    };
  }

  /* ---------------- canvas ---------------- */

  function canvas(el, drawFn) {
    if (!el) return null;
    if (el.__eeCanvas) {
      el.__eeCanvas.setDraw(drawFn);
      el.__eeCanvas.redraw();
      return el.__eeCanvas;
    }
    var ctx = el.getContext("2d");
    var last = { w: 0, h: 0 };
    var current = drawFn;

    function paint(w, h) {
      if (current) current(ctx, w, h);
    }

    function resize() {
      var rect = el.getBoundingClientRect();
      if (!rect.width) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.round(rect.width);
      var h = el.dataset.height ? parseInt(el.dataset.height, 10) : Math.round(w * 0.56);
      h = clamp(h, 180, 560);
      if (w !== last.w || h !== last.h) {
        el.style.height = h + "px";
        el.width = Math.round(w * dpr);
        el.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        last = { w: w, h: h };
      }
      paint(w, h);
    }

    var api = {
      ctx: ctx,
      resize: resize,
      redraw: resize,
      setDraw: function (fn) { current = fn; },
      size: function () { return last; }
    };
    el.__eeCanvas = api;
    resize();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () { resize(); }).observe(el);
    } else {
      window.addEventListener("resize", resize);
    }
    return api;
  }

  /* ---------------- axes ---------------- */

  function axes(ctx, box, opts) {
    var o = opts || {};
    var xmin = o.xmin === undefined ? 0 : o.xmin;
    var xmax = o.xmax === undefined ? 1 : o.xmax;
    var ymin = o.ymin === undefined ? 0 : o.ymin;
    var ymax = o.ymax === undefined ? 1 : o.ymax;
    var p = o.palette || palette();
    var pad = {
      l: o.padLeft === undefined ? 44 : o.padLeft,
      r: o.padRight === undefined ? 12 : o.padRight,
      t: o.padTop === undefined ? 10 : o.padTop,
      b: o.padBottom === undefined ? 30 : o.padBottom
    };
    var plot = {
      x: box.x + pad.l,
      y: box.y + pad.t,
      w: box.w - pad.l - pad.r,
      h: box.h - pad.t - pad.b
    };
    var sx = function (x) { return plot.x + (x - xmin) / (xmax - xmin) * plot.w; };
    var sy = function (y) { return plot.y + plot.h - (y - ymin) / (ymax - ymin) * plot.h; };

    ctx.save();
    ctx.clearRect(box.x, box.y, box.w, box.h);
    ctx.font = "10px " + (o.font || "IBM Plex Sans, system-ui, sans-serif");
    ctx.fillStyle = p.muted;
    ctx.strokeStyle = p.grid;
    ctx.lineWidth = 1;

    var i, x, y;
    var xticks = o.xticks;
    if (xticks && xticks.length) {
      xticks.forEach(function (t) {
        x = sx(t.v);
        if (x < plot.x - 1 || x > plot.x + plot.w + 1) return;
        ctx.beginPath(); ctx.moveTo(x, plot.y); ctx.lineTo(x, plot.y + plot.h); ctx.stroke();
        if (o.xtickLabels !== false) {
          ctx.textAlign = "center"; ctx.textBaseline = "top";
          ctx.fillText(t.label, x, plot.y + plot.h + 5);
        }
      });
    } else {
      var nx = o.nx || 5;
      for (i = 0; i <= nx; i++) {
        x = plot.x + plot.w * i / nx;
        ctx.beginPath(); ctx.moveTo(x, plot.y); ctx.lineTo(x, plot.y + plot.h); ctx.stroke();
        if (o.xticks !== false) {
          var xv = xmin + (xmax - xmin) * i / nx;
          ctx.textAlign = "center"; ctx.textBaseline = "top";
          ctx.fillText(fmt(xv, o.xdigits === undefined ? 2 : o.xdigits), x, plot.y + plot.h + 5);
        }
      }
    }

    var yticks = o.yticks;
    if (yticks && yticks.length) {
      yticks.forEach(function (t) {
        y = sy(t.v);
        if (y < plot.y - 1 || y > plot.y + plot.h + 1) return;
        ctx.beginPath(); ctx.moveTo(plot.x, y); ctx.lineTo(plot.x + plot.w, y); ctx.stroke();
        if (o.ytickLabels !== false) {
          ctx.textAlign = "right"; ctx.textBaseline = "middle";
          ctx.fillText(t.label, plot.x - 5, y);
        }
      });
    } else {
      var ny = o.ny || 4;
      for (i = 0; i <= ny; i++) {
        y = plot.y + plot.h - plot.h * i / ny;
        ctx.beginPath(); ctx.moveTo(plot.x, y); ctx.lineTo(plot.x + plot.w, y); ctx.stroke();
        if (o.yticks !== false) {
          var yv = ymin + (ymax - ymin) * i / ny;
          ctx.textAlign = "right"; ctx.textBaseline = "middle";
          ctx.fillText(fmt(yv, o.ydigits === undefined ? 2 : o.ydigits), plot.x - 5, y);
        }
      }
    }

    if (ymin < 0 && ymax > 0) {
      y = sy(0); ctx.strokeStyle = p.gridStrong; ctx.beginPath();
      ctx.moveTo(plot.x, y); ctx.lineTo(plot.x + plot.w, y); ctx.stroke();
    }
    if (xmin < 0 && xmax > 0) {
      x = sx(0); ctx.strokeStyle = p.gridStrong; ctx.beginPath();
      ctx.moveTo(x, plot.y); ctx.lineTo(x, plot.y + plot.h); ctx.stroke();
    }

    ctx.strokeStyle = p.ruleStrong;
    ctx.strokeRect(plot.x, plot.y, plot.w, plot.h);

    if (o.xlabel) {
      ctx.fillStyle = p.ink2; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.font = "11px " + (o.font || "IBM Plex Sans, system-ui, sans-serif");
      ctx.fillText(o.xlabel, plot.x + plot.w / 2, box.y + box.h);
    }
    if (o.ylabel) {
      ctx.save();
      ctx.translate(box.x + 10, plot.y + plot.h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = p.ink2; ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.font = "11px " + (o.font || "IBM Plex Sans, system-ui, sans-serif");
      ctx.fillText(o.ylabel, 0, 0);
      ctx.restore();
    }
    ctx.restore();
    return { plot: plot, sx: sx, sy: sy, xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax };
  }

  function niceHz(v) {
    if (v >= 1e9) return fmt(v / 1e9, 1) + "G";
    if (v >= 1e6) return fmt(v / 1e6, 1) + "M";
    if (v >= 1e3) return fmt(v / 1e3, 1) + "k";
    return fmt(v, 2);
  }

  /* Log-x axes; xmin/xmax are positive frequencies. */
  function logAxes(ctx, box, opts) {
    var o = opts || {};
    var xmin = Math.max(o.xmin || 1, 1e-9);
    var xmax = Math.max(o.xmax || 10, xmin * 1.01);
    var ymin = o.ymin === undefined ? -60 : o.ymin;
    var ymax = o.ymax === undefined ? 10 : o.ymax;
    var p = o.palette || palette();
    var pad = {
      l: o.padLeft === undefined ? 44 : o.padLeft,
      r: o.padRight === undefined ? 12 : o.padRight,
      t: o.padTop === undefined ? 10 : o.padTop,
      b: o.padBottom === undefined ? 30 : o.padBottom
    };
    var plot = {
      x: box.x + pad.l,
      y: box.y + pad.t,
      w: box.w - pad.l - pad.r,
      h: box.h - pad.t - pad.b
    };
    var lxmin = log10(xmin), lxmax = log10(xmax);
    var sx = function (f) { return plot.x + (log10(Math.max(f, 1e-12)) - lxmin) / (lxmax - lxmin) * plot.w; };
    var sy = function (y) { return plot.y + plot.h - (y - ymin) / (ymax - ymin) * plot.h; };

    ctx.save();
    ctx.clearRect(box.x, box.y, box.w, box.h);
    ctx.font = "10px " + (o.font || "IBM Plex Sans, system-ui, sans-serif");
    ctx.fillStyle = p.muted;
    ctx.strokeStyle = p.grid;
    ctx.lineWidth = 1;

    var e = Math.ceil(lxmin);
    for (; e <= Math.floor(lxmax); e++) {
      var f = Math.pow(10, e);
      var x = sx(f);
      ctx.beginPath(); ctx.moveTo(x, plot.y); ctx.lineTo(x, plot.y + plot.h); ctx.stroke();
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(e === 0 ? "1" : "10^" + e, x, plot.y + plot.h + 5);
    }

    var ny = o.ny || 4;
    for (var i = 0; i <= ny; i++) {
      var y = plot.y + plot.h - plot.h * i / ny;
      ctx.beginPath(); ctx.moveTo(plot.x, y); ctx.lineTo(plot.x + plot.w, y); ctx.stroke();
      var yv = ymin + (ymax - ymin) * i / ny;
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText(fmt(yv, o.ydigits === undefined ? 0 : o.ydigits), plot.x - 5, y);
    }

    ctx.strokeStyle = p.ruleStrong;
    ctx.strokeRect(plot.x, plot.y, plot.w, plot.h);

    if (o.xlabel) {
      ctx.fillStyle = p.ink2; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.font = "11px " + (o.font || "IBM Plex Sans, system-ui, sans-serif");
      ctx.fillText(o.xlabel, plot.x + plot.w / 2, box.y + box.h);
    }
    if (o.ylabel) {
      ctx.save();
      ctx.translate(box.x + 10, plot.y + plot.h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = p.ink2; ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.font = "11px " + (o.font || "IBM Plex Sans, system-ui, sans-serif");
      ctx.fillText(o.ylabel, 0, 0);
      ctx.restore();
    }
    ctx.restore();
    return { plot: plot, sx: sx, sy: sy, xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax };
  }

  /* ---------------- drawing primitives ---------------- */

  function line(ctx, pts, opts) {
    if (!pts || pts.length < 2) return;
    var o = opts || {};
    ctx.save();
    ctx.strokeStyle = o.color || palette().ink;
    ctx.lineWidth = o.width || 1.6;
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (o.fill) {
      ctx.fillStyle = o.fill;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      if (o.close) { ctx.closePath(); ctx.fill(); }
    }
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var j = 1; j < pts.length; j++) ctx.lineTo(pts[j][0], pts[j][1]);
    ctx.stroke();
    ctx.restore();
  }

  function dash(ctx, x1, y1, x2, y2, opts) {
    line(ctx, [[x1, y1], [x2, y2]], Object.assign({ dash: [4, 4], width: 1 }, opts || {}));
  }

  function arrow(ctx, x1, y1, x2, y2, opts) {
    var o = opts || {};
    var head = o.head || 6;
    var ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.save();
    ctx.strokeStyle = o.color || palette().ink;
    ctx.fillStyle = o.color || palette().ink;
    ctx.lineWidth = o.width || 1.4;
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(ang - 0.42), y2 - head * Math.sin(ang - 0.42));
    ctx.lineTo(x2 - head * Math.cos(ang + 0.42), y2 - head * Math.sin(ang + 0.42));
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function label(ctx, text, x, y, opts) {
    var o = opts || {};
    ctx.save();
    ctx.font = (o.weight || "500") + " " + (o.size || 11) + "px " +
      (o.font || "IBM Plex Sans, system-ui, sans-serif");
    ctx.fillStyle = o.color || palette().ink;
    ctx.textAlign = o.align || "left";
    ctx.textBaseline = o.baseline || "middle";
    if (o.background) {
      var m = ctx.measureText(text);
      ctx.fillStyle = o.background;
      ctx.fillRect(x - 2, y - (o.size || 11) - 1, m.width + 4, (o.size || 11) + 4);
      ctx.fillStyle = o.color || palette().ink;
    }
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function dot(ctx, x, y, r, opts) {
    var o = opts || {};
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r || 3, 0, Math.PI * 2);
    ctx.fillStyle = o.fill || palette().accent;
    ctx.fill();
    ctx.strokeStyle = o.stroke || palette().sheet;
    ctx.lineWidth = o.width || 1;
    ctx.stroke();
    ctx.restore();
  }

  /* ---------------- schematic primitives ---------------- */

  function wire(ctx, x1, y1, x2, y2, opts) {
    line(ctx, [[x1, y1], [x2, y2]], Object.assign({ color: palette().ink, width: 1.5 }, opts || {}));
  }

  function junction(ctx, x, y) {
    dot(ctx, x, y, 3.2, { fill: palette().ink, stroke: palette().sheet });
  }

  function resistorH(ctx, x, y, w, name, value) {
    var p = palette(), lead = Math.min(12, w * 0.2), bw = w - 2 * lead;
    wire(ctx, x, y, x + lead, y);
    wire(ctx, x + w - lead, y, x + w, y);
    ctx.save();
    ctx.fillStyle = p.sheet;
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 1.5;
    ctx.fillRect(x + lead, y - 7, bw, 14);
    ctx.strokeRect(x + lead, y - 7, bw, 14);
    ctx.restore();
    label(ctx, value ? name + " = " + value : name, x + w / 2, y - 15,
      { align: "center", size: 10, color: p.ink2 });
  }

  function resistorV(ctx, x, y, h, name, value, opts) {
    var p = palette(), lead = Math.min(12, h * 0.2), bh = h - 2 * lead;
    var o = opts || {};
    wire(ctx, x, y, x, y + lead);
    wire(ctx, x, y + h - lead, x, y + h);
    ctx.save();
    ctx.fillStyle = p.sheet;
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 1.5;
    ctx.fillRect(x - 7, y + lead, 14, bh);
    ctx.strokeRect(x - 7, y + lead, 14, bh);
    ctx.restore();
    var lx = o.side === "left" ? x - 12 : x + 12;
    label(ctx, value ? name + " = " + value : name, lx, y + h / 2,
      { size: 10, color: p.ink2, align: o.side === "left" ? "right" : "left" });
  }

  function capacitorV(ctx, x, y, name, value) {
    var p = palette();
    wire(ctx, x, y, x, y + 18);
    wire(ctx, x, y + 34, x, y + 52);
    ctx.save();
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 12, y + 20); ctx.lineTo(x + 12, y + 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 12, y + 32); ctx.lineTo(x + 12, y + 32); ctx.stroke();
    ctx.restore();
    var lx = x > 180 ? x - 18 : x + 18;
    label(ctx, value ? name + " = " + value : name, lx, y + 26,
      { size: 10, color: p.ink2, align: x > 180 ? "right" : "left" });
  }

  function sourceV(ctx, x, y, r, name, value, ac) {
    var p = palette();
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = p.sheet; ctx.fill();
    ctx.strokeStyle = p.ink; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
    label(ctx, "+", x, y - r * 0.45, { align: "center", size: 12, color: p.ink });
    label(ctx, "−", x, y + r * 0.45, { align: "center", size: 12, color: p.ink });
    if (ac) {
      ctx.save();
      ctx.strokeStyle = p.accent; ctx.lineWidth = 1.4; ctx.beginPath();
      var i;
      for (i = -10; i <= 10; i++) {
        var yy = y + 4 * Math.sin(i / 10 * Math.PI * 2);
        if (i === -10) ctx.moveTo(x + i, yy); else ctx.lineTo(x + i, yy);
      }
      ctx.stroke(); ctx.restore();
    }
    label(ctx, value ? name + " = " + value : name, x, y - r - 8,
      { align: "center", size: 10, color: p.ink2 });
  }

  function ground(ctx, x, y) {
    var p = palette();
    wire(ctx, x, y - 10, x, y);
    ctx.save();
    ctx.strokeStyle = p.ink; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x + 12, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 8, y + 5); ctx.lineTo(x + 8, y + 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 4, y + 10); ctx.lineTo(x + 4, y + 10); ctx.stroke();
    ctx.restore();
  }

  /* ---------------- controls ---------------- */

  function initLab(root, renderFn) {
    var inputs = $$("[data-param]", root);
    var readoutEl = $("[data-readout]", root);
    var statusEl = $("[data-status]", root);
    var printEl = $("[data-print]", root);
    var canvasEl = $("[data-canvas]", root);
    var gate = $("[data-gate]", root);
    var started = false;

    function state() {
      var s = {};
      inputs.forEach(function (input) {
        var v;
        if (input.type === "checkbox") v = input.checked;
        else if (input.type === "range" || input.type === "number") v = parseFloat(input.value);
        else v = input.value;
        s[input.dataset.param] = v;
      });
      return s;
    }

    function update() {
      if (!started) return;
      var s = state();
      inputs.forEach(function (input) {
        var out = $("[data-out='" + input.dataset.param + "']", root);
        if (!out) return;
        var v;
        if (input.type === "checkbox") v = input.checked ? "açık" : "kapalı";
        else if (input.type === "range" || input.type === "number") v = parseFloat(input.value);
        else v = input.value;
        out.textContent = typeof v === "number"
          ? fmt(v, input.dataset.digits ? parseInt(input.dataset.digits, 10) : 2)
          : v;
      });
      var result = renderFn(s, canvasEl, root);
      if (!result) return;
      if (readoutEl && result.readout) {
        readoutEl.innerHTML = "";
        result.readout.forEach(function (row) {
          var dl = document.createElement("dl");
          var dt = document.createElement("dt"); dt.textContent = row[0];
          var dd = document.createElement("dd"); dd.textContent = row[1];
          dl.appendChild(dt); dl.appendChild(dd); readoutEl.appendChild(dl);
        });
      }
      if (statusEl && result.status) {
        statusEl.textContent = result.status;
        statusEl.dataset.tone = result.tone || "";
      }
      if (printEl) printEl.textContent = result.print || result.status || "";
      if (canvasEl) {
        canvasEl.setAttribute("role", "img");
        canvasEl.setAttribute("aria-label", result.aria || result.status || "Etkileşimli şekil");
      }
    }

    function unlock() {
      root.dataset.gated = "false";
      inputs.forEach(function (input) { input.disabled = false; });
    }

    if (gate) {
      var answer = gate.dataset.answer;
      var why = $(".eegate__why", gate);
      root.dataset.gated = "true";
      inputs.forEach(function (input) { input.disabled = true; });
      $$(".eegate__opt", gate).forEach(function (btn) {
        btn.addEventListener("click", function () {
          var correct = btn.dataset.opt === answer;
          $$(".eegate__opt", gate).forEach(function (b) {
            b.disabled = true;
            if (b.dataset.opt === answer) b.dataset.state = "right";
          });
          if (!correct) btn.dataset.state = "wrong";
          if (why) {
            why.hidden = false;
            why.textContent = (correct ? "Doğru. " : "Değil. ") + (gate.dataset.why || "");
          }
          unlock();
          update();
        });
      });
    }

    inputs.forEach(function (input) {
      if (input.dataset.default !== undefined) {
        if (input.type === "checkbox") input.checked = input.dataset.default === "true";
        else input.value = input.dataset.default;
      }
      input.addEventListener("input", update);
      input.addEventListener("change", update);
    });

    var reset = $("[data-reset]", root);
    if (reset) {
      reset.addEventListener("click", function () {
        inputs.forEach(function (input) {
          if (input.dataset.default !== undefined) {
            if (input.type === "checkbox") input.checked = input.dataset.default === "true";
            else input.value = input.dataset.default;
          } else if (input.type === "range" || input.type === "number") {
            input.value = input.defaultValue;
          } else if (input.tagName === "SELECT") {
            input.selectedIndex = 0;
          }
        });
        update();
      });
    }

    started = true;
    update();
    return { update: update, state: state };
  }

  function readout(rows) {
    return rows.map(function (row) {
      return [row[0], row[1] + (row[2] ? " " + row[2] : "")];
    });
  }

  /* ---------------- quiz ---------------- */

  function quiz(root) {
    $$("[data-quiz]", root || document).forEach(function (box) {
      $$(".eequiz__q", box).forEach(function (q) {
        var answer = q.dataset.answer;
        var why = $(".eequiz__why", q);
        $$(".eequiz__opt", q).forEach(function (btn) {
          btn.addEventListener("click", function () {
            var correct = btn.dataset.option === answer;
            $$(".eequiz__opt", q).forEach(function (b) {
              b.disabled = true;
              if (b.dataset.option === answer) b.dataset.state = "right";
            });
            if (!correct) btn.dataset.state = "wrong";
            if (why) {
              why.hidden = false;
              why.textContent = (correct ? "Doğru. " : "Değil. ") + (q.dataset.explain || "");
            }
          });
        });
      });
    });
  }

  /* ---------------- boot ---------------- */

  var LABS = {};

  function registerLab(name, renderFn) {
    LABS[name] = renderFn;
  }

  function boot() {
    $$("[data-ee-lab]").forEach(function (root) {
      var name = root.getAttribute("data-ee-lab");
      var render = LABS[name];
      if (!render) {
        console.warn("[EE] no engine registered for lab: " + name);
        return;
      }
      initLab(root, function (s, canvasEl) {
        return render(s, canvasEl, root);
      });
    });
    if ("MutationObserver" in window) {
      new MutationObserver(function () {
        $$("canvas[data-canvas]").forEach(function (c) {
          if (c.__eeCanvas) c.__eeCanvas.redraw();
        });
      }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    }
    quiz(document);
    if (/[?&]selftest=1/.test(location.search)) runChecks();
  }

  function check(name, fn) { checks.push({ name: name, fn: fn }); }

  function runChecks() {
    var out = [];
    var ok = true;
    checks.forEach(function (c) {
      try {
        var r = c.fn();
        out.push((r === false ? "FAIL " : "PASS ") + c.name);
        if (r === false) ok = false;
      } catch (e) {
        out.push("FAIL " + c.name + ": " + e.message);
        ok = false;
      }
    });
    var text = out.join("\n");
    console.log("[EE selftest]\n" + text);
    window.__EE_SELFTEST__ = { ok: ok, results: out };
    var badge = document.createElement("div");
    badge.textContent = (ok ? "SELFTEST OK — " : "SELFTEST FAILED — ") + checks.length + " kontrol";
    badge.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:99;padding:6px 10px;" +
      "font:12px/1.4 monospace;background:" + (ok ? "#e6f3ea" : "#f7e4e0") +
      ";color:" + (ok ? "#1f5138" : "#7a241c") + ";border:1px solid " +
      (ok ? "#8fc9a9" : "#d99a88") + ";border-radius:3px;";
    document.body.appendChild(badge);
    return ok;
  }

  check("fmt: 1450 with 0 digits keeps the trailing zero", function () {
    return fmt(1450, 0) === "1450";
  });
  check("erfc(0) = 1", function () {
    return Math.abs(erfc(0) - 1) < 1e-7;
  });
  check("Q(0) = 0.5", function () {
    return Math.abs(Q(0) - 0.5) < 1e-7;
  });
  check("db(0.5) = -6.0206 dB", function () {
    return Math.abs(db(0.5) + 6.0206) < 1e-3;
  });
  check("log10(1000) = 3", function () {
    return Math.abs(log10(1000) - 3) < 1e-12;
  });

  window.EE = {
    $: $, $$: $$, clamp: clamp, fmt: fmt, fmtInt: fmtInt, pct: pct,
    db: db, log10: log10, erfc: erfc, Q: Q, linspace: linspace,
    palette: palette, canvas: canvas, axes: axes, logAxes: logAxes, niceHz: niceHz,
    line: line, dash: dash, arrow: arrow, label: label, dot: dot,
    wire: wire, resistorH: resistorH, resistorV: resistorV,
    capacitorV: capacitorV, sourceV: sourceV, ground: ground, junction: junction,
    initLab: initLab, readout: readout, quiz: quiz,
    registerLab: registerLab, labs: LABS,
    check: check, runChecks: runChecks
  };

  if (document.readyState === "loading" || document.readyState === "interactive") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
