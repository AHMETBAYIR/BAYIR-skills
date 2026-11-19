# Mikrobiyoloji ve İmmünoloji — Araştırma Notu

Bu not, çevrimdışı HTML ders notu için müfredat haritası, açık kaynaklar, sekiz lab ve çalışma yöntemi önerir. Eğitim amaçlıdır; tanı, doz veya tedavi talimatı değildir.

## 1. Müfredat haritası

Dönem/komite okula göre değişir. TUS çekirdeği: "ayırt edici özellik + tanı testi + direnç mekanizması".

| Konu | Dönem / komite | TUS çekirdeği | Tipik yanlış anlama |
|---|---|---|---|
| Gram boyama, hücre duvarı, kültür | Dönem 2 / Mikrobiyoloji | G+/G−, LPS, teikoik asit; kanlı/çikolata/MacConkey, katalaz-koagülaz, optokin | Dekolorizasyonu yok saymak; çikolata agarı "eritilmiş kan" sanmak |
| Virülans ve toksinler | Dönem 2 | Endotoksin/ekzotoksin, süperantijen, ADP-ribozilasyon, Şiga | Endotoksini ekzotoksinle karıştırmak |
| Antibiyotikler ve direnç | Dönem 2–3 / Farmakoloji | Hedef, spektrum, sidal/statik, ESBL/MRSA/VRE/KPC | "Geniş spektrum daha iyidir" sanmak |
| Solunum ve SSS | Dönem 3 | Pnömokok, *H. influenzae*, TB, *Legionella*, *Mycoplasma*; meningokok, *Listeria*, HSV | Atipikleri Gram'da beklemek; *Listeria*'yı sadece yenidoğanda düşünmek |
| GIS ve ürogenital | Dönem 3 | *Salmonella*, *Shigella*, *E. coli*, *C. difficile*, *H. pylori*; gonokok, *Chlamydia*, *Treponema* | *Chlamydia*'yı Gram'da görmeyi beklemek; her ishalde antibiyotik |
| Viroloji, mikoloji, parazitoloji | Dönem 2–3 | Replikasyon, hepatit serolojisi, HIV; *Candida/Aspergillus/Mucor*; malaria, *Toxoplasma*, *Giardia* | HBsAg'yi tek başına aktif replikasyon sanmak; *Aspergillus*'u septasız sanmak |
| İmmünoloji temelleri | Dönem 2 | Doğal/edinilmiş, kompleman, antikor, MHC, T/B | MHC I'i yalnızca dendritik hücrelerde sanmak; IgM'yi hafıza saymak |
| Hipersensitivite, otoimmünite, immün yetmezlik, transplant, aşı | Dönem 2–3 | Tip I–IV, HLA, red tipleri, canlı/ölü aşı | Tip II/III'ü karıştırmak; canlı aşıyı immünsüpreseye önermek |

## 2. Araçlar ve veri kaynakları

13 kaynağın lisansı HTML'e gömme kararını belirler. "Kısmen" olanlarda kısa alıntı, atıf ve kendi SVG'niz kullanılmalı.

