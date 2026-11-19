/* Four-bar lab: Grashof, position, transmission angle, velocity ratio, coupler trace. */
(function () {
  "use strict";

  function solve(th2, L) {
    var A = { x: L.r2 * Math.cos(th2), y: L.r2 * Math.sin(th2) };
    var dx = L.r1 - A.x, dy = -A.y, d = Math.hypot(dx, dy);
    if (d > L.r3 + L.r4 || d < Math.abs(L.r3 - L.r4) || d < 1e-9) return null;
    var a = (L.r3 * L.r3 - L.r4 * L.r4 + d * d) / (2 * d);
    var h = Math.sqrt(Math.max(0, L.r3 * L.r3 - a * a));
    var mx = A.x + a * dx / d, my = A.y + a * dy / d;
    var B = { x: mx - h * dy / d, y: my + h * dx / d };
    var t3 = Math.atan2(B.y - A.y, B.x - A.x);
    var t4 = Math.atan2(B.y, B.x - L.r1);
    var mu = Math.acos(Math.max(-1, Math.min(1, Math.cos(t4 - t3)))) * 180 / Math.PI;
    return { A: A, B: B, t3: t3, t4: t4, mu: Math.min(mu, 180 - mu),
      C: { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 } };
  }

  function velocity(th2, L, p) {
    var a11 = -L.r3 * Math.sin(p.t3), a12 = L.r4 * Math.sin(p.t4);
    var a21 = L.r3 * Math.cos(p.t3), a22 = -L.r4 * Math.cos(p.t4);
    var b1 = L.r2 * Math.sin(th2), b2 = -L.r2 * Math.cos(th2);
    var det = a11 * a22 - a12 * a21;
    if (Math.abs(det) < 1e-12) return { w3: NaN, w4: NaN };
    return { w3: (b1 * a22 - a12 * b2) / det, w4: (a11 * b2 - b1 * a21) / det };
  }

  function compute(s) {
    var L = { r1: s.r1, r2: s.r2, r3: s.r3, r4: s.r4 };
    var sort = [L.r1, L.r2, L.r3, L.r4].sort(function (a, b) { return a - b; });
    var grashof = sort[0] + sort[3] <= sort[1] + sort[2];
    var th = s.th * Math.PI / 180;
    var pos = solve(th, L);
    var v = pos ? velocity(th, L, pos) : { w3: NaN, w4: NaN };
    var trace = [], deg, p2;
    for (deg = 0; deg <= 360; deg += 3) {
      p2 = solve(deg * Math.PI / 180, L);
      if (p2) trace.push(p2.C);
    }
    return { L: L, grashof: grashof, s: sort[0], l: sort[3], p: sort[1], q: sort[2],
      pos: pos, v: v, trace: trace };
  }

  ME.registerLab("fourbar", function (s, canvas) {
    var r = compute(s), p = ME.palette();
    var pos = r.pos;
    ME.canvas(canvas, function (ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      if (!pos) {
        ME.label(ctx, "Bu krank açısında mekanizma kurulamıyor.", W / 2, H / 2, { align: "center", size: 12 });
        return;
      }
      var pts = r.trace.concat([{ x: 0, y: 0 }, { x: s.r1, y: 0 }, pos.A, pos.B]);
      var minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
      pts.forEach(function (q) {
        minx = Math.min(minx, q.x); maxx = Math.max(maxx, q.x);
        miny = Math.min(miny, q.y); maxy = Math.max(maxy, q.y);
      });
      var mx = Math.max(12, (maxx - minx) * 0.12), my = Math.max(12, (maxy - miny) * 0.18);
      minx -= mx; maxx += mx; miny -= my; maxy += my;
      var sc = Math.min((W - 24) / (maxx - minx), (H - 24) / (maxy - miny));
      var ox = (W - (maxx - minx) * sc) / 2 - minx * sc;
      var oy = (H - (maxy - miny) * sc) / 2 - miny * sc;
      function X(x) { return ox + x * sc; }
      function Y(y) { return H - (oy + y * sc); }

      // coupler trace
      if (r.trace.length > 2) {
        ME.line(ctx, r.trace.map(function (q) { return [X(q.x), Y(q.y)]; }),
          { color: p.accent, width: 1, dash: [3, 3] });
      }
      // ground
      ME.line(ctx, [[X(0), Y(0)], [X(s.r1), Y(0)]], { color: p.ink2, width: 2 });
      for (var gx = 0; gx <= s.r1; gx += 10) {
        ME.line(ctx, [[X(gx), Y(0)], [X(gx) - 5, Y(0) + 6]], { color: p.muted, width: 0.8 });
      }
      function link(a, b, color, wid) {
        ME.line(ctx, [[X(a.x), Y(a.y)], [X(b.x), Y(b.y)]], { color: color, width: wid || 4 });
      }
      link({ x: 0, y: 0 }, pos.A, p.tension, 4);
      link(pos.A, pos.B, p.accent, 4);
      link(pos.B, { x: s.r1, y: 0 }, p.compression, 4);
      // joints
      [[0, 0], [s.r1, 0], [pos.A.x, pos.A.y], [pos.B.x, pos.B.y]].forEach(function (q) {
        ME.dot(ctx, X(q[0]), Y(q[1]), 4, { fill: p.ink });
      });
      ME.label(ctx, "O₂", X(0) - 14, Y(0) + 12, { size: 10, color: p.ink2 });
      ME.label(ctx, "O₄", X(s.r1) + 5, Y(0) + 12, { size: 10, color: p.ink2 });
      ME.label(ctx, "A", X(pos.A.x) - 12, Y(pos.A.y) - 8, { size: 10, color: p.tension });
      ME.label(ctx, "B", X(pos.B.x) + 6, Y(pos.B.y) - 8, { size: 10, color: p.compression });

      // transmission angle at B
      var a1 = Math.atan2(pos.A.y - pos.B.y, pos.A.x - pos.B.x);
      var a2 = Math.atan2(-pos.B.y, s.r1 - pos.B.x);
      ctx.beginPath();
      ctx.arc(X(pos.B.x), Y(pos.B.y), 22, -a1, -a2, true);
      ctx.strokeStyle = p.ok; ctx.lineWidth = 1.4; ctx.stroke();
      ME.label(ctx, "μ=" + ME.fmt(pos.mu, 1) + "°", X(pos.B.x) + 14, Y(pos.B.y) + 18, { size: 10, color: p.ok });
      ME.label(ctx, "Grashof: " + (r.grashof ? "evet" : "hayır") + " (" + r.s + "+" + r.l + " ≤ " + r.p + "+" + r.q + ")",
        8, 14, { size: 10, color: r.grashof ? p.ok : p.bad });
    });
    if (!pos) {
      return { readout: ME.readout([["Krank açısı", ME.fmt(s.th, 0), "°"]]),
        status: "Bu açıda kapalı devre kurulamıyor; uzuv boyları veya açıyı değiştirin.", tone: "bad" };
    }
    return {
      readout: ME.readout([
        ["θ₃ (kuplör)", ME.fmt(pos.t3 * 180 / Math.PI, 1), "°"],
        ["θ₄ (sarkaç)", ME.fmt(pos.t4 * 180 / Math.PI, 1), "°"],
        ["μ (iletim)", ME.fmt(pos.mu, 1), "°"],
        ["ω₃/ω₂", ME.fmt(r.v.w3, 3), ""],
        ["ω₄/ω₂", ME.fmt(r.v.w4, 3), ""],
        ["Kapalılık hatası", ME.fmt(Math.hypot(Math.hypot(pos.B.x - pos.A.x, pos.B.y - pos.A.y) - s.r3,
          Math.hypot(pos.B.x - s.r1, pos.B.y) - s.r4), 6), "mm"]
      ]),
      status: "θ₂=" + ME.fmt(s.th, 1) + "° → θ₃=" + ME.fmt(pos.t3 * 180 / Math.PI, 1) +
        "°, θ₄=" + ME.fmt(pos.t4 * 180 / Math.PI, 1) + "°. İletim açısı μ=" + ME.fmt(pos.mu, 1) +
        "°; 40°–140° aralığı iyi, 0°/180°'ye yakın kötü. ω₄/ω₂=" + ME.fmt(r.v.w4, 3) + ".",
      aria: "Dört çubuk mekanizması; krank açısı " + ME.fmt(s.th, 0) + " derece, iletim açısı " + ME.fmt(pos.mu, 1) + " derece."
    };
  });

  ME.check("fourbar: Grashof 125<155", function () {
    var r = compute({ r1: 100, r2: 25, r3: 70, r4: 85, th: 60 });
    return r.grashof && r.s + r.l === 125 && r.p + r.q === 155;
  });
  ME.check("fourbar: transmission angle at 60 deg", function () {
    var r = compute({ r1: 100, r2: 25, r3: 70, r4: 85, th: 60 });
    return Math.abs(r.pos.mu - 70.358) < 0.05;
  });
  ME.check("fourbar: loop closure", function () {
    var s = { r1: 100, r2: 25, r3: 70, r4: 85, th: 60 }, r = compute(s), p = r.pos;
    return Math.abs(Math.hypot(p.B.x - p.A.x, p.B.y - p.A.y) - s.r3) < 1e-9 &&
      Math.abs(Math.hypot(p.B.x - s.r1, p.B.y) - s.r4) < 1e-9;
  });
  ME.check("fourbar: omega4/omega2", function () {
    var r = compute({ r1: 100, r2: 25, r3: 70, r4: 85, th: 60 });
    return Math.abs(r.v.w4 - 0.060977) < 1e-4;
  });
})();
