/* Second-order standard-form step response, poles, and unit-step error. */
(function () {
  "use strict";
  if (!window.EE) return;
  var E = window.EE;

  function metrics(zeta, wn, K) {
    var under = zeta < 1 - 1e-12;
    var Mp, tp, ts, poles, reN, imN, p1, p2;
    if (under) {
      var q = Math.sqrt(Math.max(1 - zeta * zeta, 0));
      var wd = wn * q;
      Mp = 100 * Math.exp(-Math.PI * zeta / Math.max(q, 1e-12));
      tp = Math.PI / wd;
      ts = zeta > 0 ? 4 / (zeta * wn) : Infinity;
      p1 = -zeta * wn;
      p2 = wd;
      poles = [p1, p2];
      reN = -zeta;
      imN = q;
    } else {
      var r = Math.sqrt(Math.max(zeta * zeta - 1, 0));
      p1 = -zeta * wn + wn * r;
      p2 = -zeta * wn - wn * r;
      Mp = 0;
      tp = NaN;
      ts = 4 / Math.abs(p1);
      poles = [p1, p2];
      reN = p1 / wn;
      imN = 0;
    }
    return { Mp: Mp, tp: tp, ts: ts, poles: poles, reN: reN, imN: imN, ess: 1 - K };
  }

  function step(t, zeta, wn) {
    if (zeta < 1 - 1e-9) {
      var q = Math.sqrt(Math.max(1 - zeta * zeta, 0));
      var wd = wn * q;
      return 1 - Math.exp(-zeta * wn * t) *
        (Math.cos(wd * t) + zeta / Math.max(q, 1e-12) * Math.sin(wd * t));
    }
    if (Math.abs(zeta - 1) < 1e-9) {
      return 1 - Math.exp(-wn * t) * (1 + wn * t);
    }
    var r = Math.sqrt(zeta * zeta - 1);
    var a = wn * (zeta - r), b = wn * (zeta + r);
    return 1 - (b * Math.exp(-a * t) - a * Math.exp(-b * t)) / (b - a);
  }

  E.registerLab("control", function (s, el) {
    var p = E.palette();
    var zeta = E.clamp(s.zeta, 0, 2);
    var wn = E.clamp(s.wn, 0.5, 10);
    var K = E.clamp(s.k, 0.5, 1.5);
    var m = metrics(zeta, wn, K);
    var tmax = isFinite(m.ts) ? 1.35 * m.ts : 4 * Math.PI / wn;
    if (zeta < 0.1) tmax = Math.min(tmax, 12 / wn);
    if (isFinite(m.tp)) tmax = Math.max(tmax, 1.2 * m.tp);
    tmax = Math.max(tmax, 1.5 / wn);
    var ymax = Math.max(0.8, Math.ceil((K * (1 + m.Mp / 100) + 0.05) / 0.2) * 0.2);

    E.canvas(el, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var topH = Math.round((h - 10) * 0.62);
      var botY = topH + 10;
      var botH = h - botY;

      var ax = E.axes(ctx, { x: 0, y: 0, w: w, h: topH }, {
        xmin: 0, xmax: tmax, ymin: -0.04, ymax: ymax,
        xlabel: "t (s)", ylabel: "y(t)", nx: 4, ny: 4, xdigits: 2, ydigits: 2,
        padLeft: 38, padRight: 10, padBottom: 28
      });
      E.dash(ctx, ax.plot.x, ax.sy(1.02 * K), ax.plot.x + ax.plot.w, ax.sy(1.02 * K),
        { color: p.muted, dash: [2, 4], width: 1 });
      E.dash(ctx, ax.plot.x, ax.sy(0.98 * K), ax.plot.x + ax.plot.w, ax.sy(0.98 * K),
        { color: p.muted, dash: [2, 4], width: 1 });
      E.dash(ctx, ax.plot.x, ax.sy(K), ax.plot.x + ax.plot.w, ax.sy(K),
        { color: p.ink2, dash: [5, 4], width: 1 });

      var pts = [], i, t, y;
      for (i = 0; i <= 320; i++) {
        t = tmax * i / 320;
        y = K * step(t, zeta, wn);
        pts.push([ax.sx(t), ax.sy(y)]);
      }
      E.line(ctx, pts, { color: p.blue, width: 2 });

      if (isFinite(m.tp) && m.tp <= tmax) {
        E.dash(ctx, ax.sx(m.tp), ax.plot.y, ax.sx(m.tp), ax.plot.y + ax.plot.h,
          { color: p.muted, dash: [3, 3] });
        E.label(ctx, "t_p", ax.sx(m.tp) + 3, ax.plot.y + ax.plot.h * 0.55,
          { size: 9, color: p.muted, background: p.sheet });
        E.dot(ctx, ax.sx(m.tp), ax.sy(K * (1 + m.Mp / 100)), 3, { fill: p.accent });
        E.label(ctx, "Mp", ax.sx(m.tp) + 6, ax.sy(K * (1 + m.Mp / 100)) - 2,
          { size: 9, color: p.accent, align: "left" });
      }
      if (isFinite(m.ts) && m.ts <= tmax) {
        E.dash(ctx, ax.sx(m.ts), ax.plot.y, ax.sx(m.ts), ax.plot.y + ax.plot.h,
          { color: p.green, dash: [3, 3] });
        E.label(ctx, "t_s", ax.sx(m.ts) + 3, ax.plot.y + ax.plot.h - 8,
          { size: 9, color: p.green, background: p.sheet });
      }
      E.label(ctx, "K", ax.plot.x + 4, ax.sy(K) - 8,
        { size: 9, color: p.ink2, align: "left" });

      var xmin = Math.min(-1.2, Math.min(m.poles[0], m.poles[1]) / wn * 1.19);
      var xmax = 0.45;
      var ymaxP = Math.max(1.25, Math.abs(m.imN) * 1.28);
      var axp = E.axes(ctx, { x: 0, y: botY, w: w, h: botH }, {
        xmin: xmin, xmax: xmax, ymin: -ymaxP, ymax: ymaxP,
        xlabel: "Re(s)/ωn", ylabel: "Im/ωn", nx: 4, ny: 2, xdigits: 1, ydigits: 1,
        padLeft: 38, padRight: 10, padBottom: 28
      });
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = p.band;
      ctx.fillRect(axp.plot.x, axp.plot.y, axp.sx(0) - axp.plot.x, axp.plot.h);
      ctx.restore();
      E.dash(ctx, axp.sx(0), axp.plot.y, axp.sx(0), axp.plot.y + axp.plot.h,
        { color: p.ruleStrong, dash: [4, 4] });
      E.label(ctx, "jω", axp.sx(0) + 3, axp.plot.y + 8, { size: 9, color: p.muted });

      var pl = m.imN > 1e-9
        ? [[m.poles[0] / wn, m.imN], [m.poles[0] / wn, -m.imN]]
        : [[m.poles[0] / wn, 0], [m.poles[1] / wn, 0]];
      pl.forEach(function (q) {
        var px = axp.sx(q[0]), py = axp.sy(q[1]);
        E.line(ctx, [[px - 4, py - 4], [px + 4, py + 4]], { color: p.red, width: 1.8 });
        E.line(ctx, [[px - 4, py + 4], [px + 4, py - 4]], { color: p.red, width: 1.8 });
      });
      E.label(ctx, "LHP", axp.plot.x + 4, axp.plot.y + 8, { size: 9, color: p.green });
      E.label(ctx, "RHP", axp.plot.x + axp.plot.w - 2, axp.plot.y + 8,
        { size: 9, color: p.red, align: "right" });
    });

    var poleText = m.imN > 1e-9
      ? E.fmt(m.poles[0], 2) + " ± j" + E.fmt(Math.abs(m.poles[1]), 2)
      : E.fmt(m.poles[0], 2) + ", " + E.fmt(m.poles[1], 2);
    var status = "ζ = " + E.fmt(zeta, 3) + ", ωn = " + E.fmt(wn, 2) +
      " rad/s: kutuplar " + poleText + " rad/s. Mp = " + E.fmt(m.Mp, 1) +
      "%, tp = " + (isFinite(m.tp) ? E.fmt(m.tp, 3) + " s" : "—") +
      ", ts (%2) ≈ " + (isFinite(m.ts) ? E.fmt(m.ts, 2) + " s" : "∞") +
      "; zarf τ = 1/(ζωn) = " + (zeta > 0 ? E.fmt(1 / (zeta * wn), 2) + " s" : "∞") + ". ";
    if (zeta < 1e-9) {
      status += "ζ = 0 sınırı: sönüm yok, kutuplar sanal eksende; sistem marjinal kararlı, tepki hiç oturmaz. Negatif geri besleme tek başına kararlılık garantisi değildir.";
    } else if (zeta < 0.999999) {
      status += "ζ arttıkça üstel zarf exp(−πζ/√(1−ζ²)) küçülür; Mp düşer. tp yalnızca ωd = ωn√(1−ζ²) ile ölçeklenir.";
    } else if (zeta < 1.000001) {
      status += "ζ = 1: kutuplar −ωn'de çakışık; aşma yok, oturma 4/ωn ile belirlenir.";
    } else {
      status += "ζ > 1: iki gerçek kutup; yavaş kutup oturmayı belirler, aşma yoktur.";
    }
    status += " K = " + E.fmt(K, 2) + " ise birim basamakta son değer K, kalıcı hata 1−K = " +
      E.fmt(m.ess * 100, 1) + "%.";

    return {
      readout: E.readout([
        ["ζ", E.fmt(zeta, 3), "—"],
        ["ωn", E.fmt(wn, 2), "rad/s"],
        ["K (DC)", E.fmt(K, 2), "—"],
        ["Mp", E.fmt(m.Mp, 1), "%"],
        ["tp", isFinite(m.tp) ? E.fmt(m.tp, 3) : "—", "s"],
        ["ts (%2)", isFinite(m.ts) ? E.fmt(m.ts, 2) : "∞", "s"],
        ["τ_zarf", zeta > 0 ? E.fmt(1 / (zeta * wn), 2) : "∞", "s"],
        ["Kutuplar", poleText, "rad/s"],
        ["e_ss", E.fmt(m.ess * 100, 1), "%"]
      ]),
      status: status,
      tone: zeta < 1e-9 ? "bad" : (zeta <= 1.000001 ? "ok" : ""),
      aria: "İkinci mertebe sistem: zeta " + E.fmt(zeta, 3) + ", omega n " + E.fmt(wn, 2) +
        " radyan bölü saniye. Aşma yüzde " + E.fmt(m.Mp, 1) + ", tepe zamanı " +
        (isFinite(m.tp) ? E.fmt(m.tp, 3) + " saniye" : "yok") + ", oturma süresi " +
        (isFinite(m.ts) ? E.fmt(m.ts, 2) + " saniye" : "sonsuz") + ". Kutuplar " + poleText + ".",
      print: "Statik yedek: ζ = " + E.fmt(zeta, 3) + ", ωn = " + E.fmt(wn, 2) +
        " rad/s, K = " + E.fmt(K, 2) + " → Mp = " + E.fmt(m.Mp, 1) + "%, tp = " +
        (isFinite(m.tp) ? E.fmt(m.tp, 3) + " s" : "—") + ", ts ≈ " +
        (isFinite(m.ts) ? E.fmt(m.ts, 2) + " s" : "∞") + ", kutuplar " + poleText +
        ", e_ss = " + E.fmt(m.ess * 100, 1) + "%."
    };
  });

  E.check("control: ζ=0.5, ωn=2 → Mp 16.30%, tp 1.8138 s", function () {
    var m = metrics(0.5, 2, 1);
    return Math.abs(m.Mp - 16.3034) < 0.02 && Math.abs(m.tp - 1.8138) < 1e-3;
  });
  E.check("control: ζ=1 → Mp 0, çakışık kutuplar, ts 2 s", function () {
    var m = metrics(1, 2, 1);
    return m.Mp === 0 && Math.abs(m.ts - 2) < 1e-9 &&
      Math.abs(m.poles[0] + 2) < 1e-9 && Math.abs(m.poles[1] + 2) < 1e-9;
  });
  E.check("control: ζ=0.7071 → Mp 4.32%; K=0.8 → e_ss 0.2", function () {
    var a = metrics(Math.SQRT1_2, 1, 1);
    var b = metrics(0.5, 2, 0.8);
    return Math.abs(a.Mp - 4.3214) < 0.02 && Math.abs(a.reN + Math.SQRT1_2) < 1e-9 &&
      Math.abs(b.ess - 0.2) < 1e-12;
  });
})();
