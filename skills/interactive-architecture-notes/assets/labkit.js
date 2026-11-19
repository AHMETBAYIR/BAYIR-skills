/* ============================================================
   Interactive mechanical engineering notes — lab layer
   Vanilla JS, no dependencies, inlined by the builder.

   Public API (window.LABKIT):
     LABKIT.$ / LABKIT.$$ / LABKIT.clamp / LABKIT.fmt / LABKIT.fmtInt / LABKIT.pct
     LABKIT.palette()
     LABKIT.canvas(canvasEl, drawFn)        responsive, DPR-aware
     LABKIT.axes(ctx, box, opts)
     LABKIT.line / LABKIT.arrow / LABKIT.dim / LABKIT.hatch / LABKIT.label / LABKIT.dot
     LABKIT.plot(canvasEl, spec)            generic x-y plot
     LABKIT.initLab(root, renderFn)         bind [data-param] controls
     LABKIT.quiz(root)
     LABKIT.check(name, fn)                 selftest registration
     LABKIT.runChecks()

   A lab is declared as:

     <div class="lab" data-lab="section">
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
      tension: readCss("--lab-tension", "#2f5d8a"),
      compression: readCss("--lab-compression", "#9a3b32"),
      hot: readCss("--lab-hot", "#b0502a"),
      cold: readCss("--lab-cold", "#2f6b7a"),
      grid: readCss("--lab-grid", "rgba(30,27,23,0.10)"),
      gridStrong: readCss("--lab-grid-strong", "rgba(30,27,23,0.22)"),
      band: readCss("--lab-band", "rgba(47,93,138,0.10)"),
      ok: readCss("--lab-ok", "#2f6b4f"),
      bad: readCss("--lab-bad", "#9a3b32")
    };
  }

  /* ---------------- canvas ---------------- */

  function canvas(el, drawFn) {
    if (!el) return null;
    if (el.__labCanvas) {
      el.__labCanvas.setDraw(drawFn);
      el.__labCanvas.redraw();
      return el.__labCanvas;
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
    el.__labCanvas = api;
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
      var qs = $$(".labquiz__q", box);
      qs.forEach(function (q) {
        var answer = q.dataset.answer;
        var why = $(".labquiz__why", q);
        $$(".labquiz__opt", q).forEach(function (btn) {
          btn.addEventListener("click", function () {
            var correct = btn.dataset.option === answer;
            $$(".labquiz__opt", q).forEach(function (b) {
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

  function boot() {
    // keep the drawing in sync with theme changes
    // repaint canvases when the theme attribute changes
    if ("MutationObserver" in window) {
      new MutationObserver(function () {
        $$("canvas[data-canvas]").forEach(function (c) {
          if (c.__labCanvas) c.__labCanvas.redraw();
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
    console.log("[LABKIT selftest]\n" + text);
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

  window.LABKIT = {
    $: $, $$: $$, clamp: clamp, fmt: fmt, fmtInt: fmtInt, pct: pct,
    palette: palette, canvas: canvas, axes: axes, line: line, arrow: arrow,
    dim: dim, label: label, dot: dot, hatch: hatch, plot: plot,
    initLab: initLab, readout: readout, quiz: quiz,
    check: check, runChecks: runChecks
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
