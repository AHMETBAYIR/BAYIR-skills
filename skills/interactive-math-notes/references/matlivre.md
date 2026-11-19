# MatLivre for math notes

## What this is

MatLivre is a clean-room MATLAB-compatible live-script editor and runtime, built in Rust. It runs MATLAB-semantics code headlessly and can expose that interpreter over MCP (JSON-RPC on stdio), returning text output plus PNG figures. It is the author's own project, not a MATLAB licence and not a required dependency of this skill.

## Do you need it? (no — Octave or MATLAB is enough)

The skill's rule is "check every number with a second engine". Any MATLAB-compatible engine satisfies it. Pick the first row that is installed:

| Oracle | Install | Run | Figures | Notes |
|---|---|---|---|---|
| MATLAB | campus/company licence | `matlab -batch "run('check.m')"` | `saveas`, `exportgraphics` | the reference implementation; every toolbox |
| Octave | `apt install octave`, `brew install octave`, `pkg install octave` in Termux | `octave --no-gui check.m`, `octave --eval "..."` | `print(gcf,'f.svg','-dsvg')`, needs a graphics toolkit | free, large MATLAB subset, best default |
| MatLivre | see below; it must already be built | `matlivre --mcp` via `scripts/matlivre_mcp.py` | PNG returned over MCP | optional; useful when you want the MCP bridge |

**Do not install MatLivre just to satisfy verification.** `octave --no-gui check.m` runs the same `.m` file for every check in section 3 below. If no oracle is installed, say so and treat the figure as unverified — never drop the check silently.

Read the rest of this file only if MatLivre is already on `PATH`, or if you want the MCP bridge for figures.

## 1. Two entry points, two capabilities

| Entry point | What it does | Figures? |
|---|---|---|
| `matlivre-cli script.m` | headless script runner, prints workspace output | **No** — it has no editor renderer |
| `matlivre --mcp` | JSON-RPC MCP server over stdio | **Yes** — `run_code` returns text + PNG figures |
| `matlivre` (GUI) | full live-script editor | Yes |

This distinction is important. A CLI script that calls `saveas` or `print` fails with:

```text
Saving figures needs the matlivre editor's renderer, which is not available here.
```

Use the MCP server (or the GUI) when a figure is required.

### Finding the binary

The bridge resolves `matlivre`, in order:

1. `--matlivre /path/to/matlivre`
2. `$MATLIVRE_BIN`
3. `matlivre` on `PATH` (`shutil.which`)
4. fallback list: `~/.local/bin/matlivre`, `~/.local/lib/matlivre/matlivre`, `/usr/local/bin/matlivre`, `/usr/bin/matlivre`

If none exists it prints an install hint and exits `2` — no traceback. `$MATLIVRE_BIN` is the portable override; a plain `PATH` install needs no configuration.

## 2. Add MatLivre to an agent

Any MCP client works; the OpenCode form is:

```json
{
  "mcp": {
    "matlivre": {
      "type": "local",
      "command": ["matlivre", "--mcp"],
      "enabled": true
    }
  }
}
```

Use an absolute path in `command` if the client does not inherit your `PATH`.

The server exposes:

- `run_code` — run MATLAB code in a fresh/headless interpreter, return text and figures;
- `get_workspace` — list workspace variables (GUI sessions).

The kit's bridge is:

```bash
python3 <skill>/scripts/matlivre_mcp.py \
  --code "disp(2+3*4)" --out-dir ./matlivre --name check
```

It starts `matlivre --mcp`, sends the standard initialize/tools-call sequence, saves the text output, and writes each returned figure as a PNG.

## 3. Verification patterns

Every snippet below runs unchanged in MATLAB, Octave, and MatLivre.

### Check an ODE step

```matlab
f = @(x,y) y - x;
x = 0; y = 0.5; h = 0.25;
ye = y; yh = y; yr = y;
for k = 1:8
  k1 = f(x,ye); ye = ye + h*k1;

  k1 = f(x,yh); k2 = f(x+h,yh+h*k1);
  yh = yh + h/2*(k1+k2);

  k1 = f(x,yr);
  k2 = f(x+h/2,yr+h/2*k1);
  k3 = f(x+h/2,yr+h/2*k2);
  k4 = f(x+h,yr+h*k3);
  yr = yr + h/6*(k1+2*k2+2*k3+k4);

  x = x + h;
end
fprintf('euler=%.6f heun=%.6f rk4=%.6f\n', ye, yh, yr);
```

Expected at `x=2`:

```text
euler=0.019768  heun=-0.631124  rk4=-0.694333
```

### Check a gradient and tangent plane

```matlab
syms x y
f = x^2 + y^2;
g = gradient(f, [x y]);
subs(g, [x y], [0.8 0.6])
```

If the Symbolic toolbox surface is unavailable (Octave without `symbolic`, MatLivre builds without it), use finite differences:

```matlab
f = @(x,y) x.^2 + y.^2;
x0 = 0.8; y0 = 0.6; e = 1e-6;
fx = (f(x0+e,y0) - f(x0-e,y0))/(2*e);
fy = (f(x0,y0+e) - f(x0,y0-e))/(2*e);
```

