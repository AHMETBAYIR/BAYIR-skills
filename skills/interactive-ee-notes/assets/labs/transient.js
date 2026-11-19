/* First-order RC transient lab: charging curve, time constant, energy. */
(function () {
  "use strict";
  if (!window.EE) return;
  var E = window.EE;

  function circuit(ctx, x, y, w, h, s) {
    var p = E.palette();
    var top = y + 30, bot = y + h - 28, left = x + 36, right = x + w - 34;
    var rEnd = x + w * 0.56;
    E.wire(ctx, left, top, left + 10, top);
    E.wire(ctx, left + 22, top, rEnd, top);
    E.wire(ctx, rEnd, top, right, top);
    E.wire(ctx, right, top, right, bot);
    E.wire(ctx, left, bot, right, bot);
    E.wire(ctx, left, top, left, bot);
    E.sourceV(ctx, left, (top + bot) / 2, 17, "V_s", E.fmt(s.vs, 1) + " V", false);
    E.resistorH(ctx, left + 32, top, rEnd - left - 40, "R", E.fmt(s.r, 1) + " kΩ");
    // switch gap near the source
    E.line(ctx, [[left + 10, top], [left + 20, top - 9]], { color: p.ink, width: 1.5 });
    E.label(ctx, "S (t=0)", left + 8, top - 20, { size: 9.5, color: p.muted });
    E.capacitorV(ctx, right, top, "C", E.fmt(s.c, 2) + " µF");
    E.junction(ctx, right, top);
    E.ground(ctx, (left + right) / 2, bot);
    E.label(ctx, "v_C", right - 4, top + 34, { align: "right", size: 10, color: p.accent });
    E.arrow(ctx, right - 22, top + 22, right - 22, top + 42, { color: p.accent, width: 1.1 });
  }

  E.registerLab("transient", function (s, el) {
    var p = E.palette();
    var st = {
      vs: s.vs === undefined ? 10 : s.vs,
      r: s.r === undefined ? 1 : s.r,
      c: s.c === undefined ? 1 : s.c,
      t: s.t === undefined ? 1 : s.t
    };
    var R = st.r * 1000, C = st.c * 1e-6;
    var tau = R * C; // seconds
    var tauMs = tau * 1000;
    var tMs = st.t;
    var t = tMs / 1000;
    var vC = st.vs * (1 - Math.exp(-t / tau));
    var i = st.vs / R * Math.exp(-t / tau);
    var energy = 0.5 * C * st.vs * st.vs; // joules
    var frac = vC / st.vs;
    var nearTau = Math.abs(tMs / tauMs - 1) < 0.05;

    E.canvas(el, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var box;
      if (w < 560) {
        var topH = Math.round(h * 0.44);
        circuit(ctx, 4, 4, w - 8, topH, st);
        box = { x: 8, y: topH + 4, w: w - 16, h: h - topH - 10 };
      } else {
        var leftW = Math.max(135, Math.min(w * 0.43, 225));
        circuit(ctx, 4, 4, leftW - 8, h - 8, st);
        box = { x: leftW + 2, y: 10, w: w - leftW - 12, h: h - 18 };
      }

      var ax = E.axes(ctx, box, {
        xmin: 0, xmax: 5 * tauMs, ymin: 0, ymax: st.vs * 1.05,
        xlabel: "t (ms)", ylabel: "v_C (V)",
        nx: 5, ny: 4, xdigits: 1, ydigits: 1,
        padLeft: 38, padBottom: 27
      });

      var pts = [];
      var i, tt, vv;
      for (i = 0; i <= 160; i++) {
        tt = 5 * tauMs * i / 160;
        vv = st.vs * (1 - Math.exp(-(tt / 1000) / tau));
        pts.push([ax.sx(tt), ax.sy(vv)]);
      }
      E.line(ctx, pts, { color: p.blue, width: 2 });

      E.dash(ctx, ax.sx(tauMs), ax.plot.y, ax.sx(tauMs), ax.plot.y + ax.plot.h, { color: p.muted });
      E.label(ctx, "τ", ax.sx(tauMs) + 3, ax.plot.y + 12, { size: 10, color: p.muted });
      E.dash(ctx, ax.plot.x, ax.sy(0.632 * st.vs), ax.plot.x + ax.plot.w, ax.sy(0.632 * st.vs),
        { color: p.muted, dash: [3, 4] });
      E.label(ctx, "0.632 V_s", ax.plot.x + 4, ax.sy(0.632 * st.vs) - 8, { size: 9.5, color: p.muted });

      var xp = ax.sx(tMs), yp = ax.sy(vC);
      E.dot(ctx, xp, yp, 4, { fill: nearTau ? p.ok : p.accent });
      E.label(ctx, "v_C(t)", xp + 6, yp - 9, { size: 10, color: nearTau ? p.ok : p.accent });
    });

    var state;
    if (tMs < 0.2 * tauMs) state = "Başlangıçta kapasitör kısa devre gibi davranır; akım en büyük, gerilim sıfıra yakın.";
    else if (nearTau) state = "τ = RC anında gerilim kaynağın %63,2'sine ulaşır; akım %36,8'ine düşer.";
    else if (tMs < 4 * tauMs) state = "Geçici rejimdesin: üstel eğri, her τ'de kalan farkın %63,2'sini kapatır.";
    else state = "5τ sonrası kararlı hâle %99,3 yaklaşıldı; kapasitör artık açık devre gibi davranır.";

    return {
      readout: E.readout([
        ["τ = RC", E.fmt(tauMs, 3), "ms"],
        ["v_C(t)", E.fmt(vC, 3), "V"],
        ["i(t)", E.fmt(i * 1000, 3), "mA"],
        ["v_C/V_s", E.fmt(frac * 100, 1), "%"],
        ["E_C", E.fmt(energy * 1000, 3), "mJ"],
        ["5τ", E.fmt(5 * tauMs, 2), "ms"]
      ]),
      status: "t = " + E.fmt(tMs, 2) + " ms (" + E.fmt(tMs / tauMs, 2) + "τ): v_C = " +
        E.fmt(vC, 3) + " V, i = " + E.fmt(i * 1000, 3) + " mA. " + state,
      tone: nearTau ? "ok" : "",
      aria: "RC şarj devresi: zaman sabiti " + E.fmt(tauMs, 3) + " milisaniye, " +
        E.fmt(tMs, 2) + " milisaniyede kapasitör gerilimi " + E.fmt(vC, 3) + " volt.",
      print: "τ = RC = " + E.fmt(tauMs, 3) + " ms; t = " + E.fmt(tMs, 2) + " ms için v_C = " +
        E.fmt(vC, 3) + " V, i = " + E.fmt(i * 1000, 3) + " mA; v_C(τ) = 0,632 V_s."
    };
  });

  E.check("transient: tau = 1 ms for 1k and 1uF", function () {
    return Math.abs(1000 * 1e-6 - 1e-3) < 1e-15;
  });
  E.check("transient: v(tau) = 0.6321 Vs", function () {
    return Math.abs((1 - Math.exp(-1)) - 0.6321205588) < 1e-9;
  });
  E.check("transient: v(5tau) = 0.9933 Vs", function () {
    return Math.abs((1 - Math.exp(-5)) - 0.9932620530) < 1e-9;
  });
})();
