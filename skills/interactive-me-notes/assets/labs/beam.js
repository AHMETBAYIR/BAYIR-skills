/* Beam lab: simply supported / cantilever, point load + UDL, V-M-deflection. */
(function () {
  "use strict";

  var G = 9.80665;

  function section(s) {
    if (s.sec === "ibeam") {
      var h = s.hw + 2 * s.tf;
      var A = s.bf * h - (s.bf - s.tw) * s.hw;
      var I = (s.bf * Math.pow(h, 3) - (s.bf - s.tw) * Math.pow(s.hw, 3)) / 12;
      return { A: A, I: I, c: h / 2, h: h, tw: s.tw, hw: s.hw };
    }
    return { A: s.b * s.h, I: s.b * Math.pow(s.h, 3) / 12, c: s.h / 2, h: s.h };
  }

  function compute(s) {
    var sp = section(s);
    var EI = s.E * 1e3 * sp.I;               // N mm^2 (E MPa, I mm^4)
    var L = s.L * 1e3, a = Math.min(Math.max(s.a, 0), s.L) * 1e3;
    var P = s.P * 1e3, w = s.w;              // w in N/mm
    var x = Math.min(Math.max(s.x, 0), s.L) * 1e3;
    var i, xx, V, M, d, n = 241, Vx = [], Mx = [], dx = [], xs = [];
    var RA, RB = 0, MA = 0;

    if (s.support === "cant") {
      RA = P + w * L;
      MA = P * L + w * L * L / 2;
      for (i = 0; i < n; i++) {
        xx = L * i / (n - 1);
        xs.push(xx / 1e3);
        Vx.push(RA - w * xx);
        Mx.push(-(P * (L - xx) + w * Math.pow(L - xx, 2) / 2));
        dx.push(P * xx * xx * (3 * L - xx) / (6 * EI) +
          w * xx * xx * (6 * L * L - 4 * L * xx + xx * xx) / (24 * EI));
      }
    } else {
      RA = P * (L - a) / L + w * L / 2;
      RB = P * a / L + w * L / 2;
      for (i = 0; i < n; i++) {
        xx = L * i / (n - 1);
        xs.push(xx / 1e3);
        Vx.push(RA - w * xx - (xx >= a ? P : 0));
        Mx.push(RA * xx - w * xx * xx / 2 - (xx >= a ? P * (xx - a) : 0));
        var dp = (xx <= a)
          ? P * (L - a) * xx * (L * L - Math.pow(L - a, 2) - xx * xx) / (6 * EI * L)
          : P * a * (L - xx) * (L * L - a * a - Math.pow(L - xx, 2)) / (6 * EI * L);
        dx.push(dp + w * xx * (L * L * L - 2 * L * xx * xx + xx * xx * xx) / (24 * EI));
      }
    }

    function at(arr, xv) {
      var f = xv / L * (arr.length - 1), k = Math.floor(f), t = f - k;
      if (k < 0) return arr[0];
      if (k >= arr.length - 1) return arr[arr.length - 1];
      return arr[k] * (1 - t) + arr[k + 1] * t;
    }

    V = at(Vx, x); M = at(Mx, x); d = at(dx, x);
    var Mmax = 0, Vmax = 0, dmax = 0;
    for (i = 0; i < n; i++) {
      if (Math.abs(Mx[i]) > Mmax) Mmax = Math.abs(Mx[i]);
      if (Math.abs(Vx[i]) > Vmax) Vmax = Math.abs(Vx[i]);
      if (Math.abs(dx[i]) > dmax) dmax = Math.abs(dx[i]);
    }
    var sigma = Math.abs(M) * sp.c / sp.I;    // N/mm^2 = MPa
    var tau = s.sec === "rect" ? 1.5 * Math.abs(V) / sp.A : Math.abs(V) / (sp.tw * sp.hw);
    return {
      sp: sp, EI: EI, L: L, a: a, P: P, w: w, x: x, xs: xs,
      Vx: Vx, Mx: Mx, dx: dx, RA: RA, RB: RB, MA: MA,
      V: V, M: M, d: d, Mmax: Mmax, Vmax: Vmax, dmax: dmax,
      sigma: sigma, tau: tau
    };
  }

  function draw(s, c, el) {
    var r = compute(s);
    var p = ME.palette();
    ME.canvas(c, function (ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      var padL = 46, padR = 16, top = 16;
      var plotW = W - padL - padR;
      var beamH = 62, gap = 8;
      var diagH = (H - top - beamH - 3 * gap - 18) / 3;
      var x0 = padL, y0 = top + beamH;
      function X(m) { return x0 + m / s.L * plotW; }
      var col = { ink: p.ink, muted: p.muted, rule: p.rule, acc: p.accent,
        v: p.tension, m: p.compression, d: p.ok };

      // ---- beam ----
      var yb = top + beamH * 0.55;
      ctx.strokeStyle = col.ink; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x0, yb); ctx.lineTo(x0 + plotW, yb); ctx.stroke();
      // supports
      function tri(x, dir) {
        ctx.beginPath(); ctx.moveTo(x, yb); ctx.lineTo(x - 8, yb + 14); ctx.lineTo(x + 8, yb + 14); ctx.closePath();
        ctx.fillStyle = p.sheet; ctx.fill(); ctx.strokeStyle = col.ink; ctx.lineWidth = 1.2; ctx.stroke();
      }
      if (s.support === "cant") {
        ctx.strokeStyle = col.ink; ctx.lineWidth = 1.2;
        for (var hh = -12; hh <= 14; hh += 6) {
          ctx.beginPath(); ctx.moveTo(x0, yb + hh); ctx.lineTo(x0 - 9, yb + hh - 5); ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(x0, yb - 14); ctx.lineTo(x0, yb + 14); ctx.stroke();
      } else {
        tri(x0, 1); tri(x0 + plotW, 1);
        ctx.strokeStyle = col.ink; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x0 + plotW, yb + 17, 2.2, 0, 6.283); ctx.stroke();
      }
      // point load
      if (s.P > 0) {
        var xa = X(s.support === "cant" ? s.L : r.a / 1000);
        ME.arrow(ctx, xa, yb - 44, xa, yb - 4, { color: col.m, width: 1.8, head: 7 });
        ME.label(ctx, "P=" + ME.fmt(s.P, 2) + " kN", xa + 4, yb - 46, { size: 10, color: col.m });
      }
      // UDL
      if (s.w > 0) {
        var nU = 9, i;
        for (i = 0; i <= nU; i++) {
          var xu = x0 + plotW * i / nU;
          ME.arrow(ctx, xu, yb - 26, xu, yb - 3, { color: col.acc, width: 1, head: 4 });
        }
        ctx.strokeStyle = col.acc; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0, yb - 28); ctx.lineTo(x0 + plotW, yb - 28); ctx.stroke();
        ME.label(ctx, "w=" + ME.fmt(s.w, 2) + " N/mm", x0 + 4, yb - 34, { size: 10, color: col.acc });
      }
      ME.dim(ctx, x0, yb + 26, x0 + plotW, yb + 26, "L=" + ME.fmt(s.L, 2) + " m");

      // ---- diagrams ----
      function panel(y, arr, title, unit, color, scaleMax) {
        var maxv = scaleMax || 1e-12;
        var mid = y + diagH / 2;
        ctx.strokeStyle = col.rule; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0, mid); ctx.lineTo(x0 + plotW, mid); ctx.stroke();
        ctx.fillStyle = col.muted; ctx.font = "10px " + "IBM Plex Sans, sans-serif";
        ctx.fillText(title, x0 + 2, y + 10);
        ctx.textAlign = "right"; ctx.fillText(unit, x0 + plotW - 2, y + 10); ctx.textAlign = "left";
        if (!maxv || !isFinite(maxv)) return;
        ctx.beginPath();
        for (var j = 0; j < arr.length; j++) {
          var px = X(r.xs[j] || 0);
          var py = mid - arr[j] / maxv * (diagH * 0.42);
          if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.lineTo(x0 + plotW, mid); ctx.lineTo(x0, mid); ctx.closePath();
        ctx.fillStyle = color + "22"; ctx.fill();
        // cursor
        var xc = X(r.x / 1000);
        ctx.strokeStyle = p.accent; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(xc, y); ctx.lineTo(xc, y + diagH); ctx.stroke();
        ctx.setLineDash([]);
      }
      var y1 = y0 + gap;
      panel(y1, r.Vx, "V(x)", "kN", col.v, r.Vmax);
      var y2 = y1 + diagH + gap;
      panel(y2, r.Mx, "M(x)", "kN·m", col.m, r.Mmax);
      var y3 = y2 + diagH + gap;
      panel(y3, r.dx, "δ(x)", "mm", col.d, r.dmax);

      // max labels
      ME.label(ctx, "Mmax=" + ME.fmt(r.Mmax / 1e6, 2) + " kN·m", x0 + plotW, y2 + diagH - 4, { align: "right", size: 10, color: col.m });
      if (r.dmax > 0) ME.label(ctx, "δmax=" + ME.fmt(r.dmax, 2) + " mm", x0 + plotW, y3 + diagH - 4, { align: "right", size: 10, color: col.d });
    });
    return {
      readout: ME.readout([
        ["R_A", ME.fmt(r.RA / 1e3, 3), "kN"],
        [s.support === "cant" ? "M_A" : "R_B", ME.fmt((s.support === "cant" ? r.MA : r.RB) / 1e3, 3), s.support === "cant" ? "kN·m" : "kN"],
        ["V(x)", ME.fmt(r.V / 1e3, 3), "kN"],
        ["M(x)", ME.fmt(r.M / 1e6, 3), "kN·m"],
        ["σ(x)=Mc/I", ME.fmt(r.sigma, 1), "MPa"],
        ["δ(x)", ME.fmt(r.d, 2), "mm"],
        ["δ_max", ME.fmt(r.dmax, 2), "mm"],
        ["I", ME.fmt(r.sp.I / 1e6, 2), "×10⁶ mm⁴"]
      ]),
      status: ((s.a > s.L || s.x > s.L) ? "a veya x açıklığı aşıyor; L'ye çekildi. " : "") +
        "L=" + ME.fmt(s.L, 2) + " m, P=" + ME.fmt(s.P, 2) + " kN, w=" + ME.fmt(s.w, 2) +
        " N/mm → M_max=" + ME.fmt(r.Mmax / 1e6, 2) + " kN·m, δ_max=" + ME.fmt(r.dmax, 2) +
        " mm. Basit mesnette M=PL/4, δ=PL³/48EI; konsol aynı yükte 4 ve 16 katıdır. " +
        "İmleç x=" + ME.fmt(r.x / 1000, 2) + " m: σ=Mc/I, τ≈" + (s.sec === "rect" ? "3V/2A" : "V/(t_w h_w)") + ".",
      aria: "Kiriş diyagramı; açıklık " + ME.fmt(s.L, 2) + " metre, maksimum moment " +
        ME.fmt(r.Mmax / 1e6, 2) + " kilonewton metre, maksimum çökme " + ME.fmt(r.dmax, 2) + " milimetre."
    };
  }

  ME.registerLab("beam", draw);

  ME.check("beam: reactions sum to load", function () {
    var r = compute({ support: "ss", L: 4, P: 2, a: 2, w: 0, E: 200, sec: "rect", b: 60, h: 100, x: 2 });
    return Math.abs(r.RA + r.RB - 2000) < 1e-6;
  });
  ME.check("beam: midspan M = PL/4", function () {
    var r = compute({ support: "ss", L: 4, P: 2, a: 2, w: 0, E: 200, sec: "rect", b: 60, h: 100, x: 2 });
    return Math.abs(r.M - 2e6) < 1e-3;
  });
  ME.check("beam: midspan deflection = PL^3/48EI", function () {
    var r = compute({ support: "ss", L: 4, P: 2, a: 2, w: 0, E: 200, sec: "rect", b: 60, h: 100, x: 2 });
    return Math.abs(r.d - 2.6666667) < 1e-4;
  });
})();
