# Niles staging — gerçek SLA kabulü

Durum: giriş oturumu gerekli; hiçbir alan, kullanıcı, kayıt veya SLA oluşturulduğu iddia edilmiyor.

## Kurulum girdileri

`content/niles-itsm-setup.json` başlangıç planıdır. Eğitimde kullanılacak son paket Senaryo stüdyosundan indirilmeli ve SLA/hedef farkları kontrol edilmelidir. Üretim ortamında işlem yapılmaz.

- Ayrı MAVI-VADI-ITSM eğitim alanı/tenant; mevcut UAT verilerine dokunulmaz.
- Rol bazlı eğitim kullanıcıları: hizmet sahibi, hizmet masası, saha, teknik, problem/bilgi, değişiklik, tedarikçi, hizmet seviyesi.
- Dört hizmet ve on CI; bağımlılıklar gerçek kayıtlarla bağlanır.
- P1: ilk müdahale 2 dk, çözüm 8 dk. P2: 4/12 dk. P3: 6/18 dk. Takvim 24×7; bu eğitimde duraklatma yok.

## Kabul sırası

1. Eğitim alanının kimliğini, staging olduğunu ve veri ayrımını doğrula.
2. Niles üzerinde P2 incident aç. Gerçek kayıt numarası, oluşturulma zamanı ve bağlanan SLA politika kimliğini kaydet.
3. İlk müdahaleyi 4 dakika içinde gerçekleştir. Niles'ın kendi ilk müdahale alanını doğrula.
4. Kayıt çözümsüzken 12 gerçek dakikanın geçmesini bekle. Uygulama saatini hızlandırma; veritabanında hedef tarihini değiştirme; aşım alanına elle değer yazma.
5. Niles'ın resmi SLA durumundan aşımı ve hedef zamanını kanıtla. Yalnız ekrandaki yerel geri sayım yeterli değildir.
6. Kaydı gerçek iş akışıyla çöz; aşım geçmişinin kaldığını ve raporla tutarlı olduğunu doğrula.
7. Varsa API/senkronizasyon için Niles'ın desteklediği sözleşmeyi ve asgari erişimli bağlantıyı kullan. Eğitmen parolasını simülasyon tarayıcısına veya kaynak koduna koyma.

## Kanıt tablosu

| Girdi | Değer |
|---|---|
| Niles tenant/domain kimliği | Bekliyor |
| Kayıt numarası ve bağlantısı | Bekliyor |
| SLA politika kimliği | Bekliyor |
| Oluşturulma / yanıt / hedef zamanları | Bekliyor |
| Resmi aşım alanı ve gözlem zamanı | Bekliyor |
| Çözüm sonrası aşım korundu | Bekliyor |
| Canlı senkronizasyon | Kurulmadı |

Yerel otomatik testlerde zaman alanlarının kontrollü değiştirilmesi yalnız motor mantığını test eder; bu tablonun kabul kanıtı olarak kullanılamaz.
