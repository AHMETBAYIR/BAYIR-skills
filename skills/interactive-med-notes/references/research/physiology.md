# Fizyoloji ve Biyofizik — Etkileşimli Not Araştırması

> Sayılar **öğretim modeli**dir; hasta ölçümü/klinik karar değildir. Yaygın İngilizce terimler korunmuştur.

## 1. Müfredat haritası

Komiteler değişebilir. TUS'ta sık çıkan: kalp, solunum, böbrek, endokrin.

| # | Konu | Dönem / komite | TUS çekirdeği | Sık yanlış |
|---|---|---|---|---|
| 1 | Membran transport, osmolarite | D1 / Hücre-Doku | Nernst, GHK, Na⁺/K⁺ ATPaz | Nernst = Vm; osmolarite = tonisite |
| 2 | Nöro-kas: AP, sinaps, kasılma | D1–2 / Sinir-Kas | HH, EPSP/IPSP, E-C coupling | Uyaran↑ → AP amplitüdü↑; filamentler kısalır |
| 3 | Kalp: döngü, debi, Frank-Starling, PV loop | D2 / Dolaşım | Wiggers, EF, CO, preload/afterload | CO = HR × EDV; S1 = semilunar |
| 4 | Dolaşım: basınç-akım, mikrodolaşım, lenf, barorefleks | D2 / Dolaşım | Poiseuille, Starling, barorefleks | Barorefleks uzun vadeli TA'yı belirler |
| 5 | Solunum: mekanik, V/Q, O₂-Hb, asit-baz | D2 / Solunum | Kompliyans, Laplace, O₂ eğrisi, shunt | Sürfaktan sadece kompliyans; V/Q=0 O₂ ile düzelir |
| 6 | Böbrek: GFR, klirens, transport, konsantrasyon | D2 / Üriner | Klirens, FF, countercurrent, ADH | Klirens = atılım; loop idrarı konsantre eder |
| 7 | GI: motilite, sekresyon, sindirim-emilim | D2 / Sindirim | Gastrin, CCK, sekretin, pH | Mide ana emilim; safra lipaz içerir |
| 8 | Endokrin: eksenler, tiroid, adrenal, pankreas, Ca-P | D2 / Endokrin | Feedback, insülin/glukagon, PTH/vit D | İnsülin tüm dokularda alımı artırır; deksametazon her Cushing'i baskılar |
| 9 | Üreme ve entegrasyon | D2–3 / Entegre | HPO, sıvı-elektrolit, O₂ transportu | Progesteron sadece endometriyuma etki eder |

## 2. Araçlar ve veri kaynakları

| Araç | URL | Lisans | HTML / kalite |
|---|---|---|---|
| OpenStax A&P 2e | <https://openstax.org/details/books/anatomy-and-physiology-2e> | CC BY-NC-SA 4.0 | Metin/figür evet (atıf) |
| OpenCOR | <https://opencor.ws/> | GPL-3.0 | Hayır; CellML, kardiyak AP |
| Physiome | <https://models.physiomeproject.org/> | Model bazında | Hayır; küratörlü CellML |
| BioModels | <https://www.ebi.ac.uk/biomodels/> | CC0 1.0 | Hayır; küratörlü SBML |
| BioGears | <https://biogearsengine.com/> | Apache-2.0 | Hayır; entegratif C++ |
| HumMod | <https://hummod.org/agreement> | XML GPL-2.0; exe eğitim/araştırma | Hayır; Windows, kapsamlı |
| PhysioNet | <https://physionet.org/> | Proje bazında | Küçük gerçek kesit, lisansa göre |
| PTB-XL | <https://physionet.org/content/ptb-xl/1.0.3/> | CC BY 4.0 | 10 s'lik kayıt evet; 21.799 ECG |
| SimVascular | <https://simvascular.github.io/> | BSD-3-Clause | Hayır; hasta-spesifik CFD |
| NEURON | <https://github.com/neuronsimulator/nrn> | BSD-3-Clause | Hayır; HH/kompartman |
| Brian2 | <https://brian2.readthedocs.io/> | CeCILL 2.1 | Hayır; spiking ağ |
| PhET Membrane Channels | <https://phet.colorado.edu/en/simulations/membrane-channels> | CC BY-NC 4.0 | Iframe/link; kavramsal |

