/* Diode lab: Shockley I-V, series resistor load line, Q point, temperature shift. */
(function () {
  "use strict";
  if (!window.EE) return;
  var E = window.EE;
  var QE = 1.602176634e-19, KB = 1.380649e-23;
  var T0 = 298.15, EG = 1.12, KB_EV = 8.617333262e-5;

  function isAt(is25, n, tc) {
    var T = tc + 273.15;
    return is25 * Math.pow(T / T0, 3) *
      Math.exp((EG / (n * KB_EV)) * (1 / T0 - 1 / T));
  }

  /* Bisection on f(Vd)=Is(exp(Vd/nVT)-1)-(Vs-Vd)/R. */
  function solve(vs, r, is25, n, tc) {
    var T = tc + 273.15;
    var vt = KB * T / QE;
    var is = isAt(is25, n, tc);
    var lo = 0, hi = Math.max(vs, 0.05);
    var mid, f, x;
    for (var i = 0; i < 100; i++) {
      mid = (lo + hi) / 2;
      x = mid / (n * vt);
      f = is * (x > 700 ? 1e300 : Math.expm1(x)) - (vs - mid) / r;
      if (f > 0) hi = mid; else lo = mid;
    }
    var vd = (lo + hi) / 2;
    var id = (vs - vd) / r;
    var rd = n * vt / (id + is);
    return {
      vd: vd, id: id, rd: rd, p: vd * id,
      kvl: vs - vd - id * r, vt: vt, is: is
    };
  }

  function decade(e) {
    if (e === -12) return "1 pA";
    if (e === -9) return "1 nA";
    if (e === -6) return "1 µA";
    if (e === -3) return "1 mA";
    if (e === 0) return "1 A";
    return "10^" + e;
  }

  function mA(id) {
    var v = id * 1000;
    return E.fmt(v, v < 1 ? 3 : 2);
  }

  E.registerLab("diode", function (s, el) {
    var p = E.palette();
    var vs = Math.max(1, s.vs);
    var r = Math.max(0.05, s.r) * 1000;
    var is25 = parseFloat(s.is);
    var n = Math.max(1, s.n);
    var tc = s.tc;
    var r0 = solve(vs, r, is25, n, tc);
    var ref = solve(vs, r, is25, n, 25);
    var shift = (r0.vd - ref.vd) * 1000;
    var ratio = r0.is / ref.is;

    E.canvas(el, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var maxI = Math.max(vs / r, r0.id, 1e-6) * 2;
      var ymax = Math.max(-3, Math.ceil(Math.log(maxI) / Math.LN10));
      var ticks = [];
      for (var e = -12; e <= 0; e += 3) {
        if (e <= ymax) ticks.push({ v: e, label: decade(e) });
      }
      var ax = E.axes(ctx, { x: 0, y: 0, w: w, h: h }, {
        xmin: 0, xmax: vs, ymin: -12, ymax: ymax,
        xlabel: "V_D (V)", ylabel: "I_D (A, log)",
        yticks: ticks, nx: 4, xdigits: 1,
        padLeft: 47, padRight: 10, padTop: 10, padBottom: 32
      });

      var pts = [], i, v, id, lg;
      for (i = 0; i <= 180; i++) {
        v = vs * i / 180;
        id = r0.is * Math.expm1(v / (n * r0.vt));
        if (id <= 1e-14) continue;
        lg = Math.log(id) / Math.LN10;
        if (lg > ymax) break;
        pts.push([ax.sx(v), ax.sy(lg)]);
      }
      E.line(ctx, pts, { color: p.blue, width: 2 });

      var lp = [];
      for (i = 0; i <= 140; i++) {
        v = vs * i / 140;
        id = (vs - v) / r;
        if (id <= 1e-14) continue;
        lg = Math.log(id) / Math.LN10;
        if (lg < -12) continue;
        lp.push([ax.sx(v), ax.sy(Math.min(lg, ymax))]);
      }
      E.line(ctx, lp, { color: p.amber, width: 1.6 });

      var xq = ax.sx(r0.vd);
      var yq = ax.sy(Math.min(Math.max(Math.log(r0.id) / Math.LN10, -12), ymax));
      E.dash(ctx, xq, ax.plot.y, xq, ax.plot.y + ax.plot.h, { color: p.muted });
      E.dash(ctx, ax.plot.x, yq, xq, yq, { color: p.muted });
      E.dot(ctx, xq, yq, 4.4, { fill: p.accent, stroke: p.sheet });
      E.label(ctx, "Q", xq + 8, yq + 10, { size: 10, color: p.accent, background: p.sheet });
      E.label(ctx, "I_D(V_D)", ax.plot.x + ax.plot.w - 6, ax.plot.y + 10,
        { size: 9, color: p.blue, align: "right" });
      E.label(ctx, "yük çizgisi", ax.plot.x + ax.plot.w - 6, ax.plot.y + 22,
        { size: 9, color: p.amber, align: "right" });
    });

    var temp;
    if (Math.abs(tc - 25) < 0.01) {
      temp = "25 °C referans: ΔV_D = 0.";
    } else {
      temp = "T = " + E.fmt(tc, 0) + " °C: I_S(T) 25 °C'ye göre " +
        E.fmt(ratio, 1) + "× arttı; ΔV_D = " + E.fmt(shift, 1) +
        " mV. Çünkü V_D ≈ nV_T ln(I_D/I_S) ve I_S sıcaklıkla üstel büyür.";
    }
    var status = "Yük çizgisi I_D = (V_S − V_D)/R; Q: V_D = " +
      E.fmt(r0.vd, 3) + " V, I_D = " + mA(r0.id) + " mA. " + temp;

    return {
      readout: E.readout([
        ["V_D", E.fmt(r0.vd, 3), "V"],
        ["I_D", mA(r0.id), "mA"],
        ["r_d", E.fmt(r0.rd, 1), "Ω"],
        ["P_D", E.fmt(r0.p * 1000, 2), "mW"],
        ["ΔV_D (25 °C)", E.fmt(shift, 1), "mV"],
        ["I_S(T)", E.fmt(r0.is * 1e9, 2), "nA"],
        ["KVL artığı", Math.abs(r0.kvl) < 1e-9 ? "<1e-9" : r0.kvl.toExponential(1), "V"]
      ]),
      status: status,
      tone: "ok",
      aria: "Diyot yük çizgisi: V_D " + E.fmt(r0.vd, 3) + " volt, I_D " +
        mA(r0.id) + " miliamper, r_d " + E.fmt(r0.rd, 1) + " ohm.",
      print: "Statik yedek: V_S = " + E.fmt(vs, 1) + " V, R = " + E.fmt(r / 1000, 1) +
        " kΩ, I_S = " + E.fmt(is25 * 1e9, 2) + " nA, n = " + E.fmt(n, 2) +
        ", T = " + E.fmt(tc, 0) + " °C → V_D = " + E.fmt(r0.vd, 3) +
        " V, I_D = " + mA(r0.id) + " mA, r_d = " + E.fmt(r0.rd, 1) + " Ω."
    };
  });

  E.check("diode: 5 V/1 kΩ Q = 0.654 V, 4.35 mA, 10.3 Ω", function () {
    var r = solve(5, 1000, 2.1e-9, 1.75, 25);
    return Math.abs(r.vd - 0.654) < 0.005 &&
      Math.abs(r.id * 1000 - 4.35) < 0.03 &&
      Math.abs(r.rd - 10.35) < 0.15;
  });
  E.check("diode: +50 °C shifts V_D by about -100 mV", function () {
    var a = solve(5, 1000, 2.1e-9, 1.75, 25);
    var b = solve(5, 1000, 2.1e-9, 1.75, 75);
    var d = (b.vd - a.vd) * 1000;
    return d < -90 && d > -112;
  });
  E.check("diode: KVL residual < 1e-9 V and 10 kΩ lowers I_D", function () {
    var a = solve(5, 1000, 2.1e-9, 1.75, 25);
    var b = solve(5, 10000, 2.1e-9, 1.75, 25);
    return Math.abs(a.kvl) < 1e-9 && b.id < a.id && b.vd < a.vd;
  });
})();
