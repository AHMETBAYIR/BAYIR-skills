# Electronics — circuits, waveforms, and correctness

A circuit diagram in a study note has one job: a student must be able to
redraw it and solve it without asking what a line means. Topology first, style
second.

## Tooling

SchemDraw is installed for the current user. If it is missing:

```bash
python3 -m pip install schemdraw
```

Write a circuit file, render it, and reference the SVG from the note:

```bash
python3 scripts/render_circuit.py rc.py --out rc.svg --title "RC şarj devresi"
```

The circuit file receives `d`, `elm`, and `schemdraw`; it must add elements to
`d` and must not save the drawing itself.

```python
d.config(unit=3, fontsize=12)
src = elm.SourceV().up().label("$V_s$")
d += src
d += elm.Resistor().right().label("$R$")
cap = elm.Capacitor().down().label("$C$")
d += cap
d += elm.Line().at(cap.end).to(src.start)
d += elm.Ground()
```

## Before drawing: write the netlist card

Five lines in the working file, before any SchemDraw code:

```
Type:        RC charging, first order
Source:      V_s = 10 V, DC, positive up
Ground:      bottom rail
Nodes:       A = source/switch/R, B = R/C, C = C/ground
Unknown:     v_C(t), i(t)
Assumptions: ideal switch, initial v_C(0) = 0
```

If you cannot fill this card, you do not yet know the circuit. Draw it after.

## Layout conventions

- **Power at the top, ground at the bottom.** A vertical source on the left with
  the positive terminal up is the default.
- **Signal flow left to right.** Input on the left, output on the right.
- **One ground symbol per rail.** Do not scatter five grounds for the same node.
- **Dot every T-junction.** A crossing without a dot is not a connection.
- **No wire through a label.** Move the label or lengthen the wire.
- **Reference designators + values.** `R1 = 1 kΩ`, not just `R`.
- **Polarity matters.** Mark the positive terminal of every source and the
  anode/cathode of every diode. For an ammeter, show the current arrow.
- **Keep the canvas quiet.** No title inside the SVG; the `<figcaption>` carries
  the figure number and explanation.

## Recipe 1 — voltage divider

```python
d.config(unit=3, fontsize=12)
src = elm.SourceV().up().label("$V_s$")
d += src
r1 = elm.Resistor().right().label("$R_1$")
d += r1
d += elm.Dot().at(r1.end)
d += elm.Line().right().at(r1.end).length(1).label("$V_{out}$", loc="right")
r2 = elm.Resistor().down().at(r1.end).label("$R_2$")
d += r2
d += elm.Line().at(r2.end).to(src.start)
d += elm.Ground()
```

Result:

$$
V_{\mathrm{out}} = V_s\frac{R_2}{R_1+R_2}
$$

Teaching points to put in prose: the current is the same through both resistors
(no load), the output is measured across $R_2$, and the formula fails when a
load is connected — then use the loaded divider.

## Recipe 2 — RC charging

```python
d.config(unit=3, fontsize=12)
src = elm.SourceV().up().label("$V_s$")
d += src
d += elm.Switch().right().label("$S$")
d += elm.Resistor().right().label("$R$")
cap = elm.Capacitor().down().label("$C$")
d += cap
d += elm.Dot().at(cap.start).label("$v_C$", loc="right")
d += elm.Line().at(cap.end).to(src.start)  # return rail to the source
d += elm.Ground()
```

`elm.Line().left()` uses one default unit of length. In a circuit that is
six units wide, it stops halfway and leaves the source dangling. Use
`.to(anchor)` for a return rail, or set `.length(...)` deliberately.

Result (switch closes at $t=0$, $v_C(0)=0$):

$$
v_C(t)=V_s\left(1-e^{-t/\tau}\right),\qquad \tau=RC
$$

Add the companion waveform with `waveform_svg.py`. Mark $\tau$ and $5\tau$ with
`guides`:

```json
{
  "title": "RC şarj eğrisi",
  "xlabel": "t (ms)",
  "ylabel": "v_C (V)",
  "xmax": 5,
  "ymax": 10,
  "guides": [{"x": 1, "label": "τ"}, {"x": 5, "label": "5τ"}],
  "signals": [
    {"label": "v_C(t)", "color": "#8f2d2d",
     "points": [[0, 0], [0.5, 3.93], [1, 6.32], [2, 8.65], [3, 9.50], [5, 9.93]]}
  ]
}
```

## Recipe 3 — inverting amplifier

```python
d.config(unit=3, fontsize=12)
op = elm.Opamp().right().label("$U_1$")
d += op
# route the feedback above the triangle; never draw it through the symbol
top = (op.in1[0], op.in1[1] + 2)
out_top = (op.out[0], top[1])
d += elm.Line().at(op.in1).to(top)
d += elm.Resistor().at(top).to(out_top).label("$R_2$", loc="top")
d += elm.Line().at(out_top).to(op.out)
# input branch
d += elm.Resistor().left().at(op.in1).length(2).label("$R_1$")
d += elm.SourceV().down()
d += elm.Label().at((-2.9, -0.125)).label("$v_{in}$")
d += elm.Ground()
# non-inverting input to ground
d += elm.Line().left().at(op.in2).length(1)
d += elm.Ground()
# output stub
d += elm.Line().right().at(op.out).length(1).label("$v_{out}$", loc="right")
```

Result (ideal op-amp, negative feedback, virtual short):

