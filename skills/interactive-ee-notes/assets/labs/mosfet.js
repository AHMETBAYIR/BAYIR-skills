/* MOSFET lab: square-law regions, output family, load line, Q, gm/gds and CS gain. */
(function () {
  "use strict";
  if (!window.EE) return;
  var E = window.EE;

  /* kn in mA/V^2, currents in mA, voltages in V, lambda in 1/V. */
  function device(vgs, vds, vth, kn, lambda) {
    var vov = vgs - vth;
    var v = Math.max(0, vds);
    var lam = Math.max(0, lambda || 0);
    var out = { vov: vov, id: 0, id0: 0, gm: 0, gds: 0, region: "kesim" };
    if (vov <= 0) return out;
    if (v < vov) {
      out.region = "triyot";
      out.id = kn * (vov * v - 0.5 * v * v) * (1 + lam * v);
      out.gm = kn * v * (1 + lam * v);
      out.gds = kn * ((vov - v) * (1 + lam * v) + lam * (vov * v - 0.5 * v * v));
    } else {
      out.region = "doyum";
      out.id0 = 0.5 * kn * vov * vov;
      out.id = out.id0 * (1 + lam * v);
      out.gm = kn * vov * (1 + lam * v);
      out.gds = lam * out.id0;
    }
    return out;
  }

  /* Load-line intersection: vds = VDD - ID(vds) RD. */
  function solveQ(vgs, vth, kn, lambda, vdd, rd) {
    var lo = 0, hi = Math.max(vdd, 0), i, mid, f;
    for (i = 0; i < 70; i++) {
      mid = (lo + hi) / 2;
      f = mid + device(vgs, mid, vth, kn, lambda).id * rd - vdd;
      if (f > 0) hi = mid; else lo = mid;
    }
    var vq = (lo + hi) / 2;
    return { vds: vq, d: device(vgs, vq, vth, kn, lambda) };
  }

  function tr(v, digits) {
    return E.fmt(v, digits).replace(/\./g, ",");
  }

  E.registerLab("mosfet", function (s, el) {
    var p = E.palette();
    var vgs = s.vgs, vds = s.vds, vth = s.vth, kn = s.kn;
    var lam = s.lam, vdd = s.vdd, rd = s.rd;
    var q = solveQ(vgs, vth, kn, lam, vdd, rd);
    var d = q.d;
    var ro = d.gds > 0 ? 1 / d.gds : Infinity;
    var par = isFinite(ro) ? (rd * ro) / (rd + ro) : rd;
    var av = d.region === "doyum" ? -d.gm * par : null;
    var probe = device(vgs, vds, vth, kn, lam);
    var kvl = vds + probe.id * rd - vdd;

    E.canvas(el, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var fam = [vth + 0.5, vth + 1, vth + 1.5, vth + 2];
      if (vgs > vth) fam.push(vgs);
      fam.sort(function (a, b) { return a - b; });
      fam = fam.filter(function (v, i) { return i === 0 || Math.abs(v - fam[i - 1]) > 0.04; });
      var maxId = 0;
      fam.forEach(function (vg) {
        maxId = Math.max(maxId, device(vg, vdd, vth, kn, lam).id);
      });
      var rough = Math.max(1, 1.12 * Math.max(vdd / rd, maxId, d.id));
      var ystep = rough <= 2 ? 0.2 : rough <= 5 ? 1 : rough <= 12 ? 2 : rough <= 30 ? 5 : 10;
      var ymax = Math.ceil(rough / ystep) * ystep;
      var yticks = [];
      for (var yv = 0; yv <= ymax + 1e-9; yv += ystep) {
        yticks.push({ v: yv, label: tr(yv, ystep < 1 ? 1 : 0) });
      }
      var ax = E.axes(ctx, { x: 0, y: 0, w: w, h: h }, {
        xmin: 0, xmax: vdd, ymin: 0, ymax: ymax,
        xlabel: "V_DS (V)", ylabel: "I_D (mA)",
        nx: 4, yticks: yticks, xdigits: 1, ydigits: 1,
        padLeft: 44, padBottom: 29
      });

      var boundary = [];
      fam.forEach(function (vg) {
        var vov = vg - vth;
        if (vov > 0 && vov <= vdd) {
          boundary.push([ax.sx(vov), ax.sy(device(vg, vov, vth, kn, lam).id)]);
        }
      });
      if (boundary.length > 1) {
        E.line(ctx, boundary, { color: p.muted, width: 1, dash: [4, 4] });
      }

      fam.forEach(function (vg) {
        var pts = [], i, v;
        for (i = 0; i <= 80; i++) {
          v = vdd * i / 80;
          pts.push([ax.sx(v), ax.sy(device(vg, v, vth, kn, lam).id)]);
        }
        var current = Math.abs(vg - vgs) < 0.04;
        E.line(ctx, pts, {
          color: current ? p.accent : p.blue,
          width: current ? 2.2 : 1.15
        });
        if (current) {
          E.label(ctx, "V_GS=" + tr(vg, 1), ax.sx(vdd) - 4, ax.sy(device(vg, vdd, vth, kn, lam).id) - 7,
            { align: "right", size: 9, color: p.accent });
        }
      });

      E.line(ctx, [[ax.sx(0), ax.sy(vdd / rd)], [ax.sx(vdd), ax.sy(0)]],
        { color: p.amber, width: 2 });
      E.label(ctx, "yük çizgisi", ax.sx(vdd * 0.3), ax.sy((vdd - vdd * 0.3) / rd) - 8,
        { size: 9, color: p.amber });

      if (vds >= 0 && vds <= vdd) {
        ctx.save();
        ctx.strokeStyle = p.muted; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(ax.sx(vds), ax.plot.y); ctx.lineTo(ax.sx(vds), ax.plot.y + ax.plot.h); ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.beginPath(); ctx.arc(ax.sx(vds), ax.sy(probe.id), 3.2, 0, Math.PI * 2);
        ctx.fillStyle = p.sheet; ctx.fill();
        ctx.strokeStyle = p.ink2; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.restore();
        E.label(ctx, "prob", ax.sx(vds) - 6, ax.sy(probe.id) + 15,
          { align: "right", size: 8.5, color: p.ink2 });
      }

      var qc = d.region === "doyum" ? p.green : p.red;
      E.dot(ctx, ax.sx(E.clamp(q.vds, 0, vdd)), ax.sy(E.clamp(d.id, 0, ymax)), 4.4, { fill: qc });
      E.label(ctx, "Q", ax.sx(E.clamp(q.vds, 0, vdd)) + 6, ax.sy(E.clamp(d.id, 0, ymax)) - 12,
        { size: 11, color: qc });

      if (boundary.length > 1) {
        E.label(ctx, "V_DS = V_GS − V_th", ax.plot.x + 6, ax.plot.y + 12,
          { size: 8.5, color: p.muted });
      }
    });

    var status;
    if (d.region === "kesim") {
      status = "Kesim: V_GS = " + tr(vgs, 2) + " V < V_th = " + tr(vth, 2) +
        " V. I_D ≈ 0; V_DS = V_DD. Kapıyı eşiğin üstüne çıkarın.";
    } else if (d.region === "triyot") {
      status = "Q triyotta: V_DS = " + tr(q.vds, 2) + " V < V_OV = " + tr(d.vov, 2) +
        " V. Kanal kesintisiz; cihaz direnç gibi davranır. CS kazancı için R_D'yi küçültün veya V_DD'yi artırın.";
    } else {
      status = "Q doyumda: V_OV = " + tr(d.vov, 2) + " V, I_D = " + tr(d.id, 2) +
        " mA, V_DS = " + tr(q.vds, 2) + " V. g_m = " + tr(d.gm, 2) +
        " mS, r_o = " + (isFinite(ro) ? tr(ro, 1) + " kΩ" : "∞") +
        "; R_D ile |A_v| = " + tr(Math.abs(av), 2) + ". R_D büyürse yük çizgisi dikleşir ve Q triyota kayabilir.";
    }

    return {
      readout: E.readout([
        ["V_OV", tr(d.vov, 2), "V"],
        ["Bölge", d.region, ""],
        ["I_D (Q)", tr(d.id, 2), "mA"],
        ["V_DS (Q)", tr(q.vds, 2), "V"],
        ["g_m", tr(d.gm, 2), "mS"],
        ["g_ds", tr(d.gds, 3), "mS"],
        ["r_o", isFinite(ro) ? tr(ro, 1) : "∞", "kΩ"],
        ["A_v", av === null ? "—" : tr(av, 2), ""],
        ["KVL (prob)", tr(kvl, 2), "V"]
      ]),
      status: status,
      tone: d.region === "doyum" ? "ok" : "bad",
      aria: "MOSFET Q noktası " + d.region + " bölgesinde: I_D " + tr(d.id, 2) +
        " miliamper, V_DS " + tr(q.vds, 2) + " volt, g_m " + tr(d.gm, 2) + " milisiemens.",
      print: "Q: I_D = " + tr(d.id, 2) + " mA, V_DS = " + tr(q.vds, 2) + " V, bölge = " +
        d.region + "; g_m = " + tr(d.gm, 2) + " mS, r_o = " +
        (isFinite(ro) ? tr(ro, 1) + " kΩ" : "∞") + ", A_v = " +
        (av === null ? "—" : tr(av, 2)) + "."
    };
  });

  E.check("mosfet: Vgs=3, Vds=3, Vth=1, kn=1, lambda=0 -> Id=2.00 mA", function () {
    return Math.abs(device(3, 3, 1, 1, 0).id - 2) < 1e-9;
  });
  E.check("mosfet: boundary Vds=2 V; Vds=1 V -> Id=1.50 mA", function () {
    var b = device(3, 2, 1, 1, 0);
    var t = device(3, 1, 1, 1, 0);
    return Math.abs(b.vov - 2) < 1e-12 && Math.abs(t.id - 1.5) < 1e-9;
  });
  E.check("mosfet: lambda=0.02, Vds=3 -> Id=2.12 mA (not 2.20)", function () {
    var id = device(3, 3, 1, 1, 0.02).id;
    return Math.abs(id - 2.12) < 1e-9 && Math.abs(id - 2.2) > 0.05;
  });
})();
