# Kırk Kişilik Söz: sade eğitim kaynağı 1.0.0

Bu değişiklik yalnız ayrı 12 dakikalık bölüme sade başlangıç, görev açıklaması ve ortak anlatıcı metni ekler. `content/training-contract-v1.json` kanonik kaynaktır. Üretilmiş `public/training-contract-data.js`, `node scripts/build-training-contract.mjs` ile yenilenir; `npm run check` sapmayı reddeder.

## Katılımcıya görünen açıklama

Tek kısa kurgu, bir ilk adım ve beş kısa kural vardır. Katılımcı yuvası (R1–R8), CI sahipliği ve bu bölümdeki görev ayrı açıklanır. CI sahipliği kendi başına uygulama, değişiklik onayı veya müşteri kabulü yetkisi vermez.

Kısa bölümde 20 kredi ve bir ortak teknisyen vardır. R6 PA değişikliğini önerir; bağımsız onay eğitmendedir. Bütçe R1, uygulama R4, saha teyidi R3, müşteri kabulü R2 ve ziyaretçi kabulü R8 tarafından yürütülür. Tek cihazda rol seçmek gerçek kimlik doğrulama veya özel bilgi izolasyonu değildir.

## Kaynak sınırı

Sözleşme başka bir 42 dakikalık eğitim için de herkese açık görev ve kaynak tanımları içerir. Bu tanımlar sürümlü ortak veri olarak korunmuştur; bu GitHub değişikliği o bölümün motorunu, arayüzünü, ticari arka ucunu veya oturum geçişini eklemez. Kısa bölümde bu diğer portföy etkin değildir. Bölümler arasında bütçe, sonuç ve yetki otomatik taşınmaz.

`getPublicBriefing`, `getRoleBriefing`, `changeAuthorityFor` ve `publicFacilitatorContract` yalnız tanımlı ortak bilgileri sağlar. Oturum projeksiyonu, özel rol zarfı veya olay çözümü anlatıcıya verilmez. Bilinmeyen bölüm, rol ve işlem varsayılan yetki kazanmaz.

## Kontroller

`test/forty-training-contract.test.js`, kaynak eşliği, sade açıklama sınırları, roller, bağımsız onay, güvenli ortak anlatıcı projeksiyonu, kısa bölüm bağımlılıkları ve korunmuş eski kaynakları denetler. Diğer bölümün motorunu gerektirmez.

Güncel sayısal sonuçlar ve kabul sınırları: [GitHub doğrulaması](FORTY-GITHUB-VALIDATION.md). İnsanlarla anlaşılırlık ve öğrenme kabulü otomatik testlerden çıkarılmaz.
