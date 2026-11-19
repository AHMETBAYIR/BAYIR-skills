/* Mohr's circle: plane stress transformation with a stress element. */
(function () {
  "use strict";

  function compute(s) {
    var C = (s.sx + s.sy) / 2;
    var R = Math.hypot((s.sx - s.sy) / 2, s.txy);
    var s1 = C + R, s2 = C - R;
    var tp = 0.5 * Math.atan2(2 * s.txy, s.sx - s.sy) * 180 / Math.PI;
    var vm = Math.sqrt(Math.max(0, s.sx * s.sx - s.sx * s.sy + s.sy * s.sy + 3 * s.txy * s.txy));
    var tresca = Math.max(Math.abs(s1 - s2), Math.abs(s1), Math.abs(s2));
    return { C: C, R: R, s1: s1, s2: s2, tp: tp, vm: vm, tresca: tresca };
  }

  function draw(s, canvas, root) {
    var r = compute(s);
    var p = ME.palette();
    ME.canvas(canvas, function (ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      var split = W < 520 ? 0.42 : 0.38;
      var ew = Math.min(W * split, 210);
      var ex = 10, ey = 42, es = Math.min(ew - 26, H * 0.38);

      // ---------- stress element ----------
      ctx.strokeStyle = p.ink; ctx.lineWidth = 1.6;
      ctx.fillStyle = p.band;
      ctx.fillRect(ex + 30, ey + 26, es, es);
      ctx.strokeRect(ex + 30, ey + 26, es, es);
      var cx = ex + 30 + es / 2, cy = ey + 26 + es / 2;
      function arrowTo(dx, dy, len, color, text, lx, ly) {
        ME.arrow(ctx, cx + dx * es * 0.52, cy + dy * es * 0.52,
          cx + dx * (es * 0.52 + len), cy + dy * (es * 0.52 + len),
          { color: color, width: 1.6, head: 6 });
        ME.label(ctx, text, cx + lx, cy + ly, { size: 10, color: color, align: "center" });
      }
      var maxs = Math.max(20, Math.abs(s.sx), Math.abs(s.sy));
      var lx = 18 * Math.abs(s.sx) / maxs, ly = 18 * Math.abs(s.sy) / maxs;
      var sxDir = s.sx >= 0 ? 1 : -1, syDir = s.sy >= 0 ? 1 : -1;
      arrowTo(0, -1, ly * syDir, p.compression, "σy=" + ME.fmt(s.sy, 0), 0, -es * 0.62 - 12);
      arrowTo(0, 1, ly * syDir, p.compression, "", 0, 0);
      arrowTo(1, 0, lx * sxDir, p.tension, "σx=" + ME.fmt(s.sx, 0), es * 0.62 + 8, -10);
      arrowTo(-1, 0, lx * sxDir, p.tension, "", 0, 0);
      // shear couple
      var tl = 14 * Math.min(1, Math.abs(s.txy) / Math.max(1, maxs));
      var sh = s.txy >= 0 ? 1 : -1;
      ME.arrow(ctx, cx - es * 0.5, cy + es * 0.5 - 6, cx + es * 0.5, cy + es * 0.5 - 6,
        { color: p.accent, width: 1.3, head: 5 });
      ME.arrow(ctx, cx + es * 0.5, cy - es * 0.5 + 6, cx - es * 0.5, cy - es * 0.5 + 6,
        { color: p.accent, width: 1.3, head: 5 });
      ME.label(ctx, "τ=" + ME.fmt(s.txy, 0), cx, cy + 2, { size: 10, color: p.accent, align: "center", background: p.sheet });
      ME.label(ctx, "gerilme elemanı (MPa)", ex + 6, 20, { size: 10, color: p.muted });

      // ---------- Mohr circle ----------
      var bx = W * (split + 0.02), bw = W - bx - 10;
      var y0 = 34, bh = H - 58;
      var smin = Math.min(r.s2, s.sx, s.sy) - 20;
      var smax = Math.max(r.s1, s.sx, s.sy) + 20;
      if (smax - smin < 20) { smin -= 10; smax += 10; }
      var tmax = Math.max(r.R, Math.abs(s.txy), 10) * 1.25;
      function X(v) { return bx + (v - smin) / (smax - smin) * bw; }
      function Y(v) { return y0 + bh / 2 - v / tmax * (bh / 2); }
      var mid = y0 + bh / 2;
      ctx.strokeStyle = p.rule; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(bx, mid); ctx.lineTo(bx + bw, mid); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(X(0), y0); ctx.lineTo(X(0), y0 + bh); ctx.stroke();
      ctx.fillStyle = p.muted; ctx.font = "10px IBM Plex Sans, sans-serif";
      ctx.fillText("σ (MPa)", bx + bw - 44, mid - 5);
      ctx.save(); ctx.translate(bx - 2, y0 + 12); ctx.rotate(-Math.PI / 2);
      ctx.fillText("τ", 0, 0); ctx.restore();

      ctx.beginPath();
      ctx.arc(X(r.C), mid, Math.abs(Y(r.R) - mid), 0, Math.PI * 2);
      ctx.strokeStyle = p.accent; ctx.lineWidth = 1.8; ctx.stroke();

      // diameter and points
      ME.line(ctx, [[X(r.s2), mid], [X(r.s1), mid]], { color: p.ruleStrong, width: 1, dash: [4, 3] });
      ME.dot(ctx, X(r.C), mid, 3, { fill: p.ink });
      ME.label(ctx, "C=" + ME.fmt(r.C, 0), X(r.C), mid + 13, { size: 9, align: "center", color: p.muted });
      ME.dot(ctx, X(s.sx), Y(-s.txy), 3.5, { fill: p.tension });
      ME.label(ctx, "X", X(s.sx) + 4, Y(-s.txy) - 5, { size: 10, color: p.tension });
      ME.dot(ctx, X(s.sy), Y(s.txy), 3.5, { fill: p.compression });
      ME.label(ctx, "Y", X(s.sy) + 4, Y(s.txy) + 8, { size: 10, color: p.compression });
      ME.line(ctx, [[X(r.s1), y0], [X(r.s1), y0 + bh]], { color: p.rule, width: 1, dash: [2, 4] });
      ME.line(ctx, [[X(r.s2), y0], [X(r.s2), y0 + bh]], { color: p.rule, width: 1, dash: [2, 4] });
      ME.label(ctx, "σ₁=" + ME.fmt(r.s1, 0), X(r.s1), y0 + 8, { size: 9, align: "center", color: p.tension });
      ME.label(ctx, "σ₂=" + ME.fmt(r.s2, 0), X(r.s2), y0 + 8, { size: 9, align: "center", color: p.compression });
      ME.arrow(ctx, X(r.C), mid, X(r.C), Y(r.R), { color: p.ink2, width: 1.2, head: 5 });
      ME.label(ctx, "τmax=" + ME.fmt(r.R, 0), X(r.C) + 5, Y(r.R) + 12, { size: 9, color: p.ink2 });
      ME.line(ctx, [[X(r.C), mid], [X(r.sx), Y(-s.txy)]], { color: p.tension, width: 1, dash: [2, 2] });
      ME.label(ctx, "2θp", (X(r.C) + X(s.sx)) / 2, (mid + Y(-s.txy)) / 2 - 5, { size: 9, color: p.tension, align: "center" });
    });
    return {
      readout: ME.readout([
        ["C", ME.fmt(r.C, 1), "MPa"],
        ["R", ME.fmt(r.R, 1), "MPa"],
        ["σ₁", ME.fmt(r.s1, 1), "MPa"],
        ["σ₂", ME.fmt(r.s2, 1), "MPa"],
        ["τmax", ME.fmt(r.R, 1), "MPa"],
        ["θp", ME.fmt(r.tp, 1), "°"],
        ["von Mises", ME.fmt(r.vm, 1), "MPa"],
        ["Tresca", ME.fmt(r.tresca, 1), "MPa"]
      ]),
      status: "C=(σx+σy)/2=" + ME.fmt(r.C, 1) + " MPa, R=" + ME.fmt(r.R, 1) +
        " MPa. Asal gerilmeler σ₁=" + ME.fmt(r.s1, 1) + ", σ₂=" + ME.fmt(r.s2, 1) +
        " MPa; θp=" + ME.fmt(r.tp, 1) + "°. I₁=σx+σy=" + ME.fmt(s.sx + s.sy, 1) +
        " MPa değişmez. Maksimum kayma düzlemi asal düzlemden 45° döner; işaret ve dönme yönü çizimde.",
      aria: "Mohr çemberi; σ1 " + ME.fmt(r.s1, 1) + " megapaskal, σ2 " + ME.fmt(r.s2, 1) + " megapaskal."
    };
  }

  ME.registerLab("mohr", draw);
  ME.check("mohr: I1 invariant", function () {
    var s = { sx: 80, sy: -20, txy: 40 }, r = compute(s);
    return Math.abs((s.sx + s.sy) - (r.s1 + r.s2)) < 1e-9;
  });
  ME.check("mohr: R and principal", function () {
    var r = compute({ sx: 80, sy: -20, txy: 40 });
    return Math.abs(r.R - 64.03124) < 1e-4 && Math.abs(r.s1 - 94.03124) < 1e-4;
  });
  ME.check("mohr: pure shear von Mises", function () {
    return Math.abs(compute({ sx: 0, sy: 0, txy: 100 }).vm - 173.20508) < 1e-4;
  });
})();
