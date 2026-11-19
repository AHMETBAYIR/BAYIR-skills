# Prompts and agent handoffs

## 1. Full note brief

```text
Konu: <topic> — <course>, <year>, <university>.
Kaynak: <PDF/chapter/notes or "kaynaktan bağımsız">.
Hedef: 6–9 bölümlük, tek dosya, Türkçe, yazdırılabilir etkileşimli HTML not.

Önce kaynağı oku (pdftotext -layout, gerekirse pdftoppm). Sonra:
1) 3–5 gözlenebilir kazanım yaz.
2) Konunun bir temsilini seç (FBD, Mohr, p–v/T–s, Moody, tolerans bandı, ...).
3) 1–3 lab tasarla: tahmin → kontrol → sonuç → neden.
4) Sayıları check_me.py veya SymPy ile doğrula.
5) Ortak hatalar, 6–10 soru, 3–5 alıştırma, özet, kaynak ekle.
6) build_note.py ile derle, validate_note.py ve tarayıcı ile test et.

Kısıtlar: SI birimleri, işaret konvansiyonu, model sınırı, güvenlik faktörü.
Uydurma değer yok; okunamayan değer "kaynakta okunamıyor".
```

## 2. Lab-only brief

```text
Şu kavram için tek bir lab kur: <concept>.
- Kullanıcı yalnızca <parameter> değiştirsin.
- Değişmez (invariant): <equation/invariant>.
- Çizim: <what must be visible>.
- Okuma: <3–5 values with units>.
- Sınır durumları: <3 cases with expected numbers>.
- Tahmin sorusu, sıfırlama, klavye, yazdırma, prefers-reduced-motion.
- check_me.py ile doğrula; ?selftest=1 ile PASS göster.
```

## 3. Critique prompt

```text
Bu notu sert bir makine mühendisliği hocası gibi incele:
1) Birim, işaret ve model hatası var mı?
2) Her sayı ikinci bir yolla doğrulanabilir mi?
3) Lab gerçekten bir nedensellik mi öğretiyor, yoksa animasyon mu?
4) Hangi ortak hata eksik?
5) Güvenlik faktörü / standart / belirsizlik nerede eksik?
6) Yazdırmada ve 390 px'te ne bozulur?
Her bulgu için konum + düzeltme + doğrulama komutu ver. Övgü yazma.
```

## 4. Lecture-to-note prompt

```text
Ekli ders notunu/PDF'i işle:
- pdftotext -layout ile metni çıkar; figürlü sayfaları pdftoppm ile gör.
- Hocanın kullandığı işaret konvansiyonunu ve sembolleri koru.
- Kaynakta olmayan hiçbir değeri ekleme; eksikse "kaynakta yok" yaz.
- Dersin sırasını koru, ama 6–9 bölüme sıkıştır.
- Her bölüm için: bir tanım, bir örnek, bir tuzak.
- Kaynağın çözemediği bir yeri lab ile açıklıyorsan bunu açıkça belirt.
```

## 5. Bilingual prompt

```text
Notu Türkçe yaz, teknik terimi ilk geçtiğinde parantez içinde İngilizce ver:
"eğilme gerilmesi (bending stress)".
Denklemler, semboller ve standart numaraları değişmesin.
UI etiketleri Türkçe; kod değişkenleri İngilizce kalsın.
```

## 6. Verification prompt

```text
Aşağıdaki sayıları bağımsız olarak doğrula:
<table of values>
Her biri için: formül, birim dönüşümü, ara değerler, sonuç.
Kapalı form veya tablo ile ikinci yol göster.
Tutarsızlık varsa hangi varsayımın farklı olduğunu söyle.
```

## 7. Handoff to a subagent

```text
Rol: <course> araştırmacısı.
Girdi: BRIEF.md + kaynak PDF.
Çıktı: research.md (ders haritası, 12–18 konu, 2–3 lab spesifikasyonu, araçlar,
AI hataları, 6 soru + 3 alıştırma, kaynakça), lab.html, check.py.
Kurallar: uydurma değer yok; her sayı check.py'de; HTML tek dosya; 360 px;
klavye; yazdırma; ?selftest=1.
```

## 8. What not to prompt

- “Güzel bir animasyon yap.” → no invariant, no learning.
- “FEM ile doğrula.” → unless a solver is actually run and the mesh is shown.
- “Gerçekçi malzeme değerleri kullan.” → source or range required.
- “Standarttaki tabloyu ekle.” → copyright and edition problem; use a cited subset.
- “Türkçe/İngilizce karışık olsun.” → pick one UI language; keep terms parenthetical.
