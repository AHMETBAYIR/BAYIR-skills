# Communications reference

Scope: signals and systems, sampling, quantization, analog/digital modulation,
noise, detection, information theory, coding, OFDM, transmission lines, Smith
chart, antennas, Friis/link budget, fading, fiber. This is the **signals and
communications** side.

Full evidence and sources: `~/notes/electronics/research/03-communications.md`.

## 1. System questions

- **Signal model:** continuous/discrete, deterministic/random, energy/power,
  baseband/passband.
- **Transform:** time, Fourier, Laplace, z, phasor, constellation.
- **Channel:** AWGN, bandwidth, attenuation, multipath, interference.
- **Closure:** Nyquist, Shannon, matched filter, pulse shape, coding rate.
- **Falsifier:** Parseval residual, `T+R≠1`, BER rising with SNR, capacity
  exceeded, `|Γ|>1`, link margin sign error.

## 2. Atomic topics

### Signals and transforms

| # | Topic | Relation / invariant | Misconception |
|---|---|---|---|
| 1 | Fourier / DFT | `Xk=(1/N)Σxn e^(−j2πkn/N)`; square wave fundamental `4A/π`; Gibbs 8.95% | Fourier is only sine; phase ignored |
| 2 | Laplace | `H(s)=∫h(t)e^(−st)dt`; ROC | `s=jω` always; ROC skipped |
| 3 | z-transform | `H(z)=Σh[n]z^−n`; `z=e^(jω)` | z = DFT |
| 4 | LTI / convolution | `y=h*x`; DFT product is circular | convolution = multiplication; zero-padding forgotten |
| 5 | Sampling | `fs>2fmax`; `fa=|f0−fs round(f0/fs)|`; 1.2 kHz at 1 kHz → 200 Hz | more bits fix aliasing |

### Quantization and baseband

| # | Topic | Relation / invariant | Misconception |
|---|---|---|---|
| 6 | Quantization/PCM | `SQNR=6.02n+1.76 dB`; 8 bit 49.92, 16 bit 98.08 dB | quantization = sampling |
| 7 | PAM/pulse | `Rs=Rb/log2M`; raised cosine `B=(1+α)Rs/2` | symbol rate = bit rate |
| 8 | ISI/eye | Nyquist zero-ISI; sample at `t=kT` | eye closure is only noise; ISI/jitter |
| 9 | Baseband channel | `y=x*h+n`; linear phase | channel only attenuates |

### Analog modulation

| # | Topic | Relation / invariant | Misconception |
|---|---|---|---|
| 10 | AM DSB/SSB | `s=Ac[1+m cosωmt]cosωct`; `η=m²/(2+m²)`; m=1 → 33.33% | AM efficiency is 50% |
| 11 | FM/PM | `β=Δf/fm`; Carson `B=2(β+1)fm`; β=2, fm=1 kHz → 6 kHz | FM has infinite bandwidth |
| 12 | Superheterodyne | `fIF=|fRF−fLO|`; image `fRF±2fIF`; 900/100 → 1100 MHz | image = LO−RF |
| 13 | Noise/NF/RF chain | `F=F1+(F2−1)/G1+…`; `Te=(F−1)T0` | SNR = Eb/N0 |

### Digital modulation and detection

| # | Topic | Relation / invariant | Misconception |
|---|---|---|---|
| 14 | Signal space / matched filter | `h=s(T−t)`; `SNRmax=2E/N0`; E/N0=30 dB → 33.01 dB | filter destroys noise |
| 15 | ASK/FSK/PSK | BPSK `Pb=Q(√(2Eb/N0))`; orthogonal FSK 3 dB penalty | FSK is always more robust |
| 16 | QAM/Gray | `Pb≈(4/k)(1−1/√M)Q(√(3k/(M−1) Eb/N0))`; 16-QAM 1e-5 → 13.43 dB | Gray coding gives coding gain |
| 17 | BER/Eb/N0 | BPSK 1e-5 → 9.59 dB; 1e-6 → 10.53 dB | Eb/N0 = SNR |
| 18 | Synchronization | matched filter + PLL | ideal sync is free |

### Information, coding, OFDM

| # | Topic | Relation / invariant | Misconception |
|---|---|---|---|
| 19 | Entropy/source | `H=−Σpi log2pi`; Huffman `H≤L<H+1` | entropy = compression ratio |
| 20 | Shannon | `C=B log2(1+S/N)`; 20 dB → 6.658 bit/s/Hz | Shannon gives a code |
| 21 | Channel coding | Hamming(7,4): `dmin=3`, rate 4/7; `dmin≥2t+1` | Hamming corrects all errors |
| 22 | OFDM/CP | `Δf=B/N`; LTE 15 kHz, CP 4.69 µs, overhead 6.57% | CP removes multipath fading |

