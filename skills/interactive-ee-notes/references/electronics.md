# Electronics reference

Scope: semiconductor devices, diodes, BJT/MOSFET, biasing, small-signal,
op-amps, feedback, filters, oscillators, digital logic, ADC/DAC, embedded,
PCB/EMC, power converters and thermal. This is the **device/circuit** side.

Full evidence and sources: `~/notes/electronics/research/02-electronics.md`.

## 1. System questions

- **Device model:** Shockley diode, Ebers–Moll/active BJT, square-law MOSFET,
  ideal op-amp, finite-gain/GBW op-amp, logic family.
- **Bias:** Q-point, rails, current limits, thermal.
- **Signal:** small-signal or large-signal? Linear region? Load line?
- **Closure:** KVL/KCL, device equation, datasheet limit.
- **Falsifier:** KCL/KVL residual, `V_CE<0.2 V` in "active", gain above rail,
  output beyond SOA, ADC code outside range, timing violation.

## 2. Atomic topics

| # | Topic | Relation / representation | Misconception |
|---|---|---|---|
| 1 | Semiconductor physics | `ni²=NcNv e^(−Eg/kT)`, `D/μ=kT/q`; band diagram | hole = positive electron |
| 2 | PN junction / diode | `I_D=Is(e^(V_D/nV_T)−1)`; log I–V + temperature | diode is always 0.7 V |
| 3 | Diode models | piecewise linear, `rd=nV_T/I_D`; load line, clipper | conducting diode is a short |
| 4 | Rectifier / ripple | `Vdc≈Vp−V_D−ΔV/2`, `ΔV≈I_L/(2fC)` | capacitor removes all ripple |
| 5 | Zener / shunt regulator | `Iz=(Vin−Vz)/Rs−IL`, `Pz=VzIz` | Zener is 5.1 V at any current |
| 6 | BJT structure | `Ic=Is e^(Vbe/VT)`, `β=Ic/Ib`; output curves | β is constant |
| 7 | BJT bias / Q-point | `Vbb=Vcc R2/(R1+R2)`, `Ib=(Vbb−Vbe)/(Rb+(β+1)Re)` | saturation is good bias |
| 8 | BJT small-signal | `gm=Ic/VT`, `rπ=β/gm`, `Av=−gm(Rc∥RL)`; hybrid-π, Bode | gain is independent of bias |
| 9 | MOSFET | saturation `Id=½kn(Vgs−Vth)²(1+λVds)`, boundary `Vds=Vgs−Vth`; curve family | MOSFET is a high-Z BJT |
| 10 | Frequency response | poles/zeros, Miller, `GBW=|Av| f−3dB`; Bode + pole map | gain is flat to fT |
| 11 | Op-amp | `Av=−R2/R1`, `1+R2/R1`, `fBW=GBW/|Av|`; transfer + rails + Bode | virtual ground without feedback |
| 12 | Feedback / stability | `T=Aβ`, phase margin, Barkhausen `Aβ=1∠0°`; Nyquist/Bode | negative feedback is always stable |
| 13 | Oscillators | Wien `f0=1/(2πRC)`, `A=3`; Colpitts/quartz; time + envelope | gain >3 gives a clean sine |
| 14 | Active filters | Sallen–Key `f0=1/(2πRC)`, `Q=1/(3−K)`; Bode + poles | Q is a bandwidth in Hz |
| 15 | Power amplifiers | class A/B/AB/D efficiency, load line, SOA | class B has no distortion |
| 16 | Noise | `vn=√(4kTRB)`, `in=√(2qIB)`, NF; spectrum, SNR | gain improves SNR |
| 17 | Logic families | `VIH/VIL`, fan-out, `tpd`, `P∝CV²f`; transfer curve | 3.3 V CMOS drives 5 V CMOS |
| 18 | Combinational logic | Boolean, K-map, hazards; truth table + waveform | truth table = implementation |
| 19 | Sequential logic | `tsu`, `th`, `tcq`, metastability; edge-marked timing | the clock is instantaneous |
| 20 | Memories | SRAM/DRAM/flash cell, access time; array + timing | RAM is permanent |
| 21 | ADC/DAC | `LSB=Vref/2^N`, `SNR=6.02N+1.76 dB`, `fa=|fin−kfs|`; staircase + spectrum | more bits fix aliasing |
| 22 | 555 timer | `tH=0.693(R1+R2)C`, `tL=0.693R2C`; astable waveform | standard astable goes below 50% duty |
| 23 | Microcontrollers | GPIO, timer/PWM, ISR, ADC; block + timeline | waiting forever in an ISR is harmless |
| 24 | HDL/FPGA | synthesis subset, setup/hold, timing closure; FSM + waveform | simulation = hardware |
| 25 | PCB/EMC | return current, `L di/dt`, decoupling; layer + current path | ground is 0 V everywhere |
| 26 | Power converters | buck `D=Vo/Vi`, boost `D=1−Vi/Vo`, `ΔIL=Vo(1−D)/(Lf)`; inductor current | duty is linear in every mode |
| 27 | Thermal | `TJ=TA+PD θJA`; thermal resistance chain | datasheet current is available without a heatsink |

