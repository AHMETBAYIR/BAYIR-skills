/* SDOF vibration: frequency response, resonance, transmissibility. */
(function () {
  "use strict";

  function compute(s) {
    var k = s.k * 1000;                 // N/m
    var wn = Math.sqrt(k / s.m);        // rad/s
    var Xst = s.F0 / k;                 // m
    var r = s.r;
    var den = Math.pow(1 - r * r, 2) + Math.pow(2 * s.z * r, 2);
    var X = Xst / Math.sqrt(den);
    var phi = Math.atan2(2 * s.z * r, 1 - r * r) * 180 / Math.PI;
    var Tr = Math.sqrt((1 + Math.pow(2 * s.z * r, 2)) / den);
    var rp = s.z < Math.SQRT1_2 ? Math.sqrt(1 - 2 * s.z * s.z) : 0;
    var Xmax = s.z > 0 ? Xst / (2 * s.z * Math.sqrt(1 - s.z * s.z)) : Infinity;
    return { wn: wn, Xst: Xst, X: X, phi: phi, Tr: Tr, rp: rp, Xmax: Xmax,
      fn: wn / (2 * Math.PI) };
  }

  ME.registerLab("vibration", function (s, canvas) {
    var r = compute(s), p = ME.palette();
    var pts = [], i, rr, den, yy;
    for (i = 0; i <= 180; i++) {
      rr = 3 * i / 180;
      den = Math.pow(1 - rr * rr, 2) + Math.pow(2 * s.z * rr, 2);
      yy = 1 / Math.sqrt(den);
      pts.push([rr, yy]);
    }
    var ymax = Math.max(4, Math.min(20, Math.max(r.X / r.Xst, r.Tr) * 1.2));
    var y = r.X / r.Xst;
    ME.plot(canvas, {
      xmin: 0, xmax: 3, ymin: 0, ymax: Math.max(4, Math.min(30, ymax)),
      ydigits: 0,
      xlabel: "frekans oranı r = ω/ωn", ylabel: "X / Xst",
      series: [{ points: pts, color: p.accent, width: 2, label: "X/Xst" }],
      vlines: [{ x: 1, label: "r=1", color: p.muted },
        { x: Math.SQRT2, label: "√2", color: p.muted }],
      points: [{ x: s.r, y: y, r: 4, label: "r=" + ME.fmt(s.r, 2), color: p.accent }],
      ariaLabel: "Frekans tepkisi; r " + ME.fmt(s.r, 2) + ", büyütme " + ME.fmt(y, 2)
    });
    var tone = Math.abs(s.r - 1) < 0.08 ? "bad" : (s.r > Math.SQRT2 ? "ok" : "");
    return {
      readout: ME.readout([
        ["ωn", ME.fmt(r.wn, 1), "rad/s"],
        ["fn", ME.fmt(r.fn, 2), "Hz"],
        ["Xst=F0/k", ME.fmt(r.Xst * 1000, 2), "mm"],
        ["X", ME.fmt(r.X * 1000, 2), "mm"],
        ["faz φ", ME.fmt(r.phi, 1), "°"],
        ["Tr (taban)", ME.fmt(r.Tr, 2), ""],
        ["tepe r", r.rp ? ME.fmt(r.rp, 3) : "—", ""],
        ["tepe X", r.Xmax < 1e6 ? ME.fmt(r.Xmax * 1000, 1) : "∞", "mm"]
      ]),
      status: "ωn=" + ME.fmt(r.wn, 1) + " rad/s (fn=" + ME.fmt(r.fn, 2) + " Hz); r=" + ME.fmt(s.r, 2) +
        " → X/Xst=" + ME.fmt(y, 2) + ", φ=" + ME.fmt(r.phi, 1) + "°. " +
        (Math.abs(s.r - 1) < 0.08 ? "Rezonans bölgesi: sönüm tepeyi sınırlar." :
          (s.r > Math.SQRT2 ? "r>√2: yalıtım; taban hareketi küçülür." : "r<√2: büyütme; taban hareketi büyür.")) +
        " Tepe r=√(1−2ζ²), r=1 değil.",
      tone: tone,
      aria: "Frekans tepkisi; büyütme " + ME.fmt(y, 2) + ", faz " + ME.fmt(r.phi, 1) + " derece."
    };
  });

  ME.check("vibration: omega_n and Xst", function () {
    var r = compute({ m: 2, k: 20, z: 0.05, F0: 50, r: 1 });
    return Math.abs(r.wn - 100) < 1e-9 && Math.abs(r.Xst - 0.0025) < 1e-12;
  });
  ME.check("vibration: X at r=0.9/1/1.1", function () {
    var a = compute({ m: 2, k: 20, z: 0.05, F0: 50, r: 0.9 }).X * 1000;
    var b = compute({ m: 2, k: 20, z: 0.05, F0: 50, r: 1.0 }).X * 1000;
    var c = compute({ m: 2, k: 20, z: 0.05, F0: 50, r: 1.1 }).X * 1000;
    return Math.abs(a - 11.891) < 0.01 && Math.abs(b - 25) < 0.01 && Math.abs(c - 10.546) < 0.01;
  });
  ME.check("vibration: Tr(sqrt2)=1", function () {
    var r = compute({ m: 2, k: 20, z: 0.05, F0: 50, r: Math.SQRT2 });
    return Math.abs(r.Tr - 1) < 1e-9;
  });
})();
