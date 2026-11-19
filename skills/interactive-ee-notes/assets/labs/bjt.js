/* BJT bias lab: divider bias, Q-point, load line, active/saturation/cutoff. */
(function () {
  "use strict";
  if (!window.EE) return;
  var E = window.EE;
  var VT = 0.026;

  function npn(ctx, x, y, r) {
    var p = E.palette();
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = p.sheet; ctx.fill();
    ctx.strokeStyle = p.ink; ctx.lineWidth = 1.5; ctx.stroke();
    // base bar
    ctx.beginPath(); ctx.moveTo(x - 7, y - 11); ctx.lineTo(x - 7, y + 11); ctx.stroke();
    // base lead
    E.wire(ctx, x - r, y, x - 7, y);
    // collector and emitter
    E.wire(ctx, x - 7, y - 5, x + 8, y - 14);
    E.wire(ctx, x + 8, y - 14, x + 8, y - r - 4);
    E.wire(ctx, x - 7, y + 5, x + 8, y + 14);
    E.wire(ctx, x + 8, y + 14, x + 8, y + r + 4);
    // emitter arrow
    E.arrow(ctx, x + 1, y + 9, x + 8, y + 14, { color: p.ink, width: 1.2, head: 4 });
    E.label(ctx, "NPN", x, y + r + 13, { align: "center", size: 8.5, color: p.muted });
    ctx.restore();
  }

  E.registerLab("bjt", function (s, el) {
    var p = E.palette();
    var Vcc = s.vcc, R1 = s.r1, R2 = s.r2, Rc = s.rc, Re = s.re, beta = s.beta;
    var Vbb = Vcc * R2 / (R1 + R2);
    var Rb = R1 * R2 / (R1 + R2);
    var Ib = Math.max(0, (Vbb - 0.65) / (Rb + (beta + 1) * Re)); // mA
    var Ic = beta * Ib;
    var Ie = (beta + 1) * Ib;
    var Vc = Vcc - Ic * Rc;
    var Ve = Ie * Re;
    var Vce = Vc - Ve;
    var Icmax = Vcc / (Rc + Re);
    var region = Ib <= 1e-9 ? "kesim" : (Vce < 0.2 ? "doyum" : "aktif");
    var gm = Ic / VT; // mA/V = mS
    var rpi = beta / gm; // kΩ

    E.canvas(el, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var leftW = Math.max(155, Math.min(w * 0.48, 245));
      // circuit
      var top = 24, bot = h - 24, x1 = 38, x2 = leftW - 30;
      var baseY = (top + bot) / 2;
      var cx = (x1 + x2) / 2;
      var colY = baseY - 20, emY = baseY + 20;
      E.wire(ctx, x1, top, x2, top);
      E.wire(ctx, x1, top, x1, baseY - 6);
      E.wire(ctx, x1, baseY + 6, x1, bot);
      E.wire(ctx, x1, bot, x2, bot);
      E.wire(ctx, x2, top, x2, colY);
      E.wire(ctx, x2, emY, x2, bot);
      E.resistorV(ctx, x1, top, baseY - top, "R1", E.fmt(R1, 0) + "k");
      E.resistorV(ctx, x1, baseY, bot - baseY, "R2", E.fmt(R2, 0) + "k");
      E.resistorV(ctx, x2, top, colY - top, "R_C", E.fmt(Rc, 1) + "k");
      E.resistorV(ctx, x2, emY, bot - emY, "R_E", E.fmt(Re, 1) + "k");
      E.junction(ctx, x1, baseY);
      E.junction(ctx, x2, top);
      E.junction(ctx, x2, bot);
      E.junction(ctx, x2, colY);
      E.junction(ctx, x2, emY);
      npn(ctx, cx, baseY, 20);
      E.wire(ctx, x1, baseY, cx - 20, baseY);
      E.wire(ctx, cx + 8, colY, x2, colY);
      E.wire(ctx, cx + 8, emY, x2, emY);
      E.ground(ctx, cx, bot);
      E.label(ctx, "V_CC = " + E.fmt(Vcc, 1) + " V", 4, 10, { size: 9.5, color: p.muted });
      E.label(ctx, "Q", cx + 26, baseY - 2, { size: 10, color: p.accent });

      // load line
      var box = { x: leftW + 2, y: 10, w: w - leftW - 12, h: h - 18 };
      var ax = E.axes(ctx, box, {
        xmin: 0, xmax: Vcc, ymin: 0, ymax: Icmax * 1.12,
        xlabel: "V_CE (V)", ylabel: "I_C (mA)",
        nx: 4, ny: 4, xdigits: 1, ydigits: 2,
        padLeft: 38, padBottom: 27
      });
      E.line(ctx, [[ax.sx(0), ax.sy(Icmax)], [ax.sx(Vcc), ax.sy(0)]], { color: p.blue, width: 2 });
      E.dash(ctx, ax.sx(0.2), ax.plot.y, ax.sx(0.2), ax.plot.y + ax.plot.h, { color: p.muted });
      E.label(ctx, "doyum", ax.sx(0.2) + 3, ax.plot.y + 12, { size: 9, color: p.muted });
      var xq = ax.sx(E.clamp(Vce, 0, Vcc)), yq = ax.sy(E.clamp(Ic, 0, Icmax));
      E.dot(ctx, xq, yq, 4.2, { fill: region === "aktif" ? p.ok : p.red });
      E.label(ctx, "Q", xq + 6, yq - 9, { size: 10, color: region === "aktif" ? p.ok : p.red });
      E.label(ctx, "yük çizgisi", ax.plot.x + 5, ax.plot.y + ax.plot.h - 8, { size: 9.5, color: p.blue });
    });

    var status;
    if (region === "kesim") {
      status = "Q noktası kesimde: V_BB = " + E.fmt(Vbb, 2) + " V < 0,65 V. Base akımı yok; R1/R2 oranını artır.";
    } else if (region === "doyum") {
      status = "Q noktası doyumda: V_CE = " + E.fmt(Vce, 2) + " V < 0,2 V. Küçük-işaret modeli geçersiz; R_C veya β düşür.";
    } else {
      status = "Q noktası aktif bölgede: I_C = βI_B = " + E.fmt(Ic, 2) + " mA, V_CE = " +
        E.fmt(Vce, 2) + " V. R2 artınca V_BB ve I_C artar; R_E artınca I_C düşer. " +
        "g_m = I_C/V_T = " + E.fmt(gm, 1) + " mS.";
    }

    return {
      readout: E.readout([
        ["V_BB", E.fmt(Vbb, 2), "V"],
        ["I_B", E.fmt(Ib * 1000, 1), "µA"],
        ["I_C", E.fmt(Ic, 2), "mA"],
        ["V_CE", E.fmt(Vce, 2), "V"],
        ["Bölge", region, ""],
        ["g_m", E.fmt(gm, 1), "mS"],
        ["r_π", E.fmt(rpi, 2), "kΩ"]
      ]),
      status: status,
      tone: region === "aktif" ? "ok" : "bad",
      aria: "BJT kutuplama: kollektör akımı " + E.fmt(Ic, 2) + " miliamper, V_CE " +
        E.fmt(Vce, 2) + " volt, bölge " + region + ".",
      print: "V_BB = " + E.fmt(Vbb, 2) + " V, I_B = " + E.fmt(Ib * 1000, 1) + " µA, I_C = " +
        E.fmt(Ic, 2) + " mA, V_CE = " + E.fmt(Vce, 2) + " V; bölge: " + region + "."
    };
  });

  E.check("bjt: default Q is active", function () {
    var Vbb = 12 * 10 / (47 + 10);
    var Rb = 47 * 10 / (47 + 10);
    var Ib = (Vbb - 0.65) / (Rb + 151 * 1);
    var Ic = 150 * Ib;
    var Vce = 12 - Ic * 2.2 - 151 * Ib * 1;
    return Ib > 0 && Vce > 0.2;
  });
  E.check("bjt: default Ic = 1.37 mA", function () {
    var Vbb = 12 * 10 / 57, Rb = 47 * 10 / 57;
    var Ib = (Vbb - 0.65) / (Rb + 151);
    return Math.abs(150 * Ib - 1.371) < 0.01;
  });
  E.check("bjt: KVL Vcc = Ic Rc + Vce + Ie Re", function () {
    var Vbb = 12 * 10 / 57, Rb = 47 * 10 / 57;
    var Ib = (Vbb - 0.65) / (Rb + 151);
    var Ic = 150 * Ib, Ie = 151 * Ib;
    var Vce = 12 - Ic * 2.2 - Ie * 1;
    return Math.abs(12 - (Ic * 2.2 + Vce + Ie * 1)) < 1e-12;
  });
})();
