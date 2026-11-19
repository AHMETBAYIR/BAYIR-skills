# Tıp Eğitimi için Öğrenme Bilimi

Bu dosya, lab/not tasarımının neden bu şekilde olduğunu kısa kanıt özetiyle açıklar. Amaç, “etkileşim iyi” gibi bir tercihi değil, ölçülebilir öğrenme çıktısını savunmaktır.

## 1. Retrieval practice

**Bulgu:** Bilgiyi geri çağırmak, tekrar okumaktan daha kalıcı öğrenme sağlar. Etki, özellikle 1–7 gün sonra yapılan testlerde belirgindir.

**Tasarım:** Her bölümün sonunda 1–2 kapalı uçlu soru; her labdan önce tahmin; her notta 6–10 retrieval sorusu. Tanıma (çoktan seçmeli ama cevap ipucu veren) değil, üretme (boşluk doldurma, kısa cevap, vaka) tercih edilir.

**Tuzak:** Sorular metnin içinde cevabı veriyorsa retrieval değil, tanıma olur. “Aşağıdakilerden hangisi…” sorularında çeldiriciler gerçek yanlış anlamalar olmalı.

## 2. Spaced practice

**Bulgu:** Aynı toplam süreyi aralıklı dağıtmak, tek oturumda toplamaktan daha iyi kalıcılık sağlar. Anki/FSRS bunu bireysel unutma eğrisine göre yönetir.

**Tasarım:** 1-3-7-14-30 gün planı; notun sonunda “hangi kart hangi gün” tablosu; FSRS hedef tutma %90 (başlangıç). Yeni/tekrar oranı %30/%70.

**Tuzak:** Aynı gün 100 kart eklemek; kartları çok uzun tutmak; her notu ayrı desteye bölüp tekrarı kaçırmak.

## 3. Interleaving

**Bulgu:** Konuları karıştırmak, özellikle ayırt etme gerektiren becerilerde (matematik, tanı, kategori) transferi artırır. Sözcük öğrenmede etkisi negatif olabilir; tıpta çoğunlukla pozitif.

**Tasarım:** Aynı vaka setinde HFrEF/HFpEF, IDA/talasemi, nefrotik/nefritik gibi çiftleri karıştır. Her notta “kontrast vaka” bölümü.

**Tuzak:** Her konuyu ayrı blokta bitirip hiç karıştırmamak; rastgele karıştırıp kazanımı kaybetmek. Interleaving, blok öğrenmeden sonra yapılır.

## 4. Dual coding

**Bulgu:** Metin + görsel, tek kanaldan daha iyi hatırlanır; ancak görselin metni tekrar etmesi değil, yapıyı göstermesi gerekir.

**Tasarım:** PV döngüsü + SV/EF denklemi; O₂-Hb eğrisi + CaO₂ hesabı; 2×2 tablo + PPV sayısı. Görsel, metnin “kanıtı” olmalı.

**Tuzak:** Süs görsel; renk-only kodlama; çok küçük etiket; görselin altında açıklama olmaması.

## 5. Worked examples ve fading

**Bulgu:** Yeni başlayanlar için tam çözülmüş örnek, problem çözmeden önce öğrenmeyi kolaylaştırır; ileri düzeyde örnek azaltılır.

**Tasarım:** Her notta 1 tam çözüm (birim balance ile), 1 yarı çözüm (öğrenci tamamlar), 3–5 bağımsız alıştırma. Çözümler `<details>` içinde.

**Tuzak:** Sadece çözüm göstermek; öğrenciye hiç bağımsız deneme bırakmamak; çözümde birim atlamak.

## 6. Illness scripts

**Bulgu:** Uzmanlar hastalıkları listelerle değil, “kim, ne zaman, hangi bulgu, hangi seyir” şablonlarıyla tanır. Bu şablonlar ayırıcı tanıyı hızlandırır.

**Tasarım:** Her hastalık için 6 satır: epidemiyoloji → risk → semptom → bulgu → ayırıcı → yönetim. Vaka bu şablonun eksik parçasını sorar.

**Tuzak:** Ezber listesi; nedensiz sıralama; “hastanın yaşı” gibi tek ipucuna aşırı yüklenme.

## 7. Deliberate practice ve OSCE

**Bulgu:** Beceri, geri bildirimli tekrar ve alt bileşenlere ayırma ile gelişir. Tıpta OSKE, bu döngünün standardize biçimidir.

**Tasarım:** Checklist + süre + kritik hata + sesli akıl yürütme. Her beceri için “yapıldı/yapılmadı/kritik hata” üçlüsü.

**Tuzak:** Sadece izlemek; süre tutmamak; kritik hatayı (“steril eldiven yok”) puanlamamak; iletişimi yok saymak.

## 8. Cognitive load

**Bulgu:** Çalışma belleği sınırlıdır. Aynı anda çok parametre, çok renk, çok metin öğrenmeyi bozar.

**Tasarım:** Bir labda 1–3 parametre; bir bölümde 3–5 kazanım; bir ekranda 1 ana figür. “Ek bilgi” kutuları ana akışı bölmez.

**Tuzak:** Her şeyi “önemli” ilan etmek; labda 8 slider; aynı figürde 5 kavram.

## 9. Metacognition ve hata taksonomisi

**Bulgu:** Öğrencinin hatasını sınıflandırması, tekrar aynı hatayı yapmasını azaltır.

**Tasarım:** Hata günlüğü: (1) bilgi eksikliği, (2) birim/formül, (3) soru okuma, (4) dikkat, (5) kavram yanılgısı. Her quiz açıklaması bu kodlardan birini ima eder.

**Tuzak:** “Dikkatsizlik” deyip geçmek; yanlışı sadece “yanlış” diye işaretlemek.

## 10. Tıbba özgü denge

Tıp notu, üç aşırılık arasında denge kurar:

1. **Ansiklopedi:** Her şey var, hiçbir şey hatırlanmıyor.
2. **Özet:** Az şey var, mekanizma yok, transfer yok.
3. **Oyun:** Çok etkileşim var, tıbbi doğruluk yok.

İyi not, **mekanizma + ölçüm + vaka** üçlüsünü tek sayfada birleştirir; geri kalanı isteğe bağlı derinleşme olarak sunar.

## 11. Kısa kaynakça

- Roediger & Karpicke (2006), retrieval practice.
- Cepeda ve ark. (2006), distributed practice.
- Rohrer & Taylor (2007), interleaving.
- Mayer (2009), multimedia learning.
- Sweller (1988), cognitive load.
- Schmidt & Rikers (2007), illness scripts.
- Ericsson (2008), deliberate practice.
- Anki/FSRS belgeleri.
