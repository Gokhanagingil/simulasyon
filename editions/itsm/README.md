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

Varsayılan paket 12 olay, 8 rol, 4 hizmet ve 10 CI içerir. Her atölye kendi senaryo kopyasını saklar. Olay ekleme, kopyalama ve çıkarma uygulama üzerinden yapılır. Tam paket JSON olarak indirilebilir; roller, hizmetler, CI ilişkileri, rehber ve diğer veriler düzenlenip yeniden yüklenebilir. Kod değişikliği veya yeniden yayın gerekmez.

Gönderilmiş olayın metni ve kabul ölçütleri kilitlenir. Açık kaydın SLA hedefi sonradan politika değiştirilerek geriye dönük değiştirilmez. Eşzamanlı düzenleme eski sürümün yeni sürümü ezmesini engeller. Kayıtlı sürümden önceki taslak aynı tarayıcı sekmesinde korunur.

### Eğitim doğruluğu

- İlk müdahale ile çözüm ayrı zamanlardır. Oturum saati durunca gerçek SLA saati durmaz.
- Süresi aşılmış kayıt kapandığında aşım geçmişi kalır.
- Problem incelemesi ve geçici çözüm kabul edilse de kalıcı değişiklik doğrulanmadan problem kapatılamaz.
- Başarısız saha teyidi aslan çiti alarmını söndürmez.
- Puanlar atölye öğrenme puanıdır; çalışan performans değerlendirmesi değildir.

## Niles durumu

**Canlı entegrasyon ve Niles SLA kabulü tamamlanmadı.** Atölye SLA'sı Niles SLA verisi değildir. Niles kaydına elle referans eklemek senkronizasyon oluşturmaz. Hedef yalnız staging: `https://niles-grc.com`.

`content/niles-itsm-setup.json` ayrı eğitim alanı, kullanıcı/rol eşlemesi, hizmet/CI ve 24×7 SLA kurulum planıdır; uygulanmış kayıt kanıtı değildir. Ayrıntılı kabul adımları `docs/NILES-ACCEPTANCE.md` içindedir.

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
