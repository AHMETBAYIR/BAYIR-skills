# Tıbbi Biyokimya ve Tıbbi Genetik — Araştırma Notu

Bu not, 6 yıllık Türk tıp müfredatı için tek dosya, çevrimdışı, yazdırılabilir HTML ders notu üretimine yöneliktir. Klinik tanı/tedavi önerisi değildir; laboratuvarlar eğitim modelidir. Dönem/komite adları fakülteye göre değişir.

## 1. Müfredat haritası: ilk 10 yüksek verimli konu

| # | Konu | Tipik yer | TUS/klinik kanca | Sık yanlış |
|---|---|---|---|---|
| 1 | Glikoliz (glycolysis), TCA, oksidatif fosforilasyon (OXPHOS), pentoz fosfat (HMP) | Dönem 1–2 | ATP, G6PD, Warburg | 36–38 ATP; HMP'yi yalnız riboz sanmak |
| 2 | Glukoneogenez (gluconeogenesis), glikojen metabolizması | Dönem 2 | von Gierke, Pompe, McArdle | Her glikojenozda hipoglisemi |
| 3 | Yağ asidi oksidasyonu/sentezi, ketogenez (ketogenesis) | Dönem 2 | MCAD, CPT, ketotik hipoglisemi | Sentez sitozolde, oksidasyon mitokondride |
| 4 | Amino asitler, üre döngüsü (urea cycle) | Dönem 2; pediatri/acil | PKU, MSUD, hiperamonyemi | Üre azotu=üre; orotik asit |
| 5 | Nükleotidler, porfiriler (porphyrias) | Dönem 2–3 | Lesch-Nyhan, AIP, PCT | Porfirileri tek hastalık sanmak |
| 6 | Vitaminler/koenzimler | Dönem 1–2 | B1, B12/folat, B6 | Makrositik anemi=B12 |
| 7 | DNA replikasyon/onarım, transkripsiyon/translasyon | Dönem 2 | XP, Lynch, mutasyon tipleri | NER/MMR karışıklığı |
| 8 | Kalıtım, pedigri, popülasyon genetiği | Dönem 2 | AD/AR/XLR, Bayes, HWE | 2/3 riskini koşulsuz kullanmak |
| 9 | Sitogenetik, imprinting, tekrar genişlemeleri | Dönem 3 | 22q11, PWS/AS, HD/FXS | Karyotip her şeyi görür |
| 10 | Kanser genetiği, farmakogenetik, yenidoğan taraması | Dönem 4–6 | BRCA/Lynch, CYP2C19, 6'lı panel | Germline/somatik; VUS |

TUS'ta enzim–metabolit eşleştirmesi, ATP, üre döngüsü, kalıtım olasılığı ve tekrar hastalıkları sayısal soru olarak sık gelir.

## 2. Açık/kaynak gösterilebilir araçlar

| Araç | URL | Lisans/kullanım | HTML'e gömme | Kalite notu |
|---|---|---|---|---|
| KEGG PATHWAY | https://www.kegg.jp/kegg/pathway.html | Akademik ücretsiz; ticari lisans; görsel kopyalanamaz | Link | Altın standart |
| Reactome | https://reactome.org/ | Şekil CC BY 4.0; veri CC0 | Evet, atıf | İnsan yolakları |
| MetaCyc | https://metacyc.org/ | Abonelik; yeniden dağıtım yok | Link | Mikrobiyal/bitki |
| BRENDA | https://www.brenda-enzymes.org/ | CC BY 4.0 | Evet, atıf | Enzim kinetiği |
| UniProt | https://www.uniprot.org/ | CC BY 4.0 | Evet, atıf | Protein işlevi |
| OMIM | https://www.omim.org/ | JHU telif; eğitim/kişisel; kopyalama yasak | Link | Klinik genetik |
| GeneReviews | https://www.ncbi.nlm.nih.gov/books/NBK1116/ | UW telif; ticari olmayan, atıf, değiştirmeme | Alıntı/link | Hastalık özeti |
| gnomAD | https://gnomad.broadinstitute.org/ | Açık; atıf; bazı annotasyon CC BY-NC | Link | Popülasyon frekansı |
| ClinVar | https://www.ncbi.nlm.nih.gov/clinvar/ | NCBI moleküler veri; gönderen hakları | Link | Yorumlar değişken |
| Human Protein Atlas | https://www.proteinatlas.org/ | CC BY 4.0 | Evet, atıf | Doku ekspresyonu |
| Mol* | https://molstar.org/ | MIT | Evet | 3B görüntüleme |
| PyMOL | https://pymol.org/ | Ticari/akademik; eğitim build'i araştırma dışı | Hayır | Masaüstü |
| ClinPGx/PharmGKB | https://www.clinpgx.org/ | CC BY-SA 4.0; CPIC CC0 | Evet, koşullu | Farmakogenetik |

**Lisans uyarısı:** "Eğitimde kullanım" ücretsiz yeniden dağıtım demek değildir. KEGG/OMIM/MetaCyc görselleri kopyalanmaz; GeneReviews kısa, atıflı ve değiştirilmemiş alıntıyla link verilir.

