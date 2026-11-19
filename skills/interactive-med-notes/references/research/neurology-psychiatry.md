# Nöroloji ve Ruh Sağlığı ve Hastalıkları — Araştırma Notu

> Kapsam: Dönem 3–6 ve TUS için nöroloji/psikiyatri çekirdeği, açık kaynaklar, 12 lab ve güvenli çalışma yöntemi. Eğitim amaçlıdır; tanı/tedavi önerisi değildir.

## 1. Müfredat haritası

Nöroloji/psikiyatri genellikle D4–D5'te, nöroanatomi D3'te, çocuk psikiyatrisi D5–D6'da işlenir. TUS'ta vaka, “en olası tanı” ve “sonraki adım” formatı baskındır.

| Konu | Dönem | Çekirdek | Yanılgı |
|---|---|---|---|
| Nörolojik muayene/lokalizasyon | D3–D4 | UMN/LMN, refleks, yürüyüş | “Tek lezyon” yanılgısı |
| Akut inme | D4–D5; acil | 4,5 saat tromboliz, trombektomi, NIHSS, TOAST | “NIHSS 0 = inme yok” |
| Epilepsi ve baş ağrısı | D4 | Nöbet sınıfı, status ≥5dk, EEG, kırmızı bayraklar, migren/cluster | “Her nöbet epilepsi” |
| Hareket bozuklukları | D4–D5 | Parkinson, tremor, Huntington, ilaç ilişkili | “Tremor = Parkinson” |
| MS ve nöromüsküler hastalıklar | D5 | DIS/DIT, GBS, MG, ALS, EMG | “MR lezyonu = MS” |
| Demans ve deliryum | D5–D6 | Alzheimer, vasküler, Lewy body, FTD; CAM | “Demans = Alzheimer” |
| Koma, İKB ve LP | D4; acil | GCS, pupil, herniasyon, CPP, BOS | “GCS toplamı yeterli” |
| Görme yolları ve beyin sapı | D4 | Homonim defekt, CN III/VI/VII, Wallenberg, locked-in | “Homonim = kiazma” |
| Psikiyatrik muayene ve intihar riski | D4 | MSE, risk faktörleri, güvenlik planı | “MSE = tanı”; “plan yoksa düşük risk” |
| Depresyon, anksiyete, bipolar | D4–D5 | PHQ-9/GAD-7, MDD/manik eşikleri, SSRI/lityum | “PHQ-9 tanı koydurur” |
| Psikoz ve şizofreni | D5 | Pozitif/negatif, 6 ay, ilaç yan etkisi | “Atipik = metabolik güvenli” |
| Madde, kişilik, çocuk, psikoterapi | D5–D6 | SUD 2/11, kişilik/ICD-11, DEHB/OSB, ergen depresyonu, CBT/DBT | “BPD = manipülatif” |

## 2. Araçlar ve veri kaynakları

Lisanslar karışık: NIHSS/GCS/PHQ açık, DSM/MoCA/MMSE telifli. “Gömme” lisans açısından da değerlendirildi.

