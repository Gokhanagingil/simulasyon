# ITSM mimarisi

Kök GRC uygulamasından ayrı kaynak ve Site/D1 alanı. Ortak asenkron handler Node/SQLite ve Worker/D1 adaptörlerinde çalışır.

`workshop_scenarios`: atölyeye özel senaryo JSON ve iyimser revizyon kilidi. `event_runs`: yayımlanan kartlar ve son kabul puanı. `simulation_records`: gerçek zamana bağlı ilk müdahale ve çözüm hedefleri. `simulation_decisions`: katılımcı notları ve eğitmen kabul kanıtları.

Eğitmen tüm kartları görür; katılımcılar yalnız gönderilen kartlara erişir. Özel rol bilgisi kendi rolüyle sınırlıdır.

SLA hedefleri kart gönderilince kayda sabitlenir. Senaryo güncellemesi açık kaydın tarihlerini değiştirmez. Gerçek zaman, atölye saatinden bağımsızdır. Niles bağlantısı henüz yoktur; elle eklenen kayıt URL'si senkronizasyon sayılmaz.
