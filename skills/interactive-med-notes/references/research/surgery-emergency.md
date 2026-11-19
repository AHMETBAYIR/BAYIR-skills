# Genel Cerrahi, Acil Tıp ve Yoğun Bakım — Araştırma Notu

> Dönem 4–6 ve TUS için perioperatif bakım, cerrahi hastalıklar, acil resüsitasyon ve yoğun bakım. Eğitim amaçlıdır; hastaya özgü tanı/tedavi/doz önerisi değildir.

## 1. Müfredat haritası

Alan tek koridordur: **ABCDE (Airway, Breathing, Circulation, Disability, Exposure) → şok/kanama → kaynak kontrolü → postoperatif bakım → organ desteği**. Genel Cerrahi D4–5, Acil Tıp D4–5, Yoğun Bakım D5–6'da yoğunlaşır; TUS'ta üçü güçlüdür.

| Konu | Dönem | TUS çekirdeği | Tipik yanlış anlama |
|---|---|---|---|
| Perioperatif | D4–6 | ASA, RCRI, açlık, VTE/antibiyotik | "Albümin=beslenme"; "herkese köprüleme" |
| Postoperatif | D4–6 | Ateş, ileus, kaçak, ayrışma, DVT/PE | "Ateş=enfeksiyon"; "kaçak=ateş" |
| Sıvı/asit-baz | D4–6 | İdame, GI kaybı, Na/K, dengeli sıvı | "0.9% NaCl=ideal"; "idrar=perfüzyon" |
| Yara/sütür/dren | D4–5 | İyileşme fazı, sütür tipi, dren | "Emilebilir=enfeksiyon yapmaz"; "dren rutin" |
| Herni | D4–5 | İnguinal anatomi, direkt/indirekt/femoral, boğulma | "Femoral zararsız"; "mesh kontrendike" |
| Safra | D4–5 | Kolesistit, kolanjit, pankreatit, ERCP | "Asemptomatik taş=ameliyat"; "ERCP=kolesistit" |
| Apandisit | D4–5 | Alvarado, US/CT/MRI, gebelik | "Normal lökosit dışlar"; "yaşlıda tipik" |
| Barsak/kolorektal | D4–6 | SBO/LBO, strangülasyon, kanser, stoma | "Gaz=obstruksiyon yok"; "tüm SBO ameliyat" |
| Meme/tiroid | D4–6 | Üçlü değerlendirme, BI-RADS, RLN/hipokalsemi | "Fibroadenom premalign"; "nodül=kanser" |
| Travma/transplant/onkoloji | D4–6 | ATLS, damage control, TNM, R0, rejeksiyon | "FAST negatif=travma yok"; "R0=kür" |
| Acil | D4–6 | ABCDE, şok, sepsis, anafilaksi, aritmi, inme, yanık, zehirlenme | "BP normal=şok yok"; "qSOFA=sepsis" |
| Yoğun bakım | D5–6 | Ventilasyon, ARDS, vazopressör, sedasyon, nütrisyon, SOFA | "PEEP=iyi"; "SOFA=triyaj" |

## 2. Araçlar ve veri kaynakları

Lisanslar karışıktır; tek lisansa zorlamayın. Emin değilseniz yalnızca link verin; metin/tablo/figür kopyalamayın.

