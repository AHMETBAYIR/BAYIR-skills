# Prompt Şablonları

Bu dosyadaki promptlar, tıp notu üretiminde kullanılan tekrarlanabilir brief’lerdir. Her promptta **kaynak**, **hedef**, **kısıt** ve **doğrulama** bölümü vardır. Prompt’a hasta verisi, ticari soru/figür veya lisanssız içerik koyma.

## 1. Kaynak özeti

```
ROL: Tıp eğitimi editörü.
KAYNAK: Aşağıdaki sayfa çapalı metin. Dış bilgi kullanma.
GÖREV: Bu kaynağı 8–12 maddelik bir “kapsam haritasına” çevir.
Her madde: kavram, neden önemli, kaynak sayfası, olası yanlış anlama.
KURAL: Kaynakta olmayan bilgi ekleme; “kaynakta yok” yaz.
ÇIKTI: Markdown tablo.
```

## 2. Not iskeleti

```
ROL: Tıp ders notu tasarımcısı.
HEDEF: {dönem/komite}; {3–5 kazanım}.
KAYNAK: {kapsam haritası + kaynak metin}.
GÖREV: 6–9 bölümden oluşan bir not iskeleti üret.
Her bölüm: başlık, 2–4 alt fikir, 1 görsel/lab önerisi, 1 retrieval sorusu.
Lab önerisi: tek kavram, 1–3 parametre, çıktı, formül, sınır durumu.
KURAL: 2–3 labdan fazla önerme; her labın bağımsız doğrulaması olsun.
```

## 3. Lab spec

```
KAVRAM: {tek kavram}
ÖĞRENCİ: {dönem}
GÖREV: Vanilya JS + SVG/Canvas ile tek dosyada çalışacak bir lab spec’i yaz.
Zorunlu alanlar:
- Girdi (1–3 parametre; min/max/adım)
- Çıktı (sayı + birim + grafik)
- Formül (sembol, birim, varsayım)
- “Şunu fark et” cümlesi
- Sınır durumları (0, 1, ∞)
- Yaygın yanlış model
- Bağımsız doğrulama değeri (elle hesaplanmış)
- Erişilebilirlik (aria-label, klavye, baskı özeti)
KURAL: API, sunucu, harici kütüphane yok.
```

## 4. Vaka yazımı

```
HEDEF KAZANIM: {ör. HFrEF vs HFpEF ayrımı}
GÖREV: Sentetik bir klinik vaka yaz.
- 45–75 yaş, cinsiyet, 3–5 semptom
- 3–5 vital, 3–5 lab/ECG/eko
- Tek doğru “next best step”
- 3 çeldirici; her biri neden yanlış
- Tanıyı destekleyen/dışlayan bulgular
- Kırmızı bayrak ve güvenli yönlendirme
KURAL: Gerçek isim/kurum/tarih yok; doz/tedavi talimatı yok.
```

## 5. Retrieval sorusu

```
KAYNAK: {not bölümü}
GÖREV: 6–10 retrieval sorusu yaz.
Her soru:
- Tek kazanım
- 3–4 seçenek; çeldiriciler gerçek yanlış anlamalar
- Doğru cevap + neden
- Her çeldirici için “neden yanlış” (açıklamada)
KURAL: Soru, cevabı içinde vermesin; “hepsi/ hiçbiri” kullanma.
```

## 6. OSCE simülatörü

```
ROL: Standardize hasta + OSCE değerlendiricisi.
SENARYO: {yaş, şikayet, bağlam}
ÖĞRENCİ GÖREVİ: {anamnez / muayene / danışmanlık / handover}
RUBRİK: {10–15 adım; kritik maddeler}
KURALLAR:
- AI hasta rolünde kal; hekimlik yapma.
- Kırmızı bayrakta dur, güvenli yönlendirme ver.
- Geri bildirim: yapıldı / yapılmadı / kritik hata.
- Gerçek hasta verisi yok.
```

## 7. Görsel etiketleme

```
GÖRSEL: {açık lisanslı görsel; kaynak + lisans}
GÖREV: 5–8 yapıyı etiketle.
Her etiket: ad, kısa işlev, komşuluk, yaygın karıştırma.
KURAL: Görselde olmayan yapıyı uydurma; lisansı ve kaynağı yaz.
```

## 8. Kalite denetimi

```
NOT: {HTML veya metin}
GÖREV: Yayın öncesi denetim.
1. Sayı/birim/formül hataları
2. Uydurma/yanlış atıflar
3. Klinik tavsiye cümleleri
4. Telif/hasta verisi riski
5. Eksik lab sınırı / yanlış model
6. Erişilebilirlik: klavye, kontrast, 390 px, baskı
7. Quiz: çeldirici kalitesi, açıklama
ÇIKTI: FAIL / WARN / OK tablosu + düzeltme.
```

## 9. TUS yüksek verim filtresi

```
KAYNAK: {ders notu / kılavuz}
HEDEF: TUS'a hazırlanan mezun.
GÖREV: İlk 10 yüksek verimli noktayı seç.
Her nokta: tek cümle, neden sık sorulur, tipik çeldirici, 1 kart.
KURAL: “TUS'ta çıkar” iddiasını kaynak/çıkmış soru analiziyle destekle; yoksa “çıkabilir” yaz.
```

## 10. Tersine mühendislik (kötü notu düzelt)

```
KÖTÜ NOT: {metin}
GÖREV: Notu üç katmana ayır:
1. Doğru ama fazla uzun → kısalt.
2. Belirsiz/kanıtsız → kaynak iste veya çıkar.
3. Yanlış → düzelt, nedenini yaz.
Sonra 6–9 bölümlük yeni iskelet ve 1 lab öner.
```
