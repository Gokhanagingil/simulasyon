import { escape as e, icon, avatar, badge, time } from "./ui.js";
import { parkMap } from "./map.js";

export const navItems = [
  ["park", "map", "Park görünümü"],
  ["roles", "clipboard", "Rol kartları"],
  ["team", "users", "Ekibim"],
  ["flow", "clock", "Oturum akışı"],
  ["guide", "book", "Park rehberi"],
  ["manage", "settings", "Atölye yönetimi"],
];
export const button = (
  label,
  action,
  symbol = "",
  kind = "primary",
  extra = "",
) =>
  `<button type="button" class="btn ${kind}" data-action="${action}" ${extra}>${symbol ? icon(symbol) : ""}<span>${label}</span></button>`;
export const empty = (symbol, title, text, action = "") =>
  `<div class="empty">${icon(symbol)}<h3>${title}</h3><p>${text}</p>${action}</div>`;
export const pageHeader = (eyebrow, title, subtitle, actions = "") =>
  `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${subtitle}</p></div><div class="page-actions">${actions}</div></div>`;
const roleOptions = (roles, value) =>
  roles
    .map(
      (r) =>
        `<option value="${r.id}" ${value === r.id ? "selected" : ""}>${e(r.name)}</option>`,
    )
    .join("");
export { roleOptions };

export function loginPage() {
  return `<main id="main" class="login-page"><section class="login-form-panel">
    <a class="brand login-brand" href="#park"><img src="/brand.svg" alt="" width="48" height="48"><span>Mavi Vadi<small>ÖĞRENME PARKI</small></span></a>
    <div class="login-content"><div class="eyebrow"><span class="small-line"></span> BİRLİKTE ÖĞREN, BİRLİKTE YÖNET</div>
      <h1>Parkta bir gün.<br>İş hayatına<br><em>yeni bir bakış.</em></h1>
      <p class="login-intro">Rolünü üstlen, ekibinle karar ver.<br>Mavi Vadi’de öğrenme, deneyime dönüşür.</p>
      <form id="login-form" class="form" data-form="login">
        <label for="username">Kullanıcı adı</label><input id="username" name="username" autocomplete="username" placeholder="Kullanıcı adını yaz" required maxlength="40" autocapitalize="none" spellcheck="false">
        <label for="password">Parola</label><div class="password-field"><input id="password" name="password" type="password" autocomplete="current-password" placeholder="Parolanı yaz" required maxlength="200"><button type="button" class="icon-btn" data-action="toggle-password" data-target="password" aria-label="Parolayı göster" aria-pressed="false">${icon("eye")}</button></div>
        <div class="form-error" role="alert"></div><button class="btn primary login-submit" type="submit">Parka giriş yap ${icon("arrow")}</button>
      </form><p class="login-help">${icon("info")} Giriş bilgilerini atölye eğitmeninden alabilirsin.</p>
    </div><footer class="login-footer">Birlikte daha iyi kararlar. <span>Mavi Vadi · Simülasyon platformu</span></footer>
  </section><section class="login-art" aria-label="Parkı keşfet"><div class="art-top"><span class="pill">${icon("leaf")} GRC farkındalık atölyesi</span><span>KEŞFET · KARAR VER · ÖĞREN</span></div>
    <div class="login-art-title"><span class="eyebrow">BUGÜN PARK SİZİN</span><h2>Her rolün bir etkisi.<br>Her kararın bir hikâyesi.</h2></div>
    <div class="login-map">${parkMap([], null, false)}</div><div class="art-bottom"><div><strong>8</strong><span>farklı rol</span></div><div><strong>1</strong><span>ortak deneyim</span></div><p>Güvenli bir park.<br>İyi işleyen bir ekip.</p></div>
  </section></main>`;
}