### RF, lines, wireless

| # | Topic | Relation / invariant | Misconception |
|---|---|---|---|
| 23 | Transmission line | `Z0=√(L/C)`; `Γ=(ZL−Z0)/(ZL+Z0)`; 75/50 → Γ=0.2 | VSWR 1.5 = 50% loss; actual 0.177 dB |
| 24 | Smith chart | `Γy=−Γz`; reactance/susceptance | impedance = admittance; 180° rotation forgotten |
| 25 | Antenna | `D=4πUmax/Prad`; half-wave dipole 2.15 dBi, HPBW≈78° | high gain is good in every direction |
| 26 | Friis/link | `Pr=PtGtGr(λ/4πd)²`; 2.4 GHz 100 m → 80.05 dB | Friis requires LOS? It is free-space |
| 27 | Fading/Doppler/MIMO | `fd=vfc/c`; 2 GHz 60 km/h → 111.1 Hz; 2×2 iid 20 dB → 11.28 bit/s/Hz | MIMO multiplies power |
| 28 | Fiber | `αL`; `Δτ=DLΔλ`; 80 km, 0.2 dB/km → 16 dB | single-mode has no dispersion |

## 3. Twelve lab patterns

1. **Fourier.** Inputs: wave, duty, A, fs, harmonic N. Outputs: waveform,
   `|X(f)|` dB, phase. Check fundamental `4A/π`, Gibbs 8.95%, Parseval
   1.000±2e-5. Prompt: "N increases: does overshoot shrink?" No.
2. **Sampling/aliasing.** Inputs: f0, fs, sinc window. Outputs: samples,
   folded spectrum, reconstructed wave, error. Check 1.2 kHz at 1 kHz → 200 Hz;
   Nyquist 2.4 kHz; error <1% above Nyquist. Prompt: "fs below 2.4 kHz: what
   tone appears?"
3. **AM.** Inputs: m∈[0,1.5], fm, fc. Outputs: envelope, spectrum, powers, η.
   Check sidebands `fc±fm`; `η=m²/(2+m²)`; m=1 → 33.33%. Prompt: "At m=1,
   what fraction of power carries information?"
4. **FM + superheterodyne.** Inputs: β, fm, fRF, fIF, injection. Outputs:
   instantaneous frequency, Bessel sidebands, Carson, IF/image. Check β=2,
   fm=1 kHz → 6 kHz; J0 zero 2.4048; 900/100 → image 1100 MHz. Prompt: "β 2→5:
   Carson?"
5. **AWGN + matched filter.** Inputs: Eb/N0, Rb, B, pulse, filter. Outputs:
   noisy wave, filter output, sample, BER. Check
   `SNR=Eb/N0+10log10(Rb/B)`; peak at t=T; `SNRmax=2E/N0`; E/N0=30 dB →
   33.01 dB. Prompt: "Mismatched filter: does SNR rise?" No.
6. **PAM/eye.** Inputs: Rs, α, bandwidth, sampling phase. Outputs: pulse,
   spectrum, eye, ISI. Check `B=(1+α)Rs/2`; 1 MBd, α=0.5 → 750 kHz; zero ISI
   at `t=kT`. Prompt: "α 0.5→0: bandwidth and timing sensitivity?"
7. **QAM/Gray.** Inputs: M, Eb/N0, Gray on/off. Outputs: constellation,
   decision regions, SER/BER. Check `Es=(2/3)(M−1)d²`; neighbors differ by one
   bit; 16-QAM 1e-5 → 13.43 dB. Prompt: "Same Eb/N0: is 16-QAM better?" No;
   it is faster in the same bandwidth, not more power-efficient.
8. **BER + Shannon.** Inputs: modulation, Eb/N0 sweep, B, Rb. Outputs: BER,
   Shannon bound, spectral efficiency. Check BPSK 1e-5 → 9.59 dB; orthogonal
   FSK 3 dB right; 20 dB → C/B=6.658. Prompt: "3 dB more power: how many
   decades does BER fall?"
9. **Hamming/convolutional.** Inputs: 4-bit message, code, error pattern.
   Outputs: codeword, syndrome, correction, trellis. Check Hamming(7,4)
   `dmin=3`, rate 4/7; corrects one error, not two. Prompt: "Two errors?"
