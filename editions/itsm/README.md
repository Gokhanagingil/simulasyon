# Mavi Vadi · ITSM Operasyon Günü

Ayrı bir hayvanat bahçesi hizmet yönetimi atölyesi. Bu klasör GRC uygulamasının yerini almaz; kendi Site kimliği ve veritabanıyla çalışır.

## Kullanım

1. Uygulamada **ChatGPT ile eğitmen girişi** seçilir.
2. **Eğitmen alanı → Yeni atölye** ile eğitim açılır. Prova için **Örnek hesapları hazırla** kullanılabilir.
3. **Senaryo stüdyosu** içinde olaylar, karar sonuçları, animasyonlar, SLA hedefleri ve bölüm süreleri düzenlenir. Değişiklikler kaydedilir.
4. **Olay akışı → Ekibe gönder** ile kart yayımlanır. Önerilen dakika otomatik tetikleyici değildir.
5. Katılımcı kaydı üstlenir, çalışmasını ve kanıtını yazar, eğitmene sunar. Eğitmen gözlenen sonucu kabul eder.
6. **Gün sonu** ekranı ekibin gerçek kararlarından park hikâyesi oluşturur; kayıt CSV’si ve hikâye/kanıt JSON’u indirilebilir. Niles kabulü her iki çıktıda da ayrı tutulur.

### Senaryo paketleri

Varsayılan paket 12 olay, 8 rol, 5 hizmet ve 15 CI içerir. Her atölye kendi senaryo kopyasını saklar. Olay ekleme, kopyalama ve çıkarma uygulama üzerinden yapılır. Tam paket JSON olarak indirilebilir; roller, hizmetler, CI ilişkileri, rehber ve diğer veriler düzenlenip yeniden yüklenebilir. Kod değişikliği veya yeniden yayın gerekmez.

Gönderilmiş olayın metni ve kabul ölçütleri kilitlenir. Açık kaydın SLA hedefi sonradan politika değiştirilerek geriye dönük değiştirilmez. Eşzamanlı düzenleme eski sürümün yeni sürümü ezmesini engeller. Kayıtlı sürümden önceki taslak aynı tarayıcı sekmesinde korunur.

### Eğitim doğruluğu

- İlk müdahale ile çözüm ayrı zamanlardır. Oturum saati durunca gerçek SLA saati durmaz.
- Süresi aşılmış kayıt kapandığında aşım geçmişi kalır.
- Problem incelemesi ve geçici çözüm kabul edilse de kalıcı değişiklik doğrulanmadan problem kapatılamaz.
- Başarısız saha teyidi aslan çiti alarmını söndürmez.
- Puanlar atölye öğrenme puanıdır; çalışan performans değerlendirmesi değildir.

## Niles durumu

**Canlı entegrasyon ve Niles SLA kabulü tamamlanmadı.** Atölye SLA'sı Niles SLA verisi değildir. Niles kaydına elle referans eklemek senkronizasyon oluşturmaz. Hedef yalnız staging: `https://niles-grc.com`.

`content/niles-itsm-setup.json`, varsayılan senaryo 1.2.0 ile birebir eşleşen 5 hizmet, 15 CI, ilişkiler, olay-kayıt yolu ve 24×7 SLA kurulum planıdır; kullanıcı/rol eşlemesi ile katalog teklifleri yalnız şablondur, uygulanmış kayıt kanıtı değildir. Model sapması `test/niles-setup.test.js` ile denetlenir. Ayrıntılı kabul adımları `docs/NILES-ACCEPTANCE.md` içindedir.

## Çalıştırma

Node.js 24+: `npm run start:local`. İlk eğitmen parolası `ADMIN_PASSWORD` ile verilir; verilmezse başlangıçta bir kez üretilir. Veriler `data/` altında SQLite'da tutulur.

Sites sürümü Vinext/Cloudflare Worker + D1 kullanır. `.openai/hosting.json` bu ITSM Site'a aittir. Ortamda `ADMIN_PASSWORD` (en az 16 karakter), `ADMIN_NAME`, `TRAINER_EMAIL` tanımlanır. `drizzle/` altındaki sürümlü göçler yayın sırasında uygulanır. Parolalar veya çalışma veritabanları Git'e eklenmez.

## Kontroller

- `npm test`: HTTP/SQLite, asenkron D1 sözleşmesi, rol izolasyonu ve ITSM kabul testleri.
- `npm run check`: JavaScript ve senaryo doğrulama.
- `pnpm exec tsc --noEmit`: TypeScript.
- Sites üretim derlemesi: platformun `build-site.mjs` yardımcısı.

Bu turda tarayıcı ile görsel kontrol çalıştırılmadı. Başarılı derleme ve otomatik sunucu testleri görsel kabulün yerine geçmez.

Güncel doğrulama kapsamı: `docs/validation.md`. Ana depodaki `docs/ITSM_CONTINUE.md` devam noktasıdır; bu klasördeki `docs/CONTINUE-ITSM.md` tarihsel kurtarma notudur.

### Kalıcı karar laboratuvarı

