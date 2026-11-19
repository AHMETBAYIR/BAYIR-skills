# Lab library

Ten domain prototypes and one built note. Each prototype is a standalone HTML file with its own `check.py`; each was opened in a browser at 390 px and checked with `?selftest=1` where the page implements it.

| Course | Prototype | What the learner changes | Invariant | Check |
|---|---|---|---|---|
| Statik | `research/statics-dynamics/lab.html` | load position on a truss | `ΣF=0`, `ΣM=0`; tension/compression signs | `python3 research/statics-dynamics/check.py` |
| Mukavemet | `research/mechanics-materials/lab.html` | span, load, section, support | `PL/4`, `PL³/48EI`, `dV/dx=-q`; 15/15 in-page | `python3 research/mechanics-materials/check.py` |
| Makine elemanları | `research/machine-elements/lab.html` | nominal size, hole/shaft zone | ISO 286 limits; `cmin=Hmin-Smax` | `python3 research/machine-elements/check.py` |
| Termodinamik | `research/thermo-heat/lab.html` | `r`, `qin`, `T1`, Otto/Diesel | `qin-qout=wnet`; `η<Carnot` | `python3 research/thermo-heat/check.py` |
| Akışkanlar | `research/fluids/lab.html` | `D`, `Q`, `ε`, fittings | `Re`, Colebrook residual, Darcy–Weisbach | `python3 research/fluids/check.py` |
| Mekanizma | `research/mechanisms-vibrations/lab.html` | crank angle, link lengths | loop closure, Grashof, transmission angle | `python3 research/mechanisms-vibrations/check.py` |
| İmalat | `research/manufacturing-metrology/lab.html` | `vc`, `fz`, `ap`, `ae` | `n=1000vc/(πD)`, `vf=fz z n`, MRR, power | `python3 research/manufacturing-metrology/check.py` |
| Kontrol | `research/control-mechatronics/lab.html` | `Kp`, `Ki`, `Kd`, plant | closed-loop poles, `Mp`, `ts`, `ess` | `python3 research/control-mechatronics/check.py` |
| FEM | `research/fem-numerical/lab.html` | element count, `E`, `A`, `P` | `Ku=f`, `PL/EA`, reaction | `python3 research/fem-numerical/check.py` |
| Teknik resim | `research/technical-drawing/lab.html` | projection angle, feature, tolerance | projection alignment, MMC bonus, virtual condition | `python3 research/technical-drawing/check.py` |
| Starter note | `demo/kesit-egilme.html` | shape, `b`, `h`, `d` | `I=bh³/12`, `W=I/c`, `σ=M/W` | `python3 ~/.agents/skills/interactive-me-notes/scripts/check_me.py section 40 60` |

## How to reuse a prototype

1. Open the file and read its `<style>` and `<script>`; most are single-file with a small `CORE` block.
2. Copy the **calculation core** into the note, not the whole page. Rebuild the shell with `me-labs.css` and `initLab`.
3. Re-run the prototype's `check.py` and the skill's `check_me.py`; they must agree on the shared numbers.
4. Replace the demo's prose with the actual lecture: definition, derivation, worked example, misconceptions, quiz, exercises.
5. Add `?selftest=1` checks for the note-specific invariants.

## Ported into the skill (v1.1)

Seven engines now live in `assets/labs/`: `beam`, `mohr`, `pipe`, `fourbar`,
`vibration`, `fit`, `fem`. They share `me-labs.css` and the `initLab` contract,
so a note only declares markup and chooses engines with `--labs`.

```bash
python3 build_note.py --content note.html --meta note.json \
  --labs beam,mohr --out topic.html
```

The dossier prototypes remain useful as reference implementations and for the
labs not yet ported: truss, Otto/Diesel, PID, machining, projection/GD&T,
tolerance stack, gear pair, bolted joint, Rankine, fin, LMTD, root locus, DC
motor.

## Next porting targets

Truss → thermo cycle → PID → machining. These cover the remaining
representations used in the largest number of courses. Run each prototype's
`check.py` and the new engine's `?selftest=1` before replacing the prototype.

## What not to port

- A lab whose only interaction is rotation with no question.
- A lab that needs a network service, an account, or a commercial solver.
- A 3D view when a 2D section carries the argument.
- A “real-time” animation with no invariant and no readout.
