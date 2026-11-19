/* ============================================================
   Lab: TTT / CCT diagram for eutectoid steel (0.76 wt% C)
   Requires assets/mse-labs.js (loaded first).
   ============================================================ */

(function () {
  "use strict";

  var api = window.__MSE_LABS__;
  if (!api) {
    console.error("mse-labs.js must load first");
    return;
  }

  var h = api.helpers;

  var A1 = 727;              /* °C, eutectoid temperature */
  var MS = 220;              /* °C, martensite start */
  var T_START = 800;         /* °C, austenitising temperature */
  var T_END = 20;            /* °C, final temperature */
  var HOLD_T = 620;          /* °C, fixed hold temperature */
  var RA_SHARE = 0.10;       /* of the austenite left at Ms */

  /* HV of each constituent: rough teaching values. */
  var HV = { pearlite: 250, bainite: 350, martensite: 700, austenite: 200 };

  var SUP = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻"
  };

  function superscript(n) {
    return String(n).split("").map(function (ch) {
      return SUP[ch] || ch;
    }).join("");
  }

  function log10(value) {
    return Math.log(value) / Math.LN10;
  }

  function fmtRate(value) {
    if (!isFinite(value)) return "—";
    if (value < 1) return h.fmt(value, 2);
    if (value < 10) return h.fmt(value, 1);
    return h.fmt(value, 0);
  }

  function fmtTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "—";
    if (seconds < 1) return h.fmt(seconds, 2) + " s";
    if (seconds < 100) return h.fmt(seconds, 1) + " s";
    return h.fmt(seconds, 0) + " s";
  }

  /* ---------------- diagram model ---------------- */

  /* One lobe of a C-curve: log10(time) is a parabola in T above and
     below the nose. Ttop/Tbot are the ends of the drawn temperature
     window; logTop/logBot are the log times there. */
  var PARAMS = {
    TTT: {
      pStart:  { Tn: 550, tn: 1,  Ttop: A1,  Tbot: 500, logTop: 4.0, logBot: 3.0 },
      pFinish: { Tn: 550, tn: 8,  Ttop: A1,  Tbot: 500, logTop: 4.6, logBot: 3.6 },
      bStart:  { Tn: 350, tn: 10, Ttop: 560, Tbot: 235, logTop: 3.6, logBot: 3.8 },
      bFinish: { Tn: 350, tn: 80, Ttop: 560, Tbot: 235, logTop: 4.2, logBot: 4.2 }
    },
    CCT: {
      pStart:  { Tn: 525, tn: 10,  Ttop: A1,  Tbot: 475, logTop: 4.6, logBot: 4.0 },
      pFinish: { Tn: 525, tn: 80,  Ttop: A1,  Tbot: 475, logTop: 5.0, logBot: 4.4 },
      bStart:  { Tn: 325, tn: 20, Ttop: 535, Tbot: 225, logTop: 3.8, logBot: 3.6 },
      bFinish: { Tn: 325, tn: 160, Ttop: 535, Tbot: 225, logTop: 4.2, logBot: 4.0 }
    }
  };

  function lobe(c, T) {
    if (!c) return null;
    if (T > c.Ttop + 1e-9 || T < c.Tbot - 1e-9) return null;
    var l0 = log10(c.tn);
    if (T >= c.Tn) {
      var u = (T - c.Tn) / (c.Ttop - c.Tn);
      return l0 + (c.logTop - l0) * u * u;
    }
    var v = (c.Tn - T) / (c.Tn - c.Tbot);
    return l0 + (c.logBot - l0) * v * v;
  }

  /* Constant-rate cooling from 800 °C to 20 °C with an optional
     isothermal hold at HOLD_T. */
  function makePath(rate, hold) {
    var t1 = (T_START - HOLD_T) / rate;
    var t2 = t1 + hold;
    var tEnd = t2 + (HOLD_T - T_END) / rate;
    return { rate: rate, hold: hold, t1: t1, t2: t2, tEnd: tEnd };
  }

  function pathTemperature(p, t) {
    if (t <= p.t1) return T_START - p.rate * t;
    if (t <= p.t2) return HOLD_T;
    return HOLD_T - p.rate * (t - p.t2);
  }

  function timeTo(p, target) {
    if (target >= T_START) return 0;
    if (target >= HOLD_T) return (T_START - target) / p.rate;
    return p.t2 + (HOLD_T - target) / p.rate;
  }

  function samplePath(p) {
    var out = [];
    var t0 = 0.005;
    var lo = log10(t0);
    var hi = log10(p.tEnd);
    var n = 700;
    var i, t;
    for (i = 0; i <= n; i += 1) {
      out.push(lo + (hi - lo) * (i / n));
    }
    [p.t1, p.t2, p.tEnd].forEach(function (extra) {
      if (extra > 0) out.push(log10(extra));
    });
    out.sort(function (a, b) { return a - b; });

    var seen = [];
    var last = null;
    out.forEach(function (l) {
      if (last !== null && Math.abs(l - last) < 1e-6) return;
      last = l;
      seen.push(l);
    });

    return seen.map(function (l) {
      t = Math.pow(10, l);
      return { t: t, x: l, T: pathTemperature(p, t) };
    });
  }

  /* Deepest penetration into the start–finish band, and the first
     point where the path enters the start curve. */
  function progress(cStart, cFinish, samples) {
    var best = 0;
    var hit = null;
    samples.forEach(function (s) {
      var ls = lobe(cStart, s.T);
      if (ls === null) return;
      if (s.x < ls - 1e-9) return;
      if (!hit) hit = { T: s.T, x: s.x, t: s.t };
      var lf = lobe(cFinish, s.T);
      if (lf === null) return;
      var span = Math.max(0.2, lf - ls);
      var p = h.clamp((s.x - ls) / span, 0, 1);
      if (p > best) best = p;
    });
    return { p: best, hit: hit };
  }

  function transforms(rate, hold, mode) {
    var cs = PARAMS[mode] || PARAMS.CCT;
    var p = makePath(rate, hold);
    var samples = samplePath(p);
    var pearl = progress(cs.pStart, cs.pFinish, samples);
    var bain = progress(cs.bStart, cs.bFinish, samples);

    var pearlite = pearl.p;
    var bainite = (1 - pearlite) * bain.p;
    var austenite = Math.max(0, 1 - pearlite - bainite);

    var msTime = null;
    for (var i = 0; i < samples.length; i += 1) {
      if (samples[i].T <= MS) {
        msTime = samples[i].t;
        break;
      }
    }
    var belowMs = msTime !== null;
    var martensite = belowMs ? austenite * (1 - RA_SHARE) : 0;
    var retained = belowMs ? austenite * RA_SHARE : austenite;

    return {
      mode: mode,
      rate: rate,
      hold: hold,
      path: p,
      samples: samples,
      pearlite: pearlite,
      bainite: bainite,
      martensite: martensite,
      retained: retained,
      msTime: msTime,
      t500: timeTo(p, 500),
      pearlHit: pearl.hit,
      bainHit: bain.hit,
      hv: pearlite * HV.pearlite + bainite * HV.bainite +
          martensite * HV.martensite + retained * HV.austenite
    };
  }

  function hasCrossing(rate, mode) {
    var cs = PARAMS[mode] || PARAMS.CCT;
    var samples = samplePath(makePath(rate, 0));
    return progress(cs.pStart, cs.pFinish, samples).hit !== null ||
      progress(cs.bStart, cs.bFinish, samples).hit !== null;
  }

  /* Smallest rate that still touches a start curve. Above it, the path
     misses both noses and the austenite reaches Ms untransformed. */
  var critCache = {};
  function criticalRate(mode) {
    if (critCache[mode] !== undefined) return critCache[mode];
    var lo = 0.05;
    var hi = 600;
    if (hasCrossing(hi, mode)) {
      critCache[mode] = hi;
      return hi;
    }
    for (var i = 0; i < 30; i += 1) {
      var mid = 0.5 * (lo + hi);
      if (hasCrossing(mid, mode)) lo = mid;
      else hi = mid;
    }
    critCache[mode] = hi;
    return hi;
  }

  /* Integer percentages that still sum to 100 (largest remainder). */
  function wholePercents(values) {
    var floors = values.map(function (v) { return Math.floor(v * 100); });
    var sum = floors.reduce(function (a, b) { return a + b; }, 0);
    var order = values.map(function (v, i) {
      return { i: i, r: v * 100 - floors[i] };
    }).sort(function (a, b) { return b.r - a.r; });
    var left = 100 - sum;
    for (var k = 0; k < left; k += 1) floors[order[k % order.length].i] += 1;
    return floors;
  }

  function init(root) {
    var cfg = h.readConfig(root);
    var canvas = h.$("[data-canvas]", root);
    var controls = h.$("[data-controls]", root);
    if (!canvas) {
      h.setStatus(root, "This lab needs a <canvas data-canvas>.");
      return;
    }
    if (!controls) {
      h.setStatus(root, "This lab needs a <div data-controls>.");
      return;
    }

    var rate0 = Number(cfg.coolingRate);
    if (!isFinite(rate0) || rate0 <= 0) rate0 = 10;
    var hold0 = Number(cfg.hold);
    if (!isFinite(hold0) || hold0 < 0) hold0 = 0;
    var mode0 = String(cfg.mode || "CCT").toUpperCase() === "TTT" ? "TTT" : "CCT";

    var state = {
      rate: h.clamp(rate0, 0.05, 200),
      hold: h.clamp(hold0, 0, 600),
      mode: mode0
    };

    function config(mode) {
      return PARAMS[mode] || PARAMS.CCT;
    }

    function render() {
      var c = transforms(state.rate, state.hold, state.mode);
      var cs = config(state.mode);
      var crit = criticalRate(state.mode);
      var size = h.setupCanvas(canvas, 400);
      var ctx = size.ctx;
      var pal = h.palette();
      var w = size.w;
      var hgt = size.h;
      var compact = w < 470;

      var padL = compact ? 40 : 50;
      var padR = 16;
      var padT = 34;
      var padB = compact ? 36 : 40;
      var plotW = Math.max(80, w - padL - padR);
      var plotH = hgt - padT - padB;
      var x0 = padL;
      var x1 = padL + plotW;
      var y0 = padT;
      var y1 = padT + plotH;
      var LMIN = -1;
      var LMAX = 5;
      var TMAX = 800;

      function X(l) {
        return x0 + ((l - LMIN) / (LMAX - LMIN)) * plotW;
      }
      function Y(T) {
        return y0 + (1 - (T / TMAX)) * plotH;
      }
      function xLog(t) {
        return X(log10(t));
      }

      var fsTick = compact ? 8 : 9;
      var fsLabel = compact ? 8.2 : 9.2;

      ctx.fillStyle = pal.sheet;
      ctx.fillRect(0, 0, w, hgt);

      /* grid */
      h.ticks(0, 800, 8).forEach(function (T) {
        var gy = Y(T);
        h.line(ctx, x0, gy, x1, gy, pal.grid, 1, null);
        h.label(ctx, h.fmt(T, 0), x0 - 6, gy + 3, pal.muted, fsTick, "right");
      });
      for (var e = LMIN; e <= LMAX; e += 1) {
        var gx = X(e);
        h.line(ctx, gx, y0, gx, y1, pal.grid, 1, null);
        h.label(ctx, e === -1 ? "0.1" : (e === 0 ? "1" : (e === 1 ? "10" : "10" + superscript(e))),
          gx, y1 + 13, pal.muted, fsTick, "center");
      }

      /* clip everything to the plotting rectangle */
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, y0, plotW, plotH);
      ctx.clip();

      /* transformation bands: start → finish */
      drawBand(ctx, cs.pStart, cs.pFinish, pal.liquid, X, Y);
      drawBand(ctx, cs.bStart, cs.bFinish, pal.alpha, X, Y);

      /* A1 and Ms */
      h.line(ctx, x0, Y(A1), x1, Y(A1), pal.ruleStrong, 1.2, [6, 4]);
      h.line(ctx, x0, Y(MS), x1, Y(MS), pal.accent, 1.2, [6, 4]);

      /* curves: start solid, finish dashed */
      drawCurve(ctx, cs.pStart, pal.liquid, 2.2, null, X, Y);
      drawCurve(ctx, cs.pFinish, pal.liquid, 1.5, [5, 4], X, Y);
      drawCurve(ctx, cs.bStart, pal.alpha, 2.2, null, X, Y);
      drawCurve(ctx, cs.bFinish, pal.alpha, 1.5, [5, 4], X, Y);

      /* cooling path */
      ctx.save();
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 2.4;
      ctx.lineJoin = "round";
      ctx.beginPath();
      c.samples.forEach(function (s, i) {
        var px = xLog(s.t);
        var py = Y(s.T);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.restore();

      /* markers where the path enters a start curve */
      if (c.pearlHit) {
        h.dot(ctx, xLog(c.pearlHit.t), Y(c.pearlHit.T), 3.4, pal.liquid, pal.sheet);
      }
      if (c.bainHit) {
        h.dot(ctx, xLog(c.bainHit.t), Y(c.bainHit.T), 3.4, pal.alpha, pal.sheet);
      }
      if (c.msTime !== null) {
        h.dot(ctx, xLog(c.msTime), Y(MS), 3.4, pal.accent, pal.sheet);
      }

      /* curve labels, placed away from the other curve */
      labelOnCurve(ctx, cs.pStart, 660, "P start", pal.liquid, "right", fsLabel, X, Y);
      labelOnCurve(ctx, cs.pFinish, 660, "P finish", pal.liquid, "left", fsLabel, X, Y);
      labelOnCurve(ctx, cs.bStart, 470, "B start", pal.alpha, "right", fsLabel, X, Y);
      labelOnCurve(ctx, cs.bFinish, 470, "B finish", pal.alpha, "left", fsLabel, X, Y);

      ctx.restore();

      /* axis annotations outside the clip */
      h.label(ctx, "A1 " + A1 + " °C", x1 - 3, Y(A1) - 4, pal.ink2, fsLabel, "right", "alphabetic", 600);
      h.label(ctx, "Ms " + MS + " °C", x1 - 3, Y(MS) - 4, pal.accent, fsLabel, "right", "alphabetic", 600);

      h.label(ctx, "time (s, log scale)", x0, hgt - 8, pal.muted, compact ? 8 : 9, "left");
      h.label(ctx, "T (°C)", x0, 14, pal.muted, compact ? 8 : 9, "left");
      h.label(ctx, state.mode + " · eutectoid 0.76 wt% C", x1, 14, pal.ink, compact ? 9.5 : 11, "right", "alphabetic", 700);

      /* readout */
      var shares = wholePercents([c.pearlite, c.bainite, c.martensite, c.retained]);
      var crossed = [];
      if (c.pearlite > 0.005) {
        crossed.push("pearlite start");
        if (c.pearlite > 0.995) crossed.push("pearlite finish");
      }
      if (c.bainite > 0.005) {
        crossed.push("bainite start");
        if (c.bainite > 0.995) crossed.push("bainite finish");
      }
      if (c.martensite > 0.005) crossed.push("Ms");
      h.setReadout(root, [
        ["Diagram", state.mode === "CCT" ? "CCT · continuous cooling" : "TTT · isothermal"],
        ["Cooling rate", fmtRate(c.rate) + " °C/s"],
        ["Hold at " + HOLD_T + " °C", h.fmt(c.hold, 0) + " s"],
        ["Time to 500 °C", fmtTime(c.t500)],
        ["Crossings", crossed.length ? crossed.join(" → ") : "none"],
        ["Pearlite", shares[0] + "%"],
        ["Bainite", shares[1] + "%"],
        ["Martensite", shares[2] + "%"],
        ["Retained austenite", shares[3] + "%"],
        ["Estimated hardness", h.fmt(c.hv, 0) + " HV"]
      ]);

      /* status: the teaching */
      var text;
      if (state.mode === "CCT") {
        text = "CCT: the curves sit right and lower than TTT because a continuously cooled sample spends only a moment at each temperature, so transformation is delayed and starts at a lower temperature. ";
      } else {
        text = "TTT: each curve is isothermal — it assumes the steel is held at that temperature. The drawn path is a continuous cool, so the CCT view is the like-for-like comparison. ";
      }
      text += "At " + fmtRate(c.rate) + " °C/s the path reaches 500 °C in " + fmtTime(c.t500) +
        (c.hold > 0 ? " after a " + h.fmt(c.hold, 0) + " s hold at " + HOLD_T + " °C" : "") + ". ";

      if (c.pearlite > 0.005) {
        text += "It enters the pearlite start near " + h.fmt(c.pearlHit.T, 0) +
          " °C and leaves " + shares[0] + "% pearlite. ";
      }
      if (c.bainite > 0.005) {
        text += "It enters the bainite start near " + h.fmt(c.bainHit.T, 0) +
          " °C and leaves " + shares[1] + "% bainite. ";
      }
      if (c.pearlite + c.bainite < 0.005) {
        text += "It misses both start curves, so the austenite survives to Ms = " + MS +
          " °C and transforms to martensite. ";
      } else if (c.martensite > 0.005) {
        text += "The austenite left at Ms = " + MS + " °C becomes " + shares[2] +
          "% martensite plus " + shares[3] + "% retained austenite. ";
      }
      text += "The nose is the closest point to the time axis, so it sets the limit: about " +
        h.fmt(crit, 0) + " °C/s for this " + state.mode +
        " diagram. Cool faster and the path misses the start curve entirely.";

      h.setStatus(root, text);

      h.setAria(canvas,
        state.mode + " diagram for eutectoid steel, cooling at " + fmtRate(c.rate) +
        " degrees Celsius per second" +
        (c.hold > 0 ? " with a " + h.fmt(c.hold, 0) + " second hold at " + HOLD_T + " degrees" : "") +
        ". The path reaches 500 degrees in " + fmtTime(c.t500) + ". " +
        (c.pearlite > 0.005 ? "It crosses the pearlite start at about " + h.fmt(c.pearlHit.T, 0) + " degrees. " : "It does not cross the pearlite start. ") +
        (c.bainite > 0.005 ? "It crosses the bainite start at about " + h.fmt(c.bainHit.T, 0) + " degrees. " : "It does not cross the bainite start. ") +
        "Final structure: " + shares[0] + " percent pearlite, " + shares[1] + " percent bainite, " +
        shares[2] + " percent martensite, " + shares[3] + " percent retained austenite. " +
        "Estimated hardness " + h.fmt(c.hv, 0) + " HV.");
    }

    function drawBand(ctx, start, finish, color, X, Y) {
      var i;
      ctx.save();
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = color;
      ctx.beginPath();
      var first = true;
      for (i = start.Tbot; i <= start.Ttop + 1e-9; i += (start.Ttop - start.Tbot) / 80) {
        var ls = lobe(start, i);
        if (ls === null) continue;
        if (first) { ctx.moveTo(X(ls), Y(i)); first = false; }
        else ctx.lineTo(X(ls), Y(i));
      }
      for (i = finish.Ttop; i >= finish.Tbot - 1e-9; i -= (finish.Ttop - finish.Tbot) / 80) {
        var lf = lobe(finish, i);
        if (lf === null) continue;
        ctx.lineTo(X(lf), Y(i));
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawCurve(ctx, curve, color, width, dash, X, Y) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = "round";
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath();
      var first = true;
      var steps = 110;
      for (var i = 0; i <= steps; i += 1) {
        var T = curve.Tbot + (curve.Ttop - curve.Tbot) * (i / steps);
        var l = lobe(curve, T);
        if (l === null) continue;
        if (first) { ctx.moveTo(X(l), Y(T)); first = false; }
        else ctx.lineTo(X(l), Y(T));
      }
      ctx.stroke();
      ctx.restore();
    }

    function labelOnCurve(ctx, curve, T, text, color, align, size, X, Y) {
      var l = lobe(curve, T);
      if (l === null) return;
      var px = X(l) + (align === "right" ? -5 : 5);
      h.label(ctx, text, px, Y(T) - 4, color, size, align, "alphabetic", 600);
    }

    /* ---------------- controls ---------------- */

    var rateInput = h.addRange(controls, {
      label: "Cooling rate (log scale)",
      min: -1.3, max: 2.3, step: 0.005,
      value: log10(state.rate),
      format: function (v) { return fmtRate(Math.pow(10, v)) + " °C/s"; },
      onInput: function (v) {
        state.rate = h.clamp(Math.pow(10, v), 0.05, 200);
        render();
      }
    });

    var holdInput = h.addRange(controls, {
      label: "Hold at " + HOLD_T + " °C",
      min: 0, max: 600, step: 5,
      value: state.hold,
      format: function (v) { return h.fmt(v, 0) + " s"; },
      onInput: function (v) {
        state.hold = h.clamp(v, 0, 600);
        render();
      }
    });

    h.addToggle(controls, {
      label: "CCT (continuous cooling)",
      value: state.mode === "CCT",
      onChange: function (value) {
        state.mode = value ? "CCT" : "TTT";
        render();
      }
    });

    h.addButton(controls, {
      label: "Reset", ghost: true,
      onClick: function () {
        state.rate = 10;
        state.hold = 0;
        state.mode = "CCT";
        rateInput.value = String(log10(10));
        holdInput.value = "0";
        rateInput.dispatchEvent(new Event("input"));
        holdInput.dispatchEvent(new Event("input"));
        var toggle = h.$('button[aria-pressed]', controls);
        if (toggle) toggle.setAttribute("aria-pressed", "true");
        render();
      }
    });

    h.addHint(root,
      "Schematic teaching curves, not a calculated CCT diagram. TTT noses: pearlite 550 °C / 1 s, " +
      "bainite 350 °C / 10 s. The CCT pearlite curve is shifted about 10× right in time and ~25 °C lower; " +
      "the bainite curve shifts less. Critical rate ≈ 250 °C/s in TTT (above the slider) and ≈ 27 °C/s in CCT. " +
      "Fractions come from how far the path penetrates the start–finish band; retained austenite is fixed at " +
      "10% of the austenite present at Ms. Hardness values are rough.");

    api.onRender(render);
    render();
  }

  api.register("ttt", init);
  api.init();
})();
