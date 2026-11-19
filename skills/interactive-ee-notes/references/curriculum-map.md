# Turkish EE curriculum map

This map is a routing aid, not a claim about the student's own plan. Course
codes and semester placement change; verify against the current Bologna page
before putting a code in a note. **[V]** = checked in an official catalogue,
**[I]** = cross-case inference.

The full evidence tables are in `~/notes/electronics/research/06-curriculum-audit.md`.

## 1. Three labels, one family

| Label | Focus | Typical required spine |
|---|---|---|
| **Elektrik Mühendisliği** | power: generation, transmission, distribution, machines, HV, installations | circuits → machines → transmission/distribution → HV/protection |
| **Elektrik-Elektronik Mühendisliği** | broad EEE; power is a track | circuits → electronics → signals → digital → track electives |
| **Elektronik (ve Haberleşme) Mühendisliği** | devices, analog/digital, signals, communications, RF | circuits → electronics → signals → communications → RF/DSP |

A note must not assume that every EEE student has seen a transformer
equivalent circuit or a load-flow Jacobian. Index notes by **concept and
prerequisite**, not by "semester 5 of university X".

## 2. Course names (TR → EN)

| Turkish | English | Typical content |
|---|---|---|
| Devre Teorisi / Devre Analizi | Circuit Theory / Analysis | KCL/KVL, node/mesh, Thevenin, op-amp, transients, RLC |
| Elektronik I/II | Electronics I/II | diodes, BJT, MOSFET, bias, small-signal, op-amps |
| Sayısal Elektronik / Mantık Devreleri | Digital Electronics / Logic Design | Boolean, K-map, combinational, flip-flops, FSM |
| Sinyaller ve Sistemler | Signals and Systems | LTI, convolution, Fourier, Laplace, z, sampling |
| Olasılık ve Rastgele Süreçler | Probability / Random Processes | probability, random variables, noise |
| Analog Haberleşme | Analog Communications | AM/FM/PM, receivers, noise, SNR |
| Sayısal Haberleşme | Digital Communications | PAM, PSK/QAM, ISI, BER, synchronization |
| Bilgi Teorisi ve Kodlama | Information Theory and Coding | entropy, capacity, Hamming, convolutional, LDPC |
| Elektromanyetik Alanlar / Dalgalar | EM Fields / Waves | Maxwell, plane waves, reflection, transmission lines |
| Antenler ve Mikrodalga | Antennas and Microwave | radiation, patterns, Smith chart, matching |
| Elektrik Makineleri | Electrical Machines | transformers, DC, induction, synchronous |
| Güç Sistemleri / Enerji İletimi | Power Systems / Transmission | per-unit, load flow, faults, protection |
| Yüksek Gerilim Tekniği | High Voltage Engineering | breakdown, insulation coordination, testing |
| Güç Elektroniği | Power Electronics | rectifiers, DC-DC, inverters, PWM, losses |
| Mikroişlemciler / Gömülü Sistemler | Microprocessors / Embedded | ARM, memory, GPIO, timers, interrupts, ADC |
| Kontrol Sistemleri | Control Systems | transfer functions, root locus, Bode, PID |
| Sayısal İşaret İşleme | Digital Signal Processing | DFT/FFT, FIR/IIR, filter design |

## 3. The shared first-four-semester trunk

Across İTÜ, ODTÜ/METU, Boğaziçi, YTÜ, KTÜ, Bilkent, Koç and Sabancı, the
**content** is remarkably stable; the **order** is not.

| Block | Courses | Prerequisite role |
|---|---|---|
| Mathematics | Calculus I–II, linear algebra, differential equations | everything |
| Physics | Physics I–II (mechanics, EM) | circuits, EM |
| Circuits | Circuit Theory I–II + lab | electronics, machines, communications |
| Electronics | Electronics I (devices + bias) | analog, digital, power electronics |
| Digital | Digital Logic / Digital Systems | microprocessors, FPGA, computer architecture |
| Signals | Signals and Systems I | communications, DSP, control |
| EM | EM Fields I | transmission lines, antennas, RF |
| Probability | Probability / Random Processes | communications, noise, estimation |
| Programming | C/Python + lab | embedded, DSP, projects |

Order anomalies to remember:

- Bilkent teaches **analog electronics before circuit theory**.
- Koç teaches **signals and digital design before circuits**.
- KTÜ delays **signals** to semester 5.
- YTÜ Electrical has **no standalone signals course** in the first four semesters.
- Boğaziçi requires only a **survey energy-conversion** course, not a power-system sequence.

## 4. Track divergence

| Track | Required spine | High-value electives |
|---|---|---|
| **Power** | machines I–II, power electronics, power systems analysis, HV, transmission, distribution, protection | renewables, smart grids, power quality, FACTS, drives, traction |
| **Electronics** | analog electronics, electronics lab, semiconductor devices, analog IC, VLSI, digital IC | RF IC, CMOS, MEMS, photonics, sensors, HDL/EDA |
| **Communications** | communications I–II, digital communications, information theory/coding, antennas, microwave | wireless, satellite, fiber, 5G/6G, DSP for communications |
| **Signals/control** | signals II, DSP, feedback control, random processes | adaptive DSP, image/video, speech, ML, robotics, optimization |
| **Common capstone** | design I–II / graduation project, internship, ethics, economics | interdisciplinary design |