Expected `fx = 1.6`, `fy = 1.2`, `|grad| = 2`.

### Check eigenvalues

```matlab
A = [-0.4 1; -1 -0.4];
trace(A)
det(A)
eig(A)
```

Expected: `tr = -0.8`, `det = 1.16`, eigenvalues `-0.4 ± 1i` (stable spiral).

### Check interpolation error

```matlab
f = @(x) 1./(1+25*x.^2);
n = 11;
xe = linspace(-1,1,n);
ye = f(xe);
x = linspace(-1,1,800);
p = polyval(polyfit(xe,ye,n-1),x);
max(abs(f(x)-p))
```

Expected maximum error for equidistant nodes: about `1.92`; for Chebyshev nodes: about `0.11`.

## 4. Generate a static figure

The MCP path can return a PNG figure automatically, and `saveas` works because the exporter is installed. Example:

```matlab
out = '/absolute/path/figures/ode-methods.svg';
x = linspace(0,2,220);
exact = x + 1 - 0.5*exp(x);
figure;
plot(x, exact, 'k--', 'LineWidth', 1.6);
xlabel('x'); ylabel('y'); grid on;
saveas(gcf, out);
```

Run it with the bridge:

```bash
python3 <skill>/scripts/matlivre_mcp.py \
  --code-file ode-figure.m --out-dir ./matlivre --name ode-figure
```

The bridge also saves the returned PNG preview. The SVG is suitable for the `figure--print-only` block; the HTML builder inlines it and namespaces its ids.

### Figure caveats

- MatLivre's SVG has `clipPath id="c1"`; the math note builder renames ids so two figures do not collide.
- MatLivre does not support `print -dpdf`; use SVG/PNG and let the browser print the HTML to PDF. (Octave and MATLAB export SVG the same way — keep the figure path format-neutral.)
- `quiver3` option parsing is narrower than MATLAB's in some MatLivre builds; keep the call simple and style the note around it.
- MatLivre 3D `surf` output may have painter-order artifacts. For a quantitative 3D claim, use the interactive Canvas lab or generate the surface with Matplotlib; use MatLivre for 2D and for numeric checks.

## 5. When to use MatLivre vs SymPy vs SciPy

| Task | Best tool |
|---|---|
| Exact derivative/integral/ODE solution | SymPy |
| MATLAB-semantics check of a course algorithm | any of MATLAB/Octave/MatLivre |
| Fixed-step RK4 table | MatLivre, Octave, or NumPy |
| Reference IVP solution | `scipy.integrate.solve_ivp` |
| Static 2D figure | MatLivre, Octave/MATLAB, or Matplotlib |
| Static 3D figure | Matplotlib/Plotly; MatLivre only with caveats |
| Symbolic proof | Lean/paper, not a CAS |
| Browser-side numeric check | vanilla JS in the lab |

## 6. Workflow

1. Write the small `.m` check.
2. Run it through `matlivre_mcp.py` — or `octave --no-gui` / `matlab -batch` if you only need the numbers.
3. Compare the text output with the lab readout.
4. If a figure is needed, save an SVG/PNG and reference it from the note.
5. Record the result in the note's test log or the research report.
6. Do not ship a note whose only verification is “the lab looked right.”

## 7. Limits

- MatLivre is not MATLAB. It implements a large compatible subset, but toolboxes and edge-case semantics can differ.
- The CLI is not a figure renderer.
- The MCP server runs a headless interpreter; GUI-only interactions are unavailable.
- The clean-room implementation can have numerical differences at the last digits. Treat small differences as expected and large differences as a bug.
- Verify the functions you use; do not assume a MATLAB toolbox function exists.

## Appendix A — Octave and MATLAB equivalents

Same checks, no MatLivre:

```bash
octave --no-gui check.m                 # run the whole script
octave --eval "disp(2+3*4)"             # one expression
matlab -batch "run('check.m')"          # MATLAB
```

Figure export:

```matlab
print(gcf, 'ode-methods.svg', '-dsvg');        % Octave; needs gnuplot or fltk toolkit
exportgraphics(gcf, 'ode-methods.svg');        % MATLAB R2020a+
```

## Appendix B — this author's install (Android/Termux)

Recorded for continuity, not as instructions for other machines. MatLivre is installed at:

```text
~/.local/lib/matlivre/matlivre
~/.local/lib/matlivre/matlivre-cli
~/.local/bin/matlivre
~/.local/bin/matlivre-cli
```

The project install record is `~/Projects/bionic/160-matlivre-install-20261109.md`; the source checkout is `~/Projects/matlivre` at commit `82fc24e` (version 0.1.5). On that device `~/.local/bin/matlivre` is the last entry in the fallback list above, so no `$MATLIVRE_BIN` is needed once `~/.local/bin` is on `PATH`. The install is Termux-specific (aarch64, bionic libc); on a desktop, build from the upstream repository or use Octave instead.
