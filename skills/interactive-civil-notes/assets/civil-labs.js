/* ============================================================
   Civil engineering lab engines — sits on top of labkit.js
   Public API (window.CIVIL):
     CIVIL.beam(s)       TS 500 rectangular RC beam check
     CIVIL.manning(s)    rectangular channel normal depth
     CIVIL.initBeam / CIVIL.initManning
   Units: N, mm, MPa, kN, kN·m unless stated otherwise.
   ============================================================ */

(function () {
  "use strict";

  var K = window.LABKIT;
  if (!K) throw new Error("labkit.js must load before civil-labs.js");
  var fmt = K.fmt, pct = K.pct;

  var MATERIALS = {
    "C25/30": { fck: 25, fctk: 1.8, k1: 0.85 },
    "C30/37": { fck: 30, fctk: 1.9, k1: 0.82 },
    "C35/45": { fck: 35, fctk: 2.1, k1: 0.79 },
    "C40/50": { fck: 40, fctk: 2.2, k1: 0.76 },
    "C45/55": { fck: 45, fctk: 2.3, k1: 0.73 },
    "C50/60": { fck: 50, fctk: 2.5, k1: 0.70 }
  };
  var STEEL = { "B420C": 420, "B500C": 500 };
  var GAMMA_MC = 1.5, GAMMA_MS = 1.15, ES = 200000, ECU = 0.003;

  /* ---------------- RC beam ---------------- */

  function momentCapacity(b, d, As, fcd, fyd, k1, epsYd) {
    var aY = As * fyd / (0.85 * fcd * b);
    var xY = aY / k1;
    var epsY = xY > 0 ? ECU * (d - xY) / xY : Infinity;
    var x, a, eps, yields;
    if (epsY >= epsYd && xY < d) {
      x = xY; a = aY; eps = epsY; yields = true;
    } else {
      var lo = 1e-7, hi = d - 1e-7, mid, C, epsMid, T;
      for (var i = 0; i < 90; i++) {
        mid = (lo + hi) / 2;
        C = 0.85 * fcd * b * k1 * mid;
        epsMid = ECU * (d - mid) / mid;
        T = As * Math.min(ES * epsMid, fyd);
        if (C - T > 0) hi = mid; else lo = mid;
      }
      x = (lo + hi) / 2; a = k1 * x; eps = ECU * (d - x) / x; yields = false;
    }
    var C = 0.85 * fcd * b * a;
    var T = As * (yields ? fyd : Math.min(ES * eps, fyd));
    return { x: x, a: a, x_d: x / d, eps_s: eps, eps_ratio: eps / epsYd,
      yields: yields, M_Rd: C * (d - a / 2) / 1e6, C: C, T: T, z: d - a / 2 };
  }

  function beam(s) {
    var mat = MATERIALS[s.conc] || MATERIALS["C30/37"];
    var fyk = STEEL[s.steel] || 420;
    var fcd = mat.fck / GAMMA_MC;
    var fctd = mat.fctk / GAMMA_MC;
    var fyd = fyk / GAMMA_MS;
    var epsYd = fyd / ES;
    var k1 = mat.k1;
    var dEff = Math.min(s.d, s.h - 20);
    var dClamped = dEff < s.d - 1e-9;
    var b = s.b;

    var cb_d = ECU / (ECU + epsYd);
    var ab_d = k1 * cb_d;
    var rho_b = 0.85 * fcd * ab_d / fyd;
    var rhoMax = Math.min(0.85 * rho_b, 0.02);
    var alphaMax = rhoMax * fyd / (0.85 * fcd);
    var muMax = 0.85 * alphaMax * (1 - alphaMax / 2);
    var Mlim = muMax * b * dEff * dEff * fcd / 1e6;

    var mu = s.Md * 1e6 / (b * dEff * dEff * fcd);
    var feasible = mu <= muMax + 1e-12;
    var alpha = feasible ? 1 - Math.sqrt(Math.max(0, 1 - 2 * mu / 0.85)) : alphaMax;
    var aReq = alpha * dEff;
    var AsFlex = 0.85 * fcd * b * aReq / fyd;
    var AsMin = 0.8 * fctd / fyd * b * dEff;
    var AsReq = Math.max(AsFlex, AsMin);
    var AsMax = rhoMax * b * dEff;

    var AsProv = s.n * Math.PI * s.phi * s.phi / 4;
    var cap = momentCapacity(b, dEff, AsProv, fcd, fyd, k1, epsYd);
    var rho = AsProv / (b * dEff);
    var nFit = Math.max(1, Math.floor((b - 25) / (Number(s.phi) + 25)));

    var Vcr = 0.65 * fctd * b * dEff;
    var Vc = 0.8 * Vcr;
    var Vmax = 0.22 * fcd * b * dEff;
    var Asw = 2 * Math.PI * s.phis * s.phis / 4;
    var AswS = Asw / s.s;
    var Vw = AswS * fyd * dEff;
    var Vr = Vc + Vw;
    var AswSmin = 0.3 * fctd * b / fyd;
    var sMax = dEff / 2;
    if (s.Vd * 1e3 > 3 * Vcr) sMax = Math.min(sMax, dEff / 4);

    var utilFlex = s.Md / cap.M_Rd;
    var utilDuct = rho / rhoMax;
    var utilMin = AsMin / AsProv;
    var utilShear = (s.Vd * 1e3) / Vr;
    var utilStrut = (s.Vd * 1e3) / Vmax;
    var utilMinStirrup = AswSmin / AswS;
    var utilSpacing = s.s / sMax;
    var utilFit = s.n / nFit;
    var utilLim = s.Md / Mlim;

    function safe(u) { return isFinite(u) ? u : 999; }

    var rows = [
      { key: "flexure", label: "Eğilme", demand: "M_d = " + fmt(s.Md, 1) + " kN·m",
        capacity: "M_Rd = " + fmt(cap.M_Rd, 1) + " kN·m", util: safe(utilFlex),
        why: "M_Rd, donatı akması varsayımıyla C = T dengesinden bulunur; kaldıraç kolu z = d − a/2." },
      { key: "ductility", label: "Süneklik (ρ)", demand: "ρ = " + pct(rho, 2),
        capacity: "ρ_max = " + pct(rhoMax, 2), util: safe(utilDuct),
        why: "TS 500 §7.3: ρ ≤ 0,85ρ_b ve ρ ≤ 0,02; küçük olan geçerlidir. ρ_b dengeli donatı oranıdır." },
      { key: "minsteel", label: "Min. donatı", demand: "A_s,min = " + fmt(AsMin, 0) + " mm²",
        capacity: "A_s,prov = " + fmt(AsProv, 0) + " mm²", util: safe(utilMin),
        why: "TS 500 Denk. 7.3: A_s ≥ 0,8 f_ctd b d / f_yd; M_d küçük olsa bile gevrek kırılmayı önler." },
      { key: "shear", label: "Kesme", demand: "V_d = " + fmt(s.Vd, 1) + " kN",
        capacity: "V_r = " + fmt(Vr / 1e3, 1) + " kN", util: safe(utilShear),
        why: "V_r = V_c + V_w; beton katkısı V_c = 0,8V_cr sabittir, etriye V_w = (A_sw/s) f_ywd d ekler." },
      { key: "strut", label: "Gövde ezilmesi", demand: "V_d = " + fmt(s.Vd, 1) + " kN",
        capacity: "V_max = " + fmt(Vmax / 1e3, 1) + " kN", util: safe(utilStrut),
        why: "TS 500 Denk. 8.7: V_d ≤ 0,22 f_cd b_w d. Bu sınır aşılırsa etriye değil kesit büyütülür." },
      { key: "minstirrup", label: "Min. etriye", demand: "(A_sw/s)_min = " + fmt(AswSmin, 3),
        capacity: "A_sw/s = " + fmt(AswS, 3) + " mm²/mm", util: safe(utilMinStirrup),
        why: "TS 500 Denk. 8.6: A_sw/s ≥ 0,3 f_ctd b_w / f_ywd; açıklık boyunca etriye zorunludur." },
      { key: "spacing", label: "Etriye aralığı", demand: "s = " + fmt(s.s, 0) + " mm",
        capacity: "s_max = " + fmt(sMax, 0) + " mm", util: safe(utilSpacing),
        why: "TS 500 §8.1.6: s ≤ d/2; V_d > 3V_cr ise s ≤ d/4; çerçeve uçlarında 2h boyunca ayrıca sınırlanır." },
      { key: "layout", label: "Yerleşim (tek sıra)", demand: s.n + "Ø" + fmt(Number(s.phi), 0),
        capacity: "n_fit = " + nFit, util: safe(utilFit),
        why: "25 mm paspayı ve 25 mm net aralık varsayımıyla tek sıraya sığan çubuk sayısı sınırlıdır (TS 500 §9.5.2 ruhu)." },
      { key: "singlelimit", label: "Tek donatı sınırı", demand: "M_d = " + fmt(s.Md, 1) + " kN·m",
        capacity: "M_Rd,lim = " + fmt(Mlim, 1) + " kN·m", util: safe(utilLim),
        why: "TS 500 §7.3 ρ_max sınırında tek donatılı kesitin taşıyabileceği moment; aşılırsa basınç donatısı veya daha büyük kesit gerekir." }
    ];

    var governing = rows[0];
    rows.forEach(function (r) { if (r.util > governing.util) governing = r; });

    var allPass = rows.every(function (r) { return r.util <= 1 + 1e-9; }) &&
      cap.eps_ratio >= 1 - 1e-9;
    var statusParts = [];
    if (dClamped) statusParts.push("d = " + fmt(s.d, 0) + " mm, h − 20 = " + fmt(s.h - 20, 0) + " mm'yi aştığı için " + fmt(dEff, 0) + " mm alındı.");
    if (!feasible) statusParts.push("M_d = " + fmt(s.Md, 1) + " kN·m > M_Rd,lim = " + fmt(Mlim, 1) + " kN·m: tek donatılı sınır aşıldı; basınç donatısı veya daha büyük kesit gerekir.");
    if (cap.eps_ratio < 1 - 1e-9) statusParts.push("Çelik akmıyor: ε_s/ε_yd = " + fmt(cap.eps_ratio, 2) + " < 1; kesit gevrek kırılma riski taşıyor.");
    if (s.n > nFit) statusParts.push("Tek sıra yerleşimi sığmıyor: " + s.n + "Ø" + fmt(s.phi, 0) + " için en fazla " + nFit + " çubuk sığar.");
    if (allPass) {
      statusParts.push("Tüm sınır durumları sağlıyor: M_Rd = " + fmt(cap.M_Rd, 1) + " > M_d = " + fmt(s.Md, 1) +
        " kN·m; ρ = " + pct(rho, 2) + " < ρ_max = " + pct(rhoMax, 2) + "; V_r = " + fmt(Vr / 1e3, 1) +
        " > V_d = " + fmt(s.Vd, 1) + " kN; s = " + fmt(s.s, 0) + " ≤ s_max = " + fmt(sMax, 0) +
        " mm. En yüksek kullanım " + governing.label.toLowerCase() + " (%" + fmt(governing.util * 100, 0) + ").");
    } else {
      statusParts.push(governing.label + " yönetiyor: " + governing.demand + " / " + governing.capacity + " = %" + fmt(governing.util * 100, 0) + ". " + governing.why);
    }

    return {
      b: b, h: s.h, d: dEff, dRaw: s.d, dClamped: dClamped, conc: s.conc, steel: s.steel,
      Md: s.Md, Vd: s.Vd, fck: mat.fck, fctk: mat.fctk, fcd: fcd, fctd: fctd, fyd: fyd,
      k1: k1, epsYd: epsYd, mu: mu, alpha: alpha, aReq: aReq, AsFlex: AsFlex,
      AsMin: AsMin, AsReq: AsReq, AsProv: AsProv, AsMax: AsMax, rho: rho, rho_b: rho_b,
      rhoMax: rhoMax, alphaMax: alphaMax, Mlim: Mlim, feasible: feasible, cap: cap,
      Vcr: Vcr, Vc: Vc, Vmax: Vmax, Asw: Asw, AswS: AswS, AswSmin: AswSmin,
      Vw: Vw, Vr: Vr, sMax: sMax, nFit: nFit, rows: rows, governing: governing,
      allPass: allPass, status: statusParts.join(" "), tone: allPass ? "ok" : "bad"
    };
  }

  /* ---------------- rectangular channel ---------------- */

  function manning(s) {
    var g = 9.81;
    function depthFor(y) {
      var A = s.b * y;
      var P = s.b + 2 * y;
      var R = A / P;
      var Q = (1 / s.n) * A * Math.pow(R, 2 / 3) * Math.sqrt(s.S0);
      return Q;
    }
    var lo = 1e-4, hi = 10, mid;
    for (var i = 0; i < 80; i++) {
      mid = (lo + hi) / 2;
      if (depthFor(mid) < s.Q) lo = mid; else hi = mid;
    }
    var y = (lo + hi) / 2;
    var A = s.b * y, P = s.b + 2 * y, R = A / P;
    var V = s.Q / A;
    var Fr = V / Math.sqrt(g * y);
    var yc = Math.cbrt(s.Q * s.Q / (g * s.b * s.b));
    var regime = y < yc ? "süperkritik" : (Math.abs(y - yc) < 1e-3 ? "kritik" : "subkritik");
    return { b: s.b, Q: s.Q, S0: s.S0, n: s.n, y: y, A: A, P: P, R: R, V: V,
      Fr: Fr, yc: yc, regime: regime, pass: y < 5 && Fr < 2.5,
      status: "Normal derinlik y_n = " + fmt(y, 2) + " m, kritik derinlik y_c = " +
        fmt(yc, 2) + " m. Akış " + regime + "; V = " + fmt(V, 2) + " m/s, Fr = " +
        fmt(Fr, 2) + ". " + (y < yc ? "Kanaldaki su sığ ve hızlı: yatak koruması gerekir." :
          "Akış sakin; Manning sürtünmesi ile çekim dengesi kuruluyor.") };
  }

  /* ---------------- drawing ---------------- */

  function line(ctx, x1, y1, x2, y2, color, width, dash) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width || 1;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  }
  function text(ctx, s, x, y, color, size, align) {
    ctx.save(); ctx.fillStyle = color;
    ctx.font = "500 " + (size || 10) + "px 'IBM Plex Sans', system-ui, sans-serif";
    ctx.textAlign = align || "left"; ctx.textBaseline = "middle";
    ctx.fillText(s, x, y); ctx.restore();
  }

  function drawBeam(r, canvasEl) {
    LABKIT.canvas(canvasEl, function (ctx, w, h) {
      var p = LABKIT.palette();
      ctx.clearRect(0, 0, w, h);
      var pad = 30;
      var secW = Math.min(w * 0.30, 190);
      var secH = Math.min(h - pad * 2, 260);
      var bx = pad + 10, by = pad + 20;
      var scale = Math.min(secW / r.b, secH / r.h);
      var bw = r.b * scale, bh = r.h * scale;

      // concrete section
      ctx.fillStyle = "rgba(30,27,23,0.05)";
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = p.ink; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by, bw, bh);

      // bars (single row)
      var cover = 25 * scale, barR = Math.max(2.5, 12 * scale);
      var n = r.AsProv > 0 ? Math.max(1, Math.round(r.AsProv / (Math.PI * 625 / 4))) : 1;
      // use the actual count from the caller state if present; fall back to visual 3
      n = r.nBars || 3;
      var span = bw - 2 * cover;
      for (var i = 0; i < n; i++) {
        var x = bx + cover + (n === 1 ? span / 2 : span * i / (n - 1));
        var y = by + bh - cover;
        ctx.beginPath(); ctx.arc(x, y, barR, 0, Math.PI * 2);
        ctx.fillStyle = p.accent; ctx.fill();
      }
      // effective depth
      line(ctx, bx + bw + 8, by, bx + bw + 8, by + bh - cover, p.muted, 1, [3, 2]);
      text(ctx, "d = " + fmt(r.d, 0), bx + bw + 12, by + (bh - cover) / 2, p.muted, 9);
      text(ctx, "b = " + fmt(r.b, 0), bx + bw / 2, by + bh + 12, p.muted, 9, "center");
      text(ctx, "h = " + fmt(r.h, 0), bx + bw / 2, by - 8, p.muted, 9, "center");

      // strain diagram
      var sx = bx + bw + 80, sy = by;
      var sw = Math.min(120, w - sx - pad - 10);
      var sh = bh;
      line(ctx, sx, sy, sx, sy + sh, p.ink2, 1);
      line(ctx, sx, sy, sx + sw, sy + sh, p.ink, 1.2); // top strain 0.003
      line(ctx, sx, sy, sx, sy + sh * (1 - r.cap.x_d), p.ink, 1.2);
      text(ctx, "ε_cu", sx - 4, sy + 4, p.muted, 8, "right");
      text(ctx, "ε_s", sx + 4, sy + sh * (1 - r.cap.x_d), p.accent, 8);
      text(ctx, "x = " + fmt(r.cap.x, 0), sx + 8, sy + sh * (1 - r.cap.x_d) / 2, p.ink2, 8);
      text(ctx, "ε_s/ε_yd = " + fmt(r.cap.eps_ratio, 2), sx, sy + sh + 18,
        r.cap.eps_ratio >= 1 ? p.ok : p.bad, 9);

      // stress block
      var tx = sx + sw + 24;
      if (tx + 70 < w) {
        var tw = Math.min(70, w - tx - pad);
        line(ctx, tx, sy, tx + tw, sy, p.ink, 1);
        line(ctx, tx, sy + r.cap.a * scale, tx + tw, sy + r.cap.a * scale, p.ink, 1);
        ctx.fillStyle = "rgba(47,93,138,0.18)";
        ctx.fillRect(tx, sy, tw, r.cap.a * scale);
        text(ctx, "0.85 f_cd", tx + tw / 2, sy + r.cap.a * scale / 2, p.ink2, 8, "center");
      }
      text(ctx, "M_d / M_Rd = " + pct(r.Md / r.cap.M_Rd, 0), pad, h - 12,
        r.Md <= r.cap.M_Rd ? p.ok : p.bad, 10);
    });
  }

  function drawManning(m, canvasEl) {
    LABKIT.canvas(canvasEl, function (ctx, w, h) {
      var p = LABKIT.palette();
      ctx.clearRect(0, 0, w, h);
      var pad = 36;
      var maxY = Math.max(m.y * 1.5, m.yc * 1.5, 0.5);
      var sx = (w - pad * 2) / m.b;
      var sy = (h - pad * 2) / maxY;
      var s = Math.min(sx, sy);
      var ox = (w - m.b * s) / 2, oy = h - pad;
      // channel
      line(ctx, ox, oy, ox, oy - maxY * s, p.ink, 1.5);
      line(ctx, ox + m.b * s, oy, ox + m.b * s, oy - maxY * s, p.ink, 1.5);
      line(ctx, ox, oy, ox + m.b * s, oy, p.ink, 1.5);
      // water
      ctx.fillStyle = "rgba(47,107,122,0.18)";
      ctx.fillRect(ox, oy - m.y * s, m.b * s, m.y * s);
      line(ctx, ox, oy - m.y * s, ox + m.b * s, oy - m.y * s, p.cold || p.ink2, 1.2);
      // critical depth
      line(ctx, ox, oy - m.yc * s, ox + m.b * s, oy - m.yc * s, p.accent, 1, [4, 3]);
      text(ctx, "y = " + fmt(m.y, 2) + " m", ox + 6, oy - m.y * s - 10, p.cold || p.ink2, 9);
      text(ctx, "y_c = " + fmt(m.yc, 2) + " m", ox + 6, oy - m.yc * s + 10, p.accent, 9);
      text(ctx, "b = " + fmt(m.b, 2) + " m", ox + m.b * s / 2, oy + 14, p.muted, 9, "center");
      text(ctx, "n = " + fmt(m.n, 3) + " · S₀ = " + fmt(m.S0, 4), pad, pad, p.muted, 9);
    });
  }

  /* ---------------- binders ---------------- */

  function ledger(root, r) {
    var host = root.querySelector("[data-ledger]");
    if (!host) return;
    host.textContent = "";
    var table = document.createElement("table");
    table.className = "metable civilledger";
    var thead = document.createElement("thead");
    var hr = document.createElement("tr");
    ["Sınır durumu", "Talep", "Kapasite", "Oran", "Yöneten"].forEach(function (s) {
      var th = document.createElement("th"); th.textContent = s; hr.appendChild(th);
    });
    thead.appendChild(hr); table.appendChild(thead);
    var tbody = document.createElement("tbody");
    r.rows.forEach(function (row) {
      var tr = document.createElement("tr");
      if (row.key === r.governing.key) tr.className = "is-governing";
      [row.label, row.demand, row.capacity, pct(row.util, 0),
        row.key === r.governing.key ? "●" : ""].forEach(function (s) {
        var td = document.createElement("td"); td.textContent = s; tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody); host.appendChild(table);
  }

  function initBeam(root) {
    return LABKIT.initLab(root, function (s, canvasEl) {
      var r = beam(s);
      r.nBars = s.n;
      drawBeam(r, canvasEl);
      ledger(root, r);
      return {
        readout: [
          ["A_s,req", fmt(r.AsReq, 0) + " mm²"],
          ["A_s,prov", fmt(r.AsProv, 0) + " mm²"],
          ["M_Rd", fmt(r.cap.M_Rd, 1) + " kN·m"],
          ["V_r", fmt(r.Vr / 1e3, 1) + " kN"],
          ["ρ", pct(r.rho, 2)],
          ["Yöneten", r.governing.label + " " + pct(r.governing.util, 0)]
        ],
        status: r.status, tone: r.tone,
        aria: "Betonarme kiriş kesiti; " + r.nBars + " çubuk, M_Rd " +
          fmt(r.cap.M_Rd, 1) + " kN·m, yöneten sınır " + r.governing.label + "."
      };
    });
  }

  function initManning(root) {
    return LABKIT.initLab(root, function (s, canvasEl) {
      var m = manning(s);
      drawManning(m, canvasEl);
      return {
        readout: [
          ["Normal derinlik", fmt(m.y, 2) + " m"],
          ["Kritik derinlik", fmt(m.yc, 2) + " m"],
          ["Islak alan A", fmt(m.A, 2) + " m²"],
          ["Hidrolik yarıçap R", fmt(m.R, 3) + " m"],
          ["Hız V", fmt(m.V, 2) + " m/s"],
          ["Froude Fr", fmt(m.Fr, 2)]
        ],
        status: m.status, tone: m.pass ? "ok" : "bad",
        aria: "Dikdörtgen kanal kesiti; normal derinlik " + fmt(m.y, 2) + " metre."
      };
    });
  }

  function boot() {
    LABKIT.$$("[data-lab='beam']").forEach(initBeam);
    LABKIT.$$("[data-lab='manning']").forEach(initManning);
    if ("MutationObserver" in window) {
      new MutationObserver(function () {
        LABKIT.$$("canvas[data-canvas]").forEach(function (c) {
          if (c.__labCanvas) c.__labCanvas.redraw();
        });
      }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    }
    LABKIT.quiz(document);
    if (/[?&]selftest=1/.test(location.search)) LABKIT.runChecks();
  }

  /* ---------------- selftests ---------------- */

  function baseBeam(over) {
    var s = { b: 300, h: 600, d: 550, conc: "C30/37", steel: "B420C", Md: 250, Vd: 220,
      n: 3, phi: 25, phis: 8, s: 200 };
    Object.keys(over || {}).forEach(function (k) { s[k] = over[k]; });
    return s;
  }

  LABKIT.check("beam: default A_s,req = 1366 mm²", function () {
    return Math.abs(beam(baseBeam()).AsReq - 1366) < 2;
  });
  LABKIT.check("beam: 3Ø25 M_Rd = 267.45 kN·m", function () {
    return Math.abs(beam(baseBeam()).cap.M_Rd - 267.45) < 0.05;
  });
  LABKIT.check("beam: 6Ø25 does not double M_Rd", function () {
    var r = beam(baseBeam({ n: 6 }));
    return r.cap.M_Rd < 2 * 267.45 && r.cap.M_Rd > 400;
  });
  LABKIT.check("beam: C25 5Ø25 is ductility-limited", function () {
    var r = beam(baseBeam({ conc: "C25/30", b: 300, h: 400, d: 350, n: 5, Md: 200 }));
    return r.cap.M_Rd > 200 && r.cap.eps_ratio < 1;
  });
  LABKIT.check("manning: default normal depth about 1.56 m", function () {
    var m = manning({ b: 4.0, Q: 12.0, S0: 0.001, n: 0.015 });
    return Math.abs(m.y - 1.5555) < 0.01;
  });

  window.CIVIL = {
    beam: beam, momentCapacity: momentCapacity, manning: manning,
    initBeam: initBeam, initManning: initManning
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
