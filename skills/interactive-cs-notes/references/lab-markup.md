# Lab markup reference

Copy these blocks into `note.content.html`. The scripts in `assets/labs.js` bind to the `data-lab` attribute and the `data-*` hooks. Keep the hooks; change the text freely.

## Prediction prompt

```html
<details class="predict">
  <summary>Predict first: after one full bubble pass, what is guaranteed?</summary>
  <p>The largest element is at the end. The next pass can ignore it.</p>
</details>
```

## Sorting lab

```html
<section class="lab" data-lab="sorting" aria-labelledby="lab-sorting-title">
  <header class="lab__head">
    <p class="lab__eyebrow">Lab 01 · Sorting</p>
    <h3 id="lab-sorting-title">Watch the invariant, not the bars</h3>
    <p>Choose an algorithm, predict the next swap, then step through.</p>
  </header>

  <div class="lab__controls">
    <label class="lab__field">Algorithm
      <select data-sort-algo>
        <option value="bubble">Bubble sort</option>
        <option value="selection">Selection sort</option>
        <option value="insertion">Insertion sort</option>
      </select>
    </label>
    <label class="lab__field">Size
      <input type="range" data-sort-size min="8" max="24" step="1" value="12">
      <output data-sort-size-out>12</output>
    </label>
    <label class="lab__field">Speed
      <input type="range" data-sort-speed min="1" max="5" step="1" value="3">
    </label>
    <button class="btn btn--primary" type="button" data-sort-play>Play</button>
    <button class="btn" type="button" data-sort-step>Step</button>
    <button class="btn" type="button" data-sort-shuffle>Shuffle</button>
    <button class="btn btn--ghost" type="button" data-sort-reset>Reset</button>
  </div>

  <div class="lab__grid">
    <div class="lab__viz">
      <div class="lab__bars" data-sort-bars role="img" aria-label="Array bars"></div>
      <p class="lab__legend">
        <span class="key key--compare">comparing</span>
        <span class="key key--swap">swap / shift</span>
        <span class="key key--sorted">sorted</span>
      </p>
    </div>
    <div class="lab__panel">
      <div class="lab__metrics" data-sort-metrics></div>
      <ol class="lab__code" data-sort-code></ol>
    </div>
  </div>

  <p class="lab__status" data-sort-status role="status" aria-live="polite"></p>
  <p class="lab__print">Interactive lab: open the HTML file to step through this algorithm.</p>
</section>
```

## Binary search lab

```html
<section class="lab" data-lab="binary" aria-labelledby="lab-binary-title">
  <header class="lab__head">
    <p class="lab__eyebrow">Lab 02 · Binary search</p>
    <h3 id="lab-binary-title">Halve the uncertainty</h3>
    <p>Each step must discard a whole half. Watch the range shrink.</p>
  </header>

  <div class="lab__controls">
    <label class="lab__field">Target
      <input type="number" data-bin-target value="38" min="0" max="100">
    </label>
    <button class="btn btn--primary" type="button" data-bin-search>Search</button>
    <button class="btn" type="button" data-bin-step>Step</button>
    <button class="btn" type="button" data-bin-play>Play</button>
    <button class="btn" type="button" data-bin-random>Random target</button>
    <button class="btn btn--ghost" type="button" data-bin-reset>Reset</button>
  </div>

  <div class="lab__viz">
    <div class="lab__cells" data-bin-cells role="img" aria-label="Sorted array"></div>
  </div>

  <div class="lab__panel">
    <div class="lab__metrics" data-bin-metrics></div>
    <ol class="lab__code" data-bin-code></ol>
  </div>

  <p class="lab__status" data-bin-status role="status" aria-live="polite"></p>
  <p class="lab__print">Interactive lab: open the HTML file to step through binary search.</p>
</section>
```

## Graph traversal lab

```html
<section class="lab" data-lab="graph" aria-labelledby="lab-graph-title">
  <header class="lab__head">
    <p class="lab__eyebrow">Lab 03 · Traversal</p>
    <h3 id="lab-graph-title">The frontier is the algorithm</h3>
    <p>BFS keeps a queue; DFS keeps a stack. The only difference is which end you take from.</p>
  </header>

  <div class="lab__controls">
    <label class="lab__field">Mode
      <select data-graph-mode>
        <option value="bfs">BFS · queue</option>
        <option value="dfs">DFS · stack</option>
      </select>
    </label>
    <label class="lab__field">Start
      <select data-graph-start>
        <option>A</option><option>B</option><option>C</option><option>D</option>
        <option>E</option><option>F</option><option>G</option><option>H</option><option>I</option>
      </select>
    </label>
    <button class="btn btn--primary" type="button" data-graph-play>Play</button>
    <button class="btn" type="button" data-graph-step>Step</button>
    <button class="btn btn--ghost" type="button" data-graph-reset>Reset</button>
  </div>

  <div class="lab__graph">
    <svg data-graph-svg viewBox="0 0 620 340" role="img" aria-label="Graph with nine nodes"></svg>
    <div class="lab__panel">
      <div class="lab__chips" data-graph-frontier></div>
      <div class="lab__metrics" data-graph-metrics></div>
      <ol class="lab__code" data-graph-code></ol>
    </div>
  </div>

  <p class="lab__status" data-graph-status role="status" aria-live="polite"></p>
  <p class="lab__print">Interactive lab: open the HTML file to traverse the graph.</p>
</section>
```

