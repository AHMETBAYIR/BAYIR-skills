# BME curriculum map

Course names and semester placement vary by university; the dependency chain is stable. Claim no national standard. Codes below are examples from public 2025–26 catalogues (İYTE, Yeditepe, TOBB ETÜ, Işık, GTÜ); verify the host institution's AKTS sheet.

## Course chain

| Stage | Typical Turkish course | Prerequisites | Role |
|---|---|---|---|
| Y1 | Fizik I–II, Genel Kimya, Matematik I–II | — | statics, circuits, calculus |
| Y2 | Mukavemet, Organik Kimya, Hücre Biyolojisi/Fizyoloji | Fizik, Kimya | stress–strain, biomolecules |
| Y2–Y3 | **Biyomekanik** (*Biyomekanik I/II*) | Mukavemet, Fizik | joints, tissue mechanics, gait, hemodynamics |
| Y3 | **Biyomalzemeler** | Malzeme Bilimi, Organik Kimya | metals, ceramics, polymers, degradation, biocompatibility |
| Y3 | **Biyoenstrümantasyon** (*Biyomedikal Enstrümantasyon / Cihazlar*) | Devreler, Elektronik, Fizyoloji | electrodes, amplifiers, noise, safety |
| Y3–Y4 | **Biyomedikal İşaret İşleme** | Sinyaller ve Sistemler, DSP | ECG/EMG/EEG, filtering, spectral estimation |
| Y4 | **Tıbbi Görüntüleme** | Fizik II, Sinyaller | X-ray/CT, MRI, ultrasound, PET/SPECT |
| Y4 | **Doku Mühendisliği** | Hücre Biyolojisi, Taşınım Olayları | scaffolds, ECM, transport limits |
| Y4 | **Biyosensörler** | Analitik Kimya, Biyokimya | transducers, calibration, LOD |
| Y4 seçmeli | **Nöromühendislik**, **Biyomikroakışkanlar**, **Rehabilitasyon Mühendisliği** | physiology, signals | applied extensions |

