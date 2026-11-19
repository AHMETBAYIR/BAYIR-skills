/* Lossless transmission line: Gamma, VSWR, return/mismatch loss, Zin, Smith path. */
(function () {
  "use strict";
  if (!window.EE) return;
  var E = window.EE;
  var C0 = 299792458;

  function cmul(a, b) {
    return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
  }
  function cdiv(a, b) {
    var d = b.re * b.re + b.im * b.im;
    return { re: (a.re * b.re + a.im * b.im) / d,
      im: (a.im * b.re - a.re * b.im) / d };
  }
  function cabs(a) { return Math.hypot(a.re, a.im); }
  function gammaOf(zl, z0) {
    return cdiv({ re: zl.re - z0, im: zl.im }, { re: zl.re + z0, im: zl.im });
  }
  function zinGamma(z0, zl, betaL) {
    var g = cmul(gammaOf(zl, z0), { re: Math.cos(-2 * betaL), im: Math.sin(-2 * betaL) });
    var one = { re: 1, im: 0 };
    return cdiv({ re: z0 * (one.re + g.re), im: z0 * (one.im + g.im) },
      { re: one.re - g.re, im: one.im - g.im });
  }
  function cfmt(c, d) {
    var re = Math.abs(c.re) < 5e-10 ? 0 : c.re;
    var im = Math.abs(c.im) < 5e-10 ? 0 : c.im;
    if (im === 0) return E.fmt(re, d === undefined ? 2 : d);
    return E.fmt(re, d === undefined ? 2 : d) + (im < 0 ? " − j" : " + j") +
      E.fmt(Math.abs(im), d === undefined ? 2 : d);
  }
  function compute(s) {
    var z0 = s.z0 === undefined ? 50 : s.z0;
    var rl = s.rl === undefined ? 75 : s.rl;
    var xl = s.xl === undefined ? 0 : s.xl;
    var len = E.clamp(s.len === undefined ? 0 : s.len, 0, 0.5);
    var fmhz = s.freq === undefined ? 1000 : s.freq;
    var zl = { re: rl, im: xl };
    var gL = gammaOf(zl, z0);
    var gm = cabs(gL);
    var betaL = 2 * Math.PI * len;
    var gIn = cmul(gL, { re: Math.cos(-2 * betaL), im: Math.sin(-2 * betaL) });
    var zin = zinGamma(z0, zl, betaL);
    var vswr = gm < 1 ? (1 + gm) / (1 - gm) : Infinity;
    var rlDb = gm > 1e-12 ? -20 * Math.log10(gm) : Infinity;
    var mlDb = gm < 1 ? -10 * Math.log10(1 - gm * gm) : Infinity;
    var lambda = C0 / (fmhz * 1e6);
    var samples = [], i, d, zi, reMin = 1e9, reMax = -1e9, imMin = 1e9, imMax = -1e9;
    for (i = 0; i <= 120; i++) {
      d = 0.5 * i / 120;
      zi = zinGamma(z0, zl, 2 * Math.PI * d);
      reMin = Math.min(reMin, zi.re); reMax = Math.max(reMax, zi.re);
      imMin = Math.min(imMin, zi.im); imMax = Math.max(imMax, zi.im);
      samples.push({ d: d, re: zi.re, im: zi.im });
    }
    return { z0: z0, rl: rl, xl: xl, len: len, fmhz: fmhz, zl: zl, gL: gL,
      gm: gm, gIn: gIn, zin: zin, vswr: vswr, rlDb: rlDb, mlDb: mlDb,
      lambda: lambda, lphys: len * lambda, betaDeg: betaL * 180 / Math.PI,
      samples: samples, reMin: reMin, reMax: reMax, imMin: imMin, imMax: imMax };
  }

  function polar(ctx, w, top, c) {
    var p = E.palette();
    var cx = w * 0.46, cy = top * 0.55;
    var R = Math.min(w * 0.30, top * 0.36);
    E.label(ctx, "Γ düzlemi (Smith şeması)", 8, 12, { size: 10, color: p.ink2 });
    ctx.save();
    ctx.strokeStyle = p.ruleStrong; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([3, 3]); ctx.strokeStyle = p.grid;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.5, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = p.grid;
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
    ctx.strokeStyle = p.grid; ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.arc(cx + R * 0.5, cy, R * 0.5, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    E.label(ctx, "+1", cx + R + 4, cy + 13, { size: 8.5, color: p.muted });
    E.label(ctx, "−1", cx - R - 4, cy + 13, { size: 8.5, color: p.muted, align: "right" });
    E.label(ctx, "+j", cx + 4, cy - R - 9, { size: 8.5, color: p.muted });
    E.label(ctx, "−j", cx + 4, cy + R + 9, { size: 8.5, color: p.muted });
    if (c.gm > 0.02) {
      ctx.save();
      ctx.strokeStyle = p.grid; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.arc(cx, cy, R * c.gm, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    var lx = cx + c.gL.re * R, ly = cy - c.gL.im * R;
    var ix = cx + c.gIn.re * R, iy = cy - c.gIn.im * R;
    if (c.len > 0.002 && c.gm > 1e-4) {
      ctx.save();
      ctx.strokeStyle = p.accent; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
      var a0 = Math.atan2(c.gL.im, c.gL.re);
      ctx.beginPath();
      ctx.arc(cx, cy, R * c.gm, -a0, -a0 + 4 * Math.PI * c.len, false);
      ctx.stroke(); ctx.restore();
      var ae = -a0 + 4 * Math.PI * c.len;
      E.arrow(ctx, cx + R * c.gm * Math.cos(ae - 0.10), cy + R * c.gm * Math.sin(ae - 0.10),
        cx + R * c.gm * Math.cos(ae), cy + R * c.gm * Math.sin(ae),
        { color: p.accent, width: 1.2, head: 4 });
    }
    E.dot(ctx, lx, ly, 4, { fill: p.accent });
    E.dot(ctx, ix, iy, 4, { fill: p.blue });
    var near = Math.hypot(lx - ix, ly - iy) < 14;
    E.label(ctx, "Γ_L", lx + 7, ly - (near ? 10 : 14), { size: 9.5, color: p.accent });
    E.label(ctx, "Γ_in", ix - 7, iy + (near ? 18 : 14),
      { size: 9.5, color: p.blue, align: "right" });
  }

  function plotZ(ctx, w, top, h, c) {
    var p = E.palette();
    var lo = Math.min(0, c.reMin, c.imMin), hi = Math.max(0, c.reMax, c.imMax);
    var pad = Math.max((hi - lo) * 0.12, 4);
    var ax = E.axes(ctx, { x: 0, y: top, w: w, h: h }, {
      xmin: 0, xmax: 0.5, ymin: lo - pad, ymax: hi + pad,
      xlabel: "l/λ", ylabel: "Z_in (Ω)", padLeft: 46, padBottom: 30, padTop: 8,
      xticks: [{ v: 0, label: "0" }, { v: 0.25, label: "λ/4" }, { v: 0.5, label: "λ/2" }],
      nx: 4, ny: 4, ydigits: 0
    });
    var rePts = [], imPts = [], i, s;
    for (i = 0; i < c.samples.length; i++) {
      s = c.samples[i];
      rePts.push([ax.sx(s.d), ax.sy(s.re)]);
      imPts.push([ax.sx(s.d), ax.sy(s.im)]);
    }
    E.line(ctx, rePts, { color: p.blue, width: 1.8 });
    E.line(ctx, imPts, { color: p.amber, width: 1.5, dash: [5, 3] });
    E.label(ctx, "Re Z_in", ax.plot.x + 5, ax.plot.y + 10, { size: 9, color: p.blue });
    E.label(ctx, "Im Z_in", ax.plot.x + 58, ax.plot.y + 10, { size: 9, color: p.amber });
    var x = ax.sx(c.len);
    E.dash(ctx, x, ax.plot.y, x, ax.plot.y + ax.plot.h, { color: p.muted, dash: [3, 3] });
    E.dot(ctx, x, ax.sy(c.zin.re), 3.2, { fill: p.blue });
    E.dot(ctx, x, ax.sy(c.zin.im), 3.2, { fill: p.amber });
  }

  E.registerLab("txline", function (s, el) {
    var c = compute(s);
    E.canvas(el, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var top = Math.round(h * 0.56);
      polar(ctx, w, top, c);
      plotZ(ctx, w, top, h - top, c);
    });
    var vswr = isFinite(c.vswr) ? E.fmt(c.vswr, 3) : "∞";
    var rl = isFinite(c.rlDb) ? E.fmt(c.rlDb, 2) : "∞";
    var ml = isFinite(c.mlDb) ? E.fmt(c.mlDb, 3) : "∞";
    var status = "l/λ = " + E.fmt(c.len, 3) + " → βl = " + E.fmt(c.betaDeg, 1) +
      "°. Kayıpsız hat Γ'yı yalnızca döndürür: |Γ| = " + E.fmt(c.gm, 3) +
      ", VSWR = " + vswr + ", RL = " + rl + " dB. Z_in = " + cfmt(c.zin, 2) +
      " Ω; Γ_in = " + cfmt(c.gIn, 3) + ". " +
      (Math.abs(c.len) < 0.002
        ? "Yük düzleminde Γ_in = Γ_L ve Z_in = Z_L."
        : Math.abs(c.len - 0.25) < 0.01
          ? "Çeyrek dalgada Γ_in = −Γ_L; Z_in = Z0²/Z_L."
          : Math.abs(c.len - 0.5) < 0.01
            ? "Yarım dalgada Γ_in = Γ_L; Z_in = Z_L."
            : "Ara uzunlukta Γ_in, Γ_L'nin −2βd kadar dönmüş hâlidir; |Γ| sabit kalır.");
    return {
      readout: E.readout([
        ["Z_L", cfmt(c.zl, 1), "Ω"],
        ["Γ_L", cfmt(c.gL, 3), ""],
        ["|Γ|", E.fmt(c.gm, 3), ""],
        ["VSWR", vswr, ""],
        ["Geri dönüş kaybı", rl, "dB"],
        ["Z_in", cfmt(c.zin, 2), "Ω"],
        ["Uyumsuzluk kaybı", ml, "dB"],
        ["λ", E.fmt(c.lambda, 4), "m"],
        ["Fiziksel l", E.fmt(c.lphys, 4), "m"]
      ]),
      status: status,
      tone: c.gm < 0.01 ? "ok" : "",
      aria: "İletim hattı: Z0 = " + E.fmt(c.z0, 0) + " ohm, yük " + cfmt(c.zl, 1) +
        " ohm, uzunluk " + E.fmt(c.len, 3) + " dalga boyu. Yansıma katsayısı büyüklüğü " +
        E.fmt(c.gm, 3) + ", VSWR " + vswr + ", giriş empedansı " + cfmt(c.zin, 2) + " ohm.",
      print: "Statik yedek: Z0 = 50 Ω, ZL = 75 Ω, l = 0 için Γ = 0,2, VSWR = 1,5, " +
        "RL = 13,98 dB, Zin = 75 Ω; l = λ/4 için Zin = 33,3 Ω ve Γ_in = −0,2. " +
        "Çeyrek dalga transformatörü Z0′ = √(50·75) = 61,24 Ω ile Zin = 50 Ω olur."
    };
  });

  E.check("txline: 75/50 gives Γ=0.2, VSWR=1.5, RL=13.98 dB", function () {
    var c = compute({ z0: 50, rl: 75, xl: 0, len: 0, freq: 1000 });
    return Math.abs(c.gm - 0.2) < 1e-12 && Math.abs(c.vswr - 1.5) < 1e-12 &&
      Math.abs(c.rlDb - 13.9794) < 1e-3 && Math.abs(c.mlDb - 0.17729) < 1e-4;
  });
  E.check("txline: λ/4 transformer √(50·75)=61.24 Ω gives 50 Ω", function () {
    var zt = Math.sqrt(50 * 75);
    var c = compute({ z0: zt, rl: 75, xl: 0, len: 0.25, freq: 1000 });
    return Math.abs(c.zin.re - 50) < 1e-9 && Math.abs(c.zin.im) < 1e-9;
  });
  E.check("txline: |Γ| ≤ 1 and Zin(0) = ZL", function () {
    var ok = true, rl, xl, len, c;
    for (rl = 10; rl <= 150; rl += 20) {
      for (xl = -100; xl <= 100; xl += 50) {
        for (len = 0; len <= 0.5; len += 0.1) {
          c = compute({ z0: 50, rl: rl, xl: xl, len: len, freq: 1000 });
          if (c.gm > 1 + 1e-12) ok = false;
        }
        c = compute({ z0: 50, rl: rl, xl: xl, len: 0, freq: 1000 });
        if (Math.hypot(c.zin.re - rl, c.zin.im - xl) > 1e-7) ok = false;
      }
    }
    return ok;
  });
})();
