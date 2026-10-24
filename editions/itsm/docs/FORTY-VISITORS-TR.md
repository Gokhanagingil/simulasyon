# Kırk Kişilik Söz · ayrı oynanabilir bölüm

24 Ekim 2026. Önceki pilot ve GRC değiştirilmeden eklenen tek cihazlık yerel simülasyon.

## Başlangıç

- Doğrudan açılan tek dosya: `delivery/forty/Mavi_Vadi_Kirk_Kisilik_Soz.html`.
- Kaynak uygulamada ayrı giriş: `/forty-visitors.html`.
- Yeniden üretmek için: `node scripts/build-forty-episode.mjs`.
- Bu bölüm mevcut pilotun oturum, hesap, veritabanı veya saatini kullanmaz. Eski çevrimdışı prova dosyası korunmuştur.

## Oyun

12 dakika oyun ve ardından 3 dakika değerlendirme. İlk 40 kişinin T10–T12 Mümtaz gözlemi sözü var; sonraki 80 kişiye ek atölye henüz taahhüt edilmedi. 20 kredi, bir ortak teknisyen ve rol bazında farklı bilgiler var. Rol zarfını açın; bilgiyi ekibe taşıyın, karar verin ve gerçekten değişen saha/ziyaretçi sonuçlarını izleyin.

Saat T0’dan başlar. T3 yalnız örnek bir erken planın başlangıcıdır; daha erken hazır olan ekip yapay biçimde bekletilmez. Süreyi +15 sn, +30 sn veya +1 dk ilerletebilirsiniz. Bir işi sıraya koymak harcama değildir; gerçek başlama anında kredi düşer. Başlamış işin iptalinde iade yoktur. Geç başlangıç, işin gerçek bitişini ileri taşır.

Sonraki 80 kişinin mevcut programı korunur. Ek atölyenin 10 kredisi yalnız gelecek planı için kaynak ayrılmasıdır; 80 kişi bu bölümde etkinliği deneyimlemiş sayılmaz. Gelecek atölye için verilmiş bir T12 teslim tarihi yoktur; bu bölümde gözlenmeyen gelecek hizmet otomatik ihlal sayılmaz.

Zamanı erkene çekmek, farklı Korsan içeriğine geçmek, sponsor duyurusunun saatini taşımak ve ek kapsam kabulü ayrı müşteri kararlarıdır. Korsan Mümtaz içeriğine eşdeğer değildir. Mümtaz sözü korunarak Korsan ek deneyim olarak da kullanılabilir. İstek, kabul edilmiş söz ve teslimat ayrı izlenir.

İş hazırlığı, bağımsız onay, 30 saniyelik saha teyidi, iki dakikalık kesintisiz gözlem, ziyaretçi kabulü ve öğretmen kabulü birbirine karıştırılmaz. T12’de biten gözlemin açık kabulleri, oyun sonu duraklatılmış değerlendirme aşamasında kaydedilebilir.

## Sade başlangıç ve yerel sesli rehber

Başlangıç kurgusu, ilk iş, beş kural ve ortak rol görevleri aynı sürümlü [eğitim kaynağından](TRAINING-CONTRACT-TR.md) gelir. İsteğe bağlı Türkçe cihaz sesi bu metni okuyabilir; metin her zaman kullanılabilir. Bu deterministik rehber canlı AI değildir, mikrofon veya harici sağlayıcı kullanmaz. [Ses ve devralma kontrolleri](NARRATOR-INTEGRATION-TR.md).

## Saat ve yardım pencereleri

- Rol zarflarının açılması saati durdurmaz.
- Karar, yardım ve görsel başvuru penceresi açıkken saat otomatik durur; pencere kapanınca önceki durumuna döner.
- Sekme görünmez olduğunda saat durur; kullanıcı açıkça sürdürür.
- Oyun sonunda saat değerlendirme öncesi otomatik durur. Değerlendirme saati ayrıca başlatılır.
- Duraklatılan saatte karar alınabilir; iş süreleri zaman ilerlemeden tamamlanmaz.
- Tek tıklık “7 Yol Gösterici İlke” ve “Sürekli İyileştirme” görsel başvuruları oyundan çıkmadan açılır.

## Refah ve güvenlik

Bu kurgusal eğitimdir; gerçek hayvan bakımı talimatı değildir. Hayvanı hareket etmeye veya poz vermeye zorlama yoktur. Refah, yetkin bakım ve güvenlik krediyle satın alınamaz. Bağımlılık kaybı veya refah durdurması gözlemi keser; eski saha teyidi yeniden kullanılamaz. Nitelikli izin ve yeni saha teyidi gerekir.

## Sınırlar

Bu sürüm tek cihazda rol değiştirilerek oynanır. Aynı ekranı paylaşan ekip kullanabilir, ancak gerçek çok kullanıcılı oturum, kimlik doğrulama, özel rol mesajlaşması veya güvenli bilgi izolasyonu sağlamaz. Bir rol değişince önceki zarf kapanır, ancak aynı cihazdaki başka rolü açabilmek kasıtlı bir prova özelliğidir.

Yalnız açık sekmenin belleği kullanılır. Sayfayı yenilemek veya kapatmak ilerlemeyi kaybettirir. İstenirse karar kaydı JSON indirilir. Ağ isteği, gerçek hesap, Niles, ödeme, lisans veya uzaktan kalıcı kayıt yoktur. Çıktı insan öğrenmesi, çalışan performansı veya katılımcı keyfi puanı değildir.

## Kaynak bileşenler

- `public/forty-engine.js`: saf, deterministik durum makinesi; süre, kaynak, rol, onay, güvenlik ve kabul kapıları.
- `public/forty-ui.js`: resimli operasyon alanı, rol zarfları, zaman/kaynak tahtası, karar akışı ve sonuç değerlendirmesi.
- `public/forty-visitors.html` ve `.css`: ayrı, duyarlı giriş ve görsel tasarım.
- `public/teaching-panels.js`: önceki uygulamadaki ortak öğrenme başvuru içeriği, değiştirilmeden yeniden kullanılır.
- `scripts/build-forty-episode.mjs`: bağımsız, harici bağımlılığı olmayan HTML üretimi ve SHA-256 manifesti.
- `test/forty-engine.test.js`: normal/erken/alternatif/birleşik akış, zaman, rol, kaynak, refah, tekrar ve kabul sınırları.

Tekrarlanabilir komutlar ve bu PR kaynağının doğrulama sınırları `docs/FORTY-GITHUB-VALIDATION.md` içindedir. Ham geliştirme günlükleri veya özel operasyon kayıtları depoya alınmamıştır. Tarayıcı çalıştırma veya görsel kontrol gerçekleştirilemediyse bu sınır ayrıca belirtilmelidir; kaynak/VM testleri görsel tarayıcı kabulünün yerine geçmez.

## Kaynak yedeği

Tam kaynak ZIP’i Site kimliklerini, Git geçmişini, kurulu node_modules dizinini, derleme önbelleğini, çalışma veritabanlarını ve ortam sırlarını içermez. Yerel Node sunucusu ve tek dosya üretimi için Site kaydı gerekmez. Sites üzerinde yeniden yayın hazırlanacaksa platformun resmi proje kurulumuyla yeni kimlik yapılandırılmalıdır.

Güncel ayrıntılı kabul kaydı: [GitHub kaynağının doğrulaması](FORTY-GITHUB-VALIDATION.md). Sentetik rol tekrarları: `npm run replay:forty`. Bağımsız taşınabilir testler: `npm run test:forty:independent`.