10. **OFDM/CP.** Inputs: N, Δf, CP, delay spread. Outputs: subcarriers,
    CP symbol, constellation, ISI/ICI. Check `Δf=B/N`; CP > delay; 15 kHz →
    CP 4.69 µs, overhead 6.57%. Prompt: "Remove CP: what breaks?"
11. **Transmission line/Smith.** Inputs: Z0, ZL, length/λ, f. Outputs: Γ,
    VSWR, Zin, Smith path. Check 75/50 → Γ=0.2, VSWR 1.5, return loss 13.98 dB;
    quarter-wave `√(50·75)=61.24 Ω`; `Γy=−Γz`. Prompt: "VSWR 1.5: how much
    loss?" 0.177 dB.
12. **Antenna/Friis/link.** Inputs: dipole/array, f, d, Pt, Gt, Gr, losses.
    Outputs: pattern, HPBW, FSPL, Pr, margin. Check dipole 2.15 dBi; 2.4 GHz
    100 m → 80.05 dB; 20+2+2−80.05 = −56.05 dBm; with −90 dBm threshold,
    margin 33.95 dB. Prompt: "Distance 2×: FSPL?" 6 dB.

## 4. dB and unit ledger

`L_dB=10log10(P2/P1)`. Voltage ratio at equal impedance:
`20log10(V2/V1)`. `P_dBm=10log10(P/1 mW)`: 0 dBm=1 mW, 30 dBm=1 W,
−90 dBm=1 pW.

`Pr(dBm)=Pt(dBm)+Gt(dBi)+Gr(dBi)−LFS(dB)−Lmisc(dB)`.

- 3 dB = ×2 power; 10 dB = ×10.
- `dBm + dBm` is meaningless. Two equal independent 20 dBm sources give
  23.01 dBm; coherent voltages give 26 dBm.
- Shannon needs linear SNR: `SNR_dB=(Eb/N0)_dB+10log10(Rb/B)`.
- `Eb/N0` is not `SNR`; in spread spectrum, SNR can be negative while Eb/N0 is
  positive.

## 5. Tools

| Tool | Use | Licence | Termux | Verdict |
|---|---|---|---|---|
| NumPy 2.5.4 | FFT/arrays | BSD-3 | installed | **oracle** |
| SciPy 1.18.1 | erfc, Bessel, signal | BSD-3 | installed | **oracle** |
| Matplotlib 3.11.2 | figures | PSF | installed | oracle |
| CommPy | QAM/coding | BSD-3 | pip, not installed | optional |
| scikit-dsp-comm | DSP blocks | BSD-2 | pip, not installed | optional |
| GNU Radio | SDR | GPL-3.0 | no package/proot | external oracle |
| SigMF | IQ metadata | CC-BY-SA-4.0 | pip | data format |
| fft.js | FFT | MIT | inline | 4.6 KB, usable |
| dsp.js | DSP blocks | MIT | inline | abandoned 2017; avoid |
| Web Audio | sound | W3C | Firefox | optional |
| KaTeX | math | MIT | CDN/local | optional; too big inline |

Implement a small radix-2 FFT, complex arithmetic, `erfc`, Bessel J0, Smith
and link budget in the page. Keep GNU Radio/CommPy as external references, not
dependencies.

## 6. Common mistakes

| Mistake | Correction |
|---|---|
| Bandwidth = bit rate | Nyquist `Rs=2B`; `Rb=Rs log2M`; 1 kHz baseband with 16-QAM carries 8 kbit/s |
| Sampling = quantization | time vs amplitude; 16 bit does not fix aliasing, 44.1 kHz does not fix quantization noise |
| AM efficiency 50% | DSB-LC `η=m²/(2+m²)`; m=1 → 33.3%; DSB-SC has no carrier |
| FM always better | below threshold it clicks; `3β²(β+1)` gain only above CNR threshold |
| dB = dBm | ratio vs absolute; 20 dB gain + 0 dBm = 20 dBm; 20+20 dBm = 23 dBm |
| Gray coding gives coding gain | it only reduces bits per symbol error; no power gain |
| Matched filter removes noise | maximizes SNR at sampling instant; does not remove noise energy |
| Eb/N0 = SNR | equal only when `B=Rb`; spread spectrum differs |
| Smith impedance = admittance | `Γy=−Γz`; rotate 180° |
| Friis = LOS requirement | Friis is free-space; indoor adds 10–30 dB |
| Ideal constellation = real | PA compression, phase noise, IQ imbalance make a cloud |
