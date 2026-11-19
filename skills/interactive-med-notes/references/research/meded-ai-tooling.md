# Tıp Eğitimi Teknolojisi, AI ve Not Üretimi — Araştırma Notu

> Eğitim modeli; klinik karar değil. Lisans/fiyat 12.11.2026'da değişebilir.

## 1. Kanıta dayalı öğrenme bilimi

Not "okunacak metin" değil, **çalışma sistemi** olmalı: hatırlama → açıklama → transfer.

| Yöntem | Kanıt | Notta kullanım |
|---|---|---|
| Retrieval practice | Roediger & Karpicke 2006: gecikmeli testte retrieval, tekrar okumadan üstün; güven yanıltıcı. | Bölüm sonu 3–5 soru; cevap anahtarı ayrı. |
| Spaced repetition | Cepeda vd. 2006: 839 değerlendirme; aralık, tutma süresiyle büyür. | FSRS/Anki; 1–3–7–21 gün başlangıç. |
| Interleaving | Brunmair & Richter 2019: genel **g=0,42**; matematik 0,34; sözcük **−0,39**. | ECG/murmur/lezyonda karıştır; terim listesini blokla. |
| Worked examples / cognitive load | Sweller & Cooper 1985; Sweller 1988: yeni başlayanda tam çözüm, gereksiz yükü azalt; uzmanlaşınca geri çek. | Tam → kısmi → bağımsız; ekran başına 1 fikir. |
| Dual coding | Mayer 2008: ilgili görsel + sözel açıklama; dekoratif görsel yok. | Sadece işlevsel şema. |
| Elaborative interrogation | Dunlosky vd. 2013: orta fayda; neden/nasıl soruları. | Her tabloda 1 nedensellik sorusu. |
| Illness scripts | Charlin vd. 2000: uzman bilgisi prototip senaryolarda. | Aynı semptomla 3 hastalık; ayıran bulgu. |
| Deliberate practice | Ericsson 2004: hedefli alt beceri + anında geri bildirim. | Tek adımı izole et; rubrikli geri bildirim. |
| OSCE | Harden vd. 1975: standart istasyon + check-list. | İstasyon + rubrik; AI hasta tek başına yetersiz. |

En tutarlı kanıt retrieval, spacing ve interleaving'de; elaborative interrogation/dual coding koşullu; deliberate practice tek başına yetersiz. Etkileşim hedefe bağlanmalı; "lab olsun" diye lab yok.

## 2. Anki ekosistemi ve güvenli dışa aktarım

| Araç | Lisans | Not |
|---|---|---|
| Anki | AGPL-3.0 | FSRS ve yerleşik image occlusion. |
| FSRS | MIT (py-fsrs) | DSR modeli; hedef tutma varsayılan **%90**; %90 üstü iş yükü hızla, %97 üstü bunaltıcı artar. |
| AnkiConnect | GPL-3.0; **arşivlendi (11.2025)** | Yerel API; uzun vadeli değil. |
| genanki | MIT | Python `.apkg`; çevrimdışı/test. |
| CrowdAnki | MIT | JSON/Git deste senkronizasyonu. |

**Dışa aktarım:** JSON `{deck, model, guid, fields, tags, source, license, media}`; kart başına tek bilgi; kaynak zorunlu; belirsiz cloze yok. `genanki` ile `.apkg`; GUID `slug+index`; medya hash'li. Temiz profil testi; duplikasyon kontrolü. Ticari içerik/hasta görseli yok; AnkiWeb destelerinde lisansı kontrol et.

## 3. AI/LLM: kaynağa bağlı üretim ve riskler

| Kullanım | Yöntem | Güvenlik |
|---|---|---|
| Ingest + RAG | PDF → sayfa çapalı metin; hybrid retrieval; düşük skorda "yok" | Lisanslı kaynak; hasta verisi yok; sayfa atfı |
| Soru üretimi | Blueprint → vignette → seçenek → gerekçe | Hekim onayı; tek doğru; homojen çeldirici |
| Vignette / görsel | Sentetik hasta; açık atlas/SVG; insan doğrular | Gerçek veri yok; birim/atlas kontrolü |
| Sokratik tutor | Tek soru + ipucu; kaynak göster | Klinik tavsiye yok; "bilmiyorum" de |
| OSCE simülatörü | Senaryo + rubrik; AI hasta, hekim değerlendirici | Sentetik; kırmızı bayrakta dur |
| DDx koçu | DDx, red flag, can't-miss | "Teşhis değil"; kılavuz atfı |
| Geri bildirim/hata analizi | Hata taksonomisi; aralıklı test | İnsan doğrular; damgalama yok |