## 3. Etkileşimli lab fikirleri

🚢 = tek HTML dosyasında güvenle çıkar. Akış: **tahmin → gözlem → açıklama**.

**1. PV loop + Frank-Starling** 🚢
- **Girdi/çıktı:** EDV, Ees, Ea, HR → ESV, SV, EF, CO, P_es.
- **Formül:** SV = Ees(EDV−V0)/(Ees+Ea); EF = SV/EDV; CO = HR·SV/1000; SW ≈ P_es·SV·0,1333 J; V0=15 mL.
- **Fark et:** Preload↑ → SV↑; afterload↑ → SV↓.
- **Yanlış/doğrula:** Ea=SVR sanma; loop alanını P_es·SV'ye eşitleme. Ea→0: SV→EDV−V0; Ea→∞: SV→0; 120/2,5/2,0 → SV≈58, EF≈49%.

**2. Solunum kompliyansı ve sürfaktan** 🚢
- **Girdi/çıktı:** sürfaktan açık/kapalı, r, ΔV → Laplace basıncı, C, iş, stabilite.
- **Formül:** P=2T/r (T dyn/cm, r cm; 1 cmH₂O=980,7 dyn/cm²); C=ΔV/ΔP; W=½ΔP·ΔV.
- **Fark et:** Sürfaktan yokken küçük alveol büyüğe boşalır; sürfaktan T'yi boyuta göre düşürür.
- **Yanlış/doğrula:** Küre için P=4T/r kullanma. r=150 µm, T=20 → P≈2,7 cmH₂O; r yarıya inince P iki katı; T yarıya inerse P aynı.

**3. O₂-Hb eğrisi ve O₂ içeriği** 🚢
- **Girdi/çıktı:** PaO₂, Hb, pH, sıcaklık → SaO₂, P50, CaO₂, eğri.
- **Formül:** SaO₂=PaO₂ⁿ/(P50ⁿ+PaO₂ⁿ), n≈2,7, P50≈26,6 mmHg; P50×10^(−0,48(pH−7,4)); CaO₂=1,34·Hb·SaO₂+0,003·PaO₂.
- **Fark et:** %100 SaO₂'de bile Hb düşükse CaO₂ düşük; CO zehirlenmesinde SaO₂ normal görünür.
- **Yanlış/doğrula:** SaO₂=içerik sanma; Hill'i sabit n ile kullanma. P50 → %50; Hb=15, PaO₂=100 → CaO₂≈20 mL/dL; Hb=7,5 → ≈10.

**4. Asit-baz ve kompansasyon** 🚢
- **Girdi/çıktı:** PaCO₂, HCO₃⁻, Na⁺, Cl⁻, albümin → pH, primer bozukluk, beklenen kompansasyon, AG.
- **Formül:** pH=6,1+log₁₀[HCO₃⁻/(0,03·PaCO₂)]; Winter: PaCO₂=1,5·HCO₃⁻+8±2; metabolik alkaloz: 0,7·HCO₃⁻+21±2; AG=Na⁺−(Cl⁻+HCO₃⁻); düzeltilmiş AG=AG+2,5(4,0−albümin).
- **Fark et:** pH normal olsa da yüksek AG metabolik asidozu gizleyebilir; kompansasyon tam değildir.
- **Yanlış/doğrula:** Sadece pH'a bakma; düşük HCO₃⁻'i hep metabolik asidoz sanma. 24/40 → pH 7,40; 12/26 → pH≈7,29; Winter 26±2 uyumlu.

