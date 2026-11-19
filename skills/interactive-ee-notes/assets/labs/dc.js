/* DC network lab: Thevenin equivalent, loaded divider, maximum power.
   Contract: EE.registerLab("dc", render) -> {readout,status,tone,aria,print}. */
(function () {
  "use strict";
  if (!window.EE) return;
  var E = window.EE;

  function drawCircuit(ctx, x, y, w, h, s) {
    var p = E.palette();
    var top = y + 28, bot = y + h - 26;
    var left = x + 36, mid = y + h * 0.5;
    var node = x + w * 0.46;
    var right = x + w * 0.76;
    var detail = w >= 480;
    var vs = detail ? E.fmt(s.vs, 1) + " V" : "";
    var r1 = detail ? E.fmt(s.r1, 1) + " kΩ" : "";
    var r2 = detail ? E.fmt(s.r2, 1) + " kΩ" : "";
    var rl = detail ? E.fmt(s.rl, 1) + " kΩ" : "";

    E.wire(ctx, left, top, node, top);
    E.wire(ctx, node, top, right, top);
    E.wire(ctx, left, top, left, mid - 17);
    E.wire(ctx, left, mid + 17, left, bot);
    E.wire(ctx, left, bot, right, bot);
    E.sourceV(ctx, left, mid, 17, "V_s", vs, false);
    E.resistorH(ctx, left + 8, top, node - left - 16, "R1", r1);
    E.resistorV(ctx, node, top, bot - top, "R2", r2);
    E.resistorV(ctx, right, top, bot - top, "R_L", rl, { side: "left" });
    E.junction(ctx, node, top);
    E.junction(ctx, node, bot);
    E.junction(ctx, right, bot);
    E.ground(ctx, (node + right) / 2, bot);
    if (detail) {
      E.label(ctx, "A", node + 7, top + 12, { size: 10, color: p.accent });
      E.arrow(ctx, node + 18, top + 20, node + 18, top + 44, { color: p.accent, width: 1.1 });
      E.label(ctx, "v_L", node + 23, top + 33, { size: 10, color: p.accent });
    }
  }

  E.registerLab("dc", function (s, el) {
    var p = E.palette();
    var Vs = s.vs, R1 = s.r1 * 1000, R2 = s.r2 * 1000, RL = s.rl * 1000;
    var Rth = R1 * R2 / (R1 + R2);
    var Vth = Vs * R2 / (R1 + R2);
    var IL = Vth / (Rth + RL);
    var VL = IL * RL;
    var PL = Vth * Vth * RL / Math.pow(Rth + RL, 2);
    var eff = RL / (Rth + RL);
    var PLmax = Vth * Vth / (4 * Rth);
    var near = Math.abs(RL / Rth - 1) < 0.04;

    E.canvas(el, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var box;
      if (w < 560) {
        var topH = Math.round(h * 0.42);
        drawCircuit(ctx, 4, 4, w - 8, topH, s);
        box = { x: 8, y: topH + 4, w: w - 16, h: h - topH - 10 };
      } else {
        var leftW = Math.max(130, Math.min(w * 0.43, 230));
        drawCircuit(ctx, 4, 4, leftW - 8, h - 8, s);
        box = { x: leftW + 2, y: 8, w: w - leftW - 10, h: h - 16 };
      }

      var xmax = Math.max(4 * Rth, RL * 1.25);
      var ymax = PLmax * 1.18;
      var ax = E.axes(ctx, box, {
        xmin: 0, xmax: xmax / 1000, ymin: 0, ymax: ymax * 1000,
        xlabel: "R_L (kΩ)", ylabel: "P_L (mW)",
        nx: 4, ny: 4, xdigits: 1, ydigits: 2,
        padLeft: 38, padBottom: 26
      });

      var pts = [];
      for (var i = 0; i <= 120; i++) {
        var rl = (xmax * i / 120);
        var pl = Vth * Vth * rl / Math.pow(Rth + rl, 2) * 1000;
        pts.push([ax.sx(rl / 1000), ax.sy(pl)]);
      }
      E.line(ctx, pts, { color: p.blue, width: 2 });

      var xr = ax.sx(Rth / 1000);
      E.dash(ctx, xr, ax.plot.y, xr, ax.plot.y + ax.plot.h, { color: p.muted });
      E.label(ctx, "R_Th", xr + 3, ax.plot.y + 12, { size: 9.5, color: p.muted });
      var xp = ax.sx(RL / 1000), yp = ax.sy(PL * 1000);
      E.dot(ctx, xp, yp, 4, { fill: near ? p.ok : p.accent });
      E.label(ctx, "P_L", xp + 6, yp - 8, { size: 10, color: near ? p.ok : p.accent });
    });

    var status = "R_Th = R1 ∥ R2 = " + E.fmt(Rth / 1000, 2) + " kΩ, V_Th = " +
      E.fmt(Vth, 2) + " V. R_L = " + E.fmt(RL / 1000, 2) + " kΩ iken P_L = " +
      E.fmt(PL * 1000, 2) + " mW ve verim %" + E.fmt(eff * 100, 1) + ". " +
      (near
        ? "Maksimum güç aktarımındasın; kaynak direnci kadar yük direnci, gücün yarısını kaynakta bırakır."
        : "R_L = R_Th yapınca güç tepeye çıkar; ama verim yalnızca %50 olur. Maksimum güç, maksimum verim değildir.");

    return {
      readout: E.readout([
        ["V_Th", E.fmt(Vth, 2), "V"],
        ["R_Th", E.fmt(Rth / 1000, 2), "kΩ"],
        ["I_L", E.fmt(IL * 1000, 2), "mA"],
        ["V_L", E.fmt(VL, 2), "V"],
        ["P_L", E.fmt(PL * 1000, 2), "mW"],
        ["Verim", E.fmt(eff * 100, 1), "%"],
        ["P_L,max", E.fmt(PLmax * 1000, 2), "mW"]
      ]),
      status: status,
      tone: near ? "ok" : "",
      aria: "Thevenin devresi: V_Th " + E.fmt(Vth, 2) + " volt, R_Th " +
        E.fmt(Rth / 1000, 2) + " kiloohm, yük gücü " + E.fmt(PL * 1000, 2) + " miliwatt.",
      print: "R_L = " + E.fmt(RL / 1000, 2) + " kΩ için P_L = " + E.fmt(PL * 1000, 2) +
        " mW, verim %" + E.fmt(eff * 100, 1) + "; maksimum güç R_L = R_Th = " +
        E.fmt(Rth / 1000, 2) + " kΩ değerinde " + E.fmt(PLmax * 1000, 2) + " mW."
    };
  });

  E.check("dc: Vth = 7.2 V for 12 V, 4k, 6k", function () {
    var Vth = 12 * 6000 / (4000 + 6000);
    return Math.abs(Vth - 7.2) < 1e-12;
  });
  E.check("dc: Rth = 2.4 kΩ", function () {
    var Rth = 4000 * 6000 / (4000 + 6000);
    return Math.abs(Rth - 2400) < 1e-9;
  });
  E.check("dc: maximum power = 5.4 mW", function () {
    var P = 7.2 * 7.2 / (4 * 2400) * 1000;
    return Math.abs(P - 5.4) < 1e-9;
  });
})();