Gordon 2024 (278 yayın): kanıt heterojen; etik boşluk. GPT-4 2023'te USMLE eşiğini 20+ aştı; klinik güvenilirlik değil. Bhattacharyya 2023: 115 referansın **%47'si uydurma**, %46 yanlış, %7 doğru. RAG (Lewis vd. 2020) kaynağa bağlar; halüsinasyonu sıfırlamaz.

**Mahremiyet/telif:** KVKK 6698 m.6'da sağlık verisi özel nitelikli; not/prompt/ekran görüntüsüne hasta verisi girmemeli. GDPR m.9/HIPAA benzer; sağlayıcıda no-training + DPA, sınır ötesinde KVKK m.9. Ders PDF'lerindeki hasta görselleri anonimleştirilmeli; DICOM metadata temizlenmeli. FSEK 5846: soru bankası/slayt/figür kopyalanamaz; AI çıktısı kaynağı birebir üretebilir. PDF talimatları prompt injection'dır; veri olarak okunur.

## 4. HTML/JS yığını

| Araç | Lisans | Boyut (min/gzip) | Karar |
|---|---|---|---|
| KaTeX | MIT | 267/75 KB | Formül varsa birincil. |
| MathJax | Apache-2.0 | KaTeX'ten ağır | Tam TeX gerekmiyorsa kullanma. |
| SVG + Canvas | yerleşik | 0 | Lab/diyagram varsayılanı. |
| D3 / Plotly | ISC/MIT | 274/91 KB; 4,7 MB min | Karmaşık grafik; Plotly ağır. |
| Three.js / model-viewer | MIT/Apache-2.0 | 725/181; 231/72 KB | 3D/AR opsiyonel; düşük cihaz riski. |
| Web Audio | yerleşik | 0 | Kalp/akciğer sesi; transcript/waveform. |
| PWA | yerleşik | küçük | Barındırılıyorsa; offline tek dosya birincil. |

Varsayılan **vanilla JS + SVG/Canvas**; KaTeX yalnızca formüllü notta; ağır kütüphaneler sadece gerekli modülde. Tek dosyada inline CSS/JS/SVG, sistem fontu, base64 medya; hedef <5 MB.

**Erişilebilirlik/baskı:** WCAG 2.2 AA; klavye, odak, 4,5:1, 24 px hedef, `aria-live`, tablo alternatifi, `prefers-reduced-motion`. Ses otomatik çalmasın; transcript + dalga formu. A4: 2 cm kenar, 10 pt, arka plan yok, `page-break-inside: avoid`, cevap anahtarı ayrı.

## 5. Platformlar: açık, ticari, link-only