## 3. Twelve lab patterns with checked numbers

1. **Diode I–V + load line.** 5 V/1 kΩ: `VD=0.653 V`, `ID=4.35 mA` (SPICE);
   `rd≈10.4 Ω`; +50 °C shifts ≈−100 mV. Prompt: "R 1 k→10 k: current exactly
   10× lower? How much does VD fall?"
2. **Rectifier + ripple + Zener.** 12 Vrms, 50 Hz, 100 Ω, 1000 µF: SPICE
   `14.08 V/1.06 V`; formula `≈14.8/1.5 V`. Zener 12 V/220 Ω/5.1 V/1 kΩ:
   `Iz=26.3 mA`, `Pz=134 mW`; regulation fails below `RL≈163 Ω`. Prompt:
   "C doubles: does ripple exactly halve?"
3. **BJT Q + CE gain.** Base loading `2.66 mA/4.89 V`; SPICE `2.72/4.75`;
   `Av=−226` bypassed / `−4.6` unbypassed. Prompt: "Why does bypassing RE
   raise gain ~50×, and does Q change?"
4. **MOSFET output curves.** `kn=1 mA/V²`, `Vth=1`, `Vgs=3`: `ID=2.00 mA`,
   boundary 2 V; at `Vds=1`, `1.50 mA`; `λ=0.02` → `2.20 mA`; `gm=2 mS`,
   `Av=−4`. Prompt: "Vgs 3→2.5: does ID halve?"
5. **Op-amp: gain, saturation, GBW.** `Av=−10/+11`; ±12 V rail → ±11.5 V;
   GBW 1 MHz, `Av=10` → 100 kHz; SR 0.5 V/µs, 10 Vpk → 7.96 kHz. Prompt:
   "1.2 V input: does output reach −12 V?"
6. **Integrator/differentiator.** `RC=100 µs`, slope −10 V/ms; `fc=1.59 kHz`;
   at 1 kHz `|Av|=ωRC=0.628`, 90°. Prompt: "Step doubles: slope and saturation
   time?"
7. **Sallen–Key / Bode.** `f0=1.5915 kHz`; `K=1 → Q=1/3`; Butterworth
   `K=1.586 → Q=0.707`; `K=3 → Q→∞`; −40 dB/dec. Prompt: "K 1→1.6: does f0
   change? What happens to peaking?"
8. **Wien oscillator.** `f0=1.5915 kHz`, `A=3`; `A<3` decays, `A>3` clips;
   limiter lowers THD. Prompt: "Rf/Rg=2.9: does oscillation start?"
9. **Comparator hysteresis.** Thresholds 1.182/3.364 V, hysteresis 2.182 V;
   no chatter with 0.3 V noise. Prompt: "R2 100 k→10 k: hysteresis?"
10. **DFF + 555 timing.** Q only on rising edge; 25 ns model window; 555
    `1.387 kHz`, duty 54.8%, `f=1.44/((R1+2R2)C)`. Prompt: "D changes 10 ns
    before the edge: what is Q?"
11. **ADC quantization/SNR/alias.** 12 bit/3.3 V: LSB 805.7 µV, SNR 74.0 dB;
    10 bit 61.96 dB; 1.1 kHz at 1 kHz → 100 Hz. Prompt: "N 12→10: SNR drop
    and LSB ratio?"
