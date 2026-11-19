# Farmakoloji — Araştırma Notu

> Kapsam: Dönem 3–6 ve TUS için genel farmakoloji, ilaç sınıfları, açık veri kaynakları ve 8 lab. Eğitim amaçlıdır; hastaya özgü tedavi/doz önerisi değildir.

## 1. Müfredat haritası

Farmakoloji genellikle Dönem 3'te başlar; sistem komiteleriyle paralel işlenir. 2025-TUS'ta Temel Bilimler testinde 18 farmakoloji sorusu vardı (100'ün %18'i; 200'ün ~%9'u). Kemoterapi, SSS, otonom, endokrin ve KVS ağırlıklıdır.

| Konu | Dönem/komite | TUS çekirdeği | Tipik yanlış anlama |
|---|---|---|---|
| Genel PK/farmakogenetik: ADME, t½, Vd, CL, F, CYP2D6/2C19 | D3/D5; sistem | Eğri/doz, PGx | "t½ doza bağlı; genotip=fenotip" |
| Genel PD: reseptör, doz-cevap, güç/etkinlik, TI | D3 | Emax/EC50, antagonizm | "Güçlü agonist = yüksek Emax" |
| Otonom | D3; kardiyo | Reseptör-etki, antidot | "α2 sadece damar; β2 sadece akciğer" |
| Kardiyovasküler | D3/D4; kardiyo | HFrEF dörtlüsü, antiaritmik | "ACEi=ARB; beta-bloker astımda mutlak yasak" |
| SSS | D3/D4; nöro | GABA/glutamat, antipsikotik, antidepresan | "SSRI hemen etki eder" |
| Ağrı/inflamasyon | D3/D4; nöro | COX, opioid, adjuvan | "NSAID=parasetamol" |
| Antimikrobiyal | D3/D4; mikrobiyoloji | Duvar/protein/DNA, direnç, TB | "Geniş spektrum üstün; aminoglikozid 50S" |
| Endokrin | D3/D4; endokrin | İnsülin/oral ajan, tiroid, steroid | "Metformin hipoglisemi yapar" |
| Kemoterapi/immün | D4/D5; onkoloji | Alkileyici/antimetabolit/hedefe yönelik | "Sitotoksik=hedefe yönelik" |
| Toksikoloji/klinik | D3–D6; acil | Toksidrom, polifarmasi, renal doz | "Antidot tek başına yeterli" |

## 2. Araçlar ve veri kaynakları

