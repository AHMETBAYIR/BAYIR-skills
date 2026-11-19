# İç Hastalıkları — Araştırma Notu

> Dönem 4–5 / TUS; hesaplanabilir klinik akıl yürütme. 12 Kasım 2026.

## 1. Müfredat haritası

| Sistem | İlk konular | Tipik vignette | Tuzak |
|---|---|---|---|
| Kardiyoloji | ACS, HF, HT, AF, kapak, endokardit | 58 y E, göğüs ağrısı, V2–V4 STE | STEMI eşdeğeri; HFpEF |
| Göğüs | KOAH, astım, CAP, TB, PE, plevra, ILD | 62 y sigara, öksürük, FEV1/FVC 0,62 | Reversibilite=astım; GOLD evresi≠semptom |
| Gastrohepatoloji | GİS kanama, PUD, İBH, siroz, asit, SBP | Siroz+ateş+asit, PMN 400/mm³ | Kültür negatif=SBP yok; SAAG |
| Endokrin | DM, DKA/HHS, tiroid, adrenal, hipofiz, Ca | Poliüri+Kussmaul+AG asidozu | Öglisemik DKA; subklinik tiroid |
| Nefroloji | AKI, CKD, GN, nefrotik/nefritik, elektrolit, asit-baz | Ödem+proteinüri 5 g/gün+albümin 2,5 | Hematüri=nefritik; AKI'de eGFR |
| Hematoloji/onkoloji | Anemiler, lösemi/lenfoma/myelom, kanama/tromboz, febril nötropeni | Halsizlik+MCV 70+ferritin 8 | Ferritin normal; mikst eksiklik |
| Enfeksiyon | Sepsis, CAP, ÜSE, TB, HIV, endokardit | Ateş+hipotansiyon+laktat 4 | qSOFA ile dışlamak; kültürü geciktirmek |
| Romatoloji | RA, SLE, spondiloartrit, vaskülit, gut | Simetrik küçük eklem+sabah tutukluğu | RF negatif=RA yok; ANA pozitif=SLE |

**Dönem:** patofizyoloji 3; semiyoloji/algoritma 4; karar/komplikasyon 4–5. TUS'ta "en olası tanı", "sıradaki adım" ve "hangisi değildir" ayrı çalışılmalı.

## 2. Kaynaklar, lisanslar, gömülebilirlik

**© = link/atıf; gömme yok.**

