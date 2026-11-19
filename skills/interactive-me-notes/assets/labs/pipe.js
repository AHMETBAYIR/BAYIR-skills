/* Pipe lab: Darcy-Weisbach, Colebrook, minor losses, live Moody point. */
(function () {
  "use strict";

  var RHO = 998, MU = 1.002e-3, G = 9.80665;

  function colebrook(Re, rel) {
    if (Re < 2300) return 64 / Math.max(Re, 1e-9);
    var f = 0.02;
    for (var i = 0; i < 60; i++) {
      var rhs = -2 * Math.log10(rel / 3.7 + 2.51 / (Re * Math.sqrt(f)));
      var fn = 1 / (rhs * rhs);
      if (Math.abs(fn - f) < 1e-12) { f = fn; break; }
      f = 0.5 * f + 0.5 * fn;
    }
    return f;
  }

  function compute(s) {
    var D = s.D / 1000, L = s.L, Q = s.Q / 1000, eps = s.eps / 1000;
    var A = Math.PI * D * D / 4;
    var V = Q / A;
    var Re = RHO * V * D / MU;
    var rel = eps / D;
    var f = colebrook(Re, rel);
    var hf = f * (L / D) * V * V / (2 * G);
    var hm = s.K * V * V / (2 * G);
    var hL = hf + hm;
    return {
      D: D, A: A, V: V, Re: Re, rel: rel, f: f, hf: hf, hm: hm, hL: hL,
      dp: RHO * G * hL, P: RHO * G * Q * hL,
      regime: Re < 2300 ? "laminar" : (Re < 4000 ? "geçiş" : "türbülans")
    };
  }

  function draw(s, canvas) {
    var r = compute(s);
    var p = ME.palette();
    ME.canvas(canvas, function (ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      var chartH = Math.max(210, H * 0.68);
      var padL = 46, padR = 12, padT = 18, padB = 26;
      var x0 = padL, y0 = padT, w = W - padL - padR, h = chartH - padT - padB;
      var ReMin = 1e3, ReMax = 1e7, fMin = 0.008, fMax = 0.12;
      function X(Re) { return x0 + (Math.log10(Re) - Math.log10(ReMin)) / 4 * w; }
      function Y(f) { return y0 + h - (Math.log10(f) - Math.log10(fMin)) / (Math.log10(fMax) - Math.log10(fMin)) * h; }

      ctx.strokeStyle = p.rule; ctx.lineWidth = 1;
      ctx.fillStyle = p.muted; ctx.font = "9px IBM Plex Sans, sans-serif";
      var dec;
      for (dec = 3; dec <= 7; dec++) {
        var xx = X(Math.pow(10, dec));
        ctx.beginPath(); ctx.moveTo(xx, y0); ctx.lineTo(xx, y0 + h); ctx.stroke();
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText("1e" + dec, xx, y0 + h + 4);
      }
      [0.01, 0.02, 0.05, 0.1].forEach(function (fv) {
        var yy = Y(fv);
        ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + w, yy); ctx.stroke();
        ctx.textAlign = "right"; ctx.textBaseline = "middle";
        ctx.fillText(String(fv), x0 - 4, yy);
      });
      ctx.textAlign = "left";
      ctx.fillText("f", 8, y0 + 6);
      ctx.textAlign = "right";
      ctx.fillText("Re", x0 + w, y0 + h + 18);

      // laminar line
      var pts = [], Re;
      for (Re = 1e3; Re <= 2300; Re *= 1.04) pts.push([X(Re), Y(64 / Re)]);
      ME.line(ctx, pts, { color: p.ink2, width: 1.6 });
      ME.label(ctx, "64/Re", X(1600), Y(0.04) - 8, { size: 9, color: p.ink2 });

      // Colebrook curves
      var rels = [0, 0.0001, 0.0005, 0.001, 0.005, 0.02];
      rels.forEach(function (rr, idx) {
        var curve = [];
        for (Re = 3000; Re <= 1e7; Re *= 1.06) {
          curve.push([X(Re), Y(colebrook(Re, rr))]);
        }
        ME.line(ctx, curve, { color: idx === 0 ? p.ok : p.ruleStrong, width: idx === 0 ? 1.4 : 1, dash: idx === 0 ? [5, 3] : null });
        ME.label(ctx, idx === 0 ? "düz" : (rr * 1000).toFixed(1) + "e-3", X(8e6), Y(colebrook(8e6, rr)) - 5,
          { size: 8, color: idx === 0 ? p.ok : p.muted, align: "right" });
      });

      // live point
      var px = X(Math.max(ReMin, Math.min(ReMax, r.Re)));
      var py = Y(Math.max(fMin, Math.min(fMax, r.f)));
      ME.dot(ctx, px, py, 4, { fill: p.accent });
      ME.label(ctx, "Re=" + ME.fmt(r.Re, 0) + ", f=" + ME.fmt(r.f, 4), Math.min(px + 6, W - 100), Math.max(py - 12, y0 + 10),
        { size: 9, color: p.accent });

      // head-loss bars
      var by = chartH + 6, bh = H - by - 12;
      var scale = Math.max(r.hf + r.hm, 0.1);
      var bw = W - padL - padR;
      ctx.fillStyle = p.muted; ctx.font = "9px IBM Plex Sans, sans-serif"; ctx.textAlign = "left";
      ctx.fillText("Yük kaybı: sürtünme + yerel = " + ME.fmt(r.hf, 2) + " + " + ME.fmt(r.hm, 2) + " m", padL, by + 10);
      var ybar = by + 20, hbar = Math.max(10, bh - 26);
      ctx.fillStyle = p.band; ctx.fillRect(padL, ybar, bw, hbar);
      ctx.fillStyle = p.tension; ctx.fillRect(padL, ybar, bw * r.hf / scale, hbar);
      ctx.fillStyle = p.accent; ctx.fillRect(padL + bw * r.hf / scale, ybar, bw * r.hm / scale, hbar);
      ctx.strokeStyle = p.ruleStrong; ctx.strokeRect(padL, ybar, bw, hbar);
      ME.label(ctx, "hf", padL + 4, ybar + hbar / 2, { size: 9, color: p.sheet });
      if (r.hm > 0) ME.label(ctx, "hm", padL + bw * r.hf / scale + 4, ybar + hbar / 2, { size: 9, color: p.sheet });
    });
    return {
      readout: ME.readout([
        ["V", ME.fmt(r.V, 3), "m/s"],
        ["Re", ME.fmt(r.Re, 0), ""],
        ["ε/D", r.rel.toExponential(2), ""],
        ["f (Colebrook)", ME.fmt(r.f, 5), ""],
        ["hf", ME.fmt(r.hf, 3), "m"],
        ["hm", ME.fmt(r.hm, 3), "m"],
        ["Δp", ME.fmt(r.dp / 1000, 2), "kPa"],
        ["P (pompa)", ME.fmt(r.P / 1000, 3), "kW"]
      ]),
      status: "D=" + ME.fmt(s.D, 1) + " mm, Q=" + ME.fmt(s.Q, 2) + " L/s → V=" + ME.fmt(r.V, 3) +
        " m/s, Re=" + ME.fmt(r.Re, 0) + " (" + r.regime + "). f=" + ME.fmt(r.f, 4) +
        " Colebrook'tan; hf=" + ME.fmt(r.hf, 2) + " m, hm=" + ME.fmt(r.hm, 2) +
        " m. Yerel kayıp K·V²/2g; toplam yük pompa gücünü belirler.",
      aria: "Moody diyagramı; Reynolds " + ME.fmt(r.Re, 0) + ", sürtünme faktörü " + ME.fmt(r.f, 4) + "."
    };
  }

  ME.registerLab("pipe", draw);
  ME.check("pipe: DN50 velocity", function () {
    var r = compute({ D: 52.5, L: 10, Q: 3, eps: 0.045, K: 4 });
    return Math.abs(r.V - 1.385839) < 1e-5;
  });
  ME.check("pipe: DN50 Reynolds", function () {
    var r = compute({ D: 52.5, L: 10, Q: 3, eps: 0.045, K: 4 });
    return Math.abs(r.Re - 72466.1) < 0.5;
  });
  ME.check("pipe: DN50 Colebrook f", function () {
    var r = compute({ D: 52.5, L: 10, Q: 3, eps: 0.045, K: 4 });
    return Math.abs(r.f - 0.0224812) < 1e-6;
  });
  ME.check("pipe: laminar f=64/Re", function () {
    return Math.abs(colebrook(1000, 0.001) - 0.064) < 1e-9;
  });
})();
