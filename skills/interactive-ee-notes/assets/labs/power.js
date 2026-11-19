/* Buck / boost CCM-DCM teaching lab.
   Design point: 12 V -> 5 V, 0.5 A, 100 kHz, 22 uH.
   Note: the brief's 11 uH at 100 kHz gives 2.652 A ripple; 22 uH gives the
   required 1.326 A. The pair 11 uH / 200 kHz is numerically equivalent. */
(function () {
  "use strict";
  if (!window.EE) return;
  var E = window.EE;

  function compute(s) {
    var mode = s.mode === "boost" ? "boost" : "buck";
    var vin = s.vin, vout = s.vout, iout = s.iout;
    var f = s.f * 1e3, L = s.L * 1e-6;
    var Lf = L * f;
    var valid = mode === "buck" ? vout < vin : vout > vin;
    if (!valid) {
      return {
        valid: false, mode: mode, vin: vin, vout: vout, iout: iout,
        f: f, L: L, dccm: 0, d: 0, ripple: 0, boundary: 0,
        ilavg: 0, ccm: false, peak: 0, valley: 0, d2: 0,
        pout: vout * iout,
        why: mode === "buck" ? "Buck için V_out < V_in olmalı." :
          "Boost için V_out > V_in olmalı."
      };
    }
    var dccm = mode === "buck" ? vout / vin : 1 - vin / vout;
    var ripple = mode === "buck"
      ? (vin - vout) * dccm / Lf
      : vin * dccm / Lf;
    var ilavgCcm = mode === "buck" ? iout : iout / (1 - dccm);
    var boundary = mode === "buck" ? ripple / 2 : (1 - dccm) * ripple / 2;
    var ccm = ilavgCcm >= ripple / 2;
    var d = dccm, d2 = 1 - d, peak, valley, ilavg;

    if (ccm) {
      ilavg = ilavgCcm;
      peak = ilavg + ripple / 2;
      valley = ilavg - ripple / 2;
    } else {
      if (mode === "buck") {
        d = Math.sqrt(2 * iout * Lf * vout / ((vin - vout) * vin));
        d2 = d * (vin - vout) / vout;
        peak = (vin - vout) * d / Lf;
        ilavg = iout;
      } else {
        d = Math.sqrt(2 * iout * Lf * (vout - vin)) / vin;
        d2 = vin * d / (vout - vin);
        peak = vin * d / Lf;
        ilavg = iout * (d + d2) / d2;
      }
      valley = 0;
    }
    return {
      valid: true, mode: mode, vin: vin, vout: vout, iout: iout,
      f: f, L: L, dccm: dccm, d: d, ripple: ripple, boundary: boundary,
      ilavg: ilavg, ccm: ccm, peak: peak, valley: valley, d2: d2,
      pout: vout * iout, why: ""
    };
  }

  function drawWave(ctx, ax, r, p) {
    var i, pts = [];
    if (r.ccm) {
      pts = [[0, r.valley], [r.d, r.peak], [1, r.valley],
        [1 + r.d, r.peak], [2, r.valley]];
    } else {
      pts = [[0, 0], [r.d, r.peak], [r.d + r.d2, 0], [1, 0],
        [1 + r.d, r.peak], [1 + r.d + r.d2, 0], [2, 0]];
    }
    E.line(ctx, pts.map(function (q) { return [ax.sx(q[0]), ax.sy(q[1])]; }),
      { color: p.blue, width: 2 });
    E.dash(ctx, ax.sx(0), ax.sy(r.ilavg), ax.sx(2), ax.sy(r.ilavg),
      { color: p.muted, dash: [4, 4] });
    E.label(ctx, "I_L,ort", ax.plot.x + 5, ax.sy(r.ilavg) - 9,
      { size: 9, color: p.muted });
    E.dot(ctx, ax.sx(r.d), ax.sy(r.peak), 2.8, { fill: p.accent });
    E.label(ctx, "I_tepe", ax.sx(r.d) + 4, ax.sy(r.peak) - 9,
      { size: 9, color: p.accent });
    for (i = 0; i < 2; i++) {
      E.dash(ctx, ax.sx(i + r.d), ax.plot.y, ax.sx(i + r.d),
        ax.plot.y + ax.plot.h, { color: p.rule, dash: [3, 3] });
      if (!r.ccm) {
        E.dash(ctx, ax.sx(i + r.d + r.d2), ax.plot.y,
          ax.sx(i + r.d + r.d2), ax.plot.y + ax.plot.h,
          { color: p.rule, dash: [3, 3] });
      }
    }
    E.label(ctx, "D", ax.sx(r.d) + 3, ax.plot.y + 8,
      { size: 9, color: p.muted });
  }

  function drawSwitch(ctx, ax, r, p) {
    var pts, vin = r.vin, vout = r.vout, d = r.d, d2 = r.d2;
    if (r.mode === "buck") {
      if (r.ccm) {
        pts = [[0, vin], [d, vin], [d, 0], [1, 0],
          [1, vin], [1 + d, vin], [1 + d, 0], [2, 0]];
      } else {
        pts = [[0, vin], [d, vin], [d, 0], [d + d2, 0],
          [d + d2, vout], [1, vout], [1, vin], [1 + d, vin], [1 + d, 0],
          [1 + d + d2, 0], [1 + d + d2, vout], [2, vout]];
      }
    } else {
      if (r.ccm) {
        pts = [[0, 0], [d, 0], [d, vout], [1, vout],
          [1, 0], [1 + d, 0], [1 + d, vout], [2, vout]];
      } else {
        pts = [[0, 0], [d, 0], [d, vout], [d + d2, vout],
          [d + d2, vin], [1, vin], [1, 0], [1 + d, 0], [1 + d, vout],
          [1 + d + d2, vout], [1 + d + d2, vin], [2, vin]];
      }
    }
    E.line(ctx, pts.map(function (q) { return [ax.sx(q[0]), ax.sy(q[1])]; }),
      { color: p.accent, width: 2 });
  }

  E.registerLab("power", function (s, el) {
    var p = E.palette();
    var r = compute(s);
    var unit = "—";

    E.canvas(el, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      if (!r.valid) {
        E.label(ctx, r.why, w / 2, h / 2, {
          align: "center", size: 12, color: p.bad
        });
        E.label(ctx, "V_in ve V_out değerlerini değiştirin.", w / 2, h / 2 + 20,
          { align: "center", size: 10, color: p.muted });
        return;
      }
      var topH = Math.round((h - 14) * 0.56);
      var botY = topH + 12;
      var botH = h - botY - 2;
      var yMaxI = Math.max(r.peak * 1.18, 0.2);
      var yMaxV = Math.max(r.vin, r.vout) * 1.16;

      var axI = E.axes(ctx, { x: 0, y: 0, w: w, h: topH }, {
        xmin: 0, xmax: 2, ymin: 0, ymax: yMaxI,
        ylabel: "i_L (A)", xlabel: "", ny: 4, ydigits: 2,
        xticks: [{ v: 0, label: "0" }, { v: 1, label: "1" },
          { v: 2, label: "2" }],
        padLeft: 44, padBottom: 16
      });
      drawWave(ctx, axI, r, p);

      var axV = E.axes(ctx, { x: 0, y: botY, w: w, h: botH }, {
        xmin: 0, xmax: 2, ymin: 0, ymax: yMaxV,
        ylabel: "v_sw (V)", xlabel: "t / T_s",
        yticks: [{ v: 0, label: "0" },
          { v: Math.min(r.vin, r.vout), label: E.fmt(Math.min(r.vin, r.vout), 0) },
          { v: Math.max(r.vin, r.vout), label: E.fmt(Math.max(r.vin, r.vout), 0) }],
        xticks: [{ v: 0, label: "0" }, { v: 1, label: "1" },
          { v: 2, label: "2" }],
        padLeft: 52, padBottom: 26
      });
      drawSwitch(ctx, axV, r, p);
    });

    if (!r.valid) {
      return {
        readout: E.readout([
          ["D (CCM)", unit], ["D (çalışma)", unit], ["ΔI_L", unit],
          ["Bölge", unit], ["I_tepe", unit], ["P_out", unit]
        ]),
        status: r.why + " Mevcut: V_in = " + E.fmt(r.vin, 2) +
          " V, V_out = " + E.fmt(r.vout, 2) + " V.",
        tone: "bad",
        aria: r.why,
        print: "Geçersiz çalışma noktası: " + r.why
      };
    }

    var state = r.ccm ? "CCM" : "DCM";
    var status;
    if (r.mode === "buck") {
      status = "D_CCM = " + E.fmt(r.dccm, 3) + "; ΔI_L(CCM) = " +
        E.fmt(r.ripple, 3) + " A, sınır I_out = " + E.fmt(r.boundary, 3) +
        " A. I_out = " + E.fmt(r.iout, 2) + " A, I_L,ort = " +
        E.fmt(r.ilavg, 2) + " A. " +
        (r.ccm
          ? "I_L,ort > ΔI_L/2 olduğu için CCM; I_tepe = I_out + ΔI_L/2."
          : "I_out < sınır olduğu için DCM; V_out'u tutmak için gereken D = " +
            E.fmt(r.d, 3) + ", CCM formülünden küçük. D_CCM uygulanırsa çıkış " +
            "hedefin üstüne çıkar.");
    } else {
      status = "D_CCM = " + E.fmt(r.dccm, 3) + "; ΔI_L(CCM) = " +
        E.fmt(r.ripple, 3) + " A. Boost'ta I_L,ort = I_out/(1−D) = " +
        E.fmt(r.ilavg, 2) + " A; sınır I_out = (1−D)ΔI_L/2 = " +
        E.fmt(r.boundary, 3) + " A. " +
        (r.ccm
          ? "I_L,ort > ΔI_L/2 olduğu için CCM; I_tepe = I_L,ort + ΔI_L/2."
          : "I_L,ort < ΔI_L/2 olduğu için DCM; D = " + E.fmt(r.d, 3) + ".");
    }

    return {
      readout: E.readout([
        ["D (CCM)", E.fmt(r.dccm, 3)],
        ["D (çalışma)", E.fmt(r.d, 3)],
        ["ΔI_L (CCM)", E.fmt(r.ripple, 3), "A"],
        ["I_L,ort", E.fmt(r.ilavg, 3), "A"],
        ["CCM sınırı (I_out)", E.fmt(r.boundary, 3), "A"],
        ["Bölge", state],
        ["I_tepe", E.fmt(r.peak, 3), "A"],
        ["P_out", E.fmt(r.pout, 2), "W"]
      ]),
      status: status,
      tone: Math.abs(r.iout - r.boundary) / r.boundary < 0.04 ? "ok" : "",
      aria: (r.mode === "buck" ? "Buck" : "Boost") + " çevirici, " +
        E.fmt(r.vin, 1) + " volt giriş, " + E.fmt(r.vout, 1) +
        " volt çıkış: CCM görev oranı " + E.fmt(r.dccm, 3) + ", çalışma " +
        "görev oranı " + E.fmt(r.d, 3) + ", indüktör " +
        "dalgalılığı " + E.fmt(r.ripple, 3) + " amper, " + state +
        " bölgesi, tepe akım " + E.fmt(r.peak, 3) + " amper.",
      print: (r.mode === "buck" ? "Buck" : "Boost") + " " +
        E.fmt(r.vin, 0) + " V → " + E.fmt(r.vout, 0) + " V, I_out = " +
        E.fmt(r.iout, 2) + " A: D_CCM = " + E.fmt(r.dccm, 3) +
        ", ΔI_L(CCM) = " + E.fmt(r.ripple, 3) + " A, CCM sınırı = " +
        E.fmt(r.boundary, 3) + " A; bölge " + state + ", I_tepe = " +
        E.fmt(r.peak, 3) + " A, P_out = " + E.fmt(r.pout, 2) + " W."
    };
  });

  E.check("power: buck 12->5 D = 0.4167", function () {
    var r = compute({ mode: "buck", vin: 12, vout: 5, iout: 0.5, f: 100, L: 22 });
    return Math.abs(r.dccm - 5 / 12) < 1e-9;
  });
  E.check("power: buck ripple 1.326 A, boundary 0.663 A", function () {
    var r = compute({ mode: "buck", vin: 12, vout: 5, iout: 0.5, f: 100, L: 22 });
    return Math.abs(r.ripple - 1.325757576) < 1e-6 &&
      Math.abs(r.boundary - 0.662878788) < 1e-6;
  });
  E.check("power: boost 5->12 D = 0.5833, CCM, Pout = 6 W", function () {
    var r = compute({ mode: "boost", vin: 5, vout: 12, iout: 0.5, f: 100, L: 22 });
    return Math.abs(r.dccm - 7 / 12) < 1e-9 && r.ccm === true &&
      Math.abs(r.pout - 6) < 1e-9;
  });
})();
