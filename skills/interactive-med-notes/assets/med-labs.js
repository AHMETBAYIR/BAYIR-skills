/* ============================================================
   Interactive medical notes — lab engines
   Vanilla JS. No dependencies. One file, inlined by the builder.

   A lab is declared as:

     <div class="medlab" data-med-lab="ecg">
       ... <canvas data-canvas></canvas> ...
       <div data-controls></div>
       <div data-readout></div>
       <p data-status></p>
     </div>

   Every engine is a teaching model, not a diagnostic device.
   ============================================================ */

(function () {
  "use strict";

  var LAB_RENDERS = [];
  var LAB = {};
  var ERRORS = [];

  window.addEventListener("error", function (event) {
    ERRORS.push(String(event.message || "script error"));
  });

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
    var d = digits === undefined ? 2 : digits;
    if (Math.abs(value) < 5e-13) value = 0;
    var abs = Math.abs(value);
    if (abs !== 0 && (abs < 1e-3 || abs >= 1e5)) return value.toExponential(2);
    var text = value.toFixed(d);
    if (text.indexOf(".") >= 0) text = text.replace(/0+$/, "").replace(/\.$/, "");
    return text === "-0" ? "0" : text;
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
      paper: readCss("--paper", "#f3eee3"),
      accent: readCss("--accent", "#8f2d2d"),
      accentSoft: readCss("--accent-soft", "#f2e6e2"),
      def: readCss("--def", "#2f5d8a"),
      ex: readCss("--ex", "#2f6b4f"),
      warn: readCss("--warn", "#985a00"),
      artery: readCss("--med-artery", "#a33a32"),
      vein: readCss("--med-vein", "#2f5d8a"),
      nerve: readCss("--med-nerve", "#7a5a1e"),
      lymph: readCss("--med-lymph", "#2f6b4f"),
      drug: readCss("--med-drug", "#6b4c8a"),
      grid: readCss("--med-grid", "rgba(30,27,23,0.10)"),
      gridStrong: readCss("--med-grid-strong", "rgba(30,27,23,0.24)"),
      band: readCss("--med-band", "rgba(47,93,138,0.10)"),
      loss: readCss("--med-loss", "#8f2d2d"),
      spared: readCss("--med-spared", "#2f6b4f")
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

  function setAria(canvas, text) {
    canvas.setAttribute("aria-label", text);
  }

  function setStatus(root, text) {
    var el = $("[data-status]", root);
    if (el) el.textContent = text;
  }

  function setPrint(root, text) {
    var el = $("[data-print]", root);
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

  function addRange(controls, opts) {
    var wrap = document.createElement("label");
    wrap.className = "medfield";
    var label = document.createElement("span");
    label.textContent = opts.label;
    wrap.appendChild(label);
    var input = document.createElement("input");
    input.type = "range";
    input.min = String(opts.min);
    input.max = String(opts.max);
    input.step = String(opts.step === undefined ? 1 : opts.step);
    input.value = String(opts.value);
    var out = document.createElement("output");
    function show() {
      out.textContent = opts.format ? opts.format(Number(input.value)) : fmt(Number(input.value));
    }
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
    wrap.className = "medfield";
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

  function addButton(controls, opts) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "medbtn" + (opts.ghost ? " medbtn--ghost" : "");
    button.textContent = opts.label;
    if (opts.active) button.setAttribute("aria-pressed", "true");
    button.addEventListener("click", function () {
      if (opts.onClick) opts.onClick(button);
    });
    controls.appendChild(button);
    return button;
  }

  function label(ctx, text, x, y, color, size, align, baseline, weight) {
    ctx.save();
    ctx.fillStyle = color || "#1e1b17";
    ctx.font = (weight || 500) + " " + (size || 11) + "px 'IBM Plex Sans', system-ui, sans-serif";
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
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
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
    var i;
    for (i = 0; i <= (opts.xTicks || 5); i += 1) {
      var vx = xmin + (xmax - xmin) * i / (opts.xTicks || 5);
      var px = box.x + (vx - xmin) / (xmax - xmin) * box.w;
      ctx.beginPath();
      ctx.moveTo(px, box.y);
      ctx.lineTo(px, box.y + box.h);
      ctx.stroke();
      label(ctx, opts.xFormat ? opts.xFormat(vx) : fmt(vx, 0), px, box.y + box.h + 15, pal.muted, 9, "center");
    }
    for (i = 0; i <= (opts.yTicks || 5); i += 1) {
      var vy = ymin + (ymax - ymin) * i / (opts.yTicks || 5);
      var py = box.y + box.h - (vy - ymin) / (ymax - ymin) * box.h;
      ctx.beginPath();
      ctx.moveTo(box.x, py);
      ctx.lineTo(box.x + box.w, py);
      ctx.stroke();
      label(ctx, opts.yFormat ? opts.yFormat(vy) : fmt(vy, 0), box.x - 8, py + 3, pal.muted, 9, "right");
    }
    ctx.restore();
    label(ctx, opts.xLabel || "", box.x + box.w / 2, box.y + box.h + 32, pal.muted, 10, "center");
    ctx.save();
    ctx.translate(box.x - 44, box.y + box.h / 2);
    ctx.rotate(-Math.PI / 2);
    label(ctx, opts.yLabel || "", 0, 0, pal.muted, 10, "center");
    ctx.restore();
  }

  function plot(box, xmin, xmax, ymin, ymax, x, y) {
    return {
      x: box.x + (x - xmin) / (xmax - xmin) * box.w,
      y: box.y + box.h - (y - ymin) / (ymax - ymin) * box.h
    };
  }

  function noteBox(ctx, box, title, lines, pal) {
    ctx.save();
    ctx.fillStyle = pal.sheet;
    ctx.strokeStyle = pal.rule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.fill();
    ctx.stroke();
    label(ctx, title, box.x + 10, box.y + 18, pal.accent, 10, "left", "alphabetic", 600);
    lines.forEach(function (text, index) {
      label(ctx, text, box.x + 10, box.y + 36 + index * 15, pal.ink2, 10);
    });
    ctx.restore();
  }

  /* ============================================================
     1. ECG — synthetic limb-lead trace + axis
     ============================================================ */

  LAB.ecg = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var defaults = { hr: 72, pr: 160, qrs: 90, qt: 400, axis: 60, st: 0 };
    var state = Object.assign({}, defaults);
    var presets = {
      normal: { hr: 72, pr: 160, qrs: 90, qt: 400, axis: 60, st: 0 },
      brady: { hr: 45, pr: 180, qrs: 90, qt: 430, axis: 55, st: 0 },
      tachy: { hr: 135, pr: 130, qrs: 80, qt: 320, axis: 70, st: 0 },
      avblock: { hr: 58, pr: 260, qrs: 95, qt: 420, axis: 50, st: 0 },
      wide: { hr: 78, pr: 170, qrs: 150, qt: 450, axis: -35, st: 0 },
      stemi: { hr: 92, pr: 155, qrs: 100, qt: 420, axis: 45, st: 2.5 }
    };

    function projection(axisDeg, leadDeg) {
      return Math.cos((axisDeg - leadDeg) * Math.PI / 180);
    }

    function ecgSample(t) {
      var period = 60 / state.hr;
      var beat = Math.floor(t / period);
      var sum = 0;
      for (var n = beat - 1; n <= beat + 1; n += 1) {
        var tb = n * period;
        var dt = t - tb;
        var pr = state.pr / 1000;
        var qt = state.qt / 1000;
        var p = 0.12 * Math.exp(-Math.pow((dt + pr) / 0.024, 2) / 2);
        var q = -0.08 * Math.exp(-Math.pow((dt + 0.018) / 0.007, 2) / 2);
        var r = 1.0 * Math.exp(-Math.pow(dt / 0.009, 2) / 2);
        var s = -0.22 * Math.exp(-Math.pow((dt - 0.020) / 0.009, 2) / 2);
        var tWave = 0.30 * Math.exp(-Math.pow((dt - qt * 0.66) / 0.055, 2) / 2);
        var st = 0;
        if (dt > 0.035 && dt < qt * 0.55 && state.st !== 0) {
          var ramp = clamp((dt - 0.035) / 0.03, 0, 1);
          var fall = clamp((qt * 0.55 - dt) / 0.05, 0, 1);
          st = state.st * 0.1 * ramp * fall;
        }
        sum += p + q + r + s + tWave + st;
      }
      return sum;
    }

    function draw() {
      var c = setupCanvas(canvas, 380);
      var ctx = c.ctx;
      var w = c.w;
      var h = c.h;
      var pal = palette();
      var rhythm = { x: 44, y: 30, w: w - 70, h: 200 };
      var scaleII = projection(state.axis, 60);
      var scaleI = projection(state.axis, 0);
      var scaleIII = projection(state.axis, 120);
      var y0 = rhythm.y + rhythm.h * 0.58;

      // ECG paper grid
      ctx.save();
      ctx.strokeStyle = pal.grid;
      ctx.lineWidth = 0.6;
      for (var gx = rhythm.x; gx <= rhythm.x + rhythm.w; gx += rhythm.w / 50) {
        ctx.beginPath();
        ctx.moveTo(gx, rhythm.y);
        ctx.lineTo(gx, rhythm.y + rhythm.h);
        ctx.stroke();
      }
      for (var gy = rhythm.y; gy <= rhythm.y + rhythm.h; gy += rhythm.h / 20) {
        ctx.beginPath();
        ctx.moveTo(rhythm.x, gy);
        ctx.lineTo(rhythm.x + rhythm.w, gy);
        ctx.stroke();
      }
      ctx.restore();

      // Lead II trace
      ctx.save();
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      var duration = 10;
      for (var i = 0; i <= 1200; i += 1) {
        var t = duration * i / 1200;
        var value = ecgSample(t) * scaleII;
        var px = rhythm.x + t / duration * rhythm.w;
        var py = y0 - value * 58;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
      label(ctx, "Lead II · sentetik 10 s", rhythm.x, rhythm.y - 8, pal.muted, 10, "left", "alphabetic", 600);

      // Axis circle
      var cx = 92;
      var cy = 300;
      var radius = 52;
      ctx.save();
      ctx.strokeStyle = pal.ruleStrong;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      line(ctx, cx - radius, cy, cx + radius, cy, pal.rule, 1);
      line(ctx, cx, cy - radius, cx, cy + radius, pal.rule, 1);
      ctx.restore();
      label(ctx, "I", cx + radius - 8, cy + 14, pal.muted, 9, "center");
      label(ctx, "aVF", cx + 10, cy - radius - 2, pal.muted, 9, "left");
      var ax = state.axis * Math.PI / 180;
      var vx = Math.cos(ax) * radius * 0.9;
      var vy = -Math.sin(ax) * radius * 0.9;
      line(ctx, cx, cy, cx + vx, cy + vy, pal.accent, 2.4);
      dot(ctx, cx + vx, cy + vy, 4, pal.accent, pal.sheet);
      label(ctx, fmt(state.axis, 0) + "°", cx, cy + radius + 18, pal.accent, 11, "center", "alphabetic", 600);

      // Mini lead table
      var tx = 190;
      var ty = 270;
      var rr = 60 / state.hr;
      var qtcB = (state.qt / 1000) / Math.sqrt(rr);
      var qtcF = (state.qt / 1000) / Math.pow(rr, 1 / 3);
      noteBox(ctx, { x: tx, y: ty - 14, w: w - tx - 30, h: 92 }, "Ölçümler", [
        "HR " + fmt(state.hr, 0) + "/dk · RR " + fmt(rr, 2) + " s",
        "PR " + fmt(state.pr, 0) + " ms · QRS " + fmt(state.qrs, 0) + " ms",
        "QT " + fmt(state.qt, 0) + " ms · QTcB " + fmt(qtcB * 1000, 0) + " ms · QTcF " + fmt(qtcF * 1000, 0) + " ms",
        "I " + fmt(scaleI, 2) + " · II " + fmt(scaleII, 2) + " · III " + fmt(scaleIII, 2) + " (göreli projeksiyon)"
      ], pal);

      var flags = [];
      if (state.pr > 200) flags.push("PR > 200 ms");
      if (state.qrs > 120) flags.push("QRS > 120 ms");
      if (qtcB > 0.45) flags.push("QTc uzamış");
      if (state.st >= 1) flags.push("ST elevasyonu");
      if (state.axis < -30) flags.push("sol aks");
      if (state.axis > 90) flags.push("sağ aks");

      setReadout(root, [
        ["Kalp hızı", fmt(state.hr, 0) + " /dk"],
        ["PR", fmt(state.pr, 0) + " ms"],
        ["QRS", fmt(state.qrs, 0) + " ms"],
        ["QTc (Bazett)", fmt(qtcB * 1000, 0) + " ms"],
        ["Eksen", fmt(state.axis, 0) + "°"],
        ["ST", fmt(state.st, 1) + " mm"]
      ]);
      var status;
      if (state.st >= 1) status = "ST segmenti yükseldi. Bu sentetik iz, komşu derivasyonlarda eşik ve J noktası mantığını göstermek için vardır; gerçek hastada tanı için 12-derivasyon ve klinik bağlam gerekir.";
      else if (state.pr > 200) status = "PR > 200 ms: AV iletimi yavaşlamış. Her uzun PR bir blok değildir; ölçümü P dalgasının başından QRS'nin başına kadar yap.";
      else if (state.qrs > 120) status = "QRS > 120 ms: ventriküler depolarizasyon yavaş. QRS genişliği QT ölçümünü de etkiler; QTc'yi tek başına yorumlama.";
      else if (qtcB > 0.45) status = "QTc uzamış görünüyor. Bazett yüksek hızda fazla düzeltir; Fridericia ile karşılaştır ve ilaç/elektrolit bağlamını unutma.";
      else if (state.axis < -30 || state.axis > 90) status = "Eksen normal aralığın dışında. Eksen, I ve aVF'deki net QRS yönünden okunur; tek bir derivasyondan karar verme.";
      else if (state.hr > 100) status = "Hız > 100/dk. Ritim stripi 10 saniyelik olduğu için RR aralığından hızı doğrulayabilirsin.";
      else if (state.hr < 60) status = "Hız < 60/dk. Bradikardi bir ritim tanımıdır; nedeni (sinüs, AV blok, ilaç) ayrı bir sorudur.";
      else status = "Normal görünümlü sentetik iz. P-QRS-T sırası, eksen ve QTc'yi birlikte oku; tek ölçüm tanı değildir.";
      if (flags.length) status += " Bayraklar: " + flags.join(" · ") + ".";
      setStatus(root, status);
      setPrint(root, "Sentetik ECG: " + fmt(state.hr, 0) + "/dk, PR " + fmt(state.pr, 0) + " ms, QRS " + fmt(state.qrs, 0) + " ms, QTcB " + fmt(qtcB * 1000, 0) + " ms, eksen " + fmt(state.axis, 0) + "°.");
      setAria(canvas, "Sentetik lead II elektrokardiyogram, kalp hızı " + fmt(state.hr, 0) + " atım/dakika, eksen " + fmt(state.axis, 0) + " derece.");
    }

    function mount() {
      controls.replaceChildren();
      addRange(controls, { label: "Kalp hızı", min: 35, max: 180, step: 1, value: state.hr, format: function (v) { return v.toFixed(0) + " /dk"; }, onInput: function (v) { state.hr = v; draw(); } });
      addRange(controls, { label: "PR", min: 80, max: 320, step: 5, value: state.pr, format: function (v) { return v.toFixed(0) + " ms"; }, onInput: function (v) { state.pr = v; draw(); } });
      addRange(controls, { label: "QRS", min: 60, max: 180, step: 5, value: state.qrs, format: function (v) { return v.toFixed(0) + " ms"; }, onInput: function (v) { state.qrs = v; draw(); } });
      addRange(controls, { label: "QT", min: 240, max: 540, step: 5, value: state.qt, format: function (v) { return v.toFixed(0) + " ms"; }, onInput: function (v) { state.qt = v; draw(); } });
      addRange(controls, { label: "Eksen", min: -120, max: 180, step: 5, value: state.axis, format: function (v) { return v.toFixed(0) + "°"; }, onInput: function (v) { state.axis = v; draw(); } });
      addRange(controls, { label: "ST", min: -2, max: 4, step: 0.5, value: state.st, format: function (v) { return v.toFixed(1) + " mm"; }, onInput: function (v) { state.st = v; draw(); } });
      Object.keys(presets).forEach(function (key) {
        addButton(controls, {
          label: key,
          ghost: true,
          onClick: function () {
            state = Object.assign({}, presets[key]);
            mount();
            draw();
          }
        });
      });
      addButton(controls, { label: "Sıfırla", ghost: true, onClick: function () { state = Object.assign({}, defaults); mount(); draw(); } });
    }

    LAB_RENDERS.push(draw);
    mount();
    draw();
  };

  /* ============================================================
     2. PV loop — preload, contractility, afterload
     ============================================================ */

  LAB.pvloop = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var defaults = { edv: 120, ees: 2.5, ea: 2.0, hr: 70 };
    var state = Object.assign({}, defaults);
    var V0 = 15;
    var presets = {
      normal: { edv: 120, ees: 2.5, ea: 2.0, hr: 70 },
      hfref: { edv: 160, ees: 1.0, ea: 2.0, hr: 80 },
      hfpef: { edv: 90, ees: 4.0, ea: 3.0, hr: 80 },
      afterload: { edv: 120, ees: 2.5, ea: 4.0, hr: 70 },
      exercise: { edv: 140, ees: 3.5, ea: 1.5, hr: 120 }
    };

    function model() {
      var esv = (state.ees * V0 + state.ea * state.edv) / (state.ees + state.ea);
      esv = clamp(esv, V0, state.edv - 1);
      var sv = state.edv - esv;
      var ef = sv / state.edv;
      var co = sv * state.hr / 1000;
      var pes = state.ees * (esv - V0);
      var sw = pes * (sv / 1000) * 0.1333;
      return { esv: esv, sv: sv, ef: ef, co: co, pes: pes, sw: sw };
    }

    function draw() {
      var c = setupCanvas(canvas, 370);
      var ctx = c.ctx;
      var w = c.w;
      var h = c.h;
      var pal = palette();
      var box = { x: 58, y: 28, w: w - 86, h: h - 88 };
      var m = model();
      var xmax = 240;
      var ymax = Math.max(200, Math.ceil((m.pes + 20) / 50) * 50);
      axes(ctx, box, 0, xmax, 0, ymax, { xLabel: "Sol ventrikül hacmi (mL)", yLabel: "Basınç (mmHg)", xTicks: 6, yTicks: 5 });

      ctx.save();
      ctx.beginPath();
      ctx.rect(box.x, box.y, box.w, box.h);
      ctx.clip();

      // ESPVR
      ctx.save();
      ctx.strokeStyle = pal.ruleStrong;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      var p1 = plot(box, 0, xmax, 0, ymax, V0, 0);
      var p2 = plot(box, 0, xmax, 0, ymax, xmax, state.ees * (xmax - V0));
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.restore();
      label(ctx, "ESPVR (Ees)", p2.x - 80, p2.y - 6, pal.muted, 10);

      // EDPVR schematic
      ctx.save();
      ctx.strokeStyle = pal.rule;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      for (var i = 0; i <= 80; i += 1) {
        var v = 40 + i * 2.5;
        var p = 3 * Math.exp((v - 120) / 28);
        var pt = plot(box, 0, xmax, 0, ymax, v, clamp(p, 0, 40));
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();
      label(ctx, "EDPVR", box.x + 8, box.y + 16, pal.muted, 10);

      var edvP = plot(box, 0, xmax, 0, ymax, state.edv, 4);
      var esvP = plot(box, 0, xmax, 0, ymax, m.esv, m.pes);
      var edvTop = plot(box, 0, xmax, 0, ymax, state.edv, m.pes);
      var esvBottom = plot(box, 0, xmax, 0, ymax, m.esv, 4);

      // PV loop
      ctx.save();
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(edvP.x, edvP.y);
      ctx.bezierCurveTo(edvP.x - 8, edvP.y - 40, edvTop.x - 12, edvTop.y + 30, edvTop.x, edvTop.y);
      ctx.lineTo(esvP.x, esvP.y);
      ctx.bezierCurveTo(esvP.x + 8, esvP.y + 50, esvBottom.x + 14, esvBottom.y - 18, esvBottom.x, esvBottom.y);
      ctx.bezierCurveTo(esvBottom.x + 40, esvBottom.y - 8, edvP.x - 40, edvP.y + 8, edvP.x, edvP.y);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = pal.accentSoft;
      ctx.globalAlpha = 0.55;
      ctx.fill();
      ctx.restore();

      // Keep the loop and the elastance lines inside the plot box.
      ctx.restore();

      // Volume markers
      line(ctx, edvTop.x, box.y, edvTop.x, box.y + box.h, pal.gridStrong, 1, [3, 3]);
      line(ctx, esvP.x, box.y, esvP.x, box.y + box.h, pal.gridStrong, 1, [3, 3]);
      label(ctx, "EDV", edvTop.x, box.y - 4, pal.muted, 9, "center");
      label(ctx, "ESV", esvP.x, box.y - 4, pal.muted, 9, "center");
      dot(ctx, edvTop.x, edvTop.y, 4, pal.accent, pal.sheet);
      dot(ctx, esvP.x, esvP.y, 4, pal.accent, pal.sheet);

      // SW area label
      label(ctx, "SV " + fmt(m.sv, 0) + " mL", (edvTop.x + esvP.x) / 2, box.y + box.h - 14, pal.accent, 10, "center", "alphabetic", 600);

      setReadout(root, [
        ["EDV", fmt(state.edv, 0) + " mL"],
        ["ESV", fmt(m.esv, 0) + " mL"],
        ["SV", fmt(m.sv, 0) + " mL"],
        ["EF", pct(m.ef, 0)],
        ["CO", fmt(m.co, 1) + " L/dk"],
        ["Pes", fmt(m.pes, 0) + " mmHg"],
        ["Stroke work", fmt(m.sw, 1) + " J"]
      ]);
      var status;
      if (state.ees < 1.6) status = "Düşük Ees (kontraktilite): aynı preload ve afterload altında SV ve EF düşer. Kalp yetersizliğinde kompanzasyon EDV'yi artırır; bu, Frank-Starling eğrisini yukarı taşır ama Ees'i düzeltmez.";
      else if (state.ea > 3.2) status = "Yüksek Ea (afterload): ejeksiyon zorlaşır, ESV artar, SV düşer. Kan basıncı yükselirken SV'nin düştüğünü görebilirsin.";
      else if (state.edv > 145) status = "Yüksek preload: SV artar, ancak çok yüksek EDV'de EDPVR dikleşir. Preload artışı her zaman kardiyak output artışı değildir.";
      else status = "Normal aralık. EF normal olsa bile CO düşük olabilir: CO = SV × HR; EF tek başına doku perfüzyonunu göstermez.";
      setStatus(root, status);
      setPrint(root, "PV loop: EDV " + fmt(state.edv, 0) + " mL, ESV " + fmt(m.esv, 0) + " mL, SV " + fmt(m.sv, 0) + " mL, EF " + pct(m.ef, 0) + ", CO " + fmt(m.co, 1) + " L/dk.");
      setAria(canvas, "Basınç-hacim döngüsü: EDV " + fmt(state.edv, 0) + " mililitre, ESV " + fmt(m.esv, 0) + " mililitre, ejeksiyon fraksiyonu " + pct(m.ef, 0) + ".");
    }

    function mount() {
      controls.replaceChildren();
      addRange(controls, { label: "EDV", min: 70, max: 220, step: 5, value: state.edv, format: function (v) { return v.toFixed(0) + " mL"; }, onInput: function (v) { state.edv = v; draw(); } });
      addRange(controls, { label: "Ees (kontraktilite)", min: 0.5, max: 5, step: 0.1, value: state.ees, format: function (v) { return v.toFixed(1) + " mmHg/mL"; }, onInput: function (v) { state.ees = v; draw(); } });
      addRange(controls, { label: "Ea (afterload)", min: 0.5, max: 5, step: 0.1, value: state.ea, format: function (v) { return v.toFixed(1) + " mmHg/mL"; }, onInput: function (v) { state.ea = v; draw(); } });
      addRange(controls, { label: "Kalp hızı", min: 40, max: 160, step: 1, value: state.hr, format: function (v) { return v.toFixed(0) + " /dk"; }, onInput: function (v) { state.hr = v; draw(); } });
      Object.keys(presets).forEach(function (key) {
        addButton(controls, { label: key, ghost: true, onClick: function () { state = Object.assign({}, presets[key]); mount(); draw(); } });
      });
      addButton(controls, { label: "Sıfırla", ghost: true, onClick: function () { state = Object.assign({}, defaults); mount(); draw(); } });
    }

    LAB_RENDERS.push(draw);
    mount();
    draw();
  };

  /* ============================================================
     3. Oxygen–haemoglobin curve and content
     ============================================================ */

  LAB.oxygen = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var defaults = { pao2: 95, hb: 15, ph: 7.4, temp: 37, dpg: "normal", co: 0 };
    var state = Object.assign({}, defaults);
    var presets = {
      normal: { pao2: 95, hb: 15, ph: 7.4, temp: 37, dpg: "normal", co: 0 },
      anemia: { pao2: 95, hb: 8, ph: 7.4, temp: 37, dpg: "normal", co: 0 },
      acidosis: { pao2: 95, hb: 15, ph: 7.2, temp: 37, dpg: "normal", co: 0 },
      alkalosis: { pao2: 95, hb: 15, ph: 7.55, temp: 37, dpg: "normal", co: 0 },
      altitude: { pao2: 60, hb: 15, ph: 7.45, temp: 37, dpg: "high", co: 0 },
      co: { pao2: 95, hb: 15, ph: 7.4, temp: 37, dpg: "normal", co: 30 }
    };

    function p50() {
      var dpgFactor = state.dpg === "high" ? 1.12 : state.dpg === "low" ? 0.88 : 1;
      return 26.6 * Math.pow(10, -0.48 * (state.ph - 7.4)) * (1 + 0.03 * (state.temp - 37)) * dpgFactor;
    }

    function saturation(pao2, p50Value) {
      var n = 2.7;
      return Math.pow(pao2, n) / (Math.pow(p50Value, n) + Math.pow(pao2, n));
    }

    function draw() {
      var c = setupCanvas(canvas, 360);
      var ctx = c.ctx;
      var w = c.w;
      var h = c.h;
      var pal = palette();
      var box = { x: 58, y: 26, w: w - 86, h: h - 92 };
      var p = p50();
      var s = saturation(state.pao2, p);
      var hbEff = state.hb * (1 - state.co / 100);
      var cao2 = 1.34 * hbEff * s + 0.003 * state.pao2;
      var do2 = cao2 * 5 * 10;
      axes(ctx, box, 0, 150, 0, 100, { xLabel: "PaO₂ (mmHg)", yLabel: "SaO₂ (%)", xTicks: 6, yTicks: 5 });

      function curve(p50Value, color, width, dash) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        if (dash) ctx.setLineDash(dash);
        ctx.beginPath();
        for (var i = 0; i <= 150; i += 1) {
          var pt = plot(box, 0, 150, 0, 100, i, saturation(i, p50Value) * 100);
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.restore();
      }

      curve(26.6, pal.ruleStrong, 1.1, [4, 3]);
      curve(p, pal.accent, 2.6);
      var point = plot(box, 0, 150, 0, 100, state.pao2, s * 100);
      dot(ctx, point.x, point.y, 5, pal.accent, pal.sheet);
      line(ctx, point.x, point.y, point.x, box.y + box.h, pal.gridStrong, 1, [2, 3]);
      line(ctx, box.x, point.y, point.x, point.y, pal.gridStrong, 1, [2, 3]);
      var pao2LabelX = point.x + 6;
      var pao2Align = "left";
      if (pao2LabelX > box.x + box.w - 42) {
        pao2LabelX = point.x - 6;
        pao2Align = "right";
      }
      label(ctx, "PaO₂ " + fmt(state.pao2, 0), pao2LabelX, point.y - 7, pal.accent, 10, pao2Align, "alphabetic", 600);

      var p50pt = plot(box, 0, 150, 0, 100, p, 50);
      dot(ctx, p50pt.x, p50pt.y, 3.5, pal.def, pal.sheet);
      label(ctx, "P50 " + fmt(p, 1), p50pt.x + 6, p50pt.y + 13, pal.def, 9);

      noteBox(ctx, { x: box.x + box.w - 176, y: box.y + box.h - 84, w: 168, h: 76 }, "İçerik", [
        "CaO₂ " + fmt(cao2, 1) + " mL/dL",
        "DO₂ " + fmt(do2, 0) + " mL/dk",
        "Etkin Hb " + fmt(hbEff, 1) + " g/dL",
        "COHb " + fmt(state.co, 0) + "%"
      ], pal);

      setReadout(root, [
        ["P50", fmt(p, 1) + " mmHg"],
        ["SaO₂", pct(s, 1)],
        ["CaO₂", fmt(cao2, 1) + " mL/dL"],
        ["DO₂ (CO 5 L/dk)", fmt(do2, 0) + " mL/dk"],
        ["Etkin Hb", fmt(hbEff, 1) + " g/dL"],
        ["COHb", fmt(state.co, 0) + "%"]
      ]);
      var status;
      if (state.co > 0) status = "COHb yükseldi: pulse oksimetre SaO₂'yi normal gösterebilir, çünkü cihaz karboksihemoglobini oksihemoglobinden ayırmaz. Gerçek oksijen içeriği ve DO₂ düşer.";
      else if (state.hb < 10) status = "Hb düşük: SaO₂ %100 olsa bile CaO₂ ve DO₂ düşer. Oksijen satürasyonu ile oksijen içeriği aynı şey değildir.";
      else if (state.ph < 7.35) status = "Asidoz P50'yi sağa kaydırır: aynı PaO₂'de SaO₂ biraz düşer, dokuya oksijen bırakma artar. Bu bir denge kaymasıdır, 'daha iyi oksijenasyon' değildir.";
      else if (state.ph > 7.45) status = "Alkaloz P50'yi sola kaydırır: Hb oksijeni daha sıkı tutar. Aynı PaO₂'de SaO₂ yükselirken dokuya bırakma azalır.";
      else if (state.pao2 < 70) status = "Düşük PaO₂ eğrinin dik kısmına yakın: küçük PaO₂ değişiklikleri SaO₂'yi belirgin etkiler. Yüksek PaO₂'de eğri düzleşir.";
      else status = "Normal koşullarda P50 ~26–27 mmHg. Eğriyi P50, pH, sıcaklık ve 2,3-DPG birlikte kaydırır; tek nokta tüm taşıma kapasitesini göstermez.";
      setStatus(root, status);
      setPrint(root, "O₂-Hb: PaO₂ " + fmt(state.pao2, 0) + " mmHg, SaO₂ " + pct(s, 1) + ", P50 " + fmt(p, 1) + " mmHg, CaO₂ " + fmt(cao2, 1) + " mL/dL.");
      setAria(canvas, "Oksijen-hemoglobin eğrisi: PaO2 " + fmt(state.pao2, 0) + " milimetre cıva, saturasyon " + pct(s, 1) + ", P50 " + fmt(p, 1) + " milimetre cıva.");
    }

    function mount() {
      controls.replaceChildren();
      addRange(controls, { label: "PaO₂", min: 30, max: 150, step: 1, value: state.pao2, format: function (v) { return v.toFixed(0) + " mmHg"; }, onInput: function (v) { state.pao2 = v; draw(); } });
      addRange(controls, { label: "Hb", min: 4, max: 20, step: 0.5, value: state.hb, format: function (v) { return v.toFixed(1) + " g/dL"; }, onInput: function (v) { state.hb = v; draw(); } });
      addRange(controls, { label: "pH", min: 7.1, max: 7.6, step: 0.01, value: state.ph, format: function (v) { return v.toFixed(2); }, onInput: function (v) { state.ph = v; draw(); } });
      addRange(controls, { label: "Sıcaklık", min: 32, max: 42, step: 0.5, value: state.temp, format: function (v) { return v.toFixed(1) + " °C"; }, onInput: function (v) { state.temp = v; draw(); } });
      addSelect(controls, {
        label: "2,3-DPG", value: state.dpg,
        options: [{ value: "low", label: "Düşük" }, { value: "normal", label: "Normal" }, { value: "high", label: "Yüksek" }],
        onChange: function (v) { state.dpg = v; draw(); }
      });
      addRange(controls, { label: "COHb", min: 0, max: 50, step: 1, value: state.co, format: function (v) { return v.toFixed(0) + "%"; }, onInput: function (v) { state.co = v; draw(); } });
      Object.keys(presets).forEach(function (key) {
        addButton(controls, { label: key, ghost: true, onClick: function () { state = Object.assign({}, presets[key]); mount(); draw(); } });
      });
      addButton(controls, { label: "Sıfırla", ghost: true, onClick: function () { state = Object.assign({}, defaults); mount(); draw(); } });
    }

    LAB_RENDERS.push(draw);
    mount();
    draw();
  };

  /* ============================================================
     4. Acid–base — pH, compensation, anion gap
     ============================================================ */

  LAB.acidbase = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var defaults = { paco2: 40, hco3: 24, na: 140, cl: 104, alb: 4 };
    var state = Object.assign({}, defaults);
    var presets = {
      normal: { paco2: 40, hco3: 24, na: 140, cl: 104, alb: 4 },
      dka: { paco2: 25, hco3: 10, na: 138, cl: 100, alb: 3.5 },
      copd: { paco2: 60, hco3: 30, na: 140, cl: 98, alb: 4 },
      vomiting: { paco2: 45, hco3: 32, na: 140, cl: 92, alb: 4 },
      salicylate: { paco2: 25, hco3: 12, na: 140, cl: 100, alb: 4 },
      mixed: { paco2: 30, hco3: 14, na: 140, cl: 100, alb: 3 }
    };

    function model() {
      var ph = 6.1 + Math.log10(state.hco3 / (0.03 * state.paco2));
      var ag = state.na - (state.cl + state.hco3);
      var agCorr = ag + 2.5 * (4 - state.alb);
      var delta = state.hco3 < 24 ? (ag - 12) / (24 - state.hco3) : null;
      var expected = null;
      var expectedLabel = "";
      var primary = "";
      if (ph < 7.35 && state.hco3 < 22) {
        primary = "Metabolik asidoz";
        expected = 1.5 * state.hco3 + 8;
        expectedLabel = "Winter: PaCO₂ " + fmt(expected, 0) + " ± 2";
      } else if (ph < 7.35 && state.paco2 > 45) {
        primary = "Respiratuar asidoz";
        expected = 24 + 0.1 * (state.paco2 - 40);
        expectedLabel = "Akut beklenen HCO₃⁻ " + fmt(expected, 0) + " (kronik: " + fmt(24 + 0.35 * (state.paco2 - 40), 0) + ")";
      } else if (ph > 7.45 && state.hco3 > 26) {
        primary = "Metabolik alkaloz";
        expected = 0.7 * state.hco3 + 21;
        expectedLabel = "Beklenen PaCO₂ " + fmt(expected, 0) + " ± 2";
      } else if (ph > 7.45 && state.paco2 < 35) {
        primary = "Respiratuar alkaloz";
        expected = 24 - 0.2 * (40 - state.paco2);
        expectedLabel = "Akut beklenen HCO₃⁻ " + fmt(expected, 0) + " (kronik: " + fmt(24 - 0.4 * (40 - state.paco2), 0) + ")";
      } else if (ph >= 7.35 && ph <= 7.45 && ag > 12) {
        primary = "Normal pH + yüksek anyon açığı";
        expectedLabel = "Gizli metabolik asidoz olabilir";
      } else {
        primary = "Normal asit-baz dengesi";
        expectedLabel = "Beklenen aralık içinde";
      }
      return { ph: ph, ag: ag, agCorr: agCorr, delta: delta, expected: expected, expectedLabel: expectedLabel, primary: primary };
    }

    function draw() {
      var c = setupCanvas(canvas, 360);
      var ctx = c.ctx;
      var w = c.w;
      var h = c.h;
      var pal = palette();
      var box = { x: 58, y: 28, w: w - 86, h: h - 92 };
      var m = model();
      axes(ctx, box, 7.0, 7.6, 0, 40, {
        xLabel: "pH", yLabel: "HCO₃⁻ (mEq/L)", xTicks: 6, yTicks: 5,
        xFormat: function (v) { return v.toFixed(1); }
      });

      // Normal pH band
      ctx.save();
      ctx.fillStyle = pal.band;
      var x1 = plot(box, 7.0, 7.6, 0, 40, 7.35, 0).x;
      var x2 = plot(box, 7.0, 7.6, 0, 40, 7.45, 0).x;
      ctx.fillRect(x1, box.y, x2 - x1, box.h);
      ctx.restore();
      label(ctx, "normal pH", (x1 + x2) / 2, box.y + 12, pal.muted, 9, "center");

      // PaCO2 isobars
      [20, 40, 60, 80].forEach(function (pco2) {
        ctx.save();
        ctx.strokeStyle = pal.ruleStrong;
        ctx.lineWidth = 1;
        ctx.setLineDash(pco2 === 40 ? [] : [3, 4]);
        ctx.beginPath();
        for (var i = 0; i <= 120; i += 1) {
          var ph = 7.0 + i * 0.005;
          var hco3 = 0.03 * pco2 * Math.pow(10, ph - 6.1);
          if (hco3 > 40) break;
          var pt = plot(box, 7.0, 7.6, 0, 40, ph, hco3);
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.restore();
        var labelPt = plot(box, 7.0, 7.6, 0, 40, 7.58, clamp(0.03 * pco2 * Math.pow(10, 7.58 - 6.1), 0, 39));
        label(ctx, "PaCO₂ " + pco2, labelPt.x - 4, labelPt.y, pal.muted, 8, "right");
      });

      var point = plot(box, 7.0, 7.6, 0, 40, clamp(m.ph, 7.0, 7.6), clamp(state.hco3, 0, 40));
      dot(ctx, point.x, point.y, 5, pal.accent, pal.sheet);
      label(ctx, "pH " + fmt(m.ph, 2), point.x + 6, point.y - 8, pal.accent, 10, "left", "alphabetic", 600);

      setReadout(root, [
        ["pH", fmt(m.ph, 2)],
        ["Primer", m.primary],
        ["Anyon açığı", fmt(m.ag, 0) + " mEq/L"],
        ["Düzeltilmiş AG", fmt(m.agCorr, 1) + " mEq/L"],
        ["Delta oranı", m.delta === null ? "—" : fmt(m.delta, 2)],
        ["Beklenen", m.expectedLabel]
      ]);
      var status;
      if (m.primary.indexOf("Metabolik asidoz") === 0) status = "Metabolik asidozda Winter formülü beklenen PaCO₂'yi verir. Ölçülen değer beklenenden yüksekse ek respiratuar asidoz, düşükse ek respiratuar alkaloz düşün.";
      else if (m.primary.indexOf("Metabolik alkaloz") === 0) status = "Metabolik alkalozda beklenen PaCO₂ = 0,7 × HCO₃⁻ + 21. Kompansasyon pH'ı genellikle tamamen normale döndürmez; 'tam kompansasyon' varsayımıyla hareket etme.";
      else if (m.primary.indexOf("Respiratuar") === 0) status = "Respiratuar bozuklukta akut ve kronik beklenen HCO₃⁻ farklıdır. Renal kompansasyon saatler–günler alır; tek bir değerle kroniklik iddia etme.";
      else if (m.ag > 12) status = "pH normal olsa bile anyon açığı yüksekse gizli metabolik asidoz olabilir. Albümin düşükse düzeltilmiş AG'yi kullan: AG + 2,5 × (4 − albümin).";
      else status = "pH, PaCO₂ ve HCO₃⁻ birbirini tutuyor. Her laba albümin ve elektrolitleri ekle; anyon açığı olmadan tek başına pH yorumu eksik kalır.";
      setStatus(root, status);
      setPrint(root, "Asit-baz: pH " + fmt(m.ph, 2) + ", HCO₃⁻ " + fmt(state.hco3, 0) + " mEq/L, PaCO₂ " + fmt(state.paco2, 0) + " mmHg, AG " + fmt(m.ag, 0) + ", düzeltilmiş AG " + fmt(m.agCorr, 1) + ".");
      setAria(canvas, "Asit-baz nomogramı: pH " + fmt(m.ph, 2) + ", bikarbonat " + fmt(state.hco3, 0) + " milieşdeğer, anyon açığı " + fmt(m.ag, 0) + ".");
    }

    function mount() {
      controls.replaceChildren();
      addRange(controls, { label: "PaCO₂", min: 15, max: 90, step: 1, value: state.paco2, format: function (v) { return v.toFixed(0) + " mmHg"; }, onInput: function (v) { state.paco2 = v; draw(); } });
      addRange(controls, { label: "HCO₃⁻", min: 4, max: 40, step: 1, value: state.hco3, format: function (v) { return v.toFixed(0) + " mEq/L"; }, onInput: function (v) { state.hco3 = v; draw(); } });
      addRange(controls, { label: "Na⁺", min: 120, max: 155, step: 1, value: state.na, format: function (v) { return v.toFixed(0) + " mEq/L"; }, onInput: function (v) { state.na = v; draw(); } });
      addRange(controls, { label: "Cl⁻", min: 85, max: 120, step: 1, value: state.cl, format: function (v) { return v.toFixed(0) + " mEq/L"; }, onInput: function (v) { state.cl = v; draw(); } });
      addRange(controls, { label: "Albümin", min: 1.5, max: 5.5, step: 0.1, value: state.alb, format: function (v) { return v.toFixed(1) + " g/dL"; }, onInput: function (v) { state.alb = v; draw(); } });
      Object.keys(presets).forEach(function (key) {
        addButton(controls, { label: key, ghost: true, onClick: function () { state = Object.assign({}, presets[key]); mount(); draw(); } });
      });
      addButton(controls, { label: "Sıfırla", ghost: true, onClick: function () { state = Object.assign({}, defaults); mount(); draw(); } });
    }

    LAB_RENDERS.push(draw);
    mount();
    draw();
  };

  /* ============================================================
     5. Pharmacokinetics — one-compartment IV/oral
     ============================================================ */

  LAB.pk = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var defaults = { dose: 100, vd: 50, cl: 5, f: 0.6, ka: 1.0, route: "oral", hours: 48 };
    var state = Object.assign({}, defaults);
    var presets = {
      iv: { dose: 100, vd: 50, cl: 5, f: 1, ka: 1, route: "iv", hours: 48 },
      oral: { dose: 100, vd: 50, cl: 5, f: 0.6, ka: 1, route: "oral", hours: 48 },
      slow: { dose: 100, vd: 50, cl: 5, f: 0.6, ka: 0.2, route: "oral", hours: 48 },
      highclear: { dose: 100, vd: 50, cl: 15, f: 1, ka: 1, route: "iv", hours: 24 }
    };

    function model() {
      var k = state.cl / state.vd;
      var t12 = Math.log(2) / k;
      var auc = state.route === "iv" ? state.dose / state.cl : state.f * state.dose / state.cl;
      var cmax = 0;
      var tmax = 0;
      for (var i = 0; i <= 2000; i += 1) {
        var t = state.hours * i / 2000;
        var c = conc(t);
        if (c > cmax) { cmax = c; tmax = t; }
      }
      return { k: k, t12: t12, auc: auc, cmax: cmax, tmax: tmax };
    }

    function conc(t) {
      var k = state.cl / state.vd;
      if (state.route === "iv") {
        return state.dose / state.vd * Math.exp(-k * t);
      }
      var ka = state.ka;
      var scale = state.f * state.dose * ka / (state.vd * (ka - k));
      if (Math.abs(ka - k) < 1e-6) {
        return state.f * state.dose * ka / state.vd * t * Math.exp(-k * t);
      }
      return scale * (Math.exp(-k * t) - Math.exp(-ka * t));
    }

    function draw() {
      var c = setupCanvas(canvas, 360);
      var ctx = c.ctx;
      var w = c.w;
      var h = c.h;
      var pal = palette();
      var box = { x: 58, y: 28, w: w - 86, h: h - 92 };
      var m = model();
      var cmaxPlot = Math.max(0.1, m.cmax * 1.25);
      axes(ctx, box, 0, state.hours, 0, cmaxPlot, {
        xLabel: "Zaman (saat)", yLabel: "Plazma konsantrasyonu (mg/L)",
        xTicks: 6, yTicks: 5,
        xFormat: function (v) { return v.toFixed(0); },
        yFormat: function (v) { return v.toFixed(1); }
      });
      ctx.save();
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var i = 0; i <= 600; i += 1) {
        var t = state.hours * i / 600;
        var pt = plot(box, 0, state.hours, 0, cmaxPlot, t, clamp(conc(t), 0, cmaxPlot * 1.2));
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();
      var peak = plot(box, 0, state.hours, 0, cmaxPlot, m.tmax, m.cmax);
      dot(ctx, peak.x, peak.y, 4, pal.accent, pal.sheet);
      label(ctx, "Cmax " + fmt(m.cmax, 2) + " mg/L", peak.x + 6, peak.y - 7, pal.accent, 9);

      setReadout(root, [
        ["k", fmt(m.k, 3) + " h⁻¹"],
        ["t½", fmt(m.t12, 1) + " saat"],
        ["Cmax", fmt(m.cmax, 2) + " mg/L"],
        ["Tmax", fmt(m.tmax, 1) + " saat"],
        ["AUC", fmt(m.auc, 1) + " mg·h/L"],
        ["Vd", fmt(state.vd, 0) + " L"],
        ["CL", fmt(state.cl, 1) + " L/saat"]
      ]);
      var status;
      if (state.route === "iv") status = "IV bolusta Cmax doza ve Vd'ye bağlıdır; t½ yalnızca CL ve Vd ile belirlenir. Doz iki katına çıkarsa eğri yükselir, t½ değişmez.";
      else if (state.ka > 2) status = "Hızlı absorpsiyon: Tmax kısalır, Cmax yükselir. Absorpsiyon hızı (ka) ile eliminasyon hızı (k) farklı şeylerdir.";
      else if (state.ka < 0.4) status = "Yavaş absorpsiyon: Cmax düşer ve Tmax uzar; AUC değişmez çünkü AUC F·D/CL'ye bağlıdır. Flip-flop kinetiği ancak ka << k iken konuşulur.";
      else if (state.f < 0.5) status = "Düşük biyoyararlanım: aynı dozda sistemik maruziyet (AUC) azalır. F, ilk geçiş ve absorpsiyon kaybını birlikte temsil eder.";
      else status = "Tek kompartman modeli: dağılım anlık, eliminasyon birinci mertebeden. Gerçek hastada iki kompartman, aktif metabolit ve doz bağımlılık olabilir.";
      setStatus(root, status);
      setPrint(root, "PK: " + (state.route === "iv" ? "IV" : "oral") + " " + fmt(state.dose, 0) + " mg, Cmax " + fmt(m.cmax, 2) + " mg/L, Tmax " + fmt(m.tmax, 1) + " saat, t½ " + fmt(m.t12, 1) + " saat, AUC " + fmt(m.auc, 1) + " mg·h/L.");
      setAria(canvas, "Farmakokinetik konsantrasyon-zaman eğrisi: Cmax " + fmt(m.cmax, 2) + " miligram/litre, yarılanma ömrü " + fmt(m.t12, 1) + " saat.");
    }

    function mount() {
      controls.replaceChildren();
      addSelect(controls, {
        label: "Yol", value: state.route,
        options: [{ value: "iv", label: "IV bolus" }, { value: "oral", label: "Oral" }],
        onChange: function (v) { state.route = v; draw(); }
      });
      addRange(controls, { label: "Doz", min: 10, max: 500, step: 10, value: state.dose, format: function (v) { return v.toFixed(0) + " mg"; }, onInput: function (v) { state.dose = v; draw(); } });
      addRange(controls, { label: "Vd", min: 5, max: 150, step: 1, value: state.vd, format: function (v) { return v.toFixed(0) + " L"; }, onInput: function (v) { state.vd = v; draw(); } });
      addRange(controls, { label: "CL", min: 0.5, max: 20, step: 0.5, value: state.cl, format: function (v) { return v.toFixed(1) + " L/saat"; }, onInput: function (v) { state.cl = v; draw(); } });
      addRange(controls, { label: "F", min: 0.1, max: 1, step: 0.05, value: state.f, format: function (v) { return v.toFixed(2); }, onInput: function (v) { state.f = v; draw(); } });
      addRange(controls, { label: "ka", min: 0.1, max: 5, step: 0.1, value: state.ka, format: function (v) { return v.toFixed(1) + " h⁻¹"; }, onInput: function (v) { state.ka = v; draw(); } });
      Object.keys(presets).forEach(function (key) {
        addButton(controls, { label: key, ghost: true, onClick: function () { state = Object.assign({}, presets[key]); mount(); draw(); } });
      });
      addButton(controls, { label: "Sıfırla", ghost: true, onClick: function () { state = Object.assign({}, defaults); mount(); draw(); } });
    }

    LAB_RENDERS.push(draw);
    mount();
    draw();
  };

  /* ============================================================
     6. Pharmacodynamics — Emax, EC50, antagonism
     ============================================================ */

  LAB.pd = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var defaults = { emax: 100, ec50: 1, n: 1, mode: "none", i: 0, ki: 1 };
    var state = Object.assign({}, defaults);
    var presets = {
      full: { emax: 100, ec50: 1, n: 1, mode: "none", i: 0, ki: 1 },
      partial: { emax: 40, ec50: 1, n: 1, mode: "none", i: 0, ki: 1 },
      competitive: { emax: 100, ec50: 1, n: 1, mode: "comp", i: 1, ki: 1 },
      noncomp: { emax: 100, ec50: 1, n: 1, mode: "noncomp", i: 1, ki: 1 },
      steep: { emax: 100, ec50: 1, n: 3, mode: "none", i: 0, ki: 1 }
    };

    function model() {
      var ec50Eff = state.ec50;
      var emaxEff = state.emax;
      if (state.mode === "comp") ec50Eff = state.ec50 * (1 + state.i / state.ki);
      if (state.mode === "noncomp") emaxEff = state.emax / (1 + state.i / state.ki);
      return { ec50Eff: ec50Eff, emaxEff: emaxEff, dr: ec50Eff / state.ec50 };
    }

    function effect(c, ec50, emax) {
      var n = state.n;
      return emax * Math.pow(c, n) / (Math.pow(ec50, n) + Math.pow(c, n));
    }

    function draw() {
      var c = setupCanvas(canvas, 350);
      var ctx = c.ctx;
      var w = c.w;
      var h = c.h;
      var pal = palette();
      var box = { x: 58, y: 26, w: w - 86, h: h - 88 };
      var m = model();
      axes(ctx, box, -2, 2, 0, 100, {
        xLabel: "log₁₀ konsantrasyon (mg/L)", yLabel: "Etki (%)",
        xTicks: 4, yTicks: 5,
        xFormat: function (v) { return v.toFixed(0); }
      });
      function curve(ec50, emax, color, width, dash) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        if (dash) ctx.setLineDash(dash);
        ctx.beginPath();
        for (var i = 0; i <= 200; i += 1) {
          var logc = -2 + i * 4 / 200;
          var conc = Math.pow(10, logc);
          var pt = plot(box, -2, 2, 0, 100, logc, effect(conc, ec50, emax));
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.restore();
      }
      curve(state.ec50, state.emax, pal.ruleStrong, 1.2, [4, 3]);
      curve(m.ec50Eff, m.emaxEff, pal.accent, 2.6);
      var x50 = Math.log10(m.ec50Eff);
      if (x50 >= -2 && x50 <= 2) {
        var p50 = plot(box, -2, 2, 0, 100, x50, m.emaxEff / 2);
        dot(ctx, p50.x, p50.y, 4, pal.def, pal.sheet);
        line(ctx, box.x, p50.y, p50.x, p50.y, pal.gridStrong, 1, [2, 3]);
        line(ctx, p50.x, p50.y, p50.x, box.y + box.h, pal.gridStrong, 1, [2, 3]);
        label(ctx, "EC50′ " + fmt(m.ec50Eff, 2), p50.x + 6, p50.y - 7, pal.def, 9);
      }

      setReadout(root, [
        ["Emax", fmt(state.emax, 0) + "%"],
        ["EC50", fmt(state.ec50, 2) + " mg/L"],
        ["EC50′", fmt(m.ec50Eff, 2) + " mg/L"],
        ["Emax′", fmt(m.emaxEff, 0) + "%"],
        ["Doz oranı", fmt(m.dr, 1) + "×"],
        ["Hill n", fmt(state.n, 1)]
      ]);
      var status;
      if (state.mode === "comp") status = "Kompetitif antagonizma eğriyi sağa kaydırır, Emax'ı korur. [I] = Ki olduğunda EC50 iki katına çıkar; bu, geri dönüşlü ve doz artırılarak aşılabilen bir bloktur.";
      else if (state.mode === "noncomp") status = "Nonkompetitif antagonizma Emax'ı düşürür; EC50 çoğu zaman değişmez. Doz artırmak tavan etkiyi geri getirmez.";
      else if (state.emax < 60) status = "Parsiyel agonist: Emax düşük, EC50 normal olabilir. Etkinlik (Emax) ile güç (EC50) ayrı kavramlardır.";
      else if (state.n > 2) status = "Dik Hill katsayısı eğriyi keskinleştirir; küçük konsantrasyon değişiklikleri etkide büyük sıçrama yapar. Reseptör rezervi ve kooperativite bu eğriyi değiştirebilir.";
      else status = "Emax tavan etkiyi, EC50 yarı maksimal etkiyi veren konsantrasyonu gösterir. EC50, Kd değildir; güç ile afinite aynı şey değildir.";
      setStatus(root, status);
      setPrint(root, "PD: Emax " + fmt(state.emax, 0) + "%, EC50 " + fmt(state.ec50, 2) + " mg/L, mod " + state.mode + ", EC50′ " + fmt(m.ec50Eff, 2) + " mg/L.");
      setAria(canvas, "Doz-yanıt eğrisi: Emax " + fmt(state.emax, 0) + " yüzde, EC50 " + fmt(state.ec50, 2) + " miligram/litre.");
    }

    function mount() {
      controls.replaceChildren();
      addSelect(controls, {
        label: "Antagonizma", value: state.mode,
        options: [{ value: "none", label: "Yok" }, { value: "comp", label: "Kompetitif" }, { value: "noncomp", label: "Nonkompetitif" }],
        onChange: function (v) { state.mode = v; draw(); }
      });
      addRange(controls, { label: "Emax", min: 10, max: 100, step: 5, value: state.emax, format: function (v) { return v.toFixed(0) + "%"; }, onInput: function (v) { state.emax = v; draw(); } });
      addRange(controls, { label: "EC50", min: 0.05, max: 10, step: 0.05, value: state.ec50, format: function (v) { return v.toFixed(2) + " mg/L"; }, onInput: function (v) { state.ec50 = v; draw(); } });
      addRange(controls, { label: "Hill n", min: 0.5, max: 4, step: 0.1, value: state.n, format: function (v) { return v.toFixed(1); }, onInput: function (v) { state.n = v; draw(); } });
      addRange(controls, { label: "[I]", min: 0, max: 10, step: 0.1, value: state.i, format: function (v) { return v.toFixed(1) + " mg/L"; }, onInput: function (v) { state.i = v; draw(); } });
      addRange(controls, { label: "Ki", min: 0.1, max: 10, step: 0.1, value: state.ki, format: function (v) { return v.toFixed(1) + " mg/L"; }, onInput: function (v) { state.ki = v; draw(); } });
      Object.keys(presets).forEach(function (key) {
        addButton(controls, { label: key, ghost: true, onClick: function () { state = Object.assign({}, presets[key]); mount(); draw(); } });
      });
      addButton(controls, { label: "Sıfırla", ghost: true, onClick: function () { state = Object.assign({}, defaults); mount(); draw(); } });
    }

    LAB_RENDERS.push(draw);
    mount();
    draw();
  };

  /* ============================================================
     7. 2×2 table — sensitivity, specificity, PPV
     ============================================================ */

  LAB.epi = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var defaults = { prevalence: 10, sens: 90, spec: 95 };
    var state = Object.assign({}, defaults);
    var presets = {
      screening: { prevalence: 1, sens: 90, spec: 95 },
      clinic: { prevalence: 20, sens: 90, spec: 95 },
      confirm: { prevalence: 50, sens: 95, spec: 99 },
      rare: { prevalence: 0.1, sens: 99, spec: 99 }
    };

    function model() {
      var n = 1000;
      var p = state.prevalence / 100;
      var sens = state.sens / 100;
      var spec = state.spec / 100;
      var tp = Math.round(n * p * sens);
      var fn = Math.round(n * p * (1 - sens));
      var fp = Math.round(n * (1 - p) * (1 - spec));
      var tn = Math.round(n * (1 - p) * spec);
      var ppv = tp + fp > 0 ? tp / (tp + fp) : 1;
      var npv = tn + fn > 0 ? tn / (tn + fn) : 1;
      var lrp = spec < 1 ? sens / (1 - spec) : Infinity;
      var lrn = sens > 0 ? (1 - sens) / spec : Infinity;
      return { n: n, tp: tp, fn: fn, fp: fp, tn: tn, ppv: ppv, npv: npv, lrp: lrp, lrn: lrn };
    }

    function draw() {
      var c = setupCanvas(canvas, 360);
      var ctx = c.ctx;
      var w = c.w;
      var h = c.h;
      var pal = palette();
      var m = model();
      var x = 46;
      var y = 46;
      var cw = Math.min(150, (w - 100) / 3);
      var ch = 48;

      // table
      ctx.save();
      ctx.strokeStyle = pal.ruleStrong;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cw * 3, ch * 3);
      for (var i = 1; i < 3; i += 1) {
        line(ctx, x + cw * i, y, x + cw * i, y + ch * 3, pal.rule, 1);
        line(ctx, x, y + ch * i, x + cw * 3, y + ch * i, pal.rule, 1);
      }
      ctx.restore();
      label(ctx, "", x, y, pal.muted, 10);
      label(ctx, "Hasta +", x + cw * 1.5, y + 18, pal.muted, 10, "center");
      label(ctx, "Hasta −", x + cw * 2.5, y + 18, pal.muted, 10, "center");
      label(ctx, "Test +", x + 8, y + ch + 28, pal.muted, 10);
      label(ctx, "Test −", x + 8, y + ch * 2 + 28, pal.muted, 10);
      label(ctx, "TP " + m.tp, x + cw * 1.5, y + ch + 30, pal.ink, 12, "center", "alphabetic", 600);
      label(ctx, "FP " + m.fp, x + cw * 2.5, y + ch + 30, pal.ink, 12, "center", "alphabetic", 600);
      label(ctx, "FN " + m.fn, x + cw * 1.5, y + ch * 2 + 30, pal.ink, 12, "center", "alphabetic", 600);
      label(ctx, "TN " + m.tn, x + cw * 2.5, y + ch * 2 + 30, pal.ink, 12, "center", "alphabetic", 600);

      // outcome bar
      var bx = x;
      var by = y + ch * 3 + 30;
      var bw = cw * 3;
      var bh = 26;
      var total = m.tp + m.fn + m.fp + m.tn;
      var segments = [
        { v: m.tp, color: pal.ex, label: "TP" },
        { v: m.fn, color: pal.warn, label: "FN" },
        { v: m.fp, color: pal.accent, label: "FP" },
        { v: m.tn, color: pal.ruleStrong, label: "TN" }
      ];
      var cursor = bx;
      segments.forEach(function (seg) {
        var width = bw * seg.v / total;
        ctx.save();
        ctx.fillStyle = seg.color;
        ctx.fillRect(cursor, by, width, bh);
        ctx.restore();
        if (width > 28) label(ctx, seg.label, cursor + width / 2, by + 17, "#fffdf8", 9, "center", "alphabetic", 600);
        cursor += width;
      });
      label(ctx, "1000 kişilik kohort", bx, by + bh + 16, pal.muted, 9);
      label(ctx, "PPV " + pct(m.ppv, 1) + " · NPV " + pct(m.npv, 1), bx, by + bh + 34, pal.ink, 11, "left", "alphabetic", 600);

      setReadout(root, [
        ["Prevalans", fmt(state.prevalence, 1) + "%"],
        ["Sensitivite", fmt(state.sens, 0) + "%"],
        ["Spesifite", fmt(state.spec, 0) + "%"],
        ["PPV", pct(m.ppv, 1)],
        ["NPV", pct(m.npv, 1)],
        ["LR+", m.lrp === Infinity ? "∞" : fmt(m.lrp, 1)],
        ["LR−", fmt(m.lrn, 2)],
        ["Doğruluk", pct((m.tp + m.tn) / m.n, 1)]
      ]);
      var status;
      if (state.prevalence < 2 && m.ppv < 0.5) status = "Aynı sensitivite ve spesifite, düşük prevalansta düşük PPV üretir. Testin 'doğruluğu' sabit; pozitif testin anlamı prevalansla değişir.";
      else if (state.spec > 98 && state.prevalence < 10) status = "Yüksek spesifiteye rağmen düşük prevalansta yalancı pozitifler gerçek pozitifleri geçebilir. PPV = TP/(TP+FP); prevalansı görmezden gelme.";
      else if (m.ppv > 0.9) status = "Yüksek PPV: pozitif test gerçekten hastalık olasılığını belirgin artırıyor. Yine de test öncesi olasılık ve doğrulama testi bağlamı gerekir.";
      else status = "Sensitivite hastaları, spesifite sağlıklıları yakalar; PPV ise pozitif testin içindeki gerçek hasta oranıdır. Dördü farklı sorulara cevap verir.";
      setStatus(root, status);
      setPrint(root, "2×2: prevalans " + fmt(state.prevalence, 1) + "%, sensitivite " + fmt(state.sens, 0) + "%, spesifite " + fmt(state.spec, 0) + "%, PPV " + pct(m.ppv, 1) + ", NPV " + pct(m.npv, 1) + ".");
      setAria(canvas, "İkiye iki tablosu: doğru pozitif " + m.tp + ", yanlış pozitif " + m.fp + ", yanlış negatif " + m.fn + ", doğru negatif " + m.tn + ".");
    }

    function mount() {
      controls.replaceChildren();
      addRange(controls, { label: "Prevalans", min: 0.1, max: 50, step: 0.1, value: state.prevalence, format: function (v) { return v.toFixed(1) + "%"; }, onInput: function (v) { state.prevalence = v; draw(); } });
      addRange(controls, { label: "Sensitivite", min: 50, max: 100, step: 1, value: state.sens, format: function (v) { return v.toFixed(0) + "%"; }, onInput: function (v) { state.sens = v; draw(); } });
      addRange(controls, { label: "Spesifite", min: 50, max: 100, step: 1, value: state.spec, format: function (v) { return v.toFixed(0) + "%"; }, onInput: function (v) { state.spec = v; draw(); } });
      Object.keys(presets).forEach(function (key) {
        addButton(controls, { label: key, ghost: true, onClick: function () { state = Object.assign({}, presets[key]); mount(); draw(); } });
      });
      addButton(controls, { label: "Sıfırla", ghost: true, onClick: function () { state = Object.assign({}, defaults); mount(); draw(); } });
    }

    LAB_RENDERS.push(draw);
    mount();
    draw();
  };

  /* ============================================================
     8. Visual field defect localizer
     ============================================================ */

  LAB.visualfield = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var defaults = { lesion: "chiasm" };
    var state = Object.assign({}, defaults);
    var lesions = {
      "optic-left": { label: "Sol optik sinir", pattern: "Sol monoküler görme kaybı", macula: "Tüm alan", note: "Optik sinir lezyonu: aynı gözde tam kayıp. Pupil refleksi etkilenebilir." },
      "optic-right": { label: "Sağ optik sinir", pattern: "Sağ monoküler görme kaybı", macula: "Tüm alan", note: "Optik sinir lezyonu: aynı gözde tam kayıp. Pupil refleksi etkilenebilir." },
      "chiasm": { label: "Kiazma", pattern: "Bitemporal hemianopi", macula: "Temporal alanlar", note: "Kiazmada çaprazlaşan nazal retinal lifler etkilenir: her iki gözde temporal alan kaybı." },
      "tract-left": { label: "Sol optik trakt", pattern: "Sağ homonim hemianopi", macula: "Sağ yarı alan", note: "Retrokiazmal lezyon: her iki gözde aynı taraf (lezyonun karşısı) yarı alan kaybı." },
      "tract-right": { label: "Sağ optik trakt", pattern: "Sol homonim hemianopi", macula: "Sol yarı alan", note: "Retrokiazmal lezyon: her iki gözde aynı taraf yarı alan kaybı." },
      "meyer-left": { label: "Sol Meyer halkası (temporal lob)", pattern: "Sağ üst kuadrantanopi", macula: "Üst kadran", note: "Temporal lob lezyonu: üst kuadrant; okuma ve yüz tanıma ipuçları eşlik edebilir." },
      "parietal-left": { label: "Sol parietal radyasyon", pattern: "Sağ alt kuadrantanopi", macula: "Alt kadran", note: "Parietal lezyon: alt kuadrant; optik ataksi ve ihmal eşlik edebilir." },
      "occipital-left": { label: "Sol oksipital korteks", pattern: "Sağ homonim hemianopi + makula korunması", macula: "Korunur", note: "Oksipital kutup makulayı korur; posterior serebral arter infarktı tipik örnektir." },
      "macula-left": { label: "Sol makula", pattern: "Santral skotom", macula: "Kayıp", note: "Makula lezyonu: santral görme kaybı; periferik alan korunur." }
    };

    function lost(eye, x, y) {
      // x,y in [-1,1], y up. Eye: -1 left, +1 right.
      var r = Math.hypot(x, y);
      if (r > 1) return false;
      var side = state.lesion;
      if (side === "optic-left") return eye < 0;
      if (side === "optic-right") return eye > 0;
      if (side === "chiasm") return (eye < 0 && x < 0) || (eye > 0 && x > 0);
      if (side === "tract-left") return x > 0;
      if (side === "tract-right") return x < 0;
      if (side === "meyer-left") return x > 0 && y > 0;
      if (side === "parietal-left") return x > 0 && y < 0;
      if (side === "occipital-left") return x > 0 && r > 0.18;
      if (side === "macula-left") return eye < 0 && r < 0.28;
      return false;
    }

    function draw() {
      var c = setupCanvas(canvas, 350);
      var ctx = c.ctx;
      var w = c.w;
      var h = c.h;
      var pal = palette();
      var centers = [{ x: w * 0.27, y: 175, eye: -1, label: "Sol göz" }, { x: w * 0.73, y: 175, eye: 1, label: "Sağ göz" }];
      var radius = Math.min(112, w * 0.19);
      centers.forEach(function (eye) {
        ctx.save();
        ctx.fillStyle = pal.sheet;
        ctx.strokeStyle = pal.ruleStrong;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(eye.x, eye.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.clip();
        for (var gx = -1; gx <= 1.001; gx += 0.1) {
          for (var gy = -1; gy <= 1.001; gy += 0.1) {
            if (Math.hypot(gx, gy) > 1) continue;
            if (lost(eye.eye, gx, gy)) {
              ctx.fillStyle = pal.loss;
              ctx.globalAlpha = 0.55;
              ctx.beginPath();
              ctx.arc(eye.x + gx * radius, eye.y - gy * radius, radius * 0.075, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        ctx.restore();
        // cross and macula
        line(ctx, eye.x - radius, eye.y, eye.x + radius, eye.y, pal.rule, 1);
        line(ctx, eye.x, eye.y - radius, eye.x, eye.y + radius, pal.rule, 1);
        dot(ctx, eye.x, eye.y, 3, pal.spared, pal.sheet);
        label(ctx, eye.label, eye.x, eye.y + radius + 20, pal.ink, 11, "center", "alphabetic", 600);
        label(ctx, "T", eye.x + (eye.eye < 0 ? -radius + 14 : radius - 14), eye.y - radius + 16, pal.muted, 9, "center", "alphabetic", 600);
      });

      var info = lesions[state.lesion];
      setReadout(root, [
        ["Lezyon", info.label],
        ["Patern", info.pattern],
        ["Makula", info.macula]
      ]);
      setStatus(root, info.note + " Görme alanı şeması sentetiktir; gerçek perimetri değildir.");
      setPrint(root, "Görme alanı: " + info.label + " → " + info.pattern + ".");
      setAria(canvas, "Görme alanı şeması: " + info.pattern + ".");
    }

    function mount() {
      controls.replaceChildren();
      addSelect(controls, {
        label: "Lezyon", value: state.lesion,
        options: Object.keys(lesions).map(function (key) { return { value: key, label: lesions[key].label }; }),
        onChange: function (v) { state.lesion = v; draw(); }
      });
      addButton(controls, { label: "Sıfırla", ghost: true, onClick: function () { state = Object.assign({}, defaults); mount(); draw(); } });
    }

    LAB_RENDERS.push(draw);
    mount();
    draw();
  };

  /* ============================================================
     9. CT window / level
     ============================================================ */

  LAB.ct = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var defaults = { ww: 80, wl: 40, probe: null };
    var state = Object.assign({}, defaults);
    var presets = {
      brain: { ww: 80, wl: 40 },
      stroke: { ww: 40, wl: 40 },
      subdural: { ww: 150, wl: 50 },
      bone: { ww: 2000, wl: 500 },
      soft: { ww: 400, wl: 50 }
    };

    function huColor(hu) {
      var lo = state.wl - state.ww / 2;
      var hi = state.wl + state.ww / 2;
      var g = clamp((hu - lo) / (hi - lo), 0, 1);
      var v = Math.round(g * 255);
      return "rgb(" + v + "," + v + "," + v + ")";
    }

    function structures(w, h) {
      return [
        { name: "Hava", hu: -1000, ellipse: [w * 0.5, h * 0.48, w * 0.47, h * 0.46] },
        { name: "Saçlı deri / yağ", hu: -80, ellipse: [w * 0.5, h * 0.48, w * 0.40, h * 0.41] },
        { name: "Kemik (kalvaryum)", hu: 1000, ellipse: [w * 0.5, h * 0.48, w * 0.36, h * 0.38] },
        { name: "Gri madde", hu: 40, ellipse: [w * 0.5, h * 0.48, w * 0.32, h * 0.34] },
        { name: "Beyaz madde", hu: 30, ellipse: [w * 0.5, h * 0.48, w * 0.27, h * 0.29] },
        { name: "Ventrikül (BOS)", hu: 10, ellipse: [w * 0.46, h * 0.45, w * 0.045, h * 0.08] },
        { name: "Ventrikül (BOS)", hu: 10, ellipse: [w * 0.54, h * 0.45, w * 0.045, h * 0.08] },
        { name: "Hematom", hu: 70, ellipse: [w * 0.58, h * 0.55, w * 0.06, h * 0.05] },
        { name: "Kalsifikasyon", hu: 400, ellipse: [w * 0.43, h * 0.56, w * 0.02, h * 0.02] }
      ];
    }

    function huAt(x, y) {
      var c = canvas.__cssW ? { w: canvas.__cssW, h: canvas.__cssH } : { w: 640, h: 360 };
      var list = structures(c.w, c.h);
      for (var i = list.length - 1; i >= 0; i -= 1) {
        var s = list[i];
        var dx = (x - s.ellipse[0]) / s.ellipse[2];
        var dy = (y - s.ellipse[1]) / s.ellipse[3];
        if (dx * dx + dy * dy <= 1) return s;
      }
      return { name: "Ara", hu: -1000 };
    }

    function draw() {
      var c = setupCanvas(canvas, 380);
      var ctx = c.ctx;
      var w = c.w;
      var h = c.h;
      var pal = palette();
      // background air
      ctx.fillStyle = huColor(-1000);
      ctx.fillRect(0, 0, w, h);
      var list = structures(w, h);
      list.forEach(function (s) {
        ctx.save();
        ctx.fillStyle = huColor(s.hu);
        ctx.beginPath();
        ctx.ellipse(s.ellipse[0], s.ellipse[1], s.ellipse[2], s.ellipse[3], 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      // side-by-side reference? no.
      label(ctx, "Sentetik aksiyal BT kesiti · WW " + fmt(state.ww, 0) + " / WL " + fmt(state.wl, 0), 14, 18, pal.muted, 10);
      label(ctx, "Beyin", w * 0.5, h - 18, pal.muted, 9, "center");
      if (state.probe) {
        var probe = state.probe;
        var s = huAt(probe.x, probe.y);
        line(ctx, probe.x - 14, probe.y, probe.x + 14, probe.y, pal.accent, 1.5);
        line(ctx, probe.x, probe.y - 14, probe.x, probe.y + 14, pal.accent, 1.5);
        label(ctx, s.name + " · " + fmt(s.hu, 0) + " HU", probe.x + 18, probe.y - 8, pal.accent, 10, "left", "alphabetic", 600);
      }
      setReadout(root, [
        ["WW", fmt(state.ww, 0) + " HU"],
        ["WL", fmt(state.wl, 0) + " HU"],
        ["Pencere", fmt(state.wl - state.ww / 2, 0) + " … " + fmt(state.wl + state.ww / 2, 0) + " HU"],
        ["Prob", state.probe ? fmt(huAt(state.probe.x, state.probe.y).hu, 0) + " HU" : "—"],
        ["Doku", state.probe ? huAt(state.probe.x, state.probe.y).name : "—"]
      ]);
      setStatus(root, state.probe ? "Prob " + huAt(state.probe.x, state.probe.y).name + " üzerinde. Aynı HU değeri farklı WW/WL ile farklı gri tonunda görünür; pencereleme tanıyı değil görüntülemeyi değiştirir." : "Kesite tıkla: aynı dokunun HU değeri sabit kalırken WW/WL değişince parlaklığının nasıl değiştiğini gör.");
      setPrint(root, "BT pencere: WW " + fmt(state.ww, 0) + " HU, WL " + fmt(state.wl, 0) + " HU.");
      setAria(canvas, "Sentetik aksiyal bilgisayarlı tomografi kesiti, pencere genişliği " + fmt(state.ww, 0) + ", pencere seviyesi " + fmt(state.wl, 0) + " Hounsfield birimi.");
    }

    function mount() {
      controls.replaceChildren();
      addRange(controls, { label: "WW", min: 20, max: 2000, step: 5, value: state.ww, format: function (v) { return v.toFixed(0) + " HU"; }, onInput: function (v) { state.ww = v; draw(); } });
      addRange(controls, { label: "WL", min: -200, max: 800, step: 5, value: state.wl, format: function (v) { return v.toFixed(0) + " HU"; }, onInput: function (v) { state.wl = v; draw(); } });
      Object.keys(presets).forEach(function (key) {
        addButton(controls, { label: key, ghost: true, onClick: function () { state.ww = presets[key].ww; state.wl = presets[key].wl; mount(); draw(); } });
      });
      addButton(controls, { label: "Sıfırla", ghost: true, onClick: function () { state = Object.assign({}, defaults); mount(); draw(); } });
    }

    // Pointer probe
    canvas.addEventListener("pointerdown", function (event) {
      var rect = canvas.getBoundingClientRect();
      var w = canvas.__cssW || rect.width;
      var h = canvas.__cssH || rect.height;
      state.probe = {
        x: (event.clientX - rect.left) * (w / rect.width),
        y: (event.clientY - rect.top) * (h / rect.height)
      };
      draw();
      event.preventDefault();
    });

    LAB_RENDERS.push(draw);
    mount();
    draw();
  };

  /* ============================================================
     10. Brachial plexus lesion localizer
     ============================================================ */

  LAB.brachial = function (root) {
    var canvas = $("[data-canvas]", root);
    var controls = $("[data-controls]", root);
    var defaults = { lesion: "C5-C6" };
    var state = Object.assign({}, defaults);
    var lesions = {
      "C5-C6": {
        label: "C5–C6 kök / üst trunkus (Erb)",
        nodes: ["C5", "C6", "superior"],
        deficits: ["Omuz abdüksiyonu zayıf (deltoid)", "Dirsek fleksiyonu zayıf (biceps, brachialis)", "Brachioradialis refleksi azalır", "Lateral kol ve ön kol duyusu azalır", "El intrinsikleri genellikle korunur"],
        spared: "El kasları ve T1 sempatik lifleri"
      },
      "C8-T1": {
        label: "C8–T1 kök / alt trunkus (Klumpke)",
        nodes: ["C8", "T1", "inferior"],
        deficits: ["El intrinsik kasları zayıf (interossei, lumbricals)", "Parmak fleksörleri zayıf", "Pençe el", "Medial kol/ön kol/el duyusu azalır", "T1 tutulumunda Horner sendromu olabilir"],
        spared: "Omuz ve dirsek proksimal kasları"
      },
      "middle": {
        label: "Orta trunkus (C7)",
        nodes: ["C7", "middle"],
        deficits: ["Triceps zayıf", "El bileği ekstansörleri zayıf", "Orta parmak duyusu azalır", "Dirsek ekstansiyonu ve el bileği ekstansiyonu güçsüz"],
        spared: "Omuz abdüksiyonu ve el intrinsikleri çoğunlukla korunur"
      },
      "lateral": {
        label: "Lateral kord",
        nodes: ["C5", "C6", "C7", "superior", "middle", "lateral"],
        deficits: ["Dirsek fleksiyonu zayıf (musculocutaneous)", "Ön kol pronasyonu ve bilek fleksiyonu zayıf (median lateral kök)", "Lateral ön kol duyusu azalır"],
        spared: "Omuz ve el intrinsikleri kısmen korunur"
      },
      "posterior": {
        label: "Posterior kord",
        nodes: ["C5", "C6", "C7", "C8", "T1", "superior", "middle", "inferior", "posterior"],
        deficits: ["Omuz abdüksiyonu ve dış rotasyonu zayıf (axillary)", "Dirsek, bilek ve parmak ekstansiyonu zayıf (radial)", "Posterior kol/ön kol duyusu azalır"],
        spared: "Dirsek fleksiyonu ve el intrinsikleri korunur"
      },
      "medial": {
        label: "Medial kord",
        nodes: ["C8", "T1", "inferior", "medial"],
        deficits: ["El intrinsik kasları zayıf (ulnar)", "Medial ön kol fleksörleri zayıf", "Medial el duyusu azalır", "Median medial kök tutulursa tenar kaslar zayıf"],
        spared: "Omuz ve dirsek proksimal kasları"
      },
      "whole": {
        label: "Tüm pleksus (pan-pleksus)",
        nodes: ["C5", "C6", "C7", "C8", "T1", "superior", "middle", "inferior", "lateral", "posterior", "medial"],
        deficits: ["Tüm üst ekstremite kaslarında yaygın zayıflık", "Duyu kaybı tüm kol ve elde", "Refleksler azalır", "Horner sendromu olabilir", "Ağrı ve sempatik değişiklikler eşlik edebilir"],
        spared: "Yok; pan-pleksus tutulumu"
      }
    };

    function draw() {
      var c = setupCanvas(canvas, 340);
      var ctx = c.ctx;
      var w = c.w;
      var h = c.h;
      var pal = palette();
      var info = lesions[state.lesion];
      var active = {};
      info.nodes.forEach(function (n) { active[n] = true; });
      var col = function (n) { return active[n] ? pal.accent : pal.ruleStrong; };
      var txt = function (n) { return active[n] ? pal.accent : pal.muted; };

      // coordinates
      var xRoot = 44;
      var xTrunk = 118;
      var xDiv = 196;
      var xCord = 284;
      var xBranch = 372;
      var ys = { C5: 62, C6: 102, C7: 142, C8: 182, T1: 222 };
      var tr = { superior: (ys.C5 + ys.C6) / 2, middle: ys.C7, inferior: (ys.C8 + ys.T1) / 2 };
      var div = {
        "sup-a": tr.superior - 10, "sup-p": tr.superior + 10,
        "mid-a": tr.middle - 10, "mid-p": tr.middle + 10,
        "inf-a": tr.inferior - 10, "inf-p": tr.inferior + 10
      };
      var cords = { lateral: 108, posterior: 168, medial: 228 };
      var branches = [
        { name: "Musculocut.", y: 84, cord: "lateral", color: pal.nerve },
        { name: "Axillary", y: 130, cord: "posterior", color: pal.nerve },
        { name: "Radial", y: 166, cord: "posterior", color: pal.nerve },
        { name: "Median", y: 206, cord: "lateral", color: pal.nerve },
        { name: "Ulnar", y: 240, cord: "medial", color: pal.nerve }
      ];

      // roots
      Object.keys(ys).forEach(function (rootName) {
        var y = ys[rootName];
        dot(ctx, xRoot, y, 13, col(rootName), pal.sheet);
        label(ctx, rootName, xRoot, y + 4, active[rootName] ? "#fffdf8" : pal.ink2, 9, "center", "alphabetic", 600);
      });
      label(ctx, "Kökler", xRoot, 34, pal.muted, 9, "center");

      // trunks
      Object.keys(tr).forEach(function (name) {
        var y = tr[name];
        line(ctx, xRoot + 13, ys[name === "superior" ? "C5" : name === "middle" ? "C7" : "C8"], xTrunk - 12, y, col(name), active[name] ? 3 : 1.5);
        if (name === "superior") line(ctx, xRoot + 13, ys.C6, xTrunk - 12, y, col(name), active[name] ? 3 : 1.5);
        if (name === "inferior") line(ctx, xRoot + 13, ys.T1, xTrunk - 12, y, col(name), active[name] ? 3 : 1.5);
        dot(ctx, xTrunk, y, 12, col(name), pal.sheet);
        label(ctx, name === "superior" ? "Üst" : name === "middle" ? "Orta" : "Alt", xTrunk, y + 4, active[name] ? "#fffdf8" : pal.ink2, 9, "center", "alphabetic", 600);
      });
      label(ctx, "Trunkuslar", xTrunk, 34, pal.muted, 9, "center");

      // divisions
      Object.keys(div).forEach(function (key) {
        var y = div[key];
        var trunkName = key.split("-")[0];
        var trunkY = tr[trunkName === "sup" ? "superior" : trunkName === "mid" ? "middle" : "inferior"];
        line(ctx, xTrunk + 12, trunkY, xDiv - 6, y, col(trunkName === "sup" ? "superior" : trunkName === "mid" ? "middle" : "inferior"), 1.6);
        dot(ctx, xDiv, y, 4, pal.ruleStrong, pal.sheet);
      });
      label(ctx, "Divizyonlar", xDiv + 8, 34, pal.muted, 9, "center");

      // cords
      Object.keys(cords).forEach(function (name) {
        var y = cords[name];
        if (name === "lateral") {
          line(ctx, xDiv, div["sup-a"], xCord - 10, y, col("lateral"), active.lateral ? 3 : 1.8);
          line(ctx, xDiv, div["mid-a"], xCord - 10, y, col("lateral"), active.lateral ? 3 : 1.8);
        } else if (name === "posterior") {
          line(ctx, xDiv, div["sup-p"], xCord - 10, y, col("posterior"), active.posterior ? 3 : 1.8);
          line(ctx, xDiv, div["mid-p"], xCord - 10, y, col("posterior"), active.posterior ? 3 : 1.8);
          line(ctx, xDiv, div["inf-p"], xCord - 10, y, col("posterior"), active.posterior ? 3 : 1.8);
        } else {
          line(ctx, xDiv, div["inf-a"], xCord - 10, y, col("medial"), active.medial ? 3 : 1.8);
        }
        dot(ctx, xCord, y, 11, col(name), pal.sheet);
        label(ctx, name === "lateral" ? "Lateral" : name === "posterior" ? "Posterior" : "Medial", xCord, y + 4, active[name] ? "#fffdf8" : pal.ink2, 8, "center", "alphabetic", 600);
      });
      label(ctx, "Kordlar", xCord, 34, pal.muted, 9, "center");

      // terminal branches
      branches.forEach(function (b) {
        var isActive = active[b.cord] || (b.name === "Median" && (active.lateral || active.medial));
        var color = isActive ? pal.accent : pal.ruleStrong;
        var width = isActive ? 2.5 : 1.4;
        if (b.name === "Median") {
          // The median nerve receives a lateral and a medial root.
          line(ctx, xCord + 11, cords.lateral, xBranch - 14, b.y, color, width);
          line(ctx, xCord + 11, cords.medial, xBranch - 14, b.y, color, width);
          line(ctx, xBranch - 14, b.y, xBranch, b.y, color, width);
          dot(ctx, xBranch - 14, b.y, 2.5, color, pal.sheet);
        } else {
          line(ctx, xCord + 11, cords[b.cord], xBranch, b.y, color, width);
        }
        label(ctx, b.name, xBranch + 5, b.y + 3, isActive ? pal.accent : pal.muted, 8.5, "left", "alphabetic", isActive ? 600 : 500);
      });
      label(ctx, "Terminal dallar", xBranch + 6, 34, pal.muted, 9, "left");

      // lesion marker
      var marker = { "C5-C6": [xRoot, (ys.C5 + ys.C6) / 2], "C8-T1": [xRoot, (ys.C8 + ys.T1) / 2], "middle": [xRoot, ys.C7], "lateral": [xCord, cords.lateral], "posterior": [xCord, cords.posterior], "medial": [xCord, cords.medial], "whole": [xRoot, ys.C7] }[state.lesion];
      if (marker) {
        ctx.save();
        ctx.strokeStyle = pal.loss;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(marker[0], marker[1], 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      setReadout(root, [
        ["Lezyon", info.label],
        ["Tutulan", info.nodes.join(" · ")],
        ["Korunan", info.spared]
      ]);
      setStatus(root, info.deficits.slice(0, 3).join("; ") + ". Tam liste aşağıda. Plexus şeması öğretim amaçlıdır; bireysel anatomi değişkendir.");
      setPrint(root, "Brachial plexus: " + info.label + ". Defisitler: " + info.deficits.join("; ") + ".");
      setAria(canvas, "Brachial plexus şeması: " + info.label + ", tutulan yapılar " + info.nodes.join(", ") + ".");
    }

    function mount() {
      controls.replaceChildren();
      addSelect(controls, {
        label: "Lezyon", value: state.lesion,
        options: Object.keys(lesions).map(function (key) { return { value: key, label: lesions[key].label }; }),
        onChange: function (v) { state.lesion = v; draw(); }
      });
      addButton(controls, { label: "Sıfırla", ghost: true, onClick: function () { state = Object.assign({}, defaults); mount(); draw(); } });
    }

    LAB_RENDERS.push(draw);
    mount();
    draw();
  };

  /* ============================================================
     Quiz
     ============================================================ */

  function initQuiz(root) {
    var dataEl = $("script.quiz-data", root);
    if (!dataEl) return;
    var questions;
    try { questions = JSON.parse(dataEl.textContent); } catch (err) { return; }
    if (!Array.isArray(questions) || !questions.length) return;
    var questionsEl = $("[data-quiz-questions]", root);
    var progressEl = $("[data-quiz-progress]", root);
    var scoreEl = $("[data-quiz-score]", root);
    var resetBtn = $("[data-quiz-reset]", root);
    var retryBtn = $("[data-quiz-retry]", root);
    var storageKey = "med-note-quiz:" + (root.getAttribute("data-quiz-id") || document.title || "default");
    var answered = {};
    var score = 0;

    try {
      var saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (saved && typeof saved === "object") answered = saved;
    } catch (err) { answered = {}; }

    function save() {
      try { localStorage.setItem(storageKey, JSON.stringify(answered)); } catch (err) {}
    }

    function render() {
      questionsEl.replaceChildren();
      score = 0;
      questions.forEach(function (q, index) {
        var wrap = document.createElement("div");
        wrap.className = "medquiz__question";
        var prompt = document.createElement("p");
        prompt.className = "medquiz__prompt";
        var num = document.createElement("span");
        num.className = "qnum";
        num.textContent = String(index + 1).padStart(2, "0");
        prompt.appendChild(num);
        prompt.appendChild(document.createTextNode(q.prompt));
        wrap.appendChild(prompt);
        var options = document.createElement("div");
        options.className = "medquiz__options";
        var explain = document.createElement("p");
        explain.className = "medquiz__explain";
        explain.textContent = q.explain || "";
        q.options.forEach(function (option, j) {
          var button = document.createElement("button");
          button.type = "button";
          button.className = "medquiz__option";
          button.textContent = option;
          button.addEventListener("click", function () {
            if (wrap.classList.contains("is-answered")) return;
            wrap.classList.add("is-answered");
            var correct = j === q.answer;
            if (correct) score += 1;
            Array.prototype.forEach.call(options.children, function (child, k) {
              child.disabled = true;
              if (k === q.answer) child.classList.add("is-correct");
              else if (k === j) child.classList.add("is-wrong");
            });
            answered[index] = { choice: j, correct: correct };
            save();
            updateBar();
          });
          options.appendChild(button);
        });
        wrap.appendChild(options);
        wrap.appendChild(explain);
        if (answered[index]) {
          wrap.classList.add("is-answered");
          var choice = answered[index].choice;
          Array.prototype.forEach.call(options.children, function (child, k) {
            child.disabled = true;
            if (k === q.answer) child.classList.add("is-correct");
            else if (k === choice) child.classList.add("is-wrong");
          });
          if (answered[index].correct) score += 1;
        }
        questionsEl.appendChild(wrap);
      });
      updateBar();
    }

    function updateBar() {
      var total = questions.length;
      var done = Object.keys(answered).length;
      if (progressEl) progressEl.textContent = done + " / " + total + " cevaplandı";
      if (scoreEl) scoreEl.textContent = "Skor: " + score + " / " + total;
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        answered = {};
        score = 0;
        save();
        render();
      });
    }
    if (retryBtn) {
      retryBtn.addEventListener("click", function () {
        answered = {};
        score = 0;
        save();
        render();
      });
    }
    render();
  }

  /* ============================================================
     Init
     ============================================================ */

  function initAll() {
    $$("[data-med-lab]").forEach(function (root) {
      var kind = root.getAttribute("data-med-lab");
      if (LAB[kind]) {
        try { LAB[kind](root); }
        catch (err) {
          ERRORS.push(kind + ": " + String(err && err.message ? err.message : err));
          if (window.console) console.error("med lab failed:", kind, err);
        }
      }
    });
    $$("[data-med-quiz]").forEach(initQuiz);
  }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      LAB_RENDERS.forEach(function (fn) { fn(); });
    }, 120);
  });

  // The base template changes data-theme without emitting an event; repaint
  // canvas colours when the theme actually changes.
  var lastTheme = document.documentElement.getAttribute("data-theme");
  if (window.MutationObserver) {
    new MutationObserver(function () {
      var theme = document.documentElement.getAttribute("data-theme");
      if (theme === lastTheme) return;
      lastTheme = theme;
      LAB_RENDERS.forEach(function (fn) { fn(); });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  window.__MED_LABS__ = {
    labs: LAB,
    errors: ERRORS,
    rerender: function () {
      LAB_RENDERS.forEach(function (fn) { fn(); });
    }
  };
})();