export function shell(c) {
  const { state: s, view, user, workshops } = c;
  const own = s?.scenario.roles.find((r) => r.id === s.roleId);
  return `<div class="app-shell ${c.navOpen ? "nav-open" : ""}">
    <button class="nav-scrim" data-action="close-nav" aria-label="Menüyü kapat" tabindex="-1"></button>
    <aside class="sidebar"><a class="brand" href="#park"><img src="/brand.svg" alt="" width="43" height="43"><span>Mavi Vadi<small>ÖĞRENME PARKI</small></span></a>
      <div class="sidebar-label">ÇALIŞMA ALANIN</div><nav aria-label="Ana menü">${navItems
        .filter(([id]) => id !== "manage" || user.trainer)
        .map(
          ([id, symbol, name]) =>
            `<a id="nav-${id}" href="#${id}" class="nav-item ${view === id ? "active" : ""}" ${view === id ? 'aria-current="page"' : ""}>${icon(symbol)}<span>${id === "roles" && !user.trainer ? "Rolüm" : name}</span>${view === id ? '<span class="nav-dot"></span>' : ""}</a>`,
        )
        .join("")}</nav>
      <div class="sidebar-bottom"><div class="sidebar-note">${icon("leaf")}<p>Küçük kararlar,<br><strong>büyük etkiler.</strong></p></div><div class="mode-label"><span></span> GRC farkındalık paketi</div>
      <div class="profile-wrap"><button class="profile-button" id="profile-toggle" data-action="profile-menu" aria-expanded="${c.profileOpen}" aria-controls="profile-menu">${avatar(user.name, "sage")}<span><strong>${e(user.name)}</strong><small>${user.trainer ? "Atölye eğitmeni" : e(own?.shortName || "Katılımcı")}</small></span>${icon("down")}</button>
      ${c.profileOpen ? `<div class="profile-menu" id="profile-menu">${button("Profilim", "profile", "user", "text")}${button("Parolamı değiştir", "password", "lock", "text")}${button("Çıkış yap", "logout", "logout", "text")}</div>` : ""}</div></div>
    </aside><div class="workspace" ${c.navOpen ? "inert" : ""}><header class="topbar"><button class="icon-btn mobile-menu" data-action="open-nav" aria-label="Menüyü aç">${icon("menu")}</button>
      <div class="workshop-picker"><span class="topbar-label">ATÖLYE</span><label class="sr-only" for="workshop-select">Atölye seç</label><select id="workshop-select" ${workshops.length < 2 ? "disabled" : ""}>${workshops.map((w) => `<option value="${w.id}" ${s?.workshop.id === w.id ? "selected" : ""}>${e(w.name)}</option>`).join("") || "<option>Henüz atölye yok</option>"}</select></div>
      <div class="topbar-right"><span class="connection ${c.connected ? "" : "offline"}" title="${c.connected ? "Değişiklikler düzenli olarak güncelleniyor" : "Bağlantı yeniden deneniyor"}"><span></span>${c.connected ? "Bağlı" : "Yeniden bağlanıyor"}</span>${s ? `<a class="clock-pill" href="#flow">${icon("clock")}<span data-clock>${time(s.workshop.elapsed_seconds)}</span><span class="clock-state">${{ ready: "Hazır", running: "Devam ediyor", paused: "Duraklatıldı", completed: "Tamamlandı" }[s.workshop.status]}</span></a>` : ""}<button class="icon-btn notifications-button" data-action="announcements" aria-label="Duyurular${s?.announcements.length ? `, ${s.announcements.length} duyuru` : ""}">${icon("bell")}${s?.announcements.length ? '<span class="notification-dot"></span>' : ""}</button></div></header>
      ${!c.connected ? '<div class="connection-banner" role="status">Bağlantı kesildi. Son alınan bilgiler gösteriliyor; yeniden bağlanıyoruz.</div>' : ""}
      <main id="main" class="main-content">${s ? ({ park: overview, roles: rolesPage, team: teamPage, flow: flowPage, guide: guidePage, manage: managePage }[view] || overview)(c) : empty("users", "Atölyen hazırlanıyor", "Eğitmenin seni bir atölyeye eklediğinde burada görebileceksin.")}</main>
      <footer class="app-footer"><span>Mavi Vadi <span class="footer-dot">·</span> Birlikte öğrenme alanı</span><span>${s ? e(s.workshop.code) : ""} <span class="footer-dot">·</span> GRC</span></footer>
    </div></div>`;
}

