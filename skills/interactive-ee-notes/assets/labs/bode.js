/* First-order RC low-pass / high-pass Bode lab. */
(function () {
  "use strict";
  if (!window.EE) return;
  var E = window.EE;

  function response(kind, u) {
    // u = f / fc
    var mag, phase;
    if (kind === "hp") {
      mag = u / Math.sqrt(1 + u * u);
      phase = 90 - Math.atan(u) * 180 / Math.PI;
    } else {
      mag = 1 / Math.sqrt(1 + u * u);
      phase = -Math.atan(u) * 180 / Math.PI;
    }
    return { mag: mag, db: E.db(mag), phase: phase };
  }

  E.registerLab("bode", function (s, el) {
    var p = E.palette();
    var R = s.r * 1000, C = s.c * 1e-9;
    var fc = 1 / (2 * Math.PI * R * C);
    var dec = s.dec;
    var f = fc * Math.pow(10, dec);
    var u = f / fc;
    var h = response(s.kind, u);
    var fmin = fc / 100, fmax = fc * 100;

    E.canvas(el, function (ctx, w, hgt) {
      ctx.clearRect(0, 0, w, hgt);
      var topH = Math.round((hgt - 12) * 0.56);
      var botY = topH + 8;
      var botH = hgt - botY - 4;

      var axM = E.logAxes(ctx, { x: 0, y: 0, w: w, h: topH }, {
        xmin: fmin, xmax: fmax, ymin: -60, ymax: 10,
        ylabel: "|H| (dB)", xlabel: "",
        ny: 4, ydigits: 0, padLeft: 40, padBottom: 20
      });
      var ptsM = [];
      for (var i = 0; i <= 180; i++) {
        var ff = fmin * Math.pow(fmax / fmin, i / 180);
        var hh = response(s.kind, ff / fc);
        ptsM.push([axM.sx(ff), axM.sy(E.clamp(hh.db, -60, 10))]);
      }
      E.line(ctx, ptsM, { color: p.blue, width: 2 });
      E.dash(ctx, axM.sx(fc), axM.plot.y, axM.sx(fc), axM.plot.y + axM.plot.h, { color: p.muted });
      E.dash(ctx, axM.sx(f), axM.plot.y, axM.sx(f), axM.plot.y + axM.plot.h, { color: p.accent, dash: [3, 3] });
      E.label(ctx, "f_c", axM.sx(fc) + 3, axM.plot.y + 12, { size: 9.5, color: p.muted });
      E.label(ctx, "-3 dB", axM.plot.x + 4, axM.sy(-3.0103) - 8, { size: 9.5, color: p.muted });

      var axP = E.logAxes(ctx, { x: 0, y: botY, w: w, h: botH }, {
        xmin: fmin, xmax: fmax, ymin: -90, ymax: 90,
        ylabel: "faz (°)", xlabel: "f (Hz, log)",
        ny: 4, ydigits: 0, padLeft: 40, padBottom: 27
      });
      var ptsP = [];
      for (var j = 0; j <= 180; j++) {
        var f2 = fmin * Math.pow(fmax / fmin, j / 180);
        var h2 = response(s.kind, f2 / fc);
        ptsP.push([axP.sx(f2), axP.sy(h2.phase)]);
      }
      E.line(ctx, ptsP, { color: p.amber, width: 2 });
      E.dash(ctx, axP.sx(fc), axP.plot.y, axP.sx(fc), axP.plot.y + axP.plot.h, { color: p.muted });
      E.dash(ctx, axP.sx(f), axP.plot.y, axP.sx(f), axP.plot.y + axP.plot.h, { color: p.accent, dash: [3, 3] });
      E.label(ctx, "f_c", axP.sx(fc) + 3, axP.plot.y + 12, { size: 9.5, color: p.muted });
      E.label(ctx, "f", axP.sx(f) + 3, axP.plot.y + 26, { size: 9.5, color: p.accent });
    });

    var kindName = s.kind === "hp" ? "yüksek geçiren" : "alçak geçiren";
    var status = "f_c = 1/(2πRC) = " + E.fmt(fc, 0) + " Hz. f/f_c = " +
      E.fmt(u, 2) + " için |H| = " + E.fmt(h.db, 2) + " dB, faz = " +
      E.fmt(h.phase, 1) + "°. " +
      (Math.abs(dec) < 0.03
        ? "Kesimdeyiz: −3 dB ve " + (s.kind === "hp" ? "+45°" : "−45°") + "; bu, yarı güç noktasıdır."
        : dec < 0
          ? "Kesim altında " + (s.kind === "hp" ? "zayıflatma" : "geçirme") +
            " bölgesi; faz " + (s.kind === "hp" ? "90°'ye" : "0°'ye") + " yaklaşır."
          : "Kesim üstünde eğim −20 dB/dekad; faz " + (s.kind === "hp" ? "0°'ye" : "−90°'ye") + " yaklaşır.");

    return {
      readout: E.readout([
        ["f_c", E.fmt(fc, 0), "Hz"],
        ["f", E.fmt(f, 0), "Hz"],
        ["f/f_c", E.fmt(u, 3), "—"],
        ["|H|", E.fmt(h.db, 2), "dB"],
        ["|H| (lineer)", E.fmt(h.mag, 4), "—"],
        ["faz", E.fmt(h.phase, 1), "°"]
      ]),
      status: status,
      tone: Math.abs(dec) < 0.03 ? "ok" : "",
      aria: kindName + " RC süzgeç: kesim frekansı " + E.fmt(fc, 0) + " hertz, " +
        E.fmt(f, 0) + " hertzde kazanç " + E.fmt(h.db, 2) + " desibel, faz " + E.fmt(h.phase, 1) + " derece.",
      print: "f_c = " + E.fmt(fc, 0) + " Hz; f = " + E.fmt(f, 0) + " Hz için |H| = " +
        E.fmt(h.db, 2) + " dB, faz = " + E.fmt(h.phase, 1) + "°; kesimde −3 dB ve −45° (LP)."
    };
  });

  E.check("bode: fc = 1591.55 Hz for 1k and 100nF", function () {
    var fc = 1 / (2 * Math.PI * 1000 * 100e-9);
    return Math.abs(fc - 1591.5494309) < 1e-4;
  });
  E.check("bode: LP at fc is -3.0103 dB", function () {
    return Math.abs(E.db(1 / Math.SQRT2) + 3.0103) < 1e-3;
  });
  E.check("bode: LP phase at fc is -45 deg", function () {
    return Math.abs(-Math.atan(1) * 180 / Math.PI + 45) < 1e-9;
  });
})();
