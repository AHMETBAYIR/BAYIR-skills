# AI Destekli Tıp Notu Üretim Hattı

AI, tıp notu üretiminde **hız** kazandırır; **doğruluk** kazandırmaz. Bu hat, AI’yi kaynağa bağlar, sayıyı bağımsız kontrol eder ve yayın kapısını insana bırakır.

## 1. Hat

```
kaynak → sayfa çapalı metin → kapsam haritası → blueprint → lab spec
      → içerik → build → statik doğrulama → browser QA → insan review
      → Anki export → sürüm/atıf kaydı
```

| Adım | Araç | Çıktı | Kapı |
|---|---|---|---|
| 1. Kaynak alımı | `pdftotext -layout`, `pdftoppm`, OCR | Sayfa numaralı metin + figür listesi | Lisans + hasta verisi |
| 2. Kapsam | LLM + ders izlencesi | Konu → kavram → kazanım tablosu | Öğretim üyesi onayı |
| 3. Blueprint | Şablon | 6–9 bölüm, 2–3 lab, 1 vaka, 8 soru | Kazanım 3–5 |
| 4. Lab spec | İnsan + LLM | Parametre, formül, çıktı, sınır | Bağımsız hesap |
| 5. İçerik | LLM taslağı + insan | Metin, denklem, tablo | Her sayıya kaynak |
| 6. Build | `build_note.py` | Tek HTML | Statik doğrulayıcı |
| 7. QA | Marionette/Firefox | Ekran, etkileşim, PDF | Kontrol listesi |
| 8. Review | Hekim/öğretim üyesi | Onay/red | İnsan |
| 9. Export | `export_anki.py` | TSV | Kart sayısı |
| 10. Sürüm | Git/CHANGELOG | Tarih, kaynak, sürüm | Arşiv |

## 2. Kaynağa bağlı üretim (RAG)

### Minimum RAG

1. PDF’i sayfa sayfa metne çevir; her parçaya `source`, `page` ekle.
2. 300–600 kelimelik, örtüşmeli parçalara ayır.
3. Hybrid retrieval: BM25 + embedding; ilk 8–12 parça.
4. LLM’e yalnızca bu parçaları ver; “kaynakta yoksa yok” kuralı koy.
5. Her cümlede `[kaynak, s. X]` iste.
6. Her atfı aç; her sayıyı ikinci kez hesapla.

### RAG’in sınırları

- Retrieval yanlış parçayı getirirse model doğru cevabı da yanlış bağlar.
- Parçalar tablo/figür içeriyorsa metin kaybı olur; sayfayı görsel olarak da kontrol et.
- Model, kaynakta olmayan bir eşiği “tamamlayabilir”; bu yüzden “kaynakta yok” cevabı cesaretlendirilmeli.
- Aynı kaynak birden çok sürümde olabilir; sürüm/tarih metadata’sı zorunlu.

## 3. Prompt desenleri

### Not taslağı

```
ROL: Tıp eğitimi içerik editörü.
KAYNAK: {sayfa çapalı metin}
HEDEF: {dönem, komite, 3–5 kazanım}
GÖREV: 6–9 bölüm; 2 lab spec; 1 vaka; 8 retrieval sorusu; 3 yaygın hata.
KURALLAR:
- Yalnızca kaynağı kullan; dış bilgi yok.
- Her sayısal iddia için [kaynak, s. X].
- Kaynakta yoksa “kaynakta yok” yaz.
- Klinik doz/tedavi talimatı yazma.
- Türkçe; teknik terimi ilk kullanımda İngilizcesiyle ver.
```

### Lab spec

```
Bu kavramı tek bir etkileşimli laba çevir:
- Öğrencinin değiştireceği 1–3 parametre
- Hesaplanan çıktı ve birim
- Formül (semboller, birimler)
- “Şunu fark et” cümlesi
- Sınır durumu (0, 1, ∞)
- Yaygın yanlış model
- Bağımsız doğrulama değeri
Vanilya JS + SVG/Canvas; API yok; tek dosya.
```

