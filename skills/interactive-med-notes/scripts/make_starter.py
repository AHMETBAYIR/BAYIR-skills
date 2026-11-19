#!/usr/bin/env python3
"""Generate the starter gallery content fragment for the medical note kit.

The gallery is a smoke-test page: every engine appears once, with a prediction
prompt, a canvas, controls, a readout, a status line and a print fallback.
"""

from __future__ import annotations

from pathlib import Path

LABS = [
    {
        "id": "ecg",
        "eyebrow": "Lab 01 · Kardiyovasküler",
        "title": "Sentetik EKG: hız, eksen ve QTc",
        "lede": "P-QRS-T dalgalarını, eksen projeksiyonunu ve QTc'yi aynı anda değiştir. Bu bir tanı aracı değil; ölçüm mantığını gösteren sentetik bir iz.",
        "predict": "Kalp hızını 60'tan 120'ye çıkarınca RR aralığı ve QTc nasıl değişir? Önce tahmin et, sonra QT'yi sabit tutarak dene.",
        "canvas_height": 380,
        "caption": "Lead II sentetik ritim stripi; alt panelde I, II, III projeksiyonları ve eksen çemberi.",
        "hint": "Einthoven: II = I + III. Eksen, I ve aVF'nin net yönünden okunur; QTc Bazett yüksek hızda fazla düzeltir.",
        "aria": "Sentetik elektrokardiyogram ve eksen çemberi.",
    },
    {
        "id": "pvloop",
        "eyebrow": "Lab 02 · Kardiyovasküler",
        "title": "Basınç–hacim döngüsü: preload, kontraktilite, afterload",
        "lede": "EDV, Ees ve Ea'yı değiştirerek SV, EF, CO ve stroke work'ü izle. Normal EF'nin düşük CO'yu gizleyebildiğini gör.",
        "predict": "Ea'yı 2,0'dan 4,0 mmHg/mL'ye çıkarırsan ESV, SV ve EF hangi yöne gider? Tahmin et, sonra sliders ile kontrol et.",
        "canvas_height": 370,
        "caption": "Şematik PV döngüsü; ESPVR eğrisi ve EDV/ESV işaretleri.",
        "hint": "SV = EDV − ESV; EF = SV/EDV; CO = SV × HR. Ees kontraktilite, Ea afterload'un lumped ölçüsüdür.",
        "aria": "Basınç-hacim döngüsü ve türetilmiş kardiyak output değerleri.",
    },
    {
        "id": "oxygen",
        "eyebrow": "Lab 03 · Solunum",
        "title": "Oksijen–hemoglobin eğrisi ve oksijen içeriği",
        "lede": "PaO₂, Hb, pH, sıcaklık ve COHb'yi değiştir. Saturasyon ile içerik arasındaki farkı ve CO zehirlenmesinde nabız oksimetresinin neden yanıltıcı olabileceğini gör.",
        "predict": "Hb 15'ten 8 g/dL'ye düşerse SaO₂ aynı kalır mı, CaO₂ aynı kalır mı? Önce yaz.",
        "canvas_height": 360,
        "caption": "Hill eğrisi; kesikli çizgi normal P50, düz çizgi seçili koşullar.",
        "hint": "CaO₂ = 1,34 × Hb × SaO₂ + 0,003 × PaO₂. P50 sağa kayarsa aynı PaO₂'de SaO₂ düşer.",
        "aria": "Oksijen-hemoglobin eğrisi ve oksijen içeriği.",
    },
    {
        "id": "acidbase",
        "eyebrow": "Lab 04 · Nefroloji / Solunum",
        "title": "Asit–baz: pH, kompansasyon ve anyon açığı",
        "lede": "PaCO₂, HCO₃⁻ ve elektrolitleri değiştir. Primer bozukluğu, beklenen kompansasyonu ve düzeltilmiş anyon açığını birlikte oku.",
        "predict": "HCO₃⁻ 10 mEq/L ve PaCO₂ 25 mmHg ise pH kaç olur? Winter formülüne uyuyor mu? Tahmin et, sonra hesapla.",
        "canvas_height": 360,
        "caption": "pH–HCO₃⁻ düzlemi; kesikli eğriler PaCO₂ izobarı, taralı bant normal pH.",
        "hint": "pH = 6,1 + log₁₀[HCO₃⁻/(0,03 × PaCO₂)]. Anyon açığı = Na⁺ − (Cl⁻ + HCO₃⁻).",
        "aria": "Asit-baz nomogramı ve anyon açığı hesapları.",
    },
    {
        "id": "pk",
        "eyebrow": "Lab 05 · Farmakoloji",
        "title": "Bir kompartman PK: IV ve oral eğri",
        "lede": "Doz, Vd, CL, F ve ka'yı değiştir. t½'nin dozdan bağımsız olduğunu, AUC'nin F ve CL'ye bağlı olduğunu gör.",
        "predict": "Aynı dozda F 0,6'dan 0,3'e düşerse Cmax ve AUC nasıl değişir? t½ değişir mi?",
        "canvas_height": 360,
        "caption": "Konsantrasyon–zaman eğrisi; IV bolus veya oral absorpsiyon.",
        "hint": "k = CL/Vd; t½ = ln2/k; AUC = F·D/CL. Oral eğride Tmax, ka ve k arasındaki yarışla belirlenir.",
        "aria": "Farmakokinetik konsantrasyon-zaman eğrisi.",
    },
    {
        "id": "pd",
        "eyebrow": "Lab 06 · Farmakoloji",
        "title": "Doz–yanıt: Emax, EC50 ve antagonizma",
        "lede": "Emax, EC50 ve Hill katsayısını değiştir; kompetitif ve nonkompetitif antagonizmayı karşılaştır. Güç ile etkinliğin aynı şey olmadığını gör.",
        "predict": "Kompetitif antagonist [I] = Ki iken EC50 kaç katına çıkar? Emax değişir mi?",
        "canvas_height": 350,
        "caption": "Log-konsantrasyon–etki eğrisi; kesikli çizgi antagonizmasız eğri.",
        "hint": "E = Emax·Cⁿ/(EC50ⁿ + Cⁿ). Kompetitif: EC50′ = EC50(1 + [I]/Ki). Nonkompetitif: Emax′ = Emax/(1 + [I]/Ki).",
        "aria": "Doz-yanıt eğrisi ve antagonizma kayması.",
    },
    {
        "id": "epi",
        "eyebrow": "Lab 07 · Halk Sağlığı",
        "title": "2×2 tablo: prevalans PPV'yi nasıl değiştirir?",
        "lede": "Aynı sensitivite ve spesifite ile farklı prevalanslarda PPV/NPV'yi karşılaştır. Base-rate neglect'i sayıyla gör.",
        "predict": "Prevalans %1 iken sensitivite %90, spesifite %95 ise pozitif testin gerçek hasta olma olasılığı %90 mı? Tahmin et.",
        "canvas_height": 360,
        "caption": "1000 kişilik kohortta TP/FN/FP/TN dağılımı ve 2×2 tablo.",
        "hint": "PPV = TP/(TP+FP). Sensitivite hastaları, spesifite sağlıklıları yakalar; PPV pozitif testin içindeki gerçek hasta oranıdır.",
        "aria": "İkiye iki tablosu ve prevalans etkisi.",
    },
    {
        "id": "visualfield",
        "eyebrow": "Lab 08 · Nöroanatomi",
        "title": "Görme alanı defektini lokalize et",
        "lede": "Lezyon yerini seç; iki gözün görme alanında kaybın nerede olduğunu gör. Kiazma, trakt, Meyer, parietal ve oksipital paternleri karşılaştır.",
        "predict": "Bitemporal hemianopi hangi yapıyı işaret eder? Homonim hemianopi hangi tarafta kayıp verir?",
        "canvas_height": 350,
        "caption": "Sol ve sağ gözün şematik görme alanı; kırmızı noktalar kaybı, T temporal alanı gösterir.",
        "hint": "Kiazma: çaprazlaşan nazal lifler → bitemporal. Retrokiazmal: homonim. Meyer: üst kuadrant. Parietal: alt kuadrant. Oksipital: makula korunabilir.",
        "aria": "Görme alanı defekt şeması.",
    },
    {
        "id": "ct",
        "eyebrow": "Lab 09 · Radyoloji",
        "title": "BT pencereleme: aynı HU, farklı gri tonu",
        "lede": "WW ve WL'yi değiştir; kesite tıklayarak probun HU değerini oku. Pencerelemenin tanıyı değil görüntülemeyi değiştirdiğini gör.",
        "predict": "Beyin penceresinde (WW 80, WL 40) gri madde ile beyaz madde arasındaki kontrast, kemik penceresinde (WW 2000, WL 500) nasıl değişir?",
        "canvas_height": 380,
        "caption": "Sentetik aksiyal BT kesiti; hematom, ventrikül ve kalsifikasyon. Kesite tıkla.",
        "hint": "Gösterim = clamp((HU − (WL − WW/2))/WW, 0, 1). Pencereleme görüntülenen kontrastı değiştirir; dokunun HU'su değişmez.",
        "aria": "Sentetik bilgisayarlı tomografi kesiti ve pencereleme.",
    },
    {
        "id": "brachial",
        "eyebrow": "Lab 10 · Anatomi",
        "title": "Brachial plexus lezyon lokalizasyonu",
        "lede": "Kök, trunkus, kord ve terminal dal düzeyinde lezyon seç. Tutulan dalları ve beklenen motor/duyu defisitini birlikte oku.",
        "predict": "C5–C6 kök lezyonunda neden el intrinsikleri korunur? C8–T1 lezyonunda Horner neden görülebilir?",
        "canvas_height": 340,
        "wide": True,
        "caption": "Şematik brachial plexus; kırmızı halka lezyon düzeyini, kırmızı dallar tutulan yapıları gösterir.",
        "hint": "Üst trunkus C5–C6 → omuz abdüksiyonu ve dirsek fleksiyonu. Alt trunkus C8–T1 → el intrinsikleri; T1 sempatik lifleri → Horner.",
        "aria": "Brachial plexus lezyon şeması.",
    },
]


