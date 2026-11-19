# Etkileşimli Lab Desenleri

Her desen tek bir kavramı izole eder. Bir labın çıktısı yalnızca “güzel bir grafik” ise, metinle değiştirilmelidir. Her labda **tahmin**, **tek parametre**, **bağımsız kontrol** ve **nedensel durum satırı** bulunur.

## 1. ECG (`ecg`)

**Kavram:** elektriksel eksen, zaman aralıkları, repolarizasyon.

**Girdi:** HR, PR, QRS, QT, eksen, ST.
**Çıktı:** sentetik lead II ritim stripi, I/II/III projeksiyonları, eksen çemberi, QTcB/QTcF.
**Formüller:**

- `RR = 60 / HR`
- `QTcB = QT / √RR`, `QTcF = QT / ∛RR`
- `II = I + III`; `aVR = −(I + II)/2`
- Eksen projeksiyonu: `L(θ) = cos(eksen − θ)`, θ = 0° (I), 60° (II), 120° (III), 90° (aVF).

**Şunu fark et:** Aynı QT, yüksek hızda daha uzun QTcB verir; QRS genişliği QT ölçümünü etkiler.
**Yaygın hata:** Sentetik izi tanısal sanmak; Bazett’i her hızda doğru sanmak; J noktasını 60 ms sonra okumak.
**Doğrulama:** HR 60 → RR 1 s; QT 400 → QTcB 400. Eksen 60° → II = 1, I = 0,5, III = 0,5 (II = I + III).
**Sınır:** 12 derivasyon yok; prekordiyal patoloji yok; artefakt yok.

## 2. PV loop (`pvloop`)

**Kavram:** preload, kontraktilite, afterload ve bunların SV/EF/CO’ya etkisi.

**Girdi:** EDV, Ees, Ea, HR; V₀ = 15 mL.
**Çıktı:** ESV, SV, EF, CO, Pes, stroke work, PV döngüsü.
**Formüller:**

- `ESV = (Ees·V₀ + Ea·EDV) / (Ees + Ea)`
- `SV = EDV − ESV`; `EF = SV/EDV`; `CO = SV·HR/1000`
- `Pes = Ees·(ESV − V₀)`
- `SW ≈ Pes·SV(L)·0.1333 J`
- `Ea = Pes/SV` (modelde girdi; türetilmiş değil)

**Şunu fark et:** Ea ↑ → ESV ↑, SV ↓; Ees ↓ → aynı yönde SV ↓ ama mekanizma farklı. EF normal kalabilir.
**Yaygın hata:** Ea’yı SVR ile eşitlemek; EF’yi CO sanmak; mL/L dönüşümünü atlamak; SW’yi mL ile çarpmak.
**Doğrulama:** EDV 120, Ees 2.5, Ea 2.0 → ESV 61.7, SV 58.3, EF %48.6, CO 4.08 L/dk, SW 0.91 J.
**Sınır:** Lumped elastans; kapak hastalığı, perikard, ventriküler etkileşim yok.

## 3. O₂–Hb (`oxygen`)

**Kavram:** satürasyon ile oksijen içeriği arasındaki fark; sağa/sola kayma.

**Girdi:** PaO₂, Hb, pH, sıcaklık, 2,3-DPG, COHb.
**Çıktı:** P50, SaO₂, CaO₂, DO₂ (CO = 5 L/dk varsayımı), eğri.
**Formüller:**

- `SaO₂ = PaO₂ⁿ / (P50ⁿ + PaO₂ⁿ)`, n ≈ 2.7
- `P50 = 26.6 × 10^(−0.48(pH − 7.4)) × (1 + 0.03(T − 37)) × DPGf`
- `CaO₂ = 1.34·Hb_eff·SaO₂ + 0.003·PaO₂`
- `Hb_eff = Hb·(1 − COHb/100)`
- `DO₂ = CaO₂·CO·10`

**Şunu fark et:** SaO₂ normal, CaO₂ düşük olabilir (anemi, CO); P50 sağa kayması aynı PaO₂’de SaO₂’yi düşürür ama dokuya bırakmayı artırır.
**Yaygın hata:** SaO₂ = CaO₂; CO zehirlenmesinde pulse oksimetreye güvenmek; P50’yi sabit sanmak.
**Doğrulama:** pH 7.4, T 37, DPG normal → P50 26.6; PaO₂ 95, Hb 15 → SaO₂ ≈ %96.9, CaO₂ ≈ 19.8 mL/dL.
**Sınır:** Hill yaklaşımı; dispne/şant/V/Q yok; pulse oksimetre spektroskopisi yok.

## 4. Asit–baz (`acidbase`)

**Kavram:** primer bozukluk, kompansasyon, anyon açığı, delta oranı.

**Girdi:** PaCO₂, HCO₃⁻, Na, Cl, albümin.
**Çıktı:** pH, primer bozukluk, beklenen kompansasyon, AG, düzeltilmiş AG, delta.
**Formüller:**