## 3. Etkileşimli laboratuvar fikirleri (öncelik sırasıyla)

| # | Lab (parametreler) | Çıktı / formül | "Şunu fark et" | Tuzak / doğrulama |
|---|---|---|---|---|
| 1 | Metabolik harita + enzim bloğu (enzim, doku, aktivite %) | `G=(V,E)`; `e=(u→v)` çıkar; `up(e)`/`down(e)`; biriken `u`, azalan `v`; akı 0–1 | Blok yeri, biriken/azalan çifti belirler | Doku izoenzimlerini yok sayma; von Gierke/MCAD/OTC/AIP/PCT ile doğrula |
| 2 | Üre döngüsü N dengesi (protein, enzim, aspartat) | `N=P/6.25`; `üre N=üre(mmol)×0.028`; `J=Jmax·e·[NH4+]/(Km+[NH4+])·A`; 3 ATP, 4 yüksek enerjili bağ | Proksimal düşük sitrülin; OTC yüksek orotik asit; distal yüksek sitrülin/ASA | Üre=BUN, 1 N sanma; N dengesi ve UCD kalıpları |
| 3 | Vitamin eşleştirme (semptom, risk) | `S_v=Σw_vi x_i−λΣy_vj`; normalize; ilk 3; koenzim+enzim+test | B12/folat ikisi makrositik; MMA B12'yi ayırır | Tek semptom–tek vitamin; vaka matrisi ve skor toplamı |
| 4 | Pedigri/Bayes (model, penetrans, akrabalık) | `P(G∣E)=P(E∣G)P(G)/Σ...`; AR: 1/4 etkilenen, etkilenmemişte 2/3 taşıyıcı; XLR erkek 1/2 | Etkilenmemiş kardeş riski değiştirir | Koşullanmayı unutma; XLR'de cinsiyet; toplam=1 |
| 5 | HWE + akrabalık (q, s, F, nesil) | `p²+2pq+q²=1`; AR `q²`, taşıyıcı `2pq`; akrabalık `q²+Fpq`; `q'=q(1−sq)/(1−sq²)` | Nadir hastalıkta taşıyıcı çok sık | `2pq`'yu insidans sanma; X-linked; toplam=1 |
| 6 | Tekrar genişlemesi (tekrar, ebeveyn cinsiyeti) | HD CAG: ≤26/27–35/36–39/≥40; FXS CGG: <45/45–54/55–200/>200; DM1 CTG: 5–34/35–49/≥50; FRDA GAA: 5–32/33–65/≥66; `L_çocuk=L_ebeveyn+Δ`, `Δ~Poisson`; risk lojistik | Premutasyon sağlıklı olabilir; çocukta tam mutasyon riski | Her gen farklı eşik; deterministik değil; GeneReviews |
| 7 | Farmakogenetik: warfarin (CYP2C9, VKORC1, doz) | `CL=CL0·A_CYP`; `Css=(F·D/τ)/CL`; `EC50_eff=EC50/S_VKOR`; `INR=1+4·Css/(EC50_eff+Css)` | Aynı doz farklı INR; genotip tek başına yetmez | Doz yazma; yaş/ilaç/diyet; CPIC + kararlı durum |
| 8 | ATP verimi (yakıt, shuttle, uncoupling) | Glukoz `4+10×2.5+2×1.5=32`; gliserol fosfat 30; palmitat `7×16−6=106` | Uncoupling ATP'yi ısıya çevirir; hipokside laktat | 36–38 ATP, FADH2=3, aktivasyon; 106 ile doğrula |
| 9 | Yenidoğan taraması (gün, preterm, analit) | Eşik + `PPV=Se·P/[Se·P+(1−Sp)(1−P)]`; 6 hastalık paneli (PKU/CH/biyotinidaz/CF/CAH/SMA) | Nadir hastalıkta PPV düşük; pozitif tarama tanı değil | Erken örnek/preterm/transfüzyon; HSGM paneli |
| 10 | ACMG/AMP (kanıt kodları, frekans) | PVS=8, PS=4, PM=2, PP=1; BA1=−8, BS=−4, BP=−1; ≥10 P, 6–9 LP, 0–5 VUS, −1…−6 LB, ≤−7 B | VUS patojenik değildir; kanıt yokluğu patojenite değil | PM2=2 sanma; PVS1 null/LOF; ClinGen |

Parantezdekiler kontrol parametreleri; diğerleri sabit.

## 4. Kanıta dayalı çalışma yöntemi

