# Anatomi ve Nöroanatomi — Araştırma Notu

## 1. Müfredat haritası

Dönem 1: terminoloji, osteoloji, artroloji, miyoloji, yüzey anatomisi. Başkent D1K5T: 8 saat + kadavra/model. Samsun 2026–27'de Sinir Sistemi 7 hafta/141 saat; Niğde ÖHÜ'de anatomi 42+18 saat.

TUS'ta anatomi TTBT'de; 2026 kılavuzu 100/135 dk (TTBT) ve 100/135 (KTBT) der, ders dağılımı vermez. Hazırlık analizlerinde 13 anatomi sorusu var; son sınavlarda nöro 2–5, dolaşım 0–3, kas 1–3 (tuskocu.com, ikincil).

| # | Yüksek verimli konu | Dönem/kurul | Tipik yanlış anlama |
|---|---|---|---|
| 1 | Terminoloji, yüzey, kemik-eklem-kas | D1 giriş | Supin hastayı anatomik pozisyon sanmak |
| 2 | Üst ekstremite + plexus | D2 lokomotor | Medianı C5'ten sanmak; cord'ları dal sanmak |
| 3 | Alt ekstremite + plexus | D2 lokomotor | Siyatiği tek kök sanmak; femoral siniri kılıf içinde sanmak |
| 4 | Thorax: kalp, akciğer, mediastinum | D2 dolaşım/solunum | Oskültasyonu kapak yeri sanmak; sağ diyaframı alçak sanmak |
| 5 | Abdomen: GİS, portal, retroperiton, inguinal kanal | D2 sindirim | İndirekt herniyi medialde sanmak; portal veni kaçırmak |
| 6 | Pelvis/perineum: ürogenital-anal üçgen | D2 ürogenital | Perineal body'yi anal üçgende sanmak |
| 7 | Baş-boyun: kafa tabanı, orbita, kavernöz sinüs | D2 | CN'leri SOF'ta sanmak; V2/V3'ü karıştırmak |
| 8 | Nöro: spinal yollar, beyin sapı, cerebellum, ventrikül | D2 Sinir Sistemi | Dorsal kolonun cordda çaprazlandığını sanmak; Meyer loop'unu inferior alan sanmak |
| 9 | Kranial sinirler + duyu yolları | D2 Sinir Sistemi | CN I/II'yi periferik sanmak; CN XI'i kranial sanmak |
| 10 | Otonom sinir sistemi | D2 Sinir Sistemi | Sakral parasempatiği unutmak |
| 11 | Embriyoloji: faringeal/aortik arklar, midgut, diyafram | D1–D2 | 1. arkı CN VII sanmak; aortik arkları karıştırmak |

Embriyoloji köprüsü: 1. ark CN V2/V3, 2. ark CN VII; 3. ark CN IX, aortik ark karotis; 4. arkus aorta; 6. pulmoner arter/ductus arteriosus.

## 2. Mevcut araçlar ve veri kaynakları

| Araç | URL | Lisans | HTML'e gömme | Kalite notu |
|---|---|---|---|---|
| OpenStax A&P 2e | https://openstax.org/details/books/anatomy-and-physiology-2e | CC BY 4.0 | Evet, atıfla | İngilizce, sistem bazlı |
| BodyParts3D/Anatomography | https://lifesciencedb.jp/bp3d/ · https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html | CC BY 4.0 (DB); eski Commons CC BY-SA 2.1 JP | Ön-render; ham OBJ WebGL | ~3.900 kavram; hata uyarısı |
| Z-Anatomy | https://github.com/Z-Anatomy/Models-of-human-anatomy | CC BY-SA 4.0; bazı alt modeller NC | Ön-render; ham Blender | Yüksek detay; model bazında lisans |
| Open Anatomy (SPL/NAC) | https://www.openanatomy.org/ | Slicer License (BSD-style) | Ön-render; sahne Slicer ister | MRI/CT türevli, 300+ yapı |
| Visible Human | https://www.nlm.nih.gov/research/visible/visible_human.html | Kamu malı (2019'dan beri lisans yok) | Kesitler evet; ham 15–40 GB hayır | Tek erkek/tek kadın |
| 3D Slicer | https://www.slicer.org/ | Slicer License (BSD-style) | Hayır (masaüstü) | Segmentasyon, 3D baskı |
| Neuroglancer | https://github.com/google/neuroglancer | Apache 2.0 | Evet, host/WebGL; vanilla değil | Volumetrik veri; lisans ayrı |
| Wikimedia Commons | https://commons.wikimedia.org/wiki/Category:Human_anatomy | Dosya bazında CC BY-SA/CC0/PD | Evet, atıf + lisans | Değişken kalite; doğrula |
| TeachMeAnatomy | https://teachmeanatomy.info/ | Telifli; kişisel tek kopya | Hayır | Kısa, klinik; görseller ayrı |
| Kenhub | https://www.kenhub.com/ | Ticari; görsel lisansı ayrı | Hayır | Yüksek kalite; kopyalama yasak |
| Neuroanatomy Online | https://nba.uth.tmc.edu/neuroanatomy/ | Açık erişim; lisans belirtilmemiş | Sadece bağlantı | Beyin sapı/medulla labı |
| Utah Brain Dissections | https://library.med.utah.edu/publishing/neuroanatomy-video-lab-brain-dissections/ | Ücretsiz; lisans belirtilmemiş | Sadece bağlantı | Video diseksiyon |