| Kaynak | URL | Lisans | HTML'e gömülebilir? | Kalite / not |
|---|---|---|---|---|
| OpenStax Microbiology | https://openstax.org/books/microbiology/pages/1-introduction | CC BY-NC-SA 4.0 | Kısmen; atıflı, ticari değil | Yüksek; güncel ders kitabı |
| CDC DPDx / PHIL | https://www.cdc.gov/dpdx/ · https://phil.cdc.gov/ | Çoğu kamu malı; bazı görseller telifli | Evet, künye kontrolüyle | Yüksek; parazit/görsel arşiv |
| WHO AMR / GLASS | https://www.who.int/news-room/fact-sheets/detail/antimicrobial-resistance · https://www.who.int/initiatives/glass | CC BY-NC-SA 3.0 IGO | Evet; ticari değil, atıflı | Yüksek; küresel direnç |
| ECDC Atlas / Vaccine Scheduler | https://atlas.ecdc.europa.eu/public/index.aspx · https://vaccine-schedule.ecdc.europa.eu/ | CC BY 4.0 | Evet; atıflı | Yüksek; AMR ve takvim |
| ViralZone | https://viralzone.expasy.org/ | CC BY 4.0 | Evet; atıflı | Yüksek; replikasyon şemaları |
| Virology Blog | https://www.virology.ws/ | Telifli | Hayır; bağlantı | Orta-yüksek; güncel yorum |
| Microbe Canvas | https://microbe-canvas.com/ | Tüm hakları saklı | Hayır; yazılı izin | Orta; özellik bazlı arama |
| BugDrugDX | https://bugdrugdx.com/ | Ücretsiz, telifli | Hayır; bağlantı | Orta; 2019, ABD odaklı |
| EUCAST | https://www.eucast.org/ | Atıflı ücretsiz; yeniden satış yok | Kısmen; atıflı | Yüksek; breakpoint/QC |
| CARD | https://card.mcmaster.ca/ | Akademik ücretsiz; ticari lisans; ARO CC BY 4.0 | Kısmen | Yüksek; direnç genleri |
| IMGT / IEDB | https://www.imgt.org/ · https://www.iedb.org/ | Veri CC BY 4.0 | Evet; atıflı | Yüksek; immünogenetik/epitop |
| UniProt + RCSB PDB | https://www.uniprot.org/ · https://www.rcsb.org/ | UniProt CC BY 4.0; PDB CC0; PDB-101 CC BY 4.0 | Evet | Yüksek; dizi ve yapı |
| Wikimedia Commons | https://commons.wikimedia.org/wiki/Category:Microbiology | Dosya bazında CC0/CC BY/CC BY-SA | Evet; atıf + lisans | Değişken; künyeyi doğrula |

## 3. Etkileşimli lab fikirleri

Sekiz lab tek HTML'de, gömülü JSON ve vanilya JS/SVG ile çalışabilir. Kontrol, tip suşu veya doğrulanmış sınır durumudur; yanlışı da gösteren geri bildirim gerekir.

**1. Gram boyama karar ağacı.** Parametre: dekolorizasyon (5–30 s), morfoloji, düzen. Algoritma: kristal viyole → iyot → alkol → safranin; boya tutulumu + dallanma; çıktı cins ve sonraki test. **Fark et:** pembe her şey G− değildir; aşırı dekolorizasyon G+ boyar. Doğrulama/kontrol: *S. aureus* 25923 ve *E. coli* 25922 aynı lamda. Tuzak: kalın yayma, eski kültür.

**2. Bilinmeyen organizma tanımlayıcı.** Parametre: sekiz test (katalaz, oksidaz, koagülaz, optokin, safra eskülin, laktoz, indol, H2S). Algoritma: log-likelihood skoru; posterior >0,95 veya entropi düşükse dur; çıktı sıralı adaylar ve sonraki test. **Fark et:** tek test tanı koymaz; testin değeri aday kümesine bağlıdır. Doğrulama/kontrol: *S. aureus*, *E. coli*, *P. aeruginosa* tip suşları. Tuzak: kontamine besiyeri, eski taksonomi.

**3. Antibiyotik hedef/spektrum matrisi.** Parametre: ilaç sınıfı, Gram tipi, direnç bayrağı (ESBL/MRSA/VRE/KPC). Algoritma: ilaç × organizma matrisi + hedef etiketi; spektrum 0–3; çıktı hedef, statik/sidal, kapsam boşluğu. **Fark et:** geniş spektrum üstünlük değildir; direnç bayrağı matrisi tersine çevirir. Doğrulama/kontrol: vankomisin–*E. coli*, metronidazol–aerob, nitrofurantoin–*P. aeruginosa* (kapsam dışı). Tuzak: PK/PD ve odağı yok saymak.

