/* Transformer: equivalent circuit, efficiency vs load, exact phasor regulation. */
(function () {
  "use strict";
  if (!window.EE) return;
  var E = window.EE;
  var DEF = { S: 10000, V1: 2400, V2: 240, Req: 8, Xeq: 20, P0: 120 };

  function etaAt(n, c) {
    var I1 = n * c.S / c.V1;
    var Pout = n * c.S * c.pf;
    var Pcu = I1 * I1 * c.Req;
    return Pout + c.P0 + Pcu > 0 ? 100 * Pout / (Pout + c.P0 + Pcu) : 0;
  }

  function compute(s) {
    var c = {
      S: s.S || DEF.S, V1: s.V1 || DEF.V1, V2: s.V2 || DEF.V2,
      Req: s.Req || DEF.Req, Xeq: s.Xeq || DEF.Xeq, P0: s.P0 || DEF.P0
    };
    c.a = c.V1 / c.V2;
    c.load = E.clamp(s.load === undefined ? 1 : s.load, 0, 1.2);
    c.pf = E.clamp(s.pf === undefined ? 0.8 : s.pf, 0.5, 1);
    var phi = Math.acos(c.pf);
    c.phiDeg = phi * 180 / Math.PI;
    c.I2 = c.load * c.S / c.V2;
    c.I1 = c.I2 / c.a;
    c.Pcu = c.I1 * c.I1 * c.Req;
    c.Pout = c.load * c.S * c.pf;
    c.Pin = c.Pout + c.P0 + c.Pcu;
    c.eta = c.Pin > 0 ? 100 * c.Pout / c.Pin : 0;
    var A = c.I1 * (c.Req * c.pf + c.Xeq * Math.sin(phi));
    var B = c.I1 * (c.Xeq * c.pf - c.Req * Math.sin(phi));
    var v2p = Math.sqrt(Math.max(0, c.V1 * c.V1 - B * B)) - A;
    c.V2t = v2p / c.a;
    c.reg = (c.V1 - v2p) / c.V1 * 100;
    c.S1 = c.V1 * c.I1;
    c.S2n = c.load * c.S;
    c.S2 = c.V2t * c.I2;
    c.PcuFL = (c.S / c.V1) * (c.S / c.V1) * c.Req;
    c.nPeak = Math.sqrt(c.P0 / c.PcuFL);
    c.etaPeak = etaAt(c.nPeak, c);
    return c;
  }

  function coil(ctx, x, y0, y1, dir) {
    var n = 3, h = (y1 - y0) / n, i;
    ctx.save();
    ctx.strokeStyle = E.palette().ink;
    ctx.lineWidth = 1.4;
    for (i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.arc(x, y0 + h * (i + 0.5), h / 2 - 1, -Math.PI / 2, Math.PI / 2, dir < 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  function schematic(ctx, w, c) {
    var p = E.palette();
    var top = 46, bot = 94, sx = 20, sh = 44, bx = 64, bw = 86, tr = 172, ld = w - 24;
    E.label(ctx, "Eşdeğer devre — HV tarafına indirgenmiş", 8, 12, { size: 9.5, color: p.ink2 });
    E.sourceV(ctx, sx, (top + bot) / 2, 11, "", "", false);
    E.label(ctx, "V1", sx, 26, { size: 9, color: p.ink2, align: "center" });
    E.wire(ctx, sx, (top + bot) / 2 - 11, sx, top);
    E.wire(ctx, sx, (top + bot) / 2 + 11, sx, bot);
    E.wire(ctx, sx, top, sh, top);
    E.wire(ctx, sx, bot, ld, bot);
    E.resistorV(ctx, sh, top, bot - top, "", "", { side: "left" });
    E.label(ctx, "P0", sh, 26, { size: 8.5, color: p.ink2, align: "center" });
    E.wire(ctx, sh, top, bx, top);
    ctx.save();
    ctx.fillStyle = p.sheet; ctx.strokeStyle = p.ink; ctx.lineWidth = 1.4;
    ctx.fillRect(bx, top - 12, bw, 24); ctx.strokeRect(bx, top - 12, bw, 24);
    ctx.restore();
    E.label(ctx, "Req + jXeq", bx + bw / 2, top - 4, { size: 9, color: p.ink, align: "center" });
    E.label(ctx, E.fmt(c.Req, 0) + " + j" + E.fmt(c.Xeq, 0) + " Ω",
      bx + bw / 2, top + 6, { size: 9, color: p.ink2, align: "center" });
    E.wire(ctx, bx + bw, top, tr, top);
    E.wire(ctx, tr, top, tr, bot);
    coil(ctx, tr, top, bot, -1);
    coil(ctx, tr + 12, top, bot, 1);
    E.wire(ctx, tr + 5, top + 6, tr + 5, bot - 6, { color: p.ruleStrong, width: 1 });
    E.wire(ctx, tr + 7, top + 6, tr + 7, bot - 6, { color: p.ruleStrong, width: 1 });
    E.wire(ctx, tr + 12, top, ld, top);
    E.wire(ctx, tr + 12, bot, ld, bot);
    E.resistorV(ctx, ld, top, bot - top, "", "");
    E.label(ctx, "V2", ld, 26, { size: 9, color: p.ink2, align: "center" });
    E.label(ctx, "P0 = " + E.fmt(c.P0, 0) + " W   a = " + E.fmt(c.a, 0),
      8, bot + 16, { size: 8.5, color: p.muted });
    E.label(ctx, "V2 = " + E.fmt(c.V2t, 1) + " V", w - 6, bot + 16,
      { size: 8.5, color: p.ink2, align: "right" });
  }

  function etaPlot(ctx, w, y0, h, c) {
    var p = E.palette();
    var ax = E.axes(ctx, { x: 0, y: y0, w: w, h: h }, {
      xmin: 0, xmax: 1.2, ymin: 90, ymax: 98,
      xlabel: "yük (pu)", ylabel: "η (%)",
      padLeft: 34, padRight: 10, padTop: 8, padBottom: 26,
      nx: 4, ny: 4, xdigits: 1, ydigits: 0
    });
    var pts = [], i, n, e;
    for (i = 0; i <= 120; i++) {
      n = 1.2 * i / 120;
      e = etaAt(n, c);
      if (e >= 90) pts.push([ax.sx(n), ax.sy(e)]);
    }
    E.line(ctx, pts, { color: p.blue, width: 1.8 });
    var px = ax.sx(c.nPeak);
    E.dash(ctx, px, ax.plot.y, px, ax.plot.y + ax.plot.h, { color: p.muted, dash: [3, 3] });
    var py = ax.sy(c.etaPeak);
    E.dot(ctx, px, py, 3, { fill: p.green });
    E.label(ctx, "tepe " + E.fmt(c.nPeak, 2) + " pu",
      ax.plot.x + ax.plot.w - 4, ax.plot.y + 10,
      { size: 8, color: p.green, align: "right" });
    if (c.eta >= 90) {
      E.dot(ctx, ax.sx(c.load), ax.sy(c.eta), 3.4, { fill: p.accent });
    }
  }

  function regPlot(ctx, w, y0, h, c) {
    var p = E.palette();
    var ax = E.axes(ctx, { x: 0, y: y0, w: w, h: h }, {
      xmin: 0, xmax: 1.2, ymin: 0, ymax: 6,
      xlabel: "yük (pu)", ylabel: "reg. (%)",
      padLeft: 34, padRight: 10, padTop: 8, padBottom: 26,
      nx: 4, ny: 3, xdigits: 1, ydigits: 0
    });
    var pts = [], i, n, cc;
    for (i = 0; i <= 120; i++) {
      n = 1.2 * i / 120;
      cc = compute({ load: n, pf: c.pf, S: c.S, V1: c.V1, V2: c.V2,
        Req: c.Req, Xeq: c.Xeq, P0: c.P0 });
      pts.push([ax.sx(n), ax.sy(cc.reg)]);
    }
    E.line(ctx, pts, { color: p.red, width: 1.8 });
    E.dot(ctx, ax.sx(c.load), ax.sy(c.reg), 3.4, { fill: p.accent });
    E.label(ctx, E.fmt(c.reg, 2) + "%", ax.sx(c.load) + 5, ax.sy(c.reg) - 8,
      { size: 8.5, color: p.accent });
  }

  E.registerLab("transformer", function (s, el) {
    var c = compute(s);
    E.canvas(el, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      schematic(ctx, w, c);
      etaPlot(ctx, w, 124, 126, c);
      regPlot(ctx, w, 254, 126, c);
    });
    var pfTxt = E.fmt(c.pf, 2) + (c.pf < 0.999 ? " geride" : " birim");
    var etaUnity = etaAt(c.load, { S: c.S, V1: c.V1, pf: 1, Req: c.Req, P0: c.P0 });
    var status = "Yük " + E.fmt(c.load, 2) + " pu, PF " + pfTxt + ": I1 = " +
      E.fmt(c.I1, 2) + " A, Pcu = " + E.fmt(c.Pcu, 1) + " W, η = %" +
      E.fmt(c.eta, 2) + " (PF = 1 için %" + E.fmt(etaUnity, 2) + "), regülasyon = %" + E.fmt(c.reg, 2) +
      ". Tepe verim " + E.fmt(c.nPeak, 4) + " pu; çünkü dη/dn = 0 → P0 = Pcu. " +
      "Tam yükte PF = 1 için η = %97,48; 0,8 geride regülasyon %3,21.";
    return {
      readout: E.readout([
        ["I1", E.fmt(c.I1, 2), "A"],
        ["I2", E.fmt(c.I2, 1), "A"],
        ["Pcu", E.fmt(c.Pcu, 1), "W"],
        ["η", E.fmt(c.eta, 2), "%"],
        ["η (PF=1)", E.fmt(etaUnity, 2), "%"],
        ["Regülasyon", E.fmt(c.reg, 2), "%"],
        ["V2", E.fmt(c.V2t, 1), "V"],
        ["Tepe yük", E.fmt(c.nPeak, 4), "pu"],
        ["S1", E.fmt(c.S1 / 1000, 2), "kVA"],
        ["S2 (anma)", E.fmt(c.S2n / 1000, 2), "kVA"],
        ["S2 (terminal)", E.fmt(c.S2 / 1000, 2), "kVA"]
      ]),
      status: status,
      tone: Math.abs(c.load - c.nPeak) < 0.03 ? "ok" : "",
      aria: "Transformatör: giriş " + E.fmt(c.V1, 0) + " volt, çıkış " +
        E.fmt(c.V2t, 1) + " volt, yük " + E.fmt(c.load, 2) +
        " per unit, güç katsayısı " + pfTxt + ". Giriş akımı " + E.fmt(c.I1, 2) +
        " amper, bakır kaybı " + E.fmt(c.Pcu, 1) + " vat, verim yüzde " +
        E.fmt(c.eta, 2) + ", regülasyon yüzde " + E.fmt(c.reg, 2) + ".",
      print: "Statik yedek: 10 kVA, 2400/240 V, Req = 8 Ω, Xeq = 20 Ω, P0 = 120 W. " +
        "Tam yükte PF = 1 için η = %97,48; 0,8 geride regülasyon %3,21 ve η = %96,87. " +
        "Tepe verim 0,9295 pu yükte; S1 = S2 = 10 kVA anma tabanında, terminal S2 ise 9,68 kVA."
    };
  });

  E.check("transformer: full load PF=1 gives η=97.48% and Pcu=138.9 W", function () {
    var c = compute({ load: 1, pf: 1 });
    return Math.abs(c.eta - 97.4764) < 0.002 && Math.abs(c.Pcu - 138.889) < 0.01;
  });
  E.check("transformer: peak load √(P0/Pcu)=0.9295; regulation 3.21% at 0.8 lag", function () {
    var c = compute({ load: 1, pf: 0.8 });
    return Math.abs(c.nPeak - 0.929516) < 1e-5 && Math.abs(c.reg - 3.2134) < 0.002;
  });
  E.check("transformer: S1=nS and terminal S2=V2·I2 is slightly lower", function () {
    var c = compute({ load: 1, pf: 0.8 });
    return Math.abs(c.S1 - 10000) < 1e-6 &&
      Math.abs(c.S2n - 10000) < 1e-6 &&
      Math.abs(c.I1 * c.a - c.I2) < 1e-9 &&
      c.S2 < c.S1 && c.S2 / c.S1 > 0.96;
  });
})();