function zoneDetail(c) {
  const z =
    c.state.scenario.zones.find((z) => z.id === c.selectedZone) ||
    c.state.scenario.zones[0];
  const role = c.state.scenario.roles.find((r) => r.id === z.owner);
  const members = c.state.members.filter((m) => m.role_id === z.owner);
  return `<aside class="zone-detail" aria-label="Seçili bölge bilgileri"><div class="zone-detail-top"><span class="zone-symbol ${z.id === "water" ? "blue" : "sage"}">${icon(z.icon)}</span>${badge(z.status)}</div><div class="eyebrow">${e(z.kind)}</div><h3>${e(z.name)}</h3><p>${e(z.description)}</p>
  <div class="detail-divider"></div><h4>Bu bölgede</h4><ul class="asset-list">${z.assets.map((a) => `<li><span></span>${e(a)}</li>`).join("")}</ul>
  ${z.note ? `<div class="zone-note">${icon("info")}<div><strong>Güncel not</strong><p>${e(z.note)}</p></div></div>` : ""}
  <div class="zone-owner"><span class="caption">BÖLGE SORUMLUSU</span><button data-action="role" data-id="${role.id}" class="owner-button"><span class="role-symbol ${role.color}">${icon(role.icon)}</span><span><strong>${e(role.shortName)}</strong><small>${members.length ? members.map((m) => e(m.name)).join(", ") : "Henüz katılımcı atanmadı"}</small></span>${icon("chevron")}</button></div>
  ${c.user.trainer ? button("Bölgeyi güncelle", "edit-zone", "edit", "secondary", `data-id="${z.id}"`) : ""}</aside>`;
}

