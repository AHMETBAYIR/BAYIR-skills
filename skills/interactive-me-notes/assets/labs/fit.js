/* ISO 286 fit lab: tolerance bands, limits, clearance/interference. */
(function () {
  "use strict";

  var BANDS = [[14, 18], [18, 30], [30, 50]];
  var IT = { 6: [11, 13, 16], 7: [18, 21, 25], 8: [27, 33, 39] };
  var F = [-16, -20, -25], G = [-6, -7, -9], K = [1, 2, 2], P = [18, 22, 26];
  var MINUS = "−";

  function band(d) {
    for (var i = 0; i < BANDS.length; i++) {
      if (d > BANDS[i][0] && d <= BANDS[i][1]) return i;
    }
    return -1;
  }

  function solve(d, hole, shaft) {
    var b = band(d);
    if (b < 0) throw new Error("Bu alt küme 14–50 mm arasıdır.");
    var ith = IT[+hole.charAt(1)][b], EIh = 0, ESh = ith;
    var ei, es;
    if (shaft === "f7") { es = F[b]; ei = es - IT[7][b]; }
    else if (shaft === "g6") { es = G[b]; ei = es - IT[6][b]; }
    else if (shaft === "h6") { es = 0; ei = -IT[6][b]; }
    else if (shaft === "k6") { ei = K[b]; es = ei + IT[6][b]; }
    else { ei = P[b]; es = ei + IT[6][b]; }
    var cMax = ESh - ei, cMin = EIh - es;
    var fit = cMin >= 0 ? "clearance" : (cMax <= 0 ? "interference" : "transition");
    return { d: d, hole: hole, shaft: shaft, EIh: EIh, ESh: ESh, ei: ei, es: es,
      ith: ith, its: es - ei, cMax: cMax, cMin: cMin, fit: fit, b: b };
  }

  function dev(v) {
    if (v === 0) return "0";
    return (v > 0 ? "+" : MINUS) + Math.abs(v);
  }

  ME.registerLab("fit", function (s, canvas) {
    var r, err = null;
    try { r = solve(s.d, s.hole, s.shaft); } catch (e) { err = e.message; }
    var p = ME.palette();
    ME.canvas(canvas, function (ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      if (err) {
        ME.label(ctx, err, W / 2, H / 2, { align: "center", size: 12, color: p.bad });
        return;
      }
      var padL = 26, padR = 26, x0 = padL, w = W - padL - padR;
      var vals = [r.EIh, r.ESh, r.ei, r.es, 0];
      var lim = Math.max(10, Math.max.apply(null, vals.map(Math.abs))) * 1.25;
      function X(v) { return x0 + (v + lim) / (2 * lim) * w; }
      var midX = X(0), yH = H * 0.30, yS = H * 0.68, bh = 16;

      // zero line
      ctx.strokeStyle = p.ruleStrong; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(midX, 18); ctx.lineTo(midX, H - 18); ctx.stroke();
      ME.label(ctx, "0", midX, H - 8, { size: 9, align: "center", color: p.muted });

      function bandRect(lo, hi, y, color, label) {
        var x1 = X(lo), x2 = X(hi);
        ctx.fillStyle = color + "33";
        ctx.fillRect(x1, y, Math.max(1, x2 - x1), bh);
        ctx.strokeStyle = color; ctx.lineWidth = 1.2;
        ctx.strokeRect(x1, y, Math.max(1, x2 - x1), bh);
        ME.label(ctx, label, (x1 + x2) / 2, y - 7, { size: 9, align: "center", color: color });
        if (Math.abs(x2 - x1) > 24) {
          ME.label(ctx, dev(lo) + "…" + dev(hi) + " µm", (x1 + x2) / 2, y + bh / 2,
            { size: 8, align: "center", color: p.ink2 });
        }
      }
      bandRect(r.EIh, r.ESh, yH, p.tension, "delik " + r.hole);
      bandRect(r.ei, r.es, yS, p.compression, "mil " + r.shaft);

      // clearance arrow
      var c1 = r.cMin, c2 = r.cMax;
      var xa = X(c1), xb = X(c2);
      var yy = H * 0.50;
      ME.arrow(ctx, xa, yy, xb, yy, { color: r.fit === "interference" ? p.compression : p.ok, width: 1.4, head: 6 });
      ME.arrow(ctx, xb, yy, xa, yy, { color: r.fit === "interference" ? p.compression : p.ok, width: 1.4, head: 6 });
      var lo = Math.min(Math.abs(c1), Math.abs(c2)), hi = Math.max(Math.abs(c1), Math.abs(c2));
      var lbl = r.fit === "interference" ? "sıkılık " + lo + "…" + hi + " µm" :
        (r.fit === "clearance" ? "boşluk " + c1 + "…" + c2 + " µm" : "geçiş " + c1 + "…" + c2 + " µm");
      ME.label(ctx, lbl, (xa + xb) / 2, yy - 9, { size: 9, align: "center", color: p.ink2 });
      ME.label(ctx, "IT_h=" + r.ith + " µm, IT_s=" + r.its + " µm", padL, 18, { size: 9, color: p.muted });
    });
    if (err) {
      return { readout: ME.readout([["Hata", err, ""]]), status: err, tone: "bad" };
    }
    var fitTr = r.fit === "clearance" ? "boşluk (clearance)" : r.fit === "interference" ? "sıkılık (interference)" : "geçiş (transition)";
    return {
      readout: ME.readout([
        ["Delik alt/üst", dev(r.EIh) + " / " + dev(r.ESh), "µm"],
        ["Mil alt/üst", dev(r.ei) + " / " + dev(r.es), "µm"],
        ["Delik sınırı", ME.fmt(s.d + r.EIh / 1000, 3) + "…" + ME.fmt(s.d + r.ESh / 1000, 3), "mm"],
        ["Mil sınırı", ME.fmt(s.d + r.ei / 1000, 3) + "…" + ME.fmt(s.d + r.es / 1000, 3), "mm"],
        ["Min boşluk", r.cMin, "µm"],
        ["Maks boşluk", r.cMax, "µm"],
        ["Geçme", fitTr, ""],
        ["IT toplamı", r.ith + r.its, "µm"]
      ]),
      status: "Ø" + ME.fmt(s.d, 1) + " " + r.hole + "/" + r.shaft + " → " + fitTr +
        "; " + (r.fit === "interference" ? "sıkılık " + Math.min(Math.abs(r.cMin), Math.abs(r.cMax)) + "…" +
          Math.max(Math.abs(r.cMin), Math.abs(r.cMax)) + " µm (boşluk " + r.cMin + "…" + r.cMax + " µm)" :
          "boşluk " + r.cMin + "…" + r.cMax + " µm") + ". Bantlar tablodan gelir; H7/h6 bir çıkarma değildir. " +
        "cMax−cMin = IT_h+IT_s = " + (r.ith + r.its) + " µm. 18, 30 ve 50 mm sınırlarında tablo sıçrar.",
      aria: "ISO 286 geçme bandı; " + r.hole + " delik, " + r.shaft + " mil, " + fitTr + "."
    };
  });

  ME.check("fit: 30 H7/p6 interference 1-35", function () {
    var r = solve(30, "H7", "p6");
    return r.fit === "interference" && r.cMin === -35 && r.cMax === -1;
  });
  ME.check("fit: 30 H7/h6 clearance 0-34", function () {
    var r = solve(30, "H7", "h6");
    return r.fit === "clearance" && r.cMin === 0 && r.cMax === 34;
  });
  ME.check("fit: 18 H7/p6 uses 14-18 band", function () {
    var r = solve(18, "H7", "p6");
    return r.ei === 18 && r.es === 29 && r.cMin === -29 && r.cMax === 0;
  });
  ME.check("fit: 30 H8/f7 clearance 20-74", function () {
    var r = solve(30, "H8", "f7");
    return r.cMin === 20 && r.cMax === 74;
  });
  ME.check("fit: width identity", function () {
    var r = solve(30, "H7", "p6");
    return r.cMax - r.cMin === r.ith + r.its;
  });
})();
