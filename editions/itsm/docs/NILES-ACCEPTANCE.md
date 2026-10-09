# Niles staging — model, katalog ve gerçek SLA kabulü

Bu belge canlı durum raporu değil, yeniden kullanılabilir kabul planıdır. Kaynak manifestindeki `source_template_only` / `liveVerified: false` değerleri Niles’ta kayıt bulunmadığı anlamına gelmez; canlı uygulama ve kanıt bu dosyadan ayrı doğrulanır.

## Kurulum girdileri

`content/niles-itsm-setup.json`, varsayılan `itsm-v1` sürüm 1.2.0 ile eşleşen başlangıç planıdır. Eğitimde kullanılacak son paket Senaryo stüdyosundan indirilmeli ve SLA/hedef farkları kontrol edilmelidir. Üretim ortamında işlem yapılmaz.

- Ayrı MAVI-VADI-ITSM eğitim alanı/tenant; mevcut UAT verilerine dokunulmaz.
- Rol bazlı eğitim kullanıcıları: hizmet sahibi, hizmet masası, saha, teknik, problem/bilgi, değişiklik, tedarikçi, hizmet seviyesi.
- Hedef model: beş hizmet, on beş CI, 17 hizmet-CI üyeliği, 13 yönlü CI bağımlılığı ve SVC-OBS → SVC-WATER hizmet bağımlılığı. Son hizmet-hizmet bağımlılığı Niles’ta aşağıdaki sınır nedeniyle şu anda yalnız açıklama olarak temsil edilir.
- Kullanıcı listesi yalnız rol eşleme şablonudur; oluşturulmuş hesap veya verilmiş yetki kanıtı değildir. Kalıcı erişim değişiklikleri ayrıca yetkilendirilir.
- P1: ilk müdahale 2 dk, çözüm 8 dk. P2: 4/12 dk. P3: 6/18 dk. Takvim 24×7; bu eğitimde duraklatma yok.

## 9 Ekim 2026 canlı inceleme sınırları

Simülasyon domainindeki inceleme, 5 ITSM hizmeti ve bunlardan ayrı 5 CMDB service-class kaydı, 15 Test CI, 17 hizmet-CI bağlantısı ve 13 aktif yönlü CI bağımlılığı bulunduğunu doğruladı. İki hizmet katmanı aynı kayıt gibi sayılmaz; mevcut UUID eşlemeleri korunur. Bu sayılar tek başına uçtan uca entegrasyon kabulü değildir.

- **SVC-OBS → SVC-WATER:** simülasyonun gerçek hedef bağımlılığıdır. İncelenen Niles model/UI’sında hizmet-hizmet yapısal kenarı desteklenmediğinden yalnız açıklamada yer alır. Açıklama metni topoloji kenarı sayılmaz; otomatik etki yayılımı doğrulanmış değildir. Manifestteki `requiresServices` hedef modeli taşır, canlı yapısal destek iddiası değildir.
- **Talep kataloğu:** OBS ve EDU için iki taslak mevcut; incelenen canlı sürümde desteklenen onay arayüzü bulunmadığından yayın bekliyor. Ayrı platform düzeltmesi yürütülüyor. Bu belge düzeltmenin tamamlandığını, taslakların yayınlandığını veya katılımcı görünürlüğünün geçtiğini iddia etmez.
- Kaynak `proposedCatalogOfferings` girdileri yeniden kullanılabilir teklif şablonları olarak kalır; canlı taslak UUID’leri yerine geçmez. KIT yalnız opsiyonel öneridir.
- **Tam Niles entegrasyonu: NOT_VERIFIED.** Yayın/onay, katılımcı görünürlüğü, uçtan uca fulfillment ve gerçek SLA instance kabulü ayrı kanıt gerektirir. Sonraki doğrulamaları tarih ve kayıt referanslarıyla raporla; bu tarihli görünümü sessizce güncel kabul sayma.

## Model ve katalog eşleme

`services`, `cis`, `slaPolicies` kaynak senaryoyla birebir aynıdır. `eventMapping` on iki olayın kayıt türü, hizmet, CI ve öncelik bağını taşır. `test/niles-setup.test.js` her test çalışmasında sapmayı yakalar. Özel Senaryo stüdyosu paketleri için aynı eşleme ayrıca yapılmalıdır; bu dosya onları otomatik karşılamaz.

- `id` alanları kanonik dış kodlardır, Niles UUID’si değildir. Doğru tenant içinde mevcut kod/kimlik ile eşleştir; benzer adları kör birleştirme ve mükerrer oluşturma yapma.
- `services[].cis` hizmet-CI üyeliğidir; `cis[].dependsOn` yönlü CI bağımlılığıdır; `services[].requiresServices` ise hizmet-hizmet bağımlılığıdır. Üç ilişki türünü aynı kayda indirme.
- Başlangıç P1 ve P2 → B1 ortak güç bağımlılığı bilinçli eğitim riskidir. Önceden düzeltme. E07 ile gerçekleşmiş oturum değişikliği ancak onay/uygulama/saha kanıtıyla ayrı işlenir; kaynakta olmayan B2 CI’sı icat edilmez.
- Mümtaz → Elif → sessiz habitat → PA → ağ zinciri korunur. Elif kurgusal bakıcı CI’sıdır, yeni gerçek kullanıcı hesabı gerektirmez. Hayvanların tekil `identity`, `needs`, `services` ve tarihçesi korunur. Başlangıç `changeHistory: []` canlı geçmişi silme talimatı değildir.
- `kind` / `zone` / `owner` alanları Niles’ın doğrulanmış sınıf/bölge/rol alanlarına eşlenir. Desteklenmeyen alanlar açık açıklama/checklist ile gösterilir; var olmayan otomasyon iddia edilmez. Çit → sensör bağı eğitimde güvenli açılış teyididir, fiziksel var olma iddiası değildir.