function overview(c) {
  const s = c.state,
    own = s.scenario.roles.find((r) => r.id === s.roleId);
  const open = s.scenario.zones.filter((z) => z.status === "open").length;
  return `${pageHeader(`MAVİ VADİ’YE HOŞ GELDİN, ${e(c.user.name.split(" ")[0].toLocaleUpperCase("tr"))}`, "Parkta yeni bir gün.", "Farklı sorumluluklar, ortak bir amaç. Bugünün hikâyesini birlikte yazın.", c.user.trainer ? button("Atölyeyi yönet", "go-manage", "settings", "secondary") : button("Rol kartımı aç", "go-roles", "clipboard", "secondary"))}
    <div class="overview-strip"><div>${icon("leaf")}<span><strong>${open} / ${s.scenario.zones.length}</strong> bölge açık</span></div><div>${icon("users")}<span><strong>${s.members.length}</strong> katılımcı</span></div><div>${icon("compass")}<span><strong>${new Set(s.members.map((m) => m.role_id)).size} / 8</strong> rol atanmış</span></div><a href="#flow">${icon("clock")}<span>${e(s.phase.name)}</span>${icon("arrow")}</a></div>
    <section class="park-card"><div class="section-bar"><div><h2>Parkı keşfet</h2><p>Bir bölge seç, sorumlulukları ve güncel durumu gör.</p></div><div class="segmented" aria-label="Park gösterimi"><button data-action="map-mode" data-mode="map" aria-pressed="${c.mapMode === "map"}" class="${c.mapMode === "map" ? "active" : ""}">${icon("map")}<span>Harita</span></button><button data-action="map-mode" data-mode="list" aria-pressed="${c.mapMode === "list"}" class="${c.mapMode === "list" ? "active" : ""}">${icon("clipboard")}<span>Bölgeler</span></button></div></div>
    <div class="park-layout"><div class="map-panel">${c.mapMode === "map" ? `<div class="map-scroll" id="map-scroll"><div class="map-canvas" style="width:${c.zoom * 100}%;height:${c.zoom * 100}%">${parkMap(s.scenario.zones, c.selectedZone)}</div></div><div class="map-overlay"><span>${icon("compass")} MAVİ VADİ PARK PLANI</span><div class="map-tools"><button class="icon-btn" data-action="zoom-out" aria-label="Haritayı uzaklaştır" ${c.zoom <= 1 ? "disabled" : ""}>${icon("minus")}</button><button class="zoom-value" data-action="zoom-reset" aria-label="Harita yakınlaştırmasını sıfırla">${Math.round(c.zoom * 100)}%</button><button class="icon-btn" data-action="zoom-in" aria-label="Haritayı yakınlaştır" ${c.zoom >= 1.75 ? "disabled" : ""}>${icon("plus")}</button></div></div>` : `<div class="zone-list">${s.scenario.zones.map((z) => `<button class="zone-list-item ${z.id === c.selectedZone ? "selected" : ""}" data-zone="${z.id}" aria-pressed="${z.id === c.selectedZone}"><span class="zone-symbol sage">${icon(z.icon)}</span><span><strong>${e(z.name)}</strong><small>${e(z.kind)}</small></span>${badge(z.status)}${icon("chevron")}</button>`).join("")}</div>`}</div>${zoneDetail(c)}</div>
    <div class="map-legend"><span><i class="legend-dot open"></i>Açık</span><span><i class="legend-dot monitor"></i>İzlemde</span><span><i class="legend-dot closed"></i>Ziyarete kapalı</span><p>${c.mapMode === "map" ? "Bölgeler klavyeyle de seçilebilir." : "Durumlar eğitmen tarafından güncellenir."}</p></div></section>
    <div class="below-map"><section class="your-role-card"><div class="eyebrow">${c.user.trainer ? "EĞİTMEN ALANI" : "BUGÜN SENİN ROLÜN"}</div><div class="role-preview"><span class="role-symbol ${own?.color || "forest"}">${icon(own?.icon || "compass")}</span><div><h3>${e(own?.name || (c.user.trainer ? "Deneyime yön ver." : "Ekibinle tanış."))}</h3><p>${c.user.trainer ? "Rolleri dağıt, akışı yönet, öğrenmeye alan aç." : e(own?.goal || "Rolün eğitmenin tarafından atanacak.")}</p></div></div>${button(c.user.trainer ? "Rol kartlarını incele" : "Rolümün ayrıntıları", "go-roles", "arrow", "text")}</section>
    <section class="recent-announcements"><div class="card-heading"><h2>Atölyeden haberler</h2><button class="text-link" data-action="announcements">Tümü ${icon("arrow")}</button></div>${s.announcements[0] ? announcement(s.announcements[0], s.scenario.roles) : `<div class="quiet-message">${icon("bell")}<div><strong>Henüz bir duyuru yok.</strong><p>Eğitmeninden gelen yönlendirmeleri burada bulacaksın.</p></div></div>`}</section></div>`;
}

export function roleDetail(role, full = true) {
  return `<article class="role-sheet"><div class="role-sheet-heading"><span class="role-symbol large ${role.color}">${icon(role.icon)}</span><div><div class="eyebrow">${role.id} · ROL KARTI</div><h2>${e(role.name)}</h2></div></div><p class="role-goal">${e(role.goal)}</p>
    <div class="role-section"><h3>${icon("compass")} Sorumluluğun</h3><p>${e(role.responsibility)}</p></div>
    ${full && role.briefing ? `<div class="private-briefing"><span class="caption">${icon("lock")} ROLE ÖZEL BAŞLANGIÇ BİLGİSİ</span><p>${e(role.briefing)}</p></div><div class="role-section"><h3>${icon("shield")} Yetkin ve sınırların</h3><p>${e(role.authority)}</p></div><div class="role-section"><h3>${icon("play")} İlk adımların</h3><p>${e(role.steps)}</p></div>` : ""}
    <div class="role-section"><h3>${icon("users")} Birlikte çalışacağın roller</h3><p>${e(role.partners)}</p></div>${full && role.output ? `<div class="role-section output"><h3>${icon("check")} Beklenen katkın</h3><p>${e(role.output)}</p></div>` : ""}
    ${!full ? '<p class="privacy-note">Bu rolün ortak ekip bilgilerini görüyorsun. Başlangıç bilgisi yalnız ilgili role ve eğitmene açıktır.</p>' : ""}</article>`;
}