- `pH = 6.1 + log10[HCO₃/(0.03·PaCO₂)]`
- Metabolik asidoz: `PaCO₂ = 1.5·HCO₃ + 8 ± 2` (Winter)
- Metabolik alkaloz: `PaCO₂ = 0.7·HCO₃ + 21 ± 2`
- Respiratuar asidoz: akut `HCO₃ = 24 + 0.1·(PaCO₂ − 40)`; kronik `24 + 0.35·(…)`
- Respiratuar alkaloz: akut `24 − 0.2·(40 − PaCO₂)`; kronik `24 − 0.4·(…)`
- `AG = Na − (Cl + HCO₃)`; `AG_düz = AG + 2.5·(4 − albümin)`
- `delta = (AG − 12)/(24 − HCO₃)` (metabolik asidozda)

**Şunu fark et:** pH normal olsa bile yüksek AG gizli metabolik asidoz olabilir; kompansasyon tam değildir.
**Yaygın hata:** Sadece pH’a bakmak; hipoalbüminemiyi atlamak; beklenen değeri hesaplamadan “kompanze” demek.
**Doğrulama:** PaCO₂ 40, HCO₃ 24 → pH 7.40, AG 12; DKA 25/10 → pH ≈ 7.29, Winter 23 ± 2.
**Sınır:** Dışsal anyonlar, laktat, keton ölçümü yok; karmaşık mikst bozukluklar için tam kan gazı gerekir.

## 5. PK (`pk`)

**Kavram:** bir/iki kompartman, biyoyararlanım, yarılanma ömrü, AUC.

**Girdi:** doz, Vd, CL, F, ka, yol.
**Çıktı:** C(t), Cmax, Tmax, t½, AUC, eğri.
**Formüller:**

- `k = CL/Vd`; `t½ = ln2/k`; `AUC = F·D/CL`
- IV: `C(t) = (D/Vd)·e^(−kt)`
- Oral: `C(t) = F·D·ka/[Vd(ka − k)]·(e^(−kt) − e^(−kat))`
- `Tmax = ln(ka/k)/(ka − k)` (ka ≠ k)
- Yükleme: `LD = Vd·Css/F`; idame: `MD = CL·Css·τ/F`

**Şunu fark et:** t½ dozdan bağımsızdır; F ve CL AUC’yi belirler; ka Tmax’ı belirler.
**Yaygın hata:** log10/ln karıştırmak; AUC = D/Vd sanmak; ka = k limitini atlamak; F’yi unutmak.
**Doğrulama:** D 100, Vd 50, CL 5, IV → C0 2 mg/L, t½ 6.93 h, AUC 20 mg·h/L. Oral F 0.6, ka 1 → AUC 12, Tmax ≈ 2.56 h.
**Sınır:** Tek kompartman; aktif metabolit, prodrug, hedef aracılı dağılım yok.

## 6. PD (`pd`)

**Kavram:** güç (EC50) vs etkinlik (Emax), antagonizma tipleri.

**Girdi:** Emax, EC50, Hill n, mod (yok/kompetitif/nonkompetitif), [I], Ki.
**Çıktı:** doz–yanıt eğrisi, EC50′, Emax′, doz oranı.
**Formüller:**

- `E = Emax·Cⁿ/(EC50ⁿ + Cⁿ)`
- Kompetitif: `EC50′ = EC50·(1 + [I]/Ki)`; Emax korunur.
- Nonkompetitif: `Emax′ = Emax/(1 + [I]/Ki)`; EC50 çoğunlukla korunur.
- `DR = EC50′/EC50 = 1 + [I]/Ki`

**Şunu fark et:** Kompetitif antagonizma doz artırılarak aşılabilir; nonkompetitif tavanı düşürür.
**Yaygın hata:** EC50 = Kd; güç = etkinlik; her sağa kaymayı kompetitif sanmak; pA2 = −log EC50 sanmak.
**Doğrulama:** Emax 100, EC50 1 → E(1) = 50; [I] = Ki → DR 2.
**Sınır:** Basit Emax; reseptör rezervi, biased agonism, tolerans, allosterik modülasyon yok.

## 7. 2×2 (`epi`)

**Kavram:** test performansı, prevalans ve PPV.

**Girdi:** prevalans, sensitivite, spesifite; N = 1000.
**Çıktı:** TP/FN/FP/TN, PPV, NPV, LR+, LR−, doğruluk, kohort barı.
**Formüller:**

- `Sens = TP/(TP+FN)`; `Spec = TN/(TN+FP)`
- `PPV = TP/(TP+FP)`; `NPV = TN/(TN+FN)`
- `LR+ = Sens/(1−Spec)`; `LR− = (1−Sens)/Spec`
- `Doğruluk = (TP+TN)/N`

**Şunu fark et:** Aynı sensitivite/spesifite, farklı prevalansta farklı PPV verir. Prevalans %1’de PPV %15 olabilir.
**Yaygın hata:** PPV’yi sensitivite sanmak; base-rate neglect; referans standardın kusursuz olduğunu varsaymak.
**Doğrulama:** %10/%90/%95 → TP 90, FN 10, FP 45, TN 855; PPV %66.7, NPV %98.8, LR+ 18.
**Sınır:** Mükemmel referans standardı; spectrum bias yok; test bağımsızlığı yok.