- **Yolak izi:** Boş kâğıda glikoliz → TCA → üre/porfirin çiz; enzim/koenzim yaz. Üç tur: hatırla → kontrol → anlat.
- **Enzim kartı:** Dört alan: biriken, azalan, alternatif yol, klinik ipucu; 20 enzimle 1–3–7–21 gün.
- **Pedigri drill:** 5 dakikada çizim, sonra Bayes; etkilenmemiş kardeş, eksik penetrans, akrabalık. Haftada 10 vaka.
- **Varyant yorumu:** 5 varyantta kanıt kodlarını işaretle, ClinGen puanla, ClinVar ile karşılaştır, üç cümle yaz.
- **Sentetik vaka:** Laboratuvar paneli + klinik ipucu ver; "biriken / azalan / hangi yol" cümlesi kur. OSCE tarzı genetik danışma rol yapısında risk iletişimi; gerçek hasta verisi yok.
- **Aralıklı tekrar:** Metabolizma ve genetiği haftalık interleave et; formül kartını (ATP, üre N, HWE, PPV, ACMG) ayrı tut; yanlışları 48 saat içinde tekrar et.

## 5. Doğruluk, birimler ve güvenlik

Kaynak hiyerarşisi: klinik kılavuz > GeneReviews/OMIM > Harper/Robbins > OpenStax > ticari; müfredat çerçevesi UÇEP. Sayı/formül için iki bağımsız kaynak; çelişkide kılavuz kazanır.

| Parametre | Dönüşüm |
|---|---|
| Glukoz | mg/dL × 0.0555 = mmol/L |
| Üre | mg/dL × 0.1665 = mmol/L |
| BUN | mg/dL × 0.357 = üre mmol/L |
| Kreatinin | mg/dL × 88.4 = µmol/L |
| Bilirubin | mg/dL × 17.1 = µmol/L |
| Fenilalanin | mg/dL × 60.5 = µmol/L |
| 17-OHP | ng/mL × 3.03 = nmol/L |

Sık hatalar: ATP 36–38; FADH2=3; üre azotu=üre; HWE'de X-linked'e `2pq`; AR kardeşte 2/3 yerine 1/4; PM2=2 puan. Hasta verisi/varyant yok; örnekler sentetik. VUS klinik karar değil; ilaç dozu verilmez.

Telif: KEGG/OMIM/MetaCyc görselleri kopyalanmaz, link verilir; GeneReviews kısa atıflı alıntı, değiştirilemez. Reactome/BRENDA/UniProt/HPA CC BY 4.0; ClinPGx CC BY-SA 4.0; OpenStax CC BY-NC-SA 4.0; PyMOL gömülmez, Mol* MIT.

## 6. Kaynakça

1. **UÇEP 2020** — ulusal çerçeve: https://egitim.yok.gov.tr/documentFiles/17594056261.Mezuniyet%20%C3%96ncesi%20T%C4%B1p%20E%C4%9Fitimi%20-%20Ulusal%20%C3%87ekirdek%20E%C4%9Fitim%20Program%C4%B1%202020.pdf
2. **HSGM Yenidoğan Tarama Programı** — 6 hastalık, topuk kanı: https://hsgm.saglik.gov.tr/tr/tarama-programlari/ntp.html
3. **KEGG Copyright** — akademik/ticari sınır: https://www.kegg.jp/kegg/legal.html
4. **Reactome License** — şekil CC BY 4.0, veri CC0: https://reactome.org/license
5. **GeneReviews Copyright** — ticari olmayan kullanım: https://www.ncbi.nlm.nih.gov/books/NBK138602/
6. **OMIM Copyright** — kopyalama yasağı (bot koruması): https://omim.org/help/copyright
7. **ClinPGx Data Usage** — CC BY-SA 4.0, CPIC CC0: https://www.clinpgx.org/page/dataUsagePolicy
8. **ACMG/AMP 2015** — varyant sınıflandırma: https://doi.org/10.1038/gim.2015.30
9. **ClinVar** — varyant arşivi: https://www.ncbi.nlm.nih.gov/clinvar/
10. **gnomAD policies** — popülasyon frekansı: https://gnomad.broadinstitute.org/policies

## En iyi 3 öneri

1. **Enzim bloğu simülatörü:** Çok sekmeli harita, 20 enzim kartı ve doku anahtarı; "biriken/azalan" sezgisini tek ekranda kurar.
2. **Pedigri + HWE + Bayes motoru:** Aynı olasılık çekirdeğiyle üç lab; TUS sayısal kalıtım ve danışma sezgisini birlikte çalıştırır.
3. **ACMG/AMP kanıt laboratuvarı:** Kanıt kodlarını puanlayıp sınıfa götüren araç; VUS'u "bilinmiyor" olarak okumayı öğretir.

## Bu alanda 3 tuzak

1. **Enerji muhasebesini eski sayılarla yapmak:** 36–38 ATP, FADH2=3 ve shuttle/uncoupling yok sayıldığında yağ/oksidatif sorular kayar.
2. **Üre/BUN ve azot stoikiometrisini karıştırmak:** Üre 60 g/mol, üre azotu 28 g/mol; BUN ile üre aynı şey değildir. Her hiperamonyemi üre döngüsü defekti değil.
3. **Lisansı "eğitimde serbest" sanmak:** KEGG/OMIM/MetaCyc görselleri kopyalanamaz; GeneReviews değiştirilemez; OpenStax artık CC BY-NC-SA'dır.