**Important:** *Biyoakışkanlar Mekaniği* is rarely a standalone undergraduate course in Turkey. Hemodynamics lives inside **Biyomekanik** (as İYTE's BE 411 syllabus shows) or inside **Taşınım Olayları**. Do not key the note on a course title that most programmes do not have.

## Prerequisite DAG

```
Fizik I (statik) ─┬→ Mukavemet ─┬→ Biyomekanik ─┬→ implant / ortopedik mekanik
Matematik I–II ───┘             │               └→ kan dinamiği
Diferansiyel Denk. ─────────────┘
Genel Kimya → Organik → Polimer ─┬→ Biyomalzemeler → Doku Mühendisliği
Malzeme Bilimi ──────────────────┘        ↑
Hücre Biyolojisi / Fizyoloji ─────────────┘
Taşınım Olayları ─────────────────────────┘

Fizik II → Devreler → Elektronik → Biyoenstrümantasyon
Kalkülüs → Sinyaller ve Sistemler → Biyomedikal İşaret İşleme
Analitik Kimya / Biyokimya → Biyosensörler
Fizik II + Radyasyon Fiziği → Tıbbi Görüntüleme
```

Pitch the lab at the lower level. A *Biyomekanik* note may assume free-body diagrams and σ = F/A, but not Bessel functions. A *Doku Mühendisliği* note may assume Fick's law, but not poroelasticity.

## Cluster A — musculoskeletal statics

| Idea | Irreducible representation | Common misconception |
|---|---|---|
| Moment | free-body diagram with force line and perpendicular distance | “moment arm = muscle length” |
| Moment arm vs angle | r(θ) and F(θ) on shared axes | “peak is at 90°” |
| Joint reaction | vector polygon: muscle + load + joint | “the joint force equals the load” |
| Lever class | effort–fulcrum–load sketch | “third-class levers are inefficient mistakes” |
| Gait | GRF trace with stance/swing | “walking load is ~1 body weight” (it is 1.1–1.3 BW) |

**Lab:** `joint`. **Check:** `check_bme.py joint --angle 90 --load 10`.

## Cluster B — tissue mechanics and viscoelasticity

| Idea | Representation | Misconception |
|---|---|---|
| Elastic modulus | stress–strain initial slope | “stiff = strong” |
| Viscoelasticity | creep + relaxation + hysteresis side by side | “one curve describes the tissue” |
| KV vs Maxwell | spring–dashpot diagram | “KV relaxes”, “Maxwell is a solid” |
| Preconditioning | repeated loading loops | “the first cycle is the material” |
| Anisotropy | fibre direction vs loading direction | “tendon is isotropic” |

**Lab:** `visco`. **Check:** `check_bme.py visco --model kv --E 1 --eta 5 --sigma 0.2 --t 7.2`.

## Cluster C — implants and bone adaptation

| Idea | Representation | Misconception |
|---|---|---|
| Stress shielding | two-material section + load-fraction bar | “shielding protects bone” |
| Bone remodelling | density–stress feedback with a lazy zone | “Wolff's law is a slogan” |
| Fatigue | S–N curve on log axes with 10⁷ line | “strong enough is enough” |
| Wear | debris + osteolysis loop | “wear is only surface loss” |
| Fixation | cementless vs cemented load transfer | “cement always loosens” |

**Lab:** `joint` (load fraction can be added as an extension). **Check:** a hand calculation of $f_s=E_sA_s/(E_sA_s+E_bA_b)$.

## Cluster D — biomaterials and scaffolds

| Idea | Representation | Misconception |
|---|---|---|
| Material classes | property map (E vs strength, E vs density) | “polymer = weak, metal = strong” |
| Degradation | mass/strength vs time | “biodegradable = disappears immediately” |
| Scaffold design | porosity–modulus–pore-size trade-off | “more porosity is always better” |
| Host response | protein adsorption → inflammation → fibrosis | “biocompatible = inert” |
| Sterilisation | dose vs material damage | “autoclave fits everything” |

**Lab:** a property-map extension (not shipped); use a static Ashby-style chart unless the interaction is essential.

## Cluster E — biofluid mechanics

| Idea | Representation | Misconception |
|---|---|---|
| Poiseuille | parabolic profile + ΔP–Q | “Poiseuille describes the aorta” |
| Reynolds | Re vs diameter/velocity | “blood is always laminar” |
| Womersley | flat core + wall layer + phase lag | “pulsatile = steady × constant” |
| Stenosis | log–log ΔP–Q with viscous/convective split | “a small narrowing is a small effect” |
| Non-Newtonian blood | viscosity vs shear rate | “blood is Newtonian” |

**Lab:** `stenosis`. **Check:** `check_bme.py stenosis --ratio 0.6`.

## Cluster F — instrumentation and signals

| Idea | Representation | Misconception |
|---|---|---|
| Electrode interface | Randles circuit + Bode | “electrode offset is noise” |
| Amplifier | block diagram with CM sources | “CMRR is one constant” |
| Sampling | time trace + alias fold + spectrum | “2× is always enough” |
| ECG | 12-lead grid + PQRST fiducials | “lead II is independent” |
| EEG | 10–20 montage + PSD bands | “EEG = summed spikes” |
| Noise | Johnson/shot/1/f + interference | “averaging removes everything” |

**Lab:** `ecg`. **Check:** `check_bme.py ecg --hr 72 --axis 60`.

## Cluster G — medical imaging

| Idea | Representation | Misconception |
|---|---|---|
| X-ray attenuation | Beer–Lambert + spectrum | “density alone determines brightness” |
| CT | sinogram → reconstruction → HU window | “HU is absolute” |
| MRI | T1/T2 recovery curves + k-space | “T1-weighted = proton density” |
| Ultrasound | A-mode echo train + Doppler | “Doppler gives velocity” |
| Image quality | resolution/contrast/SNR/CNR/MTF | “more pixels = better image” |

**Lab:** `ct`. **Check:** `check_bme.py ct --level 40 --width 400`.

## Cluster H — biosensors

| Idea | Representation | Misconception |
|---|---|---|
| Transduction | calibration curve + circuit | “current ∝ concentration” everywhere |
| Michaelis–Menten | v–[S] saturation | “Km = affinity” |
| LOD/LOQ | 3σ/10σ construction | “LOD is the lowest tested point” |
| Selectivity | interferent response | “a single analyte is realistic” |
| Pulse oximetry | empirical R–SpO₂ curve | “Beer–Lambert gives SpO₂” |

**Lab:** `michaelis`. **Check:** `check_bme.py michaelis --vmax 100 --km 50 --s 50 --inhib comp --i 50 --ki 50`.

## Assessment archetypes

- Free-body analysis of a joint with muscle force and external load.
- Read modulus, yield, UTS, and toughness from one curve.
- Choose a viscoelastic model from a creep/relaxation dataset.
- Select a material against a property table and a constraint.
- Compute a diffusion-limited thickness and defend the assumptions.
- Compute ΔP across a stenosis and say which term dominates.
- Read an ECG axis and explain a lead.
- Window a CT and explain why contrast changed.
- Calibrate a biosensor and report sensitivity, LOD, and selectivity together.
