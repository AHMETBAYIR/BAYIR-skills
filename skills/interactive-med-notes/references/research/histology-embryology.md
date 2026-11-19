# Histoloji ve Embriyoloji — Araştırma Notu

> Kapsam: Tıp fakültesi Dönem 1–2 ve TUS. Eğitim amaçlıdır; tanı, tedavi veya kişisel teratojen danışmanlığı yerine geçmez. Lisanslar Kasım 2026'da kontrol edildi; yayıncılar koşulları değiştirebilir.

## 1. Müfredat haritası

Çoğu fakültede Dönem 1–2'de, hücre-doku ve sistem kurullarıyla entegre okutulur; kurul adları değişir. TUS'ta ~7 soru; ağırlık doku, genel embriyoloji ve sinir sistemindedir.

| # | Yüksek verimli konu | Dönem | Neden / tipik yanlış |
|---|---|---|---|
| 1 | Epitel ve bezler | 1 | Psödostratifiye epitel "çok katlı" sanılır. |
| 2 | Bağ dokusu, kıkırdak, kemik, kan | 1 | Kollajen I/II/III ve retiküler lif (III) karışır. |
| 3 | Kas, sinir, dolaşım, lenfoid, deri | 1–2 | Kalp kası çekirdeği periferik sanılır; timus/lenf nodu ve deri katmanları karışır. |
| 4 | GIS, solunum, üriner, genital, endokrin | 2 | Organ katmanları; ince/kolon, proksimal/distal tübül. |
| 5 | Gametogenez, fertilizasyon, implantasyon | 1 | Mayoz evreleri ve implantasyon günü karışır. |
| 6 | Gastrulasyon, nörülasyon, fetal membranlar | 1 | 3. hafta ile nöropor günleri (25/28) karışır. |
| 7 | Brankiyal arklar, baş-boyun, kalp-damar | 1–2 | 3./4. kese ve 4./6. ark eşleştirmesi. |
| 8 | Fetal dolaşım, plasenta, ikizler | 2 | Monozigotik ikiz "her zaman monokoryonik" sanılır. |
| 9 | Teratojenler, kritik dönemler, ekstremite/organ | 2 | "İlk trimester" genel risk sanılır; pencere organa özgüdür. |

## 2. Araçlar ve veri kaynakları

Gömme için görsel indirilip base64 ile paketlenir; hotlink çevrimdışı çalışmaz, bazı sitelerde yeniden yayın sayılır.

