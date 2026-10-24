# Kırk Kişilik Söz: sade başlangıç ve yerel rehber doğrulaması

24 Ekim 2026. Bu kayıt yalnız ayrı 12 dakikalık bölümün sade başlangıç ve deterministik yerel sesli rehber değişikliğini kapsar.

## Kaynak sınırı

Başlangıç commit'i: `3778c2ff6976b0d1f2e60c847adba1c05aaeb49c`.

Değişiklikler yalnız `editions/itsm/` altındadır. Kök GRC, eski ITSM sunucusu, mevcut hesap/parola işlemleri, veritabanı, senaryolar ve ortam/Site yapılandırması korunur. Ticari arka uç, diğer 42 dakikalık bölümün motoru veya arayüzü, canlı model bağlantısı ve mikrofon eklenmez. Ortak eğitim sözleşmesindeki diğer bölüm tanımları yalnız sürümlü ortak veridir.

Ham operasyon/geliştirme günlükleri, özel hesap bilgileri, ortam sırları, kurulu bağımlılıklar, önbellekler ve üretilmiş Next.js tür dosyası kaynak değişikliğine dahil değildir. Bu kayıt bir ana dal birleştirmesi veya canlı yayın işlemi değildir.

## Yeniden çalıştırılan kontroller

- `npm run build:forty`: başarılı. HTML 154186 bayt; SHA-256 `13c49190bbf4db5230dd14c18f3964a39d180b21db86fec62d7ccef1e11e1913`.
- `npm run check`: JavaScript/senaryo kontrolü ve kanonik sözleşme sapma denetimi başarılı.
- `npm test`: 240 test, 239 başarılı, 0 başarısız, 1 eski isteğe bağlı görsel tarayıcı testi atlandı.
- Toplamın içinde 59 bölüm, 56 bağımsız motor/DOM/VM/paket, 29 anlatıcı ve 9 kısa bölüme özgü eğitim sözleşmesi testi vardır. Normal test komutu bunları çalıştırır.
- `pnpm exec tsc --noEmit`: başarılı.
- `npm run build`: üretim derlemesinin beş aşaması başarılı.
- `npm run replay:forty`: dört sentetik yol başarılı. İlk 40 kişiye hizmet teslimi ile sonraki 80 kişi için kaynak ayrılması ayrı kaldı.

## Ses ve kabul sınırları

Rehber sabit ortak metni seçer; canlı AI değildir. Ses yalnız kullanıcı seçimiyle ve tarayıcının yerel Türkçe sesi varsa kullanılır. Uygun ses yoksa metinle devam edilir. Özel rol zarfları, bütün oyun durumu veya kullanıcı notları seslendirmeye aktarılmaz. Durdurma, insan devralma, tekrar, rol/bağlam değişimi, görünmez sekme ve yeni prova sınırları otomatik testlerde denetlendi.

Bunlar kaynak, sentetik durum geçişi, HTTP ve DOM/VM kontrolleridir. Gerçek cihazda işitilmiş ses, doğallık, kesme gecikmesi, Safari/iOS, görsel/klavye erişilebilirliği, çok kullanıcılı oturum veya insanlı öğrenme/keyif kabulü bu sonuçlardan çıkarılamaz. Tek cihazda rol değiştirmek gerçek kimlik doğrulama ya da rol gizliliği sağlamaz.

CI sonucu yalnız ilgili yeni commit'in GitHub Actions çalışmaları tamamlandığında doğrulanabilir. Bu belge yerel kaynak doğrulamasını kaydeder; gelecekteki CI veya canlı yayın başarısını iddia etmez. Kök uygulamanın tarayıcı CI testleri GRC'yi kapsar, bu bölümün görsel veya ses kabulünü değil.