**5. Renal klirens ve GFR**
- **Girdi/çıktı:** Ux, V̇, Px, Hct → Cx, GFR, RPF, FF.
- **Formül:** Cx=Ux·V̇/Px; GFR=C_inülin; RPF=C_PAH; FF=GFR/RPF; RBF=RPF/(1−Hct); yük=GFR·Px; atılım=Ux·V̇.
- **Fark et:** Kreatinin sekresyonu CrCl'yi GFR'den yüksek gösterir; PAH klirensi RPF'tir.
- **Yanlış/doğrula:** Cockcroft-Gault/CKD-EPI'yi ölçülmüş GFR sanma; klirens=atılım sanma. U=25, V̇=1, P=0,2 → 125 mL/min; U=P ise C=V̇; V̇=0 ise C=0.

**6. ECG sentezi ve interval ölçümü**
- **Girdi/çıktı:** HR, PR, QRS, QT, ST → PQRST, RR, QTc.
- **Formül:** RR=60/HR; QTc=QT/√RR (Bazett); dalga=Σ Aᵢ·exp[−(t−μᵢ)²/(2σᵢ²)].
- **Fark et:** QRS genişlemesi QT'yi uzatır; QTc yüksek HR'de fazla düzeltir.
- **Yanlış/doğrula:** Sentetik dalgayı tanısal ECG, Bazett'i her HR'de doğru sanma. HR=60 → RR=1 s, QT=0,40 → QTc=0,40; HR=120 → RR=0,5, QT=0,35 → QTc≈0,495.

**7. Barorefleks ve kanama**
- **Girdi/çıktı:** kan kaybı, kazanç B → MAP, HR, SV, CO, SVR.
- **Formül:** MAP=CO·SVR; CO=HR·SV/1000; HR=clamp[HR₀+0,35B(MAP₀−MAP)]; SVR=clamp[SVR₀+0,06B(MAP₀−MAP)]; damped iterasyon.
- **Fark et:** Barorefleks MAP'yi tamponlar, kan kaybını geri getirmez; MAP normalken CO düşük olabilir.
- **Yanlış/doğrula:** Anlık/sonsuz kazanç sanma; SVR birimini karıştırma (1 mmHg·min/L=80 dyn·s·cm⁻⁵). B=0 → MAP=CO·SVR; 30% SV kaybında MAP 93→~75; kalıntı <0,1 mmHg.

**8. Hodgkin-Huxley aksiyon potansiyeli**
- **Girdi/çıktı:** g_Na, g_K, kaçak, uyaran, [K⁺]₀ → Vm(t), eşik, refrakter.
- **Formül:** C·dVm/dt=−(I_Na+I_K+I_L)+I_stim; I_Na=g_Na·m³h·(Vm−E_Na); I_K=g_K·n⁴·(Vm−E_K); E_iyon=61,5/z·log₁₀([iyon]₀/[iyon]ᵢ) mV.
- **Fark et:** Eşiği geçen uyaranın amplitüdü değil sıklığı değişir; refrakter dönem AP'yi sınırlar.
- **Yanlış/doğrula:** Nernst'ü Vm sanma; pompa/gradient kaymasını yok sayma. E_K≈−90, E_Na≈+60, Vm≈−70 mV; g_Na=0 (TTX) → AP yok; [K⁺]₀↑ → depolarizasyon.

## 4. Kanıta dayalı çalışma yöntemi

- **Mekanizma iskeleti:** "Uyaran → reseptör → afferent → merkez → efferent → efektör" + negatif feedback oku. Örn. MAP↑ → baroreseptör↑ → NTS → vagal↑/sempatik↓ → HR↓, SVR↓.
- **POE + grafik okuma:** Parametreyi değiştirmeden sayısal tahmin yaz; eksen/birim, eğim, alan, kesişim ve sınır durumlarını oku; farkı formülle açıkla. Örn. Ea 2→4 olunca SV kaç mL düşer? PV loop alanı ≈ iş; O₂-Hb'de P50=%50.
- **Vignette + aralıklı tekrar + OSCE:** Normal → kompanse → dekompanse vaka (kanama, kalp yetmezliği, DKA, RDS, SIADH). 1–3–7–21 gün, farklı format (formül/grafik/vaka); 5 dakikalık istasyonda grafiği yorumla: "Ees mi Ea mı değişti? QTc uzun mu?"

## 5. Doğruluk ve güvenlik

