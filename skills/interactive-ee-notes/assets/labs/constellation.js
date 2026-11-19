/* Square QAM constellation + theoretical BER lab. */
(function () {
  "use strict";
  if (!window.EE) return;
  var E = window.EE;

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function qam(M) {
    var side = Math.round(Math.sqrt(M));
    var levels = [];
    for (var i = 0; i < side; i++) levels.push(i - (side - 1) / 2);
    var pts = [];
    for (var y = 0; y < side; y++) {
      for (var x = 0; x < side; x++) pts.push([levels[x], levels[y]]);
    }
    var Es = 0;
    pts.forEach(function (p) { Es += p[0] * p[0] + p[1] * p[1]; });
    Es /= pts.length;
    return { side: side, levels: levels, pts: pts, Es: Es, dmin: 1 };
  }

  E.registerLab("constellation", function (s, el) {
    var p = E.palette();
    var M = parseInt(s.m, 10) || 16;
    var q = qam(M);
    var k = Math.log(M) / Math.LN2;
    var ebn0db = s.ebn0;
    var ebn0 = Math.pow(10, ebn0db / 10);
    var esn0 = ebn0 * k;
    var ber = (4 / k) * (1 - 1 / Math.sqrt(M)) *
      E.Q(Math.sqrt(3 * k / (M - 1) * ebn0));
    var sigma = Math.sqrt(q.Es / (2 * esn0));
    var rnd = mulberry32(12345 + M + Math.round(ebn0db * 100));
    var cloud = [];
    var target = [q.levels[q.side - 1], q.levels[q.side - 1]];
    for (var i = 0; i < 90; i++) {
      var u1 = Math.max(rnd(), 1e-12), u2 = rnd();
      var r = Math.sqrt(-2 * Math.log(u1));
      cloud.push([target[0] + sigma * r * Math.cos(2 * Math.PI * u2),
                  target[1] + sigma * r * Math.sin(2 * Math.PI * u2)]);
    }

    E.canvas(el, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var side = Math.min(w, h) - 24;
      var cx = w / 2, cy = h / 2;
      var span = q.side + 1.6;
      var scale = side / span;
      function X(v) { return cx + v * scale; }
      function Y(v) { return cy - v * scale; }

      // decision grid
      var half = q.side / 2;
      for (var g = -half; g <= half; g += 1) {
        E.dash(ctx, X(g), Y(-half), X(g), Y(half), { color: p.gridStrong, dash: [2, 4], width: 0.8 });
        E.dash(ctx, X(-half), Y(g), X(half), Y(g), { color: p.gridStrong, dash: [2, 4], width: 0.8 });
      }
      // axes
      E.line(ctx, [[X(-half), Y(0)], [X(half), Y(0)]], { color: p.muted, width: 0.8 });
      E.line(ctx, [[X(0), Y(-half)], [X(0), Y(half)]], { color: p.muted, width: 0.8 });

      // ideal points
      q.pts.forEach(function (pt) {
        E.dot(ctx, X(pt[0]), Y(pt[1]), 3.1, { fill: p.blue, stroke: p.sheet, width: 1 });
      });
      // noise cloud
      cloud.forEach(function (pt) {
        E.dot(ctx, X(pt[0]), Y(pt[1]), 1.5, { fill: p.red, stroke: p.red, width: 0.2 });
      });
      // highlight target
      E.dot(ctx, X(target[0]), Y(target[1]), 5.2, { fill: p.sheet, stroke: p.red, width: 1.6 });

      E.label(ctx, "I", X(half) + 6, Y(0), { size: 10, color: p.muted });
      E.label(ctx, "Q", X(0), Y(half) - 10, { size: 10, color: p.muted, align: "center" });
      E.label(ctx, M + "-QAM · " + E.fmt(k, 0) + " bit/sembol", 8, 14,
        { size: 10, color: p.ink2 });
      E.label(ctx, "E_s/N_0 = " + E.fmt(10 * Math.log(esn0) / Math.LN10, 1) + " dB",
        8, 28, { size: 9.5, color: p.muted });
    });

    var berText = ber < 1e-6 ? ber.toExponential(2) : E.fmt(ber, 2);
    var status = M + "-QAM, E_b/N_0 = " + E.fmt(ebn0db, 1) + " dB: " + E.fmt(k, 0) +
      " bit/sembol, d_min = 1, teorik BER ≈ " + berText + ". " +
      (M === 4
        ? "QPSK/BPSK ile aynı BER; aynı bantta 2 bit taşır."
        : "Aynı E_b/N_0'da M büyüdükçe karar bölgeleri küçülür; BER artar. Aynı bant genişliğinde hız artar.");

    return {
      readout: E.readout([
        ["M", String(M), "—"],
        ["k", E.fmt(k, 0), "bit/sembol"],
        ["E_s/N_0", E.fmt(10 * Math.log(esn0) / Math.LN10, 1), "dB"],
        ["d_min", "1", "birim"],
        ["Teorik BER", berText, ""],
        ["Örnek", "90 nokta", ""]
      ]),
      status: status,
      tone: ber < 1e-3 ? "ok" : "bad",
      aria: M + " QAM takımyıldızı, " + E.fmt(k, 0) + " bit per sembol, teorik bit hata oranı " + berText + ".",
      print: M + "-QAM: k = " + E.fmt(k, 0) + ", E_b/N_0 = " + E.fmt(ebn0db, 1) +
        " dB, d_min = 1, teorik BER ≈ " + berText + "."
    };
  });

  E.check("constellation: 4-QAM BER at 9.59 dB is 1e-5", function () {
    var ebn0 = Math.pow(10, 9.59 / 10);
    var ber = E.Q(Math.sqrt(2 * ebn0));
    return ber > 0.5e-5 && ber < 2e-5;
  });
  E.check("constellation: 16-QAM BER at 13.43 dB is ~1e-5", function () {
    var ebn0 = Math.pow(10, 13.43 / 10);
    var ber = 0.75 * E.Q(Math.sqrt(0.8 * ebn0));
    return ber > 0.5e-5 && ber < 2e-5;
  });
  E.check("constellation: Es = (M-1)/6 for unit spacing", function () {
    var q = qam(16);
    return Math.abs(q.Es - 15 / 6) < 1e-12;
  });
})();
