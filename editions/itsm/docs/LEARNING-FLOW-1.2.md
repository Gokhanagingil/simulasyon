# ITSM 1.2.0 — uygulama ve eğitmen kılavuzu için doğrulanacak gerçekler

Bu belge son kullanıcı eğitmen kılavuzu değildir. Kılavuz, bağımsız kabul ve yayın sonrası bu gerçeklerden hazırlanmalıdır.

## Paket / geçiş
- Yalnız ITSM. `learningModel:1`, açık `releaseBundles` ve `learningAcceptance` eşlemesi atölye senaryo kopyasında saklanır.
- Eski atölyeler yeni varsayılan paketi kendiliğinden almaz. Önceki puan, karar, kaynak ve SLA tarihi korunur. Yeni akış için yeni atölye açılır.
- Gönderilmiş kartlar, başlamış oturumun model/demet eşlemesi değiştirilemez. Özel paketler açık demet eşlemesiyle çalışır; E02 adı tek başına yeni demeti açmaz.

## Akış ve saat
- E02/E09/E10 aynı T+32 demetidir. Üç karttan herhangi birinin normal gönder düğmesi üçünü tek atomik işlemde açar. Tekrar gönderim önceki başlangıcı veya hedefi sıfırlamaz.
- İç ön koşullar demetle birlikte sağlanır; dış ön koşul eksikse hiçbiri açılmaz. Geçersiz ve kilitleyen demetler paket doğrulamada reddedilir.
- Kart saatleri tavsiye, otomatik tetikleyici değildir. Eğitmen yeni demeti göndermeden kısa rol açıklamasını bitirir.
- Atölye saati = gündem; baskı saati = kaynak işleri/tekrar (1×/3×/6×); SLA = daima gerçek 1× dakika, durmaz.
- E04 kasıtlı gerçek SLA aşımı öğretimidir; kişisel başarısızlık sayılmaz. Oturum/login beklemesi insan katılım ölçümü değildir.

## Sorumluluk ve bilgi akışı
- R5: kaydedilmiş olay notu/önerisi/sonuç kanıtından başlık, uygulanma koşulu, adımlar/kontrol ve sınır/geri dönüş taslağı.
- R8: bağımsız kaynak/kapsam/sınır incelemesi; yayına uygun veya gerekçeli düzeltme. Yazar rol değiştirse bile kendi makalesini inceleyemez.
- R5: onaylı sürümü yayımlar. R2/R3/R7: başka gönderilmiş olayda kendi çalışma notunu kaydeder; yayımlı sürümü seçerek gözlenen sonuçla ilişkilendirir.
- Yeniden kullanım sonucu: işe yaradı / işe yaramadı / koşullara uygun değildi. Son iki sonuç da dürüst öğrenme kanıtıdır; otomatik hizmet kabulü değildir.
- Taslak düzeltilebilir; incelemedeki/onaylı/yayımlı içerik yerinde değiştirilemez. Yayımlı veya emekli son sürümden yeni sürüm üretilir. Aynı makalede tek bekleyen sürüm vardır.
- v2 incelemedeyken v1 hâlâ yayımlıdır. v2 yayımlanınca v1 emekli olur. Geçmiş kullanım v1 kimliği, başlığı, gözlemi ve sonucu ile korunur; emekli sürümle yeni kullanım engellenir.
- Yazar gerekçeyle yayımlı sürümü emekli edebilir. Bu işlem makaleyi/sürümü veya kullanım geçmişini silmez.
- R4 kendi bütçe/onay/saha kabulünü vermez; ek bilgi işleri R5/R8/yeniden kullanan role aittir.

## Öğrenme kanıtı ve kapanış
- R8 başlangıç/ara/son noktalarda ölçüt, kaynak, pencere ve gözlemini yazar. Sunucu gerçek açık/kabul/SLA aşım sayılarını o anda ekler; kullanıcı bunları geriye dönük düzenleyemez.
- Yeni aktarım örneği: iki entegrasyon sunucusu ortak DNS’e bağlı; API yeşilken müşteri siparişi tamamlanmıyor.
- Her katılımcı ortak bağımlılık, yetkili risk kararı ve uçtan uca hizmet kabulünü açıklayabilir. Eğitmen her ölçüt için “gözlendi” veya “pratik gerekli” ve gerekçe kaydeder. Otomatik başarı puanı yoktur.
- E08 kapanışı: bağımsız incelenmiş ve yayımlanmış en az bir sürüm + farklı rolde kaydedilmiş kullanım gözlemi. Daha sonra tüm sürümler emekli edilse de geçmişteki geçerli inceleme/kullanım bu tarihsel öğrenme kabulüne yeter; yeni kullanım yine yasaktır.
- E12 kapanışı: R8 başlangıç ve son gözlemi + eğitmenin değerlendirdiği en az bir aktarım yanıtı. “Pratik gerekli” dürüst bir sonuçtur; finali engellemez.
- Bilgi eylemleri kayıt kapatmaz, CMDB değiştirmez, bütçe harcamaz, değişiklik onayı veya saha teyidi vermez.
- Senaryo kabul puanı, güncel hizmet uygunluğu, bilgi kullanım kanıtı ve aktarım gözlemi ayrı gösterilir. İnsan keyfi/psikolojisi ölçülmüş gibi raporlanmaz.
- JSON hikâye/kanıt dışa aktarımı `learning` altında sürüm, inceleme, tarihsel kullanım, ölçüm, aktarım ve işlem geçmişini içerir. Kayıt CSV’si kayıt listesidir; öğrenme ayrıntılarının yerine geçmez.

## Hata / tekrar yolları
- Formun metin ve seçim taslağı bu tarayıcı sekmesinde kullanıcı/atölye/işlem bazında korunur; kapatıp yeniden açınca geri gelir, başarılı kayıttan sonra temizlenir. Form açıldığı andaki kaynak revizyonu saklanır. Başka karar önce kaydedilirse eskimiş gönderim 409 verir; güncel durumu okuyup formu tekrar açın.
- Aynı işlem kimliği aynı içerikle tekrar edilirse tek işlem; farklı içerikle tekrar reddedilir.
- Kaynak listesi boşsa ilgili olayda önce çalışma notu kaydedilir. Yeniden kullanım kaynağı farklı olayda kullanıcının kendi notu olmalıdır.
- Eksik veya yetkisiz kanıt, yazarın kendi incelemesi, emekli bilgi kullanımı ve eski ekrandan karar sunucuda reddedilir.

## Doğrulama sınırı
Yerel izole testler gerçek katılımcı eğitimi değildir. Canlı yayımlanan sürümün tarayıcı testi ve sekiz gerçek kişinin insan pilotu ayrıca belirtilmelidir. Niles doğrulanmadı; GRC ve paylaşım ayarı kapsam dışı kaldı.
