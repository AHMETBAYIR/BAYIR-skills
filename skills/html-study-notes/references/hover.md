# Hover — circuit verification without MATLAB

[Hover](https://github.com/eraymerc/hover-lang) is an MIT-licensed,
mixed-systems co-simulation language: a circuit netlist (MNA/SPICE style) and
logic in one source file. It is **not** a general MATLAB replacement. Use it to
check a circuit's DC operating point (`.op`) or transient response (`.tran`),
not to do symbolic algebra, matrix manipulation, or general data analysis.

Version used here: **v0.9.0** (under development; syntax may change).

## When to use it in a note

- After a hand derivation, verify the numerical result with a small netlist.
- Show a transient waveform from `.tran` next to the analytical exponential.
- Check a Thevenin/Norton load result.
- Do **not** replace the hand derivation with a simulation; the note still has
  to show the KCL/KVL equations and the algebra.

## Building hover

Prebuilt Linux binaries (aarch64, x86_64) ship on the project's releases page.
On macOS or Windows, or when you need a different target or a patch, build from
source:

```bash
git clone https://github.com/eraymerc/hover-lang
cd hover-lang
make                 # build the CLI
hover --setup        # build the C++ runtime and install the stdlib
hover --help
```

`--setup` is required once per install: it compiles the C++ runtime from source
and unpacks the stdlib. It fetches the stdlib package from `hover-lang.org`. If
that host is unreachable, build a local archive from the repo
(`make stdlib-archives`) and install it into the package cache. The basic `R`,
`C`, `L`, `voltage_source`, `current_source`, `.op` and `.tran` examples work
without a stdlib import.

### Android / Termux

Same build, one Zig detail. The Linux aarch64 release is installed under
`~/.local/share/hover/`, with a wrapper at `~/.local/bin/hover`. On that
device the wrapper puts a Zig wrapper on `PATH` that adds
`-target aarch64-linux-musl`, because the Termux Zig cannot find a glibc
runtime for its native C++ build.

Rebuild the ARM CLI release from source with:

```bash
CGO_ENABLED=0 make linux-aarch64 VERSION=v0.9.0
```

On this machine `hover-lang.org` is not resolvable, but the packaged fallback
(`github.com/eraymerc/hover-lang/.../stdlib-0.9.0.tar.gz`) works and the runtime
compile succeeds with the Termux Zig wrapper.

## Minimal DC example

`divider.hvr`:

```hover
.save(main.vout);
.op;

module main<>() [] {
    wire vin, vout;
    voltage_source<12>() [vin, gnd];
    R<4k>() [vin, vout];
    R<6k>() [vout, gnd];
}
```

```bash
hover divider.hvr
head -3 simulation_output.csv
```

```
Time,main.vout
0.000000e+00,7.200000e+00
...
1.000000e-02,7.200000e+00
```

Hand check: $V_{out}=12\cdot6/(4+6)=7.2\,\mathrm{V}$.

## Minimal transient example

`rc.hvr`:

```hover
.save(main.vc);
.tran(0, 10m, 1u);

module main<>() [] {
    wire vin, vc;
    voltage_source<12>() [vin, gnd];
    R<2k>() [vin, vc];
    C<1u>() [vc, gnd];
}
```

At $t=2\,\mathrm{ms}=\tau$ the simulation gives about
$7.59\,\mathrm{V}$; the analytical value is
$12(1-e^{-1})=7.585\,\mathrm{V}$. At $5\tau=10\,\mathrm{ms}$ the simulation
gives about $11.92\,\mathrm{V}$.

## Syntax cheat sheet

| Item | Hover |
|---|---|
| DC operating point | `.op;` |
| Transient | `.tran(t_start, t_stop, max_step);` |
| Save signals | `.save(main.vout);` |
| Top module | `module main<>() [] { ... }` |
| Wire | `wire vin, vout;` |
| Ground | built-in `gnd` |
| Voltage source | `voltage_source<12>() [vin, gnd];` |
| Current source | `current_source<2m>() [node, gnd];` |
| Resistor | `R<4k>() [vin, vout];` |
| Capacitor | `C<1u>() [vc, gnd];` |
| Inductor | `L<2m>() [a, b];` |
| Named source | `voltage_source vsense<0>() [mid, gnd];` |
| Source current | `I(vsense)` (only branch-bearing elements) |
| Node voltage | `V(node)` |

Suffixes: `p`, `n`, `u`, `m`, `k`, `Meg`, `G`; they are case-sensitive
(`Meg`, not `meg`). `<>` is the parameter list, `[]` is the port/net list.

## What Hover is good at

- DC operating point and transient simulation of R/C/L/source networks.
- Device-level models (BJT, diode, MOSFET) when the parts/stdlib packages are
  installed.
- Mixed logic + analog co-simulation (its main design goal).
- Reproducible netlists in a course repository; CSV output is easy to plot with
  Python or Octave.

## What it does not replace

- MATLAB/Octave matrix algebra (`A\b`), symbolic math, optimization, general
  plotting.
- Hand node/mesh equations in an exam. Hover checks the answer; it does not
  show the derivation.
- A mature GUI/IDE and a large ecosystem. v0.9 is early; expect changes.

## Note-writing pattern

1. Derive the result by hand in the note.
2. Put the netlist in a collapsed `<pre><code>` block or a short appendix.
3. State the simulated value and the hand value side by side.
4. If they differ, say why (numerical startup, model nonideality, tolerance).
5. Never present a simulation as a substitute for the derivation.