**4. Kompleman kaskadı.** Parametre: yol (klasik/lektin/alternatif), C3/C5 eksikliği, opsonizasyon hızı. Algoritma: C1q/MBL/C3(H2O) → C3 konvertaz (C4b2a veya C3bBb) → C5 konvertaz (+C3b) → C5b-9 MAC; çıktı C3b birikimi, MAC ve bakteri sağkalımı. **Fark et:** C3 konvertazı klasik/lektinde C4b2a, alternatifte C3bBb'dir. Doğrulama/kontrol: normal ve C5 eksik serum; CH50 mantığı. Tuzak: üç yolu tek şemada birleştirmek.

**5. Hipersensitivite sıralayıcı.** Parametre: başlangıç (dakika/saat/gün), antijen, antikor/hücre. Algoritma: IgE/mast → I, hücre yüzeyi IgG/IgM → II, immün kompleks → III, T hücre → IV; çıktı tip, örnek, mekanizma. **Fark et:** Goodpasture tip II, poststreptokokal glomerülonefrit tip III'tür. Doğrulama/kontrol: anafilaksi, otoimmün hemolitik anemi, SLE, kontakt dermatit. Tuzak: tip II/III'ü yalnızca "antikor var" diye ayırmak.

**6. Aşı takvimi.** Parametre: doğum tarihi, ülke takvimi, gebelik/immünsüpresyon bayrağı. Algoritma: yaş kural motoru + minimum interval (canlılar arası 28 gün) + kontrendikasyon; çıktı Gantt ve gecikmiş dozlar. **Fark et:** takvim ülkeye ve yıla göre değişir; resmi takvim yüklenmeli. Doğrulama/kontrol: Sağlık Bakanlığı takvimi ve ECDC Scheduler. Tuzak: canlı aşıyı gebeye/immünsüpreseye vermek.

**7. HIV replikasyonu.** Parametre: basamak (1–7), ilaç sınıfı (NRTI/NNRTI/INSTI/PI/füzyon). Algoritma: gp120-CD4/CCR5 → gp41 füzyon → RT → integraz → transkripsiyon → montaj → proteazla olgunlaşma; her ilaç bir geçişi bloke eder; çıktı viral yük eğrisi. **Fark et:** NNRTI RT'yi, PI olgunlaşmayı bloke eder. Doğrulama/kontrol: ilaçsız büyüme, tam baskılayıcı ART, direnç mutasyonu. Tuzak: ART'nin latent rezervuarı temizlediğini sanmak.

**8. Antibiogram/MIC yorumlayıcı.** Parametre: zon çapı (mm), MIC (mg/L), tür ve breakpoint sürümü. Algoritma: EUCAST eşikleri; MIC ≤ S, > R; zon ≥ S, < R; çıktı kategori ve "I" için "artmış maruziyetle duyarlı" uyarısı. **Fark et:** zon çapı ile MIC aynı şey değildir; breakpoint yıl ve türe bağlıdır. Doğrulama/kontrol: *E. coli* 25922 ve *P. aeruginosa* 27853 QC aralıkları. Tuzak: eski breakpoint, 24/48 saat farkı, swarming.

## 4. Kanıta dayalı çalışma yöntemi

**İki adımlı geri çağırma.** Üç kart: organizma → hastalık, tersi, organizma → ilaç. 60 saniyede boş kâğıda yaz; yanlışı "hangi ayrımı kaçırdım" diye etiketle.

**Görsel tanıma.** Günde 10 dakika, 20 görsel: Gram boyası, kapsül, spor, hemoliz, küf morfolojisi, parazit yumurtası. Zorunlu seçim yap; karıştırılanları haftalık "hata albümü"ne al. CDC PHIL/Wikimedia'nın uygun lisanslı dosyalarını kullan.

**Şema haritası.** Patojen başına "giriş → adezyon → toksin → immün yanıt → klinik" zinciri; hedef haritasını (duvar, 30S/50S, folat, DNA/RNA, membran) tek sayfada çiz. Haftada bir boş kâğıda yeniden üret.