### Önerilen katalog şablonları

Hizmet kaydı bir talep kataloğu kartı değildir. `proposedCatalogOfferings` bölümü yeni teklif tasarımıdır: canlı seed, yayınlanmış kart veya Niles API sözleşmesi değildir. Şeması canlı platform alanları incelenmeden otomatik gönderilmemelidir.

| Kod | Teklif | Hizmet / CI | Kayıt yolu |
|---|---|---|---|
| MV-CAT-OBS | Sessiz gözlem saati ve ziyaret kapsamı düzenleme | SVC-OBS / CI-HIPPO | E02 request; E09 kapasite görevi ve E10 change aynı talebe bağlanır |
| MV-CAT-EDU | Rehberli eğitim turu / erişilebilir alternatif rota | SVC-EDU / CI-GUIDE | E02 alternatifi ise ikinci request yerine bağlı fulfillment görevi |
| MV-CAT-KIT | Uyumlu pompa parçası / tedarik hazırlığı | SVC-WATER / CI-P2 | Opsiyonel iç teklif; E11 task ve E07 change yerine geçmez |

OBS formunda oturum referansı, mevcut/istenen saat, grup sayısı, gerekçe, istenen kapsam ve alternatif kabulü; tamamlamada bütçe, change, saha testi ve ziyaretçi teyidi aranır. EDU formunda grup, rota, kapasite ve rehber uygunluğu; KIT’te bağlı kayıt, teknik uyumluluk, gerekli tarih ve oyun kredisi sınırı bulunur. Gerçek sağlık/kişisel veri istenmez. 40 kişilik alternatif rota sınırı korunur. Mevcut onaylı tur için kaynakta olmayan zorunlu CAB eklenmez.

R1 kapsam/bütçe, R6 değişiklik onayı, R4 uygulama, R3 saha kabulü, R2 ziyaretçi teyidi ayrılığı korunur. R5 bilgi yazarı/yayınlayıcı, R8 bağımsız inceleyicidir. Tüm rolleri tenant admin yapmak kabul değildir. Kartın admin ekranında bulunması yeterli olmaz: hedef katılımcı görünürlüğü ve yetki dışı işlemler ayrıca test edilir.

### Model ve katalog kabul sırası

1. Önce mevcut staging tenant/domain, filtreler, taslak/aktif/yayın durumu ve katalog kitlesini doğrula. Boş ekranı otomatik olarak eksik veri sayma.
2. Hizmet/CI dış kodlarını mevcut UUID’lerle eşleştir; eksik kayıtları tamamla ve ilişkileri yönleriyle say. Eski HIPPO → P1 bağı yalnız aynı başlangıç modelinde yanlış kaldığı doğrulanınca yeni zincirle düzeltilir; audit geçmişi silinmez.
3. OBS ve EDU tekliflerini platformun desteklediği gerçek form ve fulfillment alanlarıyla eşleştir. Desteklenmeyen koşulları açık görev/checklist olarak belirt.
4. Etiketli bir test talebinde katalog → request → hizmet/CI → görev/change → onay → saha/ziyaretçi teyidi zincirini doğrula; kanıt numaralarını kaydet.
5. Katılımcı görünürlüğünü ve rol ayrımını doğrula. E02/E09/E10 kaynak 1.2.0’da T+32 tek demettir; eski T+137/T+150 sırasını kullanma.

## Gerçek SLA kabul sırası

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
| Niles tenant/domain kimliği | Bu planda kanıtlanmadı |
| Hizmet/CI UUID eşlemesi ve ilişki sayıları | Bu planda kanıtlanmadı |
| Katalog yayın/görünürlük ve test request referansı | Bu planda kanıtlanmadı |
| Kayıt numarası ve bağlantısı | Bu planda kanıtlanmadı |
| SLA politika kimliği | Bu planda kanıtlanmadı |
| Oluşturulma / yanıt / hedef zamanları | Bu planda kanıtlanmadı |
| Resmi aşım alanı ve gözlem zamanı | Bu planda kanıtlanmadı |
| Çözüm sonrası aşım korundu | Bu planda kanıtlanmadı |
| Canlı senkronizasyon | Bu planda kanıtlanmadı |

Yerel otomatik testlerde zaman alanlarının kontrollü değiştirilmesi yalnız motor mantığını test eder; bu tablonun kabul kanıtı olarak kullanılamaz.

SLA politika kaydı, yayınlanmış politika ve incident üzerinde bağlı SLA instance ayrı kanıtlardır. P1/P2/P3 hedefleri otomatik olarak tüm request/problem/change/knowledge/task türlerine genişletilmez; gerçek Niles kapsamı doğrulanır. Simülasyon baskı saati 1/3/6×, Niles’ın gerçek zamanlı SLA saatini hızlandırmaz. Bilerek üretilen E04 aşımı beklenen öğrenme kanıtıdır.
