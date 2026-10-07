# Mavi Vadi · Simülasyon

Kurum içi GRC farkındalık atölyeleri için rol temelli çalışma alanı. Sekiz rol, sekiz operasyon bölgesi ve 240 dakikalık eğitim akışı; eğitmen ve katılımcı oturumları birbirinden ayrılır.

**Uygulama adresi:** https://mavi-vadi.gokhan-agingil.chatgpt.site

Bu sürüm atölye uygulamasını çevrim içine taşır. Şematik operasyon planı ve sade kurumsal arayüz, önceki çizgi film görünümünün yerini alır. Olay dağıtımı, risk/kontrol kayıtları, puanlama, ITIL paketi ve Niles bağlantısı henüz dahil değildir; saat ilerledikçe otomatik olay tetiklenmez.

## Çevrim içi kullanım

1. Uygulamayı site sahibi ChatGPT hesabınızla açın; **ChatGPT ile eğitmen girişi** seçeneğini kullanın. Eğitmen eşleştirmesi yalnız yapılandırılmış site sahibine açıktır.
2. **Atölye yönetimi** bölümünden katılımcı kullanıcı adı, başlangıç parolası ve rol oluşturun.
3. Katılımcı kendi hesabıyla giriş yapar; özel rol bilgilerini ve kişisel notlarını görür. Eğitmen diğer kullanıcıların kişisel notlarını göremez.
4. Haritada bölge seçin; eğitmen bölge durumunu/notunu güncelleyebilir, tüm ekibe veya belirli role duyuru gönderebilir.
5. **Oturum akışı** bölümünden saati başlatın, duraklatın veya bölüm seçin. Her yeni atölyenin katılımcıları, notları, duyuruları ve saati ayrıdır.

Site başlangıçta sahibine özel erişimle yayınlanır. Katılımcıların uzaktan kullanımı için site erişimine ayrıca dahil edilmesi gerekir; uygulamada hesap oluşturmak site paylaşım iznini değiştirmez. Kullanıcı adı tüm uygulamada benzersizdir. Hesap silme, eğitmen tarafından parola sıfırlama ve mevcut kullanıcıyı ikinci atölyeye ekleme henüz yoktur.

## Kalıcı veri ve yayın

Üretim: Vinext/Cloudflare Worker + Sites tarafından yönetilen D1 veritabanı. `.openai/hosting.json` site kimliğini ve `DB` bağını tanımlar. Şema `db/schema.ts`, sürümlenmiş SQL ve metadata `drizzle/` içindedir. Yayın platformu şema göçlerini uygular; istekler tablo oluşturmaz. Başlangıç eğitmeni ve boş ilk atölye, tekrarlanabilir veri ekleme işlemleriyle hazırlanır.

`ADMIN_PASSWORD` ve `TRAINER_EMAIL` yayın ortamında gizli değerlerdir; repoya veya tarayıcıya gönderilmez. `ADMIN_NAME` eğitmen görünen adıdır. Rastgele başlangıç parolası bakım erişimi içindir; site sahibi normal kullanımda ChatGPT ile giriş yapar. Kimlik ilk doğrulamadan sonra kalıcı platform kullanıcı ID'siyle eşleşir. Parolalar Worker ortamında PBKDF2-SHA256 ile, yerel Node ortamında scrypt ile özetlenir. Oturumlar 8 saatlik HttpOnly/SameSite çerezleridir; yayında Secure bayrağı kullanılır.

Gelecek şema değişiklikleri için `pnpm db:generate` çalıştırın, SQL ve metadata değişikliklerini inceleyin ve birlikte commit edin. Sites yayınında tam kaynak commit'i ve bu kaynaktan üretilmiş arşiv kullanılır. GitHub ve Sites kaynak depoları aynı uygulama dosyalarını taşır.

## Yerel çalışma

**Node.js 24+** gerekir. Standart Node/SQLite sunucusu bağımlılıksız çalışabilir:

```bash
cp .env.example .env
node --env-file-if-exists=.env server/index.js
```

`http://localhost:3000` adresini açın. İlk çalıştırmada `egitmen` hesabı oluşturulur; `ADMIN_PASSWORD` tanımlanmadıysa rastgele parola terminalde yalnız bir kez gösterilir. Veriler `data/mavi-vadi.sqlite` içinde kalır. `.env` ve veritabanı Git'e alınmaz. Yerel sunucu yalnız kullanıcı adı/parola girişini etkinleştirir.

Docker seçeneği de yerel SQLite sunucusunu çalıştırır:

```bash
docker build -t mavi-vadi .
docker run --name mavi-vadi --env-file .env -p 3000:3000 -v mavi-vadi-data:/app/data mavi-vadi
```

Veritabanını yedeklemek için yerel uygulamayı durdurup `data/` dizinini kopyalayın. Sites D1 verisi yerel SQLite dosyasından bağımsızdır; aralarında otomatik aktarım yoktur.

## Geliştirme ve doğrulama

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:browser
```

12 sunucu testi yetkilendirmeyi, özel rol bilgilerini, not ve atölye ayrımını, süre yönetimini, parolaları, yeniden başlatma sonrası kalıcılığı, gerçek dağıtım SQL'iyle D1 adaptörünü ve platform kimliğini kapsar. Tarayıcı testleri ayrı oturumları, canlı rol değişimini, yavaş kaydetme sırasında taslağın korunmasını, eski yanıtların yeni kaydı bozmamasını, bağlantı uyarılarını, giriş ekranını ve 1440/768/390/360 px düzenlerini doğrular. GitHub Actions derlemeyi ve testleri çalıştırır; güncel arayüz görüntüleri `interface-previews` çıktısındadır.

## Dosyalar

| Konum | İşlev |
| --- | --- |
| `content/grc-v1.json` | Rol, bölge, rehber ve oturum içeriği |
| `public/map.js` | Sekiz bölgeli özgün SVG operasyon planı |
| `public/views.js`, `app.js`, `styles.css` | Arayüz ve kullanıcı etkileşimi |
| `server/handler.js` | Ortak asenkron HTTP API ve erişim kuralları |
| `server/d1-store.js`, `worker-passwords.js` | Üretim kalıcılığı ve parola doğrulama |
| `server/app.js`, `store.js` | Node/SQLite yerel uyumluluk adaptörü |
| `app/api/[...path]/route.ts` | Worker çalışma ortamı ve API bağlantısı |
| `db/schema.ts`, `drizzle/` | Şema ve dağıtım göçleri |
| `test/` | Sunucu ve tarayıcı regresyon testleri |

Senaryo düzenlerken mevcut rol, bölge ve bölüm ID'lerini koruyun. Atölyeler senaryo sürümünü dondurmaz; yeni metinler mevcut atölyelere de yansır. Özel rol bilgileri uygulama API'sinde filtrelenir; açık kaynak repodaki eğitim içeriği kaynak koddan okunabilir.