function rolesPage(c) {
  const s = c.state,
    own = s.scenario.roles.find((r) => r.id === s.roleId);
  if (!c.user.trainer && own)
    return `${pageHeader("ROLÜNÜ TANI", "Bugün senin katkın.", "Rol kartın ve kişisel notların, atölye boyunca yanında.", button("Rol kartını yazdır", "print-role", "print", "secondary"))}<div class="my-role-layout"><section class="card printable-role">${roleDetail(own)}</section><aside><section class="card notes-card"><div class="card-heading"><h2>${icon("edit")} Kendime notlar</h2>${icon("lock")}</div><p>Bu notları yalnız sen görebilirsin.</p><form data-form="note"><label class="sr-only" for="personal-note">Kişisel notun</label><textarea id="personal-note" name="text" maxlength="4000" rows="10" placeholder="Sormak istediklerin, kararların, aklında kalanlar…">${e(c.noteDraft ?? s.note)}</textarea><div class="form-error" role="alert"></div><div class="note-footer"><span id="note-status">${c.noteDraft !== null ? "Kaydedilmemiş değişiklik" : "Atölyene özel not"}</span><button type="submit" class="btn secondary">${icon("check")} Kaydet</button></div></form></section><div class="tip-card">${icon("users")}<h3>Bilgi, paylaştıkça tamamlanır.</h3><p>Rolünde bildiklerini ekibinle konuş. Diğer rollerin hangi bilgiye sahip olduğunu sor.</p><a href="#team" class="text-link">Ekibimi gör ${icon("arrow")}</a></div></aside></div>`;
  return `${pageHeader("FARKLI ROLLER, ORTAK AMAÇ", "Her rolün bir katkısı var.", "Sorumlulukları keşfet. Park, ekip birlikte çalıştığında iyi işler.")}<div class="role-grid">${s.scenario.roles.map((r) => `<button class="role-card" data-action="role" data-id="${r.id}"><div class="role-card-top"><span class="role-symbol ${r.color}">${icon(r.icon)}</span><span class="role-code">${r.id}</span></div><h2>${e(r.name)}</h2><p>${e(r.goal)}</p><div class="role-card-bottom"><span>${s.members.filter((m) => m.role_id === r.id).length} katılımcı</span><span>Rolü keşfet ${icon("arrow")}</span></div></button>`).join("")}</div><div class="inline-note">${icon("info")} ${c.user.trainer ? "Eğitmen olarak tüm rol kartlarının özel başlangıç bilgilerini görebilirsin." : "Henüz bir rolün yok. Eğitmenin rolünü atadığında kendi kartın burada açılacak."}</div>`;
}

function teamPage(c) {
  const s = c.state;
  return `${pageHeader("BİRLİKTE DAHA GÜÇLÜ", "Mavi Vadi ekibi.", "Kiminle çalıştığını ve hangi sorumluluğu üstlendiğini gör.", c.user.trainer ? button("Katılımcı ekle", "add-member", "plus") : "")}<div class="team-toolbar"><div class="search-field">${icon("search")}<label class="sr-only" for="team-search">Ekipte ara</label><input type="search" id="team-search" placeholder="İsim veya role göre ara" value="${e(c.teamSearch)}"></div><span class="muted">${s.members.length} katılımcı · 8 rol</span></div>
    <div class="team-grid" id="team-grid">${teamCards(c)}</div><div class="inline-note">${icon("users")} Bir rol birden fazla katılımcıya atanabilir. Karar ve sorumlulukları kendi aranızda paylaşın.</div>`;
}
export function teamCards(c) {
  const s = c.state,
    query = c.teamSearch.toLocaleLowerCase("tr");
  const members = s.members.filter((m) =>
    `${m.name} ${s.scenario.roles.find((r) => r.id === m.role_id)?.name}`
      .toLocaleLowerCase("tr")
      .includes(query),
  );
  return members.length
    ? members
        .map((m) => {
          const r = s.scenario.roles.find((r) => r.id === m.role_id);
          return `<article class="member-card">${avatar(m.name, r.color, "large")}<h2>${e(m.name)} ${m.id === c.user.id ? '<span class="self-badge">Sen</span>' : ""}</h2><span class="member-role">${icon(r.icon)} ${e(r.name)}</span><span class="muted username">@${e(m.username)}</span><div class="member-actions"><button class="text-link" data-action="role" data-id="${r.id}">Rol kartı ${icon("arrow")}</button>${c.user.trainer ? `<button class="icon-btn" data-action="edit-member" data-id="${m.id}" aria-label="${e(m.name)} için rolü değiştir">${icon("edit")}</button>` : ""}</div></article>`;
        })
        .join("")
    : empty(
        "users",
        query ? "Eşleşen katılımcı bulunamadı." : "Ekibin burada buluşacak.",
        query
          ? "Başka bir isim veya rol ile tekrar ara."
          : c.user.trainer
            ? "Katılımcıları ekleyerek ilk atölyeni hazırla."
            : "Eğitmenin ekibi oluşturduğunda bu alan güncellenecek.",
        c.user.trainer && !query
          ? button("İlk katılımcıyı ekle", "add-member", "plus")
          : "",
      );
}

