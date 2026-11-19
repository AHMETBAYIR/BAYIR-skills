/* ============================================================
   Lab: Ashby log–log materials selection chart
   Vanilla JS. No dependencies, no network.
   Data are approximate teaching values; see the caption.
   ============================================================ */

(function () {
  "use strict";

  var api = window.__MSE_LABS__;
  if (!api) { console.error("mse-labs.js must load first"); return; }
  var h = api.helpers;
  var LN10 = Math.LN10;

  var DATA_NOTE = "approximate teaching data after Ashby/Callister/EduPack; verify before design.";

  /* name, family, E (GPa), rho (g/cm^3), sy (MPa, yield or tensile/flexural
     strength as noted), cost (USD/kg, order-of-magnitude material cost). */
  var MATERIALS = [
    { name: "Al 6061-T6", family: "metal", E: 69, rho: 2.70, sy: 276, cost: 2.2 },
    { name: "Mild steel", family: "metal", E: 200, rho: 7.85, sy: 250, cost: 0.6 },
    { name: "Stainless 304", family: "metal", E: 193, rho: 8.00, sy: 205, cost: 4.0 },
    { name: "Ti-6Al-4V", family: "metal", E: 114, rho: 4.43, sy: 880, cost: 30 },
    { name: "Mg AZ31", family: "metal", E: 45, rho: 1.77, sy: 200, cost: 2.8 },
    { name: "Cu C110 (annealed)", family: "metal", E: 117, rho: 8.96, sy: 70, cost: 9.0 },
    { name: "Ni 200", family: "metal", E: 200, rho: 8.90, sy: 148, cost: 18 },
    { name: "Tungsten", family: "metal", E: 411, rho: 19.3, sy: 550, cost: 40 },
    { name: "Lead", family: "metal", E: 16, rho: 11.3, sy: 12, cost: 2.3 },
    { name: "Grey cast iron", family: "metal", E: 170, rho: 7.15, sy: 200, cost: 0.8 },
    { name: "Brass C260", family: "metal", E: 110, rho: 8.50, sy: 300, cost: 7.0 },

    { name: "HDPE", family: "polymer", E: 1.0, rho: 0.95, sy: 25, cost: 1.5 },
    { name: "Polypropylene", family: "polymer", E: 1.5, rho: 0.905, sy: 30, cost: 1.8 },
    { name: "Polycarbonate", family: "polymer", E: 2.4, rho: 1.20, sy: 65, cost: 4.5 },
    { name: "PMMA", family: "polymer", E: 3.0, rho: 1.18, sy: 70, cost: 3.5 },
    { name: "Epoxy", family: "polymer", E: 3.0, rho: 1.15, sy: 55, cost: 5.5 },
    { name: "Nylon 6,6", family: "polymer", E: 3.0, rho: 1.14, sy: 80, cost: 4.0 },
    { name: "Natural rubber", family: "polymer", E: 0.01, rho: 1.10, sy: 20, cost: 2.5 },
    { name: "Rigid PVC", family: "polymer", E: 3.0, rho: 1.40, sy: 50, cost: 1.6 },
    { name: "Rigid PU foam", family: "polymer", E: 0.05, rho: 0.05, sy: 1.0, cost: 6.0 },

    { name: "Alumina 99.5%", family: "ceramic", E: 390, rho: 3.95, sy: 250, cost: 8.0 },
    { name: "Silicon carbide", family: "ceramic", E: 410, rho: 3.20, sy: 400, cost: 20 },
    { name: "Soda-lime glass", family: "ceramic", E: 70, rho: 2.50, sy: 50, cost: 0.8 },
    { name: "Concrete", family: "ceramic", E: 30, rho: 2.40, sy: 4.0, cost: 0.08 },

    { name: "CFRP (UD)", family: "composite", E: 140, rho: 1.60, sy: 1500, cost: 40 },
    { name: "GFRP (UD)", family: "composite", E: 35, rho: 1.90, sy: 600, cost: 8.0 },

    { name: "Oak", family: "wood", E: 11, rho: 0.75, sy: 50, cost: 0.5 },
    { name: "Balsa", family: "wood", E: 3.5, rho: 0.16, sy: 15, cost: 1.8 }
  ];

  var FAMILIES = {
    metal: { label: "metals" },
    polymer: { label: "polymers" },
    ceramic: { label: "ceramics" },
    composite: { label: "composites" },
    wood: { label: "woods" }
  };

  var AXES = {
    E: { label: "Young's modulus E, GPa", min: 0.005, max: 1000 },
    sy: { label: "strength σy, MPa", min: 0.5, max: 3000 },
    rho: { label: "density ρ, g/cm³", min: 0.03, max: 30 },
    cost: { label: "cost, USD/kg (approximate)", min: 0.05, max: 100 }
  };

  var PRESETS = {
    "e-rho": { label: "E vs ρ", prop: "E", propAxis: "E", xAxis: "rho", denom: "rho" },
    "sy-rho": { label: "σy vs ρ", prop: "sy", propAxis: "sy", xAxis: "rho", denom: "rho" },
    "e-cost": { label: "E vs cost", prop: "E", propAxis: "E", xAxis: "cost", denom: "cost" }
  };

  var A_OPTIONS = [
    { value: "0.5", label: "a = 0.5" },
    { value: "1", label: "a = 1" },
    { value: "0.333", label: "a = 1/3" }
  ];

  function readVar(name, fallback) {
    try {
      var value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return value || fallback;
    } catch (err) {
      return fallback;
    }
  }

  function familyColor(family) {
    var pal = h.palette();
    if (family === "metal") return readVar("--ashby-metal", pal.alpha);
    if (family === "polymer") return readVar("--ashby-polymer", pal.beta);
    if (family === "ceramic") return readVar("--ashby-ceramic", pal.liquid);
    if (family === "composite") return readVar("--ashby-composite", pal.ex);
    return readVar("--ashby-wood", "#7b5ea7");
  }

  function aValue(key) {
    if (String(key) === "1/3") return 1 / 3;
    var value = Number(key);
    if (Math.abs(value - 0.5) < 1e-3) return 0.5;
    if (Math.abs(value - 1) < 1e-3) return 1;
    if (Math.abs(value - 1 / 3) < 1e-3) return 1 / 3;
    return 0.5;
  }

  function aText(a) {
    if (Math.abs(a - 0.5) < 1e-9) return "0.5";
    if (Math.abs(a - 1) < 1e-9) return "1";
    return "1/3";
  }

  function indexOf(material, preset, a) {
    var property = material[preset.prop];
    var denom = preset.denom === "rho" ? material.rho : material.cost;
    return Math.pow(property, a) / denom;
  }

  function mBounds(preset, a) {
    var lo = Infinity, hi = -Infinity;
    MATERIALS.forEach(function (material) {
      var value = indexOf(material, preset, a);
      if (value < lo) lo = value;
      if (value > hi) hi = value;
    });
    lo = Math.max(lo, 1e-12);
    if (!(hi > lo)) hi = lo * 1.000001;
    return { lo: lo, hi: hi };
  }

  function m0FromFraction(preset, a, fraction) {
    var bounds = mBounds(preset, a);
    var lo = Math.log(bounds.lo) / LN10;
    var hi = Math.log(bounds.hi) / LN10;
    return Math.pow(10, lo + h.clamp(fraction, 0, 1) * (hi - lo));
  }

  function fractionFromM0(preset, a, M0) {
    var bounds = mBounds(preset, a);
    var lo = Math.log(bounds.lo) / LN10;
    var hi = Math.log(bounds.hi) / LN10;
    return h.clamp((Math.log(Math.max(M0, 1e-12)) / LN10 - lo) / (hi - lo), 0, 1);
  }

  function logTicks(min, max, count) {
    var lo = Math.ceil(Math.log(min) / LN10);
    var hi = Math.floor(Math.log(max) / LN10);
    if (hi < lo) return [Math.pow(10, Math.round((Math.log(min) + Math.log(max)) / (2 * LN10)))];
    return h.ticks(lo, hi, count || Math.max(2, hi - lo + 1))
      .filter(function (value) { return Math.abs(value - Math.round(value)) < 1e-8; })
      .map(function (value) { return Math.pow(10, value); });
  }

  function tickText(value) {
    if (value >= 1) return h.fmt(value, 0);
    if (value >= 0.01) return h.fmt(value, 2);
    return h.fmt(value, 3);
  }

  function propSymbol(preset) {
    return preset.prop === "E" ? "E" : "σy";
  }

  function denomSymbol(preset) {
    return preset.denom === "rho" ? "ρ" : "cost";
  }

  function exponentText(a) {
    var text = aText(a);
    return text.indexOf("/") >= 0 ? "(" + text + ")" : text;
  }

  function equationText(preset, a) {
    return "M = " + propSymbol(preset) + "^" + exponentText(a) + " / " + denomSymbol(preset);
  }

  function unitOf(preset) {
    return preset.prop === "E" ? "GPa" : "MPa";
  }

  function defaultValue(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback;
    var number = Number(value);
    return isFinite(number) ? number : fallback;
  }

  api.register("ashby", function (root) {
    var cfg = h.readConfig(root);
    var canvas = h.$("[data-canvas]", root);
    var controls = h.$("[data-controls]", root);
    if (!canvas || !controls) return;

    var presetKey = PRESETS[cfg.preset] ? cfg.preset : "e-rho";
    var initialPreset = PRESETS[presetKey];

    var state = {
      presetKey: presetKey,
      aKey: cfg.exponent === undefined ? "0.5" : String(cfg.exponent),
      minProp: Math.max(0, defaultValue(cfg.minProperty, 0)),
      maxRho: h.clamp(defaultValue(cfg.maxDensity, 20), 0.05, 20),
      thresholdFrac: h.clamp(defaultValue(cfg.threshold, 0.45), 0, 1),
      shade: cfg.shade !== false
    };
    if (!A_OPTIONS.some(function (option) { return option.value === state.aKey; })) {
      state.aKey = String(aValue(state.aKey));
      if (state.aKey === "0.3333333333333333") state.aKey = "0.333";
    }
    state.minProp = h.clamp(state.minProp, 0, initialPreset.prop === "E" ? 500 : 1600);

    function preset() { return PRESETS[state.presetKey] || PRESETS["e-rho"]; }
    function a() { return aValue(state.aKey); }
    function currentM0() { return m0FromFraction(preset(), a(), state.thresholdFrac); }

    var minInput, rhoInput, thInput, shadeBtn;

    function minPropertyText(value) {
      if (value <= 0) return "none";
      return "≥ " + h.fmt(value, 0) + " " + unitOf(preset());
    }

    function configureMinInput() {
      var p = preset();
      var isE = p.prop === "E";
      minInput.min = "0";
      minInput.max = isE ? "500" : "1600";
      minInput.step = isE ? "1" : "10";
      minInput.value = String(state.minProp);
      var labelEl = minInput.parentNode.querySelector("span");
      if (labelEl) labelEl.textContent = isE ? "Minimum E" : "Minimum σy";
      var out = minInput.parentNode.querySelector("output");
      if (out) out.textContent = minPropertyText(state.minProp);
    }

    function syncThreshold() {
      var pos = Math.round(state.thresholdFrac * 1000);
      thInput.value = String(pos);
      var out = thInput.parentNode.querySelector("output");
      if (out) out.textContent = "M₀ = " + h.fmt(currentM0(), 2);
    }

    function syncRho() {
      var out = rhoInput.parentNode.querySelector("output");
      if (out) out.textContent = "≤ " + h.fmt(state.maxRho, 2) + " g/cm³";
    }

    function buildLegend() {
      var host = h.$("[data-legend]", root);
      if (!host) return;
      host.replaceChildren();
      ["metal", "polymer", "ceramic", "composite", "wood"].forEach(function (key) {
        var span = document.createElement("span");
        var swatch = document.createElement("i");
        swatch.className = "mselab__swatch";
        swatch.setAttribute("aria-hidden", "true");
        swatch.style.background = familyColor(key);
        span.appendChild(swatch);
        span.appendChild(document.createTextNode(FAMILIES[key].label));
        host.appendChild(span);
      });
    }

    function evaluate() {
      var p = preset();
      var exponent = a();
      var M0 = currentM0();
      var rows = MATERIALS.map(function (material) {
        var M = indexOf(material, p, exponent);
        var passProp = material[p.prop] >= state.minProp;
        var passRho = material.rho <= state.maxRho;
        return {
          material: material,
          M: M,
          passProp: passProp,
          passRho: passRho,
          feasible: passProp && passRho && M >= M0
        };
      });
      var passRows = rows.filter(function (row) { return row.passProp && row.passRho; });
      var feasible = passRows.filter(function (row) { return row.feasible; })
        .sort(function (left, right) { return right.M - left.M; });
      return {
        rows: rows,
        passCount: passRows.length,
        feasible: feasible,
        best: feasible.length ? feasible[0] : null
      };
    }

    function drawTable(result) {
      var host = h.$("[data-table]", root);
      if (!host) return;
      var p = preset();
      var table = document.createElement("table");
      table.className = "msetable";
      var caption = document.createElement("caption");
      caption.textContent = "Top 5 feasible by M";
      table.appendChild(caption);

      var head = document.createElement("tr");
      ["#", "material", "M", p.prop === "E" ? "E (GPa)" : "σy (MPa)", p.denom === "rho" ? "ρ (g/cm³)" : "cost (USD/kg)"]
        .forEach(function (text) {
          var th = document.createElement("th");
          th.textContent = text;
          head.appendChild(th);
        });
      table.appendChild(head);

      if (!result.feasible.length) {
        var empty = document.createElement("tr");
        ["—", "no material passes all filters", "—", "—", "—"].forEach(function (text) {
          var td = document.createElement("td");
          td.textContent = text;
          empty.appendChild(td);
        });
        table.appendChild(empty);
      } else {
        result.feasible.slice(0, 5).forEach(function (row, index) {
          var tr = document.createElement("tr");
          [
            String(index + 1),
            row.material.name,
            h.fmt(row.M, 2),
            h.fmt(row.material[p.prop], 0),
            p.denom === "rho" ? h.fmt(row.material.rho, 2) : h.fmt(row.material.cost, 2)
          ].forEach(function (text) {
            var td = document.createElement("td");
            td.textContent = text;
            tr.appendChild(td);
          });
          table.appendChild(tr);
        });
      }
      host.replaceChildren(table);
    }

    function drawPointName(ctx, pal, x, y, text, color, boxes, plot) {
      ctx.save();
      ctx.font = '600 9.5px "IBM Plex Sans", system-ui, sans-serif';
      var width = ctx.measureText(text).width;
      ctx.restore();
      var options = [
        { dx: 9, dy: -9, align: "left" },
        { dx: 9, dy: 13, align: "left" },
        { dx: -9, dy: -9, align: "right" },
        { dx: -9, dy: 13, align: "right" },
        { dx: 0, dy: -14, align: "center" },
        { dx: 0, dy: 18, align: "center" }
      ];
      for (var i = 0; i < options.length; i += 1) {
        var option = options[i];
        var lx = x + option.dx;
        var ly = y + option.dy;
        var x0 = option.align === "left" ? lx : option.align === "right" ? lx - width : lx - width / 2;
        var x1 = x0 + width;
        var box = { x0: x0, y0: ly - 9, x1: x1, y1: ly + 3 };
        if (box.x0 < plot.left + 1 || box.x1 > plot.right - 1 || box.y0 < plot.top + 1 || box.y1 > plot.bottom - 1) continue;
        var clash = boxes.some(function (other) {
          return !(box.x1 < other.x0 - 1 || box.x0 > other.x1 + 1 || box.y1 < other.y0 - 1 || box.y0 > other.y1 + 1);
        });
        if (clash) continue;
        boxes.push(box);
        h.line(ctx, x, y, lx, ly - 4, color, 0.8, null);
        ctx.save();
        ctx.globalAlpha = 0.82;
        ctx.fillStyle = pal.sheet;
        ctx.fillRect(box.x0 - 2, box.y0 - 1, box.x1 - box.x0 + 4, box.y1 - box.y0 + 2);
        ctx.restore();
        h.label(ctx, text, lx, ly, color, 9.5, option.align, "alphabetic", 600);
        return;
      }
      /* If every candidate placement collides, keep the label but clamp it
         inside the plot so a selected point is never anonymous. */
      var fallbackX = Math.max(plot.left + 2, Math.min(plot.right - width - 2, x + 9));
      var fallbackY = Math.max(plot.top + 11, Math.min(plot.bottom - 4, y - 9));
      h.line(ctx, x, y, fallbackX, fallbackY - 4, color, 0.8, null);
      ctx.save();
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = pal.sheet;
      ctx.fillRect(fallbackX - 2, fallbackY - 10, width + 4, 13);
      ctx.restore();
      h.label(ctx, text, fallbackX, fallbackY, color, 9.5, "left", "alphabetic", 600);
    }

    function render() {
      var p = preset();
      var exponent = a();
      var M0 = currentM0();
      var result = evaluate();
      var best = result.best;
      var size = h.setupCanvas(canvas, 430);
      var ctx = size.ctx;
      var pal = h.palette();
      var w = size.w, hgt = size.h;
      var m = { l: 62, r: 18, t: 22, b: 46 };
      var iw = w - m.l - m.r;
      var ih = hgt - m.t - m.b;
      var xAxis = AXES[p.xAxis];
      var yAxis = AXES[p.propAxis];
      var xLogMin = Math.log(xAxis.min) / LN10;
      var xLogMax = Math.log(xAxis.max) / LN10;
      var yLogMin = Math.log(yAxis.min) / LN10;
      var yLogMax = Math.log(yAxis.max) / LN10;
      var plot = { left: m.l, right: w - m.r, top: m.t, bottom: hgt - m.b };

      function X(value) {
        return m.l + ((Math.log(value) / LN10 - xLogMin) / (xLogMax - xLogMin)) * iw;
      }
      function Y(value) {
        return m.t + (1 - (Math.log(value) / LN10 - yLogMin) / (yLogMax - yLogMin)) * ih;
      }
      function YLog(logValue) {
        return m.t + (1 - (logValue - yLogMin) / (yLogMax - yLogMin)) * ih;
      }

      ctx.fillStyle = pal.sheet;
      ctx.fillRect(0, 0, w, hgt);

      /* minor grid at 2 and 5 within each decade */
      var e;
      for (e = Math.floor(xLogMin); e <= Math.ceil(xLogMax); e += 1) {
        [2, 5].forEach(function (multiplier) {
          var value = multiplier * Math.pow(10, e);
          if (value > xAxis.min && value < xAxis.max) {
            h.line(ctx, X(value), m.t, X(value), plot.bottom, pal.grid, 0.6, null);
          }
        });
      }
      for (e = Math.floor(yLogMin); e <= Math.ceil(yLogMax); e += 1) {
        [2, 5].forEach(function (multiplier) {
          var value = multiplier * Math.pow(10, e);
          if (value > yAxis.min && value < yAxis.max) {
            h.line(ctx, m.l, Y(value), plot.right, Y(value), pal.grid, 0.6, null);
          }
        });
      }

      /* decade grid and labels */
      logTicks(xAxis.min, xAxis.max, 5).forEach(function (value) {
        var px = X(value);
        h.line(ctx, px, m.t, px, plot.bottom, pal.gridStrong, 0.9, null);
        h.label(ctx, tickText(value), px, plot.bottom + 14, pal.muted, 9.5, "center");
      });
      logTicks(yAxis.min, yAxis.max, 6).forEach(function (value) {
        var py = Y(value);
        h.line(ctx, m.l, py, plot.right, py, pal.gridStrong, 0.9, null);
        h.label(ctx, tickText(value), m.l - 7, py + 3, pal.muted, 9.5, "right");
      });

      h.label(ctx, yAxis.label, m.l, 10, pal.muted, 9.5, "left");
      h.label(ctx, xAxis.label, plot.right, hgt - 8, pal.muted, 9.5, "right");

      /* feasible side: M >= M0 means log P >= (log rho + log M0)/a */
      var lineAt = function (logX) { return (logX + Math.log(M0) / LN10) / exponent; };
      if (state.shade) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(m.l, m.t, iw, ih);
        ctx.clip();
        ctx.beginPath();
        ctx.moveTo(m.l, YLog(lineAt(xLogMin)));
        ctx.lineTo(plot.right, YLog(lineAt(xLogMax)));
        ctx.lineTo(plot.right, m.t);
        ctx.lineTo(m.l, m.t);
        ctx.closePath();
        ctx.fillStyle = readVar("--ashby-feasible", "rgba(47,93,138,0.10)");
        ctx.fill();
        ctx.restore();

        var midLog = (xLogMin + xLogMax) / 2;
        var yMid = YLog(lineAt(midLog));
        var labelY = yMid < m.t || yMid > plot.bottom ? m.t + 16 : Math.max(m.t + 16, yMid - 10);
        h.label(ctx, "feasible: M ≥ M₀", m.l + 10, labelY, pal.def, 9, "left", "alphabetic", 600);
      }

      /* constant-index line, clipped to the plot */
      ctx.save();
      ctx.beginPath();
      ctx.rect(m.l, m.t, iw, ih);
      ctx.clip();
      h.line(ctx, m.l, YLog(lineAt(xLogMin)), plot.right, YLog(lineAt(xLogMax)), pal.accent, 2.1, null);
      ctx.restore();

      var slopeLogX = xLogMin + 0.68 * (xLogMax - xLogMin);
      var slopeY = YLog(lineAt(slopeLogX));
      if (slopeY > m.t + 26 && slopeY < plot.bottom - 18) {
        h.label(ctx, "slope 1/a = " + h.fmt(1 / exponent, 2), slopeLogX - 4, slopeY - 7, pal.accent, 9, "right", "alphabetic", 600);
      } else {
        h.label(ctx, "slope 1/a = " + h.fmt(1 / exponent, 2), plot.right - 6, m.t + 14, pal.accent, 9, "right", "alphabetic", 600);
      }

      /* points: dim the excluded, highlight the feasible */
      result.rows.forEach(function (row) {
        var material = row.material;
        var x = X(material[p.xAxis]);
        var y = Y(material[p.propAxis]);
        var color = familyColor(material.family);
        if (row.feasible) {
          h.dot(ctx, x, y, 4.4, color, pal.sheet);
        } else if (row.passProp && row.passRho) {
          ctx.save();
          ctx.globalAlpha = 0.72;
          h.dot(ctx, x, y, 3.7, color, null);
          ctx.restore();
        } else {
          ctx.save();
          ctx.globalAlpha = 0.3;
          h.dot(ctx, x, y, 3.1, color, null);
          ctx.restore();
        }
      });

      if (best) {
        var bestX = X(best.material[p.xAxis]);
        var bestY = Y(best.material[p.propAxis]);
        ctx.save();
        ctx.beginPath();
        ctx.arc(bestX, bestY, 7.6, 0, Math.PI * 2);
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      /* names for the top five: selected, not every point */
      var boxes = [];
      result.feasible.slice(0, 5).forEach(function (row) {
        var material = row.material;
        var x = X(material[p.xAxis]);
        var y = Y(material[p.propAxis]);
        var color = row === best ? pal.accent : familyColor(material.family);
        drawPointName(ctx, pal, x, y, material.name, color, boxes, plot);
      });

      ctx.strokeStyle = pal.ruleStrong;
      ctx.lineWidth = 1;
      ctx.strokeRect(m.l + 0.5, m.t + 0.5, iw - 1, ih - 1);

      h.setAria(canvas,
        "Log-log materials selection chart, " + p.label + ". " + MATERIALS.length +
        " materials; " + result.passCount + " pass the constraints and " + result.feasible.length +
        " lie on or above the index line. Best feasible material: " +
        (best ? best.material.name + ", index " + h.fmt(best.M, 2) : "none") + ".");

      var propSym = propSymbol(p);
      var unit = unitOf(p);
      var filterText = propSym + " ≥ " + h.fmt(state.minProp, 0) + " " + unit +
        ", ρ ≤ " + h.fmt(state.maxRho, 2) + " g/cm³";

      var indexUnit = "(" + unit + ")^" + exponentText(exponent) + " / " +
        (p.denom === "rho" ? "g/cm³" : "USD/kg");
      var rows = [
        ["Chart", p.label],
        ["Index", equationText(p, exponent)],
        ["M units", indexUnit],
        ["Line slope", "1/a = " + h.fmt(1 / exponent, 2)],
        ["Pass constraints", result.passCount + " / " + MATERIALS.length],
        ["Candidates", result.feasible.length + " / " + MATERIALS.length],
        ["Best", best ? best.material.name : "—"],
        ["Best M", best ? h.fmt(best.M, 2) : "—"],
        ["Best E", best ? h.fmt(best.material.E, 0) + " GPa" : "—"],
        ["Best σy", best ? h.fmt(best.material.sy, 0) + " MPa" : "—"],
        ["Best ρ", best ? h.fmt(best.material.rho, 2) + " g/cm³" : "—"],
        ["Best cost", best ? h.fmt(best.material.cost, 2) + " USD/kg" : "—"],
        ["Threshold M₀", h.fmt(M0, 2)]
      ];
      h.setReadout(root, rows);

      var functionText = p.denom === "cost"
        ? "stiffness per unit cost"
        : (p.prop === "E" ? "stiffness at minimum mass" : "strength at minimum mass");
      var objectiveText = p.denom === "cost" ? "minimise cost" : "minimise mass";
      var bestText = best
        ? "Best: " + best.material.name + " at M = " + h.fmt(best.M, 2) + "."
        : "No material passes all three filters.";

      h.setStatus(root,
        p.label + " with " + equationText(p, exponent) + ". " +
        result.passCount + " of " + MATERIALS.length + " materials pass the constraints (" + filterText + "); " +
        result.feasible.length + " of those also lie on or above M₀ = " + h.fmt(M0, 2) + ". " + bestText + " " +
        "The index is not read off the chart: it comes from the function (" + functionText +
        "), the constraint (" + filterText + "), and the objective (" + objectiveText + "). " +
        "The constant-M line has log–log slope 1/a = " + h.fmt(1 / exponent, 2) +
        " because log M = a log " + propSym + " − log " + denomSymbol(p) + ". " +
        "M is comparative: its units are " + indexUnit + ", so compare values at the same a, not across exponents.");

      var printEl = h.$("[data-print]", root);
      if (printEl) {
        printEl.textContent = "Printed state: " + p.label + ", " + equationText(p, exponent) + ", " +
          result.feasible.length + " of " + MATERIALS.length + " feasible; " +
          (best ? "best " + best.material.name + " (M = " + h.fmt(best.M, 2) + "). " : "no feasible material. ") +
          "Data: " + DATA_NOTE;
      }

      drawTable(result);
    }

    buildLegend();

    h.addSelect(controls, {
      label: "Chart",
      value: state.presetKey,
      options: Object.keys(PRESETS).map(function (key) {
        return { value: key, label: PRESETS[key].label };
      }),
      onChange: function (value) {
        var oldProp = preset().prop;
        state.presetKey = value;
        if (preset().prop !== oldProp) state.minProp = 0;
        state.minProp = h.clamp(state.minProp, 0, preset().prop === "E" ? 500 : 1600);
        state.thresholdFrac = 0.45;
        configureMinInput();
        syncThreshold();
        render();
      }
    });

    h.addSelect(controls, {
      label: "Index exponent",
      value: state.aKey,
      options: A_OPTIONS,
      onChange: function (value) {
        state.aKey = value;
        state.thresholdFrac = 0.45;
        syncThreshold();
        render();
      }
    });

    minInput = h.addRange(controls, {
      label: "Minimum E",
      min: 0, max: 500, step: 1, value: state.minProp,
      format: function (value) { return minPropertyText(value); },
      onInput: function (value) {
        state.minProp = value;
        render();
      }
    });

    rhoInput = h.addRange(controls, {
      label: "Maximum density",
      min: 0.05, max: 20, step: 0.05, value: state.maxRho,
      format: function (value) { return "≤ " + h.fmt(value, 2) + " g/cm³"; },
      onInput: function (value) {
        state.maxRho = value;
        render();
      }
    });

    thInput = h.addRange(controls, {
      label: "Selection threshold",
      min: 0, max: 1000, step: 1, value: Math.round(state.thresholdFrac * 1000),
      format: function (value) {
        return "M₀ = " + h.fmt(m0FromFraction(preset(), a(), value / 1000), 2);
      },
      onInput: function (value) {
        state.thresholdFrac = value / 1000;
        render();
      }
    });

    shadeBtn = h.addToggle(controls, {
      label: "Shade feasible side",
      value: state.shade,
      onChange: function (value) {
        state.shade = value;
        render();
      }
    });

    h.addButton(controls, {
      label: "Reset", ghost: true,
      onClick: function () {
        state.minProp = 0;
        state.maxRho = 20;
        state.thresholdFrac = 0.45;
        state.shade = true;
        shadeBtn.setAttribute("aria-pressed", "true");
        configureMinInput();
        rhoInput.value = "20";
        syncRho();
        syncThreshold();
        render();
      }
    });

    configureMinInput();
    syncRho();
    syncThreshold();

    h.bindPointer(canvas, function (point) {
      var p = preset();
      var xAxis = AXES[p.xAxis];
      var yAxis = AXES[p.propAxis];
      var cssW = canvas.__cssW || 640;
      var cssH = canvas.__cssH || 430;
      var margin = { l: 62, r: 18, t: 22, b: 46 };
      var innerW = cssW - margin.l - margin.r;
      var innerH = cssH - margin.t - margin.b;
      var xLo = Math.log(xAxis.min) / LN10;
      var xHi = Math.log(xAxis.max) / LN10;
      var yLo = Math.log(yAxis.min) / LN10;
      var yHi = Math.log(yAxis.max) / LN10;
      var xLog = xLo + h.clamp((point.x - margin.l) / innerW, 0, 1) * (xHi - xLo);
      var yLog = yLo + (1 - h.clamp((point.y - margin.t) / innerH, 0, 1)) * (yHi - yLo);
      var M0 = Math.pow(10, a() * yLog - xLog);
      state.thresholdFrac = fractionFromM0(p, a(), M0);
      syncThreshold();
      render();
    });

    h.addHint(root,
      "Drag anywhere on the plot to move the constant-M line; the sliders and select are the keyboard path. " +
      "a = 1, 0.5 and 1/3 are common stiffness exponents (tie, beam, panel); strength indices also depend on the failure mode.");

    api.onRender(render);
    render();
  });

  api.init();
})();