### Vaka

```
{hedef kazanım} için sentetik bir vaka yaz:
- 35–70 yaş, cinsiyet, 3–5 semptom, 3–5 vital/lab
- Tek doğru “next best step”
- 3 çeldirici; her biri neden yanlış
- Tanıyı destekleyen ve dışlayan bulgular
- Kırmızı bayrak ve güvenli yönlendirme
Gerçek hasta verisi, isim, kurum, tarih yok.
```

### Eleştirmen

```
Aşağıdaki notu yayın öncesi denetle:
1. Her sayıyı ve birimi kontrol et; hatalı olanı listele.
2. Her atfı aç; uydurma/yanlış olanı işaretle.
3. Her lab için sınır durumu ve yanlış model riski yaz.
4. Klinik tavsiye cümlesi var mı?
5. Telif/hasta verisi riski var mı?
6. 390 px, klavye, koyu tema, baskı: hangi test eksik?
Çıktı: FAIL / WARN / OK tablosu; düzeltme önerisi.
```

## 4. AI’nin güvenilirlik sınırı

- **Atıf:** LLM’in ürettiği PMID/DOI’lerin önemli bir kısmı uydurma olabilir. Bhattacharyya ve ark. (2023) 115 referansın %47’sini uydurma, %46’sını yanlış, %7’sini doğru buldu. Her atfı aç.
- **Sayı:** Doz, eşik, oran ve birimler kaynaktan kopyalanmalı; “tahmini” sayı üretilmemeli.
- **Görsel:** AI görseli anatomik olarak yanlış olabilir; etiketleri insan doğrulasın. Tıbbi görüntü üretimi tanı amaçlı kullanılmaz.
- **Klinik:** AI, hekimin yerine karar vermez; öğrenciye “şu hastada şu tedaviyi yap” demez.
- **Gizlilik:** Prompt’a hasta verisi girmemeli. Sağlayıcıda no-training/DPA; sınır ötesi aktarımda KVKK m.9.
- **Telif:** AI çıktısı kaynağı birebir üretebilir; “AI üretti” telif istisnası değildir.

## 5. Anki ve aralıklı tekrar

- Notun quiz’i → `export_anki.py` → TSV → Anki.
- Kart başına tek atom: “SV formülü” ayrı, “EF normal ama CO düşük” ayrı.
- FSRS hedef tutma: başlangıç %90; öğrenci yükünü izle.
- Kart sayısı: 1 not = 15–30 kart; 100 kartlık not genellikle ezber yığınıdır.
- Kaynak alanı: kartın hangi nottan geldiği ve sürümü.
- Görsel kart: image occlusion; lisansı ve hasta verisi kontrolü.
- 1-3-7-14-30 planı; yeni/tekrar oranı %30/%70.

## 6. İnsan kapıları

| Kapı | Kim | Ne kontrol eder? |
|---|---|---|
| Kapsam | Öğretim üyesi | Ders/komite ile uyum |
| Sayı | İkinci hesaplayıcı | Formül, birim, sınır |
| Kaynak | Editör | Atıf, sürüm, lisans |
| Klinik | Hekim | Tavsiye yok, kırmızı bayrak doğru |
| Erişilebilirlik | Tasarımcı/geliştirici | Klavye, kontrast, 390 px, baskı |
| Yayın | Sorumlu | Tüm kapılar kapalı mı? |

## 7. Kaynakça

- Bhattacharyya M. ve ark. (2023), LLM-generated references.
- Gordon M. ve ark. (2024), AI in medical education: systematic review.
- Lewis P. ve ark. (2020), Retrieval-Augmented Generation.
- Anki/FSRS belgeleri.
- KVKK 6698; GDPR m.9; HIPAA.
- FSEK 5846.
