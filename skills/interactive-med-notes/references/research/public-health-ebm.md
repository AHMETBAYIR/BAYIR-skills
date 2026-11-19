# Halk Sağlığı, Epidemiyoloji, Biyoistatistik ve Kanıta Dayalı Tıp — Araştırma Notu

> Kapsam: Dönem 2–6 ve TUS için epidemiyoloji, biyoistatistik, EBM, açık veri ve 12 lab. Eğitim amaçlıdır; hastaya özgü öneri değildir.

## 1. Müfredat haritası

Genellikle halk sağlığı D3'te epidemiyoloji ve biyoistatistikle başlar; D4–D5'te koruyucu hekimlik, çevre-iş sağlığı ve sağlık yönetimi, D6'da stajla bütünleşir. TUS'ta Küçük Stajlar içinde düzenli sorulur; istatistik mantığı klinik sorularda da işe yarar.

| Konu | Dönem | TUS çekirdeği | Tipik yanlış anlama |
|---|---|---|---|
| İnsidans, prevalans, mortalite, letalite, kişi-zaman, standardizasyon | D2–D3 | P≈I×D; kaba/düzeltilmiş hız | "Prevalans=risk" |
| Ekolojik, kesitsel, vaka-kontrol, kohort, RCT | D3 | Tasarım-seçim yanlılığı; OR/RR | "Kohort her zaman üstün" |
| Nedensellik, bias, confounding, etki değiştirme | D3–D4 | Bradford Hill; seçim/ölçüm/karıştırıcı | "Hill kriteri kanıt" |
| Sürveyans ve salgın incelemesi | D4–D5 | Vaka tanımı, epi curve, attack rate | "Eğri rapor tarihiyle" |
| Tarama ve tanı testleri | D4 | Sens/spec/PPV/NPV, LR, lead-time | "PPV sabit özellik" |
| Bağışıklama | D3–D4 | Etkinlik/etkililik, herd immunity, soğuk zincir | "VE=efficacy" |
| Çevre ve iş sağlığı | D4–D5 | Maruziyet, doz-yanıt, latent dönem | "Kümülatif doz=ortalama" |
| Sağlık politikası ve ekonomi | D5–D6 | Birinci basamak, UHC, maliyet-etkililik, QALY | "Maliyet=fiyat" |
| Tanımlayıcı istatistik ve örnekleme | D2–D3 | Ortanca/IQR, SD/SE, örnekleme | "SD=SE" |
| Hipotez testleri, ANOVA, regresyon | D3–D4 | t/χ²/ANOVA; tip I–II hata | "p=etki büyüklüğü" |
| Sağkalım, meta-analiz, GRADE/EBM | D4–D6 | KM/log-rank/Cox; forest/I²; PICO | "Sağkalım=mortalite" |

## 2. Araçlar ve veri kaynakları

Lisanslar karışık; link ver, figürü kopyalama, künyeyi yaz. "Ücretsiz" sanılan araçlarda sürüm ve lisans değişmiş olabilir.

