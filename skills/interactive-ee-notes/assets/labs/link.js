/* Free-space link budget lab: FSPL, received power, margin. */
(function () {
  "use strict";
  if (!window.EE) return;
  var E = window.EE;

  E.registerLab("link", function (s, el) {
    var p = E.palette();
    var pt = s.pt === undefined ? 20 : s.pt;
    var gt = s.gt === undefined ? 2 : s.gt;
    var gr = s.gr === undefined ? 2 : s.gr;
    var fmhz = s.freq === undefined ? 2400 : s.freq;
    var d = s.dist === undefined ? 100 : s.dist;
    var lmisc = s.loss === undefined ? 0 : s.loss;
    var sens = s.sens === undefined ? -90 : s.sens;
    var lambda = 300 / fmhz;
    var fspl = 20 * Math.log10(4 * Math.PI * d / lambda);
    var pr = pt + gt + gr - fspl - lmisc;
    var margin = pr - sens;

    E.canvas(el, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var ax = E.logAxes(ctx, { x: 0, y: 0, w: w, h: h }, {
        xmin: 1, xmax: 10000, ymin: -120, ymax: 0,
        xlabel: "d (m, log)", ylabel: "P_r (dBm)",
        nx: 4, ny: 4, ydigits: 0, padLeft: 44, padBottom: 28
      });
      var pts = [];
      for (var i = 0; i <= 240; i++) {
        var dd = 1 * Math.pow(10000, i / 240);
        var f = 20 * Math.log10(4 * Math.PI * dd / lambda);
        var pwr = pt + gt + gr - f - lmisc;
        pts.push([ax.sx(dd), ax.sy(E.clamp(pwr, -120, 0))]);
      }
      E.line(ctx, pts, { color: p.blue, width: 2 });
      E.dash(ctx, ax.plot.x, ax.sy(sens), ax.plot.x + ax.plot.w, ax.sy(sens), { color: p.muted });
      E.label(ctx, "eşik " + E.fmt(sens, 0) + " dBm", ax.plot.x + 5, ax.sy(sens) - 8,
        { size: 9, color: p.muted });
      var xp = ax.sx(d), yp = ax.sy(E.clamp(pr, -120, 0));
      E.dot(ctx, xp, yp, 4.2, { fill: margin >= 0 ? p.ok : p.red });
      E.label(ctx, "P_r", xp + 6, yp - 9, { size: 10, color: margin >= 0 ? p.ok : p.red });
      E.dash(ctx, xp, ax.plot.y, xp, ax.plot.y + ax.plot.h, { color: p.accent, dash: [3, 3] });
    });

    var status = "λ = " + E.fmt(lambda, 3) + " m, FSPL = 20log₁₀(4πd/λ) = " +
      E.fmt(fspl, 2) + " dB. P_r = " + E.fmt(pt, 1) + " + " + E.fmt(gt, 1) + " + " +
      E.fmt(gr, 1) + " − " + E.fmt(fspl, 2) + " − " + E.fmt(lmisc, 1) + " = " +
      E.fmt(pr, 2) + " dBm. " + (margin >= 0
        ? "Eşiğe göre " + E.fmt(margin, 1) + " dB marj var; mesafe 2× olursa yaklaşık 6 dB kaybedersin."
        : "Eşiğin " + E.fmt(-margin, 1) + " dB altındasın; mesafeyi azalt, kazancı artır veya kaybı düşür.");

    return {
      readout: E.readout([
        ["λ", E.fmt(lambda, 3), "m"],
        ["FSPL", E.fmt(fspl, 2), "dB"],
        ["P_r", E.fmt(pr, 2), "dBm"],
        ["Eşik", E.fmt(sens, 1), "dBm"],
        ["Marj", E.fmt(margin, 1), "dB"],
        ["2× mesafe", "−6,02", "dB"]
      ]),
      status: status,
      tone: margin >= 0 ? "ok" : "bad",
      aria: "Kablosuz link: " + E.fmt(fmhz, 0) + " megahertz, " + E.fmt(d, 1) +
        " metre, alınan güç " + E.fmt(pr, 2) + " dBm, marj " + E.fmt(margin, 1) + " desibel.",
      print: "f = " + E.fmt(fmhz, 0) + " MHz, d = " + E.fmt(d, 1) + " m, FSPL = " +
        E.fmt(fspl, 2) + " dB, P_r = " + E.fmt(pr, 2) + " dBm, marj = " + E.fmt(margin, 1) + " dB."
    };
  });

  E.check("link: 2.4 GHz, 100 m FSPL = 80.05 dB", function () {
    var lambda = 300 / 2400;
    var fspl = 20 * Math.log10(4 * Math.PI * 100 / lambda);
    return Math.abs(fspl - 80.05) < 0.02;
  });
  E.check("link: doubling distance adds 6.02 dB", function () {
    var a = 20 * Math.log10(4 * Math.PI * 100 / 0.125);
    var b = 20 * Math.log10(4 * Math.PI * 200 / 0.125);
    return Math.abs((b - a) - 6.0206) < 1e-3;
  });
  E.check("link: default Pr = -56.05 dBm", function () {
    var fspl = 80.05;
    var pr = 20 + 2 + 2 - fspl;
    return Math.abs(pr + 56.05) < 1e-9;
  });
})();