Lisanslar farklı; karışık veriyi tek lisansa zorlamayın. İlaç adı için [RxNorm](https://www.nlm.nih.gov/research/umls/rxnorm/) (UMLS; toplu gömme yok).

| Kaynak | Lisans | HTML'e gömme | Kullanım / kalite |
|---|---|---|---|
| [DrugBank Open Data](https://go.drugbank.com/releases/latest) | CC BY-NC 4.0 | Kısmen; atıf + NC | İlaç-hedef-enzim; ticari lisans gerekir |
| [ChEMBL](https://www.ebi.ac.uk/chembl/) | CC BY-SA 3.0 | Evet; atıf + SA | Biyoaktivite; assay bağlamı okunmalı |
| [PubChem](https://pubchem.ncbi.nlm.nih.gov/) | Çoğu kamu malı | Evet; kaynak notu | Yapı/özellik; kayıt bazında kısıt olabilir |
| [DailyMed](https://dailymed.nlm.nih.gov/dailymed/) | NLM/ABD kamu malı | Evet; atıf | FDA etiketi; doz/uyarı için birincil |
| [OpenFDA](https://open.fda.gov/) | CC0 1.0 | Evet | FAERS; reporting bias taşır |
| [WHO ATC/DDD](https://atcddd.fhi.no/atc_ddd_index/) | WHO telif; ticari yasak, değiştirme yok | Hayır; link | Sınıflandırma/DDD; ruhsat: TİTCK |
| [ClinPGx/PharmGKB](https://www.clinpgx.org/) | CC BY-SA 4.0 | Evet; atıf + SA | PGx anotasyon/CPIC |
| [IUPHAR Guide](https://www.guidetopharmacology.org/) | ODbL + CC BY-SA 4.0 | Evet; atıf + SA | Reseptör/ligand; çekirdek referans |
| [OpenStax A&P](https://openstax.org/details/books/anatomy-and-physiology-2e) | CC BY-NC-SA 4.0 | Evet; NC + SA | Fizyoloji/otonom figür |

## 3. Etkileşimli lab fikirleri

Tek HTML/JS + SVG/Canvas; birimler D mg, Vd L, CL L/h, C mg/L, t h, EC50 mg/L, ED50/TD50 mg/kg.

| # | Lab (parametre → çıktı) | Formül (birim) | "Şunu fark et" | Doğrula / yaygın hata |
|---|---|---|---|---|
| 1 | Tek/iki kompartman IV bolus (D, Vd, CL; 1↔2) → C(t), log-eğri, t½, AUC | C=(D/Vd)e^(−kt); k=CL/Vd; t½=0.693/k; AUC=D/CL; 2-kompartman: C=Ae^(−αt)+Be^(−βt) | t½ dozdan bağımsızdır; Vd görünen hacimdir | D=100 mg, Vd=50 L, CL=5 L/h → C0=2 mg/L, t½=6.93 h, AUC=20 mg·h/L. Hata: log10/ln, AUC=D/Vd. Sınır: CL→0 |
| 2 | Oral biyoyararlanım (F, ka) → C(t), Tmax, Cmax, AUC | C=F·D·ka/[Vd(ka−k)]·(e^(−kt)−e^(−kat)); Tmax=ln(ka/k)/(ka−k); AUC=F·D/CL | F alanı ölçekler; ka Tmax'ı belirler | F=0.6, ka=1 h⁻¹ → AUC=12 mg·h/L, Tmax=2.56 h, Cmax≈0.93 mg/L. Hata: F'yi unutmak, ka/k yer değiştirmek. Sınır: F=0; ka=k |
| 3 | Yükleme/idame (Css, Vd, CL, F, τ) → LD, MD, birikim | LD=Vd·Css/F; MD=CL·Css·τ/F; R=1/(1−e^(−kτ)) | LD hedefe hemen ulaştırır; plato t½'ye bağlıdır | Css=10, Vd=50, CL=5, τ=8 → LD=500 mg, MD=400 mg, R≈1.82. Hata: LD/MD karıştırmak, F'yi unutmak |
| 4 | Emax/Hill (Emax, EC50, n) → sigmoid eğri, EC50 | E=E0+Emax·C^n/(EC50^n+C^n) | EC50 güç, Emax etkinlik, n dikliktir | Emax=100, EC50=1 → E(1)=50. Hata: EC50=Kd, güç=etkinlik. Sınır: C→0/∞; n→0 |
| 5 | Kompetitif/nonkompetitif ([I], Ki, mod) → kaymış eğri, DR, pA2 | EC50'=EC50(1+[I]/Ki); Emax'=Emax/(1+[I]/Ki); DR=1+[I]/Ki; pA2=−log10 Ki | Kompetitif sağa kaydırır, Emax'ı korur; nonkompetitif Emax'ı düşürür | [I]=Ki → DR=2; noncomp Emax yarıya iner. Hata: her kayma kompetitif; pA2=−log EC50. Schild≈1 |
| 6 | CYP/PGx (substrat, fm, [I]/Ki, genotip) → AUC oranı, aktivite skoru | AUC_ratio=1/[fm/(1+[I]/Ki)+(1−fm)]; AS=Σ alel değeri (CYP2D6 0/0.5/1/2) | Etki fm ve [I]/Ki'ye bağlıdır; indüksiyon (rifampin, karbamazepin) günler alır, inhibisyon (klaritromisin, ketokonazol) hızlıdır; genotip≠fenotip | fm=1, [I]=Ki → AUC×2; *1/*4 → AS=1 (intermediate); *4/*4 → 0 (poor). Hata: intestinal 3A4/P-gp, prodrug. Sınır: fm=0/1 |
| 7 | Terapötik indeks (ED50, TD50, eğim) → TI, örtüşme | TI=TD50/ED50; MOS=TD1/ED99 | TI=10 güvenli görünse de kuyruklar çakışabilir | ED50=10, TD50=100 → TI=10. Hata: TI'yı bireysel pay sanmak. Sınır: TD50=ED50 → TI=1 |
| 8 | Otonom reseptör haritası (reseptör, doku, ilaç) → organ yanıtı, haberci | Niteliksel: occupancy → sinyal → etki | Alt tip dokuya göre farklı etki verir; baskın ton önemlidir | IUPHAR ile karşılaştır. Hata: α2'yi sadece vazokonstriksiyon, β2'yi sadece bronkodilatasyon sanmak |

## 4. Yüksek verimli sınıf-mekanizma haritası

| Sistem | Prototip | Mekanizma | İmza yan etki/etkileşim |
|---|---|---|---|
| Otonom | atropin, salbutamol, propranolol, neostigmin | M antagonist, β2 agonist, β antagonist, AChE inhibitörü | Kuru ağız/takikardi; tremor/hipokalemi; bronkospazm; kolinerjik kriz |
| KVS | ACEi/ARB, CCB, beta-bloker, loop/tiazid, statin, warfarin/DOAC | RAA blokajı, L-tipi Ca, β1, NKCC2/NCC, HMG-CoA redüktaz, VKOR/Xa | Öksürük/hiperkalemi; ödem/refleks taşikardi; bradikardi; hipokalemi; miyopati; kanama |
| SSS | BZD, SSRI, haloperidol, levodopa/karbidopa, fenitoin | GABA-A PAM, SERT, D2, dopamin öncüsü, Na kanalı | Solunum depresyonu; serotonin sendromu; EPS; diskinezi; sıfırıncı derece/gingival hiperplazi |
| Antimikrobiyal | penisilin, aminoglikozid, makrolid, florokinolon, vankomisin, rifampin | PBP, 30S, 50S, giraz/topo IV, D-Ala-D-Ala, RNA pol | Alerji; nefro/ototoksisite; QT/CYP; tendon/QT; Red man; turuncu sekresyon/CYP indüksiyonu |
| Endokrin | metformin, sülfonilüre, SGLT2i, levotiroksin, glukokortikoid | AMPK/gluconeogenez, KATP, SGLT2, T4, GR | GI/laktik asidoz; hipoglisemi; genital enfeksiyon/DKA; AF/osteoporoz; Cushing |
| Analjezik | NSAID, parasetamol, opioid, gabapentinoid, triptan | COX, santral COX, μ, α2δ, 5-HT1B/1D | GI/renal; hepatotoksisite; solunum depresyonu; sedasyon; vazospazm |
| Kemoterapi | siklofosfamid, metotreksat, vinkristin, doksorubisin, trastuzumab, checkpoint inhibitörü | Alkilasyon, DHFR, tübülin, topo II, HER2, T-hücre freni | Hemorajik sistit; mukozit; nöropati; kardiyotoksisite; irAE |

## 5. Kanıta dayalı çalışma yöntemi

- **Mekanizma haritası:** Hedef → sinyal → etki → endikasyon → yan etki; şablonu ders kitabıyla karşılaştır.
- **"Aynı/farklı":** β1/β2, M2/M3, ACEi/ARB, SSRI/SNRI, kompetitif/nonkompetitif; farkı tek cümleyle yaz.
- **Hesap drilleri:** Günde 5 dk, üç şablon (tek kompartman, oral F, yükleme/idame). Birimleri sadeleştir; hatayı "formül/birim/okuma" olarak kodla.
- **Aralıklı geri çağırma:** 1-3-7-14-30 gün; ilaç adı yerine reçete vinyeti ("65 yaş, eGFR 25, klaritromisin; hangi ilacı durdurursun?"). Mekanizma + tek etkileşim + tek monitör.
- **Reçeteleme/OSCE:** WHO 6 adımı; inhaler tekniği, warfarin danışmanlığı, TÜFAM/TİTCK advers etki bildirimi için 3 dk'lık istasyon. Mnemoniği mekanizma sonrası kullan; "aminoglikozid = kulak/böbrek" nedeni açıklamaz.

## 6. Doğruluk ve güvenlik

- **Kaynak hiyerarşisi:** TİTCK/WHO > NICE/ESC/AHA/ACC/IDSA > Cochrane > Katzung/Goodman & Gilman > açık eğitim > ticari özet. Sayısal iddiayı etiket veya kılavuzla doğrula.
- **Birim hataları:** mg/µg, mg/kg–mg/m², mL/dk–L/saat, %–fraksiyon, eGFR–kreatinin klirensi, t½ birimi, EC50/TD50 birimi. Tuz/baz (fenitoin) ve pediatrik mg/kg ayrıca kontrol edilir.
- **Klinik sınır:** Notlar eğitim modelidir; gebelik, renal/hepatik yetmezlik, pediatri ve kritik hastada kılavuza yönlendir. "Şu ilacı şu dozda ver" cümlesi kurma.
- **Telif/hasta verisi:** DrugBank NC, ATC değiştirilemez, OpenStax NC-SA, ChEMBL/IUPHAR/ClinPGx SA. Figürü kopyalama; kendi SVG'ni çiz. Gerçek isim, MIMIC/TCIA ham verisi veya reçete görüntüsü kullanma; vinyetler sentetik olsun.

## 7. Kaynakça

1. [IUPHAR/BPS Guide to Pharmacology](https://www.guidetopharmacology.org/) — reseptör/ligand.
2. [ClinPGx (PharmGKB)](https://www.clinpgx.org/) — PGx anotasyonlar.
3. [CPIC Guidelines](https://cpicpgx.org/guidelines/) — genotip-fenotip.
4. [OpenFDA](https://open.fda.gov/) — FAERS/etiket API (CC0).
5. [DailyMed](https://dailymed.nlm.nih.gov/dailymed/) — FDA etiketleri.
6. [WHO ATC/DDD](https://atcddd.fhi.no/atc_ddd_index/) — sınıflandırma/DDD.
7. [ChEMBL](https://www.ebi.ac.uk/chembl/) — biyoaktivite.
8. [DrugBank](https://go.drugbank.com/releases/latest) — ilaç-hedef-enzim.
9. [OpenStax A&P](https://openstax.org/details/books/anatomy-and-physiology-2e) — fizyoloji figürleri (CC BY-NC-SA).
10. [WHO Guide to Good Prescribing](https://iris.who.int/server/api/core/bitstreams/4e79820f-9519-4687-91f6-38b89f96d334/content) — 6 adımlı reçeteleme.

## En iyi 3 öneri

1. **Sistem başına tek "mekanizma → etki → yan etki → etkileşim" haritası** kur; aynı SVG'yi HTML'de tıklanabilir yap.
2. **PK/PD lablarını omurga yap:** 8 lab; her birinde kontrol değeri ve sınır durumu olsun. Öğrenci izlesin değil, parametreyi değiştirip tahmin etsin.
3. **Reçete vinyetleriyle aralıklı tekrar** kullan: "kimde hangi ilacı kullanmam?" sorusu, ilaç adı ezberinden daha güçlü transfer sağlar.

## Bu alanda 3 tuzak

1. **Güç/etkinlik ve antagonizm karışıklığı:** EC50'yi Kd, kompetitif kaymayı nonkompetitif, TI'yı bireysel güvenlik payı sanmak.
2. **t½ ve Vd'yi sabit/anatomik sanmak:** t½ sıfırıncı derecede uzar, Vd görünen hacimdir; aktif metabolit/prodrug yönünü atlamak ciddi hata üretir.
3. **Tek kaynak ve lisans körlüğü:** Ticari özeti kılavuz sanmak; DrugBank NC, ATC "değiştirme yok", OpenStax NC-SA kısıtlarını görmezden gelmek.
