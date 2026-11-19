# Doğruluk, Birimler ve Klinik Güvenlik

Bu dosya, tıp notunun “doğru görünen ama yanlış” olmasını engelleyen kontrol listesidir. Kural: **her sayı, her birim, her eşik ve her atıf ikinci kez kontrol edilir.**

## 1. Birim disiplini

| Büyüklük | Doğru yazım | Sık hata |
|---|---|---|
| Basınç | mmHg, cmH₂O | Pa ile karıştırmak; 1 cmH₂O ≈ 0.098 kPa |
| Hacim | mL, L | SV mL, CO L/dk; 1000 ile bölmeyi unutmak |
| Akım | L/dk, mL/dk, mL/s | Poiseuille’de m³/s’ye çevirmemek |
| Konsantrasyon | mg/dL, g/dL, mEq/L, µmol/L, ng/mL | mg/L ile mg/dL; µmol/L ↔ mg/dL dönüşümü |
| Klerens | mL/dk, L/saat | CKD-EPI mL/dk/1.73 m²; Cockcroft mL/dk |
| Oksijen içeriği | mL O₂/dL kan | SaO₂ (%) ile CaO₂ (mL/dL) karıştırmak |
| Enerji | J | mmHg × mL → J: ×0.0001333 |
| Hounsfield | HU | HU’yu parlaklık sanmak |
| İlaç | mg, µg, mg/kg, mg/m² | µg/mg; tuz/baz; pediatrik doz |
| Zaman | ms, s, saat, gün | QT ms, t½ saat |
| Büyüme | z, persentil | z ile persentil eşitlemek |

**Kural:** Formüle koymadan önce birimi dönüştür; sonucu tekrar birimle yaz. Birim boyutu tutmuyorsa formül yanlıştır.

## 2. Formül kartları

### Kardiyovasküler
- `SV = EDV − ESV`
- `EF = SV/EDV` (fraksiyon; % için ×100)
- `CO = SV × HR` (SV mL, HR /dk → CO mL/dk; /1000 → L/dk)
- `MAP = DBP + (SBP − DBP)/3` (veya `(SBP + 2DBP)/3`)
- `SVR = 80 × (MAP − CVP)/CO` (dyn·s·cm⁻⁵; CO L/dk)
- `SW ≈ Pes × SV(L) × 0.1333 J`
- `QTcB = QT/√RR`; `QTcF = QT/∛RR`

### Solunum
- `PAO₂ = FiO₂ × (Patm − PH₂O) − PaCO₂/RQ`; deniz seviyesinde `FiO₂ × 713 − PaCO₂/0.8`
- `A−a = PAO₂ − PaO₂`
- `CaO₂ = 1.34 × Hb × SaO₂ + 0.003 × PaO₂`
- `DO₂ = CaO₂ × CO × 10`
- `P = 2T/r` (alveol; küre için 4T/r değil)

### Asit–baz
- `pH = 6.1 + log10[HCO₃/(0.03 × PaCO₂)]`
- `AG = Na − (Cl + HCO₃)`; `AG_düz = AG + 2.5 × (4 − albümin)`
- Winter: `PaCO₂ = 1.5 × HCO₃ + 8 ± 2`
- Metabolik alkaloz: `PaCO₂ = 0.7 × HCO₃ + 21 ± 2`
- `delta = (AG − 12)/(24 − HCO₃)`

### Renal
- `Cx = Ux × V̇ / Px` (birimler tutarlı)
- `GFR = Kf × net filtration pressure`
- `FF = GFR/RPF`; `RBF = RPF/(1 − Hct)`
- CKD-EPI 2021: `142 × min(Scr/κ,1)^α × max(Scr/κ,1)^−1.200 × 0.9938^age × 1.012 (F)`
  - κ = 0.7 (F), 0.9 (M); α = −0.241 (F), −0.302 (M)

### Farmakoloji
- `k = CL/Vd`; `t½ = ln2/k`; `AUC = F·D/CL`
- IV: `C = (D/Vd)e^(−kt)`
- Oral: `C = F·D·ka/[Vd(ka−k)] × (e^(−kt) − e^(−kat))`
- `LD = Vd·Css/F`; `MD = CL·Css·τ/F`
- `E = Emax·C^n/(EC50^n + C^n)`
- Kompetitif: `EC50′ = EC50(1 + [I]/Ki)`; nonkompetitif: `Emax′ = Emax/(1 + [I]/Ki)`

### Epidemiyoloji
- `Sens = TP/(TP+FN)`; `Spec = TN/(TN+FP)`
- `PPV = TP/(TP+FP)`; `NPV = TN/(TN+FN)`
- `LR+ = Sens/(1−Spec)`; `LR− = (1−Sens)/Spec`
- `RR = risk_t/risk_c`; `OR = ad/bc`
- `ARR = |risk_t − risk_c|`; `NNT = 1/ARR`
- `HIT = 1 − 1/R0`; `Re = R0(1 − VE·c)`

