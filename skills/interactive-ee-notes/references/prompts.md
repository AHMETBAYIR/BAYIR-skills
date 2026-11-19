# Prompt templates

Copy, fill the braces, and keep the constraints. The author must run the
oracle before writing headline numbers.

## A. Lecture PDF → note

```text
ROL: EE ders notu yazarı + doğrulayıcı.
KAYNAK: {pdf}; sayfa {a-b}; ders {kod/ad}; düzey {1-4}; süre {dk}.
GÖREV: 6-9 bölüm; 1-2 lab; 1 çözümlü örnek; 3 yaygın hata; 6-10 retrieval;
3-5 alıştırma; kaynakça.
KURAL: Yalnızca kaynak + belirtilen dış kaynak. Her sayıya [s. X]. Yoksa
"kaynakta yok" yaz. Önce kapsam haritası + formül defteri; sonra içerik.
ÇIKTI: content.html + meta.json + ledger.csv; build/validate/check_ee; raporla.
```

## B. Topic-only → note

```text
KONU: {ör. üç fazlı güç}; DÜZEY: {3. sınıf}; ÖNKOŞUL: {devre, fasör};
SÜRE: {dk}; KISIT: {telefon/baskı/offline/TR}.
Kaynak yoksa varsayımları yaz. 6-9 bölüm, 1-2 lab, 1 çözümlü örnek,
3 hata, 6 retrieval, 3 alıştırma. Her headline sayı için check_ee komutu;
her formül için birim ve iki limit.
```

## C. Exam-prep → note

```text
SINAV: {tarih/süre/format}; KAPSAM: {konular}; SORU TİPİ: {klasik/ÇS}.
ÇIKTI: 1 sayfa özet + 5 tipik soru (tam çözüm) + 2 tuzak + 10 hızlı kart.
Süreli mod; cevaplar gizli. Doğrulanmamış sınav iddiası, hoca adı veya çıkmış
soru yazma; kaynak yoksa "doğrulanamadı".
```

## D. Lab report → note

```text
LAB: {deney}; VERİ: {csv}; EKİPMAN: {model}; BELİRSİZLİK: {...}; DERS: {kod}.
ÇIKTI: amaç, devre, yöntem, ham veri, hesap, fit + residual, hata bütçesi,
tartışma, 3 soru. Her sayı veri dosyasından; uydurma ölçüm/cihaz yok.
```

## E. Fix this note

```text
NOT: {path}; BELİRTİ: {görsel/hata/eksik}; KORU: {tasarım/dil}.
Önce ledger + check_ee + validate_note + ?selftest=1; FAIL/WARN listele.
En küçük diff ile düzelt; sayı değiştiyse ledger'ı güncelle. Yeniden doğrula;
dosyaları, komut çıktısını ve kalan riski raporla. Tasarımı ve doğrulanmış
sayıları izinsiz değiştirme.
```

## F. Verifier (read-only)

```text
ROL: bağımsız doğrulayıcı. Notu düzenleme.
GİRDİ: note.html, content.html, ledger.csv, check.txt.
YAP: 3 headline sayıyı ikinci yöntemle yeniden hesapla; rastgele 5 claim ve
tüm "unverified" satırları denetle; check_ee.py selftest, validate_note.py
--strict, ?selftest=1 çalıştır; 360 px ve print kontrol et.
ÇIKTI: verification/report.json + caveats.md. PASS/FAIL/WARN ve kanıt.
```

## G. Editor (after verifier)

```text
ROL: editör. Sayıları, formülleri, birimleri değiştirme.
YAP: Türkçe dil, başlık hiyerarşisi, TOC, caption, print, a11y, mobil
taşma. Yalnızca metin/düzen. Sayısal hata varsa yazara geri gönder.
```

## H. Subagent partition

| Agent | Owns | Must not |
|---|---|---|
| Author | content, meta, ledger | approve own numbers |
| Verifier | `verification/` | edit the note |
| Editor | prose, TOC, print, a11y | change numbers/formulas |

Sequence: author → verifier → editor. One writer per file; append-only log;
immutable claim ids. If no subagents are available, do three passes with fresh
context and a hard stop after drafting.
