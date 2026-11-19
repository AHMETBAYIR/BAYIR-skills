# On Dört Alt Konu Araştırması

Bu dizin, tıp müfredatının 14 alt konusu için bağımsız araştırma dosyalarını içerir. Her dosya aynı brief ile üretildi:

1. Müfredat haritası (dönem/komite, TUS çekirdeği, tipik yanlış anlamalar)
2. Açık/kaynak gösterilebilir araçlar ve lisanslar
3. En az 6 etkileşimli lab fikri (parametre → çıktı → formül → doğrulama)
4. Kanıta dayalı çalışma yöntemi
5. Doğruluk, birim ve güvenlik sınırları
6. Kaynakça
7. “En iyi 3 öneri” ve “3 tuzak”

| # | Dosya | Kapsam | Öne çıkan lab |
|---|---|---|---|
| 1 | [anatomy.md](anatomy.md) | Gross anatomi, nöroanatomi, kranyal sinirler, plexus, görme yolu | Brachial plexus, görme alanı, spinal lezyon |
| 2 | [physiology.md](physiology.md) | Kardiyovasküler, solunum, renal, GI, endokrin, nöro, membran | PV loop, sürfaktan, O₂-Hb, asit-baz |
| 3 | [histology-embryology.md](histology-embryology.md) | Doku histolojisi, boya, embriyogenez, fetal dolaşım, teratojen | Sanal lam, boya seçici, embriyo timeline |
| 4 | [biochemistry-genetics.md](biochemistry-genetics.md) | Metabolizma, vitaminler, DNA, kalıtım, sitogenetik, kanser genetiği | Metabolik harita, pedigri, Hardy-Weinberg |
| 5 | [microbiology-immunology.md](microbiology-immunology.md) | Bakteri/viroloji/mikoloji/parazitoloji, immün yanıt, aşı | Gram ağacı, antibiyotik matrisi, kompleman |
| 6 | [pathology.md](pathology.md) | Genel ve sistem patolojisi, tümör sınıflaması, IHC, TNM | Lezyon tarifi, IHC paneli, TNM |
| 7 | [pharmacology.md](pharmacology.md) | PK/PD, otonom, KVS, SSS, antimikrobiyal, endokrin, kemoterapi | PK eğrisi, doz-yanıt, CYP matrisi |
| 8 | [internal-medicine.md](internal-medicine.md) | Kardiyo, göğüs, gastrohepatoloji, endokrin, nefro, heme, enfeksiyon, romatoloji | ECG/ACS, asit-baz, sodyum, CKD-EPI |
| 9 | [surgery-emergency.md](surgery-emergency.md) | Perioperatif, travma, şok, yanık, sepsis, ventilasyon, sütür | ATLS ağacı, şok, TBSA, ventilatör |
| 10 | [pediatrics-obgyn.md](pediatrics-obgyn.md) | Büyüme, aşı, yenidoğan, KKH; antenatal, doğum, PPH, preeklampsi | WHO LMS, Apgar/NRP, CTG, Bishop |
| 11 | [neurology-psychiatry.md](neurology-psychiatry.md) | İnme, epilepsi, demans, koma; MSE, DSM, psikofarmakoloji | NIHSS/GCS, görme alanı, MSE, PHQ-9 |
| 12 | [public-health-ebm.md](public-health-ebm.md) | Epidemiyoloji, bias, tarama, biyoistatistik, GRADE | 2×2, NNT, forest, KM, herd immunity |
| 13 | [radiology-clinical-skills.md](radiology-clinical-skills.md) | X-ray/CT/MRI/US, CXR, FAST, OSCE, prosedürler | BT penceresi, CXR ABCDE, sütür, SBAR |
| 14 | [meded-ai-tooling.md](meded-ai-tooling.md) | Öğrenme bilimi, Anki/FSRS, LLM/RAG, HTML/JS, platformlar | Anki export, RAG, OSCE simülatörü |

## Ortak sonuçlar

- **En yüksek getirili lablar hesaplanabilir olanlar:** PV loop, O₂-Hb, asit-baz, 2×2, PK/PD, BT penceresi.
- **Görsel lablar lisansla sınırlı:** Kendi SVG’n en güvenli; CC BY-NC-SA/DUA/ticari kaynaklar link-only.
- **Her alanda “model ≠ hasta” uyarısı gerekli:** Sentetik ECG, phantom BT, lumped PV, ideal 2×2.
- **TUS yüksek verim:** mekanizma + tek hesaplama + tek ayırıcı + tek kırmızı bayrak.
- **AI en çok kaynak özeti, soru çeşitlendirme ve dil düzeltmede yararlı; sayı/atıf/klinik kararda değil.**

## Kaynak doğrulama notu

Araştırma sırasında URL’ler `rk`, `webfetch` ve tarayıcı ile kontrol edildi. Radiopaedia (406), CDC (403), Pathology Outlines (429) gibi siteler otomatik isteklere bot koruması döndürür; bu URL’ler tarayıcıda açılır. Bir URL’nin açılması, içeriğin güncel veya doğru olduğu anlamına gelmez; sayısal iddialar ayrıca kılavuz/ders kitabıyla doğrulanmalıdır.
