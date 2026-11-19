# Math — KaTeX, notation, and derivation style

The template loads KaTeX 0.16.22 and renders math in the article after the page
loads. Write LaTeX; do not hand-format superscripts with `<sup>`.

## Delimiters

| In the fragment | Result |
|---|---|
| `$v_C(t)$` | inline math |
| `$$ ... $$` inside `.equation__body` | display math, numbered by CSS |
| `\( ... \)` | inline math (alias) |
| `\[ ... \]` | display math (alias) |

Do not mix delimiters in one expression. Do not put `$` inside `<code>` or
`<pre>`: those are ignored by the renderer and shown literally.

## Macros available in the template

| Macro | Expands to | Use |
|---|---|---|
| `\R` | `\mathbb{R}` | real numbers |
| `\N` | `\mathbb{N}` | natural numbers |
| `\Z` | `\mathbb{Z}` | integers |
| `\C` | `\mathbb{C}` | complex numbers |
| `\dd` | `\mathrm{d}` | differential, upright |
| `\ee` | `\mathrm{e}` | exponential, upright |
| `\ii` | `\mathrm{j}` | imaginary unit (engineering) |
| `\unit{...}` | `\,\mathrm{...}` | number–unit spacing |

Example: `$\tau = RC$, $i = C\dd v_C/\dd t$, $z = R + \ii X$`.

If a macro is missing, write the full LaTeX; do not add a new macro to the
template for a single note.

## Notation conventions

Pick one convention per note and keep it.

| Quantity | Convention | Example |
|---|---|---|
| time-domain signal | lowercase, italic | `$v_C(t)$`, `$i_L(t)$` |
| DC / constant value | uppercase | `$V_s$`, `$I_D$` |
| phasor | uppercase with tilde | `$\tilde{V}_s$` |
| RMS | subscript `rms` | `$V_{\mathrm{rms}}$` |
| complex impedance | uppercase Z | `$Z_C = 1/(\ii\omega C)$` |
| Laplace variable | lowercase s | `$H(s)$` |
| resistance / capacitance | uppercase letter, subscript | `$R_1$`, `$C_2$` |
| component value | number + upright unit | `$10\,\mathrm{k\Omega}$` |
| vector | bold | `$\mathbf{v}$` |
| matrix | brackets | `$\begin{bmatrix} ... \end{bmatrix}$` |

- Use `\mathrm` for descriptive subscripts: `$V_{\mathrm{out}}$`, not `$V_{out}$`.
- Use `\text` only for a short word inside a formula; long explanations belong
  in prose.
- Use `\left( ... \right)` when the contents are tall; otherwise plain
  parentheses are fine.
- Use `\cdot` for multiplication, not `*`; use `\times` for numbers in scientific
  notation (`$2\times10^3$`).
- Use `\approx` for an approximation and say what was neglected.
- Use `\propto` for proportionality.
- Use `\xrightarrow{}` for a process arrow with a condition above it
  (`$t\to\infty$` is simpler for a limit).

## Units and prefixes

```latex
5\,\mathrm{V} \qquad 10\,\mathrm{k\Omega} \qquad 2\,\mu\mathrm{F}
\qquad 3\,\mathrm{mA} \qquad 1.5\,\mathrm{GHz}
```

| Prefix | Symbol | Power |
|---|---|---|
| pico | `\mathrm{p}` | $10^{-12}$ |
| nano | `\mathrm{n}` | $10^{-9}$ |
| micro | `\mu` | $10^{-6}$ |
| milli | `\mathrm{m}` | $10^{-3}$ |
| kilo | `\mathrm{k}` | $10^{3}$ |
| mega | `\mathrm{M}` | $10^{6}$ |
| giga | `\mathrm{G}` | $10^{9}$ |

- Unit symbols are upright; quantity symbols are italic.
- Put a thin space `\,` between the number and the unit.
- Do not write `10kΩ` in math; write `$10\,\mathrm{k\Omega}$`.
- In Turkish prose, use a decimal comma ("3,3 V"); inside math, use a decimal
  point (`$3.3\,\mathrm{V}$`). Do not mix them in one sentence without a reason.

## Derivation style

A derivation is a sequence of justified steps, not a wall of algebra.

