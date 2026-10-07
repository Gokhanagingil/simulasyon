# İlk sürüm doğrulaması

## 7 Ekim 2026 — devam çalışması

GitHub PR #1 kaynakları `9927a74` üzerinden yeniden alındı. `npm run check`, dokuz HTTP/SQLite testi ve beş otomatik Chromium testi başarılı. Tarayıcı ortamı: Node.js 24.19.0, Playwright 1.62.1, Chromium 153.0.8010.0.

Yeni tarayıcı testleri `test/browser.test.mjs` içinde tekrar çalıştırılabilir. Şu sorunlar giderildi ve bu akışlarda doğrulandı:

- Rol değişirken kişisel not taslağının silinmesi ve yazı alanı odaktayken önceki rol kartının ekranda kalması.
- Kaydetme isteği sürerken yazılan yeni metnin kaybolması.
- Kaydetmeden önce başlayan bir durum sorgusunun yeni notu eski değerle değiştirmesi.
- Kullanıcı yazı yazarken bağlantı kaybı/geri gelmesi bilgisinin görünmemesi.
- Mobil menüde zaten açık sayfa seçildiğinde menünün kapanmaması; Escape sonrası klavye odağı.
- Liste görünümünde seçilen bölgenin telefonda haritanın görünür kısmının dışında kalması.

Ayrı eğitmen ve katılımcı oturumlarında formdan kullanıcı oluşturma, hatalı/doğru giriş, not kaydetme ve yenileme, klavyeyle harita seçimi, bölge durumu paylaşımı, saati başlatma/duraklatma doğrulandı. Altı eğitmen sayfası 1440, 768, 390 ve 360 px genişliklerde kontrol edildi; yatay sayfa taşması ve yakalanmamış JavaScript hatası görülmedi. Bu ölçüler tarayıcı viewport kontrolüdür; fiziksel Android/iOS cihaz testi değildir.

Güncel ekran görüntüleri `docs/verified-desktop.png` ve `docs/verified-mobile.png` içindedir. İlk kurulumun boş ekibini gösterirler. Önceki `preview-*` görselleri kurgusal dolu atölye örneklerini korur.

Dağıtım sınırı değişmedi: internete açık bir sunucu kurulmadı, Docker çalıştırılmadı. GRC olay dağıtımı/puanlama ve ITIL paketi henüz bu sürümün parçası değildir.

## Önceki doğrulama

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