$$
\frac{v_{out}}{v_{in}}=-\frac{R_2}{R_1}
$$

State the assumptions: infinite open-loop gain, infinite input impedance, zero
output impedance, and operation outside saturation. A note that gives the gain
formula without the saturation limit is incomplete.

## Recipe 4 — half-wave rectifier

```python
d.config(unit=3, fontsize=12)
src = elm.SourceSin().up().label("$v_s(t)$")
d += src
d += elm.Diode().right().label("$D_1$")
rl = elm.Resistor().down().label("$R_L$")
d += rl
d += elm.Dot().at(rl.start).label("$v_{out}$", loc="right")
d += elm.Line().at(rl.end).to(src.start)
d += elm.Ground()
```

Teaching points: the diode conducts on the positive half-cycle and blocks the
negative one; $v_{out}$ is the positive envelope minus the diode drop. The
output is not a pure DC — add a capacitor and explain the ripple if the note is
about supplies.

For a transistor, use `elm.BjtNpn2()` when the collector must be at the top and
the emitter at the bottom: its anchors are collector `(x, y+3)`, emitter
`(x, y)`, base `(x−0.795, y+1.5)` after `at((x, y))`. Avoid `BjtNpn().down()`
unless you have checked where its rotated base anchor lands.

## More elements

| Element | SchemDraw | Typical note |
|---|---|---|
| DC source | `elm.SourceV()` | bias, supply |
| AC source | `elm.SourceSin()` | phasor / transient |
| pulse / square | `elm.SourcePulse()` | digital, step response |
| resistor | `elm.Resistor()` | always label value |
| capacitor | `elm.Capacitor()` | polarity if electrolytic |
| inductor | `elm.Inductor()` | label $L$, unit H |
| diode | `elm.Diode()` | anode left by default |
| LED | `elm.LED()` | show series resistor |
| NPN / PNP | `elm.BjtNpn()`, `elm.BjtPnp()` | arrow direction; use `BjtNpn2()` for a vertical collector/emitter |
| op-amp | `elm.Opamp()` | mark inverting input |
| ground | `elm.Ground()` | one per rail |
| switch | `elm.Switch()` | state at $t=0$ |
| ammeter / voltmeter | `elm.MeterA()`, `elm.MeterV()` | polarity |
| logic block | `elm.Ic()` + `elm.IcPin()` | label pins, not a generic box |

## Digital and logic notes

SchemDraw's base library does not include IEEE gate symbols. Do not fake them
with a resistor symbol. Use one of these:

1. **Truth table + Boolean expression** for the core content. This is often
   clearer than a gate drawing.
2. **Rectangular blocks** (`elm.Ic()`) for a system diagram: label each pin and
   put the gate name inside (`AND`, `OR`, `DFF`).
3. **Inline SVG** for one or two gate symbols. Keep a 60×40 viewBox, 1.6 px
   stroke, black on white, and label inputs/outputs. Use `figure__canvas` so it
   prints cleanly.

For timing diagrams, use `waveform_svg.py` with `"step": true`:

```json
{
  "title": "D flip-flop zamanlama",
  "xlabel": "t",
  "ylabel": "logic",
  "xmax": 8,
  "ymin": 0,
  "ymax": 1.4,
  "signals": [
    {"label": "CLK", "color": "#1f4e79", "step": true,
     "points": [[0,0],[1,0],[1,1],[2,1],[2,0],[3,0],[3,1],[4,1],[4,0]]},
    {"label": "D", "color": "#2f6b4f", "step": true,
     "points": [[0,1],[2,1],[2,0],[4,0],[4,1]]},
    {"label": "Q", "color": "#8f2d2d", "step": true,
     "points": [[0,0],[1.5,0],[1.5,1],[4,1]]}
  ]
}
```

Always label the active clock edge and the setup/hold window in the caption or
prose. A timing diagram without an edge reference is ambiguous.

## Circuit correctness checklist

Run this before you build the page:

- [ ] Every component has two connected pins; no wire ends in space.
- [ ] The source forms a closed loop with the load.
- [ ] Ground is one node, not several unrelated symbols.
- [ ] T-junctions have dots; crossings without dots really are not connected.
- [ ] Component references and values are present and match the prose.
- [ ] Source polarity matches the sign convention in the equations.
- [ ] Current arrows point in the assumed positive direction.
- [ ] The figure's caption states the state at $t=0$ (switch open/closed).
- [ ] The equation and the drawing use the same node names.
- [ ] The SVG is readable at 360 px wide and at A4 width.

## Common mistakes

| Mistake | Why it hurts | Fix |
|---|---|---|
| Drawing the circuit before writing the netlist | topology drifts while styling | write the five-line card first |
| Ground symbol on every branch | implies separate nodes | one ground per rail |
| No dot at a T-junction | student cannot tell connection from crossing | add `elm.Dot()` |
| `R` without a value | the example cannot be solved | add `R1 = 1 kΩ` |
| Source polarity unmarked | sign errors in KVL | mark `+` / `−` |
| Op-amp gain without saturation | wrong for large input | state the linear region |
| Capacitor treated as open at $t=0^+$ | wrong initial condition | $v_C(0^+)=v_C(0^-)$ |
| DC source left on in AC analysis | wrong AC equivalent | set independent DC sources to zero |
| Waveform without axes/units | unreadable | label both axes, use `guides` for $\tau$ |
| Logic gate drawn as a resistor | wrong symbol | use a block or inline SVG |
