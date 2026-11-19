# Jupyter notebooks as computational companions

A notebook is a laboratory notebook, not a lecture. It is the right place to compute, plot, and verify; it is usually the wrong place to teach a first lesson. The kit therefore keeps two artifacts:

```text
notebook.ipynb   →  compute, plot, check, export figures
topic.html       →  explain, predict, manipulate, print
```

## 1. What the notebook is for

- running the actual numerical method before designing the lab;
- checking a browser readout against NumPy/SciPy/SymPy;
- generating publication-quality figures for print;
- recording the experiment (step sizes, errors, iteration counts);
- giving a reproducibility trail to an instructor or reviewer.

## 2. What the notebook is not for

- a phone-friendly first lesson;
- a print-first workbook;
- hiding the code while showing the result;
- a substitute for a proof;
- a reliable record if cells were run out of order.

## 3. The companion notebooks in this kit

```text
~/notes/math-interactive-notes/notebooks/ode-first-order.ipynb
~/notes/math-interactive-notes/notebooks/calculus3-surfaces.ipynb
~/notes/math-interactive-notes/notebooks/numerical-rootfinding.ipynb
```

They are valid `nbformat` 4.5 JSON files. They run in Jupyter, VS Code, Colab, or any Python kernel with NumPy/SciPy/Matplotlib.

They cover:

- an exact ODE solution and a fixed-step comparison;
- a surface, contour, gradient, and tangent plane;
- bisection/Newton/secant and the Runge phenomenon.

The notebooks deliberately use plain Python and explicit loops where the loop is the method; `solve_ivp` and `brentq` are used as independent references, not as the teaching algorithm.

## 4. Running

### Jupyter

```bash
jupyter lab
# or
jupyter notebook
```

Run **Kernel → Restart & Run All** before exporting. A notebook with hidden state is not a reproducible artifact.

### Headless execution

If Jupyter is installed:

```bash
jupyter nbconvert --to notebook --execute notebook.ipynb \
  --output executed.ipynb
```

If only the Python stack is available (no Jupyter), extract the code cells and run them as a script:

```bash
python3 - <<'PY'
import json
from pathlib import Path
nb = json.loads(Path('notebook.ipynb').read_text())
code = "\n\n".join("".join(c['source']) for c in nb['cells'] if c['cell_type'] == 'code')
Path('notebook.py').write_text('import matplotlib\nmatplotlib.use("Agg")\n' + code)
PY
MPLBACKEND=Agg python3 notebook.py   # or your launcher/wrapper
```

The examples assume NumPy, SciPy, Matplotlib, SymPy, and Pandas. Jupyter is optional; without it the notebook JSON is still a valid file to run in Colab or VS Code.

### Colab / VS Code

- Colab: upload the `.ipynb`; install missing packages with `!pip install`.
- VS Code: install the Jupyter extension and select a Python kernel.

## 5. Exporting

### HTML

```bash
jupyter nbconvert --to html notebook.ipynb --output notebook.html
```

This produces a standalone HTML report with code, outputs, and figures. It is a **lab report**, not the interactive note. You can:

- link it from the note as “computational companion”;
- copy selected figures into the note;
- embed it in an iframe if the course site allows it.

### PDF

```bash
jupyter nbconvert --to webpdf notebook.ipynb
# or print the HTML to PDF from a browser
```

The webpdf route needs Chromium/Playwright; the browser print route is simpler and matches the note workflow.

### Figures

Prefer explicit `fig.savefig('name.png', dpi=200, bbox_inches='tight')` over relying on the inline output. It gives a stable file for the note builder, which inlines local PNG/SVG.

### Markdown / LaTeX

```bash
jupyter nbconvert --to markdown notebook.ipynb
jupyter nbconvert --to latex notebook.ipynb
```

Useful for a thesis or a course repository; less useful for the phone-first note.

## 6. Embedding a notebook in a note

Three patterns:

1. **Figure only** — export a PNG/SVG and use the normal `<figure>` component. Best for print.
2. **Link** — “Computational companion: `notebooks/topic.ipynb`.” Best for reproducibility without page weight.
3. **Iframe** — embed an exported HTML report. Check the LMS CSP and mobile layout; iframes are often blocked.

Do not embed a live Jupyter kernel in the student note unless the course explicitly supports it. It adds a server, authentication, and a failure surface.

## 7. Notebook quality gates

- [ ] Kernel → Restart & Run All succeeds from a clean state.
- [ ] No cell depends on a file that is not in the repo or downloaded explicitly.
- [ ] Random seeds are fixed where randomness is used.
- [ ] Figures have axis labels and units.
- [ ] The notebook states the method, parameters, and tolerance.
- [ ] The final cell prints the numbers that the note quotes.
- [ ] Outputs are cleared or intentionally kept; do not ship stale outputs.
- [ ] The notebook does not contain credentials or personal data.
- [ ] A `requirements.txt` or environment note is included when packages are non-standard.

## 8. Jupyter vs Quarto vs marimo

| Need | Jupyter | Quarto | marimo |
|---|---|---|---|
| Classic notebook, wide ecosystem | **best** | good | partial |
| Long-form article/book with cross-refs | partial | **best** | partial |
| Reactive Python, no hidden state | partial | partial | **best** |
| HTML/PDF/Word output | via nbconvert | **best** | HTML/WASM |
| Browser-only, no server | JupyterLite | static site | WASM export |
| Course site with search | Jupyter Book | **best** | partial |

Use Jupyter for the computation; use Quarto/Jupyter Book when the course needs a book; use marimo when reactivity and reproducibility are the point.

## 9. Sources

- Jupyter: <https://jupyter.org/>
- nbconvert: <https://nbconvert.readthedocs.io/>
- Jupyter Book: <https://jupyterbook.org/>
- Quarto: <https://quarto.org/>
- marimo: <https://marimo.io/>
- Matplotlib: <https://matplotlib.org/>
- SciPy: <https://scipy.org/>
