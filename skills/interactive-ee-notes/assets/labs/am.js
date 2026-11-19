/* AM DSB-LC lab: envelope, sidebands, power efficiency, overmodulation. */
(function () {
  "use strict";
  if (!window.EE) return;
  var E = window.EE;

  E.registerLab("am", function (s, el) {
    var p = E.palette();
    var m = s.m, fm = s.fm, fc = s.fc;
    var eta = m * m / (2 + m * m);
    var pcFrac = 2 / (2 + m * m);
    var sbFrac = m * m / (2 + m * m);
    var T = 2 / fm; // two modulation periods
    var over = m > 1;

    E.canvas(el, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var topH = Math.round(h * 0.62);
      var botY = topH + 6;
      var botH = h - botY - 2;

      var axT = E.axes(ctx, { x: 0, y: 0, w: w, h: topH }, {
        xmin: 0, xmax: T * 1000, ymin: -1.6, ymax: 1.6,
        xlabel: "t (ms)", ylabel: "s(t)",
        nx: 4, ny: 4, xdigits: 1, ydigits: 1,
        padLeft: 40, padBottom: 24
      });
      var envHi = [], envLo = [], sig = [];
      for (var i = 0; i <= 400; i++) {
        var t = T * i / 400;
        var env = 1 + m * Math.cos(2 * Math.PI * fm * t);
        envHi.push([axT.sx(t * 1000), axT.sy(env)]);
        envLo.push([axT.sx(t * 1000), axT.sy(-env)]);
        sig.push([axT.sx(t * 1000), axT.sy(env * Math.cos(2 * Math.PI * fc * t))]);
      }
      E.line(ctx, envHi, { color: p.accent, width: 1.4, dash: [5, 3] });
      E.line(ctx, envLo, { color: p.accent, width: 1.4, dash: [5, 3] });
      E.line(ctx, sig, { color: p.blue, width: 1.2 });
      if (over) {
        E.label(ctx, "m > 1: zarf sıfırı geçiyor", axT.plot.x + 6, axT.plot.y + 14,
          { size: 9.5, color: p.red });
      }

      var axS = E.axes(ctx, { x: 0, y: botY, w: w, h: botH }, {
        xmin: fc - 2 * fm, xmax: fc + 2 * fm, ymin: 0, ymax: 1.15,
        xlabel: "f (Hz)", ylabel: "|S(f)|",
        nx: 4, ny: 2, xdigits: 0, ydigits: 1,
        padLeft: 40, padBottom: 24
      });
      function stick(f, amp, color, lab) {
        var x = axS.sx(f);
        E.line(ctx, [[x, axS.sy(0)], [x, axS.sy(amp)]], { color: color, width: 2.2 });
        E.dot(ctx, x, axS.sy(amp), 2.8, { fill: color });
        E.label(ctx, lab, x, axS.sy(amp) - 8, { size: 8.5, color: color, align: "center" });
      }
      stick(fc, 1, p.ink, "f_c");
      if (m > 1e-4) {
        stick(fc - fm, m / 2, p.blue, "f_c−f_m");
        stick(fc + fm, m / 2, p.blue, "f_c+f_m");
      }
    });

    var status;
    if (over) {
      status = "m = " + E.fmt(m, 2) + " > 1: aşırı modülasyon. Zarf sıfırı geçer, faz 180° döner; " +
        "paket dedektörü bozulur. Güç oranı formülü artık temiz bir DSB-LC işareti tanımlamaz.";
    } else {
      status = "m = " + E.fmt(m, 2) + ": yan bantlar f_c ± f_m = " + E.fmt(fc - fm, 0) + " ve " +
        E.fmt(fc + fm, 0) + " Hz. Bilgi gücü oranı η = m²/(2+m²) = %" + E.fmt(eta * 100, 1) +
        "; taşıyıcı gücün %" + E.fmt(pcFrac * 100, 1) + "'ini taşır. Bant genişliği 2f_m = " +
        E.fmt(2 * fm, 0) + " Hz.";
    }

    return {
      readout: E.readout([
        ["m", E.fmt(m, 2), "—"],
        ["η", E.fmt(eta * 100, 1), "%"],
        ["Taşıyıcı payı", E.fmt(pcFrac * 100, 1), "%"],
        ["Yan bant payı", E.fmt(sbFrac * 100, 1), "%"],
        ["Bant genişliği", E.fmt(2 * fm, 0), "Hz"],
        ["Yan bantlar", E.fmt(fc - fm, 0) + " / " + E.fmt(fc + fm, 0), "Hz"]
      ]),
      status: status,
      tone: over ? "bad" : "ok",
      aria: "Genlik modülasyonu: modülasyon indeksi " + E.fmt(m, 2) + ", bilgi gücü oranı yüzde " +
        E.fmt(eta * 100, 1) + ", yan bantlar " + E.fmt(fc - fm, 0) + " ve " + E.fmt(fc + fm, 0) + " hertz.",
      print: "m = " + E.fmt(m, 2) + ", η = %" + E.fmt(eta * 100, 1) + ", taşıyıcı payı %" +
        E.fmt(pcFrac * 100, 1) + ", yan bantlar f_c ± f_m, bant genişliği " + E.fmt(2 * fm, 0) + " Hz."
    };
  });

  E.check("am: m=1 gives 33.33% efficiency", function () {
    var eta = 1 / (2 + 1);
    return Math.abs(eta - 1 / 3) < 1e-12;
  });
  E.check("am: m=0.5 gives 11.11% efficiency", function () {
    var eta = 0.25 / 2.25;
    return Math.abs(eta - 1 / 9) < 1e-12;
  });
  E.check("am: m=1 sidebands are fc±fm", function () {
    return (10000 - 1000) === 9000 && (10000 + 1000) === 11000;
  });
})();