## 3. Etkileşimli lab fikirleri

Tek HTML'de inline SVG + `const anatomy` lookup + `pointerdown` yeterlidir; harici kütüphane gerekmez. 3D atlaslar yalnız ön-render PNG/SVG olarak gömülür.

| # | Lab | Parametre (1–3) | Çıktı ve algoritma | Şunu fark et | Risk / doğrulama |
|---|---|---|---|---|---|
| 1 | Plexus brachialis | Düğüm, taraf, tam/kısmi | Dallar, kaslar (MRC 0–5), duyu. `A(n)={b:n→b}`; C5–C6→superior, C7→middle, C8–T1→inferior; lateral C5–C7, posterior C5–T1, medial C8–T1 | C5 kökü dorsal scapular + long thoracic'i vurur; superior trunk lezyonunda korunur | Risk: kök dallarını atlamak. Doğrulama: Erb garson eli, Klumpke pençe + Horner |
| 2 | Görme alanı | Lezyon (7 site), taraf, makula | 5° grid. x sağ+, y yukarı+; chiasm `(L ve x<0) veya (R ve x>0)`; post-chiasmal `x·side<0`; Meyer `y>0`, parietal `y<0`; occipitalde `r>8°` kayıp, merkez korunur | Chiasm bitemporal; Meyer superior kuadrant; parietal inferior; occipital homonim + makula | Risk: retina ile alanı karıştırmak. Doğrulama: 7 kanonik vaka |
| 3 | Kranial sinir muayenesi | CN seti, taraf | Bulgular + 2 lokalizasyon. Orbital apex II/III/IV/V1/VI; kavernöz III/IV/V1/V2/VI; CPA V/VII/VIII; jugular IX/X/XI; `score=n(A∩S)/n(A∪S)` | CN III: ptosis + down-and-out + mydriasis; CN VI: abdüksiyon yok; CN XII: dil lezyona sapar | Risk: tek CN'ye bağlamak. Doğrulama: Weber/Millard-Gubler/Wallenberg |
| 4 | Dermatom/myotom | Bölge, seviye, taraf | Dermatom, myotom, refleks, sinir. Ray-casting; `level→{dermatome,myotome,reflex}` | C6 thumb, C7 middle, C8 little; T4 nipple, T10 umbilicus; L4 medial malleolus, L5 dorsum, S1 lateral foot | Risk: tek haritayı mutlak sanmak. Doğrulama: Foerster/Keegan |
| 5 | Beyin sapı kesiti | Seviye, soru tipi | Tıklanan yapı + rule of 4. Medial `{corticospinal, medial lemniscus, MLF, CN motor nucleus}`; lateral `{spinothalamic, spinal trigeminal, sympathetic, cerebellar peduncle}` | CN III–IV mesencephalon, V–VIII pons, IX–XII medulla; medial yapılar midline'a yakın | Risk: 2D kesiti tüm seviye sanmak. Doğrulama: Haines, MRI |
| 6 | Spinal lezyon | Seviye, taraf, tip | Motor/sensoriyel harita. Dorsal kolon `segment>L ve side=S`; spinothalamic `segment>L+1 ve side≠S`; corticospinal `segment>L ve side=S`; santralde bilateral `segment≈L` pain/temp | Brown-Séquard: ipsilateral propriyosepsiyon + UMN, kontralateral pain/temp; syringomyelia'da cape-like | Risk: 1–2 segment yükselişini unutmak. Doğrulama: klasik vakalar, ASIA |
| 7 | Kalp oskültasyon | 5 nokta, lezyon, HR | Kapak, faz, pozisyon, yayılım; fonokardiyogram. HR 60'ta siklus 1000 ms, S1 ~50, S2 ~400; sistol ~350, diyastol ~550 ms | Aortic right 2nd ICS, pulmonic left 2nd, Erb left 3rd, tricuspid left 4th/5th, mitral apex 5th midklavikular | Risk: noktayı kapak yeri sanmak. Doğrulama: standart harita, Wiggers |
| 8 | Abdomen haritası | 4/9 bölge, tıkla, organ | Bölge, organ, referred pain, insizyon. Point-in-polygon; subkostal L3, transtuberkular L5, midklavikular çizgiler | Appendix RLQ'da ama base McBurney; gallbladder sağ subkostal; spleen sol; kidney retroperitoneal | Risk: landmark'ları her habitusta aynı sanmak. Doğrulama: Moore/Netter, CT |