- **Kaynak hiyerarşisi:** ESC/AHA/ACC, KDIGO, GOLD, WHO > Cochrane > Guyton/Costanzo > OpenStax/ECGpedia > ticari > blog. Sayı için ders kitabı + derleme; klinik eşik için kılavuz.
- **Model ≠ hasta:** Her simülatör çıktısına "öğretim modeli; tanı/tedavi değildir" etiketi. PV loop/ECG/O₂-Hb grafiği hasta verisi değil; vignette sentetik.
- **Sık birim hataları:** 1 mmHg=1,36 cmH₂O; 1 L/min=1000 mL/min; 1 mmHg·min/L=80 dyn·s·cm⁻⁵; 1 mmHg·mL=0,133 J; 1 L·cmH₂O=0,098 J; PaCO₂ 1 kPa=7,5 mmHg.
- **Formül sınırı:** Bazett HR 60–90 (dışında Fridericia); Hill ampirik, n sabit değil; Cockcroft-Gault GFR ölçmez; Winter komplike olmayan metabolik asidoz içindir; Laplace küresel/homojen T; Poiseuille laminar akım varsayar.
- **Veri, telif, klinik sınır:** MIMIC/TCIA ham verisi, gerçek isim, hasta görüntüsü kullanma; PTB-XL/MIT-BIH'te yeniden kimliklendirme yapma. Guyton/Costanzo figürlerini kopyalama; OpenStax atıf + CC BY-NC-SA, PhET CC BY-NC, ECGpedia (<https://en.ecgpedia.org/>) CC BY-NC-SA. "Şu ilacı şu dozda ver" yazma; doz tablosuna kaynak + "eğitim amaçlı" etiketi.

## 6. Kaynakça

1. **OpenStax A&P 2e** — <https://openstax.org/details/books/anatomy-and-physiology-2e> — fizyoloji; CC BY-NC-SA 4.0.
2. **OpenCOR** — <https://opencor.ws/> — CellML kardiyak AP; GPL-3.0.
3. **Physiome** — <https://models.physiomeproject.org/> — kardiyovasküler/renal CellML; model bazında.
4. **BioModels** — <https://www.ebi.ac.uk/biomodels/> — SBML; CC0 1.0.
5. **BioGears** — <https://biogearsengine.com/> — entegratif motor; Apache-2.0.
6. **HumMod** — <https://hummod.org/agreement> — entegratif model; XML GPL-2.0.
7. **PhysioNet** — <https://physionet.org/> — açık sinyaller; proje bazında.
8. **PTB-XL** — <https://physionet.org/content/ptb-xl/1.0.3/> — ECG; CC BY 4.0.
9. **MIT-BIH** — <https://physionet.org/content/mitdb/1.0.0/> — aritmi; ODC-BY 1.0.
10. **NEURON** — <https://github.com/neuronsimulator/nrn> — HH/kompartman; BSD-3-Clause.

## En iyi 3 öneri

1. **Dört lab:** PV loop, solunum/sürfaktan, O₂-Hb, asit-baz. Vanilya JS + SVG; tahmin→oynat→açıkla→doğrula.
2. **Model sınırı kutusu:** Formül, birim, geçerlilik, "hasta değildir"; sınır durumlarını (Ea→0, r→0, Hb→0, HCO₃⁻→0) test et.
3. **Mekanizma + grafik + vignette:** Barorefleks, V/Q, countercurrent, HPA; her diyagrama grafik okuma + 2–3 vaka ekle.

## Bu alanda 3 tuzak

1. **Modeli tanı sanmak:** PV loop/ECG/O₂-Hb çıktısını hastaya uygulamak. Çözüm: "öğretim modeli", sentetik veri, kılavuz.
2. **Birim/ölçek:** mmHg↔cmH₂O, L/min↔mL/min, SVR, Bazett, Hill. Çözüm: birim tablosu + sınır testi.
3. **Telif:** Guyton/Costanzo figürlerini kopyalamak; OpenStax/PhET/ECGpedia lisansını atlamak. Çözüm: yeniden çizim, atıf + ShareAlike/NC.