| Kaynak | Lisans | HTML'e gömme | Kalite/kullanım (★) |
|---|---|---|---|
| [WHO Safe Surgery](https://www.who.int/teams/integrated-health-services/patient-safety/research/safe-surgery/tool-and-resources) + [WHO SSI](https://www.who.int/publications/i/item/9789241550475) | CC BY-NC-SA 3.0 IGO | Link; atıf+NC | Checklist/SSI★★★ |
| [NICE NG51](https://www.nice.org.uk/guidance/ng51), [CG188](https://www.nice.org.uk/guidance/cg188), [NG232](https://www.nice.org.uk/guidance/ng232) | © NICE | Link | Sepsis/safra/kafa★★★ |
| [Surviving Sepsis 2021](https://doi.org/10.1007/s00134-021-06506-y) | PMC ücretsiz; kısıtlı | Link | Sepsis★★★ |
| [WSES apandisit](https://doi.org/10.1186/s13017-020-00306-3) + [WSES ASBO](https://doi.org/10.1186/s13017-018-0185-2) | CC BY 4.0 | Evet; atıf | Apandisit/SBO★★★ |
| [EAST PMG](https://www.east.org/education-resources/practice-management-guidelines) | © EAST | Link | Travma/akut cerrahi★★★ |
| [ATLS 11](https://www.facs.org/quality-programs/trauma/education/advanced-trauma-life-support/) | Tescilli | Link | Travma; kapalı★★★ |
| [WHO Basic Emergency Care](https://www.who.int/publications/i/item/9789241513081) | CC BY-NC-SA 3.0 IGO | Link; atıf | ABCDE/triyaj★★★ |
| [OpenStax A&P 2e](https://openstax.org/details/books/anatomy-and-physiology-2e) | CC BY-NC-SA 4.0 | Evet; atıf+NC | Anatomi/fizyoloji★★ |
| [Radiopaedia](https://radiopaedia.org/) + [ECGpedia](https://en.ecgpedia.org/wiki/Main_Page) | CC BY-NC-SA | Görsel/EKG atıfla; NC | Radyoloji/EKG★★ |
| [TraumaBase](https://www.traumabase.eu/) | Üye kayıt ağı; açık değil | Link | Fransız travma kaydı; sınırlı★ |

## 3. Etkileşimli lab fikirleri

Öncelik 1→11. Tek HTML, sunucusuz vanilya JS + SVG; 1–3 parametre, kontrol ve hata paneli. Modeller eğitim içindir; doz emri üretmez.

| # | Lab (parametre → çıktı) | Formül/algoritma | "Şunu fark et" | Doğrulama / hata |
|---|---|---|---|---|
| 1 | ATLS: senaryo + SpO2 + SBP → ilk öncelik | ABCDE; hava yolu→A; tension pnömotoraks→iğne dekompresyon; masif kanama→kontrol+kan; C-spine | Aynı vitaller farklı dala gider; önce öldüreni düzelt | 20 senaryo ATLS 11; hata: normal SpO2, B'yi atlamak |
| 2 | Şok: HR, SBP, laktat → ATLS I–IV, şok indeksi | SI=HR/SBP; ATLS sınıf tablosu; laktat trendi (mmol/L) | SBP normal olabilir; genç hasta kompanze eder | 120/110→SI 1.09; 140/80→1.75; hata: tek SBP, β-blokör |
| 3 | Yanık TBSA: yaş + bölge + derinlik → %TBSA | Yetişkin 9'lar; çocuk baş %18, bacak %13.5; avuç ~%1; Lund-Browder | Çocukta baş büyük, bacak küçük; yüzeysel eritem sayılmaz | Toplam %100; 30+20=50; hata: hekim avucu, perine |
| 4 | Sıvı: kg, %TBSA, yanık zamanı → 24h toplam/hız | Parkland 4 mL/kg/%TBSA/24h; ilk 8h yarısı (yanık zamanından); çocuk 3–4 mL/kg/%+idame; idrar 0.5–1 (çocuk 1–2) mL/kg/h | Formül başlangıç tahminidir | 70 kg %30→8400 mL; 4200/8=525 mL/h; hata: 4 mL/kg/h, varış saati |
| 5 | Alvarado: göç + RIF hassasiyet + lökositoz → 0–10 | Göç/iştahsızlık/bulantı 1; RIF 2; rebound/ateş 1; lökositoz 2; sola kayma 1 | Skor olasılığı değiştirir, tanı koymaz | ≥7 olası, 5–6 şüpheli, ≤4 düşük; hata: normal lökosit, gebelik |
| 6 | qSOFA/NEWS2: RR, SBP, bilinç → iki skor | qSOFA: RR≥22, SBP≤100, GCS<15; NEWS2 7 parametre; 0–4 düşük, 5–6 orta, ≥7 yüksek | İki skor uyuşmayabilir; qSOFA tek tarama değil | qSOFA 2/NEWS 3; qSOFA 0/NEWS 8; hata: qSOFA=sepsis, NEWS=spesifik |
| 7 | SBO: öykü + peritonit + CT → konservatif/cerrahi | WSES: strangülasyon/closed-loop/peritonit/başarısız konservatif→cerrahi; NG, izotonik, analjezi | Karar gaz miktarına değil, strangülasyona bağlı | 10 CT vakası; hata: gaz çıkışı, tüm SBO'yu ameliyat, femoral herni |
| 8 | Ventilatör: boy, VT, Pplat → PBW, Cstat, DP | PBW erkek=50+0.91×(boy−152.4), kadın=45.5+0.91×(...); Cstat=VT/(Pplat−PEEP); DP=Pplat−PEEP; P/F=PaO2/FiO2 | PBW ve DP, kadran VT'sinden önemli | 170 cm→66 kg; VT 400=6.1 mL/kg; Pplat 25/PEEP 10→Cstat 26.7, DP 15; hata: gerçek kilo, Ppeak/Pplat |
| 9 | Asit-baz: pH, PaCO2, HCO3 → primer bozukluk, AG | PaCO2(mmHg)/HCO3(mEq/L); pH=6.1+log10[HCO3/(0.0307×PaCO2)]; Winter PaCO2=1.5×HCO3+8±2; AG=Na−(Cl+HCO3); düzeltilmiş AG=AG+2.5×(4−albümin(g/dL)); delta=ΔAG/ΔHCO3 | Kompansasyon pH'ı tam düzeltmez; normal pH'ta mikst düşün | pH 7.25/PaCO2 30/HCO3 13→AG 22, düzeltilmiş 24.5, delta ~1.1; hata: albümin, venöz CO2 |
| 10 | FAST/eFAST: stabilite + pencere → pozitif/negatif | 4 pencere (RUQ, LUQ, pelvis, subksifoid)+toraks; unstabil+pozitif→OR; stabil→CT; negatif unstabil→tekrar | FAST "şimdi sıvı var mı?" der; "yaralanma yok" demez | 12 SVG şema+uzman anahtarı; hata: negatif=yaralanma yok, retroperiton |
| 11 | Sütür: bölge + kontaminasyon + gerilim → pattern, materyal | Yüz 5-0/6-0 monofilament 3–5 gün; saçlı deri 3-0/4-0 7–10; gövde 7–10; ekstremite 10–14; eklem 14; kirli→emilebilir monofilament/geç primer | Aynı yara katman katman kapanır; gerilim derindedir | 10 vaka; hata: kirli yarada ipek, aşırı sıkı, yüzde 7 gün |

## 4. Kanıta dayalı çalışma yöntemi

- **Algoritma provası:** Günde 60 saniyede ABCDE ve şok ağacını çiz; "eğer … ise …" diye sesli yürüt. ATLS/WSES ile karşılaştır; sapmayı kodla.
- **Crisis resource management (CRM):** 5 dakikalık ekip drilli; kapalı döngü iletişim, rol dağılımı, SBAR teslimi, debrief. Başarıyı ilk kritik müdahale süresiyle ölç.
- **"What kills first" kartları:** 10 sentetik vaka; 60 saniyede üç müdahale seç, anahtarı aç. Cerrahi/acil/yoğun bakımı karıştır; 1-3-7-14-30 tekrar et.
- **Beceri/OSCE:** WHO listesi, entübasyon, göğüs tüpü, sütür, FAST için adım listesi/DOPS; kritik hata maddeleri koy.
- **Aralıklı geri çağırma:** EKG/CT/grafi ve "sonraki adım" kartları; tanıyı değil kararı sor. Cevap + güven kullan; yanlışları defterde sınıflandır.

## 5. Doğruluk ve güvenlik

- **Hiyerarşi:** WHO/NICE/SSC/WSES/EAST > Cochrane/sistematik derleme > Sabiston/Schwartz/Bailey & Love/Tintinalli/Marino > açık eğitim > ticari özet. Sayıyı kılavuzun tarihi ve tablosuyla doğrula.
- **Birim/formül:** %TBSA ile fraksiyonu; 4 mL/kg/%TBSA ile 4 mL/kg/saati; Parkland saatini; PBW ile gerçek kiloyu; Ppeak ile Pplat'ı; cmH2O ile mmHg'yi; mEq/L ile mmol/L'yi; qSOFA ile SOFA'yı karıştırma.
- **Klinik sınır:** Notlar eğitim modelidir; gerçek hasta için kurum protokolü ve güncel kılavuz gerekir. Sentetik vinyet kullan; gerçek isim/görüntü veya MIMIC/TCIA verisi kullanma. Doz tablosu gerekiyorsa kaynak + "eğitim amaçlı" etiketi koy.
- **Telif:** WHO CC BY-NC-SA (atıf+NC+SA), NICE © (link), ATLS tescilli (link), EAST © (link), WSES CC BY 4.0, Radiopaedia/OpenStax/SSC lisansları. Logo/figür kopyalama; kendi SVG'ni çiz; tam çeviri yerine özet+link ver.

## 6. Kaynakça

1. [WHO Safe Surgery](https://www.who.int/teams/integrated-health-services/patient-safety/research/safe-surgery/tool-and-resources) — kontrol listesi.
2. [WHO SSI](https://www.who.int/publications/i/item/9789241550475) — enfeksiyon önleme.
3. [NICE NG51](https://www.nice.org.uk/guidance/ng51) — sepsis.
4. [NICE CG188](https://www.nice.org.uk/guidance/cg188) — safra taşı.
5. [NICE NG232](https://www.nice.org.uk/guidance/ng232) — kafa travması.
6. [WSES apandisit](https://doi.org/10.1186/s13017-020-00306-3) — apandisit.
7. [WSES ASBO](https://doi.org/10.1186/s13017-018-0185-2) — adeziv SBO.
8. [SSC 2021](https://doi.org/10.1007/s00134-021-06506-y) — sepsis/septik şok.
9. [EAST PMG](https://www.east.org/education-resources/practice-management-guidelines) — travma/akut cerrahi.
10. [ATLS 11](https://www.facs.org/quality-programs/trauma/education/advanced-trauma-life-support/) — tescilli travma çerçevesi.

## En iyi 3 öneri

1. **Tek omurga + 11 lab:** ABCDE → şok/kanama → kaynak kontrolü → postoperatif bakım → organ desteği. Her labda sentetik vaka ve "önce ne öldürür?" olsun.
2. **Algoritma + CRM + beceri:** 60 saniyelik sözlü prova, 5 dakikalık ekip drilli, DOPS. Başarıyı tanı doğruluğu değil, ilk kritik müdahale ve kapalı döngü iletişimle ölç.
3. **Lisans temiz paket:** WHO/NICE/WSES/SSC linkleri, kendi SVG'lerin, tarih/sürüm etiketi. ATLS/EAST metnini kopyalama; lisansları görünür tut.

## Bu alanda 3 tuzak

1. **"Normal BP" ve skor fetişi:** Genç travma hastası kompanze eder; qSOFA, Alvarado ve SOFA tanıyı dışlamaz. Trend, tekrar muayene ve klinik tablo esastır.
2. **Formül sabitliği:** Parkland bir hız değil, 24 saatlik başlangıç tahminidir; yanık zamanı ve idrar çıkışı olmadan yönetilmez. Ventilasyonda PBW kullanılır; aşırı sıvı "fluid creep" yapar.
3. **Telif/hasta verisi:** ATLS/EAST tescillidir; WHO/NICE/CC lisansları karışıktır. Gerçek hasta görüntüsü, isim veya MIMIC/TCIA ham verisi kullanma; sentetik vinyet ve kendi çizimini üret.
