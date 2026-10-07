# Çalışma mimarisi

Tarayıcı `public/` içindeki bağımsız modülleri yükler. Aynı HTTP API iki çalışma ortamını destekler: `server/app.js` yerel Node/SQLite adaptörü, `app/api/[...path]/route.ts` üretim Worker/D1 adaptörüdür. İş kuralları `server/handler.js` içinde ortaktır; senaryo JSON'u yalnız sunucuda okunur ve role göre filtrelenir.

D1 tablo şeması `db/schema.ts` dosyasından üretilir. Göç SQL'i ve metadata birlikte sürümlenir. Kullanıcı, oturum, atölye, üyelik, bölge durumu, duyuru, kişisel not, platform kimliği ve hareket kayıtları kalıcıdır. İlk kurulum kayıtları sabit ID ve atomik toplu işlemlerle yinelenmez. Sonraki atölyeler UUID alır.

Eğitmen bütün atölyeleri yönetebilir. Katılımcı yalnız üyesi olduğu atölyeye erişebilir. Kişisel notlar her kullanıcı/atölye çifti için ayrı saklanır. Katılımcının diğer rollere ait özel brifing, yetki, adım ve çıktı bilgileri yanıta dahil edilmez.

ChatGPT kimliği Sites'ın doğruladığı istek başlıklarından alınır. İlk bağlantı yapılandırılmış site sahibi e-postasıyla doğrulanır; sonraki girişler kalıcı kullanıcı ID'sini esas alır. Hiçbir ilk ziyaretçi kendiliğinden eğitmen olamaz. Kimlik kurulunca uygulamanın normal HttpOnly oturum çerezi oluşturulur.

Arayüz 4 saniyede bir son durumu okur. Yazma işleminden önce başlamış yanıtlar yeni durumu geri alamaz; kişisel not taslağı rol güncellemeleri ve yavaş kaydetme boyunca korunur. Veritabanı veya ağ hataları arayüzde bildirilir.

Olay tetikleme, risk/kontrol/kanıt modeli, puanlama, Niles adaptörü ve ITIL paketi sonraki geliştirme alanlarıdır. Mevcut saat yalnız oturum süresini yönetir.