```html
<div class="equation">
  <div class="equation__body">
    $$
    \begin{aligned}
      V_s - v_C - Ri &= 0 && \text{(KVL)} \\
      i = C\frac{\dd v_C}{\dd t} &\Longrightarrow
      RC\frac{\dd v_C}{\dd t} + v_C = V_s && \text{(yerine koy)} \\
      \frac{\dd v_C}{\dd t} + \frac{v_C}{RC} &= \frac{V_s}{RC}
      && \text{(standart biçim)}
    \end{aligned}
    $$
  </div>
  <span class="equation__tag" aria-hidden="true"></span>
</div>
```

Rules:

1. **Define symbols before the first equation.** A reader should never meet an
   undefined $R$ or $\tau$.
2. **One legal step per line.** If a line uses KVL, say KVL. If it differentiates,
   say so.
3. **Do not skip the initial condition.** For a first-order circuit, state
   $v_C(0^-)=v_C(0^+)$ and use it explicitly.
4. **State the solution's domain.** "$t\ge0$" belongs in the sentence or the
   equation, not in a footnote.
5. **Check limits.** Substitute $t=0$, $t\to\infty$, $R\to0$, $C\to\infty$,
   $\omega\to0$, $\omega\to\infty$ as appropriate. A result that fails a limit
   is wrong.
6. **Check dimensions.** Every term in a sum must have the same unit. $\tau=RC$
   must have seconds: $\Omega\cdot\mathrm{F}=\mathrm{s}$.
7. **Box the result in prose, not with a giant frame.** Say "Sonuç:" and write
   the equation; the design already gives it emphasis.

## Worked example pattern

Use this order; it is what students need when reviewing alone.

1. **Problem** — given values, unknown, assumptions.
2. **Model** — circuit or equation, with a figure if useful.
3. **Solution** — numbered steps, each with a reason.
4. **Check** — units, limit, order of magnitude, energy balance.
5. **Answer** — one sentence with the value and unit.

```html
<div class="callout callout--example">
  <p class="callout__label">Örnek</p>
  <div class="callout__body">
    <p>$R=2\,\mathrm{k\Omega}$, $C=1\,\mu\mathrm{F}$, $V_s=10\,\mathrm{V}$.
    $t=0$ anında anahtar kapanıyor. $v_C(t)$ ve $5\tau$ sonundaki değeri bulun.</p>
    <p><strong>Çözüm.</strong> $\tau=RC=2\,\mathrm{ms}$. Başlangıçta $v_C(0)=0$ olduğundan ...</p>
    <p><strong>Kontrol.</strong> $t\to\infty$ için $v_C\to10\,\mathrm{V}$; $t=0$ için
    $v_C=0$. Boyut: $\mathrm{k\Omega}\cdot\mu\mathrm{F}=\mathrm{ms}$.</p>
  </div>
</div>
```

## Common KaTeX mistakes

| Mistake | Fix |
|---|---|
| `%` starts a comment / disappears | `\%` |
| `&` breaks the alignment | `\&` in text, `&` only inside `aligned` |
| `#` in text | `\#` |
| `_` in text | `\_` |
| `$x^2$` inside `<code>` | remove the `$` or use plain code |
| `\text{şarj}` with a missing brace | `\text{şarj}` — braces must match |
| `\frac12` in a dense line | `\frac{1}{2}` for readability |
| `\mu` written as `u` | `\mu` |
| `\Omega` written as `Ω` inside math | `\Omega` (Unicode Ω may render, but be consistent) |
| `sin`, `cos`, `log` in italics | `\sin`, `\cos`, `\log` |
| `d` in a derivative in italics | `\dd` (upright differential) |

## What good math prose looks like

> Kondansatör gerilimi, $t=0$ anındaki $v_C(0)=0$ başlangıç koşuluyla
> [denklem] çözülürse üstel bir yükseliş verir. $\tau=RC$ zaman sabiti,
> yükselişin hızını belirler: her $\tau$ kadar sürede kalan fark $1/e$ oranında
> azalır. $t=5\tau$ sonunda kalan fark %0,7'nin altına düşer; bu nedenle
> kararlı durum pratikte $5\tau$ sonunda kabul edilir.

The prose carries the reasoning; the equations carry the exact statements.
