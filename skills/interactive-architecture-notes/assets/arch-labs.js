/* ============================================================
   Architecture lab engines — sits on top of labkit.js
   Public API (window.ARCH):
     ARCH.stairGeom / ARCH.coveredAt / ARCH.stairModel / ARCH.rampModel
     ARCH.uvalue(layers, options)
     ARCH.initStair / ARCH.initRamp / ARCH.initUvalue
   All geometry is in metres unless the name ends in mm.
   ============================================================ */

(function () {
  "use strict";

  var K = window.LABKIT;
  if (!K) throw new Error("labkit.js must load before arch-labs.js");
  var fmt = K.fmt;

  /* ---------------- stair model ---------------- */

  function stairGeom(H, N, Gmm, Lm) {
    var R = H / N;
    var n1 = Math.ceil(N / 2);
    var n2 = N - n1;
    var Lreq = (N - 2) * Gmm / 1000 + Lm;
    return { H: H, N: N, Gmm: Gmm, Lm: Lm, R: R, n1: n1, n2: n2, Lreq: Lreq };
  }

  function coveredAt(g, xedge) {
    var ymax = 0, xcrit = 0, label = "açık";
    function consider(x0, y, lab) {
      if (x0 < xedge - 1e-9 && y > ymax + 1e-12) {
        ymax = y; xcrit = x0; label = lab;
      }
    }
    for (var k = 1; k <= g.n1 - 1; k++) {
      consider((k - 1) * g.Gmm / 1000, k * g.R, "1. kol · " + k + ". basamak");
    }
    var xl = (g.n1 - 1) * g.Gmm / 1000;
    consider(xl, g.n1 * g.R, "ara sahanlık");
    var x2 = xl + g.Lm;
    for (var j = 1; j <= g.n2 - 1; j++) {
      consider(x2 + (j - 1) * g.Gmm / 1000, g.n1 * g.R + j * g.R,
        "2. kol · " + j + ". basamak");
    }
    return { ymax: ymax, xcrit: xcrit, label: label };
  }

  function minOpeningForHeadroom(g, p) {
    if (p.H - p.t < 2.20 - 1e-9) return null;
    var best = 0;
    for (var x = 0; x <= g.Lreq + 1e-9; x += 0.005) {
      var cov = coveredAt(g, x);
      if (p.H - p.t - cov.ymax >= 2.20 - 1e-9) best = x;
    }
    return g.Lreq - best;
  }

  function stairModel(p) {
    var g = stairGeom(p.H, p.N, p.Gmm, p.Lm);
    var xedge = Math.max(0, g.Lreq - p.Lopen);
    var cov = coveredAt(g, xedge);
    var hmin = p.H - p.t - cov.ymax;
    var Rmax = p.accessible ? 160 : 180;
    var Wmin = p.building === "konut" ? 1.20 : 1.50;
    var blondel = 2 * g.R * 1000 + p.Gmm;
    var checks = [
      { id: "R", label: "Rıht yüksekliği R", value: g.R * 1000,
        display: fmt(g.R * 1000, 1) + " mm", limit: "≤ " + Rmax + " mm",
        pass: g.R * 1000 <= Rmax + 1e-9, ref: "TS 9111 4.7.1.3.1" },
      { id: "G", label: "Basamak derinliği G", value: p.Gmm,
        display: fmt(p.Gmm, 0) + " mm", limit: "≥ 280 mm",
        pass: p.Gmm >= 280 - 1e-9, ref: "TS 9111 4.7.1.3.1" },
      { id: "B", label: "Blondel 2R + G", value: blondel,
        display: fmt(blondel, 1) + " mm", limit: "600–640 mm",
        pass: blondel >= 600 - 1e-9 && blondel <= 640 + 1e-9,
        ref: "TS 9111 4.7.1.3.1" },
      { id: "Lm", label: "Ara sahanlık L_m", value: p.Lm,
        display: fmt(p.Lm, 2) + " m", limit: "≥ 1.50 m",
        pass: p.Lm >= 1.50 - 1e-9, ref: "TS 9111 4.7.1.3.2" },
      { id: "F", label: "Kol başına rıht", value: Math.max(g.n1, g.n2),
        display: g.n1 + " + " + g.n2, limit: "≤ 10",
        pass: Math.max(g.n1, g.n2) <= 10, ref: "TS 9111 4.7.1.3.2" },
      { id: "W", label: "Merdiven genişliği W", value: p.W,
        display: fmt(p.W, 2) + " m", limit: "≥ " + fmt(Wmin, 2) + " m",
        pass: p.W >= Wmin - 1e-9, ref: "TS 9111 4.7.1.3.2" },
      { id: "P", label: "Plan uzunluğu L_req", value: g.Lreq,
        display: fmt(g.Lreq, 2) + " m", limit: "≤ " + fmt(p.Lavail, 2) + " m",
        pass: g.Lreq <= p.Lavail + 1e-9, ref: "yerleşim / kovan" },
      { id: "H", label: "Baş yüksekliği h_min", value: hmin,
        display: fmt(hmin, 2) + " m", limit: "≥ 2.20 m",
        pass: hmin >= 2.20 - 1e-9, ref: "TS 9111 4.7.1.1" }
    ];
    var fails = checks.filter(function (c) { return !c.pass; });
    return {
      mode: "stair", H: p.H, N: p.N, Gmm: p.Gmm, W: p.W, Lm: p.Lm,
      Lavail: p.Lavail, Lopen: p.Lopen, t: p.t, building: p.building,
      accessible: p.accessible, R: g.R, Rmm: g.R * 1000, n1: g.n1, n2: g.n2,
      Lreq: g.Lreq, xedge: xedge, cov: cov, hmin: hmin, blondel: blondel,
      Rmax: Rmax, Wmin: Wmin, checks: checks, fails: fails,
      passCount: checks.length - fails.length, allPass: fails.length === 0,
      openingMin: minOpeningForHeadroom(g, p)
    };
  }

  function rampGeom(H) {
    var imax = 1 / 12;
    var maxRise = Math.min(0.76, 9.00 * imax);
    var nr = Math.max(1, Math.ceil(H / maxRise - 1e-12));
    var hi = H / nr;
    var li = hi / imax;
    var Lreq = nr * li + (nr + 1) * 1.50;
    return { H: H, imax: imax, maxRise: maxRise, nr: nr, hi: hi, li: li,
      Lreq: Lreq, landings: nr + 1 };
  }

  function rampModel(p) {
    var g = rampGeom(p.H);
    var checks = [
      { id: "slope", label: "Eğim", value: 1 / 12 * 100,
        display: "1:12 (" + fmt(100 / 12, 1) + "%)", limit: "≤ 1:12",
        pass: true, ref: "TS 9111 4.7.1.3.1" },
      { id: "rise", label: "Kot farkı", value: p.H,
        display: fmt(p.H, 2) + " m", limit: "≤ 0.76 m / rampa",
        pass: p.H <= 0.76 + 1e-9, ref: "TS 9111 4.7.1.3.1" },
      { id: "landing", label: "Sahanlık", value: 1.50,
        display: "1.50 m", limit: "≥ 1.50 m", pass: true,
        ref: "TS 9111 4.7.1.3.2" },
      { id: "length", label: "Toplam uzunluk", value: g.Lreq,
        display: fmt(g.Lreq, 2) + " m", limit: "≤ " + fmt(p.Lavail, 2) + " m",
        pass: g.Lreq <= p.Lavail + 1e-9, ref: "yerleşim / kovan" }
    ];
    var fails = checks.filter(function (c) { return !c.pass; });
    return {
      mode: "ramp", H: p.H, Lavail: p.Lavail, W: p.W,
      imax: g.imax, nr: g.nr, hi: g.hi, li: g.li, Lreq: g.Lreq,
      checks: checks, fails: fails, allPass: fails.length === 0,
      passCount: checks.length - fails.length
    };
  }

  /* ---------------- U-value ---------------- */

  var LAYERS = [
    { name: "Dış sıva", t: 0.020, lambda: 0.87 },
    { name: "Tuğla duvar", t: 0.190, lambda: 0.45 },
    { name: "EPS yalıtım", t: 0.080, lambda: 0.035, param: "ins" },
    { name: "İç sıva", t: 0.015, lambda: 0.35 }
  ];

  function uvalue(ins, target) {
    var layers = LAYERS.map(function (l) {
      return { name: l.name, t: l.param === "ins" ? ins / 1000 : l.t, lambda: l.lambda };
    });
    var Rsi = 0.13, Rse = 0.04;
    var Rlayers = layers.reduce(function (sum, l) { return sum + l.t / l.lambda; }, 0);
    var R = Rsi + Rse + Rlayers;
    var U = 1 / R;
    var Rreq = 1 / target;
    var insReq = Math.max(0, (Rreq - Rsi - Rse -
      layers.filter(function (l) { return l.name !== "EPS yalıtım"; })
        .reduce(function (s, l) { return s + l.t / l.lambda; }, 0)) * 0.035) * 1000;
    return { layers: layers, Rsi: Rsi, Rse: Rse, Rlayers: Rlayers, R: R, U: U,
      target: target, insReq: insReq, pass: U <= target + 1e-9,
      thickness: layers.reduce(function (s, l) { return s + l.t; }, 0) };
  }

  /* ---------------- drawing helpers ---------------- */

  function line(ctx, x1, y1, x2, y2, color, width, dash) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = width || 1;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }

  function text(ctx, s, x, y, color, size, align, baseline) {
    ctx.save();
    ctx.fillStyle = color; ctx.font = "500 " + (size || 10) + "px 'IBM Plex Sans', system-ui, sans-serif";
    ctx.textAlign = align || "left"; ctx.textBaseline = baseline || "middle";
    ctx.fillText(s, x, y); ctx.restore();
  }

  function arrow(ctx, x1, y1, x2, y2, color) {
    line(ctx, x1, y1, x2, y2, color, 1);
    var a = Math.atan2(y2 - y1, x2 - x1), s = 5;
    line(ctx, x2, y2, x2 - s * Math.cos(a - 0.4), y2 - s * Math.sin(a - 0.4), color, 1);
    line(ctx, x2, y2, x2 - s * Math.cos(a + 0.4), y2 - s * Math.sin(a + 0.4), color, 1);
  }

  function drawStair(m, canvasEl) {
    LABKIT.canvas(canvasEl, function (ctx, w, h) {
      var p = LABKIT.palette();
      ctx.clearRect(0, 0, w, h);
      var pad = 24;
      var narrow = w < 720;
      var planBox, secBox;
      if (narrow) {
        var bh = (h - pad * 2 - 40) * 0.46;
        planBox = { x: pad, y: pad + 14, w: w - pad * 2, h: bh };
        secBox = { x: pad, y: pad + 14 + bh + 30, w: w - pad * 2, h: bh };
      } else {
        var half = (w - pad * 3) * 0.5;
        planBox = { x: pad, y: pad + 14, w: half, h: h - pad * 2 - 20 };
        secBox = { x: pad * 2 + half, y: pad + 14, w: half, h: h - pad * 2 - 20 };
      }
      drawStairPlan(m, ctx, planBox, p);
      drawStairSection(m, ctx, secBox, p);
    });
  }

  function drawStairPlan(m, ctx, box, p) {
    text(ctx, "PLAN", box.x, box.y - 10, p.muted, 9);
    var sx = Math.min(box.w / (m.Lreq + 0.55), box.h / (2 * m.W + 0.65));
    var ox = box.x + 0.25 * sx;
    var oy = box.y + 0.25 * sx;
    var X = function (x) { return ox + x * sx; };
    var Y = function (y) { return oy + y * sx; };
    var xl = (m.n1 - 1) * m.Gmm / 1000;
    var x2 = xl + m.Lm;

    ctx.save();
    ctx.strokeStyle = p.ink; ctx.lineWidth = 1.4;
    ctx.strokeRect(X(0), Y(0), m.Lreq * sx, 2 * m.W * sx);
    ctx.strokeStyle = p.ruleStrong; ctx.lineWidth = 0.9;
    for (var k = 1; k <= m.n1 - 1; k++) {
      line(ctx, X(k * m.Gmm / 1000), Y(0), X(k * m.Gmm / 1000), Y(m.W), p.ruleStrong, 0.9);
    }
    for (var j = 1; j <= m.n2 - 1; j++) {
      line(ctx, X(x2 + j * m.Gmm / 1000), Y(m.W), X(x2 + j * m.Gmm / 1000), Y(2 * m.W), p.ruleStrong, 0.9);
    }
    line(ctx, X(xl), Y(0), X(xl), Y(2 * m.W), p.ink, 1);
    line(ctx, X(x2), Y(0), X(x2), Y(2 * m.W), p.ink, 1);
    line(ctx, X(m.xedge), Y(0), X(m.xedge), Y(2 * m.W), p.accent, 1.2, [4, 3]);
    arrow(ctx, X(0.18), Y(m.W * 0.5), X(xl - 0.12), Y(m.W * 0.5), p.accent);
    arrow(ctx, X(x2 + 0.12), Y(1.5 * m.W), X(m.Lreq - 0.12), Y(1.5 * m.W), p.accent);
    text(ctx, "1. kol", X(0.18), Y(m.W * 0.5) - 9, p.muted, 8);
    text(ctx, "2. kol", X(x2 + 0.12), Y(1.5 * m.W) - 9, p.muted, 8);
    text(ctx, "çıkış", X(m.Lreq) - 0.1, Y(1.5 * m.W) - 9, p.accent, 8, "right");
    text(ctx, "L_req = " + fmt(m.Lreq, 2) + " m", X(m.Lreq / 2), Y(2 * m.W) + 13, p.ink2, 8, "center");
    text(ctx, "kovan ağzı", X(m.xedge) + 3, Y(0) - 9, p.accent, 8);
    text(ctx, "W = " + fmt(m.W, 2) + " m", X(m.Lreq) + 5, Y(m.W), p.muted, 8);
    ctx.restore();
  }

  function drawStairSection(m, ctx, box, p) {
    text(ctx, "KESİT A–A", box.x, box.y - 10, p.muted, 9);
    var sx = Math.min(box.w / (m.Lreq + 2.05), box.h / (m.H + m.t + 0.75));
    var ox = box.x + 0.10 * sx;
    var oy = box.y + box.h - 0.28 * sx;
    var X = function (x) { return ox + x * sx; };
    var Y = function (y) { return oy - y * sx; };
    var xl = (m.n1 - 1) * m.Gmm / 1000;
    var x2 = xl + m.Lm;
    var slabY = Y(m.H + m.t);
    var slabH = Math.max(3, m.t * sx);

    ctx.save();
    ctx.fillStyle = "rgba(30,27,23,0.14)";
    ctx.fillRect(X(0), slabY, Math.max(0, m.xedge) * sx, slabH);
    ctx.strokeStyle = p.ink; ctx.lineWidth = 1;
    ctx.strokeRect(X(0), slabY, Math.max(0, m.xedge) * sx, slabH);
    // stair profile
    ctx.beginPath();
    ctx.moveTo(X(0), Y(0));
    for (var i = 1; i <= m.n1 - 1; i++) {
      var xx = (i - 1) * m.Gmm / 1000;
      ctx.lineTo(X(xx), Y(i * m.R));
      ctx.lineTo(X(xx + m.Gmm / 1000), Y(i * m.R));
    }
    ctx.lineTo(X(xl), Y(m.n1 * m.R));
    ctx.lineTo(X(x2), Y(m.n1 * m.R));
    for (var q = 1; q <= m.n2 - 1; q++) {
      var xq = x2 + (q - 1) * m.Gmm / 1000;
      ctx.lineTo(X(xq), Y(m.n1 * m.R + q * m.R));
      ctx.lineTo(X(xq + m.Gmm / 1000), Y(m.n1 * m.R + q * m.R));
    }
    ctx.lineTo(X(m.Lreq), Y(m.H));
    ctx.strokeStyle = p.ink; ctx.lineWidth = 1.5; ctx.stroke();
    // headroom
    var cx = m.cov.xcrit;
    line(ctx, X(cx), Y(m.cov.ymax), X(cx), slabY, m.allPass ? p.ok : p.bad, 1.1);
    arrow(ctx, X(cx), Y(m.cov.ymax), X(cx), Y(m.cov.ymax) - 5, m.allPass ? p.ok : p.bad);
    arrow(ctx, X(cx), slabY, X(cx), slabY + 5, m.allPass ? p.ok : p.bad);
    text(ctx, "h = " + fmt(m.hmin, 2) + " m", X(cx) + 5, (Y(m.cov.ymax) + slabY) / 2,
      m.allPass ? p.ok : p.bad, 8);
    line(ctx, X(0), Y(0), X(m.Lreq), Y(0), p.ink2, 1);
    line(ctx, X(m.Lreq), Y(0), X(m.Lreq), Y(m.H), p.muted, 1, [3, 2]);
    text(ctx, "H = " + fmt(m.H, 2) + " m", X(m.Lreq) + 5, Y(m.H / 2), p.muted, 8);
    text(ctx, "üst döşeme", X(0.02), slabY - 9, p.muted, 8);
    text(ctx, "kovan", X(m.xedge) + 5, slabY - 9, p.accent, 8);
    ctx.restore();
  }

  function drawRamp(m, canvasEl) {
    LABKIT.canvas(canvasEl, function (ctx, w, h) {
      var p = LABKIT.palette();
      ctx.clearRect(0, 0, w, h);
      var pad = 34;
      var sx = (w - pad * 2) / Math.max(m.Lreq, 0.1);
      var sy = (h - pad * 2) / Math.max(m.H + 0.4, 0.1);
      var s = Math.min(sx, sy);
      var ox = pad, oy = h - pad;
      var X = function (x) { return ox + x * s; };
      var Y = function (y) { return oy - y * s; };
      // ground and ramp profile
      line(ctx, X(0), Y(0), X(m.Lreq), Y(0), p.ruleStrong, 1, [3, 3]);
      var x = 0, y = 0;
      for (var i = 0; i < m.nr; i++) {
        // landing
        line(ctx, X(x), Y(y), X(x + 1.5), Y(y), p.ink, 1.6);
        x += 1.5;
        // slope
        line(ctx, X(x), Y(y), X(x + m.li), Y(y + m.hi), p.accent, 2);
        x += m.li; y += m.hi;
      }
      line(ctx, X(x), Y(y), X(x + 1.5), Y(y), p.ink, 1.6);
      // dimensions
      text(ctx, "1:12", X(m.li / 2), Y(y / 2) - 8, p.accent, 10, "center");
      text(ctx, "L = " + fmt(m.Lreq, 2) + " m", X(m.Lreq / 2), Y(0) + 14, p.muted, 9, "center");
      text(ctx, "H = " + fmt(m.H, 2) + " m", X(m.Lreq) + 6, Y(m.H / 2), p.muted, 9);
      text(ctx, m.nr + " rampa · " + m.landings + " sahanlık", X(0), Y(m.H) - 14, p.ink2, 10);
    });
  }

  function drawUvalue(m, canvasEl) {
    LABKIT.canvas(canvasEl, function (ctx, w, h) {
      var p = LABKIT.palette();
      ctx.clearRect(0, 0, w, h);
      var pad = 34;
      var total = m.thickness;
      var maxW = w - pad * 2;
      var x = pad, y = 50, bh = Math.min(120, h - 120);
      var minW = 8;
      var widths = m.layers.map(function (l) { return Math.max(minW, l.t / total * maxW); });
      var sum = widths.reduce(function (a, b) { return a + b; }, 0);
      widths = widths.map(function (v) { return v / sum * maxW; });
      m.layers.forEach(function (l, i) {
        var fill = i === 2 ? "rgba(154,90,0,0.28)" : "rgba(30,27,23,0.08)";
        ctx.fillStyle = fill; ctx.fillRect(x, y, widths[i], bh);
        ctx.strokeStyle = p.ink; ctx.lineWidth = 1; ctx.strokeRect(x, y, widths[i], bh);
        ctx.save();
        ctx.translate(x + widths[i] / 2, y + bh / 2);
        ctx.rotate(-Math.PI / 2);
        text(ctx, l.name, 0, 0, p.ink2, 9, "center");
        ctx.restore();
        text(ctx, fmt(l.t * 1000, 0) + " mm", x + widths[i] / 2, y + bh + 12, p.muted, 9, "center");
        x += widths[i];
      });
      text(ctx, "iç", pad - 6, y - 10, p.muted, 9, "right");
      text(ctx, "dış", pad + maxW + 6, y - 10, p.muted, 9);
      text(ctx, "R = " + fmt(m.R, 2) + " m²K/W   ·   U = " + fmt(m.U, 3) + " W/(m²K)",
        pad, y + bh + 38, p.ink, 11);
      text(ctx, m.pass ? "hedefi sağlıyor" : "hedefin üstünde", pad, y + bh + 56,
        m.pass ? p.ok : p.bad, 10);
    });
  }

  /* ---------------- binders ---------------- */

  function initStair(root) {
    return LABKIT.initLab(root, function (s, canvasEl) {
      var m = stairModel(s);
      drawStair(m, canvasEl);
      var rows = m.checks.map(function (c) {
        return [c.label, c.display + " / " + c.limit + (c.pass ? " ✓" : " ✗")];
      });
      var status;
      if (m.allPass) {
        status = "Tüm kontroller sağlanıyor. R = " + fmt(m.Rmm, 1) + " mm, 2R+G = " +
          fmt(m.blondel, 1) + " mm, baş yüksekliği " + fmt(m.hmin, 2) + " m. Plan " +
          fmt(m.Lreq, 2) + " m, kovan " + fmt(m.Lavail, 2) + " m.";
      } else {
        var first = m.fails[0];
        status = first.label + " sağlanmıyor: " + first.display + " (" + first.limit + "). ";
        if (first.id === "H") {
          status += "Plan " + fmt(m.Lreq, 2) + " m ile sığıyor ama kesitte baş yüksekliği " +
            fmt(m.hmin, 2) + " m; kovan ağzını en az " +
            (m.openingMin === null ? "—" : fmt(m.openingMin, 2) + " m") + " kaydırmak gerekir.";
        } else {
          status += "Önce " + first.ref + " koşulunu düzeltin; diğer kontroller bunun ardından anlamlıdır.";
        }
      }
      return { readout: rows, status: status, tone: m.allPass ? "ok" : "bad",
        aria: "Merdiven planı ve kesiti; baş yüksekliği " + fmt(m.hmin, 2) + " metre." };
    });
  }

  function initRamp(root) {
    return LABKIT.initLab(root, function (s, canvasEl) {
      var m = rampModel(s);
      drawRamp(m, canvasEl);
      var rows = m.checks.map(function (c) {
        return [c.label, c.display + " / " + c.limit + (c.pass ? " ✓" : " ✗")];
      });
      return {
        readout: rows,
        status: m.allPass
          ? "Rampa " + fmt(m.H, 2) + " m kot farkını " + m.nr + " rampa ve " +
            m.landings + " sahanlıkla çözer; toplam " + fmt(m.Lreq, 2) + " m."
          : "Toplam uzunluk " + fmt(m.Lreq, 2) + " m, ayrılan " + fmt(m.Lavail, 2) +
            " m'yi aşıyor. Kot farkını bölün veya daha uzun bir güzergâh seçin.",
        tone: m.allPass ? "ok" : "bad",
        aria: "Rampa kesiti; eğim 1:12, toplam uzunluk " + fmt(m.Lreq, 2) + " metre."
      };
    });
  }

  function initUvalue(root) {
    return LABKIT.initLab(root, function (s, canvasEl) {
      var m = uvalue(s.ins, s.target);
      drawUvalue(m, canvasEl);
      var rows = [
        ["Duvar kalınlığı", fmt(m.thickness * 1000, 0) + " mm"],
        ["Toplam R", fmt(m.R, 3) + " m²K/W"],
        ["U değeri", fmt(m.U, 3) + " W/(m²K)"],
        ["Hedef U", fmt(m.target, 2) + " W/(m²K)"],
        ["Gerekli EPS", fmt(m.insReq, 0) + " mm"]
      ];
      return {
        readout: rows,
        status: m.pass
          ? "U = " + fmt(m.U, 3) + " ≤ " + fmt(m.target, 2) + " W/(m²K). " +
            fmt(s.ins, 0) + " mm EPS yeterli; hedef için en az " + fmt(m.insReq, 0) + " mm gerekir."
          : "U = " + fmt(m.U, 3) + " > " + fmt(m.target, 2) + " W/(m²K). " +
            "Hedefe ulaşmak için EPS kalınlığını " + fmt(m.insReq, 0) + " mm'ye çıkarın.",
        tone: m.pass ? "ok" : "bad",
        aria: "Duvar kesiti; U değeri " + fmt(m.U, 3) + " W/m²K."
      };
    });
  }

  function boot() {
    LABKIT.$$("[data-lab='stair']").forEach(initStair);
    LABKIT.$$("[data-lab='ramp']").forEach(initRamp);
    LABKIT.$$("[data-lab='uvalue']").forEach(initUvalue);
    if ("MutationObserver" in window) {
      new MutationObserver(function () {
        LABKIT.$$("canvas[data-canvas]").forEach(function (c) {
          if (c.__labCanvas) c.__labCanvas.redraw();
        });
      }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    }
    LABKIT.quiz(document);
    if (/[?&]selftest=1/.test(location.search)) LABKIT.runChecks();
  }

  /* ---------------- selftests ---------------- */

  LABKIT.check("stair: default R = 157.9 mm", function () {
    var m = stairModel({ H: 3.0, N: 19, Gmm: 300, Lm: 1.5, W: 1.5, Lavail: 8.0,
      Lopen: 4.0, t: 0.30, building: "konut", accessible: true });
    return Math.abs(m.Rmm - 157.8947) < 0.01;
  });
  LABKIT.check("stair: default 2R+G = 615.8 mm", function () {
    var m = stairModel({ H: 3.0, N: 19, Gmm: 300, Lm: 1.5, W: 1.5, Lavail: 8.0,
      Lopen: 4.0, t: 0.30, building: "konut", accessible: true });
    return Math.abs(m.blondel - 615.789) < 0.01;
  });
  LABKIT.check("stair: plan fits but headroom fails", function () {
    var m = stairModel({ H: 3.0, N: 19, Gmm: 300, Lm: 1.5, W: 1.5, Lavail: 8.0,
      Lopen: 4.0, t: 0.30, building: "konut", accessible: true });
    return m.Lreq <= m.Lavail && m.hmin < 2.20 && !m.allPass;
  });
  LABKIT.check("stair: opening 5.70 m passes headroom", function () {
    var m = stairModel({ H: 3.0, N: 19, Gmm: 300, Lm: 1.5, W: 1.5, Lavail: 8.0,
      Lopen: 5.70, t: 0.30, building: "konut", accessible: true });
    return m.hmin >= 2.20 - 1e-9;
  });
  LABKIT.check("uvalue: 80 mm EPS gives U about 0.34", function () {
    var m = uvalue(80, 0.40);
    return Math.abs(m.U - 0.340) < 0.003;
  });

  window.ARCH = {
    stairGeom: stairGeom, coveredAt: coveredAt, stairModel: stairModel,
    rampGeom: rampGeom, rampModel: rampModel, uvalue: uvalue,
    initStair: initStair, initRamp: initRamp, initUvalue: initUvalue
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