### Pediatri
- WHO LMS: `Z = ((X/M)^L − 1)/(L·S)`; L = 0 → `ln(X/M)/S`
- Holliday–Segar: 100/50/20 mL/kg/gün (0–10, 10–20, >20 kg)
- Dehidratasyon defisiti: `% × kg × 10 mL`
- Parkland: `4 mL/kg/%TBSA/24 saat`; ilk 8 saatte yarısı
- Apgar: 5 bileşen × 0–2 = 0–10
- Bishop: 5 bileşen; toplam 0–13

### Nöroloji
- `CPP = MAP − ICP`
- `MAP = (SBP + 2DBP)/3`
- GCS = E + V + M (3–15); GCS-P = GCS − pupil reactivity score
- NIHSS 0–42 (11 madde)

### Radyoloji
- `HU = 1000(μ − μwater)/μwater`
- Pencere: `[WL − WW/2, WL + WW/2]`
- `g = clamp((HU − low)/WW, 0, 1)`

## 3. Klinik eşikler ve sürüm

- Her eşiğin yanında **kaynak + yıl** olmalı: “ESC 2023”, “KDIGO 2024”, “GOLD 2026”, “ADA 2026”.
- Kılavuz sürümleri değişir; notun içinde “sürüm kartı” olsun: tarih, ne değişti, eski kaynakla fark.
- Tanı eşiği ile tedavi eşiğini ayır. Örn. diyabet tanısı, HbA1c; tedavi hedefi ayrı.
- Pediatri/gebelik/yaşlı/renal/hepatik özel popülasyonlarda eşikler değişebilir; not bunu söylemeli.
- “Normal” aralık laboratuvar/assay’a göre değişir; birim ve yöntem yazılmalı.

## 4. Klinik güvenlik

- Not **tanı koymaz**, **doz vermez**, **tedavi protokolü yazmaz**. “Eğitim amaçlıdır” bandı görünür olmalı.
- Kırmızı bayraklar (göğüs ağrısı, nörolojik defisit, sepsis, anafilaksi, intihar riski, gebelik acilleri) ayrı kutuda ve “acil değerlendirme” yönlendirmesiyle verilmeli.
- Skorlar tanı değildir; her skorun “ne değildir” kutusu olsun.
- İntihar/psikiyatri içeriğinde güvenlik kaynakları (112, 183, YEDAM 115) ve “182 kriz hattı değildir” notu.
- Pediatri/obgyn’de doz ve resüsitasyon protokolü kılavuza bırakılmalı; hesaplayıcı “eğitim modeli” etiketli olmalı.
- Hasta verisi: isim, MRN, tarih, yüz, DICOM metadata, ekran görüntüsü yok. Sentetik vaka kullan.

## 5. Telif

- Ticari soru bankası, slayt, figür ve atlas görseli kopyalanmaz.
- CC BY-NC-SA: atıf + ticari olmayan + aynı lisans.
- CC BY-SA: atıf + aynı lisans (ticari olabilir).
- CC BY-NC-ND: değiştirme yok; notta uyarlama yapma.
- DUA/credentialed veri: hasta verisi; notta kullanılmaz.
- AI çıktısı kaynağı birebir üretebilir; “AI üretti” telif istisnası değildir.
- Kendi SVG’n, kendi tablon, kendi vakan en güvenli yol.

## 6. AI doğruluk kontrolü

- Her PMID/DOI’yi aç; başlık, yıl, dergi ve iddia eşleşiyor mu?
- Her sayıyı ikinci kez hesapla; LLM’in aritmetiğine güvenme.
- Her görseli insan doğrulasın; etiketler yanlış olabilir.
- Her labın sınır durumunu test et; “0, 1, ∞”de ne oluyor?
- Kaynakta olmayan bilgi için “kaynakta yok” yaz; boşluğu uydurma ile doldurma.

## 7. Laboratuvar doğrulama

Bir lab yayına hazırsa:

- [ ] Formül, sembol ve birimler ekranda görünüyor.
- [ ] Girdi aralıkları fizyolojik ve uç değerleri reddediyor.
- [ ] Sınır durumları (0, 1, ∞) çökmüyor.
- [ ] Bağımsız hesaplayıcı aynı sonucu veriyor.
- [ ] Durum satırı nedeni açıklıyor, yalnızca sayıyı tekrarlamıyor.
- [ ] “Model, hasta değildir” cümlesi var.
- [ ] `data-print` baskıda okunuyor.
- [ ] Klavye ve aria-label çalışıyor.
- [ ] Koyu tema ve 390 px’te kontrast/overflow sorunu yok.

## 8. Kaynakça

- Guyton & Hall; Robbins & Cotran; Katzung; Harper; Moore.
- ESC, AHA/ACC, GOLD, KDIGO, ADA, IDSA, WHO, NICE, ACOG, AAP, NICHD.
- OpenStax; Radiopaedia; ECGpedia; WebPath.
- KVKK 6698; FSEK 5846; WCAG 2.2.
- Bhattacharyya ve ark. 2023; Gordon ve ark. 2024; Lewis ve ark. 2020.