| Kaynak | Ne için | Lisans / HTML |
|---|---|---|
| [ESC Guidelines](https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines) | HF, ACS, UDMI | ©; link |
| [ACC/AHA](https://www.acc.org/Guidelines) | 2025 ACS, HT (130/80) | ©; link |
| [GOLD 2026](https://goldcopd.org/2026-gold-report-and-pocket-guide/) | KOAH, GOLD 1–4, ABE | © GOLD |
| [KDIGO 2024 CKD](https://kdigo.org/guidelines/ckd-evaluation-and-management/) | CKD evre/risk | ©; özet |
| [ADA 2026](https://professional.diabetes.org/standards-of-care) | DM, DKA/HHS | © ADA |
| [IDSA 2026 AMR](https://www.idsociety.org/practice-guideline/amr-guidance/) | Dirençli GN | ©; link |
| [SSC 2026](https://sccm.org/survivingsepsiscampaign/guidelines-and-resources/surviving-sepsis-campaign-adult-guidelines) | Sepsis | © SCCM/ESICM |
| [WHO 2021 HT](https://www.who.int/publications/i/item/9789240033986) / [2024 anemi](https://www.who.int/publications/i/item/9789240088542) | HT/anemi | CC BY-NC-SA 3.0 IGO |
| [T.C. SB HSGM](https://hsgm.saglik.gov.tr/tr/diyabet) / [Rehberler](https://hsgm.saglik.gov.tr/tr/dokumanlar-6/rehberler.html) | Eğitim | © SB |
| [TEMD DM 2024](https://www.temd.org.tr/bilimsel-calisma-gruplari2/diyabet2) | DM | © TEMD |
| [TKD HT 2025](https://www.tkd.org.tr/hipertansiyon-calisma-grubu/sayfa/turk-hipertansiyon-uzlasi-raporu-2025) | HT (≥140/90) | © TKD |
| [MDCalc](https://www.mdcalc.com/) | Doğrulama | Ticari; link-only |
| [PTB-XL](https://physionet.org/content/ptb-xl/1.0.3/) | 21.799 ECG | CC BY 4.0; atıfla |
| [Radiopaedia](https://radiopaedia.org/) | Görüntü | CC BY-NC-SA 3.0; link; GET 406 |

**OpenEvidence** (https://www.openevidence.com/): erişilemedi (bölgesel kısıt); ticari, hesap gerektirir, gömülemez.

## 3. Etkileşimli lab fikirleri (öncelik sıralı)

`[Ö]` öğretim modeli, `[D]` doğrulanmış skor/formül, `[K]` karma. **Uygulama:** vanilya JS + SVG; API'siz.

**L1 — ACS/ECG** `[Ö]` Girdi: STE mm, yaş, cinsiyet. Çıktı: bölge/arter/eşik. Formül: ekstremite ≥1 mm (2 komşu); V2–V3 ≥2,5(<40E)/2,0(≥40E)/1,5(K); posterior V1–V3 STD ≥0,5. Fark et: komşuluk+eşik. Hata: J/60 ms. Doğr.: ESC 2023.

**L2 — HF/PV loop** `[Ö]` Girdi: EDV, ESV, HR, SBP/DBP, CVP. Çıktı: SV/EF/CO/MAP/SVR. Formül: `SV=EDV−ESV`; `EF=SV/EDV×100`; `CO=SV×HR/1000`; `MAP=DBP+(SBP−DBP)/3`; `SVR=80(MAP−CVP)/CO`. Fark et: EF normal, CO düşük. Hata: mL/dk vs L/dk. Doğr.: EF %55–70, CO 4–8; ESC 2026.

**L3 — Spirometri/ABG** `[K]` Girdi: FEV1, FVC, post-BD, PaO2, PaCO2, FiO2. Çıktı: obstrüksiyon/GOLD/ABE/A-a. Formül: `FEV1/FVC`; GOLD 1 ≥80, 2 50–79, 3 30–49, 4 <30%; `PAO2=FiO2×713−PaCO2/0,8`; `A-a=PAO2−PaO2`. Fark et: post-BD <0,70 tanı. Hata: pre-BD; yaşlıda sabit eşik. Doğr.: GOLD 2026.

**L4 — Asit-baz** `[D]` Girdi: pH, PaCO2, HCO3, Na, Cl, albümin. Çıktı: primer/kompansasyon/AG/delta. Formül: `AG=Na−(Cl+HCO3)` (8–12); `AGdüz=AG+2,5(4−alb)`; Winter `PaCO2=1,5HCO3+8±2`; `delta=(AG−12)/(24−HCO3)`. Fark et: kompansasyon uymazsa mikst. Hata: hipoalbüminemi; bazal AG≠12. Doğr.: 10 vaka.

**L5 — Sodyum** `[K]` Girdi: Na, glukoz, kg, cinsiyet, yaş, infüzyon Na. Çıktı: düzeltilmiş Na/FWD/ΔNa. Formül: `Na_düz=Na+1,6(glukoz−100)/100`; `TBW=0,6kg E/0,5kg K/0,45kg yaşlı`; `FWD=TBW(Na/140−1)`; `ΔNa=(Na_inf−Na)/(TBW+1)`. Fark et: %3 NaCl 513. Hata: hızlı düzeltme/ODS; SIADH'de SF. Doğr.: 3 örnek; ≤8–10 mEq/L/24 s.

**L6 — CKD-EPI 2021** `[D]` Girdi: yaş, cinsiyet, kreatinin, UACR. Çıktı: eGFR/G1–G5/A1–A3. Formül: `eGFR=142×min(Scr/κ,1)^α×max(Scr/κ,1)^−1,200×0,9938^yaş×1,012(K)`; κ=0,7K/0,9E; α=−0,241K/−0,302E; G1 ≥90, G2 60–89, G3a 45–59, G3b 30–44, G4 15–29, G5 <15; A1 <30, A2 30–300, A3 >300 mg/g. Fark et: G+A birlikte. Hata: Cockcroft-Gault; AKI. Doğr.: KDIGO 2024.

**L7 — K kayması/TTKG** `[Ö]` Girdi: K, pH, insülin, idrar K/osm. Çıktı: K kayması/TTKG/ECG riski. Formül: `ΔK≈0,6(7,40−pH)/0,1`; `TTKG=(UK×Posm)/(PK×Uosm)`; geçerli Uosm>Posm. Fark et: insülin total K'yı değiştirmez. Hata: geçersiz TTKG; ECG'yi tedavi etmek. Doğr.: 3 vaka.

**L8 — Anemi** `[K]` Girdi: Hb, MCV, RDW, retikülosit, ferritin, TSAT, B12. Çıktı: tip/RPI/IDA-talasemi-ACD. Formül: WHO Hb <13E/<12K/<11 gebe; `RPI=(ret%×Hct/45)/maturasyon`; Mentzer `MCV/RBC` (<13 talasemi, >13 IDA); ferritin <30 IDA. Fark et: RDW+yayma. Hata: ferritin normal; retikülositi düzeltmemek. Doğr.: WHO 2024.

**L9 — Tiroid** `[Ö]` Girdi: TSH, sT4, sT3, anti-TPO, gebelik, biotin. Çıktı: primer/subklinik/santral/Graves/tiroidit. Algoritma: TSH↑+sT4↓ primer; TSH↑+sT4 normal subklinik; TSH↓/normal+sT4↓ santral; TSH↓+sT4↑ hipertiroidi; uptake yüksek Graves. Fark et: TSH tek başına yetmez. Hata: biotin; gebelik. Doğr.: 10 vaka.

**L10 — DKA/HHS + eAG** `[D]` Girdi: glukoz, Na, Cl, HCO3, pH, BUN, keton, A1c. Çıktı: AG/Na_düz/osm/DKA-HHS/eAG. Formül: `AG=Na−(Cl+HCO3)`; `Na_düz=Na+1,6(glukoz−100)/100`; `osm=2Na+glukoz/18`; `eAG=28,7×A1c−46,7`. DKA: glukoz ≥200, pH <7,30/HCO3 <18, keton; HHS: glukoz >600, osm >320, pH >7,30, HCO3 >18. Fark et: öglisemik DKA. Hata: birim. Doğr.: ADA 2026.

**L11 — Sepsis** `[D]` Girdi: RR, SBP, GCS, PaO2/FiO2, trombosit, bilirubin, MAP, vazopressör. Çıktı: qSOFA/SOFA/NEWS2/risk. Formül: qSOFA 1: RR ≥22, SBP ≤100, GCS <15; SOFA 0–4/organ; NEWS2 ağırlıklı. Fark et: SSC 2026 qSOFA tek başına tarama değil; NEWS2/SIRS. Hata: qSOFA ile dışlamak. Doğr.: SSC 2026.

**L12 — Karaciğer** `[D]` Girdi: yaş, cinsiyet, bilirubin, INR, kreatinin, Na, albümin, AST, ALT, trombosit. Çıktı: MELD3/Child-Pugh/FIB-4/APRI. Formül: `MELD3=1,33(K)+4,56ln(bili)+0,82(137−Na)−0,24(137−Na)ln(bili)+9,09ln(INR)+11,14ln(Cr)+1,85(3,5−alb)−1,83(3,5−alb)ln(Cr)+6`; sınır: bili/INR/Cr ≥1, Cr ≤3, Na 125–137, alb 1,5–3,5 (bili/Cr mg/dL, Na mmol/L, alb g/dL); `FIB-4=yaş×AST/(trombosit×√ALT)`; `APRI=(AST/ULN)/trombosit×100`. Fark et: MELD nakil, Child klinik. Hata: birim. Doğr.: OPTN.

**Sınır durumları:** ESV=0, HCO3=0, Cr=0, K=0, Hb=0 ve negatifler reddedilmeli; uç vaka test edilmeli.

## 4. Kanıta dayalı çalışma yöntemi

- **Illness script (7 slot):** epidemiyoloji, süre, semptom, bulgu, ayırt edici test, komplikasyon, tedavi.
- **Kontrast vignette:** göğüs ağrısı (ACS/perikardit/PE/diseksiyon); dispne (HF/KOAH/anemi/PE); asidoz (DKA/laktik/renal/toksin); hiponatremi (SIADH/hipovolemi/hiperglisemi); anemi (IDA/talasemi/ACD).
- **"Next best step":** stabilizasyon sonrası yönetimi değiştiren tek testi seçtir.
- **Problem representation:** tek cümle: yaş/cinsiyet + sendrom + süre + risk + kritik anormallik.
- **Aralıklı tekrar 1-3-7-21:** boş kağıda PV loop, asit-baz haritası, CKD heat map, anemi akışı, ACS territorisi, DKA/HHS çiz.
- **Hata günlüğü:** tarih, vaka, ilk tanı, gerçek tanı, bilişsel hata, düzeltilmiş kural, 7 gün sonra tekrar.
- **OSCE/TUS:** 5 dk vaka + vitaller + lab; sözlü problem representation, 3 ayırıcı, 2 sonraki adım, 1 güvenlik ağı.

## 5. Doğruluk, güvenlik, telif

**Hiyerarşi:** güncel kılavuz (ESC/ACC/AHA/GOLD/KDIGO/ADA/IDSA/WHO/SSC) > hakemli derleme > ders kitabı > açık eğitim sitesi > ticari platform > blog.

| Değişken | Dönüşüm |
|---|---|
| Bilirubin | mg/dL ↔ µmol/L: ×17,1 |
| Glukoz | mg/dL ↔ mmol/L: ÷18 |
| Kreatinin | mg/dL ↔ µmol/L: ×88,4 |
| Albumin | g/dL ↔ g/L: ×10 |
| Troponin | ng/L ↔ ng/mL: ÷1000 |
| BNP/NT-proBNP | farklı assay; çeviri yok |

**Sık hatalar:** qSOFA ile sepsis dışlamak; EF normalde HFpEF'i atlamak; ferritin normalde IDA'yı dışlamak; eGFR'yi AKI'de kullanmak; MELD'de birim karıştırmak; öglisemik DKA'yı kaçırmak.

**Hasta verisi:** gerçek hasta verisi, isim, MIMIC/TCIA ham verisi yok; sentetik vignette ve açık görsel. PTB-XL de-identifiye, CC BY 4.0.

**Telif:** ESC metin/tabloları lisanssız gömülemez; kendi cümlelerinle özetle ve link ver. GOLD/ADA/IDSA/SSC/KDIGO link; ADA slaytları atıflı. WHO CC BY-NC-SA 3.0 IGO; Radiopaedia CC BY-NC-SA; MDCalc/OpenEvidence link-only.

> **Eğitim uyarısı:** Tıp eğitimi içindir; gerçek hasta tanısı/tedavisi için değildir. Doz ve tedavi protokolü vermez.

## 6. Kaynakça

1. ESC 2026 HF — https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/heart-failure/ — HF eşikleri.
2. ESC 2023 ACS — https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/acute-coronary-syndromes/ — STE eşikleri.
3. ESC 2026 UDMI — https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/universal-definition-myocardial-infarction/ — MI tanımı.
4. GOLD 2026 — https://goldcopd.org/2026-gold-report-and-pocket-guide/ — KOAH tanı/ABE.
5. KDIGO 2024 CKD — https://kdigo.org/guidelines/ckd-evaluation-and-management/ — CKD-EPI, G/A.
6. ADA 2026 — https://professional.diabetes.org/standards-of-care — DM tanı/DKA.
7. SSC 2026 — https://sccm.org/survivingsepsiscampaign/guidelines-and-resources/surviving-sepsis-campaign-adult-guidelines — sepsis.
8. WHO 2021 HT — https://www.who.int/publications/i/item/9789240033986 — HT eşiği.
9. SB HSGM — https://hsgm.saglik.gov.tr/tr/diyabet ; https://hsgm.saglik.gov.tr/tr/dokumanlar-6/rehberler.html — diyabet/obezite.
10. TEMD DM 2024 — https://www.temd.org.tr/bilimsel-calisma-gruplari2/diyabet2 — DM.

## En iyi 3 öneri

1. Her sistemi 5–7 hastalıklık "illness script + kontrast vignette + next best step" döngüsüne kur; karar ağacı üret.
2. Sürüm kartı: tarih, "ne değişti". 2026 ESC, ACC/AHA, GOLD 2026, ADA 2026, SSC 2026'yı eski sürümlerle göster.
3. Hesap makinelerini saf JS + sabit vaka + birim testi olarak yaz; her laba "öğretim/doğrulanmış" etiketi ve sınır durumu ekle. MDCalc/OpenEvidence içeriğini gömme.

## Bu alanda 3 tuzak

1. **HF sınıflaması:** 2026 ESC'de HFrEF <50%, HFpEF ≥50%, HFmrEF kaldırıldı; eski TUS kaynakları 41–49% diyebilir.
2. **qSOFA'yı dışlama testi sanmak:** SSC 2026, NEWS/NEWS2/MEWS/SIRS'i tercih ediyor; qSOFA sepsis dışlatmaz.
3. **Birim tuzağı:** bilirubin, glukoz, kreatinin, albümin ve troponin dönüşümleri hesap makinesini sessizce bozar.
