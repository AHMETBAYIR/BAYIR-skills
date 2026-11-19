/* DFT / windowing lab: time samples, magnitude spectrum, leakage, Parseval. */
(function () {
  "use strict";
  if (!window.EE) return;
  var E = window.EE;
  var FS = 1000;

  function dft(xr) {
    var N = xr.length, re = [], im = [], k, n, a;
    for (k = 0; k < N; k++) {
      re[k] = 0; im[k] = 0;
      for (n = 0; n < N; n++) {
        a = -2 * Math.PI * k * n / N;
        re[k] += xr[n] * Math.cos(a);
        im[k] += xr[n] * Math.sin(a);
      }
    }
    return { re: re, im: im };
  }

  function makeWindow(kind, N) {
    var w = [], n;
    for (n = 0; n < N; n++) {
      w[n] = kind === "hann" ? 0.5 * (1 - Math.cos(2 * Math.PI * n / N)) : 1;
    }
    return w;
  }

  function compute(s) {
    var N = parseInt(s.n, 10) || 32;
    var f0 = parseFloat(s.f0) || 125;
    var A = parseFloat(s.amp);
    if (!isFinite(A)) A = 1;
    var kind = s.window === "hann" ? "hann" : "rect";
    var w = makeWindow(kind, N);
    var x = [], xw = [], n, k;
    for (n = 0; n < N; n++) {
      x[n] = A * Math.cos(2 * Math.PI * f0 * n / FS);
      xw[n] = x[n] * w[n];
    }

    var X = dft(xw);
    var mag = [], total = 0, kp = 0;
    for (k = 0; k < N; k++) {
      mag[k] = Math.sqrt(X.re[k] * X.re[k] + X.im[k] * X.im[k]);
      total += mag[k] * mag[k];
      if (k <= N / 2 && mag[k] > mag[kp]) kp = k;
    }

    var mainHalf = kind === "hann" ? 2 : 1;
    var peak = mag[kp];
    var inside = 0, side = 0;
    for (k = 0; k <= N / 2; k++) {
      var mult = (k === 0 || k === N / 2) ? 1 : 2;
      if (Math.abs(k - kp) <= mainHalf) inside += mult * mag[k] * mag[k];
      else if (mag[k] > side) side = mag[k];
    }

    var leakage = total > 0 ? 1 - inside / total : 0;
    var sideDb = peak > 0 ? 20 * Math.log10(side / peak) : -Infinity;
    if (!isFinite(sideDb) || sideDb < -120) sideDb = -120;

    var cg = 0;
    for (n = 0; n < N; n++) cg += w[n];
    cg /= N;

    var energy = 0;
    for (n = 0; n < N; n++) energy += xw[n] * xw[n];

    return {
      N: N, f0: f0, A: A, kind: kind, x: x, mag: mag, kp: kp,
      df: FS / N, peakFreq: kp * FS / N,
      leakage: leakage, sideDb: sideDb, mainBins: 2 * mainHalf,
      ampEst: peak > 0 ? 2 * peak / (N * cg) : 0,
      parse: energy / ((1 / N) * total), total: total, cg: cg
    };
  }

  E.registerLab("dft", function (s, el) {
    var p = E.palette();
    var r = compute(s);

    E.canvas(el, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var topH = Math.round(h * 0.42);
      var ax1 = E.axes(ctx, { x: 0, y: 0, w: w, h: topH }, {
        xmin: 0, xmax: r.N / FS * 1000, ymin: -2.6, ymax: 2.6,
        xlabel: "t (ms)", ylabel: "x[n]", nx: 4, ny: 4,
        xdigits: 0, ydigits: 1, padLeft: 38, padBottom: 24, padTop: 6
      });

      var curve = [], i;
      for (i = 0; i <= 200; i++) {
        var t = (r.N / FS) * i / 200;
        curve.push([ax1.sx(t * 1000), ax1.sy(r.A * Math.cos(2 * Math.PI * r.f0 * t))]);
      }
      E.line(ctx, curve, { color: p.muted, width: 1, dash: [4, 3] });

      for (i = 0; i < r.N; i++) {
        var x = ax1.sx(i / FS * 1000), y = ax1.sy(r.x[i]);
        E.dash(ctx, x, ax1.sy(0), x, y, { color: p.rule, width: 0.8, dash: [2, 3] });
        E.dot(ctx, x, y, r.N > 64 ? 1.7 : 2.5, { fill: p.blue, stroke: p.sheet });
      }
      E.label(ctx, "N = " + r.N + " · A = " + E.fmt(r.A, 1),
        ax1.plot.x + 6, ax1.plot.y + 9, { size: 10, color: p.ink2 });

      var ax2 = E.axes(ctx, { x: 0, y: topH, w: w, h: h - topH }, {
        xmin: 0, xmax: FS / 2, ymin: -80, ymax: 5,
        xlabel: "f (Hz)", ylabel: "|X| (dB)",
        xticks: [
          { v: 0, label: "0" }, { v: 125, label: "125" },
          { v: 250, label: "250" }, { v: 375, label: "375" },
          { v: 500, label: "500" }
        ],
        yticks: [
          { v: -80, label: "-80" }, { v: -60, label: "-60" },
          { v: -40, label: "-40" }, { v: -20, label: "-20" },
          { v: 0, label: "0" }
        ],
        padLeft: 40, padBottom: 26, padTop: 8
      });

      var floorDb = -80;
      for (i = 0; i <= r.N / 2; i++) {
        var db = 20 * Math.log10(Math.max(r.mag[i], 1e-12) / Math.max(r.mag[r.kp], 1e-12));
        if (db < floorDb) db = floorDb;
        var x2 = ax2.sx(i * FS / r.N);
        E.line(ctx, [[x2, ax2.sy(floorDb)], [x2, ax2.sy(db)]],
          { color: i === r.kp ? p.accent : p.blue, width: i === r.kp ? 2 : 1.1 });
        if (i === r.kp) E.dot(ctx, x2, ax2.sy(0), 3, { fill: p.accent });
      }
      E.label(ctx, "Δf = " + E.fmt(r.df, 2) + " Hz · tepe k = " + r.kp,
        ax2.plot.x + 6, ax2.plot.y + 9, { size: 10, color: p.ink2 });
    });

    var leakPct = 100 * r.leakage;
    var binPos = r.f0 / r.df;
    var sideText = r.sideDb <= -119.9 ? "< -120" : E.fmt(r.sideDb, 1);
    var rect = r.kind === "hann" ? compute({
      n: r.N, f0: r.f0, window: "rect", amp: r.A
    }) : r;

    var status;
    if (r.kind === "rect" && Math.abs(binPos - Math.round(binPos)) < 1e-9) {
      status = "f0 = " + E.fmt(r.f0, 0) + " Hz tam bin " + r.kp +
        " üzerinde; dikdörtgen pencerede spektrum tek çizgi, sızıntı %" +
        E.fmt(leakPct, 2) + ". Bin aralığı Δf = fs/N = " + E.fmt(r.df, 4) +
        " Hz; N büyürse Δf küçülür, kayıt süresi T = N/fs uzar.";
    } else if (r.kind === "rect") {
      if (leakPct < 1) {
        status = "f0 = " + E.fmt(r.f0, 0) + " Hz, Δf = " + E.fmt(r.df, 4) +
          " Hz gridinde k = " + E.fmt(binPos, 2) + "; bin'e çok yakın. Ana lob dışı sızıntı yalnızca %" +
          E.fmt(leakPct, 2) + ". N büyüdükçe Δf küçülür ve 110 Hz grid'e yaklaşır; bu, zero-padding değil, daha uzun kayıt T = N/fs demektir.";
      } else {
        status = "f0 = " + E.fmt(r.f0, 0) + " Hz, Δf = " + E.fmt(r.df, 4) +
          " Hz gridinde k = " + E.fmt(binPos, 2) + "; tam bin değil. Enerji komşu binlere sızar (ana lob dışı %" +
          E.fmt(leakPct, 2) + "), bu yüzden 110 Hz'de tek başına bir çizgi görünmez. Hann ana lobu 2 bitten 4 bine genişletir, yan lobu düşürür.";
      }
    } else if (r.sideDb <= -119.9 && rect.sideDb <= -119.9) {
      status = "Hann penceresi: ana lob " + r.mainBins + " bin (dikdörtgen " +
        rect.mainBins + " bin), tutarlı kazanç 0,5. Bin merkezli ton olduğu için her iki pencerede yan lob -120 dB tabanının altında; burada ayırt edici etki ana lobun iki kat genişlemesidir.";
    } else {
      status = "Hann penceresi: ana lob " + r.mainBins + " bin (dikdörtgen " +
        rect.mainBins + " bin), yan lob " + E.fmt(r.sideDb, 1) + " dB (dikdörtgen " +
        E.fmt(rect.sideDb, 1) + " dB). Ana lob genişlediği için yakın tonlar daha kolay birleşir; buna karşılık uzak sızıntı azalır. Tutarlı kazanç 0,5.";
    }

    return {
      readout: E.readout([
        ["N", String(r.N), "örnek"],
        ["Δf = fs/N", E.fmt(r.df, 4), "Hz"],
        ["f0", E.fmt(r.f0, 0), "Hz"],
        ["Bin konumu", E.fmt(binPos, 2), "bin"],
        ["Tepe bin", "k = " + r.kp + " @ " + E.fmt(r.peakFreq, 4), "Hz"],
        ["Ana lob", String(r.mainBins), "bin"],
        ["Sızıntı (ana lob dışı)", E.fmt(leakPct, 2), "%"],
        ["Yan lob", sideText, "dB"],
        ["Genlik kestirimi", E.fmt(r.ampEst, 3), "birim"],
        ["Parseval oranı", r.parse.toFixed(6), ""]
      ]),
      status: status,
      tone: (r.leakage < 0.05 ? "ok" : "bad"),
      aria: "N = " + r.N + ", fs = 1000 hertz, f0 = " + E.fmt(r.f0, 0) +
        " hertz; bin aralığı " + E.fmt(r.df, 4) + " hertz, tepe bin " + r.kp +
        ", sızıntı yüzde " + E.fmt(leakPct, 2) + ", Parseval oranı " + r.parse.toFixed(6) + ".",
      print: "N = " + r.N + ", fs = 1 kHz, f0 = " + E.fmt(r.f0, 0) + " Hz: Δf = " +
        E.fmt(r.df, 4) + " Hz, tepe k = " + r.kp + " (" + E.fmt(r.peakFreq, 4) +
        " Hz), sızıntı %" + E.fmt(leakPct, 2) + ", Parseval " + r.parse.toFixed(6) + "."
    };
  });

  E.check("dft: Δf = fs/N and 125 Hz is bin-centered at k=4", function () {
    var r = compute({ n: 32, f0: 125, window: "rect", amp: 1 });
    return Math.abs(r.df - 31.25) < 1e-12 && r.kp === 4 &&
      Math.abs(r.peakFreq - 125) < 1e-12 && r.leakage < 1e-9;
  });
  E.check("dft: 110 Hz leaks; Hann lowers sidelobe and widens main lobe", function () {
    var a = compute({ n: 32, f0: 110, window: "rect", amp: 1 });
    var b = compute({ n: 32, f0: 110, window: "hann", amp: 1 });
    return a.leakage > 0.05 && b.leakage < a.leakage &&
      b.sideDb < a.sideDb - 10 && a.mainBins === 2 && b.mainBins === 4;
  });
  E.check("dft: Parseval 1.000 ± 1e-6 for both windows", function () {
    var a = compute({ n: 32, f0: 110, window: "rect", amp: 1 });
    var b = compute({ n: 64, f0: 125, window: "hann", amp: 2 });
    return Math.abs(a.parse - 1) < 1e-6 && Math.abs(b.parse - 1) < 1e-6;
  });
})();
