# Components — copy-paste HTML

The content fragment is the inside of `<article class="content">`. Use these
classes; the design system is already in `assets/template.html`.

## A complete content skeleton

```html
<p class="lede">
  Bu not, <strong>birinci mertebeden RC devrelerini</strong> kurulumdan çözüme
  kadar takip eder. Sonunda zaman sabitini okuyabilmeli, sınır durumlarını
  kontrol edebilmeli ve bir devreyi kendi başınıza çözebilmelisiniz.
</p>

<div class="keypoints">
  <p class="keypoints__title">Bu notun sonunda</p>
  <ul>
    <li>RC devresinin diferansiyel denklemini kurabilirsiniz.</li>
    <li>Zaman sabitini devre parametrelerinden okuyabilirsiniz.</li>
    <li>Şarj ve deşarj eğrilerini çizebilirsiniz.</li>
  </ul>
</div>

<h2 id="temel-kavramlar">Temel kavramlar</h2>
<p>...</p>

<h2 id="cozum">Çözüm</h2>
<p>...</p>
```

The `id` is required for the generated table of contents. Keep it short,
lowercase, and stable.

## Callouts

```html
<aside class="callout callout--definition">
  <p class="callout__label">Tanım</p>
  <div class="callout__body">
    <p>Zaman sabiti $\tau = RC$, devrenin doğal tepkisinin $1/e$ oranında
    sönümlendiği süredir.</p>
  </div>
</aside>
```

Variants:

| Class | Use for | Typical label |
|---|---|---|
| `callout--definition` | formal definition | Tanım |
| `callout--theorem` | theorem, law, result | Teorem / Yasa |
| `callout--example` | worked example | Örnek |
| `callout--warning` | common mistake, caveat | Dikkat |
| `callout--tip` | intuition, shortcut, exam tip | İpucu |
| `callout--note` | aside, history, reminder | Not |

Do not stack three callouts in a row. One callout per idea.

## Display equations

```html
<div class="equation">
  <div class="equation__body">
    $$ v_C(t) = V_s\left(1 - e^{-t/\tau}\right),\qquad \tau = RC $$
  </div>
  <span class="equation__tag" aria-hidden="true"></span>
</div>
```

The tag is numbered automatically by CSS. For a multi-line derivation, use
`aligned` inside one equation:

```html
<div class="equation">
  <div class="equation__body">
    $$
    \begin{aligned}
      V_s - v_C - Ri &= 0 && \text{(KVL)} \\
      i = C\frac{\dd v_C}{\dd t} &\Longrightarrow
      RC\frac{\dd v_C}{\dd t} + v_C = V_s && \text{(yerine koy)}
    \end{aligned}
    $$
  </div>
  <span class="equation__tag" aria-hidden="true"></span>
</div>
```

Prefer one numbered equation per independent result. Do not number every
algebra line.

## Inline math and units

```html
<p>Gerilim $v_C(t)$, kaynak $V_s$ ve zaman sabiti $\tau = RC$ ile belirlenir.</p>
<p>Ölçülen değer $3.3\,\mathrm{V}$ ve direnç $10\,\mathrm{k\Omega}$.</p>
```

- Inline math: `$...$`.
- Display math: `$$...$$` inside `.equation__body`.
- Units upright: `\mathrm{V}`, `\mathrm{A}`, `\mathrm{\Omega}`, `\mathrm{F}`.
- Use `\,` between number and unit: `5\,\mathrm{V}`.
- Do not put a period or comma inside math unless it is part of the formula.

## Circuit figure

Render the circuit first:

```bash
python3 scripts/render_circuit.py rc.py --out rc.svg --title "RC şarj devresi"
```

Then reference it from the fragment:

```html
<figure class="figure figure--circuit">
  <div class="figure__canvas">
    <img src="rc.svg" alt="Seri RC devresi: gerilim kaynağı, direnç ve kondansatör">
  </div>
  <figcaption>
    <span class="figure__label"></span>
    Seri RC devresi. Anahtar $t=0$ anında kapanır; kondansatör başlangıçta boştur.
  </figcaption>
</figure>
```

