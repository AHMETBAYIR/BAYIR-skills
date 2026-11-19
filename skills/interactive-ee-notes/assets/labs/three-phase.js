/* Balanced three-phase Y/Δ load and power-factor correction. */
(function () {
  "use strict";
  if (!window.EE) return;
  var E = window.EE;
  var F = 50;

  function compute(s) {
    var y = s.conn !== "d";
    var vll = s.vll, r = Math.max(s.r, 0.001), x = Math.max(s.x, 0);
    var vph = y ? vll / Math.sqrt(3) : vll;
    var z = Math.hypot(r, x);
    var iph = vph / z;
    var il = y ? iph : Math.sqrt(3) * iph;
    var P = 3 * iph * iph * r;
    var Q = 3 * iph * iph * x;
    var S = 3 * vph * iph;
    var pf = r / z;
    var phi = Math.atan2(x, r);
    var pft = E.clamp(s.pft, 0.5, 1);
    var phi2 = Math.acos(pft);
    var qAfter = P * Math.tan(phi2);
    var qc = P * (Math.tan(phi) - Math.tan(phi2));
    var ilNew;
    if (qc < 0) { qc = 0; qAfter = Q; ilNew = il; }
    else { ilNew = P / (Math.sqrt(3) * vll * pft); }
    var C = qc / (3 * 2 * Math.PI * F * vph * vph);
    return { y: y, vll: vll, vph: vph, z: z, iph: iph, il: il,
      P: P, Q: Q, S: S, pf: pf, phi: phi, pft: pft,
      qAfter: qAfter, qc: qc, C: C, ilNew: ilNew };
  }

  function phasors(ctx, w, top, c) {
    var p = E.palette();
    var cx = Math.min(78, w * 0.25), cy = top * 0.57, rad = Math.min(46, top * 0.32);
    E.label(ctx, "Fazörler: V (mavi), I (turuncu)", 8, 12, { size: 10, color: p.ink2 });
    ctx.save();
    ctx.strokeStyle = p.grid;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    var names = ["A", "B", "C"];
    for (var k = 0; k < 3; k++) {
      var a = -k * 2 * Math.PI / 3;
      var ai = a - c.phi;
      var vx = cx + rad * Math.cos(a), vy = cy - rad * Math.sin(a);
      var ix = cx + rad * 0.72 * Math.cos(ai), iy = cy - rad * 0.72 * Math.sin(ai);
      E.arrow(ctx, cx, cy, vx, vy, { color: p.blue, width: 2, head: 5 });
      E.arrow(ctx, cx, cy, ix, iy, { color: p.amber, width: 1.5, head: 4 });
      E.label(ctx, names[k], cx + (rad + 10) * Math.cos(a), cy - (rad + 10) * Math.sin(a),
        { size: 10, color: p.blue, align: "center" });
      E.dot(ctx, vx, vy, 2.5, { fill: p.blue });
    }
    E.dot(ctx, cx, cy, 2.5, { fill: p.ink });
    E.label(ctx, c.y ? "I_N = 0 (dengeli Y)" : "Δ: I_L = √3 I_ph", cx, top - 6,
      { size: 9.5, color: p.muted, align: "center" });
    E.label(ctx, "φ = " + E.fmt(c.phi * 180 / Math.PI, 1) + "°", cx + 54, cy + 34,
      { size: 9.5, color: p.amber });
  }

  function bars(ctx, w, top, h, c) {
    var p = E.palette();
    var max = Math.max(c.P, c.Q, 1);
    var x0 = 46, x1 = w - 74, maxW = Math.max(40, x1 - x0);
    E.label(ctx, "Güç (kW / kvar)", 8, top + 12, { size: 10, color: p.ink2 });
    var rows = [["P", c.P, p.blue], ["Q", c.Q, p.amber],
      ["Q′", c.qAfter, p.green], ["Qc", c.qc, p.cyan]];
    var y = top + 34;
    var dy = Math.min(24, (h - y - 12) / 3);
    for (var i = 0; i < rows.length; i++) {
      var yy = y + i * dy;
      E.label(ctx, rows[i][0], 8, yy, { size: 9.5, color: p.ink2 });
      ctx.save(); ctx.fillStyle = p.grid; ctx.fillRect(x0, yy - 5, maxW, 10); ctx.restore();
      ctx.save(); ctx.fillStyle = rows[i][2];
      ctx.fillRect(x0, yy - 5, Math.max(2, maxW * rows[i][1] / max), 10); ctx.restore();
      E.label(ctx, E.fmt(rows[i][1] / 1000, 2), w - 6, yy,
        { size: 9, color: p.ink, align: "right" });
    }
    E.label(ctx, c.y ? "P sabit; Q ve I düşer" : "Δ: aynı Z, 3× P", 8, h - 4,
      { size: 9, color: p.muted });
  }

  E.registerLab("three-phase", function (s, el) {
    var c = compute(s);
    E.canvas(el, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var top = Math.round(h * 0.46);
      phasors(ctx, w, top, c);
      bars(ctx, w, top, h, c);
    });
    var pfTxt = E.fmt(c.pf, 3);
    var status = (c.y
      ? "Dengeli Y: V_ph = V_LL/√3 = " + E.fmt(c.vph, 1) + " V; I_N = 0. "
      : "Δ: V_ph = V_LL = " + E.fmt(c.vph, 0) + " V; I_L = √3·I_ph = " + E.fmt(c.il, 1) + " A. ") +
      "Z = " + E.fmt(c.z, 2) + " Ω, φ = " + E.fmt(c.phi * 180 / Math.PI, 1) +
      "°, PF = " + pfTxt + ". Hedef " + E.fmt(c.pft, 2) + " için Qc = " +
      E.fmt(c.qc / 1000, 3) + " kvar, C = " + E.fmt(c.C * 1e6, 1) +
      " µF/faz; P = " + E.fmt(c.P / 1000, 3) + " kW sabit, I_L " +
      E.fmt(c.il, 2) + " → " + E.fmt(c.ilNew, 2) + " A.";
    return {
      readout: E.readout([
        ["V_LL", E.fmt(c.vll, 0), "V"],
        ["V_ph", E.fmt(c.vph, 1), "V"],
        ["I_ph", E.fmt(c.iph, 2), "A"],
        ["I_L", E.fmt(c.il, 2), "A"],
        ["P", E.fmt(c.P / 1000, 3), "kW"],
        ["Q", E.fmt(c.Q / 1000, 3), "kvar"],
        ["S", E.fmt(c.S / 1000, 2), "kVA"],
        ["PF", pfTxt, ""],
        ["I_N", c.y ? "0" : "—", "A"],
        ["Qc (banka)", E.fmt(c.qc / 1000, 3), "kvar"],
        ["Q′ (kalan)", E.fmt(c.qAfter / 1000, 3), "kvar"],
        ["C/faz", E.fmt(c.C * 1e6, 1), "µF"],
        ["I_L′", E.fmt(c.ilNew, 2), "A"]
      ]),
      status: status,
      tone: Math.abs(c.pf - c.pft) < 0.01 ? "ok" : "",
      aria: "Dengeli " + (c.y ? "yıldız" : "üçgen") + " yük: faz gerilimi " +
        E.fmt(c.vph, 1) + " volt, hat akımı " + E.fmt(c.il, 1) +
        " amper, aktif güç " + E.fmt(c.P / 1000, 2) + " kilovat, reaktif güç " +
        E.fmt(c.Q / 1000, 2) + " kilovar, güç katsayısı " + pfTxt + ".",
      print: "Statik yedek: 400 V Y, Z = 10 + j6 Ω için P = 11.765 kW, Q = 7.059 kvar, " +
        "S = 13.72 kVA, PF = 0.857, I_N = 0; 0.95 hedefi için Qc = 3.192 kvar, " +
        "C = 63.5 µF/faz, kalan Q = 3.867 kvar."
    };
  });

  E.check("three-phase: Y default P = 11.765 kW", function () {
    var c = compute({ vll: 400, r: 10, x: 6, conn: "y", pft: 0.95 });
    return Math.abs(c.P - 11764.705882) / 11764.705882 < 1e-3;
  });
  E.check("three-phase: balanced Y has I_N = 0 and V_LL = √3 V_ph", function () {
    var c = compute({ vll: 400, r: 10, x: 6, conn: "y", pft: 0.95 });
    return c.y && Math.abs(c.iph - c.il) < 1e-12 &&
      Math.abs(c.vph * Math.sqrt(3) - 400) < 1e-9;
  });
  E.check("three-phase: PF 0.95 keeps P, C = 63.5 µF, Q after = 3.867 kvar", function () {
    var c = compute({ vll: 400, r: 10, x: 6, conn: "y", pft: 0.95 });
    return Math.abs(c.P - 11764.705882) < 1e-6 &&
      Math.abs(c.C * 1e6 - 63.501861) < 0.05 &&
      Math.abs(c.qAfter / 1000 - 3.866872) < 1e-3 &&
      Math.abs(c.qc / 1000 - 3.191952) < 1e-3;
  });
})();
