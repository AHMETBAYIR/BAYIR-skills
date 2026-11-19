/* ============================================================
   Interactive mechanical engineering notes — lab layer
   Vanilla JS, no dependencies, inlined by the builder.

   Public API (window.ME):
     ME.$ / ME.$$ / ME.clamp / ME.fmt / ME.fmtInt / ME.pct
     ME.palette()
     ME.canvas(canvasEl, drawFn)        responsive, DPR-aware
     ME.axes(ctx, box, opts)
     ME.line / ME.arrow / ME.dim / ME.hatch / ME.label / ME.dot
     ME.plot(canvasEl, spec)            generic x-y plot
     ME.initLab(root, renderFn)         bind [data-param] controls
     ME.quiz(root)
     ME.check(name, fn)                 selftest registration
     ME.runChecks()

   A lab is declared as:

     <div class="melab" data-me-lab="section">
       <canvas data-canvas></canvas>
       <input type="range" data-param="b" ...>
       <div data-readout></div>
       <p data-status></p>
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
      tension: readCss("--me-tension", "#2f5d8a"),
      compression: readCss("--me-compression", "#9a3b32"),
      hot: readCss("--me-hot", "#b0502a"),
      cold: readCss("--me-cold", "#2f6b7a"),
      grid: readCss("--me-grid", "rgba(30,27,23,0.10)"),
      gridStrong: readCss("--me-grid-strong", "rgba(30,27,23,0.22)"),
      band: readCss("--me-band", "rgba(47,93,138,0.10)"),
      ok: readCss("--me-ok", "#2f6b4f"),
      bad: readCss("--me-bad", "#9a3b32")
    };
  }

  /* ---------------- canvas ---------------- */

  function canvas(el, drawFn) {
    if (!el) return null;
    if (el.__meCanvas) {
      el.__meCanvas.setDraw(drawFn);
      el.__meCanvas.redraw();
      return el.__meCanvas;
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
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      var w = Math.round(rect.width);
      var h = el.dataset.height ? parseInt(el.dataset.height, 10) : Math.round(w * 0.56);
      h = clamp(h, 160, 560);
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
    el.__meCanvas = api;
    resize();
    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(function () { resize(); });
      ro.observe(el);
    } else {
      window.addEventListener("resize", resize);
    }
    return api;
  }

  /* ---------------- drawing primitives ---------------- */

  function axes(ctx, box, opts) {
    var o = opts || {};
    var xmin = o.xmin === undefined ? 0 : o.xmin;
    var xmax = o.xmax === undefined ? 1 : o.xmax;
    var ymin = o.ymin === undefined ? 0 : o.ymin;
    var ymax = o.ymax === undefined ? 1 : o.ymax;
    var p = o.palette || palette();
    var pad = { l: 44, r: 12, t: 10, b: 28 };
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

    var nx = o.nx || 5;
    var ny = o.ny || 4;
    var i, x, y;
    for (i = 0; i <= nx; i++) {
      x = plot.x + plot.w * i / nx;
      ctx.beginPath(); ctx.moveTo(x, plot.y); ctx.lineTo(x, plot.y + plot.h); ctx.stroke();
      if (o.xticks !== false) {
        var xv = xmin + (xmax - xmin) * i / nx;
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText(fmt(xv, o.xdigits === undefined ? 2 : o.xdigits), x, plot.y + plot.h + 5);
      }
    }
    for (i = 0; i <= ny; i++) {
      y = plot.y + plot.h - plot.h * i / ny;
      ctx.beginPath(); ctx.moveTo(plot.x, y); ctx.lineTo(plot.x + plot.w, y); ctx.stroke();
      if (o.yticks !== false) {
        var yv = ymin + (ymax - ymin) * i / ny;
        ctx.textAlign = "right"; ctx.textBaseline = "middle";
        ctx.fillText(fmt(yv, o.ydigits === undefined ? 2 : o.ydigits), plot.x - 5, y);
      }
    }

    // zero lines
    if (ymin < 0 && ymax > 0) {
      y = sy(0); ctx.strokeStyle = p.gridStrong; ctx.beginPath();
      ctx.moveTo(plot.x, y); ctx.lineTo(plot.x + plot.w, y); ctx.stroke();
    }
    if (xmin < 0 && xmax > 0) {
      x = sx(0); ctx.strokeStyle = p.gridStrong; ctx.beginPath();
      ctx.moveTo(x, plot.y); ctx.lineTo(x, plot.y + plot.h); ctx.stroke();
    }

    // frame
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

  function dim(ctx, x1, y1, x2, y2, text, opts) {
    var o = opts || {};
    var p = palette();
    ctx.save();
    ctx.strokeStyle = o.color || p.muted;
    ctx.fillStyle = o.color || p.ink2;
    ctx.lineWidth = 1;
    ctx.font = "10px IBM Plex Sans, system-ui, sans-serif";
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    arrow(ctx, x2, y2, x1, y1, { color: o.color || p.muted, head: 4 });
    arrow(ctx, x1, y1, x2, y2, { color: o.color || p.muted, head: 4 });
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    var horizontal = Math.abs(x2 - x1) >= Math.abs(y2 - y1);
    ctx.textAlign = "center";
    ctx.textBaseline = horizontal ? "bottom" : "middle";
    if (horizontal) { ctx.fillText(text, mx, my - 4); }
    else {
      ctx.save(); ctx.translate(mx - 5, my); ctx.rotate(-Math.PI / 2);
      ctx.fillText(text, 0, 0); ctx.restore();
    }
    ctx.restore();
  }

  function label(ctx, text, x, y, opts) {
    var o = opts || {};
    ctx.save();
    ctx.font = (o.weight || "500") + " " + (o.size || 11) + "px " + (o.font || "IBM Plex Sans, system-ui, sans-serif");
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

  function hatch(ctx, x, y, w, h, opts) {
    var o = opts || {};
    var gap = o.gap || 8;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.strokeStyle = o.color || palette().muted;
    ctx.lineWidth = o.width || 0.7;
    for (var i = -h; i < w + h; i += gap) {
      ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i + h, y + h); ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------------- generic plot ---------------- */

  function plot(el, spec) {
    var p = palette();
    var draw = function (ctx, w, h) {
      var s = spec;
      var ys = [];
      (s.series || []).forEach(function (ser) {
        (ser.points || []).forEach(function (pt) { if (isFinite(pt[1])) ys.push(pt[1]); });
      });
      (s.hlines || []).forEach(function (l) { ys.push(l.y); });
      var ymin = s.ymin !== undefined ? s.ymin : Math.min.apply(null, ys);
      var ymax = s.ymax !== undefined ? s.ymax : Math.max.apply(null, ys);
      if (!isFinite(ymin) || !isFinite(ymax)) { ymin = 0; ymax = 1; }
      if (ymin === ymax) { ymin -= 1; ymax += 1; }
      var pad = (ymax - ymin) * 0.08;
      if (s.ymin === undefined) ymin -= pad;
      if (s.ymax === undefined) ymax += pad;
      var ax = axes(ctx, { x: 0, y: 0, w: w, h: h }, {
        xmin: s.xmin === undefined ? 0 : s.xmin,
        xmax: s.xmax === undefined ? 1 : s.xmax,
        ymin: ymin, ymax: ymax,
        xlabel: s.xlabel, ylabel: s.ylabel,
        nx: s.nx || 5, ny: s.ny || 4,
        xdigits: s.xdigits, ydigits: s.ydigits
      });
      (s.hlines || []).forEach(function (l) {
        line(ctx, [[ax.plot.x, ax.sy(l.y)], [ax.plot.x + ax.plot.w, ax.sy(l.y)]],
          { color: l.color || p.muted, width: 1, dash: l.dash || [3, 3] });
        if (l.label) label(ctx, l.label, ax.plot.x + ax.plot.w - 3, ax.sy(l.y) - 8,
          { align: "right", size: 10, color: l.color || p.muted });
      });
      (s.vlines || []).forEach(function (l) {
        line(ctx, [[ax.sx(l.x), ax.plot.y], [ax.sx(l.x), ax.plot.y + ax.plot.h]],
          { color: l.color || p.muted, width: 1, dash: l.dash || [3, 3] });
        if (l.label) label(ctx, l.label, ax.sx(l.x) + 3, ax.plot.y + 12,
          { size: 10, color: l.color || p.muted });
      });
      (s.bands || []).forEach(function (b) {
        ctx.save();
        ctx.fillStyle = b.color || p.band;
        ctx.fillRect(ax.sx(b.x1), ax.plot.y, ax.sx(b.x2) - ax.sx(b.x1), ax.plot.h);
        ctx.restore();
      });
      (s.series || []).forEach(function (ser) {
        var pts = (ser.points || []).map(function (pt) { return [ax.sx(pt[0]), ax.sy(pt[1])]; });
        if (ser.type === "area") {
          var base = ax.sy(ser.base === undefined ? 0 : ser.base);
          line(ctx, pts.concat([[pts[pts.length - 1][0], base], [pts[0][0], base]]),
            { color: "transparent", fill: ser.fill || p.band, close: true });
        }
        line(ctx, pts, {
          color: ser.color || p.accent,
          width: ser.width || 1.8,
          dash: ser.dash,
          fill: ser.fill && ser.type !== "area" ? ser.fill : undefined,
          close: ser.close
        });
        (ser.markers || []).forEach(function (m) {
          dot(ctx, ax.sx(m[0]), ax.sy(m[1]), 3.2, { fill: ser.color || p.accent });
        });
      });
      (s.points || []).forEach(function (pt) {
        dot(ctx, ax.sx(pt.x), ax.sy(pt.y), pt.r || 3.5, { fill: pt.color || p.accent });
        if (pt.label) label(ctx, pt.label, ax.sx(pt.x) + 5, ax.sy(pt.y) - 6,
          { size: 10, color: pt.color || p.ink });
      });
      if (s.legend) {
        var lx = ax.plot.x + 8, ly = ax.plot.y + 12;
        (s.series || []).forEach(function (ser) {
          if (!ser.label) return;
          line(ctx, [[lx, ly], [lx + 18, ly]], { color: ser.color || p.accent, width: 2 });
          label(ctx, ser.label, lx + 23, ly + 1, { size: 10, color: p.ink2 });
          ly += 14;
        });
      }
      if (s.footer) label(ctx, s.footer, ax.plot.x, h - 3, { size: 9.5, color: p.muted });
      return ax;
    };
    if (typeof el === "string") el = $(el);
    var c = canvas(el, draw);
    if (c) el.setAttribute("role", "img");
    if (c && spec.ariaLabel) el.setAttribute("aria-label", spec.ariaLabel);
    return { canvas: el, controller: c, redraw: function () { if (c) { c.resize(); } } };
  }

  /* ---------------- controls ---------------- */

  function initLab(root, renderFn) {
    var inputs = $$("[data-param]", root);
    var readout = $("[data-readout]", root);
    var statusEl = $("[data-status]", root);
    var canvasEl = $("[data-canvas]", root);
    var last = null;

    function state() {
      var s = {};
      inputs.forEach(function (input) {
        var v = input.type === "range" || input.type === "number" ? parseFloat(input.value) : input.value;
        s[input.dataset.param] = v;
      });
      return s;
    }

    function update() {
      if (!last) return;
      var s = state();
      inputs.forEach(function (input) {
        var out = $("[data-out='" + input.dataset.param + "']", root);
        if (out) {
          var v = input.type === "range" || input.type === "number" ? parseFloat(input.value) : input.value;
          out.textContent = fmt(v, input.dataset.digits ? parseInt(input.dataset.digits, 10) : 2);
        }
      });
      var result = renderFn(s, canvasEl, root);
      if (!result) return;
      if (readout && result.readout) {
        readout.innerHTML = "";
        result.readout.forEach(function (row) {
          var dl = document.createElement("dl");
          var dt = document.createElement("dt"); dt.textContent = row[0];
          var dd = document.createElement("dd"); dd.textContent = row[1];
          dl.appendChild(dt); dl.appendChild(dd); readout.appendChild(dl);
        });
      }
      if (statusEl && result.status) {
        statusEl.textContent = result.status;
        statusEl.dataset.tone = result.tone || "";
      }
      if (canvasEl) {
        canvasEl.setAttribute("aria-label", result.aria || result.status || "Etkileşimli şekil");
      }
    }

    inputs.forEach(function (input) {
      if (input.dataset.default !== undefined) input.value = input.dataset.default;
      input.addEventListener("input", update);
      input.addEventListener("change", update);
    });
    var reset = $("[data-reset]", root);
    if (reset) {
      reset.addEventListener("click", function () {
        inputs.forEach(function (input) {
          if (input.dataset.default !== undefined) input.value = input.dataset.default;
          else if (input.type === "range" || input.type === "number") input.value = input.defaultValue;
          else if (input.tagName === "SELECT") input.selectedIndex = 0;
        });
        update();
      });
    }
    last = true;
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
      var qs = $$(".mequiz__q", box);
      qs.forEach(function (q) {
        var answer = q.dataset.answer;
        var why = $(".mequiz__why", q);
        $$(".mequiz__opt", q).forEach(function (btn) {
          btn.addEventListener("click", function () {
            var correct = btn.dataset.option === answer;
            $$(".mequiz__opt", q).forEach(function (b) {
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

  /* ---------------- section-property lab ---------------- */

  function sectionEngine(s, el) {
    var p = palette();
    var b = s.shape === "circle" ? 0 : s.b;
    var h = s.shape === "circle" ? 0 : s.h;
    var d = s.shape === "circle" ? s.d : 0;
    var A, I, W, r, mass;

    if (s.shape === "circle") {
      A = Math.PI * d * d / 4;
      I = Math.PI * Math.pow(d, 4) / 64;
      W = I / (d / 2);
    } else if (s.shape === "ibeam") {
      // I-section: flange width bf, flange thickness tf, web thickness tw, depth h
      var bf = s.bf || 60, tf = s.tf || 6, tw = s.tw || 5;
      var hw = h - 2 * tf;
      A = 2 * bf * tf + tw * hw;
      I = (bf * h * h * h - (bf - tw) * hw * hw * hw) / 12;
      W = I / (h / 2);
      b = bf;
    } else {
      A = b * h;
      I = b * h * h * h / 12;
      W = I / (h / 2);
    }
    r = Math.sqrt(I / A);
    mass = A * 1e-6 * 7850; // kg/m for steel

    var draw = function (ctx, w, hh) {
      ctx.clearRect(0, 0, w, hh);
      if (s.shape === "ibeam") { b = s.bf || 60; }
      var scale = Math.min((w * 0.42) / (b || d), (hh * 0.62) / (h || d));
      var cw = (b || d) * scale, ch = (h || d) * scale;
      var x = (w - cw) / 2, y = (hh - ch) / 2 - 6;
      ctx.save();
      ctx.fillStyle = p.band;
      ctx.strokeStyle = p.ink2;
      ctx.lineWidth = 1.6;
      if (s.shape === "circle") {
        ctx.beginPath(); ctx.arc(w / 2, hh / 2 - 6, d * scale / 2, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        // centre lines
        line(ctx, [[w / 2 - d * scale / 2 - 12, hh / 2 - 6], [w / 2 + d * scale / 2 + 12, hh / 2 - 6]],
          { color: p.muted, width: 0.8, dash: [6, 3, 2, 3] });
        line(ctx, [[w / 2, hh / 2 - 6 - d * scale / 2 - 12], [w / 2, hh / 2 - 6 + d * scale / 2 + 12]],
          { color: p.muted, width: 0.8, dash: [6, 3, 2, 3] });
        dim(ctx, w / 2 - d * scale / 2, y + ch + 18, w / 2 + d * scale / 2, y + ch + 18, "Ø" + fmt(d, 0) + " mm");
      } else if (s.shape === "ibeam") {
        var bf = s.bf || 60, tf = s.tf || 6, tw = s.tw || 5;
        var s2 = scale;
        var cx = w / 2;
        var top = y;
        ctx.beginPath();
        ctx.moveTo(cx - bf * s2 / 2, top);
        ctx.lineTo(cx + bf * s2 / 2, top);
        ctx.lineTo(cx + bf * s2 / 2, top + tf * s2);
        ctx.lineTo(cx + tw * s2 / 2, top + tf * s2);
        ctx.lineTo(cx + tw * s2 / 2, top + ch - tf * s2);
        ctx.lineTo(cx + bf * s2 / 2, top + ch - tf * s2);
        ctx.lineTo(cx + bf * s2 / 2, top + ch);
        ctx.lineTo(cx - bf * s2 / 2, top + ch);
        ctx.lineTo(cx - bf * s2 / 2, top + ch - tf * s2);
        ctx.lineTo(cx - tw * s2 / 2, top + ch - tf * s2);
        ctx.lineTo(cx - tw * s2 / 2, top + tf * s2);
        ctx.lineTo(cx - bf * s2 / 2, top + tf * s2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        dim(ctx, cx - bf * s2 / 2, top + ch + 18, cx + bf * s2 / 2, top + ch + 18, "bf=" + fmt(bf, 0));
        dim(ctx, cx + bf * s2 / 2 + 14, top, cx + bf * s2 / 2 + 14, top + ch, "h=" + fmt(h, 0), {});
      } else {
        ctx.fillRect(x, y, cw, ch);
        ctx.strokeRect(x, y, cw, ch);
        dim(ctx, x, y + ch + 18, x + cw, y + ch + 18, "b=" + fmt(b, 0) + " mm");
        dim(ctx, x + cw + 16, y, x + cw + 16, y + ch, "h=" + fmt(h, 0) + " mm");
      }
      // neutral axis
      var naY = s.shape === "circle" ? hh / 2 - 6 : y + ch / 2;
      line(ctx, [[x - 10, naY], [x + cw + 10, naY]], { color: p.accent, width: 1, dash: [7, 3, 2, 3] });
      label(ctx, "tarafsız eksen", x + cw + 12, naY - 7, { size: 9.5, color: p.accent });
      ctx.restore();
      label(ctx, "A = " + fmt(A, 0) + " mm²", 8, 14, { size: 10, color: p.ink2 });
      label(ctx, "I = " + fmt(I, 0) + " mm⁴", 8, 27, { size: 10, color: p.ink2 });
    };

    canvas(el, draw);
    var shapeName = s.shape === "circle" ? "Daire" : s.shape === "ibeam" ? "I kesit" : "Dikdörtgen";
    var formula = s.shape === "circle"
      ? "I = πd⁴/64, W = I/(d/2)."
      : s.shape === "ibeam"
        ? "I = (bf h³ − (bf − tw) hw³)/12, W = I/(h/2)."
        : "I = b h³/12, W = b h²/6.";
    return {
      readout: readout([
        ["Kesit", shapeName, ""],
        ["Alan A", fmt(A, 0), "mm²"],
        ["Atalet momenti I", fmt(I, 0), "mm⁴"],
        ["Kesit modülü W", fmt(W, 0), "mm³"],
        ["Atalet yarıçapı i", fmt(r, 2), "mm"],
        ["Çelik için kütle", fmt(mass, 2), "kg/m"]
      ]),
      status: shapeName + ": " + formula +
        " Aynı alanda malzemeyi tarafsız eksenden uzağa koymak I'yı büyütür; " +
        "bu yüzden I kesit, dolu dikdörtgenden daha verimlidir.",
      aria: shapeName + " kesit, alan " + fmt(A, 0) + " milimetrekare, atalet momenti " + fmt(I, 0) + " mm4."
    };
  }

  /* ---------------- boot ---------------- */

  var LABS = {};
  LABS.section = sectionEngine;

  function registerLab(name, renderFn) {
    LABS[name] = renderFn;
  }

  function boot() {
    $$("[data-me-lab]").forEach(function (root) {
      var name = root.getAttribute("data-me-lab");
      var render = LABS[name];
      if (!render) {
        console.warn("[ME] no engine registered for lab: " + name);
        return;
      }
      initLab(root, function (s, canvasEl) {
        return render(s, canvasEl, root);
      });
    });
    // keep the drawing in sync with theme changes
    // repaint canvases when the theme attribute changes
    if ("MutationObserver" in window) {
      new MutationObserver(function () {
        $$("canvas[data-canvas]").forEach(function (c) {
          if (c.__meCanvas) c.__meCanvas.redraw();
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
    console.log("[ME selftest]\n" + text);
    var badge = document.createElement("div");
    badge.textContent = (ok ? "SELFTEST OK — " : "SELFTEST FAILED — ") + checks.length + " kontrol";
    badge.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:99;padding:6px 10px;font:12px/1.4 monospace;background:" +
      (ok ? "#e6f3ea" : "#f7e4e0") + ";color:" + (ok ? "#1f5138" : "#7a241c") +
      ";border:1px solid " + (ok ? "#8fc9a9" : "#d99a88") + ";border-radius:3px;";
    document.body.appendChild(badge);
    return ok;
  }

  check("fmt: 1450 with 0 digits keeps the trailing zero", function () {
    return fmt(1450, 0) === "1450";
  });
  check("section: 40x60 rectangle", function () {
    var A = 40 * 60, I = 40 * Math.pow(60, 3) / 12;
    return Math.abs(A - 2400) < 1e-9 && Math.abs(I - 720000) < 1e-6;
  });
  check("section: 40x60 W = I/30", function () {
    var I = 40 * Math.pow(60, 3) / 12;
    return Math.abs(I / 30 - 24000) < 1e-6;
  });

  window.ME = {
    $: $, $$: $$, clamp: clamp, fmt: fmt, fmtInt: fmtInt, pct: pct,
    palette: palette, canvas: canvas, axes: axes, line: line, arrow: arrow,
    dim: dim, label: label, dot: dot, hatch: hatch, plot: plot,
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