## BST lab

```html
<section class="lab" data-lab="bst" aria-labelledby="lab-bst-title">
  <header class="lab__head">
    <p class="lab__eyebrow">Lab 04 · Binary search tree</p>
    <h3 id="lab-bst-title">Order is the structure</h3>
    <p>Insert values and search for them. The path is the comparison history.</p>
  </header>

  <div class="lab__controls">
    <label class="lab__field">Value
      <input type="number" data-bst-value value="50" min="1" max="99">
    </label>
    <button class="btn btn--primary" type="button" data-bst-insert>Insert</button>
    <button class="btn" type="button" data-bst-search>Search</button>
    <button class="btn" type="button" data-bst-random>Random insert</button>
    <button class="btn" type="button" data-bst-sorted>Sorted run</button>
    <button class="btn btn--ghost" type="button" data-bst-reset>Reset</button>
  </div>

  <div class="lab__viz">
    <svg data-bst-svg viewBox="0 0 800 360" role="img" aria-label="Binary search tree"></svg>
  </div>

  <div class="lab__panel">
    <div class="lab__metrics" data-bst-traversals></div>
  </div>

  <p class="lab__status" data-bst-status role="status" aria-live="polite"></p>
  <p class="lab__print">Interactive lab: open the HTML file to insert and search.</p>
</section>
```

## Growth-rate lab

```html
<section class="lab" data-lab="growth" aria-labelledby="lab-growth-title">
  <header class="lab__head">
    <p class="lab__eyebrow">Lab 05 · Complexity</p>
    <h3 id="lab-growth-title">Growth is a shape, not a number</h3>
    <p>Change n and switch between linear and log scales. Read the exact counts below the chart.</p>
  </header>

  <div class="lab__controls">
    <label class="lab__field">n
      <input type="range" data-growth-n min="1" max="64" step="1" value="32">
      <output data-growth-n-out>32</output>
    </label>
    <label class="lab__check">
      <input type="checkbox" data-growth-log checked> Log scale
    </label>
  </div>

  <div class="lab__viz lab__viz--chart">
    <canvas data-growth-canvas height="320" aria-label="Growth-rate chart"></canvas>
  </div>

  <div class="table-wrap">
    <table data-growth-table>
      <thead><tr><th>Function</th><th>Operations at n</th></tr></thead>
      <tbody></tbody>
    </table>
  </div>

  <p class="lab__status" data-growth-status role="status" aria-live="polite"></p>
  <p class="lab__print">Interactive lab: open the HTML file to change n.</p>
</section>
```

## Retrieval quiz

```html
<section class="quiz" data-quiz aria-labelledby="quiz-title">
  <header class="lab__head">
    <p class="lab__eyebrow">Retrieval practice</p>
    <h3 id="quiz-title">Check the model, not the wording</h3>
    <p>Answer first, then read the explanation. Wrong answers are the useful ones.</p>
  </header>
  <div class="quiz__bar">
    <span data-quiz-progress>0 / 0 answered</span>
    <span data-quiz-score>0 correct</span>
  </div>
  <div data-quiz-questions></div>
  <div class="quiz__footer">
    <button class="btn btn--ghost" type="button" data-quiz-reset>Reset quiz</button>
    <button class="btn" type="button" data-quiz-retry hidden>Retry missed</button>
  </div>
  <p class="lab__print">The interactive quiz is available in the HTML file.</p>
</section>
```

## Custom lab

If you need a lab that is not in the kit:

1. Add a `<section class="lab" data-lab="your-name">` block.
2. Write an `initYourLab(root)` function in a **separate** `topic-labs.js` file, not inside the article.
3. Add its styles to `topic-labs.css` and pass both files to the builder:

   ```bash
   python3 scripts/build_note.py \
     --content note.content.html --meta note.meta.json \
     --extra-css topic-labs.css --extra-js topic-labs.js \
     --out note.html
   ```

4. Use the same `btn`, `lab__field`, `lab__status`, `lab__metrics`, and `lab__code` classes.
5. Generate steps first, render second.
6. Add a `@media print` fallback and a `role="status"` line.
7. Test with keyboard only and at 390 px.

Do not add a new global library for a single lab. A 40-line SVG layout is usually enough.