function flowPage(c) {
  const s = c.state,
    current = s.scenario.phases.findIndex((p) => p.id === s.phase.id);
  let offset = 0;
  return `${pageHeader("YARIM GÜNLÜK BİR DENEYİM", "Adım adım, birlikte.", "Düşünmek, denemek ve deneyimden öğrenmek için alan.", c.user.trainer ? button(s.workshop.status === "running" ? "Duraklat" : "Oturumu başlat", s.workshop.status === "running" ? "pause" : "start", s.workshop.status === "running" ? "pause" : "play", "primary", s.workshop.status === "completed" ? "disabled" : "") : "")}
    <div class="flow-layout"><section class="timeline card">${s.scenario.phases
      .map((p, i) => {
        const start = offset;
        offset += p.minutes;
        return `<article class="phase-row ${i === current ? "current" : ""} ${i < current ? "past" : ""}"><div class="phase-marker">${i < current ? icon("check") : String(i + 1).padStart(2, "0")}</div><div class="phase-info"><div class="phase-meta">${start}–${offset}. dakika ${i === current ? '<span class="current-label">ŞU AN</span>' : ""}</div><h2>${e(p.name)}</h2><p>${e(p.description)}</p>${c.user.trainer && i !== current ? `<button class="text-link" data-action="jump-phase" data-id="${p.id}">Bu bölüme geç ${icon("arrow")}</button>` : ""}</div><span class="phase-duration">${p.minutes} dk</span></article>`;
      })
      .join("")}</section>
    <aside><section class="session-card"><div class="eyebrow">ATÖLYE SAATİ</div><div class="big-clock" data-clock>${time(s.workshop.elapsed_seconds)}</div><span class="session-status">${{ ready: "Başlamaya hazır", running: "Deneyim devam ediyor", paused: "Oturum duraklatıldı", completed: "Atölye tamamlandı" }[s.workshop.status]}</span><div class="progress-track"><div style="width:${s.workshop.elapsed_seconds / 144}%" data-progress></div></div><div class="session-total"><span>Geçen süre</span><strong>240 dakika toplam</strong></div></section><div class="tip-card">${icon("compass")}<h3>Akışı eğitmenin yönetir.</h3><p>Bölümler, oyunun ritmini gösterir. Eğitmenin gerekli gördüğünde saati duraklatabilir veya bir bölüme geçebilir.</p><p>Olaylar ve karar anları atölye sırasında paylaşılır.</p></div></aside></div>`;
}

function guidePage(c) {
  return `${pageHeader("YANINDAKİ KÜÇÜK REHBER", "İyi bir başlangıç için.", "Ortak ilkeler, açık iletişim ve düşünmeye yardımcı sorular.")}<div class="guide-grid">${c.state.scenario.guides.map((g, i) => `<article class="guide-card card"><div class="guide-top"><span class="role-symbol ${["sage", "amber", "blue", "clay"][i % 4]}">${icon(g.icon)}</span><span class="caption">${e(g.tag)}</span></div><h2>${e(g.title)}</h2><p class="guide-summary">${e(g.summary)}</p>${g.paragraphs.map((p) => `<p>${e(p)}</p>`).join("")}</article>`).join("")}</div><div class="guide-end">${icon("leaf")}<p>Burada öğrendiklerimizi, kendi işimize nasıl taşırız?</p></div>`;
}