| Kaynak | Lisans | HTML'e gömme | Kullanım / kalite |
|---|---|---|---|
| [CDC Principles of Epidemiology](https://archive.cdc.gov/www_cdc_gov/csels/dsepd/ss1978/index.html) | ABD kamu malı; 3. taraf görseller hariç | Evet; atıf | 6 ders; salgın/hesap |
| [WHO Basic Epidemiology](https://iris.who.int/handle/10665/43541) | WHO telif; "all rights reserved" | Hayır; link | Temel kavram; eski |
| [OpenStax Introductory Statistics 2e](https://openstax.org/details/books/introductory-statistics-2e) | CC BY-NC-SA 4.0 | Kısmen; atıf+NC+SA | Temel istatistik |
| [OpenIntro Statistics](https://www.openintro.org/book/os/) | CC BY-SA 3.0 | Evet; atıf+SA | R lab; regresyon |
| [TÜİK Veri Portalı](https://veriportali.tuik.gov.tr/) | TÜİK telif; çoğaltma/dağıtma için izin | Hayır; sınırlı alıntı | Türkiye resmi veri |
| [SB Sağlık İstatistikleri](https://sbsgm.saglik.gov.tr/TR-93554/istatistikler.html) | "Tüm hakları saklıdır" | Kısmen; atıf, figür yok | Sağlık sistemi |
| [WHO GHO](https://www.who.int/data/gho) | WHO; çoğu CC BY-NC-SA 3.0 IGO | Kısmen; atıf+NC | Ülke karşılaştırma |
| [Our World in Data](https://ourworldindata.org/) | CC BY 4.0 | Evet; atıf | Grafik/veri |
| [OECD Data Explorer](https://data-explorer.oecd.org/) | OECD Terms; atıf | Kısmen; ticari izin | Harcama/çıktı |
| [TDHS 2018 (GHDx)](https://ghdx.healthdata.org/record/turkey-demographic-and-health-survey-2018-2019) | DHS; mikroveri başvuruyla | Kısmen; atıf | Anne-çocuk sağlığı; kurum sitesi sık erişilemiyor |
| [Cochrane Handbook](https://training.cochrane.org/handbook) | © Cochrane; online ücretsiz | Hayır; link | Derleme yöntemi |
| [GRADEpro](https://gradepro.org/) | Freemium/ücretli | Kısmen; atıfla | GRADE/SoF |
| [RevMan](https://revman.cochrane.org/) | Cochrane yazarları ücretsiz; diğerleri abonelik | Kısmen; atıfla | Meta-analiz |
| [OpenEpi](https://www.openepi.com/) | MIT | Evet | 2×2/örneklem |
| [R](https://www.r-project.org/) + Python + [G*Power](https://www.psychologie.hhu.de/arbeitsgruppen/allgemeine-psychologie-und-arbeitspsychologie/gpower) | GPL/PSF/freeware | Evet | metafor/survival/power/Shiny |

**Epi Info:** kamu malı, Windows'ta çalışabilir; CDC desteği Eylül 2025'te bitti. Yeni projede OpenEpi veya R kullan.

## 3. Etkileşimli lab fikirleri

Tek HTML + vanilya JS + SVG/Canvas; sunucu ve harici kütüphane yok. Öncelik sırası 1→12; her labda kontrol değeri ve 0/1/∞ sınır durumu olsun.

| # | Lab (girdi → çıktı) | Formül | "Şunu fark et" | Doğrula / yaygın hata |
|---|---|---|---|---|
| 1 | 2×2: TP/FN/FP/TN → Sens, Spec, PPV, NPV, LR | Sens=TP/(TP+FN); Spec=TN/(TN+FP); PPV=TP/(TP+FP); NPV=TN/(TN+FN); LR+=Sens/(1−Spec); LR−=(1−Sens)/Spec | Aynı test, farklı prevalansta farklı PPV | 90/10/45/855 → %90/%95/%66.7; LR+18. Hata: PPV=Sens |
| 2 | Prevalans: p, Sens, Spec → PPV | PPV=p·Sens/[p·Sens+(1−p)(1−Spec)] | p %1→PPV %15.4; %10→%66.7; %50→%94.7 | Doğal frekans; p→0. Hata: base-rate neglect |
| 3 | Risk: a/b/c/d → RR, OR, RRR, ARR, NNT/NNH | RR=risk_t/risk_c; OR=ad/bc; RRR=1−RR; ARR=\|risk_t−risk_c\|; NNT=1/ARR (yarar), NNH=1/ARI (zarar) | OR, RR'yi abartır; NNT mutlak yarar | %15 vs %20 → RR .75, OR .706, ARR %5, NNT 20. Hata: OR=RR |
| 4 | Confounding: yaş tabakaları → kaba/düzeltilmiş OR | MH OR=Σ(a_i d_i/n_i)/Σ(b_i c_i/n_i) | Kaba 1.61; tabakalarda 1 | Genç 10/100 vs 40/400; yaşlı 80/400 vs 20/100. Hata: mediator düzeltmek |
| 5 | Salgın: maruz/ill, onset → AR, RR, AFe, epi curve | AR=a/(a+b); RR=AR_E/AR_U; AFe=(RR−1)/RR | Eğri onset'e göre; ortak maruziyet | 42/60 vs 8/40 → AR %70/%20, RR 3.5. Hata: rapor tarihi |
| 6 | İnsidans–prevalans: I, D → P | P=I·D/(1+I·D) | Süre↑ → prevalans↑ | I=5/1000 PY, D=4 y → %1.96. Hata: prevalans=risk |
| 7 | Yaş standardizasyonu: hızlar, ağırlıklar → ASR | ASR=Σw_i·r_i | Kaba fark yaş yapısından | A %14, B %41; 50/50 → %27.5. Hata: kendi nüfusunu standart yapmak |
| 8 | Örneklem/güç: p1, p2, α, güç → n | n=[z_{1−α/2}√(2p̄q̄)+z_{1−β}√(p1q1+p2q2)]²/(p1−p2)²; p̄=(p1+p2)/2, q=1−p | Fark yarıya → n ~4 kat | %20 vs %15, α=.05, güç .80 → 906/grup. [G*Power](https://www.psychologie.hhu.de/arbeitsgruppen/allgemeine-psychologie-und-arbeitspsychologie/gpower). Hata: dropout unutmak |
| 9 | Forest: lnRR, SE → pooled, CI, Q, I² | w=1/SE²; θ=Σwθ/Σw; Q=Σw(θ−θ̄)²; I²=max(0,(Q−df)/Q) | Ağırlık=precision; I²=0 homojenlik değil | 4 çalışma → lnRR −.193 (RR .82), CI −.337..−.049; Q=1.33. Hata: n ile tartmak |
| 10 | KM: event/censor → S(t), medyan | S=∏(1−d_i/n_i) | Censor risk setini küçültür | 2,4,6 event; 3,5,8 censor → .833/.625/.3125; medyan 6. Hata: censor'ı çıkarmak |
| 11 | Sürü bağışıklığı: R0, VE, c → HIT, Re | HIT=1−1/R0; c=HIT/VE; Re=R0(1−VE·c) | R0=12 → HIT %91.7; %90 VE yetmez | R0=3, VE=.90 → c %74.1; Re≈1. Hata: R0=Re |
| 12 | Tarama/lead-time: S0, sojourn S, aralık I → L, görünen sağkalım | T_klinik=T_onset+S; L=T_klinik−T_ekran; S_app=S0^{(5−L)/5} (üstel) | L=2, S0=.30 → %48.6; mortalite sabit | L=0→.30; L=5→1. Hata: sağkalım=mortalite |

## 4. Kanıta dayalı çalışma yöntemi

- **Hesap drilleri (10 dk/gün):** Formül → sayı → birim sırasıyla. Üç şablon: 2×2 → Sens/Spec/PPV; risk → RR/ARR/NNT; forest → ağırlık/pooled/I².
- **CAT:** CEBM şablonuyla 1 sayfa: PICO, tasarım, risk of bias, sonuç, uygulanabilirlik. "Bu hastada neyi değiştirir?"
- **GRADE:** Risk of bias, inconsistency, indirectness, imprecision, publication bias; kesinlik ve öneri gücü.
- **"What would change your mind?":** Üç kart: confounder, yararın zarara döndüğü alt grup, iddiayı çürütecek çalışma.
- **Aralıklı tekrar:** 1-3-7-14-30 gün; tanım değil vinyet: "Hangi ölçü?", "Hangi bias?", "NNT 20 ne demek?"
- **Journal club:** 20 dk, 5 slayt; PICO, tasarım, ana figür, geçerlilik, klinik alt satır. Mutlak riski göster.
- **OSCE:** 5 dk risk iletişimi; 1000 kişilik ikon array, doğal frekans, teach-back, paylaşılan karar.
- **Hata defteri:** Her hatayı "formül/birim/yorum" kodla; haftada 5 tekrar sorusu.

## 5. Doğruluk ve güvenlik

- **Hiyerarşi:** WHO/SB/NICE/CDC > Cochrane/GRADE > ders kitabı > açık eğitim > blog. Sayıyı kılavuz veya birincil veriyle doğrula.
- **Sık hata:** %/fraksiyon, 100/1000 hız, kişi-yıl, NNT yuvarlama, GA'yı "95% olasılık" sanma, p=etki, OR=RR, I²=klinik heterojenlik.
- **Klinik sınır:** Eğitim modeli; tanı/tedavi önerisi yok. Sentetik vinyet; gerçek isim/MIMIC/TCIA/hasta görüntüsü yok.
- **Telif:** WHO "all rights reserved"; TÜİK çoğaltmayı sınırlar; OpenStax NC-SA; OpenIntro SA; CDC kamu malı; Cochrane/RevMan/GRADEpro kısıtlı. Figürü kopyalama, SVG çiz.
- **Sürüm:** Epi Info bitti; RevMan abonelik; GRADEpro freemium. Lisans ve tarihi not et.

## 6. Kaynakça

1. [CDC Principles of Epidemiology](https://archive.cdc.gov/www_cdc_gov/csels/dsepd/ss1978/index.html) — temel epidemi/salgın.
2. [WHO Basic Epidemiology](https://iris.who.int/handle/10665/43541) — kavram/ölçüt; telifli.
3. [OpenStax Introductory Statistics 2e](https://openstax.org/details/books/introductory-statistics-2e) — temel istatistik.
4. [OpenIntro Statistics](https://www.openintro.org/book/os/) — regresyon/inference.
5. [TÜİK Veri Portalı](https://veriportali.tuik.gov.tr/) — Türkiye verisi.
6. [SB Sağlık İstatistikleri](https://sbsgm.saglik.gov.tr/TR-93554/istatistikler.html) — sistem göstergeleri.
7. [WHO GHO](https://www.who.int/data/gho) — ülkeler arası veri.
8. [Cochrane Handbook](https://training.cochrane.org/handbook) — derleme yöntemi.
9. [OpenEpi](https://www.openepi.com/) — 2×2/örneklem.
10. [CEBM Critical Appraisal](https://www.cebm.ox.ac.uk/resources/ebm-tools/critical-appraisal-tools) — makale değerlendirme.

## En iyi 3 öneri

1. **Tek kanıt akışı kur:** PICO → tasarım → etki ölçüsü → mutlak risk/NNT → GRADE; her labı bu zincire bağla.
2. **Altı hesap, altı simülasyon:** 2×2, risk, örneklem, standardizasyon, forest, KM hesapla; confounding, salgın, sürü, tarama, prevalans, yaş yapısını simüle et. "Ne değişmedi?" göster.
3. **Vinyetle aralıklı tekrar:** Aynı veriyi farklı sorularla 1-3-7-14-30 gün tekrar et; hata defterini formül/birim/yorum olarak tut.

## Bu alanda 3 tuzak

1. **PPV'yi sensitivite sanmak:** Düşük prevalansta PPV düşer; "95% spesifik" "95% PPV" değildir. Taramayı prevalence ve zararla değerlendir.
2. **OR=RR, RRR=mutlak yarar, sağkalım=mortalite sanmak:** NNT'yi ARR'den hesapla; lead-time/length bias'ı ayır; karar için ölüm hızına bak.
3. **Lisans/sürümü yok saymak:** Epi Info bitti, RevMan abonelik, GRADEpro freemium, WHO telifli, TÜİK sınırlı. "Free" varsayımıyla figür/tablo gömme.
