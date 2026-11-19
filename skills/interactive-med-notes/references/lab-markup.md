# Lab HTML ve Quiz Şeması

Bu dosya, `assets/med-labs.js` motorlarının beklediği işaretlemeyi gösterir. Kopyala, `data-med-lab` değerini değiştir, içeriği güncelle. Motorlar kontrolleri kendileri üretir; bu yüzden `[data-controls]` boş bırakılır.

## Ortak iskelet

```html
<div class="medlab" data-med-lab="ENGINE">
  <header class="medlab__head">
    <p class="medlab__eyebrow">Lab 0X · Sistem</p>
    <h3>Tek cümlelik başlık</h3>
    <p>Bu lab hangi tek kavramı gösteriyor?</p>
  </header>
  <details class="predict">
    <summary>Tahmin et</summary>
    <p>Sliders'a dokunmadan önce ne olacağını yaz.</p>
  </details>
  <div class="medlab__controls" data-controls></div>
  <div class="medlab__grid">
    <div>
      <div class="medlab__canvas-wrap">
        <canvas class="medlab__canvas" data-canvas data-height="360" role="img" aria-label="…"></canvas>
      </div>
      <p class="medlab__caption">Şekil neyi gösteriyor; hangi model?</p>
    </div>
    <div class="medlab__panel">
      <div class="medlab__readout" data-readout></div>
      <p class="medlab__status" data-status aria-live="polite"></p>
      <p class="medlab__hint">Formül, birim, sınır durumu.</p>
    </div>
  </div>
  <p class="medlab__print" data-print></p>
</div>
```

## Motorlar

### `ecg`

```html
<div class="medlab" data-med-lab="ecg"> … </div>
```

Kontroller: HR (35–180), PR (80–320 ms), QRS (60–180 ms), QT (240–540 ms), eksen (−120…180°), ST (−2…4 mm). Presetler: normal, brady, tachy, avblock, wide, stemi.

### `pvloop`

```html
<div class="medlab" data-med-lab="pvloop"> … </div>
```

Kontroller: EDV (70–220 mL), Ees (0.5–5), Ea (0.5–5), HR (40–160). Presetler: normal, hfref, hfpef, afterload, exercise.

### `oxygen`

```html
<div class="medlab" data-med-lab="oxygen"> … </div>
```

Kontroller: PaO₂ (30–150), Hb (4–20), pH (7.1–7.6), sıcaklık (32–42 °C), DPG (low/normal/high), COHb (0–50%). Presetler: normal, anemia, acidosis, alkalosis, altitude, co.

### `acidbase`

```html
<div class="medlab" data-med-lab="acidbase"> … </div>
```

Kontroller: PaCO₂ (15–90), HCO₃⁻ (4–40), Na (120–155), Cl (85–120), albümin (1.5–5.5). Presetler: normal, dka, copd, vomiting, salicylate, mixed.

### `pk`

```html
<div class="medlab" data-med-lab="pk"> … </div>
```

Kontroller: yol (IV/oral), doz (10–500 mg), Vd (5–150 L), CL (0.5–20 L/h), F (0.1–1), ka (0.1–5 h⁻¹). Presetler: iv, oral, slow, highclear.

### `pd`

```html
<div class="medlab" data-med-lab="pd"> … </div>
```

Kontroller: antagonizma (none/comp/noncomp), Emax (10–100%), EC50 (0.05–10), Hill n (0.5–4), [I] (0–10), Ki (0.1–10). Presetler: full, partial, competitive, noncomp, steep.

### `epi`

```html
<div class="medlab" data-med-lab="epi"> … </div>
```

Kontroller: prevalans (0.1–50%), sensitivite (50–100%), spesifite (50–100%). Presetler: screening, clinic, confirm, rare.

### `visualfield`

```html
<div class="medlab" data-med-lab="visualfield"> … </div>
```

Kontrol: lezyon seçimi (optic-left, optic-right, chiasm, tract-left, tract-right, meyer-left, parietal-left, occipital-left, macula-left).

### `ct`

```html
<div class="medlab" data-med-lab="ct"> … </div>
```

Kontroller: WW (20–2000 HU), WL (−200…800 HU). Presetler: brain, stroke, subdural, bone, soft. Kesite tıkla → prob.

### `brachial`

```html
<div class="medlab" data-med-lab="brachial"> … </div>
```

Kontrol: lezyon seçimi (C5-C6, C8-T1, middle, lateral, posterior, medial, whole).

## Quiz

```html
<div class="medquiz" data-med-quiz data-quiz-id="kardiyovaskuler">
  <div class="medquiz__bar">
    <span>8 soru · nedensel geri bildirim</span>
    <span data-quiz-progress></span>
    <span data-quiz-score></span>
    <button class="medbtn" type="button" data-quiz-reset>Sıfırla</button>
  </div>
  <div data-quiz-questions></div>
  <script type="application/json" class="quiz-data">
  [
    {
      "prompt": "…",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "explain": "Neden A doğru; B/C/D neden yanlış."
    }
  ]
  </script>
</div>
```

Kurallar:

- En az 4, tercihen 6–10 soru.
- `answer` sıfır tabanlı indeks.
- `explain` en az 24 karakter; nedeni açıklar, yalnızca “doğru” demez.
- Çeldiriciler gerçek yanlış anlamalardan seçilir; saçma seçenek yazılmaz.
- Aynı doğru cevabı sürekli A yapma; dağıt.
- Her soru tek bir kazanımı ölçer; iki kavramı birleştiren soru ancak ileri düzeyde.

## `export_anki.py` şeması

`assets/quiz.example.json`:

```json
{
  "deck": "Tıp::Kardiyovasküler",
  "source": "Kardiyovasküler fizyoloji notu",
  "cards": [
    {
      "front": "SV = ?",
      "back": "EDV − ESV",
      "tags": ["fizyoloji", "kardiyo", "formül"]
    }
  ]
}
```

`python3 scripts/export_anki.py quiz.json --out quiz.tsv` çıktısı:

```
Front<TAB>Back<TAB>Tags<TAB>Source
```

Anki’de **File → Import** ile TSV seçilir; ilk satır başlık olarak eşlenir. Kartlar tek atomlu olmalı; “hepsi” kartı üretme.

## Baskı ve erişilebilirlik

- Canvas’a `role="img"` ve anlamlı `aria-label` ver.
- `data-status` `aria-live="polite"` olsun.
- Kontroller `<label>` içinde olsun; slider’ın `output` değeri görünür olsun.
- `data-print` cümlesi, baskıda canvas’ın yerine geçen tek cümlelik özet olsun.
- Renk tek başına anlam taşımasın; etiket veya desen ekle.
- `prefers-reduced-motion` zaten global CSS’te; labda animasyon varsa ayrıca durdur.