**Aralıklı tekrar.** 1-3-7-14-30 gün; oturumun %30'u yeni, %70'i tekrar. Konuları karıştır. Ayda bir 20 soruluk "boş sayfa" testi ve 5 dakikalık OSCE/vaka zinciri yap: örnek → boyama → besiyeri → doğrulama → direnç → ilaç.

## 5. Doğruluk ve güvenlik

Kaynak hiyerarşisi: WHO/CDC/ECDC, Sağlık Bakanlığı, EUCAST/IDSA > hakemli derleme > Robbins/Levinson/Janeway > açık eğitim > ticari > blog. MIC, zon ve aşı aralığında tarih/sürüm yazılmalı; eski breakpoint fenotipi yanlış sınıflar.

Sık hatalar: MIC'i mg/L dışında birimle vermek; zon çapını MIC sanmak; "I"yı hâlâ "orta duyarlı" okumak; dekolorizasyonu atlamak; endotoksin ile ekzotoksini, tip II ile III'ü, MHC I/CD8 ile MHC II/CD4'ü karıştırmak; canlı aşıyı gebelikte ve immünsüpresyonda önermek.

Hasta verisi yok; vakalar sentetik, gerçek isim ve MIMIC/TCIA verisi girmemeli. "Şu ilacı şu dozda ver" yazılmaz; doz tablosu gerekiyorsa kaynak ve "eğitim amaçlı" etiketi konur. Telif: OpenStax (CC BY-NC-SA), WHO (CC BY-NC-SA 3.0 IGO) ve Microbe Canvas (hakları saklı) görselleri gömülmez; ECDC, ViralZone, IMGT, IEDB, PDB-101 atıfla kullanılabilir; Wikimedia'da dosya lisansı kontrol edilir.

## 6. Kaynakça

1. OpenStax Microbiology — https://openstax.org/books/microbiology/pages/1-introduction — ders kitabı; CC BY-NC-SA 4.0.
2. CDC DPDx — https://www.cdc.gov/dpdx/ — parazit tanı/görsel eğitim.
3. CDC PHIL — https://phil.cdc.gov/ — görsel arşiv.
4. WHO AMR — https://www.who.int/news-room/fact-sheets/detail/antimicrobial-resistance — küresel AMR.
5. ECDC Surveillance Atlas — https://atlas.ecdc.europa.eu/public/index.aspx — ülke direnci; CC BY 4.0.
6. ViralZone — https://viralzone.expasy.org/ — replikasyon; CC BY 4.0.
7. EUCAST — https://www.eucast.org/ — breakpoint/QC.
8. IMGT — https://www.imgt.org/ — IG/TCR genleri; CC BY 4.0.
9. IEDB — https://www.iedb.org/ — epitop; CC BY 4.0.
10. T.C. Sağlık Bakanlığı Aşı Portalı — https://asi.saglik.gov.tr/bagisiklama-programi-ve-asi-takvimi.html — Türkiye takvimi.

## En iyi 3 öneri

1. **Gram boyama karar ağacı + 20 görselli kart seti** yapın; düşük maliyetle en yüksek ayırt edici beceriyi kazandırır.
2. **Antibiyotik hedef/spektrum matrisini** direnç bayraklarıyla birleştirin; iki dersi aynı ekranda tekrar ettirir.
3. **Organizma → hastalık → ilaç üçlü kartları** ve haftalık boş sayfa testini kurun; TUS'ta tanıma değil, geri çağırma ölçer.

## Bu alanda 3 tuzak

1. **Tek testle tanı koymak.** Gram boyası, katalaz veya tek zon çapı bağlam olmadan yanıltır; kontrol suşu ve ikinci test olmadan sonuç vermeyin.
2. **Güncel olmayan sayıyı kullanmak.** MIC/zon breakpoint'i, aşı takvimi ve direnç tanımı yıla göre değişir; sürüm tarihi olmayan tablo yayımlamayın.
3. **İmmünolojiyi ezber sanmak.** Tip II/III, MHC I/II ve kompleman yolları "hangi antijen, hangi hücre, hangi efektör" zinciriyle öğrenilmelidir.
