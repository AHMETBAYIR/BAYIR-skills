/* ============================================================
   Interactive materials science notes — lab engines
   Vanilla JS, no dependencies, one file, inlined by the builder.

   A lab is declared as:

     <div class="mbglab" data-mbg-lab="phase">
       ... <canvas data-canvas></canvas> ...
       <script type="application/json" class="mbglab-config">
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
      alpha: readCss("--mbg-alpha", "#2f5d8a"),
      beta: readCss("--mbg-beta", "#9a3b32"),
      liquid: readCss("--mbg-liquid", "#b07a2a"),
      grid: readCss("--mbg-grid", "rgba(30,27,23,0.10)"),
      gridStrong: readCss("--mbg-grid-strong", "rgba(30,27,23,0.22)"),
      atomA: readCss("--mbg-atom-a", "#6f93b8"),
      atomB: readCss("--mbg-atom-b", "#c07a6a"),
      atomEdge: readCss("--mbg-atom-edge", "rgba(30,27,23,0.35)")
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
    wrap.className = "mbgfield";
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
    wrap.className = "mbgfield";
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
    button.className = "mbgbtn";
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
    button.className = "mbgbtn" + (opts.ghost ? " mbgbtn--ghost" : "");
    button.textContent = opts.label;
    button.addEventListener("click", function () { if (opts.onClick) opts.onClick(); });
    controls.appendChild(button);
    return button;
  }

  function readConfig(root) {
    var el = $("script.mbglab-config", root);
    if (!el) return {};
    try {
      return JSON.parse(el.textContent);
    } catch (err) {
      setStatus(root, "This lab has an invalid JSON config.");
      console.error("Invalid mbglab-config", err);
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
     Interactive molecular biology & genetics notes — lab engines
     Vanilla JS. No dependencies. One file.
     ============================================================ */

  var LAB = {};

  /* ---------------- sequence primitives ---------------- */

  var BASES = "TCAG";
  var AA_STD = "FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG";
  var CODON = {};
  (function () {
    for (var i = 0; i < 64; i += 1) {
      var b1 = BASES[Math.floor(i / 16)];
      var b2 = BASES[Math.floor(i / 4) % 4];
      var b3 = BASES[i % 4];
      CODON[b1 + b2 + b3] = AA_STD[i];
    }
  })();

  function aaFor(codon, code) {
    if (code === "mito") {
      if (codon === "TGA") return "W";
      if (codon === "ATA") return "M";
      if (codon === "AGA" || codon === "AGG") return "*";
    }
    return CODON[codon] || "X";
  }

  function revcomp(seq) {
    var map = { A: "T", T: "A", C: "G", G: "C", N: "N" };
    var out = "";
    for (var i = seq.length - 1; i >= 0; i -= 1) out += map[seq[i]] || "N";
    return out;
  }

  function gc(seq) {
    var n = 0;
    for (var i = 0; i < seq.length; i += 1) if (seq[i] === "G" || seq[i] === "C") n += 1;
    return seq.length ? n / seq.length : 0;
  }

  function translate(seq, frame, code) {
    var pep = "", stops = 0;
    for (var i = frame; i + 3 <= seq.length; i += 3) {
      var aa = aaFor(seq.substr(i, 3), code);
      pep += aa;
      if (aa === "*") stops += 1;
    }
    return { peptide: pep, stops: stops };
  }

  function addText(controls, opts) {
    var wrap = document.createElement("label");
    wrap.className = "mbgfield";
    wrap.style.minWidth = opts.wide ? "100%" : "14rem";
    var lab = document.createElement("span");
    lab.textContent = opts.label;
    wrap.appendChild(lab);
    var input = document.createElement("input");
    input.type = "text";
    input.value = opts.value || "";
    input.spellcheck = false;
    input.autocomplete = "off";
    input.style.font = '500 0.76rem/1.3 "IBM Plex Mono", ui-monospace, monospace';
    input.style.padding = "0.35rem 0.4rem";
    input.style.border = "1px solid var(--rule-strong)";
    input.style.borderRadius = "var(--radius)";
    input.style.background = "var(--sheet)";
    input.style.color = "var(--ink)";
    input.style.width = "100%";
    input.addEventListener("input", function () {
      var clean = input.value.toUpperCase().replace(/[^ACGTN]/g, "");
      if (clean !== input.value.toUpperCase()) input.value = clean;
      if (opts.onInput) opts.onInput(clean);
    });
    wrap.appendChild(input);
    controls.appendChild(wrap);
    return input;
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a += 0x6D2B79F5;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
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
    ticks(xmin, xmax, opts.xTicks || 5).forEach(function (v) {
      var px = box.x + (v - xmin) / (xmax - xmin) * box.w;
      ctx.beginPath(); ctx.moveTo(px, box.y); ctx.lineTo(px, box.y + box.h); ctx.stroke();
    });
    ticks(ymin, ymax, opts.yTicks || 5).forEach(function (v) {
      var py = box.y + box.h - (v - ymin) / (ymax - ymin) * box.h;
      ctx.beginPath(); ctx.moveTo(box.x, py); ctx.lineTo(box.x + box.w, py); ctx.stroke();
    });
    ctx.restore();
    label(ctx, opts.xLabel || "", box.x + box.w / 2, box.y + box.h + 26, pal.muted, 11, "center");
    ctx.save();
    ctx.translate(box.x - 38, box.y + box.h / 2);
    ctx.rotate(-Math.PI / 2);
    label(ctx, opts.yLabel || "", 0, 0, pal.muted, 11, "center");
    ctx.restore();
  }

  function plot(box, xmin, xmax, ymin, ymax, x, y) {
    return {
      x: box.x + (x - xmin) / (xmax - xmin) * box.w,
      y: box.y + box.h - (y - ymin) / (ymax - ymin) * box.h
    };
  }

  /* ============================================================
     1. Replication fork simulator
     ============================================================ */

  LAB.replication = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var state = { G: 3.1, N: 50000, v: 1.5, okazaki: 150, mu: 1e-9, frac: 0.5 };

    function model() {
      var genomeNt = state.G * 1e9;
      var minutes = genomeNt / (2 * state.v * 1000 * state.N);
      return {
        genomeNt: genomeNt,
        minutes: minutes,
        forks: 2 * state.N,
        fragments: genomeNt / state.okazaki,
        errors: genomeNt * state.mu,
        totalRate: 2 * state.N * state.v
      };
    }

    function draw() {
      var c = setupCanvas(canvas, 340);
      var ctx = c.ctx, w = c.w, h = c.h, pal = palette();
      var m = model();
      var x0 = 40, x1 = w - 24, y = 88;
      var barH = 26;
      var f = state.frac;

      label(ctx, "genome · " + state.G.toFixed(2) + " Gb · " + fmtInt(state.N) + " origins", x0, 34, pal.ink, 12, "left", "alphabetic", 600);
      ctx.save();
      ctx.fillStyle = pal.rule;
      ctx.fillRect(x0, y, x1 - x0, barH);
      ctx.restore();

      var shown = Math.min(state.N, 24);
      for (var i = 0; i < shown; i += 1) {
        var cx = x0 + (x1 - x0) * (i + 0.5) / shown;
        var reach = Math.min((x1 - x0) / shown * f / 2, (x1 - x0) / shown / 2);
        ctx.save();
        ctx.fillStyle = pal.accentSoft;
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 1;
        var rx = cx - reach, rw = 2 * reach;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(rx, y + 4, rw, barH - 8, 6); else ctx.rect(rx, y + 4, rw, barH - 8);
        ctx.fill(); ctx.stroke();
        ctx.restore();
        // forks
        if (f > 0.02) {
          dot(ctx, cx - reach, y + barH / 2, 2.6, pal.accent);
          dot(ctx, cx + reach, y + barH / 2, 2.6, pal.accent);
        }
      }
      label(ctx, "origin", x0 + 4, y - 8, pal.muted, 10);
      label(ctx, "bidirectional forks", x1, y - 8, pal.muted, 10, "right");

      // time bar
      var ty = y + barH + 46;
      ctx.save();
      ctx.fillStyle = pal.rule;
      ctx.fillRect(x0, ty, x1 - x0, 8);
      ctx.fillStyle = pal.accent;
      ctx.fillRect(x0, ty, (x1 - x0) * f, 8);
      ctx.restore();
      label(ctx, "t = " + fmt(f * m.minutes, 1) + " min", x0, ty + 26, pal.ink2, 11);
      label(ctx, "T_total = " + fmt(m.minutes, 1) + " min", x1, ty + 26, pal.muted, 11, "right");

      var oneOrigin = m.minutes * state.N;
      label(ctx, "One origin: " + fmt(oneOrigin, 0) + " min ≈ " + fmt(oneOrigin / 525600, 1) + " years.", x0, ty + 50, pal.muted, 11);

      setReadout(root, [
        ["Genome", state.G.toFixed(2) + " Gb"],
        ["Origins", fmtInt(state.N)],
        ["Fork speed", state.v.toFixed(1) + " kb/min"],
        ["Forks", fmtInt(m.forks)],
        ["Replication time", fmt(m.minutes, 1) + " min"],
        ["Okazaki fragments", fmt(m.fragments / 1e6, 1) + " million"],
        ["Expected errors", fmt(m.errors, 0) + " per genome"]
      ]);
      var status = "T = G / (2 v N). The factor 2 is two forks per origin. Errors use the replication fidelity μ, not the germline mutation rate.";
      if (state.frac >= 0.999) status = "Replication is complete. " + fmt(m.fragments / 1e6, 1) + " million Okazaki fragments were ligated.";
      setStatus(root, status);
      setAria(canvas, "Replication bubbles at " + Math.round(f * 100) + " percent of the cycle; total time " + m.minutes.toFixed(1) + " minutes.");
    }

    addRange(controls, {
      label: "Genome size", min: 0.05, max: 3.2, step: 0.05, value: state.G,
      format: function (v) { return v.toFixed(2) + " Gb"; },
      onInput: function (v) { state.G = v; draw(); }
    });
    addRange(controls, {
      label: "Active origins", min: 0, max: 100, step: 1, value: 100 * Math.log10(state.N) / 5,
      format: function (v) { return fmtInt(Math.round(Math.pow(10, v / 20) / 100) * 100); },
      onInput: function (v) { state.N = Math.round(Math.pow(10, v / 20) / 100) * 100; draw(); }
    });
    addRange(controls, {
      label: "Fork speed", min: 0.5, max: 5, step: 0.1, value: state.v,
      format: function (v) { return v.toFixed(1) + " kb/min"; },
      onInput: function (v) { state.v = v; draw(); }
    });
    addRange(controls, {
      label: "Okazaki length", min: 100, max: 300, step: 10, value: state.okazaki,
      format: function (v) { return v.toFixed(0) + " nt"; },
      onInput: function (v) { state.okazaki = v; draw(); }
    });
    addRange(controls, {
      label: "Progress", min: 0, max: 100, step: 1, value: 50,
      format: function (v) { return v.toFixed(0) + "%"; },
      onInput: function (v) { state.frac = v / 100; draw(); }
    });
    addHint(root, "Human replication uses tens of thousands of origins. Set origins to 1 and the same genome takes years — that is the point of origin licensing.");
    LAB_RENDERS.push(draw);
    draw();
  };

  /* ============================================================
     2. Splicing and NMD
     ============================================================ */

  LAB.splicing = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var state = { mode: "normal", strength: 80 };

    function repeat(s, n) { var out = ""; for (var i = 0; i < n; i += 1) out += s; return out; }
    function geneParts() {
      return {
        ex1: "ATG" + repeat("GCT", 39),
        in1: "TAA" + repeat("CAG", 265) + "TT",
        ex2: repeat("GCT", 30),
        in2: "TAA" + repeat("CAG", 199),
        ex3: repeat("GCT", 49) + "TAA"
      };
    }

    function splice() {
      var g = geneParts();
      var mrna, junction, labelText;
      if (state.mode === "skip2") {
        mrna = g.ex1 + g.ex3;
        junction = g.ex1.length;
        labelText = "Exon 2 skipped";
      } else if (state.mode === "retain1") {
        mrna = g.ex1 + g.in1 + g.ex2 + g.ex3;
        junction = g.ex1.length + g.in1.length + g.ex2.length;
        labelText = "Intron 1 retained";
      } else if (state.mode === "alt3") {
        mrna = g.ex1 + g.ex2.slice(30) + g.ex3;
        junction = g.ex1.length + g.ex2.length - 30;
        labelText = "Alternative 3′ site (−30 nt)";
      } else {
        mrna = g.ex1 + g.ex2 + g.ex3;
        junction = g.ex1.length + g.ex2.length;
        labelText = "Canonical splice";
      }
      var tr = translate(mrna, 0, "std");
      var stopNt = tr.peptide.indexOf("*");
      var stopPos = stopNt >= 0 ? stopNt * 3 + 3 : null;
      var nmd = stopPos !== null && stopPos < junction - 55;
      return {
        mrna: mrna, len: mrna.length, peptide: tr.peptide, aa: stopNt >= 0 ? stopNt : tr.peptide.length,
        stopPos: stopPos, junction: junction, nmd: nmd, labelText: labelText,
        pIncl: 1 / (1 + Math.exp(-(state.strength - 50) / 10))
      };
    }

    function draw() {
      var c = setupCanvas(canvas, 380);
      var ctx = c.ctx, w = c.w, h = c.h, pal = palette();
      var s = splice();
      var x0 = 34, x1 = w - 24, y = 62;
      var total = 120 + 800 + 90 + 600 + 150;
      var scale = (x1 - x0) / total;

      label(ctx, s.labelText, x0, 30, pal.ink, 12, "left", "alphabetic", 600);
      // DNA map
      function seg(start, len, color, text) {
        var px = x0 + start * scale;
        var pw = Math.max(3, len * scale);
        ctx.save();
        ctx.fillStyle = color;
        ctx.fillRect(px, y, pw, 30);
        ctx.strokeStyle = pal.sheet;
        ctx.lineWidth = 1;
        ctx.strokeRect(px, y, pw, 30);
        ctx.restore();
        if (pw > 34) label(ctx, text, px + pw / 2, y + 20, pal.sheet, 10, "center", "alphabetic", 600);
        return { x: px, w: pw };
      }
      var pos = 0;
      var e1 = seg(pos, 120, pal.def, "E1"); pos += 120;
      var i1 = seg(pos, 800, pal.ruleStrong, "intron 1"); pos += 800;
      var e2 = seg(pos, 90, pal.def, "E2"); pos += 90;
      var i2 = seg(pos, 600, pal.ruleStrong, "intron 2"); pos += 600;
      var e3 = seg(pos, 150, pal.def, "E3"); pos += 150;

      // splice arcs
      function arc(a, b, color, dash) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.6;
        if (dash) ctx.setLineDash(dash);
        ctx.beginPath();
        ctx.moveTo(a, y + 32);
        ctx.bezierCurveTo(a, y + 62, b, y + 62, b, y + 32);
        ctx.stroke();
        ctx.restore();
      }
      if (state.mode === "skip2") {
        arc(e1.x + e1.w, y, pal.accent, null);
        ctx.save(); ctx.strokeStyle = pal.accent; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(e2.x, y - 8); ctx.lineTo(e2.x + e2.w, y - 8); ctx.stroke(); ctx.restore();
        label(ctx, "skipped", e2.x + e2.w / 2, y - 14, pal.accent, 9, "center");
      } else if (state.mode === "retain1") {
        arc(e1.x + e1.w, i1.x + i1.w, pal.accent, null);
      } else if (state.mode === "alt3") {
        arc(e1.x + e1.w, i1.x + i1.w, pal.accent, null);
        label(ctx, "−30 nt", e2.x + 6, y - 10, pal.accent, 9);
      } else {
        arc(e1.x + e1.w, i1.x + i1.w, pal.accent, null);
        arc(e2.x + e2.w, i2.x + i2.w, pal.accent, null);
      }

      // mRNA
      var my = 196;
      label(ctx, "mature mRNA · " + s.len + " nt", x0, my - 12, pal.ink2, 11);
      ctx.save();
      ctx.fillStyle = pal.accentSoft;
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 1.2;
      ctx.fillRect(x0, my, Math.min(x1 - x0, s.len * 0.55), 22);
      ctx.strokeRect(x0, my, Math.min(x1 - x0, s.len * 0.55), 22);
      ctx.restore();
      // stop marker
      if (s.stopPos) {
        var sx = x0 + Math.min(x1 - x0, s.stopPos * 0.55);
        ctx.save(); ctx.strokeStyle = pal.beta; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sx, my - 6); ctx.lineTo(sx, my + 28); ctx.stroke(); ctx.restore();
        label(ctx, "*", sx + 4, my + 16, pal.beta, 14, "left", "alphabetic", 700);
      }
      var jx = x0 + Math.min(x1 - x0, s.junction * 0.55);
      line(ctx, jx, my + 30, jx, my + 48, pal.ruleStrong, 1, [3, 3]);
      label(ctx, "last junction", jx, my + 62, pal.muted, 9, "center");

      setReadout(root, [
        ["mRNA length", s.len + " nt"],
        ["Protein", s.aa + " aa"],
        ["First stop at", s.stopPos ? s.stopPos + " nt" : "no stop"],
        ["Last junction", s.junction + " nt"],
        ["NMD predicted", s.nmd ? "yes — PTC > 55 nt upstream" : "no"],
        ["Exon inclusion p", fmt(s.pIncl, 2)]
      ]);
      setStatus(root, s.nmd
        ? "The premature stop sits more than 55 nt upstream of the last exon–exon junction, so the transcript is a candidate for nonsense-mediated decay."
        : "The stop is in the last exon (or absent), so NMD is not predicted by the 50–55 nt rule. The rule is a heuristic, not a guarantee.");
      setAria(canvas, "Splice map with " + s.len + " nucleotide mRNA and a " + s.aa + " amino acid ORF.");
    }

    addSelect(controls, {
      label: "Isoform", value: state.mode,
      options: [
        { value: "normal", label: "Canonical" },
        { value: "skip2", label: "Exon 2 skipped" },
        { value: "retain1", label: "Intron 1 retained" },
        { value: "alt3", label: "Alternative 3′ site" }
      ],
      onChange: function (v) { state.mode = v; draw(); }
    });
    addRange(controls, {
      label: "5′ site strength", min: 0, max: 100, step: 1, value: state.strength,
      format: function (v) { return v.toFixed(0) + " / 100"; },
      onInput: function (v) { state.strength = v; draw(); }
    });
    addHint(root, "The sequence is synthetic but the reading frames are real: exon lengths are multiples of three, the introns carry in-frame stops, and NMD uses the 50–55 nt rule.");
    LAB_RENDERS.push(draw);
    draw();
  };

  /* ============================================================
     3. Codon table and reading frames
     ============================================================ */

  LAB.codon = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var state = { seq: "ATGGCTGAATTCGATCGTTAA", frame: 0, code: "std" };

    function draw() {
      var c = setupCanvas(canvas, 420);
      var ctx = c.ctx, w = c.w, h = c.h, pal = palette();
      var cols = 8, rows = 8;
      var cellW = (w - 28) / cols, cellH = (h - 40) / rows;
      var used = {};
      for (var i = state.frame; i + 3 <= state.seq.length; i += 3) used[state.seq.substr(i, 3)] = (used[state.seq.substr(i, 3)] || 0) + 1;

      var index = 0;
      for (var r = 0; r < rows; r += 1) {
        for (var col = 0; col < cols; col += 1) {
          var b1 = BASES[Math.floor(index / 16)];
          var b2 = BASES[Math.floor(index / 4) % 4];
          var b3 = BASES[index % 4];
          var codon = b1 + b2 + b3;
          var aa = aaFor(codon, state.code);
          var x = 14 + col * cellW, y = 18 + r * cellH;
          ctx.save();
          var prop = aa === "*" ? pal.accentSoft : /[LIVMFW]/.test(aa) ? "rgba(47,93,138,0.10)" : /[KRH]/.test(aa) ? "rgba(154,59,50,0.10)" : "rgba(47,107,79,0.08)";
          ctx.fillStyle = used[codon] ? pal.accentSoft : prop;
          ctx.fillRect(x, y, cellW - 2, cellH - 2);
          ctx.strokeStyle = used[codon] ? pal.accent : pal.rule;
          ctx.lineWidth = used[codon] ? 1.6 : 0.7;
          ctx.strokeRect(x, y, cellW - 2, cellH - 2);
          ctx.restore();
          label(ctx, codon, x + (cellW - 2) / 2, y + cellH * 0.46, used[codon] ? pal.accent : pal.ink2, Math.max(8, cellW * 0.17), "center", "middle", 600);
          label(ctx, aa, x + (cellW - 2) / 2, y + cellH * 0.80, aa === "*" ? pal.accent : pal.muted, Math.max(8, cellW * 0.16), "center", "middle");
          index += 1;
        }
      }
      label(ctx, "first base → rows · second base → columns · third base → cell order T,C,A,G", 14, h - 8, pal.muted, 10);

      var tr = translate(state.seq, state.frame, state.code);
      setReadout(root, [
        ["Sequence", state.seq.length + " nt"],
        ["GC content", fmt(gc(state.seq) * 100, 1) + "%"],
        ["Frame", (state.frame + 1) + " / 3"],
        ["Peptide", tr.peptide || "—"],
        ["Stop codons", String(tr.stops)],
        ["Codons used", String(Object.keys(used).length) + " / 64"]
      ]);
      setStatus(root, "The code is degenerate but not ambiguous: one codon maps to one amino acid, while most amino acids have several codons. Frame 1 is not biologically privileged by the table.");
      setAria(canvas, "Codon table with " + Object.keys(used).length + " codons highlighted for reading frame " + (state.frame + 1) + ".");
    }

    addText(controls, {
      label: "DNA sequence (5′→3′)", value: state.seq, wide: true,
      onInput: function (v) { state.seq = v.slice(0, 90) || "ATG"; draw(); }
    });
    addSelect(controls, {
      label: "Reading frame", value: state.frame,
      options: [{ value: 0, label: "Frame 1" }, { value: 1, label: "Frame 2" }, { value: 2, label: "Frame 3" }],
      onChange: function (v) { state.frame = Number(v); draw(); }
    });
    addSelect(controls, {
      label: "Genetic code", value: state.code,
      options: [{ value: "std", label: "Standard" }, { value: "mito", label: "Vertebrate mitochondrial" }],
      onChange: function (v) { state.code = v; draw(); }
    });
    addHint(root, "Mitochondrial code: TGA = Trp, ATA = Met, AGA/AGG = stop. The differences are real; do not silently use the standard table.");
    LAB_RENDERS.push(draw);
    draw();
  };

  /* ============================================================
     4. lac operon logic
     ============================================================ */

  LAB.operon = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var state = { lac: 0, glc: 10 };

    function model() {
      var Kl = 1, Kg = 2, n = 2;
      var rep = Math.pow(state.lac, n) / (Math.pow(Kl, n) + Math.pow(state.lac, n));
      var cap = 1 / (1 + Math.pow(state.glc / Kg, 2));
      var rate = 2 + 98 * rep * cap;
      return { rep: rep, cap: cap, rate: rate };
    }

    function draw() {
      var c = setupCanvas(canvas, 340);
      var ctx = c.ctx, w = c.w, h = c.h, pal = palette();
      var m = model();
      var y = 90;
      var x0 = 40, x1 = w - 30;

      // DNA
      line(ctx, x0, y + 60, x1, y + 60, pal.ink2, 4);
      function box(x, wd, text, color) {
        ctx.save(); ctx.fillStyle = color; ctx.fillRect(x, y + 38, wd, 44);
        ctx.strokeStyle = pal.sheet; ctx.lineWidth = 1; ctx.strokeRect(x, y + 38, wd, 44); ctx.restore();
        label(ctx, text, x + wd / 2, y + 66, pal.sheet, 10, "center", "alphabetic", 600);
      }
      box(x0 + 10, 54, "P", pal.def);
      box(x0 + 70, 54, "O", pal.beta);
      box(x0 + 130, 74, "lacZ", pal.muted);
      box(x0 + 210, 74, "lacY", pal.muted);
      box(x0 + 290, 74, "lacA", pal.muted);

      // repressor
      if (m.rep < 0.5) {
        ctx.save();
        ctx.fillStyle = pal.beta;
        ctx.beginPath();
        ctx.arc(x0 + 97, y + 24, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        label(ctx, "LacI", x0 + 97, y + 30, pal.sheet, 9, "center", "middle", 600);
        label(ctx, "bound → no transcription", x0 + 120, y + 18, pal.beta, 10);
      } else {
        label(ctx, "LacI released (allolactose)", x0 + 120, y + 14, pal.muted, 10);
      }

      // CAP
      if (m.cap > 0.5) {
        ctx.save();
        ctx.fillStyle = pal.def;
        ctx.beginPath();
        ctx.arc(x0 + 37, y + 24, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        label(ctx, "CAP", x0 + 37, y + 29, pal.sheet, 8, "center", "middle", 600);
      } else {
        label(ctx, "no CAP–cAMP", x0 + 8, y + 14, pal.muted, 10);
      }

      // mRNA arrow
      var len = (x1 - x0 - 30) * m.rate / 100;
      ctx.save();
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = Math.max(1, 2 + 10 * m.rate / 100);
      ctx.beginPath(); ctx.moveTo(x0 + 10, y + 120); ctx.lineTo(x0 + 10 + len, y + 120); ctx.stroke();
      ctx.restore();
      label(ctx, "lac mRNA · " + fmt(m.rate, 0) + "%", x0 + 10, y + 146, pal.accent, 11);

      // meters
      function meter(x, labelText, value, color) {
        label(ctx, labelText, x, h - 58, pal.muted, 10);
        ctx.save(); ctx.fillStyle = pal.rule; ctx.fillRect(x, h - 48, 150, 8);
        ctx.fillStyle = color; ctx.fillRect(x, h - 48, 150 * value, 8); ctx.restore();
      }
      meter(x0, "Repressor released", m.rep, pal.accent);
      meter(x0 + 190, "CAP activation", m.cap, pal.def);

      setReadout(root, [
        ["Lactose", fmt(state.lac, 1) + " mM"],
        ["Glucose", fmt(state.glc, 1) + " mM"],
        ["Transcription", fmt(m.rate, 0) + "%"],
        ["Repressor free", fmt(m.rep * 100, 0) + "%"],
        ["CAP active", fmt(m.cap * 100, 0) + "%"]
      ]);
      var status;
      if (state.lac < 0.2) status = "No lactose: LacI stays bound and the operon is off even when glucose is low. Basal leak is ~2%, not zero.";
      else if (state.glc > 5) status = "Lactose present but glucose high: cAMP is low, CAP does not activate, and transcription stays low. This is catabolite repression.";
      else status = "Lactose present and glucose low: allolactose releases LacI and CAP–cAMP activates the promoter. The operon is fully on.";
      setStatus(root, status);
      setAria(canvas, "lac operon diagram; transcription rate " + m.rate.toFixed(0) + " percent.");
    }

    addRange(controls, {
      label: "Lactose", min: 0, max: 10, step: 0.1, value: state.lac,
      format: function (v) { return v.toFixed(1) + " mM"; },
      onInput: function (v) { state.lac = v; draw(); }
    });
    addRange(controls, {
      label: "Glucose", min: 0, max: 10, step: 0.1, value: state.glc,
      format: function (v) { return v.toFixed(1) + " mM"; },
      onInput: function (v) { state.glc = v; draw(); }
    });
    addHint(root, "The inducer is allolactose, not lactose itself. Glucose lowers cAMP, so CAP fails to activate even when the repressor is gone. The rate model is a teaching fit.");
    LAB_RENDERS.push(draw);
    draw();
  };

  /* ============================================================
     5. Hardy–Weinberg, selection and drift
     ============================================================ */

  LAB.hwe = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var state = { p: 0.5, N: 1000, s: 0, drift: true, seed: 7, gens: 100 };

    function simulate() {
      var rnd = mulberry32(state.seed);
      var p = state.p, out = [{ p: p, g: 0 }];
      for (var g = 1; g <= state.gens; g += 1) {
        var q = 1 - p;
        var mean = p * p + 2 * p * q + q * q * (1 - state.s);
        var pn = (p * p + p * q) / mean;
        if (state.drift) {
          var n = 2 * state.N;
          var count = 0;
          for (var i = 0; i < n; i += 1) if (rnd() < pn) count += 1;
          pn = count / n;
        }
        p = Math.min(1, Math.max(0, pn));
        out.push({ p: p, g: g });
      }
      return out;
    }

    function draw() {
      var c = setupCanvas(canvas, 380);
      var ctx = c.ctx, w = c.w, h = c.h, pal = palette();
      var traj = simulate();
      var narrow = w < 480;
      var boxW = Math.min(w * 0.58, 380);
      var box = narrow
        ? { x: 56, y: 24, w: w - 78, h: 168 }
        : { x: 60, y: 26, w: boxW, h: h - 92 };
      axes(ctx, box, 0, state.gens, 0, 1, {
        xLabel: "generation", yLabel: "allele frequency p", xTicks: 5, yTicks: 5
      });
      ctx.save();
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      traj.forEach(function (d, i) {
        var pt = plot(box, 0, state.gens, 0, 1, d.g, d.p);
        if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke(); ctx.restore();

      var p = traj[traj.length - 1].p, q = 1 - p;
      var bx = narrow ? 60 : box.x + box.w + 34;
      var by = narrow ? 250 : box.y + 10;
      var bw = narrow ? w - 92 : w - bx - 18;
      var bh = narrow ? h - by - 34 : box.h - 20;
      label(ctx, "genotypes at generation " + state.gens, bx, by - 6, pal.muted, 9);
      var vals = [["AA", p * p, pal.def], ["Aa", 2 * p * q, pal.accent], ["aa", q * q, pal.beta]];
      vals.forEach(function (v, i) {
        var bh2 = (bh - 20) / 3;
        var y = by + i * bh2;
        label(ctx, v[0], bx, y + 12, pal.ink2, 10);
        ctx.save(); ctx.fillStyle = pal.rule; ctx.fillRect(bx + 28, y + 2, bw - 28, 12);
        ctx.fillStyle = v[2]; ctx.fillRect(bx + 28, y + 2, (bw - 28) * v[1], 12); ctx.restore();
        label(ctx, fmt(v[1], 2), bx + bw, y + 30, pal.muted, 9, "right");
      });

      setReadout(root, [
        ["p (final)", fmt(p, 3)],
        ["q", fmt(q, 3)],
        ["f(AA)", fmt(p * p, 3)],
        ["f(Aa)", fmt(2 * p * q, 3)],
        ["f(aa)", fmt(q * q, 3)],
        ["H = 2pq", fmt(2 * p * q, 3)],
        ["Δp", fmt(p - state.p, 3)]
      ]);
      var status;
      if (state.drift && state.N < 100) status = "Small N: the trajectory is dominated by sampling variance. HWE is a null model; drift alone breaks it.";
      else if (state.s > 0) status = "Selection against aa changes p; the deterministic curve is smooth, the Wright–Fisher path is not.";
      else status = "With no selection, mutation or drift, p stays flat: HWE is the null, not a law that populations must satisfy.";
      setStatus(root, status);
      setAria(canvas, "Allele frequency trajectory ending at " + p.toFixed(2) + ".");
    }

    addRange(controls, {
      label: "Initial p", min: 0.01, max: 0.99, step: 0.01, value: state.p,
      format: function (v) { return v.toFixed(2); },
      onInput: function (v) { state.p = v; draw(); }
    });
    addRange(controls, {
      label: "Population N", min: 10, max: 5000, step: 10, value: state.N,
      format: function (v) { return fmtInt(v); },
      onInput: function (v) { state.N = v; draw(); }
    });
    addRange(controls, {
      label: "Selection s (aa)", min: 0, max: 0.5, step: 0.01, value: state.s,
      format: function (v) { return v.toFixed(2); },
      onInput: function (v) { state.s = v; draw(); }
    });
    addToggle(controls, {
      label: "Genetic drift", value: state.drift,
      onChange: function (v) { state.drift = v; draw(); }
    });
    addButton(controls, {
      label: "New seed", onClick: function () { state.seed = Math.floor(Math.random() * 1e6); draw(); }
    });
    addHint(root, "f(Aa) = 2pq only under random mating, no selection, no mutation, no migration and no drift. The bars are the genotype frequencies, not the allele frequencies.");
    LAB_RENDERS.push(draw);
    draw();
  };

  /* ============================================================
     6. Punnett square, sampling and chi-square
     ============================================================ */

  LAB.punnett = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var state = { cross: "mono", n: 160, seed: 3 };

    var CROSSES = {
      mono: {
        label: "Aa × Aa", gametes: ["A", "a"],
        classes: ["A−", "aa"], expected: [0.75, 0.25], colors: null
      },
      test: {
        label: "Aa × aa", gametes: ["A", "a"],
        classes: ["A−", "aa"], expected: [0.5, 0.5], colors: null
      },
      dihybrid: {
        label: "AaBb × AaBb", gametes: ["AB", "Ab", "aB", "ab"],
        classes: ["A−B−", "A−bb", "aaB−", "aabb"], expected: [9 / 16, 3 / 16, 3 / 16, 1 / 16], colors: null
      }
    };

    function sample() {
      var cfg = CROSSES[state.cross];
      var rnd = mulberry32(state.seed);
      var counts = cfg.expected.map(function () { return 0; });
      for (var i = 0; i < state.n; i += 1) {
        var u = rnd(), acc = 0;
        for (var j = 0; j < cfg.expected.length; j += 1) {
          acc += cfg.expected[j];
          if (u < acc) { counts[j] += 1; break; }
        }
      }
      return counts;
    }

    function draw() {
      var c = setupCanvas(canvas, 400);
      var ctx = c.ctx, w = c.w, h = c.h, pal = palette();
      var cfg = CROSSES[state.cross];
      var counts = sample();
      var gam = cfg.gametes;
      var narrow = w < 480;
      var cell = narrow ? Math.min(40, (w - 90) / gam.length) : Math.min(46, (w * 0.40) / gam.length);
      var gx = narrow ? 26 : 44, gy = narrow ? 56 : 66;

      label(ctx, cfg.label, gx, 26, pal.ink, 12, "left", "alphabetic", 600);
      for (var i = 0; i < gam.length; i += 1) {
        label(ctx, gam[i], gx + cell * (i + 1) + cell / 2, gy - 8, pal.muted, 11, "center");
        label(ctx, gam[i], gx - 12, gy + cell * (i + 1) + cell / 2 + 3, pal.muted, 11, "center");
        for (var j = 0; j < gam.length; j += 1) {
          var x = gx + cell * (j + 1), y = gy + cell * (i + 1);
          ctx.save();
          ctx.fillStyle = (i + j) % 2 ? pal.accentSoft : "rgba(47,93,138,0.07)";
          ctx.fillRect(x, y, cell - 2, cell - 2);
          ctx.strokeStyle = pal.rule; ctx.strokeRect(x, y, cell - 2, cell - 2);
          ctx.restore();
          label(ctx, gam[i] + gam[j], x + cell / 2, y + cell / 2 + 4, pal.ink2, 10, "center");
        }
      }

      // bars
      var bx = narrow ? 30 : gx + cell * (gam.length + 1) + 26;
      var by = narrow ? gy + cell * (gam.length + 1) + 34 : gy;
      var bw = narrow ? w - 56 : w - bx - 20;
      var bh = narrow ? h - by - 26 : Math.min(220, h - 140);
      var maxE = Math.max.apply(null, cfg.expected);
      cfg.classes.forEach(function (name, i) {
        var y = by + i * (bh / cfg.classes.length);
        var ew = (bw - 64) * cfg.expected[i] / maxE;
        var ow = (bw - 64) * (counts[i] / state.n) / maxE;
        label(ctx, name, bx, y + 12, pal.ink2, 10);
        ctx.save();
        ctx.fillStyle = pal.rule; ctx.fillRect(bx + 40, y, ew, 9);
        ctx.fillStyle = pal.accent; ctx.fillRect(bx + 40, y + 11, ow, 9);
        ctx.restore();
        label(ctx, counts[i] + " / " + state.n, bx + 40, y + 32, pal.muted, 9);
      });
      label(ctx, "expected", bx + 150, by - 8, pal.ruleStrong, 9);
      label(ctx, "observed", bx + 210, by - 8, pal.accent, 9);

      var chi = 0;
      cfg.expected.forEach(function (e, i) {
        var exp = e * state.n;
        chi += Math.pow(counts[i] - exp, 2) / exp;
      });
      var df = cfg.classes.length - 1;
      var crit = df === 1 ? 3.84 : df === 2 ? 5.99 : 7.81;
      setReadout(root, [
        ["Expected", cfg.expected.map(function (e) { return fmt(e, 2); }).join(" : ")],
        ["Observed", counts.join(" : ")],
        ["χ²", fmt(chi, 2)],
        ["df", String(df)],
        ["Critical (α=0.05)", fmt(crit, 2)],
        ["Decision", chi > crit ? "reject H₀" : "do not reject"]
      ]);
      setStatus(root, chi > crit
        ? "The observed counts are unlikely under the model. Rejection is a statement about the model and the sample, not proof of a specific biological mechanism."
        : "The data are compatible with the model. That is not proof that the model is true; a correct model is rejected 5% of the time by design.");
      setAria(canvas, "Punnett square for " + cfg.label + " with chi-square " + chi.toFixed(2) + ".");
    }

    addSelect(controls, {
      label: "Cross", value: state.cross,
      options: [
        { value: "mono", label: "Aa × Aa" },
        { value: "test", label: "Aa × aa (test cross)" },
        { value: "dihybrid", label: "AaBb × AaBb" }
      ],
      onChange: function (v) { state.cross = v; draw(); }
    });
    addRange(controls, {
      label: "Progeny n", min: 20, max: 1000, step: 10, value: state.n,
      format: function (v) { return fmtInt(v); },
      onInput: function (v) { state.n = v; draw(); }
    });
    addButton(controls, {
      label: "Resample", onClick: function () { state.seed = Math.floor(Math.random() * 1e6); draw(); }
    });
    addHint(root, "The counts are sampled, not hard-coded from the ratio. A correct model is rejected about 5% of the time at α = 0.05; that is the test working, not failing.");
    LAB_RENDERS.push(draw);
    draw();
  };

  /* ============================================================
     7. Plasmid map, restriction digest and gel
     ============================================================ */

  LAB.plasmid = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var state = { G: 2686, enzymes: { EcoRI: true, BamHI: true, HindIII: true } };
    var SITES = { EcoRI: 397, BamHI: 418, HindIII: 448 };

    function selected() {
      return Object.keys(SITES).filter(function (k) { return state.enzymes[k]; });
    }
    function fragments(enzymes) {
      if (!enzymes.length) return [];
      var cuts = enzymes.map(function (e) { return SITES[e]; }).sort(function (a, b) { return a - b; });
      var out = [];
      for (var i = 0; i < cuts.length; i += 1) {
        var next = i + 1 < cuts.length ? cuts[i + 1] : cuts[0] + state.G;
        out.push(next - cuts[i]);
      }
      return out.sort(function (a, b) { return a - b; });
    }

    function draw() {
      var c = setupCanvas(canvas, 470);
      var ctx = c.ctx, w = c.w, h = c.h, pal = palette();
      var narrow = w < 480;
      var cx, cy, R, gx, gy, gw, gh;
      if (narrow) {
        cx = w / 2; cy = 112; R = Math.min(70, w * 0.21);
        gx = 26; gy = 244; gw = w - 52; gh = h - 286;
      } else {
        cx = 150; cy = 130; R = 78;
        gx = Math.max(300, w * 0.52); gy = 30; gw = w - gx - 20; gh = h - 80;
      }
      var list = selected();
      var frags = fragments(list);

      ctx.save();
      ctx.strokeStyle = pal.ink2; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();

      var allCuts = Object.keys(SITES).map(function (e) { return { name: e, pos: SITES[e] }; });
      allCuts.forEach(function (s) {
        var a = -Math.PI / 2 + 2 * Math.PI * s.pos / state.G;
        ctx.save();
        ctx.strokeStyle = state.enzymes[s.name] ? pal.accent : pal.ruleStrong;
        ctx.lineWidth = state.enzymes[s.name] ? 2.6 : 1.2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (R - 9), cy + Math.sin(a) * (R - 9));
        ctx.lineTo(cx + Math.cos(a) * (R + 10), cy + Math.sin(a) * (R + 10));
        ctx.stroke();
        ctx.restore();
      });
      label(ctx, state.G + " bp", cx, cy + 4, pal.ink, 12, "center", "alphabetic", 600);
      label(ctx, "circular plasmid", cx, cy + 22, pal.muted, 9, "center");
      label(ctx, allCuts.map(function (s) { return s.name + " " + s.pos; }).join(" · "),
        cx, cy + R + 30, pal.muted, 9, "center");

      // gel
      label(ctx, "digest gel · log(bp)", gx, gy - 8, pal.ink2, 10, "left", "alphabetic", 600);
      ctx.save();
      ctx.fillStyle = "rgba(47,93,138,0.06)";
      ctx.fillRect(gx, gy, gw, gh);
      ctx.restore();
      var lanes = list.map(function (e) { return { name: e, frags: fragments([e]) }; });
      lanes.push({ name: "all", frags: frags });
      var laneW = gw / Math.max(1, lanes.length);
      var maxBp = Math.max.apply(null, [state.G].concat(frags.length ? frags : [state.G]));
      lanes.forEach(function (lane, i) {
        var lx = gx + i * laneW;
        label(ctx, lane.name, lx + laneW / 2, gy + 16, pal.muted, 8, "center");
        lane.frags.forEach(function (bp) {
          var y = gy + 28 + (Math.log10(maxBp) - Math.log10(Math.max(10, bp))) / (Math.log10(maxBp) - Math.log10(10)) * (gh - 38);
          ctx.save();
          ctx.fillStyle = pal.accent;
          ctx.globalAlpha = 0.35 + 0.65 * Math.min(1, bp / 800);
          ctx.fillRect(lx + 6, y, laneW - 12, 3 + Math.min(4, bp / 500));
          ctx.restore();
          if (laneW > 52) label(ctx, String(bp), lx + laneW - 5, y - 2, pal.muted, 7, "right");
        });
      });
      label(ctx, "wells", gx + 2, gy + gh - 4, pal.muted, 8, "left");

      setReadout(root, [
        ["Enzymes", list.length ? list.join(", ") : "none"],
        ["Cut sites", String(list.length)],
        ["Fragments", frags.length ? frags.join(" · ") + " bp" : "—"],
        ["Count", String(frags.length)],
        ["Sum", fmtInt(frags.reduce(function (a, b) { return a + b; }, 0)) + " bp"],
        ["Largest", frags.length ? fmtInt(Math.max.apply(null, frags)) + " bp" : "—"]
      ]);
      var status = list.length
        ? "A circular plasmid with n cuts gives n fragments, including the wrap-around fragment (G − last + first). The lengths must sum to " + state.G + " bp."
        : "Select at least one enzyme. With one cut the circle opens into a single linear fragment of the full length.";
      setStatus(root, status);
      setAria(canvas, "Plasmid map with " + list.length + " enzymes and " + frags.length + " fragments: " + frags.join(", ") + " base pairs.");
    }

    Object.keys(SITES).forEach(function (name) {
      addToggle(controls, {
        label: name, value: state.enzymes[name],
        onChange: function (v) { state.enzymes[name] = v; draw(); }
      });
    });
    addButton(controls, {
      label: "pUC19 preset", onClick: function () {
        state.G = 2686;
        state.enzymes = { EcoRI: true, BamHI: true, HindIII: true };
        window.__MBG_LABS__.rerender();
      }
    });
    addHint(root, "pUC19 is 2686 bp; EcoRI 397, BamHI 418, HindIII 448. The three-cut digest gives 21 + 30 + 2635 bp. Check the sum.");
    LAB_RENDERS.push(draw);
    draw();
  };

  /* ============================================================
     8. PCR: Tm, cycles and yield
     ============================================================ */

  LAB.pcr = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var state = { primer: "ATGCGTACGTAGCTAGCTAG", cycles: 30, eff: 0.9, amplicon: 500 };

    function tmWallace(p) {
      var a = 0, t = 0;
      for (var i = 0; i < p.length; i += 1) {
        if (p[i] === "A" || p[i] === "T") a += 1;
        if (p[i] === "G" || p[i] === "C") t += 1;
      }
      return 2 * a + 4 * t;
    }
    function tmGC(p) {
      var gcN = 0;
      for (var i = 0; i < p.length; i += 1) if (p[i] === "G" || p[i] === "C") gcN += 1;
      return 64.9 + 41 * (gcN - 16.4) / Math.max(1, p.length);
    }

    function draw() {
      var c = setupCanvas(canvas, 360);
      var ctx = c.ctx, w = c.w, h = c.h, pal = palette();
      var box = { x: 66, y: 20, w: w - 96, h: h - 80 };
      var maxLog = 12;
      axes(ctx, box, 0, state.cycles, 0, maxLog, {
        xLabel: "cycle", yLabel: "log₁₀ copies", xTicks: 6, yTicks: 6
      });
      var cap = Math.log10(1e12);
      function logCopies(n) { return Math.min(cap, n * Math.log10(1 + state.eff)); }
      ctx.save();
      ctx.strokeStyle = pal.accent; ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (var n = 0; n <= state.cycles; n += 1) {
        var p = plot(box, 0, state.cycles, 0, maxLog, n, logCopies(n));
        if (n === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke(); ctx.restore();
      var cur = logCopies(state.cycles);
      var pp = plot(box, 0, state.cycles, 0, maxLog, state.cycles, cur);
      dot(ctx, pp.x, pp.y, 4.5, pal.accent, pal.sheet);
      line(ctx, box.x, pp.y, pp.x, pp.y, pal.ruleStrong, 1, [3, 3]);

      var plateau = logCopies(state.cycles) >= cap;
      setReadout(root, [
        ["Primer length", state.primer.length + " nt"],
        ["GC content", fmt(gc(state.primer) * 100, 1) + "%"],
        ["T_m Wallace", fmt(tmWallace(state.primer), 1) + " °C"],
        ["T_m GC formula", fmt(tmGC(state.primer), 1) + " °C"],
        ["Amplicon", fmtInt(state.amplicon) + " bp"],
        ["Yield", plateau ? "plateau (~10¹²)" : "10^" + fmt(cur, 1) + " copies"],
        ["Efficiency", fmt(state.eff * 100, 0) + "% per cycle"]
      ]);
      var status = "Yield is exponential only while the reaction is in log phase: copies ≈ N₀(1+E)ⁿ. The plateau is a resource limit, not a new rate law.";
      if (state.primer.length > 20) status += " Wallace (2A+4G) is unreliable above ~20 nt; compare it with the GC formula and a nearest-neighbour calculation.";
      setStatus(root, status);
      setAria(canvas, "PCR amplification curve reaching " + cur.toFixed(1) + " log copies after " + state.cycles + " cycles.");
    }

    addText(controls, {
      label: "Primer (5′→3′)", value: state.primer, wide: true,
      onInput: function (v) { state.primer = v.slice(0, 40) || "ATG"; draw(); }
    });
    addRange(controls, {
      label: "Cycles", min: 1, max: 45, step: 1, value: state.cycles,
      format: function (v) { return v.toFixed(0); },
      onInput: function (v) { state.cycles = v; draw(); }
    });
    addRange(controls, {
      label: "Efficiency E", min: 0.5, max: 1, step: 0.01, value: state.eff,
      format: function (v) { return v.toFixed(2); },
      onInput: function (v) { state.eff = v; draw(); }
    });
    addRange(controls, {
      label: "Amplicon", min: 100, max: 2000, step: 10, value: state.amplicon,
      format: function (v) { return v.toFixed(0) + " bp"; },
      onInput: function (v) { state.amplicon = v; draw(); }
    });
    addHint(root, "Wallace: T_m = 2(A+T) + 4(G+C). It is a rough rule; nearest-neighbour thermodynamics is the defensible method for primers above ~20 nt.");
    LAB_RENDERS.push(draw);
    draw();
  };

  /* ============================================================
     9. CRISPR guide scan and off-target expectation
     ============================================================ */

  LAB.crispr = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var state = {
      seq: "GTCAGTACGTAGCTAGCTAGCTAGGATCCGATCGTAGCTAGCATGGCTAGCTAGCTAGCGATCGATCGA",
      pam: "NGG", mismatches: 3, G: 3.1
    };

    function pamMatch(triplet) {
      if (state.pam === "NGG") return triplet[1] === "G" && triplet[2] === "G";
      return triplet[1] === "A" && triplet[2] === "G";
    }

    function scan() {
      var hits = [];
      function walk(seq, strand) {
        for (var i = 0; i + 23 <= seq.length; i += 1) {
          var triplet = seq.substr(i + 20, 3);
          if (!pamMatch(triplet)) continue;
          var guide = seq.substr(i, 20);
          hits.push({
            guide: guide, pam: triplet, cut: strand === "+" ? i + 17 : seq.length - (i + 17),
            strand: strand, gc: gc(guide)
          });
        }
      }
      walk(state.seq, "+");
      walk(revcomp(state.seq), "−");
      return hits;
    }

    function expectedOff() {
      var sum = 0, k;
      var choose = [1, 20, 190, 1140, 4845];
      for (k = 0; k <= state.mismatches; k += 1) sum += choose[k] * Math.pow(3, k);
      return state.G * 1e9 * 2 * (1 / 16) * sum / Math.pow(4, 20);
    }

    function draw() {
      var c = setupCanvas(canvas, 380);
      var ctx = c.ctx, w = c.w, h = c.h, pal = palette();
      var hits = scan();
      var x0 = 24, x1 = w - 16;
      var n = state.seq.length;
      var per = 20;
      var rows = Math.ceil(n / per);
      var bw = (x1 - x0) / per;
      var y0 = 86, rowH = 56;

      label(ctx, "synthetic target locus · " + n + " nt", x0, 30, pal.ink, 12, "left", "alphabetic", 600);

      function rowOf(pos) { return Math.floor(pos / per); }
      function colOf(pos) { return pos % per; }
      function paint(start, len, color) {
        for (var r = 0; r < rows; r += 1) {
          var segStart = Math.max(start, r * per);
          var segEnd = Math.min(start + len, (r + 1) * per);
          if (segEnd <= segStart) continue;
          ctx.fillStyle = color;
          ctx.fillRect(x0 + colOf(segStart) * bw, y0 + r * rowH - 10,
            (segEnd - segStart) * bw, 40);
        }
      }

      // row bands
      for (var r0 = 0; r0 < rows; r0 += 1) {
        ctx.save();
        ctx.fillStyle = "rgba(30,27,23,0.035)";
        ctx.fillRect(x0, y0 + r0 * rowH - 10, x1 - x0, 40);
        ctx.restore();
      }

      // guide highlights first, letters on top
      hits.slice(0, 6).forEach(function (hit, idx) {
        var start = Math.max(0, Math.min(n - 23, hit.cut - 17));
        paint(start, 23, idx === 0 ? "rgba(143,45,45,0.18)" : "rgba(154,59,50,0.08)");
      });

      ctx.save();
      ctx.font = '600 11px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (var rr = 0; rr < rows; rr += 1) {
        for (var col = 0; col < per; col += 1) {
          var i = rr * per + col;
          if (i >= n) break;
          ctx.fillStyle = state.seq[i] === "G" || state.seq[i] === "C" ? pal.def : pal.ink2;
          ctx.fillText(state.seq[i], x0 + (col + 0.5) * bw, y0 + rr * rowH + 10);
        }
      }
      ctx.restore();

      var first = hits[0];
      if (first) {
        var r1 = rowOf(first.cut), c1 = colOf(first.cut);
        line(ctx, x0 + c1 * bw, y0 + r1 * rowH - 20, x0 + c1 * bw, y0 + r1 * rowH + 34, pal.accent, 1.6, [3, 3]);
        label(ctx, "cut", x0 + c1 * bw, y0 + r1 * rowH - 26, pal.accent, 9, "center");
      }

      label(ctx, "guide (20 nt) + PAM, both strands · rows wrap at 20 nt", x0, y0 + rows * rowH + 12, pal.muted, 9);
      var off = expectedOff();
      setReadout(root, [
        ["PAM", state.pam],
        ["Guides found", String(hits.length)],
        ["First guide", first ? first.guide : "—"],
        ["GC", first ? fmt(first.gc * 100, 0) + "%" : "—"],
        ["Cut position", first ? String(first.cut) : "—"],
        ["Mismatch budget", "≤ " + state.mismatches],
        ["Expected off-targets", fmt(off, 1)]
      ]);
      setStatus(root, "The expectation is sequence space only: genome × 2 strands × PAM probability × Σ C(20,k)3ᵏ / 4²⁰. It is not a prediction of cutting; chromatin and repair decide that.");
      setAria(canvas, "CRISPR guide scan with " + hits.length + " candidate guides and " + off.toFixed(1) + " expected off-target sites.");
    }

    addSelect(controls, {
      label: "PAM", value: state.pam,
      options: [{ value: "NGG", label: "SpCas9 NGG" }, { value: "NAG", label: "NAG (relaxed)" }],
      onChange: function (v) { state.pam = v; draw(); }
    });
    addRange(controls, {
      label: "Mismatches", min: 0, max: 4, step: 1, value: state.mismatches,
      format: function (v) { return "≤ " + v.toFixed(0); },
      onInput: function (v) { state.mismatches = v; draw(); }
    });
    addRange(controls, {
      label: "Genome size", min: 0.1, max: 3.2, step: 0.1, value: state.G,
      format: function (v) { return v.toFixed(1) + " Gb"; },
      onInput: function (v) { state.G = v; draw(); }
    });
    addHint(root, "The first guide is highlighted; the dashed line is the cut 3 bp 5′ of the PAM. The off-target number is a combinatorial expectation, never zero.");
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
    var storageKey = "mbg-note-quiz:" + (root.getAttribute("data-quiz-id") || document.title || "default");
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
      $$(".mbgquiz__option", questionEl).forEach(function (button, j) {
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
        wrap.className = "mbgquiz__question";
        wrap.setAttribute("data-q", String(i));

        var prompt = document.createElement("p");
        prompt.className = "mbgquiz__prompt";
        var num = document.createElement("span");
        num.className = "qnum";
        num.textContent = String(i + 1).padStart(2, "0");
        prompt.appendChild(num);
        prompt.appendChild(document.createTextNode(" " + question.prompt));
        wrap.appendChild(prompt);

        var options = document.createElement("div");
        options.className = "mbgquiz__options";
        question.options.forEach(function (option, j) {
          var button = document.createElement("button");
          button.type = "button";
          button.className = "mbgquiz__option";
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
        explain.className = "mbgquiz__explain";
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
    exportBtn.className = "mbgbtn";
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
    $$("[data-mbg-lab]").forEach(function (root) {
      if (root.getAttribute("data-mbg-ready") === "1") return;
      var kind = root.getAttribute("data-mbg-lab");
      var init = LAB[kind];
      if (!init) {
        setStatus(root, "Unknown lab type: " + kind);
        console.warn("Unknown MBG lab", kind);
        return;
      }
      try {
        init(root);
        root.setAttribute("data-mbg-ready", "1");
      } catch (err) {
        console.error(err);
        setStatus(root, "This lab failed to render: " + err.message);
      }
    });
    $$("[data-mbg-quiz]").forEach(initQuiz);
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

  window.__MBG_LABS__ = {
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