| Kaynak | Ne için | Lisans | HTML'e gömme | Kalite notu |
|---|---|---|---|---|
| [Histology Guide](https://histologyguide.com/) | Sanal lam, quiz, EM | Tüm hakları saklı | Hayır, link | Yüksek. |
| [Michigan Histology](https://histology.medicine.umich.edu/) | Kılavuz, sanal lam | CC BY-NC-SA 4.0 (altbilgi 3.0) | Evet, atıf + NC-SA | Yüksek. |
| [WebPath](https://webpath.med.utah.edu/) | Patoloji görselleri | Tüm hakları saklı | Hayır, link | Patoloji odağı. |
| [OpenStax A&P 2e](https://openstax.org/details/books/anatomy-and-physiology-2e) | Metin, şema, mikrograflar | CC BY-NC-SA 4.0; bazı mikrograflar © | Evet, atıf + NC-SA | Başlangıç. |
| [Wikimedia Commons](https://commons.wikimedia.org/) | Tek tek görseller | Dosya bazında CC0/BY/SA | Dosya bazında | Kalite değişken; künye şart. |
| [Cell Image Library](https://www.cellimagelibrary.org/) | EM, floresan | Dosya bazında PD/BY/NC-SA/ND/© | Dosya bazında | Araştırma düzeyi; H&E yok. |
| [Human Protein Atlas](https://www.proteinatlas.org/) | IHC | CC BY 4.0; kısıtlı | Evet, atıf | İmmün boyama; H&E alternatifi değil. |
| [Virtual Microscopy Database](https://www.virtualmicroscopydatabase.org/) | Sanal lam | CC BY-NC-SA 4.0 | Hayır; eğitimci kaydı | Erişim kısıtlı. |
| [UNSW Embryology](https://embryology.med.unsw.edu.au/embryology/index.php/Main_Page) | Carnegie, zaman çizelgesi, arklar | Görsel bazında | Hayır, link | Kapsamlı. |
| [Ankara Açık Ders](https://acikders.ankara.edu.tr/course/view.php?id=5437) | Ders PDF'leri | CC BY-NC-SA 4.0 | Evet, atıf | Türkçe müfredata yakın. |

Özet: Histology Guide/WebPath/UNSW **link-only**; Michigan/OpenStax/Ankara/VMD **NC-SA**; HPA **CC BY**; CIL/Wikimedia **dosya bazında**.

## 3. Etkileşimli lab fikirleri (öncelik sıralı)

Hepsi tek dosyada vanilla JS + SVG/Canvas ile çalışabilir; görsel ya kendi çizimi ya da lisansı uygun olmalı.

**1. Sanal lam hotspot etiketleme.** 3 zoom, 6–10 SVG poligonu; tıkla-etiketle. Çıktı: doğruluk, karışıklık matrisi, süre. Algoritma: point-in-polygon; IoU ≥ 0,70. *Fark et:* aynı yapı farklı büyütmede farklı görünür. Doğrulama: 2 histolog, Cohen κ ≥ 0,80. Lisans: kendi SVG/CC BY; Michigan ise atıf+NC-SA.

**2. Boyama seçici.** Hedef (çekirdek, kollajen, retiküler lif, glikojen, müsin, elastik lif, amiloid, lipid) × boyama (H&E, PAS, Masson, gümüş, elastik, Congo red, Sudan, IHC). Hematoksilin nükleik asit, eozin protein boyar; PAS glikojen/müsin/bazal membranı magenta yapar; Masson'da kollajen mavi/yeşil, kas kırmızı; gümüş retiküler lifi siyah; IHC'de DAB kahverengi. Çıktı: renk + mekanizma + kontrol doku. Algoritma: 8×8 lookup; skor. *Fark et:* H&E'de kollajen de pembe; "pembe = sitoplazma" yanlış. Doğrulama: PAS→karaciğer, gümüş→retiküler lif, Congo red→amiloid. Lisans: tablo kendi.

**3. Embriyo zaman çizelgesi + teratojen.** Gün 0–56, organ ve maruziyet [d1,d2]. Çıktı: aktif yapılar, kritik pencere örtüşmesi, olası defekt. Algoritma: `overlap = max(0, min(d2,c2) − max(d1,c1))`; `% = 100·overlap/(d2−d1)`. *Fark et:* nöral tüp gün 28'e kadar kapanır; folik asit önceden başlar. Doğrulama: Carnegie + Moore; sınır 14/25/28/56. Lisans: kendi SVG.

**4. Brankiyal ark türetici.** Ark 1/2/3/4/6 ve kese 1–4; sürükle-bırak. Çıktı: sinir, kas, kıkırdak, kese türevi. Algoritma: mapping; exact match. *Fark et:* 3. kese timus + inferior paratiroid, 4. kese superior paratiroid + ultimobrankiyal cisim; 5. ark yoktur. Doğrulama: iki bağımsız tablo. Lisans: kendi SVG.

**5. Fetal dolaşım şantları.** DV/FO/DA aç-kapa; kord açık/bağlı. Çıktı: UV/IVC/RA/LA/aorta saturasyonları, beyin-kalp vs alt gövde akımı. Algoritma: `S_mix = ΣQ_iS_i/ΣQ_i`; `S_post = fS_shunt + (1−f)S_cap`; akım korunumu. *Fark et:* şantlar beyne oksijenli kan gönderir; doğumda pulmoner direnç düşer. Doğrulama: sınırlar + StatPearls/BJA; "öğretim modeli". Lisans: kendi SVG.

**6. İkizleşme zaman çizelgesi.** Gün 0–15; zigot 1/2. Çıktı: koryon/amnion, plasenta, TTTS, konjonktif. Algoritma: 1–3 DCDA, 4–8 MCDA, 8–13 MCMA, 13–15 konjonktif; dizigotik DCDA. *Fark et:* monozigotiklerin ~1/4–1/3'ü dikoryonik. Doğrulama: Moore/UNSW; sınır günleri. Lisans: kendi SVG.

**7. Menstrual siklus + endometrium.** Gün 1–28, siklus 21–35. Çıktı: folikül evresi, endometrium, FSH/LH/E2/P4, histoloji. Algoritma: piecewise; `ovulasyon ≈ uzunluk − 14`; `LH zirvesi ≈ ovulasyon − 1`. *Fark et:* 14. gün varsayım; 28 gün şart değil. Doğrulama: fizyoloji eğrisi, 21/35 sınırı; "şematik". Lisans: kendi SVG.

**8. GIS rotasyonu.** Hafta 4–12. Çıktı: loop konumu, herniasyon/return, malrotasyon riski. Algoritma: hafta 6 90°, hafta 10 180° (dönüş), toplam 270°. *Fark et:* SMA çevresinde saat yönünün tersine 270°. Doğrulama: ders kitabı; sınır haftalar. Lisans: kendi SVG.

## 4. Kanıta dayalı çalışma yöntemi

- **Görsel maskeleme:** kart başına 3–5 etiket, bir kartta bir yapı; aynı görseli ×4/×10/×40 ile tekrarla.
- **Spot tanı:** 60 s; "doku → organ → katman → hücre → boya"; güven yaz; hatayı "yanlış tanı otopsisi" defterine kaydet.
- **Aralıklı tekrar:** 1–3–7–14–30 gün; histoloji ve embriyolojiyi interleave et; her tekrarda boş sayfaya ana hatları çiz.
- **Boştan çizim:** hafta 3/4/8 kesiti, brankiyal arklar, fetal dolaşım, deri katmanları, GIS duvarı.
- **Kontrast + carousel:** özofagus/mide/duodenum, üreter/vas deferens, kalın/ince deri; 10 slayt × 60 s.
- **Embriyo hikâyesi + teach-back:** gün 0→3→6→8→14→21→28→56→doğum; her basamağa bir klinik bağlantı (DiGeorge, PDA, omfalosel) ekle.

## 5. Doğruluk ve güvenlik

- **Kaynak hiyerarşisi:** teratojen/gebelikte ACOG, CDC, WHO, Sağlık Bakanlığı; histoloji/embriyolojide Moore & Persaud, Langman, Carlson, Ross, Junqueira, Gray's; açık siteler destek; blog/YouTube en alt.
- **Sayı ve birim:** gestasyonel yaş ile embriyonik yaş arasında ~2 hafta vardır; nöroporlar gün 25/28 (kaynaklara göre 24–28); midgut 270°; surfaktan 24–28. hafta; fetal saturasyonlar yaklaşık.
- **Telif:** "ücretsiz izlemek" gömme izni değildir. Histology Guide, WebPath, UNSW, embryology.ch, Kyoto ve DEC link-only; Michigan/OpenStax/Ankara/VMD CC BY-NC-SA (atıf + aynı lisans + ticari değil); HPA CC BY; CIL/Wikimedia dosya bazında. İndirip gömmek de kopyalamadır.
- **Hasta verisi ve klinik sınır:** gerçek hasta görüntüsü, isim veya tanımlayıcı veri yok; açık lisanslı/sentetik görsel kullanılır. Not tanı koymaz; teratojen riskinde kaynak ve hekim yönlendirmesi verir.
- **Model ve AI:** fetal dolaşım/siklus eğrileri şematiktir, hasta ölçümü değildir. Histoloji görseli üretmek için üretken model kullanılmaz; yapıları uydurabilir.

## 6. Kaynakça

1. [Histology Guide](https://histologyguide.com/) — sanal lam, quiz, EM; tüm hakları saklı, link-only.
2. [Michigan Histology](https://histology.medicine.umich.edu/) — kılavuz ve sanal lam; CC BY-NC-SA 4.0.
3. [WebPath](https://webpath.med.utah.edu/) — patoloji görselleri; tüm hakları saklı, link-only.
4. [OpenStax A&P 2e](https://openstax.org/details/books/anatomy-and-physiology-2e) — metin/şema; CC BY-NC-SA 4.0 (bazı mikrograflar ayrı telifli).
5. [Wikimedia Commons licensing](https://commons.wikimedia.org/wiki/Commons:Licensing) — dosya bazında CC0/CC BY/CC BY-SA.
6. [Cell Image Library licensing](https://www.cellimagelibrary.org/pages/license) — dosya bazında PD/CC BY/CC BY-NC-SA/ND/©.
7. [Human Protein Atlas licence](https://www.proteinatlas.org/about/licence) — CC BY 4.0; üçüncü taraf kısıtları.
8. [Virtual Microscopy Database legal](https://www.virtualmicroscopydatabase.org/legal-notices) — CC BY-NC-SA 4.0; eğitimci kaydı.
9. [UNSW Embryology](https://embryology.med.unsw.edu.au/embryology/index.php/Main_Page) — Carnegie, zaman çizelgesi, arklar; görsel telifi değişken.
10. [Ankara Açık Ders](https://acikders.ankara.edu.tr/course/view.php?id=5437) — Türkçe ders PDF'leri; CC BY-NC-SA 4.0.

## En iyi 3 öneri

1. **Önce 12 dokuyu bitir:** epitel, bağ, kıkırdak, kemik, kan, kas, sinir, dolaşım, lenfoid, deri, GIS, üriner/genital/endokrin. Her dokuya 3–5 etiketli, lisansı temiz kart kur; sistem histolojisine sonra geç.
2. **Dört lab'ı tek HTML'e koy:** hotspot, boyama seçici, embriyo zaman çizelgesi/teratojen ve fetal dolaşım şantı. Bu dördü en verimli görsel-mekânsal bağları kurar.
3. **Haftalık ritüel:** 10 slayt spot + bir boştan çizim + yanlış tanı günlüğü; embriyoloji zaman çizelgesini histoloji kartlarıyla interleave et.

## Bu alanda 3 tuzak

1. **"Ücretsiz atlas = açık lisans" sanmak.** Histology Guide, WebPath, UNSW, embryology.ch ve Kyoto'da görüntüleme ücretsiz, gömme izni yok; link-only kalın.
2. **Gebelik haftası ile embriyonik yaşı karıştırmak.** Klinikte "8 hafta" genellikle gestasyonel yaştır; embriyonik gelişimde ~6 haftadır. Nöropor, kalp ve ekstremite pencerelerini aynı birimde yaz.
3. **Rengi tanı sanmak.** H&E'nin pembesi/mavisi boya partisi, kalınlık ve tarayıcıya göre değişir; "pembe = sitoplazma" veya "koyu = patoloji" yanıltır. Önce yapıyı, sonra boyayı oku.
