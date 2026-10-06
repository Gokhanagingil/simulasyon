# Uygulama temeli

## Tasarım kararı

İlk sürüm küçük bir Node.js HTTP sunucusu, native SQLite ve tarayıcıda ES modüllerinden oluşur. Frontend derlemesi veya üretim npm bağımlılığı gerektirmez. Sunucu tek doğruluk kaynağıdır; tarayıcı yalnız seçilen atölyenin kimliğini yerel depoda tutar. Parola ve oturum belirteci localStorage'a yazılmaz.

Harita özgün SVG çizimidir. Bölge kimlikleri içerik dosyasına karşılık gelir; seçili alan ve durumlar veriden üretilir. Mouse, dokunma, Enter ve Space ile seçim; dar ekranda yatay kaydırma ve liste alternatifi vardır.

## API

Tüm yazma istekleri JSON gövdesi kullanır. Giriş dışında API kimlik doğrulaması ister. Hatalar `{ "error": "Türkçe açıklama" }` biçimindedir.

| Yöntem ve adres                          | Erişim       | Amaç                                 |
| ---------------------------------------- | ------------ | ------------------------------------ |
| `POST /api/auth/login`                   | Herkes       | Kullanıcı adı ve parola ile oturum   |
| `POST /api/auth/logout`                  | Giriş yapmış | Oturumu sonlandır                    |
| `GET /api/me`                            | Giriş yapmış | Profil ve erişilebilir atölyeler     |
| `PATCH /api/me`                          | Giriş yapmış | Görünen adı güncelle                 |
| `POST /api/password`                     | Giriş yapmış | Mevcut parolayla yeni parola belirle |
| `POST /api/workshops`                    | Eğitmen      | Atölye oluştur                       |
| `GET /api/workshops/:id/state`           | Üye/eğitmen  | Role göre filtrelenmiş ortak durum   |
| `PUT /api/workshops/:id/note`            | Üye/eğitmen  | Kendi kişisel notu                   |
| `POST /api/workshops/:id/members`        | Eğitmen      | Hesap oluştur ve rol ata             |
| `PATCH /api/workshops/:id/members/:user` | Eğitmen      | Rol değiştir                         |
| `POST /api/workshops/:id/clock`          | Eğitmen      | `start`, `pause`, `phase`            |
| `PATCH /api/workshops/:id/zones/:zone`   | Eğitmen      | Durum ve ortak not                   |
| `POST /api/workshops/:id/announcements`  | Eğitmen      | Tüm ekibe veya bir role duyuru       |
| `GET /health`                            | Herkes       | Süreç sağlık kontrolü                |

`state` yanıtı kullanıcı, atölye, mevcut bölüm, harita bölgeleri, rol kartları, katılımcılar, duyurular ve kendi notunu içerir. Eğitmen ayrıca işlem geçmişini görür. Katılımcının diğer rollere ait `briefing`, `authority`, `steps`, `output` alanları yanıt oluşturulurken çıkarılır. Sunucu yetki kontrolü UI'dan bağımsızdır.

## Veri ve süre

`users` uygulama genelindeki hesapları, `memberships` hesap-atölye-rol bağını tutar. `zone_states`, `announcements`, `notes` ve `activity` atölye kimliğiyle ayrılır. `notes` ayrıca kullanıcı kimliğiyle ayrılır.

Oturum saati `elapsed + (now - started_at)` olarak sunucuda hesaplanır. Duraklatma geçen süreyi kaydeder. Bölüme geçiş önceki bölümlerin süre toplamına gider ve duraklar. 240 dakika sonunda saat tamamlanır. Tarayıcı gösterimi sunucu yanıtları arasında saniyede bir ilerler; bağlantı kesilince son doğrulanmış süreye dayanır. Tarayıcı saati oturum durumunu değiştiremez.

Senaryo sunucu başlarken yüklenir; içerik sürümü bütün aktif atölyeler için ortaktır. Saat şu anda dört saatlik eğitim tasarımına bağlıdır. Kullanıcı oluşturma ve içerik düzenleme işlemleri düşük hacimli toplantı odası kullanımı içindir; yüksek ölçek için asenkron parola özetleme ve ayrı veritabanı servisi değerlendirilebilir.

## Bir sonraki geliştirme için sınırlar

1. **Olay dağıtımı:** `events` içeriğini doğrulayacak şema, atölyeye ait dağıtım kayıtları, rol bazlı erişim ve eğitmenin gönder/geri al akışı eklenmeli. Şu anda boş dizi otomatik işlenmez.
2. **GRC kayıtları:** risk, kontrol, kanıt, uygunsuzluk ve iyileştirme ayrı nesneler olmalı; olay kartı metniyle veya bölge notuyla aynı kayıt sayılmamalı.
3. **Eğitim paketleri:** paket kataloğu ve atölye oluştururken paket seçimi eklenmeli; eğitim başladıktan sonra içerik sürümü atölyede dondurulmalı.
4. **Niles:** kimlikler ve yönlendirmeler bir adaptörde tutulmalı. Mavi Vadi'ye özel harita ve rol akışı, Niles API sözleşmesine bağlanmamalı. Mevcut sürümde dış servise istek yoktur.
5. **Tekrar kullanım:** mevcut hesabı yeni atölyeye ekleme, eğitmen parola sıfırlama ve arşivleme eklenebilir. Şimdiki kullanıcı oluşturma akışı yeni hesap içindir.

Bu ayrım olay kartları değiştiğinde giriş, harita, kullanıcı menüsü ve rol görünümünün yeniden tasarlanmasını gerektirmez. Yeni süreç modülleri yine kendi API ve davranış geliştirmesini gerektirir.