## 8. Görme alanı (`visualfield`)

**Kavram:** optik yol lezyonlarının görme alanı paterni.

**Girdi:** lezyon yeri (optik sinir, kiazma, trakt, Meyer, parietal, oksipital, makula).
**Çıktı:** iki gözde şematik alan kaybı, patern, makula durumu.
**Kurallar:**

- Optik sinir → ipsilateral monoküler kayıp.
- Kiazma → bitemporal hemianopi.
- Trakt → kontralateral homonim hemianopi.
- Meyer (temporal lob) → kontralateral üst kuadrantanopi.
- Parietal radyasyon → kontralateral alt kuadrantanopi.
- Oksipital korteks → kontralateral homonim hemianopi, makula korunabilir.
- Makula → santral skotom.

**Şunu fark et:** Kiazma öncesi lezyonlar monoküler; retrokiazmal lezyonlar homonimdir.
**Yaygın hata:** Homonim hemianopiyi kiazma sanmak; makula korunmasını atlamak; görme keskinliği ile alanı karıştırmak.
**Doğrulama:** 7 kanonik vaka; her patern için bir örnek.
**Sınır:** Şematik grid; gerçek perimetri değil; bireysel varyasyon.

## 9. BT penceresi (`ct`)

**Kavram:** Hounsfield birimi, pencere genişliği/seviyesi, görüntüleme vs tanı.

**Girdi:** WW, WL, prob (x,y).
**Çıktı:** sentetik aksiyal kesit, gri ton, probun HU’su ve dokusu.
**Formüller:**

- `HU = 1000(μ − μwater)/μwater`
- Pencere: `[WL − WW/2, WL + WW/2]`
- Gri ton: `g = clamp((HU − (WL − WW/2))/WW, 0, 1)`

**Şunu fark et:** Aynı HU, farklı WW/WL ile farklı gri tonunda görünür; pencereleme tanıyı değil görüntülemeyi değiştirir.
**Yaygın hata:** WW/WL’yi karıştırmak; HU’yu parlaklık sanmak; kemik penceresinde yumuşak doku kontrastı beklemek.
**Doğrulama:** HU 40, WW 80, WL 40 → g 0.5; kemik penceresi 2000/500.
**Sınır:** Sentetik phantom; foton istatistiği, scatter, rekonstrüksiyon yok.

## 10. Brachial plexus (`brachial`)

**Kavram:** kök–trunkus–divizyon–kord–terminal dal organizasyonu ve lezyon lokalizasyonu.

**Girdi:** lezyon düzeyi.
**Çıktı:** tutulan dallar, motor/duyu defisiti, korunan yapılar, şema.
**Kurallar:**

- C5–C6 / üst trunkus (Erb): deltoid, biceps, brachialis, brachioradialis; omuz abdüksiyonu ve dirsek fleksiyonu kaybı; “waiter’s tip”; lateral kol/ön kol duyusu.
- C8–T1 / alt trunkus (Klumpke): el intrinsikleri, parmak fleksörleri; pençe el; medial kol/ön kol/el duyusu; T1 sempatik → Horner.
- Orta trunkus (C7): triceps, el bileği ekstansörleri, orta parmak.
- Lateral kord: musculocutaneous + median lateral kök; dirsek fleksiyonu, ön kol pronasyonu.
- Posterior kord: axillary + radial; omuz abdüksiyonu/dış rotasyonu, dirsek/bilek/parmak ekstansiyonu.
- Medial kord: ulnar + median medial kök; el intrinsikleri, medial duyu.

**Şunu fark et:** Kök lezyonunda dorsal scapular ve long thoracic korunabilir; trunkus lezyonunda bu dallar etkilenir. C5–C6’da el intrinsikleri korunur; C8–T1’de proksimal kaslar korunur.
**Yaygın hata:** Tek sinir lezyonu ile pleksus lezyonunu karıştırmak; Horner’ı atlamak; dermatomu mutlak sınır sanmak.
**Doğrulama:** Erb ve Klumpke kanonik vakaları; MRC 0–5 ve duyu haritası.
**Sınır:** Şematik; bireysel anatomi, pre/post-ganglionik ayrım ve sinir transferi yok.

## Ortak lab iskeleti

Her lab şu sırayı izler:

1. **Başlık + tek cümlelik amaç.**
2. **Tahmin kutusu** (slider’dan önce).
3. **Kontroller** (1–3 parametre; reset ve preset).
4. **Canvas** (SVG/Canvas; aria-label).
5. **Okuma paneli** (sayı + birim).
6. **Durum satırı** (neden; bayraklar).
7. **İpucu** (formül/sınır).
8. **Baskı özeti** (`data-print`).

Bu iskeletin dışına çıkan lab, genellikle ya çok şey anlatır ya da hiçbir şeyi ölçmez.