export function announcement(a, roles) {
  const role = roles.find((r) => r.id === a.role_id);
  return `<article class="announcement"><div class="announcement-meta"><span>${role ? e(role.shortName) : "Tüm ekip"}</span><time datetime="${new Date(a.created_at).toISOString()}">${new Intl.DateTimeFormat("tr", { hour: "2-digit", minute: "2-digit" }).format(a.created_at)}</time></div><h3>${e(a.title)}</h3><p>${e(a.message)}</p></article>`;
}

function managePage(c) {
  if (!c.user.trainer)
    return empty(
      "lock",
      "Bu alan eğitmene ait.",
      "Park görünümünden atölyeye devam edebilirsin.",
    );
  const s = c.state,
    assigned = new Set(s.members.map((m) => m.role_id));
  return `${pageHeader("EĞİTMEN ÇALIŞMA ALANI", "Deneyime alan aç.", "Ekibini hazırla, oturumun ritmini belirle ve yönlendirmelerini paylaş.", button("Yeni atölye", "new-workshop", "plus", "secondary"))}
    <div class="manage-grid"><section class="card manage-session"><div class="card-heading"><h2>Atölye hazır mı?</h2><span class="code-tag">${e(s.workshop.code)}</span></div><p class="muted">${e(s.workshop.name)}</p><div class="readiness"><div><strong>${s.members.length}</strong><span>katılımcı</span></div><div><strong>${assigned.size}<small> / 8</small></strong><span>atanmış rol</span></div><div><strong>240</strong><span>dakika</span></div></div><div class="role-readiness">${s.scenario.roles.map((r) => `<span class="${assigned.has(r.id) ? "assigned" : ""}" title="${e(r.name)}">${assigned.has(r.id) ? icon("check") : icon("user")}${r.id}</span>`).join("")}</div><p class="helper">${assigned.size < 8 ? "Tüm rollere katılımcı atayarak başlayabilirsin. Aynı rolü birkaç kişi paylaşabilir." : "Bütün roller atanmış. Ekip hazır olduğunda oturumu başlatabilirsin."}</p><div class="button-row">${button("Katılımcı ekle", "add-member", "plus")}${button("Akışı yönet", "go-flow", "clock", "secondary")}</div></section>
    <section class="card broadcast-card"><span class="role-symbol amber">${icon("bell")}</span><h2>Ekibe bir yön ver.</h2><p>Günün duyurusunu tüm katılımcılara veya yalnız bir role ilet.</p>${button("Duyuru oluştur", "new-announcement", "plus", "secondary")}<span class="helper">Duyurular yalnız bu atölyede görünür.</span></section>
    <section class="card activity-card"><div class="card-heading"><h2>Atölye hareketleri</h2><span class="caption">SON İŞLEMLER</span></div>${s.activity.length ? `<ol class="activity-list">${s.activity.map((a) => `<li><span class="activity-dot"></span><div><strong>${e(a.message)}</strong><span>${e(a.actor)} · ${new Intl.DateTimeFormat("tr", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(a.created_at)}</span></div></li>`).join("")}</ol>` : empty("clock", "İlk adımı bekliyor.", "Katılımcı, bölge ve oturum değişiklikleri burada görünecek.")}</section>
    <section class="card preparation-card"><h2>Kısa hazırlık listesi</h2><ol><li><strong>Ekibini yerleştir.</strong><p>Kullanıcı oluştur, rol ata ve giriş bilgilerini paylaş.</p></li><li><strong>Parkı birlikte keşfedin.</strong><p>Katılımcılara haritayı ve rol kartlarını incelemek için zaman ver.</p></li><li><strong>Akışı başlat.</strong><p>Saati yönet; yönlendirmeleri duyurularla destekle.</p></li></ol><a href="#guide" class="text-link">Ortak kuralları aç ${icon("arrow")}</a></section></div>`;
}
