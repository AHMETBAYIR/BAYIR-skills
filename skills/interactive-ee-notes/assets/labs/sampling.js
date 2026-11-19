/* Sampling and aliasing lab: original tone, samples, folded tone. */
(function () {
  "use strict";
  if (!window.EE) return;
  var E = window.EE;

  function aliasOf(f0, fs) {
    return Math.abs(f0 - fs * Math.round(f0 / fs));
  }

  E.registerLab("sampling", function (s, el) {
    var p = E.palette();
    var f0 = s.f0, fs = s.fs;
    var fa = aliasOf(f0, fs);
    var nyquist = fs / 2;
    var ok = f0 < nyquist;
    var T = 0.005; // 5 ms window
    var n = Math.max(2, Math.floor(T * fs));
    var dt = 1 / fs;

    E.canvas(el, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var ax = E.axes(ctx, { x: 0, y: 0, w: w, h: h }, {
        xmin: 0, xmax: T * 1000, ymin: -1.15, ymax: 1.15,
        xlabel: "t (ms)", ylabel: "x(t)",
        nx: 5, ny: 4, xdigits: 1, ydigits: 1,
        padLeft: 40, padBottom: 26
      });

      // original
      var orig = [];
      for (var i = 0; i <= 300; i++) {
        var t = T * i / 300;
        orig.push([ax.sx(t * 1000), ax.sy(Math.sin(2 * Math.PI * f0 * t))]);
      }
      E.line(ctx, orig, { color: p.blue, width: 1.8, dash: [5, 3] });

      // sample stems and points
      for (var j = 0; j <= n; j++) {
        var ts = j * dt;
        var xs = Math.sin(2 * Math.PI * f0 * ts);
        var x = ax.sx(ts * 1000);
        E.dash(ctx, x, ax.sy(0), x, ax.sy(xs), { color: p.muted, dash: [2, 3], width: 0.8 });
        E.dot(ctx, x, ax.sy(xs), 3.2, { fill: p.accent });
      }

      // folded / reconstructed tone
      if (!ok) {
        var rec = [];
        for (var k = 0; k <= 300; k++) {
          var t2 = T * k / 300;
          rec.push([ax.sx(t2 * 1000), ax.sy(Math.sin(2 * Math.PI * fa * t2))]);
        }
        E.line(ctx, rec, { color: p.red, width: 2 });
        E.label(ctx, "alias = " + E.fmt(fa, 0) + " Hz", ax.plot.x + 8, ax.plot.y + 18,
          { size: 10, color: p.red });
      } else {
        E.label(ctx, "Nyquist sağlanıyor", ax.plot.x + 8, ax.plot.y + 18,
          { size: 10, color: p.ok });
      }
    });

    var status;
    if (ok) {
      status = "f_s = " + E.fmt(fs, 0) + " Hz > 2f_0 = " + E.fmt(2 * f0, 0) +
        " Hz; Nyquist sağlanıyor. Örneklerden asıl tonu geri kurabilirsin.";
    } else if (Math.abs(f0 - nyquist) < 1e-9) {
      status = "Tam Nyquist sınırındasın (f_0 = f_s/2); ideal örneklemede faz belirsizleşir. Pratikte f_s > 2f_0 seçilir.";
    } else {
      status = "f_s = " + E.fmt(fs, 0) + " Hz, f_0 = " + E.fmt(f0, 0) +
        " Hz. Örtüşme: görünen ton " + E.fmt(fa, 0) + " Hz. Daha çok bit bu hatayı düzeltmez; " +
        "örnekleme hızını artır veya anti-alias süzgeç kullan.";
    }

    return {
      readout: E.readout([
        ["f_0", E.fmt(f0, 0), "Hz"],
        ["f_s", E.fmt(fs, 0), "Hz"],
        ["Nyquist", E.fmt(nyquist, 0), "Hz"],
        ["Görünen f", E.fmt(fa, 0), "Hz"],
        ["Örnek sayısı", String(n + 1), "adet"],
        ["Durum", ok ? "Nyquist OK" : "Alias", ""]
      ]),
      status: status,
      tone: ok ? "ok" : "bad",
      aria: "Örnekleme: " + E.fmt(f0, 0) + " hertzlik ton, " + E.fmt(fs, 0) +
        " hertz ile örnekleniyor; görünen frekans " + E.fmt(fa, 0) + " hertz.",
      print: "f_0 = " + E.fmt(f0, 0) + " Hz, f_s = " + E.fmt(fs, 0) + " Hz, Nyquist = " +
        E.fmt(nyquist, 0) + " Hz, görünen alias = " + E.fmt(fa, 0) + " Hz."
    };
  });

  E.check("sampling: 1.1 kHz at 1 kHz aliases to 100 Hz", function () {
    return Math.abs(aliasOf(1100, 1000) - 100) < 1e-9;
  });
  E.check("sampling: 1.2 kHz at 1 kHz aliases to 200 Hz", function () {
    return Math.abs(aliasOf(1200, 1000) - 200) < 1e-9;
  });
  E.check("sampling: 1.1 kHz at 3 kHz has no alias", function () {
    return Math.abs(aliasOf(1100, 3000) - 1100) < 1e-9;
  });
})();
