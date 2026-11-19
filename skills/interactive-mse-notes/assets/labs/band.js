/* ============================================================
   Lab: semiconductor band diagram, Fermi level, doping, T
   Requires assets/mse-labs.js (loaded first).
   ============================================================ */

(function () {
  "use strict";

  var api = window.__MSE_LABS__;
  if (!api) {
    console.error("mse-labs.js must load first");
    return;
  }

  var h = api.helpers;
  var K = 8.617333e-5; /* eV/K */

  /* Room-temperature values, rounded textbook numbers. Eg is held
     constant with T in this model; Nc and Nv scale as T^1.5. */
  var MATERIALS = {
    si: { name: "Silicon (Si)", short: "Si", Eg: 1.12, Nc: 2.8e19, Nv: 1.04e19 },
    ge: { name: "Germanium (Ge)", short: "Ge", Eg: 0.66, Nc: 1.04e19, Nv: 6.0e18 },
    gaas: { name: "Gallium arsenide (GaAs)", short: "GaAs", Eg: 1.42, Nc: 4.7e17, Nv: 7.0e18 },
    gan: { name: "Gallium nitride (GaN)", short: "GaN", Eg: 3.4, Nc: 2.3e18, Nv: 1.0e19 }
  };

  var SUP = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻"
  };

  function superscript(n) {
    return String(n).split("").map(function (ch) {
      return SUP[ch] || ch;
    }).join("");
  }

  function sci(value, digits) {
    if (typeof value !== "number" || !isFinite(value) || value <= 0) return "—";
    var d = digits === undefined ? 1 : digits;
    var e = Math.floor(Math.log(value) / Math.LN10);
    var mant = value / Math.pow(10, e);
    var text = mant.toFixed(d);
    if (parseFloat(text) >= 10) {
      e += 1;
      mant = mant / 10;
      text = mant.toFixed(d);
    }
    if (d > 0) text = text.replace(/0+$/, "").replace(/\.$/, "");
    return text + " × 10" + superscript(e);
  }

  function signed(value, digits) {
    if (typeof value !== "number" || !isFinite(value)) return "—";
    var d = digits === undefined ? 2 : digits;
    if (Math.abs(value) < Math.pow(10, -d) / 2) return "0";
    var text = Math.abs(value).toFixed(d);
    if (d > 0) text = text.replace(/0+$/, "").replace(/\.$/, "");
    return (value < 0 ? "−" : "+") + text;
  }

  function spokenConcentration(value) {
    if (!isFinite(value) || value <= 0) return "an unknown concentration";
    var e = Math.floor(Math.log(value) / Math.LN10);
    var mant = value / Math.pow(10, e);
    return h.fmt(mant, 1) + " times ten to the " + e;
  }

  function niAt(m, T) {
    var nc = m.Nc * Math.pow(T / 300, 1.5);
    var nv = m.Nv * Math.pow(T / 300, 1.5);
    return Math.sqrt(nc * nv) * Math.exp(-m.Eg / (2 * K * T));
  }

  function extrinsicOffset(m, T, type, N) {
    var ni = niAt(m, T);
    if (!(ni > 0) || N <= ni) return 0;
    var offset = K * T * Math.log(N / ni);
    return type === "p" ? -offset : offset;
  }

  function arrowY(ctx, x, y1, y2, color, width) {
    var dir = y2 < y1 ? -1 : 1;
    var head = 4.4;
    h.line(ctx, x, y1, x, y2, color, width);
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y2);
    ctx.lineTo(x - head * 0.62, y2 - dir * head);
    ctx.lineTo(x + head * 0.62, y2 - dir * head);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x - head * 0.62, y1 + dir * head);
    ctx.lineTo(x + head * 0.62, y1 + dir * head);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function outlinedText(ctx, text, x, y, color, backdrop, size, align, weight) {
    ctx.save();
    ctx.font = (weight || 600) + " " + size + 'px "IBM Plex Sans", system-ui, sans-serif';
    ctx.textAlign = align || "left";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 3;
    ctx.strokeStyle = backdrop;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function init(root) {
    var cfg = h.readConfig(root);
    var canvas = h.$("[data-canvas]", root);
    var controls = h.$("[data-controls]", root);
    if (!canvas) {
      h.setStatus(root, "This lab needs a <canvas data-canvas>.");
      return;
    }
    if (!controls) {
      h.setStatus(root, "This lab needs a <div data-controls>.");
      return;
    }

    var key = String(cfg.material || cfg.preset || "si").toLowerCase();
    if (!MATERIALS[key]) key = "si";

    var doping = null;
    if (cfg.doping !== undefined && cfg.doping !== null && cfg.doping !== "") {
      doping = Number(cfg.doping);
    }
    var logDoping = (doping && isFinite(doping) && doping > 0)
      ? Math.log(doping) / Math.LN10
      : (cfg.logDoping !== undefined ? Number(cfg.logDoping) : 16);
    if (!isFinite(logDoping)) logDoping = 16;
    logDoping = h.clamp(logDoping, 12, 19);

    var temperature = Number(cfg.temperature);
    if (!isFinite(temperature)) temperature = 300;
    temperature = h.clamp(temperature, 200, 500);

    var state = {
      key: key,
      type: String(cfg.type || "n").toLowerCase().charAt(0) === "p" ? "p" : "n",
      logDoping: logDoping,
      T: temperature,
      ghost: cfg.showGhost === true || cfg.showGhost === "true"
    };

    var carrierHost = h.$("[data-carriers]", root);
    if (!carrierHost) {
      carrierHost = document.createElement("div");
      carrierHost.className = "bandcarrier";
      carrierHost.setAttribute("data-carriers", "");
      var readout = h.$("[data-readout]", root);
      if (readout && readout.parentNode) {
        readout.parentNode.insertBefore(carrierHost, readout.nextSibling);
      } else {
        var panel = h.$(".mselab__panel", root) || root;
        panel.appendChild(carrierHost);
      }
    }

    function material() {
      return MATERIALS[state.key] || MATERIALS.si;
    }

    function calculate() {
      var m = material();
      var T = state.T;
      var N = Math.pow(10, state.logDoping);
      var nc = m.Nc * Math.pow(T / 300, 1.5);
      var nv = m.Nv * Math.pow(T / 300, 1.5);
      var ni = Math.sqrt(nc * nv) * Math.exp(-m.Eg / (2 * K * T));
      var intrinsic = !(N > ni);
      var n, p, raw, majority;

      if (state.type === "n") {
        if (intrinsic) {
          n = ni;
          p = ni;
          raw = 0;
          majority = "intrinsic";
        } else {
          n = N;
          p = (ni * ni) / N;
          raw = K * T * Math.log(N / ni);
          majority = "n";
        }
      } else {
        if (intrinsic) {
          n = ni;
          p = ni;
          raw = 0;
          majority = "intrinsic";
        } else {
          p = N;
          n = (ni * ni) / N;
          raw = -K * T * Math.log(N / ni);
          majority = "p";
        }
      }

      var limit = m.Eg / 2;
      var shown = h.clamp(raw, -limit, limit);
      var clamped = Math.abs(raw) > limit + 1e-12;
      var degenerate = !intrinsic && (Math.abs(raw) >= limit - 3 * K * T);
      var ghostRaw = 0;
      var ghostShown = 0;
      if (state.ghost && Math.abs(T - 300) > 0.5) {
        ghostRaw = extrinsicOffset(m, 300, state.type, N);
        ghostShown = h.clamp(ghostRaw, -limit, limit);
      }

      return {
        m: m,
        T: T,
        N: N,
        nc: nc,
        nv: nv,
        ni: ni,
        n: n,
        p: p,
        raw: raw,
        shown: shown,
        clamped: clamped,
        degenerate: degenerate,
        majority: majority,
        intrinsic: intrinsic,
        fermi: limit + shown,
        ghost: ghostShown,
        ghostVisible: state.ghost && Math.abs(T - 300) > 0.5 && Math.abs(ghostShown - shown) > 0.01
      };
    }

    function render() {
      var c = calculate();
      var m = c.m;
      var size = h.setupCanvas(canvas, 420);
      var ctx = size.ctx;
      var pal = h.palette();
      var w = size.w;
      var hgt = size.h;
      var compact = w < 470;

      var padT = 44;
      var padB = 34;
      var padL = compact ? 44 : 54;
      var padR = compact ? 94 : 112;
      var plotW = Math.max(80, w - padL - padR);
      var plotH = hgt - padT - padB;
      var x0 = padL;
      var x1 = padL + plotW;
      var plotBottom = padT + plotH;

      var pad = 0.20 * c.m.Eg + 0.06;
      var ymin = -pad;
      var ymax = c.m.Eg + pad;

      function Y(E) {
        return padT + (1 - (E - ymin) / (ymax - ymin)) * plotH;
      }

      var yEv = Y(0);
      var yEc = Y(m.Eg);
      var yEi = Y(m.Eg / 2);
      var yEf = Y(c.fermi);
      var yGhost = Y(c.ghost);

      ctx.fillStyle = pal.sheet;
      ctx.fillRect(0, 0, w, hgt);

      /* band continua: conduction above Ec, valence below Ev */
      ctx.save();
      ctx.globalAlpha = 0.075;
      ctx.fillStyle = pal.def;
      ctx.fillRect(x0, padT, plotW, Math.max(0, yEc - padT));
      ctx.fillStyle = pal.beta;
      ctx.fillRect(x0, yEv, plotW, Math.max(0, plotBottom - yEv));
      ctx.restore();

      /* energy grid */
      h.ticks(0, m.Eg, 4).forEach(function (E) {
        var gy = Y(E);
        h.line(ctx, x0, gy, x1, gy, pal.grid, 1, null);
        h.label(ctx, h.fmt(E, 2), x0 - 7, gy + 3, pal.muted, compact ? 8 : 9, "right");
      });

      /* band edges and Fermi level */
      h.line(ctx, x0, yEc, x1, yEc, pal.ink, 2.2, null);
      h.line(ctx, x0, yEv, x1, yEv, pal.ink, 2.2, null);
      h.line(ctx, x0, yEi, x1, yEi, pal.ruleStrong, 1.2, [5, 4]);
      if (c.ghostVisible) {
        h.line(ctx, x0, yGhost, x1, yGhost, pal.ink2, 1.3, [4, 4]);
      }
      h.line(ctx, x0, yEf, x1, yEf, pal.accent, 2.4, null);

      /* qualitative carrier populations */
      var exponent = Math.log(c.N) / Math.LN10;
      var majorityCount = 2 + Math.round(5 * (h.clamp(exponent, 12, 19) - 12) / 7);
      var electronCount = c.majority === "p" ? 1 : (c.majority === "intrinsic" ? 3 : majorityCount);
      var holeCount = c.majority === "n" ? 1 : (c.majority === "intrinsic" ? 3 : majorityCount);
      var dotStart = x0 + (compact ? 34 : 44);
      var dotEnd = x1 - 16;

      function drawCarriers(count, baseY, up, open, radius) {
        var span = Math.max(1, dotEnd - dotStart);
        var fit = Math.max(1, Math.floor(span / 9));
        if (count > fit) count = fit;
        for (var i = 0; i < count; i += 1) {
          var px = dotStart + span * ((i + 0.5) / count);
          var py = baseY + (i % 2) * (up ? -9 : 9);
          if (open) h.dot(ctx, px, py, radius, pal.sheet, pal.beta);
          else h.dot(ctx, px, py, radius, pal.def, null);
        }
      }

      drawCarriers(electronCount, yEc - 8, true, false, 2.8);
      drawCarriers(holeCount, yEv + 9, false, true, 3);

      /* Eg arrow */
      var ax = x0 + (compact ? 19 : 24);
      if (yEc - yEv > 14) {
        arrowY(ctx, ax, yEv, yEc, pal.ink2, 1.2);
        ctx.save();
        ctx.translate(ax - 9, (yEv + yEc) / 2);
        ctx.rotate(-Math.PI / 2);
        h.label(ctx, "Eg = " + h.fmt(m.Eg, 2) + " eV", 0, 0, pal.ink2, compact ? 8.5 : 9.5, "center", "middle", 600);
        ctx.restore();
      }

      /* EF - Ei offset annotation */
      if (Math.abs(c.shown) > 0.005 && Math.abs(yEf - yEi) > 6 && plotW > 190) {
        var bx = x0 + plotW * (compact ? 0.52 : 0.56);
        arrowY(ctx, bx, yEi, yEf, pal.accent, 1.3);
        outlinedText(
          ctx,
          "EF−Ei = " + signed(c.shown, 2) + " eV",
          bx + 6,
          (yEi + yEf) / 2,
          pal.accent,
          pal.sheet,
          compact ? 8.2 : 9.2
        );
      }

      /* right-hand energy labels, nudged apart so EF and Ec can coexist */
      var labels = [
        { E: 0, text: "Ev", color: pal.ink, weight: 700 },
        { E: m.Eg / 2, text: "Ei", color: pal.muted, weight: 600 },
        { E: c.fermi, text: "EF", color: pal.accent, weight: 700 },
        { E: m.Eg, text: "Ec", color: pal.ink, weight: 700 }
      ];
      if (c.ghostVisible) {
        labels.push({ E: c.ghost, text: "EF 300K", color: pal.ink2, weight: 600 });
      }
      labels.sort(function (a, b) { return a.E - b.E; });
      var lastLabelY = plotBottom + 2;
      labels.forEach(function (item) {
        var trueY = Y(item.E);
        var ly = Math.max(padT + 7, Math.min(trueY, lastLabelY - 12));
        item.ly = ly;
        lastLabelY = ly;
      });
      labels.forEach(function (item) {
        h.line(ctx, x1, Y(item.E), x1 + 5, item.ly, pal.ruleStrong, 0.8, null);
        var text = item.text + "  " + h.fmt(item.E, 2) + " eV";
        h.label(ctx, text, x1 + 8, item.ly + 3, item.color, compact ? 8 : 8.8, "left", "alphabetic", item.weight);
      });

      /* captions inside the canvas */
      var typeWord = c.majority === "intrinsic" ? "intrinsic" : (c.majority === "n" ? "n-type" : "p-type");
      h.label(ctx, m.short + " · " + typeWord, x0, 18, pal.ink, compact ? 10.5 : 12, "left", "alphabetic", 700);
      if (plotW > 170) {
        h.label(ctx, "T = " + h.fmt(c.T, 0) + " K", x1, 18, pal.muted, 9.5, "right");
      }
      h.label(
        ctx,
        (state.type === "n" ? "Nd" : "Na") + " = " + sci(c.N) + " cm⁻³",
        x0, 33, pal.accent, compact ? 8.6 : 9.4, "left"
      );
      h.label(ctx, "energy above Ev, eV", x0, hgt - 12, pal.muted, compact ? 8 : 9, "left");
      if (plotW > 190) {
        h.label(ctx, "flat bands · schematic", x1, hgt - 12, pal.muted, 8.2, "right");
      }

      /* readout */
      var majorityText = c.majority === "n"
        ? "electrons (n)"
        : (c.majority === "p" ? "holes (p)" : "intrinsic, n = p");
      h.setReadout(root, [
        ["Material", m.name + " · approx."],
        ["Band gap Eg", h.fmt(m.Eg, 2) + " eV"],
        ["Temperature", h.fmt(c.T, 0) + " K"],
        ["ni (cm⁻³)", sci(c.ni, 2)],
        ["n (cm⁻³)", sci(c.n, 2)],
        ["p (cm⁻³)", sci(c.p, 2)],
        ["EF − Ei", signed(c.shown, 2) + " eV" + (c.clamped ? " · clamped" : "")],
        ["Majority carrier", majorityText]
      ]);

      updateCarriers(carrierHost, c);

      /* status: the teaching, not a debug log */
      var text = m.name + " is " + typeWord + " at " + h.fmt(c.T, 0) + " K";
      if (c.majority === "intrinsic") {
        text += ": the dopant concentration (" + sci(c.N) + " cm⁻³) is below ni (" +
          sci(c.ni) + " cm⁻³), so the extrinsic formula breaks down and n = p = ni. EF sits at Ei.";
      } else {
        text += ": EF is " + h.fmt(Math.abs(c.shown), 2) + " eV " +
          (c.shown >= 0 ? "above" : "below") + " Ei, and the majority density is " +
          sci(c.majority === "n" ? c.n : c.p) + " cm⁻³.";
      }
      text += " Doping moves EF; it does not move Eg, which stays " +
        h.fmt(m.Eg, 2) + " eV in this model.";

      if (Math.abs(c.T - 300) > 1) {
        var ni300 = niAt(m, 300);
        text += " " + (c.T > 300 ? "Heating" : "Cooling") + " from 300 K to " +
          h.fmt(c.T, 0) + " K takes ni from " + sci(ni300) + " to " + sci(c.ni) +
          " cm⁻³";
        if (c.intrinsic) {
          text += "; EF is at Ei in the intrinsic regime.";
        } else {
          text += ", so EF " + (c.T > 300
            ? "moves back toward midgap, toward intrinsic behaviour"
            : "moves toward the band edge, toward more extrinsic behaviour") + ".";
        }
      } else {
        if (c.intrinsic) {
          text += " The crystal is already intrinsic; at 500 K ni reaches " +
            sci(niAt(m, 500)) + " cm⁻³ and EF stays at Ei.";
        } else {
          text += " Raise T and ni grows: at 500 K it reaches " + sci(niAt(m, 500)) +
            " cm⁻³, pulling EF back toward midgap (more intrinsic).";
        }
      }

      if (c.clamped) {
        text += " The model asks for " + signed(c.raw, 2) + " eV, outside the ±Eg/2 = " +
          h.fmt(m.Eg / 2, 2) + " eV window: the diagram pins EF at the band edge and the " +
          "non-degenerate formula no longer applies.";
      } else if (c.degenerate) {
        text += " EF is within about 3kT of the band edge, so Boltzmann statistics are marginal " +
          "(degenerate doping).";
      }
      if (c.ghostVisible) {
        text += " The dashed line is where EF sat at 300 K.";
      } else if (state.ghost && Math.abs(c.T - 300) <= 0.5) {
        text += " The 300 K reference sits on EF at this temperature.";
      }

      h.setStatus(root, text);

      h.setAria(canvas,
        "Band diagram for " + m.name + ", " + typeWord + ", doping " +
        spokenConcentration(c.N) + " per cubic centimetre at " + h.fmt(c.T, 0) +
        " kelvin. Valence band at zero, conduction band at " + h.fmt(m.Eg, 2) +
        " electronvolts, intrinsic level at " + h.fmt(m.Eg / 2, 2) +
        " electronvolts, Fermi level at " + h.fmt(c.fermi, 2) +
        " electronvolts, that is " + h.fmt(Math.abs(c.shown), 2) + " electronvolts " +
        (c.shown >= 0 ? "above" : "below") + " the intrinsic level.");
    }

    function updateCarriers(host, c) {
      if (!host) return;
      host.replaceChildren();

      var title = document.createElement("p");
      title.className = "bandcarrier__title";
      title.textContent = "carrier balance · log scale 10⁰–10²⁰ cm⁻³";
      host.appendChild(title);

      [["n", c.n], ["p", c.p]].forEach(function (entry) {
        var row = document.createElement("div");
        row.className = "bandcarrier__row bandcarrier__row--" + entry[0];

        var tag = document.createElement("span");
        tag.className = "bandcarrier__tag";
        tag.textContent = entry[0];

        var track = document.createElement("span");
        track.className = "bandcarrier__track";

        var fill = document.createElement("span");
        fill.className = "bandcarrier__fill";
        var value = entry[1];
        var decades = isFinite(value) && value > 0 ? Math.log(value) / Math.LN10 : 0;
        var width = h.clamp((decades / 20) * 100, 0.8, 100);
        fill.style.width = width.toFixed(1) + "%";
        track.appendChild(fill);

        var val = document.createElement("span");
        val.className = "bandcarrier__val";
        val.textContent = sci(value, 1);

        row.appendChild(tag);
        row.appendChild(track);
        row.appendChild(val);
        host.appendChild(row);
      });
    }

    /* ---------------- controls ---------------- */

    var matInput = h.addSelect(controls, {
      label: "Material (values ≈ 300 K)",
      value: state.key,
      options: Object.keys(MATERIALS).map(function (k) {
        return {
          value: k,
          label: MATERIALS[k].short + " · Eg ≈ " + MATERIALS[k].Eg.toFixed(2) + " eV"
        };
      }),
      onChange: function (value) {
        state.key = MATERIALS[value] ? value : "si";
        render();
      }
    });

    var typeInput = h.addSelect(controls, {
      label: "Doping type",
      value: state.type,
      options: [
        { value: "n", label: "n-type (donors, Nd)" },
        { value: "p", label: "p-type (acceptors, Na)" }
      ],
      onChange: function (value) {
        state.type = value === "p" ? "p" : "n";
        render();
      }
    });

    var concInput = h.addRange(controls, {
      label: "Dopant concentration (log)",
      min: 12, max: 19, step: 0.02, value: state.logDoping,
      format: function (v) { return sci(Math.pow(10, v), 1) + " cm⁻³"; },
      onInput: function (v) {
        state.logDoping = h.clamp(v, 12, 19);
        render();
      }
    });

    var tempInput = h.addRange(controls, {
      label: "Temperature",
      min: 200, max: 500, step: 1, value: state.T,
      format: function (v) { return h.fmt(v, 0) + " K"; },
      onInput: function (v) {
        state.T = h.clamp(v, 200, 500);
        render();
      }
    });

    var ghostInput = h.addToggle(controls, {
      label: "300 K reference",
      value: state.ghost,
      onChange: function (value) {
        state.ghost = value;
        render();
      }
    });

    h.addButton(controls, {
      label: "Reset", ghost: true,
      onClick: function () {
        state.key = "si";
        state.type = "n";
        state.logDoping = 16;
        state.T = 300;
        state.ghost = false;
        matInput.value = state.key;
        typeInput.value = state.type;
        concInput.value = String(state.logDoping);
        tempInput.value = String(state.T);
        ghostInput.setAttribute("aria-pressed", "false");
        concInput.dispatchEvent(new Event("input"));
        tempInput.dispatchEvent(new Event("input"));
        render();
      }
    });

    h.addHint(root,
      "Model: full ionisation, constant Eg (no Varshni shift), Nc and Nv ∝ T^1.5, " +
      "Boltzmann statistics. Ei is drawn at midgap; the true intrinsic level shifts " +
      "by (kT/2)ln(Nv/Nc), which is neglected here. Carrier dots are qualitative; " +
      "filled = electrons, open = holes.");

    api.onRender(render);
    render();
  }

  api.register("band", init);
  api.init();
})();