E05/E06/E07 pompa zincirinde rol kanıtlarını paylaşın, CMDB bağımlılığını inceleyin, teknik planı test/geri dönüş koşuluyla yazın. R1 bütçe ayırır, R6 iş ve saha etkisini görüp değişikliği onaylar, R4 uygular, R3 gerçek hizmeti kabul eder. Eğitmen prova için tüm adımları uygulayabilir.

Operasyon masasındaki **baskı saati** başlangıçta durur; 1×/3×/6× hızlandırma yalnız kaynak işleri ve tekrar testini etkiler. Gerçek kayıt SLA saati ayrı kalır. Bir teknisyen aynı anda iki iş yapamaz. Ucuz yeniden başlatma kısa kesinti ve tekrar riski taşır; bağımsız besleme daha fazla bütçe/kapasite ister. Tedarik hazırlığı zaman karşılığı 10 kredi tasarruf sağlar. Sonuçlar kaybolmadan ekranda ve gün sonu neden–karar–sonuç günlüğünde görünür.

Rol yetkileri Ekip ve roller ekranında gösterilir; aynı sınırlar sunucuda uygulanır. Bu yetkiler yalnız eğitim simülasyonuna aittir. Varsayılan E05/E06/E07 kimliklerini kaldıran özel senaryolar bu özel karar laboratuvarını kullanmaz.

Hizmet sahibinin 35 kredilik kurtarma rezervi tekrar yeniden başlatmalara harcanamaz. Böylece ucuz geçici çözümler bütçeyi tüketse de tedarik hazırlığıyla kalıcı çözüm yolu açık kalır; bu eğitim kuralı ekranda görünür.

### Hayvan merkezli ana hikâye (paket 1.1.0)

E02 → E09 → E10 sponsor saati, Elif’in vardiyası ve PA kapsamını aynı Mümtaz hizmet zincirinde birleştirir. Hayvanlar kimlik, konum, bakım sahibi, kurgusal ihtiyaç, hizmet ilişkisi ve gerçekleşen karar geçmişiyle bireysel CI’dır. Mümtaz → Elif → sessiz habitat → gözlem deneyimi, sunucudaki plan/onay/uygulama/saha testi/ziyaretçi kabulü kapılarıyla oynanır. Kısmi açılış ve erteleme de tam puanlı güvenli sonuçlardır; yanlış sonuç dalı kabul edilemez.

Ana hayvan hizmeti ve destekleyici E05/E06/E07 teknik zinciri aynı iki teknisyeni, 100 krediyi, 35 kredi kurtarma rezervini ve baskı saatini paylaşır. Hayvanlar yedek parça değildir. Tüm kurallar oyunda verilir; veterinerlik bilgisi veya fiziksel hayvan müdahalesi gerekmez.

Mevcut atölyelerin senaryo kopyaları ve sonuçları değiştirilmez. Hayvan modeli yalnız yeni 1.1.0 paketinde etkinleşir. Eski atölye ekranı yeni atölye açılmasını açıklar. Runtime’ın yeni hayvan alanı ilk gerçek işlemde eklenir; geçmiş olay, kredi harcaması veya kabul uydurulmaz.

Prova hesapları gerçek uygulama hesabıdır, rol takma adı değildir. Eğitmen tarafından bir kez oluşturulur; canlı giriş ve parola işlemleri kullanıcı kontrolündedir. Bağımsız kabul testleri için `docs/ANIMAL-ACCEPTANCE-CONTRACT.md` uç noktaları ve sentetik test sınırlarını açıklar.

Paket 1.1.1: önceki ziyaretçi kabulü ile **güncel hizmet uygunluğu** ayrı gösterilir. Kurgusal gözlem hizmeti su sürekliliği ve PA → ağ ön koşullarına bağlıdır. Altyapı etkilenince eski puan/kayıt korunur; dönüşte R3 ücretsiz yeniden saha teyidi verir. Mevcut kabulde yeni uygunluk kaydı yoksa ekran bunu dürüstçe belirtir. Kısmi açılış gözlemi kapsamayan, önceden teyitli yerel alternatif rotadır.

### Bilgi ve öğrenme akışı (paket 1.2.0)

Yeni atölyelerde E02/E09/E10 bir gönderim demetidir; herhangi birini göndermek üçünü aynı anda açar. Böylece E02'nin gerçek 18 dakikalık hedefi, geç gönderilen zorunlu kartları beklemek zorunda kalmaz. Süreler katılımcı performansına ilişkin garanti değildir.

**Bilgi ve öğrenme** ekranı R5 taslağını, R8 bağımsız incelemesini, sürüm yayın/emekliliğini ve R2/R3/R7'nin başka olayda gerçek gözlemle kullanımını saklar. R8 başlangıç/ara/son ölçütlerini kaydeder. Yeni iş örneğine aktarımı eğitmen ayrı ölçütlerle değerlendirir; senaryo puanı öğrenme/katılımcı keyfi sayılmaz. E08 ve E12 kabul kapıları kanıt gerektirir. Ayrıntılı uygulama gerçekleri: `docs/LEARNING-FLOW-1.2.md`.

Mevcut atölyelerin kayıtlı paketleri değiştirilmez. Bu akışı kullanmak için yeni atölye açın; örnek hesap hazırlama var olan prova atölyesini yeni pakete dönüştürmez.