The build script replaces the `<img>` with the SVG markup. Keep the `alt` text
specific: it is what a screen reader announces.

## Waveform figure

```bash
python3 scripts/waveform_svg.py rc-wave.json --out rc-wave.svg
```

```json
{
  "title": "RC şarj eğrisi",
  "xlabel": "t (ms)",
  "ylabel": "v_C (V)",
  "xmax": 5,
  "ymax": 10,
  "signals": [
    {
      "label": "v_C(t)",
      "color": "#8f2d2d",
      "points": [[0, 0], [0.5, 3.93], [1, 6.32], [2, 8.65], [3, 9.50], [5, 9.93]]
    }
  ]
}
```

```html
<figure class="figure figure--wave">
  <div class="figure__canvas">
    <img src="rc-wave.svg" alt="Kondansatör geriliminin zamanla üstel olarak yükseldiği grafik">
  </div>
  <figcaption>
    <span class="figure__label"></span>
    $v_C(t)$ eğrisi. $\tau = 1\,\mathrm{ms}$; $5\tau$ sonunda kararlı duruma
    pratik olarak ulaşılır.
  </figcaption>
</figure>
```

For a digital timing diagram, add `"step": true` to each signal.

## Table

```html
<div class="table-wrap">
  <table>
    <caption>Tablo 1 — Zaman sabitinin devre elemanlarına göre değişimi</caption>
    <thead>
      <tr>
        <th scope="col">Devre</th>
        <th scope="col">Zaman sabiti</th>
        <th scope="col" class="num">Örnek</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">RC</th>
        <td>$\tau = RC$</td>
        <td class="num">$1\,\mathrm{ms}$</td>
      </tr>
      <tr>
        <th scope="row">RL</th>
        <td>$\tau = L/R$</td>
        <td class="num">$2\,\mu\mathrm{s}$</td>
      </tr>
    </tbody>
  </table>
</div>
```

Right-align numeric columns with `class="num"`. Keep captions above the table.

## Exercise with a hidden solution

```html
<div class="exercise">
  <p class="exercise__label">Alıştırma 1</p>
  <p>$R = 2\,\mathrm{k\Omega}$ ve $C = 1\,\mu\mathrm{F}$ için zaman sabitini
  ve $5\tau$ sonundaki kondansatör gerilimini bulun. Kaynak $10\,\mathrm{V}$.</p>
  <details class="solution">
    <summary>Çözümü göster</summary>
    <div class="solution__body">
      <p>$\tau = RC = 2\times10^3 \cdot 1\times10^{-6} = 2\,\mathrm{ms}$.</p>
      <p>$5\tau = 10\,\mathrm{ms}$ ve $v_C(5\tau) = 10(1-e^{-5}) \approx 9.93\,\mathrm{V}$.</p>
    </div>
  </details>
</div>
```

The print stylesheet opens every solution automatically.

## Key points / summary

```html
<div class="keypoints">
  <p class="keypoints__title">Özet</p>
  <ul>
    <li>Zaman sabiti $\tau = RC$ devrenin hızını belirler.</li>
    <li>$t = \tau$ anında gerilim son değerin %63,2'sine ulaşır.</li>
    <li>$5\tau$ sonunda kararlı durum kabulü yapılır.</li>
  </ul>
</div>
```

## Two-column comparison

```html
<div class="columns">
  <div>
    <h3>Şarj</h3>
    <p>...</p>
  </div>
  <div>
    <h3>Deşarj</h3>
    <p>...</p>
  </div>
</div>
```

On narrow screens the columns stack. Do not put wide equations in a column.

## Code

```html
<pre><code>V_s = 10; R = 2e3; C = 1e-6;
tau = R*C; v5 = V_s*(1-exp(-5));</code></pre>
```

Inline code uses `<code>`; a block uses `<pre><code>`. Keep lines under ~80
characters so the block does not scroll on a phone.

## What not to use

- No inline `style=""` attributes. The design system is the stylesheet.
- No `<div class="card">` or custom grids; use a rule and a gap.
- No `<h1>` inside the article; the masthead already has the title.
- No `<h3>` before the first `<h2>`.
- No emoji in labels or headings.
