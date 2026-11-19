/* ============================================================
   Interactive CS notes — lab engines
   Vanilla JS. No dependencies. Each engine is scoped to its root.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- small helpers ---------- */

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffleInPlace(items) {
    for (var i = items.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = items[i];
      items[i] = items[j];
      items[j] = tmp;
    }
    return items;
  }

  function uniqueValues(count) {
    var pool = [];
    for (var v = 5; v <= 99; v++) pool.push(v);
    shuffleInPlace(pool);
    return pool.slice(0, count);
  }

  function readStore(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeStore(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* private mode or quota — ignore */
    }
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function setText(node, text) {
    if (node) node.textContent = text;
  }

  function setHTML(node, html) {
    if (node) node.innerHTML = html;
  }

  function fmt(value) {
    return Number(value).toLocaleString("en-US");
  }

  var LAB_LANG = (document.documentElement.lang || "en").toLowerCase();

  function t(en, tr) {
    return LAB_LANG.indexOf("tr") === 0 ? tr : en;
  }

  /* ---------- 1. sorting ---------- */

  function initSorting(root) {
    var barsEl = $("[data-sort-bars]", root);
    var codeEl = $("[data-sort-code]", root);
    var metricsEl = $("[data-sort-metrics]", root);
    var statusEl = $("[data-sort-status]", root);
    var algoEl = $("[data-sort-algo]", root);
    var sizeEl = $("[data-sort-size]", root);
    var sizeOut = $("[data-sort-size-out]", root);
    var speedEl = $("[data-sort-speed]", root);
    var playBtn = $("[data-sort-play]", root);
    var stepBtn = $("[data-sort-step]", root);
    var shuffleBtn = $("[data-sort-shuffle]", root);
    var resetBtn = $("[data-sort-reset]", root);

    if (!barsEl || !codeEl || !algoEl) return;

    var CODE = {
      bubble: [
        "for i = 0 to n-2",
        "  for j = 0 to n-i-2",
        "    if A[j] > A[j+1]",
        "      swap A[j], A[j+1]",
        "  mark A[n-1-i] sorted"
      ],
      selection: [
        "for i = 0 to n-2",
        "  min = i",
        "  for j = i+1 to n-1",
        "    if A[j] < A[min]: min = j",
        "  swap A[i], A[min]",
        "  mark A[i] sorted"
      ],
      insertion: [
        "for i = 1 to n-1",
        "  key = A[i]",
        "  j = i - 1",
        "  while j >= 0 and A[j] > key",
        "    A[j+1] = A[j]",
        "    j = j - 1",
        "  A[j+1] = key",
        "  mark A[0..i] sorted"
      ]
    };

    var n = parseInt(sizeEl ? sizeEl.value : "12", 10) || 12;
    var baseValues = uniqueValues(n);
    var steps = [];
    var index = 0;
    var timer = null;
    var playing = false;
    var bars = [];

    function snapshot(array, opts) {
      return {
        array: array.slice(),
        compare: opts.compare || [],
        swap: opts.swap || [],
        sorted: opts.sorted ? opts.sorted.slice() : [],
        line: opts.line || 1,
        note: opts.note || "",
        comparisons: opts.comparisons || 0,
        swaps: opts.swaps || 0
      };
    }

    function genBubble(values) {
      var a = values.slice();
      var out = [];
      var comparisons = 0;
      var swaps = 0;
      var sorted = [];
      out.push(snapshot(a, {
        line: 1,
        note: t(
          "Start: the whole array is unsorted. Each pass moves the largest remaining value to the right.",
          "Başlangıç: dizi tamamen sırasız. Her geçiş, kalan en büyük değeri sağa doğru taşır."
        ),
        comparisons: comparisons,
        swaps: swaps,
        sorted: sorted
      }));

      for (var i = 0; i < a.length - 1; i++) {
        var swapped = false;
        for (var j = 0; j < a.length - 1 - i; j++) {
          comparisons++;
          out.push(snapshot(a, {
            compare: [j, j + 1],
            line: 2,
            note: t(
              "Compare A[" + j + "]=" + a[j] + " and A[" + (j + 1) + "]=" + a[j + 1] + ".",
              "A[" + j + "]=" + a[j] + " ile A[" + (j + 1) + "]=" + a[j + 1] + " karşılaştırılıyor."
            ),
            comparisons: comparisons,
            swaps: swaps,
            sorted: sorted
          }));
          if (a[j] > a[j + 1]) {
            var tmp = a[j];
            a[j] = a[j + 1];
            a[j + 1] = tmp;
            swaps++;
            out.push(snapshot(a, {
              swap: [j, j + 1],
              line: 4,
              note: t(
                "A[" + j + "] > A[" + (j + 1) + "], so swap. The larger value bubbles one position right.",
                "A[" + j + "] > A[" + (j + 1) + "], bu yüzden yer değiştirilir. Büyük değer bir adım sağa gider."
              ),
              comparisons: comparisons,
              swaps: swaps,
              sorted: sorted
            }));
            swapped = true;
          }
        }
        sorted.push(a.length - 1 - i);
        out.push(snapshot(a, {
          line: 5,
          note: t(
            "Pass " + (i + 1) + " done. A[" + (a.length - 1 - i) + "]=" + a[a.length - 1 - i] + " is now in its final place.",
            (i + 1) + ". geçiş tamam. A[" + (a.length - 1 - i) + "]=" + a[a.length - 1 - i] + " artık son yerinde."
          ),
          comparisons: comparisons,
          swaps: swaps,
          sorted: sorted
        }));
        if (!swapped) {
          sorted = a.map(function (_, k) { return k; });
          out.push(snapshot(a, {
            line: 5,
            note: t(
              "No swaps in this pass: the array is already sorted, so bubble sort can stop early.",
              "Bu geçişte takas yok: dizi zaten sıralı, bubble sort erken durabilir."
            ),
            comparisons: comparisons,
            swaps: swaps,
            sorted: sorted
          }));
          break;
        }
      }

      sorted = a.map(function (_, k) { return k; });
      out.push(snapshot(a, {
        line: 5,
        note: t(
          "Sorted. " + comparisons + " comparisons and " + swaps + " swaps on this input.",
          "Sıralandı. Bu girdide " + comparisons + " karşılaştırma ve " + swaps + " takas yapıldı."
        ),
        comparisons: comparisons,
        swaps: swaps,
        sorted: sorted
      }));
      return out;
    }

    function genSelection(values) {
      var a = values.slice();
      var out = [];
      var comparisons = 0;
      var swaps = 0;
      var sorted = [];
      out.push(snapshot(a, {
        line: 1,
        note: t(
          "Start: the sorted prefix is empty. Each pass selects the smallest remaining value.",
          "Başlangıç: sıralı önek boş. Her geçiş, kalan en küçük değeri seçer."
        ),
        comparisons: comparisons,
        swaps: swaps,
        sorted: sorted
      }));

      for (var i = 0; i < a.length - 1; i++) {
        var min = i;
        out.push(snapshot(a, {
          compare: [min],
          line: 2,
          note: t(
            "Assume A[" + i + "]=" + a[i] + " is the minimum of the unsorted suffix.",
            "Sırasız kısmın en küçüğünün A[" + i + "]=" + a[i] + " olduğunu varsay."
          ),
          comparisons: comparisons,
          swaps: swaps,
          sorted: sorted
        }));
        for (var j = i + 1; j < a.length; j++) {
          comparisons++;
          out.push(snapshot(a, {
            compare: [min, j],
            line: 4,
            note: t(
              "Compare current minimum A[" + min + "]=" + a[min] + " with A[" + j + "]=" + a[j] + ".",
              "Şu anki en küçük A[" + min + "]=" + a[min] + " ile A[" + j + "]=" + a[j] + " karşılaştırılıyor."
            ),
            comparisons: comparisons,
            swaps: swaps,
            sorted: sorted
          }));
          if (a[j] < a[min]) {
            min = j;
            out.push(snapshot(a, {
              compare: [min],
              line: 4,
              note: t(
                "A[" + j + "]=" + a[j] + " is smaller, so it becomes the new minimum.",
                "A[" + j + "]=" + a[j] + " daha küçük; yeni en küçük değer bu olur."
              ),
              comparisons: comparisons,
              swaps: swaps,
              sorted: sorted
            }));
          }
        }
        if (min !== i) {
          var tmp = a[i];
          a[i] = a[min];
          a[min] = tmp;
          swaps++;
          out.push(snapshot(a, {
            swap: [i, min],
            line: 5,
            note: t(
              "Swap the minimum A[" + min + "]=" + a[min] + " into position " + i + ".",
              "En küçük A[" + min + "]=" + a[min] + " değerini " + i + ". konuma taşı."
            ),
            comparisons: comparisons,
            swaps: swaps,
            sorted: sorted
          }));
        }
        sorted.push(i);
        out.push(snapshot(a, {
          line: 6,
          note: t(
            "A[" + i + "]=" + a[i] + " is final. The sorted prefix grows from the left.",
            "A[" + i + "]=" + a[i] + " artık yerinde. Sıralı önek soldan büyür."
          ),
          comparisons: comparisons,
          swaps: swaps,
          sorted: sorted
        }));
      }

      sorted = a.map(function (_, k) { return k; });
      out.push(snapshot(a, {
        line: 6,
        note: t(
          "Sorted. " + comparisons + " comparisons and " + swaps + " swaps. Selection sort always does about n²/2 comparisons.",
          "Sıralandı. " + comparisons + " karşılaştırma ve " + swaps + " takas. Selection sort her zaman yaklaşık n²/2 karşılaştırma yapar."
        ),
        comparisons: comparisons,
        swaps: swaps,
        sorted: sorted
      }));
      return out;
    }

    function genInsertion(values) {
      var a = values.slice();
      var out = [];
      var comparisons = 0;
      var swaps = 0;
      var sorted = [0];
      out.push(snapshot(a, {
        line: 1,
        note: t(
          "Start: a one-element prefix A[0..0] is already sorted.",
          "Başlangıç: tek elemanlı A[0..0] öneki zaten sıralı."
        ),
        comparisons: comparisons,
        swaps: swaps,
        sorted: sorted
      }));

      for (var i = 1; i < a.length; i++) {
        var key = a[i];
        var j = i - 1;
        out.push(snapshot(a, {
          line: 2,
          note: t(
            "Take key = A[" + i + "]=" + key + ". The prefix A[0.." + (i - 1) + "] is sorted.",
            "key = A[" + i + "]=" + key + " alınıyor. A[0.." + (i - 1) + "] öneki sıralı."
          ),
          comparisons: comparisons,
          swaps: swaps,
          sorted: sorted
        }));
        while (j >= 0 && a[j] > key) {
          comparisons++;
          out.push(snapshot(a, {
            compare: [j, j + 1],
            line: 4,
            note: t(
              "A[" + j + "]=" + a[j] + " > key=" + key + ", so shift it right.",
              "A[" + j + "]=" + a[j] + " > key=" + key + ", bu yüzden sağa kaydır."
            ),
            comparisons: comparisons,
            swaps: swaps,
            sorted: sorted
          }));
          a[j + 1] = a[j];
          swaps++;
          out.push(snapshot(a, {
            swap: [j, j + 1],
            line: 5,
            note: t(
              "Shift A[" + j + "] to position " + (j + 1) + ". The hole moves left.",
              "A[" + j + "] değerini " + (j + 1) + ". konuma kaydır. Boşluk sola kayar."
            ),
            comparisons: comparisons,
            swaps: swaps,
            sorted: sorted
          }));
          j--;
        }
        if (j >= 0) {
          comparisons++;
          out.push(snapshot(a, {
            compare: [j, j + 1],
            line: 4,
            note: t(
              "A[" + j + "]=" + a[j] + " <= key=" + key + ", so the while loop stops.",
              "A[" + j + "]=" + a[j] + " <= key=" + key + ", bu yüzden while döngüsü durur."
            ),
            comparisons: comparisons,
            swaps: swaps,
            sorted: sorted
          }));
        }
        a[j + 1] = key;
        swaps++;
        sorted = [];
        for (var k = 0; k <= i; k++) sorted.push(k);
        out.push(snapshot(a, {
          swap: [j + 1],
          line: 7,
          note: t(
            "Insert key=" + key + " at index " + (j + 1) + ". The prefix A[0.." + i + "] is sorted.",
            "key=" + key + " değerini " + (j + 1) + ". indekse yerleştir. A[0.." + i + "] öneki sıralı."
          ),
          comparisons: comparisons,
          swaps: swaps,
          sorted: sorted
        }));
      }

      sorted = a.map(function (_, k) { return k; });
      out.push(snapshot(a, {
        line: 8,
        note: t(
          "Sorted. " + comparisons + " comparisons and " + swaps + " shifts. Best case is O(n); worst case is O(n²).",
          "Sıralandı. " + comparisons + " karşılaştırma ve " + swaps + " kaydırma. En iyi durum O(n), en kötü durum O(n²)."
        ),
        comparisons: comparisons,
        swaps: swaps,
        sorted: sorted
      }));
      return out;
    }

    function generate() {
      var algo = algoEl.value;
      if (algo === "selection") return genSelection(baseValues);
      if (algo === "insertion") return genInsertion(baseValues);
      return genBubble(baseValues);
    }

    function buildBars() {
      barsEl.innerHTML = "";
      bars = [];
      for (var i = 0; i < n; i++) {
        var bar = document.createElement("div");
        bar.className = "lab__bar";
        var label = document.createElement("span");
        bar.appendChild(label);
        barsEl.appendChild(bar);
        bars.push(bar);
      }
    }

    function renderCode() {
      var lines = CODE[algoEl.value] || CODE.bubble;
      codeEl.innerHTML = "";
      lines.forEach(function (line) {
        var li = document.createElement("li");
        li.textContent = line;
        codeEl.appendChild(li);
      });
    }

    function render() {
      var step = steps[index];
      if (!step) return;
      var max = Math.max.apply(null, step.array) || 1;

      if (bars.length !== step.array.length) buildBars();

      for (var i = 0; i < step.array.length; i++) {
        var bar = bars[i];
        var value = step.array[i];
        bar.style.height = Math.max(8, (value / max) * 100) + "%";
        var label = bar.firstChild;
        if (label) label.textContent = value;
        var classes = "lab__bar";
        if (step.compare.indexOf(i) !== -1) classes += " is-compare";
        if (step.swap.indexOf(i) !== -1) classes += " is-swap";
        if (step.sorted.indexOf(i) !== -1) classes += " is-sorted";
        bar.className = classes;
      }

      barsEl.setAttribute("aria-label", t(
        "Array of " + step.array.length + " values: " + step.array.join(", ") + ".",
        step.array.length + " elemanlı dizi: " + step.array.join(", ") + "."
      ));

      if (codeEl.children.length !== (CODE[algoEl.value] || []).length) renderCode();
      Array.prototype.forEach.call(codeEl.children, function (li, i) {
        li.classList.toggle("is-active", i + 1 === step.line);
      });

      setHTML(metricsEl,
        "<span>" + t("Step", "Adım") + " <strong>" + (index + 1) + " / " + steps.length + "</strong></span>" +
        "<span>" + t("Comparisons", "Karşılaştırma") + " <strong>" + step.comparisons + "</strong></span>" +
        "<span>" + t("Swaps / shifts", "Takas / kaydırma") + " <strong>" + step.swaps + "</strong></span>"
      );

      setText(statusEl, step.note + (index < steps.length - 1
        ? t(" Press Step to continue.", " Devam etmek için Adım'a bas.")
        : t(" Trace complete.", " İz tamamlandı.")));

      if (stepBtn) stepBtn.disabled = index >= steps.length - 1;
      if (playBtn) {
        playBtn.textContent = playing ? t("Pause", "Duraklat") : t("Play", "Oynat");
        playBtn.classList.toggle("is-playing", playing);
      }
    }

    function stop() {
      playing = false;
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
      if (playBtn) {
        playBtn.textContent = t("Play", "Oynat");
        playBtn.classList.remove("is-playing");
      }
    }

    function reset(regenerate) {
      stop();
      if (regenerate) steps = generate();
      index = 0;
      render();
    }

    function advance() {
      if (index >= steps.length - 1) {
        stop();
        return;
      }
      index++;
      render();
      if (index >= steps.length - 1) stop();
    }

    function play() {
      if (playing) {
        stop();
        render();
        return;
      }
      if (index >= steps.length - 1) index = 0;
      playing = true;
      render();
      var speed = speedEl ? parseInt(speedEl.value, 10) : 3;
      var delay = [900, 650, 430, 270, 150][clamp(speed - 1, 0, 4)];
      timer = window.setInterval(advance, prefersReducedMotion() ? Math.max(80, delay / 2) : delay);
    }

    function setSize() {
      n = clamp(parseInt(sizeEl.value, 10) || 12, 8, 24);
      if (sizeOut) sizeOut.textContent = String(n);
      baseValues = uniqueValues(n);
      steps = generate();
      index = 0;
      stop();
      buildBars();
      render();
    }

    if (sizeEl) sizeEl.addEventListener("input", setSize);
    if (algoEl) algoEl.addEventListener("change", function () { reset(true); });
    if (stepBtn) stepBtn.addEventListener("click", function () { stop(); advance(); });
    if (playBtn) playBtn.addEventListener("click", play);
    if (shuffleBtn) shuffleBtn.addEventListener("click", function () {
      baseValues = uniqueValues(n);
      reset(true);
    });
    if (resetBtn) resetBtn.addEventListener("click", function () { reset(true); });

    buildBars();
    steps = generate();
    index = 0;
    renderCode();
    render();
  }

  /* ---------- 2. binary search ---------- */

  function initBinary(root) {
    var cellsEl = $("[data-bin-cells]", root);
    var codeEl = $("[data-bin-code]", root);
    var metricsEl = $("[data-bin-metrics]", root);
    var statusEl = $("[data-bin-status]", root);
    var targetEl = $("[data-bin-target]", root);
    var searchBtn = $("[data-bin-search]", root);
    var stepBtn = $("[data-bin-step]", root);
    var playBtn = $("[data-bin-play]", root);
    var randomBtn = $("[data-bin-random]", root);
    var resetBtn = $("[data-bin-reset]", root);

    if (!cellsEl || !codeEl) return;

    var ARRAY = [3, 8, 12, 17, 21, 26, 31, 38, 44, 51, 59, 66, 72, 81, 93];
    var CODE = [
      "low = 0; high = n - 1",
      "while low <= high",
      "  mid = floor((low + high) / 2)",
      "  if A[mid] == target: return mid",
      "  else if A[mid] < target: low = mid + 1",
      "  else: high = mid - 1",
      "return not found (insert at low)"
    ];

    var steps = [];
    var index = 0;
    var timer = null;
    var playing = false;
    var cells = [];

    function generate(target) {
      var out = [];
      var low = 0;
      var high = ARRAY.length - 1;
      var comparisons = 0;
      out.push({
        low: low,
        high: high,
        mid: -1,
        line: 1,
        comparisons: comparisons,
        found: -1,
        done: false,
        note: "Search for " + target + " in a sorted array. The answer must lie in [0, " + (ARRAY.length - 1) + "]."
      });

      while (low <= high) {
        var mid = Math.floor((low + high) / 2);
        comparisons++;
        out.push({
          low: low,
          high: high,
          mid: mid,
          line: 3,
          comparisons: comparisons,
          found: -1,
          done: false,
          note: "mid = floor((" + low + " + " + high + ") / 2) = " + mid + ". Probe A[" + mid + "] = " + ARRAY[mid] + "."
        });
        if (ARRAY[mid] === target) {
          out.push({
            low: low,
            high: high,
            mid: mid,
            line: 4,
            comparisons: comparisons,
            found: mid,
            done: true,
            note: "A[" + mid + "] == " + target + ". Found at index " + mid + " after " + comparisons + " comparison" + (comparisons === 1 ? "" : "s") + "."
          });
          return out;
        }
        if (ARRAY[mid] < target) {
          low = mid + 1;
          out.push({
            low: low,
            high: high,
            mid: mid,
            line: 5,
            comparisons: comparisons,
            found: -1,
            done: false,
            note: "A[" + mid + "] = " + ARRAY[mid] + " < " + target + ", so discard the left half. New range [" + low + ", " + high + "]."
          });
        } else {
          high = mid - 1;
          out.push({
            low: low,
            high: high,
            mid: mid,
            line: 6,
            comparisons: comparisons,
            found: -1,
            done: false,
            note: "A[" + mid + "] = " + ARRAY[mid] + " > " + target + ", so discard the right half. New range [" + low + ", " + high + "]."
          });
        }
      }

      out.push({
        low: low,
        high: high,
        mid: -1,
        line: 7,
        comparisons: comparisons,
        found: -1,
        done: true,
        note: "Range is empty. " + target + " is not in the array; it would be inserted at index " + low + "."
      });
      return out;
    }

    function buildCells() {
      cellsEl.innerHTML = "";
      cells = [];
      ARRAY.forEach(function (value, i) {
        var cell = document.createElement("div");
        cell.className = "lab__cell";
        var marker = document.createElement("span");
        marker.className = "marker";
        var text = document.createElement("span");
        text.textContent = value;
        var idx = document.createElement("span");
        idx.className = "idx";
        idx.textContent = i;
        cell.appendChild(marker);
        cell.appendChild(text);
        cell.appendChild(idx);
        cellsEl.appendChild(cell);
        cells.push(cell);
      });
    }

    function renderCode() {
      codeEl.innerHTML = "";
      CODE.forEach(function (line) {
        var li = document.createElement("li");
        li.textContent = line;
        codeEl.appendChild(li);
      });
    }

    function render() {
      var step = steps[index];
      if (!step) return;
      var target = parseInt(targetEl ? targetEl.value : "38", 10);

      for (var i = 0; i < ARRAY.length; i++) {
        var cell = cells[i];
        var classes = "lab__cell";
        var inRange = i >= step.low && i <= step.high;
        if (!inRange) classes += " is-out";
        else classes += " is-in";
        if (i === step.mid) classes += " is-mid";
        if (i === step.found) classes += " is-found";
        if (ARRAY[i] === target) classes += " is-target";
        cell.className = classes;

        var labels = [];
        if (i === step.low) labels.push("low");
        if (i === step.high) labels.push("high");
        if (i === step.mid) labels.push("mid");
        cell.firstChild.textContent = labels.join("·");
        cell.setAttribute("aria-label", "Index " + i + ", value " + ARRAY[i] + (labels.length ? ", " + labels.join(", ") : "") + ".");
      }

      cellsEl.setAttribute("aria-label", "Sorted array of " + ARRAY.length + " values: " + ARRAY.join(", ") + ". Current range " + step.low + " to " + step.high + ".");

      Array.prototype.forEach.call(codeEl.children, function (li, i) {
        li.classList.toggle("is-active", i + 1 === step.line);
      });

      setHTML(metricsEl,
        "<span>Step <strong>" + (index + 1) + " / " + steps.length + "</strong></span>" +
        "<span>Range <strong>[" + step.low + ", " + step.high + "]</strong></span>" +
        "<span>Comparisons <strong>" + step.comparisons + "</strong></span>"
      );

      setText(statusEl, step.note + (index < steps.length - 1 ? " Press Step to continue." : " Trace complete."));

      if (stepBtn) stepBtn.disabled = index >= steps.length - 1;
      if (playBtn) {
        playBtn.textContent = playing ? "Pause" : "Play";
        playBtn.classList.toggle("is-playing", playing);
      }
    }

    function stop() {
      playing = false;
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
      if (playBtn) {
        playBtn.textContent = "Play";
        playBtn.classList.remove("is-playing");
      }
    }

    function advance() {
      if (index >= steps.length - 1) {
        stop();
        return;
      }
      index++;
      render();
      if (index >= steps.length - 1) stop();
    }

    function play() {
      if (playing) {
        stop();
        render();
        return;
      }
      if (index >= steps.length - 1) index = 0;
      playing = true;
      render();
      timer = window.setInterval(advance, prefersReducedMotion() ? 400 : 850);
    }

    function search() {
      var target = targetEl ? parseInt(targetEl.value, 10) : 38;
      if (isNaN(target)) target = 38;
      if (targetEl) targetEl.value = String(target);
      stop();
      steps = generate(target);
      index = 0;
      render();
    }

    if (searchBtn) searchBtn.addEventListener("click", search);
    if (stepBtn) stepBtn.addEventListener("click", function () { stop(); advance(); });
    if (playBtn) playBtn.addEventListener("click", play);
    if (resetBtn) resetBtn.addEventListener("click", search);
    if (randomBtn) randomBtn.addEventListener("click", function () {
      var useMissing = Math.random() < 0.25;
      var value;
      if (useMissing) {
        value = randInt(0, 100);
        while (ARRAY.indexOf(value) !== -1) value = randInt(0, 100);
      } else {
        value = ARRAY[randInt(0, ARRAY.length - 1)];
      }
      if (targetEl) targetEl.value = String(value);
      search();
    });
    if (targetEl) {
      targetEl.addEventListener("keydown", function (event) {
        if (event.key === "Enter") search();
      });
    }

    buildCells();
    renderCode();
    search();
  }

  /* ---------- 3. graph traversal ---------- */

  function initGraph(root) {
    var svg = $("[data-graph-svg]", root);
    var modeEl = $("[data-graph-mode]", root);
    var startEl = $("[data-graph-start]", root);
    var playBtn = $("[data-graph-play]", root);
    var stepBtn = $("[data-graph-step]", root);
    var resetBtn = $("[data-graph-reset]", root);
    var frontierEl = $("[data-graph-frontier]", root);
    var metricsEl = $("[data-graph-metrics]", root);
    var codeEl = $("[data-graph-code]", root);
    var statusEl = $("[data-graph-status]", root);

    if (!svg || !modeEl || !startEl) return;

    var NODES = {
      A: { x: 60, y: 170 },
      B: { x: 180, y: 80 },
      C: { x: 180, y: 260 },
      D: { x: 310, y: 40 },
      E: { x: 310, y: 125 },
      F: { x: 310, y: 215 },
      G: { x: 310, y: 300 },
      H: { x: 460, y: 170 },
      I: { x: 575, y: 170 }
    };

    var EDGES = [
      ["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"],
      ["C", "F"], ["C", "G"], ["D", "H"], ["E", "H"],
      ["F", "H"], ["G", "I"], ["H", "I"]
    ];

    var ADJ = {};
    Object.keys(NODES).forEach(function (key) { ADJ[key] = []; });
    EDGES.forEach(function (edge) {
      ADJ[edge[0]].push(edge[1]);
      ADJ[edge[1]].push(edge[0]);
    });

    var CODE = {
      bfs: [
        "queue = [start]",
        "while queue is not empty",
        "  u = queue.dequeue()",
        "  for each v in adj[u]",
        "    if v not visited: queue.enqueue(v)"
      ],
      dfs: [
        "stack = [start]",
        "while stack is not empty",
        "  u = stack.pop()",
        "  if u visited: continue",
        "  visit u",
        "  for each v in adj[u] reversed",
        "    if v not visited: stack.push(v)"
      ]
    };

    var steps = [];
    var index = 0;
    var timer = null;
    var playing = false;

    function edgeKey(a, b) {
      return [a, b].sort().join("-");
    }

    function genBFS(start) {
      var out = [];
      var queue = [start];
      var visited = {};
      var order = [];
      visited[start] = true;
      out.push({
        frontier: queue.slice(),
        frontierType: "queue",
        visited: Object.keys(visited),
        current: null,
        activeEdge: null,
        order: order.slice(),
        line: 1,
        done: false,
        note: "Put start " + start + " in the queue. BFS explores in first-in, first-out order."
      });

      while (queue.length) {
        var cur = queue.shift();
        order.push(cur);
        out.push({
          frontier: queue.slice(),
          frontierType: "queue",
          visited: Object.keys(visited),
          current: cur,
          activeEdge: null,
          order: order.slice(),
          line: 3,
          done: false,
          note: "Dequeue " + cur + ". It is now visited; its neighbours will be discovered next."
        });

        var neighbours = ADJ[cur];
        for (var i = 0; i < neighbours.length; i++) {
          var nb = neighbours[i];
          if (!visited[nb]) {
            visited[nb] = true;
            queue.push(nb);
            out.push({
              frontier: queue.slice(),
              frontierType: "queue",
              visited: Object.keys(visited),
              current: cur,
              activeEdge: [cur, nb],
              order: order.slice(),
              line: 5,
              done: false,
              note: "Discover " + nb + " from " + cur + "; enqueue it. The frontier is the queue."
            });
          }
        }
      }

      out.push({
        frontier: [],
        frontierType: "queue",
        visited: Object.keys(visited),
        current: null,
        activeEdge: null,
        order: order.slice(),
        line: 2,
        done: true,
        note: "Queue empty. BFS order: " + order.join(" → ") + "."
      });
      return out;
    }

    function genDFS(start) {
      var out = [];
      var stack = [start];
      var visited = {};
      var order = [];
      out.push({
        frontier: stack.slice(),
        frontierType: "stack",
        visited: Object.keys(visited),
        current: null,
        activeEdge: null,
        order: order.slice(),
        line: 1,
        done: false,
        note: "Put start " + start + " on the stack. DFS explores in last-in, first-out order."
      });

      while (stack.length) {
        var cur = stack.pop();
        if (visited[cur]) continue;
        visited[cur] = true;
        order.push(cur);
        out.push({
          frontier: stack.slice(),
          frontierType: "stack",
          visited: Object.keys(visited),
          current: cur,
          activeEdge: null,
          order: order.slice(),
          line: 5,
          done: false,
          note: "Pop " + cur + " and visit it. Push its unvisited neighbours; the last one pushed is explored next."
        });

        var neighbours = ADJ[cur];
        for (var i = neighbours.length - 1; i >= 0; i--) {
          var nb = neighbours[i];
          if (!visited[nb] && stack.indexOf(nb) === -1) {
            stack.push(nb);
            out.push({
              frontier: stack.slice(),
              frontierType: "stack",
              visited: Object.keys(visited),
              current: cur,
              activeEdge: [cur, nb],
              order: order.slice(),
              line: 7,
              done: false,
              note: "Push " + nb + " from " + cur + ". It sits on top of the stack and will be explored first."
            });
          }
        }
      }

      out.push({
        frontier: [],
        frontierType: "stack",
        visited: Object.keys(visited),
        current: null,
        activeEdge: null,
        order: order.slice(),
        line: 2,
        done: true,
        note: "Stack empty. DFS order: " + order.join(" → ") + "."
      });
      return out;
    }

    function buildGraph() {
      svg.innerHTML = "";
      EDGES.forEach(function (edge) {
        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", NODES[edge[0]].x);
        line.setAttribute("y1", NODES[edge[0]].y);
        line.setAttribute("x2", NODES[edge[1]].x);
        line.setAttribute("y2", NODES[edge[1]].y);
        line.setAttribute("class", "graph-edge");
        line.setAttribute("data-edge", edgeKey(edge[0], edge[1]));
        svg.appendChild(line);
      });
      Object.keys(NODES).forEach(function (key) {
        var group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute("class", "graph-node");
        group.setAttribute("data-node", key);
        var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", NODES[key].x);
        circle.setAttribute("cy", NODES[key].y);
        circle.setAttribute("r", 20);
        var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", NODES[key].x);
        text.setAttribute("y", NODES[key].y);
        text.textContent = key;
        group.appendChild(circle);
        group.appendChild(text);
        svg.appendChild(group);
      });
    }

    function renderCode() {
      var lines = CODE[modeEl.value] || CODE.bfs;
      codeEl.innerHTML = "";
      lines.forEach(function (line) {
        var li = document.createElement("li");
        li.textContent = line;
        codeEl.appendChild(li);
      });
    }

    function render() {
      var step = steps[index];
      if (!step) return;

      $$(".graph-node", svg).forEach(function (node) {
        var key = node.getAttribute("data-node");
        var classes = "graph-node";
        if (step.visited.indexOf(key) !== -1) classes += " is-visited";
        if (step.frontier.indexOf(key) !== -1) classes += " is-frontier";
        if (step.current === key) classes += " is-current";
        node.setAttribute("class", classes);
      });

      $$(".graph-edge", svg).forEach(function (edge) {
        var active = step.activeEdge && edge.getAttribute("data-edge") === edgeKey(step.activeEdge[0], step.activeEdge[1]);
        edge.setAttribute("class", active ? "graph-edge is-active" : "graph-edge");
      });

      svg.setAttribute("aria-label",
        "Graph traversal. Visited: " + (step.order.length ? step.order.join(", ") : "none") +
        ". Frontier: " + (step.frontier.length ? step.frontier.join(", ") : "empty") +
        ". Current: " + (step.current || "none") + "."
      );

      frontierEl.innerHTML = "";
      var label = document.createElement("span");
      label.className = "chip chip--empty";
      label.textContent = step.frontierType + ":";
      frontierEl.appendChild(label);
      if (!step.frontier.length) {
        var empty = document.createElement("span");
        empty.className = "chip chip--empty";
        empty.textContent = "empty";
        frontierEl.appendChild(empty);
      } else {
        step.frontier.forEach(function (key) {
          var chip = document.createElement("span");
          chip.className = "chip chip--frontier";
          chip.textContent = key;
          frontierEl.appendChild(chip);
        });
      }

      setHTML(metricsEl,
        "<span>Visited <strong>" + step.order.length + "</strong></span>" +
        "<span>Frontier <strong>" + step.frontier.length + "</strong></span>" +
        "<span>Order <strong>" + (step.order.length ? step.order.join(" → ") : "—") + "</strong></span>"
      );

      Array.prototype.forEach.call(codeEl.children, function (li, i) {
        li.classList.toggle("is-active", i + 1 === step.line);
      });

      setText(statusEl, step.note + (index < steps.length - 1 ? " Press Step to continue." : " Trace complete."));

      if (stepBtn) stepBtn.disabled = index >= steps.length - 1;
      if (playBtn) {
        playBtn.textContent = playing ? "Pause" : "Play";
        playBtn.classList.toggle("is-playing", playing);
      }
    }

    function stop() {
      playing = false;
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
      if (playBtn) {
        playBtn.textContent = "Play";
        playBtn.classList.remove("is-playing");
      }
    }

    function advance() {
      if (index >= steps.length - 1) {
        stop();
        return;
      }
      index++;
      render();
      if (index >= steps.length - 1) stop();
    }

    function play() {
      if (playing) {
        stop();
        render();
        return;
      }
      if (index >= steps.length - 1) index = 0;
      playing = true;
      render();
      timer = window.setInterval(advance, prefersReducedMotion() ? 450 : 900);
    }

    function reset() {
      stop();
      var start = startEl.value || "A";
      steps = modeEl.value === "dfs" ? genDFS(start) : genBFS(start);
      index = 0;
      renderCode();
      render();
    }

    if (modeEl) modeEl.addEventListener("change", reset);
    if (startEl) startEl.addEventListener("change", reset);
    if (stepBtn) stepBtn.addEventListener("click", function () { stop(); advance(); });
    if (playBtn) playBtn.addEventListener("click", play);
    if (resetBtn) resetBtn.addEventListener("click", reset);

    buildGraph();
    reset();
  }

  /* ---------- 4. binary search tree ---------- */

  function initBST(root) {
    var svg = $("[data-bst-svg]", root);
    var valueEl = $("[data-bst-value]", root);
    var insertBtn = $("[data-bst-insert]", root);
    var searchBtn = $("[data-bst-search]", root);
    var randomBtn = $("[data-bst-random]", root);
    var sortedBtn = $("[data-bst-sorted]", root);
    var resetBtn = $("[data-bst-reset]", root);
    var traversalsEl = $("[data-bst-traversals]", root);
    var statusEl = $("[data-bst-status]", root);

    if (!svg) return;

    var rootNode = null;
    var path = [];
    var foundValue = null;
    var missingValue = null;

    function node(value) {
      return { value: value, left: null, right: null };
    }

    function resetTree() {
      rootNode = null;
      [50, 30, 70, 20, 40, 60, 80].forEach(function (value) {
        rootNode = insertValue(rootNode, value).root;
      });
      path = [];
      foundValue = null;
      missingValue = null;
    }

    function insertValue(tree, value) {
      if (!tree) return { root: node(value), path: [value], inserted: true, duplicate: false };
      var trail = [];
      var cur = tree;
      while (cur) {
        trail.push(cur.value);
        if (value === cur.value) {
          return { root: tree, path: trail, inserted: false, duplicate: true };
        }
        if (value < cur.value) {
          if (!cur.left) {
            cur.left = node(value);
            trail.push(value);
            return { root: tree, path: trail, inserted: true, duplicate: false };
          }
          cur = cur.left;
        } else {
          if (!cur.right) {
            cur.right = node(value);
            trail.push(value);
            return { root: tree, path: trail, inserted: true, duplicate: false };
          }
          cur = cur.right;
        }
      }
      return { root: tree, path: trail, inserted: false, duplicate: false };
    }

    function searchValue(tree, value) {
      var trail = [];
      var cur = tree;
      while (cur) {
        trail.push(cur.value);
        if (value === cur.value) return { found: true, path: trail };
        cur = value < cur.value ? cur.left : cur.right;
      }
      return { found: false, path: trail };
    }

    function collect(tree) {
      var nodes = [];
      var edges = [];
      var order = 0;
      var maxDepth = 0;

      function walk(current, depth, parent) {
        if (!current) return;
        walk(current.left, depth + 1, current);
        current._order = order++;
        current._depth = depth;
        current._parent = parent;
        maxDepth = Math.max(maxDepth, depth);
        nodes.push(current);
        walk(current.right, depth + 1, current);
      }

      walk(tree, 0, null);
      var count = nodes.length;
      var width = 800;
      var margin = 42;
      nodes.forEach(function (current) {
        current._x = count <= 1 ? width / 2 : margin + (current._order / (count - 1)) * (width - 2 * margin);
        current._y = 36 + current._depth * 62;
      });
      nodes.forEach(function (current) {
        if (current._parent) {
          edges.push({
            x1: current._parent._x,
            y1: current._parent._y,
            x2: current._x,
            y2: current._y
          });
        }
      });
      return {
        nodes: nodes,
        edges: edges,
        width: width,
        height: Math.max(260, 36 + maxDepth * 62 + 70)
      };
    }

    function traverse(tree, order, out) {
      if (!tree) return;
      if (order === "pre") out.push(tree.value);
      traverse(tree.left, order, out);
      if (order === "in") out.push(tree.value);
      traverse(tree.right, order, out);
      if (order === "post") out.push(tree.value);
    }

    function render() {
      if (!rootNode) {
        svg.innerHTML = "";
        setText(statusEl, "Tree is empty. Insert a value to begin.");
        return;
      }
      var layout = collect(rootNode);
      svg.setAttribute("viewBox", "0 0 " + layout.width + " " + layout.height);
      svg.innerHTML = "";

      layout.edges.forEach(function (edge) {
        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", edge.x1);
        line.setAttribute("y1", edge.y1);
        line.setAttribute("x2", edge.x2);
        line.setAttribute("y2", edge.y2);
        line.setAttribute("class", "bst-edge");
        svg.appendChild(line);
      });

      layout.nodes.forEach(function (current) {
        var group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        var classes = "bst-node";
        if (path.indexOf(current.value) !== -1) classes += " is-path";
        if (foundValue === current.value) classes += " is-found";
        if (missingValue === current.value) classes += " is-missing";
        group.setAttribute("class", classes);
        var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", current._x);
        circle.setAttribute("cy", current._y);
        circle.setAttribute("r", 17);
        var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", current._x);
        text.setAttribute("y", current._y);
        text.textContent = current.value;
        group.appendChild(circle);
        group.appendChild(text);
        svg.appendChild(group);
      });

      var inOrder = [];
      var preOrder = [];
      var postOrder = [];
      traverse(rootNode, "in", inOrder);
      traverse(rootNode, "pre", preOrder);
      traverse(rootNode, "post", postOrder);
      var height = layout.nodes.reduce(function (max, current) {
        return Math.max(max, current._depth + 1);
      }, 0);

      setHTML(traversalsEl,
        "<span>Nodes <strong>" + layout.nodes.length + "</strong></span>" +
        "<span>Height <strong>" + height + "</strong></span>" +
        "<span>Inorder <strong>" + inOrder.join(" · ") + "</strong></span>" +
        "<span>Preorder <strong>" + preOrder.join(" · ") + "</strong></span>" +
        "<span>Postorder <strong>" + postOrder.join(" · ") + "</strong></span>"
      );

      svg.setAttribute("aria-label",
        "Binary search tree with " + layout.nodes.length + " nodes and height " + height +
        ". Inorder traversal: " + inOrder.join(", ") + "."
      );
    }

    function currentValue() {
      var value = valueEl ? parseInt(valueEl.value, 10) : 50;
      if (isNaN(value)) value = 50;
      value = clamp(value, 1, 99);
      if (valueEl) valueEl.value = String(value);
      return value;
    }

    function insert() {
      var value = currentValue();
      var result = insertValue(rootNode, value);
      rootNode = result.root;
      path = result.path;
      foundValue = null;
      missingValue = null;
      if (result.duplicate) {
        setText(statusEl, value + " is already in the tree. A BST keeps one copy unless you define a duplicate policy.");
      } else {
        setText(statusEl, "Inserted " + value + ". The highlighted path is the comparison history: " + path.join(" → ") + ".");
      }
      render();
    }

    function search() {
      var value = currentValue();
      var result = searchValue(rootNode, value);
      path = result.path;
      foundValue = result.found ? value : null;
      missingValue = result.found ? null : (result.path.length ? result.path[result.path.length - 1] : null);
      if (result.found) {
        setText(statusEl, "Found " + value + " after " + result.path.length + " comparison" + (result.path.length === 1 ? "" : "s") + ". Path: " + path.join(" → ") + ".");
      } else {
        setText(statusEl, value + " is not in the tree. The search stopped at " + (missingValue === null ? "the root" : missingValue) + "; a new node would be attached there.");
      }
      render();
    }

    function randomInsert() {
      var value = randInt(1, 99);
      if (valueEl) valueEl.value = String(value);
      insert();
    }

    function sortedRun() {
      rootNode = null;
      path = [];
      foundValue = null;
      missingValue = null;
      [10, 20, 30, 40, 50, 60, 70].forEach(function (value) {
        rootNode = insertValue(rootNode, value).root;
      });
      setText(statusEl, "Inserted 10, 20, 30, 40, 50, 60, 70 in sorted order. Every key goes right: the tree is a chain of height 7, and search degrades to O(n).");
      render();
    }

    if (insertBtn) insertBtn.addEventListener("click", insert);
    if (searchBtn) searchBtn.addEventListener("click", search);
    if (randomBtn) randomBtn.addEventListener("click", randomInsert);
    if (sortedBtn) sortedBtn.addEventListener("click", sortedRun);
    if (resetBtn) resetBtn.addEventListener("click", function () {
      resetTree();
      setText(statusEl, "Reset to a balanced example: 50, 30, 70, 20, 40, 60, 80.");
      render();
    });
    if (valueEl) {
      valueEl.addEventListener("keydown", function (event) {
        if (event.key === "Enter") insert();
      });
    }

    resetTree();
    setText(statusEl, "Balanced example: 50, 30, 70, 20, 40, 60, 80. Insert or search to see the comparison path.");
    render();
  }

  /* ---------- 5. growth rates ---------- */

  function initGrowth(root) {
    var canvas = $("[data-growth-canvas]", root);
    var nEl = $("[data-growth-n]", root);
    var nOut = $("[data-growth-n-out]", root);
    var logEl = $("[data-growth-log]", root);
    var tableEl = $("[data-growth-table] tbody", root);
    var statusEl = $("[data-growth-status]", root);

    if (!canvas || !nEl) return;

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var FUNCTIONS = [
      { name: "O(1)", color: "--chart-1", fn: function () { return 1; } },
      { name: "O(log n)", color: "--chart-2", fn: function (n) { return Math.max(0, Math.log2(n)); } },
      { name: "O(n)", color: "--chart-3", fn: function (n) { return n; } },
      { name: "O(n log n)", color: "--chart-4", fn: function (n) { return n * Math.log2(n + 1); } },
      { name: "O(n²)", color: "--chart-5", fn: function (n) { return n * n; } }
    ];

    function cssColor(name) {
      var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return value || "#555";
    }

    function draw() {
      var n = clamp(parseInt(nEl.value, 10) || 32, 1, 64);
      if (nOut) nOut.textContent = String(n);
      var logScale = logEl ? logEl.checked : true;

      var W = 1200;
      var H = 640;
      canvas.width = W;
      canvas.height = H;
      var margin = { left: 78, right: 28, top: 58, bottom: 58 };
      var plotW = W - margin.left - margin.right;
      var plotH = H - margin.top - margin.bottom;
      var maxValue = n * n;
      var maxY = logScale ? Math.log10(maxValue + 1) : maxValue;

      ctx.clearRect(0, 0, W, H);
      ctx.font = "500 20px 'IBM Plex Sans', system-ui, sans-serif";
      ctx.fillStyle = cssColor("--ink-2");
      ctx.strokeStyle = cssColor("--rule");
      ctx.lineWidth = 1;

      function xFor(value) {
        return margin.left + (n <= 1 ? plotW / 2 : ((value - 1) / (n - 1)) * plotW);
      }

      function yFor(value) {
        var v = logScale ? Math.log10(value + 1) : value;
        return margin.top + plotH - (maxY === 0 ? 0 : (v / maxY) * plotH);
      }

      /* grid + y labels */
      var ticks = logScale ? [1, 10, 100, 1000, 10000, 100000] : [0, 0.25, 0.5, 0.75, 1].map(function (t) { return Math.round(t * maxValue); });
      ticks.forEach(function (tick) {
        if (tick > maxValue * 1.2 && logScale) return;
        var y = yFor(tick);
        if (y < margin.top - 1 || y > margin.top + plotH + 1) return;
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + plotW, y);
        ctx.strokeStyle = cssColor("--rule");
        ctx.stroke();
        ctx.fillStyle = cssColor("--muted");
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(fmt(tick), margin.left - 12, y);
      });

      /* axes */
      ctx.beginPath();
      ctx.moveTo(margin.left, margin.top);
      ctx.lineTo(margin.left, margin.top + plotH);
      ctx.lineTo(margin.left + plotW, margin.top + plotH);
      ctx.strokeStyle = cssColor("--rule-strong");
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = cssColor("--muted");
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("n", margin.left + plotW / 2, margin.top + plotH + 28);
      ctx.save();
      ctx.translate(24, margin.top + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(logScale ? "operations (log scale)" : "operations", 0, 0);
      ctx.restore();

      /* curves */
      FUNCTIONS.forEach(function (fn) {
        ctx.beginPath();
        for (var x = 1; x <= n; x++) {
          var y = yFor(fn.fn(x));
          if (x === 1) ctx.moveTo(xFor(x), y);
          else ctx.lineTo(xFor(x), y);
        }
        ctx.strokeStyle = cssColor(fn.color);
        ctx.lineWidth = 4;
        ctx.lineJoin = "round";
        ctx.stroke();
      });

      /* legend */
      var legendY = 24;
      var legendX = margin.left;
      FUNCTIONS.forEach(function (fn) {
        ctx.fillStyle = cssColor(fn.color);
        ctx.fillRect(legendX, legendY - 7, 22, 14);
        ctx.fillStyle = cssColor("--ink-2");
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(fn.name, legendX + 30, legendY);
        legendX += 190;
      });

      /* table */
      if (tableEl) {
        tableEl.innerHTML = "";
        FUNCTIONS.forEach(function (fn) {
          var tr = document.createElement("tr");
          var name = document.createElement("td");
          name.textContent = fn.name;
          var value = document.createElement("td");
          var raw = fn.fn(n);
          value.textContent = raw >= 1000 ? fmt(Math.round(raw)) : (Math.round(raw * 10) / 10).toString();
          tr.appendChild(name);
          tr.appendChild(value);
          tableEl.appendChild(tr);
        });
      }

      var summary = "At n = " + n + ": " + FUNCTIONS.map(function (fn) {
        return fn.name + " ≈ " + (Math.round(fn.fn(n) * 10) / 10);
      }).join(", ") + ".";
      canvas.setAttribute("aria-label", "Growth-rate chart. " + summary);
      setText(statusEl, summary + (logScale ? " The y-axis is logarithmic, so small functions remain visible." : " The y-axis is linear, so the quadratic curve dominates."));
    }

    if (nEl) nEl.addEventListener("input", draw);
    if (logEl) logEl.addEventListener("change", draw);

    if (window.MutationObserver) {
      var observer = new MutationObserver(draw);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    }

    draw();
  }

  /* ---------- 6. retrieval quiz ---------- */

  function initQuiz(root) {
    var questionsEl = $("[data-quiz-questions]", root);
    var progressEl = $("[data-quiz-progress]", root);
    var scoreEl = $("[data-quiz-score]", root);
    var resetBtn = $("[data-quiz-reset]", root);
    var retryBtn = $("[data-quiz-retry]", root);

    if (!questionsEl) return;

    var QUESTIONS = [
      {
        prompt: "After one complete pass of bubble sort (ascending), what is guaranteed?",
        options: [
          "The smallest element is first.",
          "The largest element is last.",
          "The array is fully sorted.",
          "The median is in its final place."
        ],
        answer: 1,
        explain: "Each pass bubbles the largest remaining value to the right. Only the last position of that pass is guaranteed; the rest of the array may still be unsorted."
      },
      {
        prompt: "Binary search requires which precondition?",
        options: [
          "A hash function",
          "A sorted sequence",
          "A balanced tree",
          "All elements distinct"
        ],
        answer: 1,
        explain: "The discard argument depends on order: if A[mid] < target, every element left of mid is also < target. Duplicates are allowed if you define which occurrence to return."
      },
      {
        prompt: "About how many comparisons does binary search need in the worst case for n = 1,024?",
        options: [
          "About 10",
          "About 32",
          "About 512",
          "Exactly 1,024"
        ],
        answer: 0,
        explain: "The range halves each step: 1,024 → 512 → … → 1, so about log₂(1,024) = 10 comparisons. The exact worst case is ⌈log₂(n+1)⌉ = 11 for n = 1,024."
      },
      {
        prompt: "BFS uses a ___ to decide which discovered node to explore next.",
        options: [
          "Stack",
          "Queue",
          "Heap",
          "Hash table"
        ],
        answer: 1,
        explain: "A FIFO queue explores in discovery order, which produces level-by-level traversal. A stack would produce depth-first order."
      },
      {
        prompt: "DFS is often implemented with which structure?",
        options: [
          "A queue",
          "A stack",
          "A priority queue",
          "A union-find"
        ],
        answer: 1,
        explain: "DFS is LIFO: the most recently discovered node is explored first. Recursion implements the same idea with the call stack."
      },
      {
        prompt: "In a binary search tree, an inorder traversal produces:",
        options: [
          "Insertion order",
          "Sorted order",
          "Level order",
          "Reverse sorted order always"
        ],
        answer: 1,
        explain: "The BST property says left subtree < node < right subtree. Inorder visits left, then node, then right, so the output is sorted ascending."
      },
      {
        prompt: "Inserting 1, 2, 3, 4, 5, 6, 7 into an unbalanced BST produces:",
        options: [
          "A balanced tree of height 3",
          "A chain of height 7; search is O(n)",
          "A heap",
          "A tree with two roots"
        ],
        answer: 1,
        explain: "Every new key is larger than the previous one, so it goes to the right child. The tree degenerates into a linked list; search, insert, and delete become O(n)."
      },
      {
        prompt: "Which sort is stable and adaptive on nearly sorted input?",
        options: [
          "Selection sort",
          "Insertion sort",
          "Heap sort",
          "Quicksort"
        ],
        answer: 1,
        explain: "Insertion sort keeps equal keys in their original relative order (stable) and stops shifting when the key is in place, so nearly sorted input is close to O(n). Selection sort is not stable; heap sort and quicksort are not adaptive."
      },
      {
        prompt: "Which algorithm is NOT O(n log n) in the worst case?",
        options: [
          "Merge sort",
          "Heap sort",
          "Quicksort",
          "Timsort"
        ],
        answer: 2,
        explain: "Quicksort’s worst case is O(n²) when pivots are consistently bad (e.g., already sorted input with a first-element pivot). Merge sort, heap sort, and Timsort have O(n log n) worst-case bounds."
      }
    ];

    var storageKey = "interactive-cs-quiz:" + (root.getAttribute("data-quiz-id") || document.title || "default");
    var answers = readStore(storageKey, {});
    if (!answers || typeof answers !== "object") answers = {};

    function answeredCount() {
      return Object.keys(answers).filter(function (key) {
        return answers[key] !== null && answers[key] !== undefined;
      }).length;
    }

    function correctCount() {
      return Object.keys(answers).reduce(function (total, key) {
        var i = parseInt(key, 10);
        return total + (QUESTIONS[i] && answers[key] === QUESTIONS[i].answer ? 1 : 0);
      }, 0);
    }

    function updateBar() {
      var total = QUESTIONS.length;
      var answered = answeredCount();
      var correct = correctCount();
      if (progressEl) progressEl.textContent = answered + " / " + total + " " + t("answered", "cevaplandı");
      if (scoreEl) scoreEl.textContent = correct + " " + t("correct", "doğru");
      if (retryBtn) {
        var missed = answered - correct;
        retryBtn.hidden = missed <= 0;
        retryBtn.textContent = t("Retry " + missed + " missed", missed + " yanlışı tekrar et");
      }
    }

    function markQuestion(questionEl, i) {
      var chosen = answers[i];
      var isAnswered = chosen !== undefined && chosen !== null;
      questionEl.classList.toggle("is-answered", isAnswered);
      var buttons = $$(".quiz__option", questionEl);
      buttons.forEach(function (button, j) {
        button.disabled = isAnswered;
        button.classList.remove("is-correct", "is-wrong");
        button.setAttribute("aria-pressed", isAnswered && chosen === j ? "true" : "false");
        if (isAnswered && j === QUESTIONS[i].answer) button.classList.add("is-correct");
        if (isAnswered && chosen === j && j !== QUESTIONS[i].answer) button.classList.add("is-wrong");
      });
    }

    function build() {
      questionsEl.innerHTML = "";
      QUESTIONS.forEach(function (question, i) {
        var wrap = document.createElement("div");
        wrap.className = "quiz__question";
        wrap.setAttribute("data-q", String(i));

        var prompt = document.createElement("p");
        prompt.className = "quiz__prompt";
        var num = document.createElement("span");
        num.className = "qnum";
        num.textContent = String(i + 1).padStart(2, "0");
        prompt.appendChild(num);
        prompt.appendChild(document.createTextNode(" " + question.prompt));
        wrap.appendChild(prompt);

        var options = document.createElement("div");
        options.className = "quiz__options";
        question.options.forEach(function (option, j) {
          var button = document.createElement("button");
          button.type = "button";
          button.className = "quiz__option";
          button.textContent = option;
          button.addEventListener("click", function () {
            if (answers[i] !== undefined && answers[i] !== null) return;
            answers[i] = j;
            writeStore(storageKey, answers);
            markQuestion(wrap, i);
            updateBar();
          });
          options.appendChild(button);
        });
        wrap.appendChild(options);

        var explain = document.createElement("p");
        explain.className = "quiz__explain";
        explain.setAttribute("role", "status");
        explain.setAttribute("aria-live", "polite");
        var strong = document.createElement("strong");
        strong.textContent = t("Why: ", "Neden: ");
        explain.appendChild(strong);
        explain.appendChild(document.createTextNode(question.explain));
        wrap.appendChild(explain);

        questionsEl.appendChild(wrap);
        markQuestion(wrap, i);
      });
      updateBar();
    }

    if (resetBtn) resetBtn.addEventListener("click", function () {
      answers = {};
      writeStore(storageKey, answers);
      build();
    });

    if (retryBtn) retryBtn.addEventListener("click", function () {
      var kept = {};
      Object.keys(answers).forEach(function (key) {
        var i = parseInt(key, 10);
        if (QUESTIONS[i] && answers[key] === QUESTIONS[i].answer) kept[i] = answers[key];
      });
      answers = kept;
      writeStore(storageKey, answers);
      build();
    });

    build();
  }

  /* ---------- boot ---------- */

  ready(function () {
    $$('[data-lab="sorting"]').forEach(initSorting);
    $$('[data-lab="binary"]').forEach(initBinary);
    $$('[data-lab="graph"]').forEach(initGraph);
    $$('[data-lab="bst"]').forEach(initBST);
    $$('[data-lab="growth"]').forEach(initGrowth);
    $$("[data-quiz]").forEach(initQuiz);
  });
})();