| Kaynak | Lisans | HTML'e gömme | Kalite / ne için |
|---|---|---|---|
| [NINDS NIHSS](https://www.ninds.nih.gov/health-information/stroke/assess-and-treat/nih-stroke-scale) | Kamu malı | Evet; atıf | 0–42; PDF |
| [GCS official](https://www.glasgowcomascale.org/) | Ücretsiz; atıf | Kısmen; logo değil | GCS/GCS-P |
| [PHQ Screeners](https://www.phqscreeners.com/) | Serbest; atıf | Evet | PHQ-9/GAD-7 şiddet |
| [MoCA](https://mocacognition.com/) | Telifli; web yayını yasak | Hayır | MCI; sertifika şart |
| [MMSE-2 (PAR)](https://www.parinc.com/products/MMSE-2) | PAR; ücretli | Hayır | Demans taraması |
| [DSM-5-TR](https://www.psychiatry.org/psychiatrists/practice/dsm) | APA telifi | Hayır; parafraz | Tanı ölçütleri |
| [ICD-11 CDDR](https://www.who.int/publications/i/item/9789240077263) | CC BY-NC-ND 3.0 IGO | Hayır | WHO sınıflaması |
| [OpenStax Psychology 2e](https://openstax.org/details/books/psychology-2e) · [A&P 2e](https://openstax.org/details/books/anatomy-and-physiology-2e) | CC BY-NC-SA 4.0 | Evet; atıf | Psikoloji/nöroanatomi |
| [Neuroscience Online](https://nba.uth.tmc.edu/neuroscience/) | © UTHealth | Hayır | Beyin sapı/görme |
| [Radiopaedia](https://radiopaedia.org/) | CC BY-NC-SA | Kısmen; atıf | Vaka görüntüleri (bot) |
| [WHO mhGAP 2.0](https://www.who.int/publications/i/item/9789241549790) | CC BY-NC-SA 3.0 IGO | Evet; atıf | Birinci basamak |
| [NICE NG222](https://www.nice.org.uk/guidance/ng222) | Crown; ücretsiz | Hayır | Depresyon |
| [AHA/ASA 2019](https://doi.org/10.1161/STR.0000000000000211) | AHA telifi | Hayır | İnme kılavuzu (bot) |
| [HSGM](https://hsgm.saglik.gov.tr/tr/intihari-onleme) · [ALO 183](https://alo183.aile.gov.tr/) | Telifli | Hayır | Kriz kaynakları |

**ABCD2/Hachinski** kamu malıdır; HTML'de uygulanabilir. ABCD2 0–7, ≥4 yüksek TIA riski; güncel kılavuzlar triyajda görüntülemeyi öne çıkarır. Hachinski 13 madde; ≥7 vasküler, ≤4 dejeneratif, 5–6 karışık; patognomonik değil.

## 3. Etkileşimli lab fikirleri

Öncelik sırası; hepsi tek HTML + vanilya JS + SVG/Canvas ile sunucusuz çalışır. Öğrenci önce tahmin eder, sonra hesaplar; kontrol değeri ve sınır durumu bulunur.

| # | Lab (parametre → çıktı) | Algoritma/formül | “Şunu fark et” | Hata / doğrulama |
|---|---|---|---|---|
| 1 | NIHSS: 11 madde → 0–42, şiddet, tutarsızlık | Toplam; UN hariç; 1a=3→sensory 2 | Posterior dolaşım ve afazi farklı ağırlık | UN=0; AHA eğitim vakaları |
| 2 | GCS/GCS-P: E,V,M+pupil → 3–15, trend | GCS=E+V+M; PRS 2/1/0; GCS-P=GCS−PRS | Aynı toplam farklı profili gizler | V1'i entübasyona verme; resmi self-test |
| 3 | İnme lokalizasyonu: taraf+bulgu → territory, yapı | MCA/ACA/PCA/laküner/basiler kural tablosu | Kortikal yoksa laküner/beyin sapı; posterior NIHSS düşük | Hemiparezi=MCA; Radiopaedia |
| 4 | Görme alanı: defekt+taraf+makula → lezyon, damar | Optik yol karar ağacı | Bitemporal=kiazma; homonim=retrokiazmal | Homonim=kiazma; SVG |
| 5 | CN/beyin sapı: CN+uzun yol → sendrom, seviye | Weber/Benedikt/Claude/Wallenberg/locked-in/Parinaud/INO | Çapraz bulgu=beyin sapı; pupil tutan CN III acil | Wallenberg=PICA; olgu |
| 6 | MSE builder: alanlar → paragraf+risk bayrağı | Şablon+kırmızı bayrak | MSE betimsel; negatifleri yaz | Öyküyü karıştırma; OSCE rubriği |
| 7 | PHQ-9/GAD-7: maddeler → toplam, şiddet, işlev | PHQ 5/10/15/20; GAD 5/10/15 | Skor şiddet ölçer, tanı koymaz | Eksik madde; resmi skorlama |
| 8 | İntihar riski: vinyet → formülasyon+sonraki adım | Plan/niyet/araç/önceki girişim; klinik yargı | Risk dinamik; sormak artırmaz | “Plan yok=düşük”; C-SSRS |
| 9 | DSM checklist: ölçütler → eşik, eksik, ayırıcı | MDD 5/9+2hf; mania 3/7+1hf; şizofreni 2/5+6ay; YAB 3/6+6ay; TSSB 4 küme; OKB >1sa | Sayı yetmez; işlev/dışlama gerekir | Madde/tıbbi neden; DSM-5-TR |
| 10 | Antipsikotik matrisi: ilaç → reseptör+yan etki | EPS/metabolik/prolaktin/QT/sedasyon/agranülositoz | “Atipik” heterojen; klozapin istisna | Sınıf etkisi; Maudsley/Stahl |
| 11 | Deliryum/demans: özellikler → karşılaştırma+CAM | Akut/fluktüan, dikkatsizlik, düzensiz düşünce, bilinç | Hipoaktif deliryum gözden kaçar | Konfüzyon=demans; CAM/4AT |
| 12 | ICP/CPP + LP/BOS: MAP, ICP, BOS → CPP/patern | CPP=MAP−ICP; ICP>20; MAP=(SBP+2DBP)/3; glukoz oranı; 1 WBC/500–1000 RBC | MAP≠SBP; BOS olasılıksal; antibiyotiği geciktirme | SBP; birim; örnek BOS |

## 4. Kanıta dayalı çalışma yöntemi

- **Lokalizasyon drill'i (haftada 10 vaka):** “Kortikal mi, subkortikal mi? UMN/LMN? Kranyal/beyin sapı? Tek lezyonla açıklanır mı?” sor; yolu çiz; MR ile karşılaştır. “Where is the lesion?” vaka bankası, tanı ezberinden daha güçlü transfer sağlar.
- **DSM geri çağırma:** 10 bozukluk için boş ızgara; eşik, süre, işlev ve dışlamayı kapalı kitaptan yaz. 1-3-7-14-30 gün aralıklarıyla, bozuklukları karıştırarak tekrarla; “5/9 ama başka tanı” çeldiricileri kur.
- **OSCE:** 8–10 dk: açılış (1 dk), MSE (3 dk), risk (2 dk), formülasyon+güvenlik planı (2 dk). Standart hasta/video ile rubrik puanla; doğrudan intihar sorusu değerlendirilsin.
- **Aralıklı tekrar:** Günde 10 kart; her kart “tanı → ölçüt → sonraki adım” sorsun. Nöroloji/psikiyatriyi dönüşümlü çalış; hata günlüğünde “lokalizasyon, sayı, ölçüt, güvenlik” etiketle.
- **Sınav:** “En olası tanı” ile “sonraki en iyi adım”ı ayır; kilit ayırıcıyı (süre, simetri, pupil, işlev) işaretle.

## 5. Doğruluk ve güvenlik

- **Kaynak hiyerarşisi:** Sağlık Bakanlığı/TİTCK, NICE/AHA/WHO > Cochrane > ders kitabı > açık eğitim > ticari. Sayısal iddiayı kılavuz veya birincil yayınla doğrula.
- **Sık sayı/birim hatası:** NIHSS 0–42; GCS 3–15; GCS-P 1–15; PHQ-9 0–27; GAD-7 0–21; LP açılış basıncı 10–20 cmH2O; BOS/kan glukoz oranı ≈0,6; tPA 0,9 mg/kg (max 90 mg); tenekteplaz 0,25 mg/kg (max 25 mg); CPP=MAP−ICP, hedef 60–70 mmHg; MAP=(SBP+2DBP)/3.
- **Klinik sınır:** Notlar eğitim modelidir; gerçek hastada kılavuza/uzmana yönlendir. Doz tarifi verme; doz tablosunda kaynak + “eğitim amaçlı” etiketi kullan.
- **Hasta verisi:** Gerçek isim/reçete/görüntü veya MIMIC/TCIA kullanma; vinyetler sentetik olsun.
- **İntihar güvenliği:** Doğrudan sor; plan, niyet, araç, zaman, önceki girişimi değerlendir; “güvenlik sözleşmesi” yok; güvenlik planı + araç kısıtlaması. Türkiye: **112**/acil servis; **ALO 183** 7/24; **182** randevu (kriz değil); **YEDAM 115** bağımlılık.
- **Telif:** DSM-5-TR’yi birebir kopyalama; MoCA’yı web’e koyma; MMSE-2’yi PAR lisanssız kullanma. PHQ/GAD atıfla kopyalanabilir; OpenStax NC-SA, ICD CDDR NC-ND, Radiopaedia NC-SA.

## 6. Kaynakça

1. [AHA/ASA 2019 akut iskemik inme kılavuzu](https://doi.org/10.1161/STR.0000000000000211) — tromboliz/trombektomi.
2. [NINDS NIH Stroke Scale](https://www.ninds.nih.gov/health-information/stroke/assess-and-treat/nih-stroke-scale) — 11 madde, eğitim PDF'i.
3. [Glasgow Coma Scale](https://www.glasgowcomascale.org/) — GCS/GCS-P.
4. [PHQ Screeners](https://www.phqscreeners.com/) — PHQ-9/GAD-7.
5. [DSM-5-TR](https://www.psychiatry.org/psychiatrists/practice/dsm) — tanı sınıflaması; telifli.
6. [ICD-11 CDDR](https://www.who.int/publications/i/item/9789240077263) — WHO ruh sağlığı rehberi.
7. [WHO mhGAP 2.0](https://www.who.int/publications/i/item/9789241549790) — birinci basamak algoritmaları.
8. [NICE NG222](https://www.nice.org.uk/guidance/ng222) — depresyon tedavisi.
9. [OpenStax Psychology 2e](https://openstax.org/details/books/psychology-2e) — psikoloji temeli.
10. [HSGM intiharı önleme](https://hsgm.saglik.gov.tr/tr/intihari-onleme) ve [ALO 183](https://alo183.aile.gov.tr/) — Türkiye güvenlik kaynakları.

## En iyi 3 öneri

1. **Tek HTML iskeleti:** “lokalizasyon → skor → güvenlik”. Her labda önce tahmin, sonra hesap; kontrol ve sınır durumu görünsün.
2. **“Where is the lesion?” ve DSM retrieval’i omurga yap:** 20 inme + 20 psikiyatri vinyeti; tanı, ölçüt ve sonraki adım istensin; 1-3-7-14-30 gün tekrar.
3. **Güvenlik ve telifi ürünün parçası yap:** Her notun altında 112/183/182/YEDAM kutusu; DSM/MoCA/MMSE “link only”, PHQ/GAD atıflı gömme.

## Bu alanda 3 tuzak

1. **Skoru tanı sanmak:** NIHSS, GCS, PHQ-9 ve DSM “5/9” sayıları tanı koydurmaz; işlev, süre, dışlama ve klinik yargı gerekir.
2. **Lokalizasyonda tek lezyon ve kortikal/laküner ayrımını atlamak:** Posterior dolaşım NIHSS’te düşük kalır; “hemiparezi=MCA” ve “homonim=kiazma” hatalı kısayollerdir.
3. **Telif ve intihar güvenliğini hafife almak:** DSM/MoCA/MMSE’yi kopyalamak; “plan yok” diye riski düşük sanmak; 182’yi kriz hattı sanmak. Doğrudan sor, araç kısıtla, 112/183’e yönlendir.
