# Kırk Kişilik Söz: ayrı GitHub bölümü doğrulaması

24 Ekim 2026. Bu kayıt, mevcut ITSM kaynağına yalnız ayrı tek cihazlık bölümü ekleyen değişiklik kümesini kapsar. Ticari aday, ortak D1 atölyesi, hesap sıfırlama değişiklikleri veya başka yayımlanmamış çalışma bu değişikliğe dahil değildir.

## Kaynak ve korunmuş sınır

- Başlangıç GitHub commit'i: `94d3e91ed1d1865f0e2aea36a37dd1df13de5579`.
- Değişen yer yalnız `editions/itsm/` altındadır. Kök GRC uygulaması, mevcut ITSM sunucusu, pilot hesabı/parola işlemleri, veritabanı, önceki senaryolar, Site kimliği ve mevcut ortam şablonu korunur.
- Bu değişiklik canlı yayın, ana dal birleştirmesi veya mevcut atölyelere geçiş işlemi değildir.
- Yeni bölümün motoru, arayüzü, ortak öğrenme içeriği ve çevrimdışı HTML'i test edilmiş 24 Ekim bölüm kaynağıyla birebir aynıdır.
- Ham özel geliştirme/operasyon günlükleri, çalışma veritabanları, kurulu bağımlılıklar, önbellekler, ortam sırları ve üretilmiş Next.js tür dosyası bu değişikliğe eklenmez.

## Bu değişiklik kümesinde yeniden çalıştırılanlar

- `npm run build:forty`: başarılı. HTML 122832 bayt; SHA-256 `854bf8b8505614500948dee4419fc4e0b308b7fac90d3145301a2f49fd16771c`.
- `npm run check`: JavaScript ve senaryo kontrolü başarılı.
- `npm test`: 183 test, 182 başarılı, 0 başarısız, 1 eski isteğe bağlı görsel tarayıcı testi atlandı.
- 59 bölüm testi ve 37 bağımsız motor/DOM/VM/paket testi yukarıdaki toplamın içindedir. Normal test komutu bu bağımsız testleri de çalıştırır.
- `pnpm exec tsc --noEmit`: başarılı.
- `npm run build`: üretim derlemesinin beş aşaması başarılı.
- `npm run replay:forty`: dört sentetik yol başarıyla tamamlandı. Her yol ilk 40 kişiye teslim edilen hizmeti ve kalan krediyi ayrı gösterdi; sonraki 80 kişi için fon ayırma gerçek hizmet teslimi sayılmadı.

## Doğrulama sınırları

Bunlar kaynak, sentetik durum geçişi, HTTP ve DOM/VM kontrolleridir. Gerçek tarayıcıda piksel/görsel kalite, Safari/iOS, erişilebilirlik, gerçek çok kullanıcılı etkileşim ve insanlı öğrenme/keyif kabulü bu sonuçlardan çıkarılamaz. Bu bölüm gerçek kimlik doğrulama veya rol gizliliği sağlamayan tek cihazlık provadır. Önceki geniş adayın 420 testlik sonucu bu dar GitHub değişikliğinin test toplamı değildir.

CI sonucu yalnız ilgili yeni commit'in GitHub Actions çalışmaları tamamlandığında doğrulanabilir. Bu belge yerel kaynak doğrulamasını kaydeder; gelecekteki CI veya canlı yayın başarısını iddia etmez.
