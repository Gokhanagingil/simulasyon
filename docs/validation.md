# İlk sürüm doğrulaması

6 Ekim 2026 · Node.js 24.19.0 · Chromium 153 / Playwright 1.62.1

## Otomatik API kontrolleri

`npm run check` ve `npm test` başarılı. Dokuz entegrasyon testi gerçek HTTP istekleri ve geçici SQLite dosyaları kullanır. Kapsam: giriş/çıkış, özel rol bilgileri, eğitmen yetkileri, atölye ayrımı, role özel duyuru, özel not, rol değişimi, yeniden başlatmada kalıcılık, saat/bölüm yönetimi, parola değişimi, hatalı girdiler ve farklı origin kaynaklı yazma istekleri.

## Tarayıcıda doğrulanan akışlar

- Hatalı giriş, parola göster/gizle, doğru giriş ve çıkış.
- Eğitmenin form üzerinden kullanıcı oluşturması, rol seçmesi, ekipte araması ve rolü değiştirmesi.
- Haritada klavyeyle bölge seçme, bölge durumunu ve notunu güncelleme.
- Ayrı tarayıcı oturumundaki katılımcının ortak durumu ve role özel duyuruyu alması.
- Kendi özel rol kartını görme; diğer rolün yalnız ortak bilgilerini görme.
- Kişisel notu kaydetme ve sayfa yenilemesinde koruma.
- Saati başlatma/duraklatma ve onayla bölüme geçiş.
- Yeni atölyede ekibin boş başlaması; eski katılımcının yeni atölyeyi görememesi.
- Profil adını değiştirme.
- 1440 px masaüstü, 768 px tablet, 390 ve 360 px telefon genişlikleri; beş katılımcı sayfasında yatay sayfa taşması kontrolü.
- Mobil menü, klavye odağının menüde tutulması, Escape ile kapanma ve bölge listesi.
- Sayfa değiştirmede başa dönme; diyalog kapanınca içeriğinin temizlenmesi.

Bu akışlarda yakalanmamış JavaScript hatası görülmedi. Tarayıcı kontrolü geçici test hesaplarıyla yapıldı; test parolaları ve veritabanı repoda yoktur. Ekran görüntüleri aynı uygulamanın kurgusal örnek atölyesinden alınmıştır.

Docker dosyası hazırlanmıştır; bu ortamda imaj derleme/çalıştırma doğrulaması yapılmamıştır. İnternete açık dağıtım, gerçek cihaz ağı, yük testi ve Niles bağlantısı bu doğrulamanın kapsamında değildir.