def lab_html(lab: dict) -> str:
    return f'''
<div class="medlab" data-med-lab="{lab['id']}">
  <header class="medlab__head">
    <p class="medlab__eyebrow">{lab['eyebrow']}</p>
    <h3>{lab['title']}</h3>
    <p>{lab['lede']}</p>
  </header>
  <details class="predict">
    <summary>Tahmin et</summary>
    <p>{lab['predict']}</p>
  </details>
  <div class="medlab__controls" data-controls></div>
  <div class="medlab__grid{' medlab__grid--stack' if lab.get('wide') else ''}">
    <div>
      <div class="medlab__canvas-wrap">
        <canvas class="medlab__canvas" data-canvas data-height="{lab['canvas_height']}" role="img" aria-label="{lab['aria']}"></canvas>
      </div>
      <p class="medlab__caption">{lab['caption']}</p>
    </div>
    <div class="medlab__panel">
      <div class="medlab__readout" data-readout></div>
      <p class="medlab__status" data-status aria-live="polite"></p>
      <p class="medlab__hint">{lab['hint']}</p>
    </div>
  </div>
  <p class="medlab__print" data-print></p>
</div>
'''


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    intro = '''
<p class="lede">Bu galeri, <strong>interactive-med-notes</strong> motorlarının görsel ve davranışsal bir duman testidir. Her lab tek bir öğrenme iddiasını izole eder: önce tahmin et, sonra parametreyi değiştir, çıktıyı oku ve mekanizmayı bir cümleyle açıkla.</p>

<div class="keypoints">
  <p class="keypoints__title">Nasıl kullanılır</p>
  <ul>
    <li>Her labda önce <strong>Tahmin et</strong> kutusunu aç; cevabı yazmadan sliders'a dokunma.</li>
    <li>Bir seferde yalnızca bir parametreyi değiştir; hangi çıktının değiştiğini not et.</li>
    <li>Sağdaki durum satırı, sonucu <em>neden</em> açıklar. Yalnızca sayıyı okuma.</li>
    <li>Yazdırma önizlemesinde kontroller kaybolur; <code>data-print</code> satırı ve okuma değerleri kalır.</li>
  </ul>
</div>

<div class="medsafe"><strong>Eğitim sınırı</strong> Eğitim amaçlıdır. Bu sayfadaki tüm izler, kesitler ve skorlar sentetiktir. Hiçbiri tanı, doz veya tedavi kararı için kullanılmaz. Gerçek hasta değerlendirmesi klinik bağlam, doğrulanmış ölçüm ve hekim yargısı gerektirir.</div>
'''

    sections = ["\n<h2 id=\"galeri\">Lab galerisi</h2>\n" + intro]
    for lab in LABS:
        sections.append(lab_html(lab))

    sections.append('''
<h2 id="kaynaklar">Kaynaklar ve doğrulama</h2>
<p>Her labın sayısal çekirdeği <code>scripts/check_med.py</code> içinde bağımsız olarak yeniden yazılmıştır. Motor ile kontrolcü aynı kodu paylaşmaz; bu yüzden bir birim veya formül hatası iki tarafta aynı anda oluşmaz.</p>
<ul>
  <li><a href="https://www.escardio.org/Guidelines">ESC kılavuzları</a> — kardiyovasküler eşikler ve sınıflamalar.</li>
  <li><a href="https://goldcopd.org/">GOLD</a> — obstrüktif akciğer hastalığı ve spirometri.</li>
  <li><a href="https://kdigo.org/guidelines/">KDIGO</a> — böbrek hastalığı ve elektrolitler.</li>
  <li><a href="https://www.who.int/tools/child-growth-standards">WHO Child Growth Standards</a> — büyüme eğrileri (bu galeride yok; ayrı lab).</li>
  <li><a href="https://radiopaedia.org/">Radiopaedia</a> — radyoloji referansları (CC BY-NC-SA; görseller gömülmedi).</li>
</ul>
''')
    content = "\n".join(sections) + "\n"
    out = root / "assets" / "note.content.html"
    out.write_text(content, encoding="utf-8")
    print(out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