| Platform | Erişim/lisans | Kullanım |
|---|---|---|
| [OpenStax](https://openstax.org/details/books/anatomy-and-physiology-2e) | A&P 2e **CC BY-NC-SA 4.0** | Atıfla alıntı/figür; ticari değil. |
| [LibreTexts](https://med.libretexts.org/) | Sayfa bazında değişir; bazen "not declared" | Künyeyi kontrol et; belirsizse link. |
| [MedEdPORTAL](https://www.mededportal.org/) | CC BY veya CC BY-NC-ND (yayına göre) | Lisansına göre atıf/link. |
| [AAMC](https://www.aamc.org/) (bazıları ücretsiz), [TeachMeAnatomy](https://teachmeanatomy.info/), [Geeky Medics](https://geekymedics.com/) | Telifli | Yalnızca link. |
| [Amboss](https://www.amboss.com/), [Osmosis](https://www.osmosis.org/), [UWorld](https://www.uworld.com/), [Kenhub](https://www.kenhub.com/), [UpToDate](https://www.uptodate.com/), [Medscape](https://www.medscape.com/) | Abonelik/freemium veya ücretsiz kayıt; telifli | Yalnızca link. |
| TUS: [TUSDATA](https://www.tusdata.com/), [TUS Sokağı](https://www.tussokagi.com/), [TUS Bankası](https://tusbankasi.com/) | Ticari | Yalnızca link; soru kopyalama yok. |

† Osmosis/MedEdPORTAL 403 (bot koruması), TTB'de TLS hatası; adresler standart, tarayıcıda doğrula.

## 6. AI ajan hattı: kaynaktan Anki'ye

| Aşama (çıktı) | Prompt/araç | Kapı |
|---|---|---|
| 1. Kaynak ingest (sayfa çapalı metin + lisans) | "Dosya, sayfa, lisans ekle; hasta verisi varsa dur." | G1 |
| 2. Coverage map (UÇEP/TUS eşlemesi) | "Başlıklar ↔ hedefler; eksik/fazlayı işaretle." | G2 |
| 3. Blueprint (8–12 bölüm) | "Bölüm başına 3–5 hedef, 1 yanlış anlama, 1 lab, 3–8 kart." | G2 |
| 4. Lab spec (değişken/formül/birim/sınır) | "1–3 parametre; formül; birim; beklenen değer; fallback." | G3 |
| 5. Build (tek HTML) | "Inline CSS/JS/SVG; ağ yok; ARIA; print CSS." | G4 |
| 6. Bağımsız doğrulama (hata listesi) | "Sadece not + kaynak; her sayı, birim, formül, atıf." | G3 |
| 7. Erişilebilirlik/baskı QA (checklist) | Klavye, zoom, A4, grayscale, ses transkripti. | G4 |
| 8. Anki export (`.apkg` + JSON) | genanki; GUID; tag; source; license; temiz profil. | G5 |

**Prompt desenleri:** (1) "Yalnızca kaynakta olanı yaz; her paragrafa `[k: dosya#s.P]` ekle; yoksa 'kaynakta yok'." (2) "JSON: `{section, objectives[], source_spans[], misconceptions[], lab{}, cards[]}`; boş alan yok." (3) "Doğrulayıcı: düzeltme yapma; `{claim, status, evidence}` döndür." (4) "Anki: 1 kart = 1 bilgi; soru tek anlamlı; cevap ≤2 satır; kaynak zorunlu."

**İnsan kapıları:** G1 kaynak/lisans/mahremiyet; G2 hekim kapsam onayı; G3 sayı-atıf (ajan + %10 insan); G4 Türkçe editör + WCAG/baskı; G5 temiz Anki profili.

## 7. Türkiye bağlamı

- **TUS:** ÖSYM, yılda iki dönem; temel + klinik; kılavuz UÇEP (Ulusal Çekirdek Eğitim Programı) uyumunu amaçlar; not UÇEP + yerel komite blueprint'iyle eşlenmeli. <https://www.osym.gov.tr/SinavGrubu/Index/6>
- **TTB:** meslek etiği/CME; sınav sahibi değil. <https://www.ttb.org.tr> (TLS zinciri eksik).
- **Komiteler:** eğitim-öğretim, program ve ölçme-değerlendirme komiteleri; onay şart.
- **Akreditasyon:** TEPDAD/UTEAK program çıktısı ve kanıt döngüsü ister. <https://www.tepdad.org.tr/>
- **Dil:** Türkçe gövde; terim ilk kullanımda İngilizce; tutarlı sözlük; makine çevirisi editörden geçmeli.
- **KVKK:** sağlık verisi özel nitelikli; PDF'lerdeki hasta görselleri anonimleştirilmeli; öğrenci verisi ayrı.
- **Cihaz:** düşük RAM Android, çevrimdışı; 5 MB, WebGL yok, 44 px, A4 fallback.
- **TUS platformları:** ticari; link. ÖSYM soruları telifli; kopyalanamaz.

## Kaynakça

1. <https://pubmed.ncbi.nlm.nih.gov/16507066/> — Roediger & Karpicke 2006; retrieval.
2. <https://pubmed.ncbi.nlm.nih.gov/16719566/> — Cepeda vd. 2006; spacing meta-analizi.
3. <https://pubmed.ncbi.nlm.nih.gov/31556629/> — Brunmair & Richter 2019; interleaving g=0,42.
4. <https://pubmed.ncbi.nlm.nih.gov/38423127/> — Gordon vd. 2024; AI tıp eğitimi.
5. <https://pubmed.ncbi.nlm.nih.gov/37337480/> — Bhattacharyya vd. 2023; uydurma referans.
6. <https://docs.ankiweb.net/deck-options.html> — FSRS/hedef tutma.
7. <https://github.com/kerrickstaley/genanki> — `.apkg`; MIT.
8. <https://github.com/foosoft/anki-connect> — yerel API; GPL-3.0, arşivli.
9. <https://www.kvkk.gov.tr/> — KVKK 6698.
10. <https://www.w3.org/TR/WCAG22/> — WCAG 2.2 AA.

## En iyi 3 öneri

1. **Aynı hattan HTML not + FSRS Anki:** blueprint → 3–5 soru → 1 lab → 3–8 kart; kaynak/lisans zorunlu.
2. **Vanilla JS + SVG/Canvas, gerekiyorsa KaTeX:** ağır kütüphane yok; çevrimdışı, A4, WCAG 2.2 AA testi.
3. **Bağımsız doğrulayıcı + hekim kapısı:** sayı/birim/formül/atıf eşleşmeden yayın yok; %10 insan kontrolü.

## Bu alanda 3 tuzak

1. **LLM'in PMID/DOI'sine güvenmek:** %47 uydurma olabilir; her atfı aç.
2. **Ticari soru/slayt/hasta görseli gömmek:** FSEK/KVKK ihlali; sadece link.
3. **Her konuya 3D/Plotly/animasyon:** yük ve boyut artar; sözcükte interleaving negatif (g=−0,39).