## 4. Kanıta dayalı çalışma yöntemi

- **Boş sayfa:** plexus, görme yolu ve beyin sapı kesitini 5 dk çiz; atlasla karşılaştır. Retrieval practice 248 öğrencide finali artırdı (PMC8368804).
- **Image occlusion:** aynı yapıyı 3 görünümde kartla; tek görünüm yetmez. Aralıklı tekrar 1-3-7-14-30 gün.
- **3D→2D:** BodyParts3D/Z-Anatomy'de bul, Visible Human kesitinde işaretle.
- **Kadavra:** Utah videosu + wet lab; VDT %8–31 kazanç ama yalnız %2,4–30,2 tam VDT; hibrit (BMC 2025).
- **Vinyet + interleaving:** tek cümle vaka → lokalizasyon; bölgeleri karıştır.
- **OSCE/teach-back:** landmark'ları arkadaşta göster (onam), anlat. Çizim, spinalde kil/3D'den iyi (Beach 2023, doi:10.1002/ase.2313).

## 5. Doğruluk ve güvenlik

- **Hiyerarşi:** Terminologia Anatomica 2, Gray's, Moore, Netter > hakemli > açık site > blog.
- **Sık hata:** 12 kranial sinir, 31 spinal çift, 33 vertebra, 23 disc; vertebral seviye ile segmenti karıştırma; dermatom sürümünü belirt.
- **3D gerçeği değildir:** BodyParts3D hata/segmentasyon uyarısı yapar; modeli tek yetişkin erkek, patoloji yok. 3D'yi komşuluk için kullan.
- **Hasta verisi:** gerçek görüntü kullanma; kamu malı/CC; isim, tarih, kurum kaldır.
- **Klinik sınır:** lab eğitim amaçlıdır; tanı/tedavi önermez.
- **Telif:** TeachMeAnatomy/Kenhub görselini gömme, bağlantı ver. CC BY-SA share-alike, CC BY-NC ticari yasak.

## 6. Kaynakça

1. ÖSYM 2026-TUS kılavuz sayfası — sınav yapısı: https://www.osym.gov.tr/2026tus-1-donem-kilavuz-ve-basvuru-bilgileri
2. Samsun Dönem II rehberi — Türkçe kurul haritası: https://tip.samsun.edu.tr/wp-content/uploads/sites/32/2026/09/2026-2027-Donem-II-Egitim-Rehberi.pdf
3. OpenStax A&P 2e — CC BY 4.0: https://openstax.org/details/books/anatomy-and-physiology-2e
4. BodyParts3D lisans — CC BY 4.0: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
5. Visible Human — kamu malı kesitler: https://www.nlm.nih.gov/research/visible/visible_human.html
6. Z-Anatomy lisans — CC BY-SA 4.0: https://github.com/Z-Anatomy/Models-of-human-anatomy
7. Retrieval practice — PMC8368804: https://pmc.ncbi.nlm.nih.gov/articles/PMC8368804/
8. VDT derlemesi — BMC Med Educ 2025: https://link.springer.com/article/10.1186/s12909-025-07946-6

## En iyi 3 öneri

1. **Plexus + görme yolu + spinal lezyon simülatörü:** TUS'ta en yüksek getirili üç başlık; tamamı SVG/JS ile hesaplanır.
2. **3D→2D çeviri stüdyosu:** BodyParts3D/Z-Anatomy ön-render + Visible Human kesit + image occlusion.
3. **Vaka tabanlı lokalizasyon seti:** CN, beyin sapı ve spinal cord vakalarını interleave et; OSCE tarzı bitir.

## Bu alanda 3 tuzak

1. **Tek dermatom haritasına mutlak doğru:** Foerster/Keegan ve bireysel varyasyon farklıdır; keskin sınır yanlış öğretir.
2. **3D atlası diseksiyon gerçeği sanmak:** BodyParts3D'nin kendi uyarısı, tek cinsiyet/yaş ve patoloji yokluğu.
3. **Telif ihlali:** TeachMeAnatomy/Kenhub görsellerini kopyalamak; CC BY-SA share-alike ve NC ticari yasağını atlamak.
