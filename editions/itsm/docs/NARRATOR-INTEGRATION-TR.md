# Kırk Kişilik Söz: yerel sesli rehber

Bu rehber ayrı bir kontrol demosu değil, 12 dakikalık oyunun parçasıdır. Ortak görev metinlerini deterministik olarak seçer. Canlı AI değildir; katılımcı konuşmasını anlamaz, mikrofon veya harici sağlayıcı kullanmaz.

## Kullanım

- Açılış, Rolümü anlat, Koşullar veya 5 kısa kural seçilir. Metin her zaman görünür; sekiz rol birden değil, yalnız seçili rolün ortak görevi anlatılır.
- Tarayıcı yerel Türkçe ses sunuyorsa Cihaz sesini aç ile etkinleştirilir. Uygun yerel ses yoksa metinle devam edilir. Uzak ses hizmeti sessizce seçilmez.
- Sustur sesi ve kuyruğu keser. Ben devralıyorum anlatımı insana bırakır. Rehbere dön eski cümleyi otomatik başlatmaz; yeni seçim gerekir. Tekrar yalnız hâlâ geçerli son ortak metni okur.
- Rehber düğmeleri oyun saatini değiştirmez. Oyun saati ayrı Başlat/Duraklat kontrolündedir.

## Kesinti ve tekrar sınırları

Sıradan saat tiki yeni motor olayı üretmiyorsa mevcut anlatım sürer. Gerçek karar/olay, rol değişimi, oyun molası, refah durdurması, bölüm bitişi veya yeni prova eski anlatımı keser. Pencere açılması anlatımı keser; kapatmak yeniden başlatmaz. Sekme gizlenince anlatım durur; dönünce açıkça sürdürülür. Yeni prova ses tercihini kapatır ve eski tekrar metnini temizler.

Anlatıcı yalnız prova/rol/aşama/duraklama/refah ve gerçek motor olayının revizyonunu alır. Özel zarf, kullanıcı notu veya tüm oyun durumu aktarılmaz. Harici model, API anahtarı, abonelik ve ağ isteği yoktur. Mevcut pilotun hesap ve parola işlemleri değişmez.

## Doğrulama sınırı

Modül ve üretilmiş tek HTML üzerinde DOM/VM kontrolleri vardır. Gerçek cihazda Türkçe sesin bulunması, duyulması, doğallığı, fiziksel kesme gecikmesi ve görsel/klavye erişilebilirliği ayrıca denenmelidir. Testler insanlı eğitim kabulü veya gerçek tarayıcıda işitilmiş ses kanıtı değildir. Ayrıntılı sonuçlar: [GitHub doğrulaması](FORTY-GITHUB-VALIDATION.md).
