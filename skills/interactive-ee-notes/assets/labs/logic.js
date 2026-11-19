/* D flip-flop timing lab: setup/hold window, metastability. */
(function () {
  "use strict";
  if (!window.EE) return;
  var E = window.EE;

  function step(pts) {
    var out = [];
    for (var i = 0; i < pts.length; i++) {
      if (i > 0 && pts[i][1] !== pts[i - 1][1]) {
        out.push([pts[i][0], pts[i - 1][1]]);
      }
      out.push(pts[i]);
    }
    return out;
  }

  E.registerLab("logic", function (s, el) {
    var p = E.palette();
    var td = s.td, tsu = s.tsu, th = s.th;
    var setupMargin = -td - tsu;
    var holdMargin = td - th;
    var stable = td <= -tsu || td >= th;
    var q = stable ? "D" : "metastabil";
    var inSetup = td > -tsu && td < 0;
    var inHold = td >= 0 && td < th;

    E.canvas(el, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var tmin = -30, tmax = 30;
      var rowH = Math.max(34, Math.min(54, (h - 28) / 3));
      var left = 48, right = w - 12, top = 16;
      var ax = E.axes(ctx, { x: 0, y: 0, w: w, h: h }, {
        xmin: tmin, xmax: tmax, ymin: 0, ymax: 3.4,
        xlabel: "t (ns)", ylabel: "",
        nx: 6, ny: 0, xdigits: 0, padLeft: 44, padBottom: 27, padTop: 8
      });
      // setup / hold bands
      var bandY = ax.plot.y, bandH = ax.plot.h;
      ctx.save();
      ctx.fillStyle = "rgba(47,93,138,0.10)";
      ctx.fillRect(ax.sx(-tsu), bandY, ax.sx(0) - ax.sx(-tsu), bandH);
      ctx.fillStyle = "rgba(154,59,50,0.10)";
      ctx.fillRect(ax.sx(0), bandY, ax.sx(th) - ax.sx(0), bandH);
      ctx.restore();
      E.label(ctx, "mavi: setup · kırmızı: hold", ax.plot.x + 4, ax.plot.y + 10,
        { size: 8.5, color: p.muted });

      var rows = [
        { name: "CLK", y: top + rowH * 0.55, color: p.ink2 },
        { name: "D", y: top + rowH * 1.55, color: p.blue },
        { name: "Q", y: top + rowH * 2.55, color: stable ? p.green : p.red }
      ];

      // clock: rising at 0 and 20 ns, 50% duty
      var clk = [];
      for (var t = tmin; t <= tmax; t += 10) {
        var phase = ((t + 10) % 20 + 20) % 20;
        var level = phase < 10 ? 0 : 1;
        clk.push([t, level]);
      }
      clk.push([tmax, (((tmax + 10) % 20) + 20) % 20 < 10 ? 0 : 1]);
      var clkPts = step(clk).map(function (pt) { return [ax.sx(pt[0]), rows[0].y - pt[1] * rowH * 0.34]; });
      E.line(ctx, clkPts, { color: rows[0].color, width: 1.8 });

      // D: previous value before td, toggled at td
      var dLevel = s.d === "1" ? 1 : 0;
      var dPts = [
        [tmin, dLevel], [td, dLevel], [td, 1 - dLevel], [tmax, 1 - dLevel]
      ].map(function (pt) { return [ax.sx(pt[0]), rows[1].y - pt[1] * rowH * 0.34]; });
      E.line(ctx, dPts, { color: rows[1].color, width: 1.8 });

      // Q: changes after the rising edge if stable; metastable band otherwise
      var qPts;
      if (stable) {
        qPts = [
          [tmin, dLevel], [2, dLevel], [2, 1 - dLevel], [tmax, 1 - dLevel]
        ].map(function (pt) { return [ax.sx(pt[0]), rows[2].y - pt[1] * rowH * 0.34]; });
        E.line(ctx, qPts, { color: rows[2].color, width: 1.8 });
      } else {
        var yq = rows[2].y;
        E.line(ctx, [[ax.sx(tmin), yq], [ax.sx(2), yq]], { color: rows[2].color, width: 1.8 });
        ctx.save();
        ctx.fillStyle = "rgba(154,59,50,0.16)";
        ctx.fillRect(ax.sx(2), yq - rowH * 0.34, ax.sx(tmax) - ax.sx(2), rowH * 0.68);
        ctx.strokeStyle = p.red; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(ax.sx(2), yq); ctx.lineTo(ax.sx(tmax), yq); ctx.stroke();
        ctx.restore();
        E.label(ctx, "metastabil", ax.sx(3) + 4, yq - rowH * 0.42, { size: 9, color: p.red });
      }

      // edge marker
      E.dash(ctx, ax.sx(0), ax.plot.y, ax.sx(0), ax.plot.y + ax.plot.h, { color: p.accent, width: 1 });
      E.label(ctx, "↑", ax.sx(0) - 4, ax.plot.y + ax.plot.h - 10, { size: 12, color: p.accent });

      // row labels
      rows.forEach(function (r) {
        E.label(ctx, r.name, 8, r.y, { size: 10, color: r.color });
      });
    });

    var status;
    if (stable) {
      status = "D, kenardan " + E.fmt(Math.abs(td), 1) + " ns " +
        (td < 0 ? "önce" : "sonra") + " değişiyor; setup marjı " + E.fmt(setupMargin, 1) +
        " ns, hold marjı " + E.fmt(holdMargin, 1) + " ns. Q, yükselen kenarda D'yi alır.";
    } else if (inSetup) {
      status = "Setup ihlali: D, kenardan " + E.fmt(-td, 1) + " ns önce değişiyor; en az " +
        E.fmt(tsu, 1) + " ns önce sabit olmalıydı. Q metastabil olabilir; iki FF'li senkronizör gerekir.";
    } else {
      status = "Hold ihlali: D, kenardan " + E.fmt(td, 1) + " ns sonra değişiyor; en az " +
        E.fmt(th, 1) + " ns sonra değişmeliydi. Q metastabil olabilir.";
    }

    return {
      readout: E.readout([
        ["t_d", E.fmt(td, 1), "ns"],
        ["t_su", E.fmt(tsu, 1), "ns"],
        ["t_h", E.fmt(th, 1), "ns"],
        ["Setup marjı", E.fmt(setupMargin, 1), "ns"],
        ["Hold marjı", E.fmt(holdMargin, 1), "ns"],
        ["Q", q, ""]
      ]),
      status: status,
      tone: stable ? "ok" : "bad",
      aria: "D flip-flop zamanlaması: D kenardan " + E.fmt(td, 1) + " nanosaniye " +
        (td < 0 ? "önce" : "sonra") + " değişiyor; " + (stable ? "Q kararlı." : "metastabilite riski."),
      print: "t_d = " + E.fmt(td, 1) + " ns, t_su = " + E.fmt(tsu, 1) + " ns, t_h = " +
        E.fmt(th, 1) + " ns; " + (stable ? "Q kararlı, D'yi alır." : "setup/hold ihlali, Q metastabil.")
    };
  });

  E.check("logic: td=-10, tsu=5, th=3 is stable", function () {
    return (-10 <= -5) || (-10 >= 3);
  });
  E.check("logic: td=0 is a violation", function () {
    return !(0 <= -5 || 0 >= 3);
  });
  E.check("logic: td=4, th=3 is stable", function () {
    return 4 >= 3;
  });
})();