12. **Buck/boost + linear thermal.** Buck 12→5: `D=0.4167`, `ΔIL=1.326 A`,
    CCM boundary 0.663 A; boost 5→12: `D=0.5833`; linear 3.5 W: 50 °C/W →
    200 °C, 10 °C/W → 60 °C. Prompt: "Io=0.3 A: CCM or DCM? What is Vo?"

## 4. Tools

| Tool | Class | Licence | Termux | Single HTML | Verdict |
|---|---|---|---|---|---|
| CircuitJS1 (Falstad/sharpie7) | engine + widget | GPL-2.0 | offline browser | iframe, not one file | exploration; external link |
| ngspice 47 | engine + oracle | mixed BSD/per-file | installed | no | **primary batch oracle** |
| PySpice | Python API | GPL-3.0 | pip; not installed | no | author-side only |
| LTspice | engine + schematic | proprietary freeware | no native ARM | no | outside class |
| Qucs-S | schematic + engine | GPL-2.0 | no package | no | desktop alternative |
| KiCad | schematic/PCB | GPL-3.0 | not packaged | no | PCB module; Gerber output |
| Wokwi | widget | proprietary SaaS | online | iframe, online | link only |
| Tinkercad Circuits | widget | proprietary SaaS | online | no | beginner only |
| Logisim-evolution | logic sim | GPL-3.0 | Java; package unverified | no | DFF/FSM demos |
| Digital | logic sim | GPL-3.0 | Java | no | lightweight alternative |
| Verilator | HDL verification | LGPL-3.0 | not installed | no | synthesis-subset oracle |
| Icarus Verilog 13 | HDL sim | GPL-2.0 | package exists | no | **HDL oracle**; gtkwave |

Correct combination: **vanilla JS/canvas widget + ngspice/iverilog oracle**.
No tool is both offline and one file; do not pretend otherwise.

## 5. Component reality

- **E12:** 10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82.
  **E24** adds 11, 13, 16, 20, 24, 30, 36, 43, 51, 62, 75, 91.
- Do not mix 1% metal film and 5% carbon without saying so; tolerance adds at
  both ends.
- A 0.25 W resistor is typically derated to 50–70% in continuous use.
- Electrolytic capacitors: voltage derating and polarity. MLCC: DC-bias
  capacitance loss; X7R temperature coefficient.
- Zener 5.1 V/0.5 W at 134 mW is safe; at 15 V/230 mW it is near the limit.
- BJT: `VCEO`, `IC`, SOA. MOSFET: `VDS`, `ID`, `RDS(on)`. Op-amp: rails,
  common-mode range, slew rate. ADC: reference noise, not Vcc.
- Decoupling: 100 nF X7R + 10 µF per IC; ADC reference from a proper reference
  (e.g. REF5025/LM4040), not the supply.

## 6. Safety

Notes cover **≤24 V DC low-voltage models** only. Mains, HV and battery packs
are out of scope. Still teach: fuse/current limit, reverse polarity,
electrolytic polarity, ESD wrist strap, soldering ventilation, discharge bulk
capacitors before handling.

## 7. Common mistakes

| Mistake | Why wrong | Fix |
|---|---|---|
| Ideal op-amp without rails | ±12 V rail gives ±11.5 V clip | transfer curve + rail badge |
| Virtual ground without feedback | only valid in closed loop | comparator has `V+≠V−` |
| BJT "active" at `VCE=0.2 V` | small-signal model collapses | Q + `VCE` badge |
| MOSFET = high-Z BJT | gate current ~0, but `Qg`, `Vth`, `Rg` matter | `Qg`/switching loss |
| Diode drop always 0.7 V | 0.653 V at 4.35 mA, 0.75 V at 39 mA | log I–V + iteration |
| RMS = peak | 12 Vrms = 16.97 Vpk = 33.94 Vpp | show all three |
| 10log vs 20log | power vs voltage | label dBV/dBm |
| 3.3 V CMOS drives 5 V CMOS | 5 V `VIH≈3.5 V` | 74HCT/level shifter |
| Ignore metastability | setup/hold violation gives an in-between output | two-FF synchronizer |
| Setup/hold = period | 100 MHz period 10 ns; 25 ns window impossible | edge + window |
| Ignore aliasing | 1.1 kHz at 1 kHz → 100 Hz | anti-alias filter |
| Ground is 0 V everywhere | `L di/dt` bounces it | star ground, short return |