## 5. Turkish terminology traps

| Turkish | English | Trap |
|---|---|---|
| çevre / göz | loop / mesh | "Çevre" also means environment |
| düğüm / dal / kol | node / branch | "Kol" is common for branch |
| gerilim / akım | voltage / current | "Voltaj" is colloquial |
| kondansatör / sığaç | capacitor | "Sığaç" is purist and rare |
| işlemsel yükselteç | op-amp | "Yükselteç" = amplifier |
| geribesleme / kazanç | feedback / gain | negative feedback = "negatif geribesleme" |
| empedans / fazör | impedance / phasor | not "direnç"; not "faz" |
| etkin değer | RMS | "tepe" = peak |
| güç katsayısı | power factor | `cos φ` |
| reaktif / görünür güç | reactive / apparent power | var / VA |
| doğrultucu / evirici / kıyıcı | rectifier / inverter / chopper | "dönüştürücü" = converter |
| kutuplama / küçük işaret | biasing / small-signal | context decides |
| işaret / sinyal | signal | course names vary |
| evrişim / dürtü yanıtı | convolution / impulse response | "konvolüsyon" colloquial |
| kararlılık / sönümleme | stability / damping | "sönümleme" also attenuation |
| haberleşme / modülasyon | communications / modulation | "iletişim" = interpersonal |
| örnekleme / nicemleme | sampling / quantization | "kuantalama" colloquial |
| elektrik makinaları / uyarma | machines / excitation | "uyarma" ≠ warning |
| şalt / kesici / topraklama | switchgear / breaker / earthing | "salt" = only |

Use TDK spelling, decimal comma in Turkish prose, decimal point inside math,
and upright units (`5\,\mathrm{V}`, `10\,\mathrm{k\Omega}`).

## 6. Assessment patterns and note features

| Course | Verified assessment | Note feature |
|---|---|---|
| GTU ELM 225 | 30% midterm + 40% final + 14% homework + 14% project + 2% quizzes | worked problems, project scaffold, timed retrieval |
| YTÜ Electrical/EHB | 60% in-term + 40% final | classic-problem drills, formula sheet |
| KTÜ EEE | 50% midterm + 50% final; final ≥45/100 | cumulative retrieval, boundary cases |
| Sabancı EE 200 | 40% midterm + 10% quiz + 50% assignment/lab project | lab report template, measurement table |

Typical format **[I]**: 1–2 hour midterm with 3–5 classic problems; 2 hour
final with 4–6 cumulative problems; labs require pre-lab, measurement and
report; projects require design, simulation and demo.

## 7. Folder convention

```
~/notes/electronics/
├── index.html
├── README.md
├── research/                 # six research dossiers
├── courses/
│   └── elm225-devre-teorisi-i/
│       ├── index.html
│       ├── src/<topic>.content.html
│       ├── src/<topic>.meta.json
│       └── <topic>.html
├── labs/                     # gallery / regression fixtures
└── assets/circuits/          # copied netlists and SVGs with provenance
```

Rules: ASCII lowercase, hyphen-separated, Turkish characters transliterated
(`ç→c`, `ğ→g`, `ı→i`, `ö→o`, `ş→s`, `ü→u`). The course folder carries the code;
the topic file does not repeat it. Keep the 57 MB `~/notes/Devre` source vault
separate; link to it, do not move it (relative `circuitproof/cases` paths break).

## 8. Build order

For a broad EEE student:

1. **AC devre analizi** — phasors, impedance, AC power, three-phase; lab `bode` + `dc`.
2. **Elektronik I: diyot ve BJT** — diode models, rectifiers, Zener, BJT bias; lab `bjt`.
3. **Sayısal devreler** — Boolean, K-map, flip-flops, counters, FSM; lab `logic`.
4. **Sinyaller ve sistemler I** — LTI, convolution, Fourier, Laplace, sampling; lab `sampling`.
5. **Elektronik II: MOSFET ve analog** — MOSFET bias, CS/CD/CG, mirrors, diff pair; lab `bjt` (MOSFET variant) or static.
6. **EM alanlar ve dalgalar** — Maxwell, plane waves, transmission lines, Smith; lab `link` + static Smith.
7. **Kontrol sistemleri** — transfer functions, Routh, root locus, Bode, PID; lab `bode`.
8. **Mikroişlemciler** — ARM, memory, GPIO, timers, interrupts, ADC; static + `logic`.
9. **Haberleşme I** — AM/FM, receivers, noise, sampling; labs `am`, `sampling`.
10. **Elektrik makinaları** — transformers, DC/induction/synchronous; static + `dc`.
11. **DSP** — sampling, z, DFT/FFT, FIR/IIR; labs `sampling`, `bode`.
12. **Güç elektroniği** — rectifiers, buck/boost, inverters, PWM; static + `bjt`/`bode`.

If the student is power-track, build 10 and 12 before 9 and 11. If
communications/electronics, build 9 and 11 before 10 and 12.

## 9. Sources

Official catalogues are listed in `06-curriculum-audit.md` and
`01-electrical.md` / `02-electronics.md` / `03-communications.md` under
`~/notes/electronics/research/`. Re-check the student's own plan before
quoting a course code, credit, ECTS or prerequisite.
