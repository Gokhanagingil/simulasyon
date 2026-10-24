# Mavi Vadi ITSM — devam kaydı

## Son kullanıcı talebi
GRC sürümünü ve mevcut verilerini koruyarak ayrı ITSM sürümü hazırlansın. Temel ITSM süreçleri, mizah, animasyonlar (ziyaretçi kuyruğu, aslan çiti kırmızı ikaz), Niles staging entegrasyonu ve Niles üzerinde gerçek SLA aşımı isteniyor. 7 Ekim son ek talep: senaryolar kod değişikliği olmadan eklenip çıkarılabilmeli.

## 7 Ekim 2026 — kurtarılan durum
- GRC canlı: https://mavi-vadi.gokhan-agingil.chatgpt.site — bu çalışma GRC kaynağını veya veritabanını değiştirmez.
- ITSM Site: appgprj_6ac62ba86ea48191babde5b3c0d38828; henüz yayımlanmamış durumda bulundu. Yeni Site oluşturmayın.
- Kurtarılan çalışma dizini: /workspace/sites/mavi-vadi-itsm.
- 12 olay, 8 rol, 4 hizmet, 10 CI; SVG animasyonları, olay çalışma/kabul akışı ve yerel SLA motoru önceki çalışmadan kurtarıldı.
- Eğitmen senaryo düzenleyicisi ekleniyor. Senaryo her atölyede ayrı kalıcı JSON/revizyon olarak saklanır; ekibe gönderilmiş olay değiştirilemez. Süre, SLA gözlemi ve final davranışı artık veri alanlarıdır.
- Niles https://niles-grc.com/login giriş ekranında; bu oturumda açık kimlik doğrulama yok. Niles alanı/kullanıcısı/SLA'sı oluşturulmuş DEĞİL. Yerel SLA Niles kanıtı diye sunulmamalı.

## Tamamlanacak işler
1. Eğitmen için kodsuz olay/SLA/bölüm düzenleyicisi; içe/dışa aktarma.
2. ITSM uçtan uca HTTP testleri: olay/rol/atölye izolasyonu, gerçek saat davranışı, kayıt geçmişi, senaryo kalıcılığı.
3. Üretim derlemesi ve ayrı ITSM Site'a yayın.
4. GitHub Gokhanagingil/simulasyon feat/itsm-operation-day dalında editions/itsm altında kaynakları sakla. GRC kök dosyalarını değiştirme.
5. Niles staging oturumu açıldıktan sonra ayrı eğitim alanı, roller, hizmet/CI kayıtları ve 24x7 SLA kur. E04 için 12 gerçek dakika sonunda resmi SLA aşım alanını doğrula.

## Doğrulama sınırı
Mevcut oturumda Sites'in zorunlu control-browser becerisi yok; bu yüzden yerel Sites tarayıcı QA'sı çalıştırılmıyor. HTTP/SQLite/D1 sözleşme testleri ve derleme uygulanır; yapılmayan görsel kontroller başarılı sayılmaz.
