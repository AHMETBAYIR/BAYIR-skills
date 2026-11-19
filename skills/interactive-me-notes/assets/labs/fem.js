/* 1D bar FEM: assembly, solve, stress, mesh convergence. */
(function () {
  "use strict";

  var TAPER = 0.25;

  function solveLinear(A, b) {
    var n = b.length, M = [], i, j, k;
    for (i = 0; i < n; i++) { M.push(A[i].slice()); M[i].push(b[i]); }
    for (k = 0; k < n; k++) {
      var piv = k, best = Math.abs(M[k][k]);
      for (i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > best) { best = Math.abs(M[i][k]); piv = i; }
      if (best < 1e-14) throw new Error("Tekil matris");
      if (piv !== k) { var t = M[k]; M[k] = M[piv]; M[piv] = t; }
      var d = M[k][k];
      for (j = k; j <= n; j++) M[k][j] /= d;
      for (i = 0; i < n; i++) {
        if (i === k) continue;
        var f = M[i][k];
        if (f === 0) continue;
        for (j = k; j <= n; j++) M[i][j] -= f * M[k][j];
      }
    }
    return M.map(function (row) { return row[n]; });
  }

  function areaAt(x, L, A0, prof) {
    return prof === "taper" ? A0 * (1 - (1 - TAPER) * x / L) : A0;
  }

  function solveBar(s) {
    var n = s.n, E = s.E * 1000, L = s.L * 1000, A0 = s.A, P = s.P * 1000, q = s.q;
    var xs = [], i, e;
    for (i = 0; i <= n; i++) xs.push(i * L / n);
    var K = [], f = [], Le = [], Am = [], sig = [];
    for (i = 0; i <= n; i++) { K.push(new Array(n + 1).fill(0)); f.push(0); }
    for (e = 0; e < n; e++) {
      var le = xs[e + 1] - xs[e];
      var am = 0.5 * (areaAt(xs[e], L, A0, s.profile) + areaAt(xs[e + 1], L, A0, s.profile));
      var c = E * am / le;
      Le.push(le); Am.push(am);
      K[e][e] += c; K[e][e + 1] -= c; K[e + 1][e] -= c; K[e + 1][e + 1] += c;
      f[e] += q * le / 2; f[e + 1] += q * le / 2;
    }
    f[n] += P;
    var Kr = [], fr = [], r, c2;
    for (r = 1; r <= n; r++) {
      var row = [];
      for (c2 = 1; c2 <= n; c2++) row.push(K[r][c2]);
      Kr.push(row); fr.push(f[r]);
    }
    var u = [0].concat(solveLinear(Kr, fr));
    var R = 0;
    for (c2 = 0; c2 <= n; c2++) R += K[0][c2] * u[c2];
    R -= f[0];
    var smax = -Infinity;
    for (e = 0; e < n; e++) {
      var sv = E * (u[e + 1] - u[e]) / Le[e];
      sig.push(sv); if (sv > smax) smax = sv;
    }
    var exact;
    if (s.profile === "uniform") exact = (P * L + q * L * L / 2) / (E * A0);
    else {
      var ln = Math.log(1 / TAPER), b = 1 - TAPER;
      exact = (L / (b * E * A0)) * (P * ln + q * L * (1 - TAPER * ln / b));
    }
    return { n: n, xs: xs, u: u, sig: sig, Le: Le, R: R, P: P, q: q, L: L,
      A0: A0, E: E, smax: smax, uTip: u[n], exact: exact, prof: s.profile };
  }

  function draw(s, canvas) {
    var r = solveBar(s), p = ME.palette();
    var conv = [], nn, e2;
    for (nn = 2; nn <= 10; nn++) {
      var c = solveBar({ n: nn, L: s.L, A: s.A, E: s.E, P: s.P, q: s.q, profile: s.profile });
      conv.push([nn, (c.uTip - c.exact) / c.exact * 100]);
    }
    ME.canvas(canvas, function (ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      var padL = 44, padR = 14, x0 = padL, w = W - padL - padR;
      var top = 18, barH = 54, stressY = top + barH + 18, stressH = 74;
      var convY = stressY + stressH + 20, convH = H - convY - 26;
      var L = r.L;
      function X(x) { return x0 + x / L * w; }

      // deformed shape
      var umax = Math.max.apply(null, r.u.map(Math.abs)) || 1;
      var defl = 22;
      ctx.strokeStyle = p.ruleStrong; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X(0), top + 18); ctx.lineTo(X(L), top + 18); ctx.stroke();
      ctx.strokeStyle = p.accent; ctx.lineWidth = 2;
      ctx.beginPath();
      for (var i = 0; i <= r.n; i++) {
        var yy = top + 18 + (r.u[i] / umax) * defl;
        if (i === 0) ctx.moveTo(X(r.xs[i]), yy); else ctx.lineTo(X(r.xs[i]), yy);
      }
      ctx.stroke();
      for (i = 0; i <= r.n; i++) {
        ME.dot(ctx, X(r.xs[i]), top + 18 + (r.u[i] / umax) * defl, 2.6, { fill: p.ink });
        if (r.n <= 8 || i % 2 === 0) {
          ME.line(ctx, [[X(r.xs[i]), top + 4], [X(r.xs[i]), top + 32]], { color: p.rule, width: 0.8 });
        }
      }
      ME.label(ctx, "n=" + r.n + " eleman · ölçek ×" + ME.fmt(defl / umax, 1), x0, 12, { size: 9, color: p.muted });
      ME.label(ctx, "u=" + ME.fmt(r.uTip, 3) + " mm", X(L) - 4, top + 10, { size: 9, align: "right", color: p.accent });

      // stress steps
      var smaxAbs = Math.max(1, Math.max.apply(null, r.sig.map(Math.abs)));
      var midS = stressY + stressH / 2;
      ctx.strokeStyle = p.rule; ctx.beginPath(); ctx.moveTo(x0, midS); ctx.lineTo(x0 + w, midS); ctx.stroke();
      ctx.fillStyle = p.muted; ctx.font = "9px IBM Plex Sans, sans-serif";
      ctx.fillText("σ (MPa)", x0, stressY - 4);
      for (e2 = 0; e2 < r.n; e2++) {
        var y1 = midS - r.sig[e2] / smaxAbs * (stressH * 0.42);
        ctx.fillStyle = p.tension + "18";
        ctx.fillRect(X(r.xs[e2]), Math.min(midS, y1), X(r.xs[e2 + 1]) - X(r.xs[e2]), Math.abs(y1 - midS));
        ctx.strokeStyle = p.tension; ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(X(r.xs[e2]), y1); ctx.lineTo(X(r.xs[e2 + 1]), y1); ctx.stroke();
        if (e2 > 0) {
          var yp = midS - r.sig[e2 - 1] / smaxAbs * (stressH * 0.42);
          ctx.beginPath(); ctx.moveTo(X(r.xs[e2]), yp); ctx.lineTo(X(r.xs[e2]), y1); ctx.stroke();
        }
      }
      ME.label(ctx, "+" + ME.fmt(smaxAbs, 0) + " MPa", x0 + 3, midS - stressH * 0.42, { size: 8.5, color: p.tension });

      // convergence
      var errMax = Math.max(1, Math.max.apply(null, conv.map(function (q) { return Math.abs(q[1]); })));
      var cy = convY + convH / 2;
      ctx.strokeStyle = p.rule; ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(x0 + w, cy); ctx.stroke();
      ctx.fillStyle = p.muted; ctx.fillText("h-yakınsama: (u_n − u_exact)/u_exact (%)", x0, convY - 4);
      var cpts = conv.map(function (q) {
        return [x0 + (q[0] - 2) / 8 * w, cy + q[1] / errMax * (convH * 0.38)];
      });
      ME.line(ctx, cpts, { color: p.ok, width: 1.8 });
      conv.forEach(function (q, k) {
        ME.dot(ctx, cpts[k][0], cpts[k][1], 2.6, { fill: q[0] === s.n ? p.accent : p.ok });
      });
      if (r.prof === "uniform") {
        ME.label(ctx, "düzgün kesit: tüm ağlarda tam (hata ≈ 0)", x0 + w / 2, cy - 12, { size: 9, align: "center", color: p.muted });
      }
      ME.label(ctx, "n=" + s.n + " · hata " + ME.fmt((r.uTip - r.exact) / r.exact * 100, 3) + "%",
        x0 + w, convY + 10, { size: 9, align: "right", color: p.ink2 });
    });
    var err = (r.uTip - r.exact) / r.exact * 100;
    return {
      readout: ME.readout([
        ["u_tip (FEM)", ME.fmt(r.uTip, 4), "mm"],
        ["u_tip (kapalı)", ME.fmt(r.exact, 4), "mm"],
        ["hata", ME.fmt(err, 3), "%"],
        ["σ_max", ME.fmt(r.smax, 1), "MPa"],
        ["R₀", ME.fmt(r.R, 0), "N"],
        ["DOF", r.n, ""],
        ["E", ME.fmt(s.E, 0), "GPa"]
      ]),
      status: "n=" + s.n + " doğrusal çubuk: u_tip=" + ME.fmt(r.uTip, 4) + " mm, kapalı form " +
        ME.fmt(r.exact, 4) + " mm, hata " + ME.fmt(err, 3) + "%. R₀=" + ME.fmt(r.R, 0) +
        " N. Düzgün kesitte düğüm çözümü her ağda tamdır; yakınsamayı konik çubukla görün. " +
        "Nokta yükü gerilme tekilliği yaratır; ağ iyileştirmesi onu çözmez.",
      aria: "1B çubuk FEM; uç yer değiştirmesi " + ME.fmt(r.uTip, 3) + " milimetre, hata " + ME.fmt(err, 2) + " yüzde."
    };
  }

  ME.registerLab("fem", draw);
  ME.check("fem: uniform tip 0.5 mm", function () {
    var r = solveBar({ n: 4, L: 1, A: 100, E: 200, P: 10, q: 0, profile: "uniform" });
    return Math.abs(r.uTip - 0.5) < 1e-9;
  });
  ME.check("fem: stress 100 MPa and R=-10 kN", function () {
    var r = solveBar({ n: 4, L: 1, A: 100, E: 200, P: 10, q: 0, profile: "uniform" });
    return Math.abs(r.sig[0] - 100) < 1e-9 && Math.abs(r.R + 10000) < 1e-6;
  });
  ME.check("fem: taper n=10 error -0.2495%", function () {
    var r = solveBar({ n: 10, L: 1, A: 100, E: 200, P: 10, q: 0, profile: "taper" });
    return Math.abs((r.uTip - r.exact) / r.exact * 100 + 0.2495) < 1e-3;
  });
  ME.check("fem: P=10 kN + q=5 N/mm tip 0.625 mm", function () {
    var r = solveBar({ n: 4, L: 1, A: 100, E: 200, P: 10, q: 5, profile: "uniform" });
    return Math.abs(r.uTip - 0.625) < 1e-9 && Math.abs(r.R + 15000) < 1e-6;
  });
})();
