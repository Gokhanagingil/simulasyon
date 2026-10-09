# ITSM UX düzeltmeleri — 9 Ekim 2026

Kapsam yalnız ITSM arayüzü. Sunucu rol, bağımsız inceleme, kaynak kanıt, CAS ve tarihsel oturum kuralları değiştirilmedi. GRC, Niles ve erişim/paylaşım ayarları değişmedi.

| Bulgu / iş | Uygulama | Kanıt / kalan sınır |
|---|---|---|
| UX01 / 1 çatışma | 409 sonrası taslak yerinde kalır; “Güncel durumu yükle ve taslağı koru” son revizyonu yükler. Otomatik yeniden gönderim yok. Plan modalları da açılış revizyonunu taşır. | Birim + bağımsız runtime testleri; güncel gerçek hesapla tarayıcı tekrarı ayrıca gerekir. |
| UX02 / 2 yenileme | Aktif düzenlenen yönetim formlarının DOM'u 5 sn yenilemede değiştirilmez; durum güncellendi duyurulur. Diğer formlarda alan, seçim, odak/aralık ve kaydırma korunur. | Birim test; kimlik bilgileri sekme depolamasına yazılmaz. |
| UX03 / 3 taslak | Plan, hayvan kabulü/yeniden teyit, eğitmen değerlendirmesi, bilgi ve Niles referansına hesap+atölye+işlem+hedef ayrımlı yerel taslak. Başarıda silinir; açık silme düğmesi var. | 200 karakter ve seçenek geri yükleme testi; parola/hidden/file hariç. |
| UX04 / 4 sıradaki iş | Üstte “Senden beklenen”, yetkili ilk üç kayıt; kuyrukta “Benim yapabileceklerim”; rol kartı açılır ayrıntı; laboratuvarlarda pasif düğmeye özel koşul/rol açıklaması. | Mevcut ortak paneller korunur. Tüm panel ayrıntılarını role göre yeniden tasarlama yapılmadı. |
| UX05 / 5 nötr karar | Eğitmen sonucu, R8 incelemesi, kullanım sonucu, aktarım değerlendirmesi boş zorunlu seçimle başlar. | UI ve server testleri; olumlu varsayılan yok. |
| UX11 / 6 kontrast | Atlama bağlantısı, yardımcı metin, etiket, soluk metin ve sarı durum paleti koyulaştırıldı. | Kaynak sRGB testi; son canlı ölçümler ayrı raporlanır. |
| UX12 / 7 giriş | Katılımcı formu DOM'da haritadan önce; eğitmen ayrı ikincil bölüm; parola görünürlük denetimi ve hesap yardım metni. | Canlı görünürlük ölçümü yayın sonrası yapılır. |
| UX13 / 8 taşma | Harita ortak marj/min-height sıfırlama; SVG oranını izleyen kapsayıcı; responsive kutu ölçüleri. | Yerel Chromium IPC engeli nedeniyle fixture reflow testi çalıştırılamadı; opt-in test eklendi. Canlı kontrol ayrı. |
| UX06 / 9 kanıt | Kendi kayıtlı notundan doğrudan sonuç sunma; yetkili kanıttan bilgi taslağı veya kullanım başlangıcı. Yeni kullanım yorumu ayrı; sunucu farklı rol/olay/gerçek kaynak kapıları korunur. | Kaynak bağlamı taslak anahtarına dahil; değiştirilmiş kaynak otomatik taşınmaz. |
| UX10 / 10 geri bildirim | Bilgi eylemine özel gönderim adları, kalıcı işlem/form hataları, metin uzunluğu yardımı, kaydetmede çift gönderim kilidi. | Bazı mevcut basit yönetim düğmeleri “Oluştur/Ekle” etiketlerini korur. |
| UX07 / 11 aktarım | Kendi aktarımı olan kişi boş forma değil “Yanıtımı gör” salt okunur görünümüne gider. | UI + sunucu tek yanıt testi. |
| UX08 / 12 eğitmen | Üstte rol eksikleri, başlangıç ölçümü, sonraki kart/demet, bekleyen kabuller, başlat/duraklat ve üç saat sözlüğü. | Hız denetimi ilgili laboratuvarda korunur; tek şeride tüm kontroller taşınmadı. |
| UX09 / 13 arama/bağlar | Bilgi arama/durum/olay filtresi, tam kaynak önizlemesi ve kayıt bağlantısı; CI/hizmet araması, bağlı kayıtlar, kayıttan CI görünümüne geçiş; karar günlüğü metin araması. | Aktör/olay/proses için ayrı üç seçici yerine birleşik arama var. |
| UX14 / 14 kimlik/yazı | Mobil üstte kişi/rol kimliği, büyütülmüş yardım/etiketler, görünür bağlantı durumu. | Gerçek telefon/ekran okuyucu testi henüz yapılmadı. |
| 15 stüdyo/gün sonu | Temel başlık/zaman/süreç alanları önde; gelişmiş ilişkiler ayrı details; kopyalanmış alanlar ve gönderilmiş kart kilidi açıklanır. Gün sonuna kısa okunabilir özet ve CSV/JSON kapsam ayrımı eklendi. | Tam yapılandırılmış JSON ilişki editörü kapsam dışı bırakıldı; mevcut paket doğrulaması korunur. |
| 16 görsel anlatım | Mevcut yetişkin yeşil palet ve hayvan/hizmet sahneleri korunur; hareket azaltmada sonuç metni kalır; giriş haritasının geometrisi ve dar görünüm yerleşimi sadeleştirildi. | Eğlenme, hatırlama ve “wow” etkisi insan pilotunda ölçülmelidir. Yeni animasyon kütüphanesi eklenmedi. |

## Geçiş etiketleri — eğitmen kılavuzu için

- Operasyon masası → Senden beklenen / Eğitmen kontrol şeridi
- Vardiya kartım ve ilk adımlar (tekrar açılabilir)
- Benim yapabileceklerim
- Güncel durumu yükle ve taslağı koru; yeniden gönderim bilinçli ayrı eylem
- Taslağı sil
- Bu nottan sonuç sun
- Bu kanıttan bilgi taslağı; Bu kanıtla sına
- İlişki ve bağlı kayıtları gör
- Yanıtımı gör
- Gelişmiş ilişkiler ve görsel davranış

## Kabul sınırı

Teknik testlerin geçmesi gerçek katılımcı öğrenmesi veya memnuniyeti değildir. Canlı giriş görünümü, oturum içi gerçek hesap QA, ekran okuyucu ve insan pilotu birbirinden ayrı kanıt sınıflarıdır. Kimlik doğrulama beklemeleri eğitim performansı sayılmaz.
