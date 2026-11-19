/* Fourier series lab: time wave, magnitude/phase stems, Gibbs and Parseval. */
(function () {
  "use strict";
  if (!window.EE) return;
  var E = window.EE, PI = Math.PI;

  function wrap(a) { return ((a + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI; }
  function f(v, d) { return E.fmt(v, d).replace(".", ","); }
  function fx(v, d) { return v.toFixed(d).replace(".", ","); }

  /* Exact single-sided cosine coefficients for the four teaching waves. */
  function coeffs(wave, A, duty, N) {
    var h = [], n, amp, s, ph;
    if (wave === "sine") return { a0: 0, h: [[1, A, 0]] };
    if (wave === "square") {
      for (n = 1; n <= N; n++) {
        s = Math.sin(PI * n * duty);
        amp = 4 * A * Math.abs(s) / (PI * n);
        if (amp < 1e-12) continue;
        ph = wrap(-PI * n * duty + (s < 0 ? PI : 0));
        h.push([n, amp, ph]);
      }
      return { a0: A * (2 * duty - 1), h: h };
    }
    if (wave === "saw") {
      for (n = 1; n <= N; n++) h.push([n, 2 * A / (PI * n), n % 2 ? -PI / 2 : PI / 2]);
      return { a0: 0, h: h };
    }
    for (n = 1; n <= N; n += 2) {
      ph = ((n - 1) / 2) % 2 === 0 ? 0 : PI;
      h.push([n, 8 * A / (PI * PI * n * n), ph]);
    }
    return { a0: 0, h: h };
  }

  function synth(c, t, T) {
    var v = c.a0, i;
    for (i = 0; i < c.h.length; i++) {
      v += c.h[i][1] * Math.cos(2 * PI * c.h[i][0] * t / T + c.h[i][2]);
    }
    return v;
  }

  function ideal(wave, A, duty, t, T) {
    var x = t / T - Math.floor(t / T);
    if (wave === "sine") return A * Math.cos(2 * PI * x);
    if (wave === "square") return x < duty ? A : -A;
    if (wave === "saw") return 2 * A * (x < 0.5 ? x : x - 1);
    return A * (1 - 4 * Math.min(x, 1 - x));
  }

  function gibbs(wave, A, duty, N) {
    if (wave === "sine" || wave === "triangle") return 0;
    var c = coeffs(wave, A, duty, N), M = 12000, mx = -1e9, i, v;
    for (i = 0; i <= M; i++) {
      v = synth(c, i / M, 1);
      if (v > mx) mx = v;
    }
    return Math.max(0, (mx - A) / (2 * A) * 100);
  }

  function parseval(wave, A, duty, N) {
    var c = coeffs(wave, A, duty, N), M = 4096, s = 0, i, t, v;
    for (i = 1; i <= M; i++) {
      t = (i - 0.5) / M;
      v = synth(c, t, 1);
      s += v * v;
    }
    var num = s / M, ana = c.a0 * c.a0;
    for (i = 0; i < c.h.length; i++) ana += 0.5 * c.h[i][1] * c.h[i][1];
    var full = wave === "sine" ? A * A / 2 : (wave === "square" ? A * A : A * A / 3);
    return { ratio: num / ana, captured: ana / full * 100 };
  }

  function theory(wave, A, duty) {
    if (wave === "sine") return A;
    if (wave === "square") return 4 * A * Math.abs(Math.sin(PI * duty)) / PI;
    if (wave === "saw") return 2 * A / PI;
    return 8 * A / (PI * PI);
  }

  E.registerLab("fourier", function (s, el) {
    var p = E.palette(), A = +s.amp, duty = +s.duty / 100;
    var N = Math.max(1, Math.round(+s.n)), f0 = +s.f0, T = 1 / f0;
    var wave = s.wave, c = coeffs(wave, A, duty, N);
    var g = gibbs(wave, A, duty, N), pm = parseval(wave, A, duty, N);
    var th = theory(wave, A, duty), ph1 = c.h.length ? c.h[0][2] * 180 / PI : 0;

    E.canvas(el, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var gap = 12, topH = Math.round(h * 0.44), midH = Math.round(h * 0.28);
      var botH = h - topH - midH - 2 * gap, i, pts, ptsN, x;
      var tmax = 2 * T * 1000;
      var ax1 = E.axes(ctx, { x: 0, y: 0, w: w, h: topH }, {
        xmin: 0, xmax: tmax, ymin: -1.35 * A, ymax: 1.35 * A,
        xlabel: "t (ms)", ylabel: "x(t) (V)",
        xticks: [{ v: 0, label: "0" }, { v: tmax / 2, label: f(tmax / 2, 2) },
          { v: tmax, label: f(tmax, 2) }],
        yticks: [{ v: -A, label: f(-A, 1) }, { v: 0, label: "0" }, { v: A, label: f(A, 1) }],
        padLeft: 38, padRight: 8, padTop: 8, padBottom: 24
      });
      pts = []; ptsN = [];
      for (i = 0; i <= 800; i++) {
        var t = 2 * T * i / 800;
        pts.push([ax1.sx(t * 1000), ax1.sy(ideal(wave, A, duty, t, T))]);
        ptsN.push([ax1.sx(t * 1000), ax1.sy(synth(c, t, T))]);
      }
      E.line(ctx, pts, { color: p.muted, width: 1.1, dash: [5, 3] });
      E.line(ctx, ptsN, { color: p.accent, width: 1.9 });
      E.label(ctx, "N = " + N, ax1.plot.x + ax1.plot.w - 4, ax1.plot.y + 9,
        { align: "right", size: 9, color: p.accent, background: p.sheet });

      var nShow = Math.min(N, 20), maxA = 0.01, hs = c.h;
      for (i = 0; i < hs.length; i++) {
        if (hs[i][0] <= nShow && hs[i][1] > maxA) maxA = hs[i][1];
      }
      var ax2 = E.axes(ctx, { x: 0, y: topH + gap, w: w, h: midH }, {
        xmin: 0.5, xmax: nShow + 0.5, ymin: 0, ymax: maxA * 1.18,
        xlabel: "harmonik n", ylabel: "|An| (V)",
        xticks: [{ v: 1, label: "1" }, { v: Math.max(2, Math.round(nShow / 2)), label: String(Math.max(2, Math.round(nShow / 2))) },
          { v: nShow, label: String(nShow) }],
        yticks: [{ v: 0, label: "0" }, { v: maxA / 2, label: f(maxA / 2, 2) },
          { v: maxA, label: f(maxA, 2) }],
        padLeft: 38, padRight: 8, padTop: 6, padBottom: 24
      });
      for (i = 0; i < hs.length; i++) {
        if (hs[i][0] > nShow) continue;
        x = ax2.sx(hs[i][0]);
        E.dash(ctx, x, ax2.sy(0), x, ax2.sy(hs[i][1]), { color: p.blue, width: 1.4 });
        E.dot(ctx, x, ax2.sy(hs[i][1]), 2.8, { fill: hs[i][0] === 1 ? p.accent : p.blue });
      }

      var ax3 = E.axes(ctx, { x: 0, y: topH + midH + 2 * gap, w: w, h: botH }, {
        xmin: 0.5, xmax: nShow + 0.5, ymin: -190, ymax: 190,
        xlabel: "harmonik n", ylabel: "faz (°)",
        xticks: [{ v: 1, label: "1" }, { v: Math.max(2, Math.round(nShow / 2)), label: String(Math.max(2, Math.round(nShow / 2))) },
          { v: nShow, label: String(nShow) }],
        yticks: [{ v: -180, label: "-180" }, { v: 0, label: "0" }, { v: 180, label: "180" }],
        padLeft: 38, padRight: 8, padTop: 6, padBottom: 24
      });
      for (i = 0; i < hs.length; i++) {
        if (hs[i][0] > nShow || hs[i][1] < 1e-9) continue;
        x = ax3.sx(hs[i][0]);
        E.dash(ctx, x, ax3.sy(0), x, ax3.sy(hs[i][2] * 180 / PI), { color: p.ruleStrong, width: 1.2 });
        E.dot(ctx, x, ax3.sy(hs[i][2] * 180 / PI), 2.8, { fill: p.cyan });
      }
    });

    var wn = { square: "kare", saw: "testere", triangle: "üçgen", sine: "sinüs" }[wave];
    var status;
    if (wave === "sine") {
      status = "Sinüs tek bir spektral çizgi üretir: A1 = A = " + f(A, 2) +
        " V; N = " + N + " olsa da başka harmonik yoktur.";
    } else if (wave === "triangle") {
      status = "Üçgen dalga sürekli olduğu için Gibbs taşması yok; N = " + N +
        " ile enerjinin %" + f(pm.captured, 2) + "'i yakalanır. Katsayılar 1/n² düştüğü için yakınsama hızlıdır.";
    } else {
      status = (wave === "square" ? "Kare dalga" : "Testere dalga") + ": N = " + N +
        "; Gibbs taşması sıçramanın %" + f(g, 2) + " kadarı. " +
        (wave === "square"
          ? "N büyüdükçe taşma bölgesi daralır, genliği ~%8,95 dolayında kalır; "
          : "Testere dalgada Gibbs daha yavaş yakınsar; N büyüdükçe ~%8,95'e yaklaşır, sıfıra inmez; ") +
        "süreksizlikte kısmi toplam düzgün yakınsamaz. Temel A1 = " + f(c.h.length ? c.h[0][1] : 0, 3) +
        " V (teori " + f(th, 3) + " V).";
    }

    return {
      readout: E.readout([
        ["DC bileşen", f(c.a0, 3), "V"],
        ["Temel A1", f(c.h.length ? c.h[0][1] : 0, 3), "V"],
        ["Teorik A1", f(th, 3), "V"],
        ["Gibbs taşması", f(g, 2), "%"],
        ["Parseval oranı", fx(pm.ratio, 6), ""],
        ["Yakalanan güç", f(pm.captured, 2), "%"],
        ["1. harmonik fazı", f(ph1, 1), "°"]
      ]),
      status: status,
      tone: "ok",
      aria: "Fourier labi: " + wn + " dalga, A = " + f(A, 2) + " volt, f0 = " + f(f0, 0) +
        " hertz, N = " + N + "; temel genlik " + f(c.h.length ? c.h[0][1] : 0, 3) +
        " volt, Gibbs taşması yüzde " + f(g, 2) + ".",
      print: "Statik yedek: " + wn + " dalga, A = " + f(A, 2) + " V, f0 = " + f(f0, 0) +
        " Hz, N = " + N + "; A1 = " + f(c.h.length ? c.h[0][1] : 0, 3) +
        " V, Gibbs = %" + f(g, 2) + ", Parseval = " + fx(pm.ratio, 6) + "."
    };
  });

  E.check("fourier: kare A1 = 4A/pi; sinus tek cizgi", function () {
    var q = coeffs("square", 1, 0.5, 1), s = coeffs("sine", 1, 0.5, 9);
    return Math.abs(q.h[0][1] - 4 / PI) < 1e-9 && s.h.length === 1 &&
      Math.abs(s.h[0][1] - 1) < 1e-12;
  });
  E.check("fourier: Gibbs %8,95'e yakin, N ile kaybolmuyor", function () {
    var g25 = gibbs("square", 1, 0.5, 25), g49 = gibbs("square", 1, 0.5, 49);
    return Math.abs(g25 - 8.95) < 0.05 && Math.abs(g49 - 8.95) < 0.02 && g49 > 8.9;
  });
  E.check("fourier: Parseval orani 1 +/- 2e-5", function () {
    return Math.abs(parseval("square", 1, 0.5, 15).ratio - 1) < 2e-5;
  });
})();
