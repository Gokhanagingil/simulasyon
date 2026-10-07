import { escape as e, icon, time, statuses } from "./ui.js";
import {
  loginPage,
  shell,
  button,
  empty,
  roleDetail,
  roleOptions,
  announcement,
  teamCards,
  navItems,
} from "./views.js";

const app = document.querySelector("#app"),
  dialog = document.querySelector("#dialog");
const ctx = {
  user: null,
  authOptions: { platform: false },
  workshops: [],
  state: null,
  view: "park",
  selectedZone: "savanna",
  zoom: 1,
  mapMode: "map",
  teamSearch: "",
  profileOpen: false,
  navOpen: false,
  connected: true,
  noteDraft: null,
};
let busy = false,
  polling = false,
  lastSignature = "",
  snapshotAt = Date.now(),
  toastTimer,
  modalTrigger,
  modalKind = "",
  epoch = 0;
function focusTarget(element) {
  if (element?.id) return `#${CSS.escape(element.id)}`;
  if (element?.dataset.action)
    return `[data-action="${CSS.escape(element.dataset.action)}"]${element.dataset.id ? `[data-id="${CSS.escape(element.dataset.id)}"]` : ""}`;
  return null;
}
const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* Storage may be disabled. */
    }
  },
};
const role = (id) => ctx.state.scenario.roles.find((r) => r.id === id);
const endpoint = (resource) =>
  `/api/workshops/${ctx.state.workshop.id}/${resource}`;

async function api(path, { method = "GET", data, quiet = false } = {}) {
  // A response from a poll started before a write must not undo that write.
  const requestEpoch = method === "GET" ? epoch : ++epoch;
  let response;
  try {
    response = await fetch(path, {
      method,
      headers: data !== undefined ? { "Content-Type": "application/json" } : {},
      body: data !== undefined ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new Error(
      "Bağlantı kurulamadı. İnternet bağlantını kontrol edip tekrar dene.",
    );
  }
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401 && !quiet && ctx.user && requestEpoch === epoch)
      resetSession();
    throw new Error(result.error || "İşlem tamamlanamadı.");
  }
  return result;
}
function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 4200);
}
function readView() {
  const view = location.hash.slice(1);
  ctx.view = navItems.some(([id]) => id === view) ? view : "park";
  if (ctx.view === "manage" && !ctx.user?.trainer) ctx.view = "park";
}
function signature(s) {
  return JSON.stringify({
    ...s,
    workshop: { ...s.workshop, elapsed_seconds: 0 },
  });
}
function render() {
  const focused = document.activeElement;
  const selection = focused?.id === "personal-note"
    ? [focused.selectionStart, focused.selectionEnd, focused.selectionDirection]
    : null;
  const focusSelector = focusTarget(focused);
  const focusZone = focused?.dataset.zone;
  const scroll = document.querySelector("#map-scroll");
  const mapPosition = scroll
    ? { left: scroll.scrollLeft, top: scroll.scrollTop }
    : null;
  app.innerHTML = ctx.user ? shell(ctx) : loginPage(ctx);
  if (ctx.state) lastSignature = signature(ctx.state);
  if (mapPosition) {
    const next = document.querySelector("#map-scroll");
    if (next) {
      next.scrollLeft = mapPosition.left;
      next.scrollTop = mapPosition.top;
    }
  }
  if (focusSelector)
    document.querySelector(focusSelector)?.focus({ preventScroll: true });
  else if (focusZone)
    document
      .querySelector(`[data-zone="${CSS.escape(focusZone)}"]`)
      ?.focus({ preventScroll: true });
  if (selection)
    document.querySelector("#personal-note")?.setSelectionRange(...selection);
  updateClock();
}
function setConnected(connected) {
  ctx.connected = connected;
  const indicator = document.querySelector(".connection");
  if (indicator) {
    indicator.classList.toggle("offline", !connected);
    indicator.title = connected
      ? "Değişiklikler düzenli olarak güncelleniyor"
      : "Bağlantı yeniden deneniyor";
    indicator.innerHTML = `<span></span>${connected ? "Bağlı" : "Yeniden bağlanıyor"}`;
  }
  const banner = document.querySelector(".connection-banner");
  if (banner) banner.hidden = connected;
}
function revealSelectedZone() {
  const container = document.querySelector("#map-scroll");
  const zone = container?.querySelector(`[data-zone="${CSS.escape(ctx.selectedZone)}"]`);
  if (!zone) return;
  const area = container.getBoundingClientRect(), target = zone.getBoundingClientRect();
  if (target.left < area.left || target.right > area.right)
    container.scrollLeft += target.left + target.width / 2 - area.left - area.width / 2;
  if (target.top < area.top || target.bottom > area.bottom)
    container.scrollTop += target.top + target.height / 2 - area.top - area.height / 2;
}
function resetSession() {
  epoch++;
  ctx.user = null;
  ctx.state = null;
  ctx.workshops = [];
  ctx.noteDraft = null;
  ctx.profileOpen = false;
  ctx.navOpen = false;
  ctx.connected = true;
  if (dialog.open) dialog.close();
  readView();
  render();
}
async function loadWorkshop(id) {
  const requestEpoch = ++epoch;
  const s = await api(`/api/workshops/${id}/state`);
  if (requestEpoch !== epoch) return;
  ctx.state = s;
  ctx.user = s.user;
  ctx.connected = true;
  ctx.noteDraft = null;
  snapshotAt = Date.now();
  storage.set("mv-workshop", id);
  render();
}
async function loadAccount(account) {
  ctx.user = account.user;
  ctx.workshops = account.workshops;
  readView();
  const saved = storage.get("mv-workshop");
  const selected =
    account.workshops.find((w) => w.id === saved) || account.workshops[0];
  if (selected) await loadWorkshop(selected.id);
  else render();
}
async function refresh() {
  if (!ctx.user || polling || busy) return;
  polling = true;
  const requestEpoch = epoch;
  try {
    if (!ctx.state) {
      const account = await api("/api/me");
      if (requestEpoch === epoch) await loadAccount(account);
      return;
    }
    const s = await api(endpoint("state"));
    if (requestEpoch !== epoch) return;
    const roleChanged = s.roleId !== ctx.state.roleId;
    ctx.state = s;
    ctx.user = s.user;
    snapshotAt = Date.now();
    const reconnected = !ctx.connected;
    setConnected(true);
    if (roleChanged) {
      if (dialog.open) dialog.close();
      toast("Rolün güncellendi. Yeni rol kartını inceleyebilirsin.");
    }
    const editing = !!document.activeElement?.closest(
      "input, textarea, select",
    );
    if (
      !dialog.open &&
      (roleChanged || (!editing && (signature(s) !== lastSignature || reconnected)))
    )
      render();
  } catch (error) {
    if (ctx.user && requestEpoch === epoch) {
      setConnected(false);
    }
  } finally {
    polling = false;
  }
}
function updateClock() {
  if (!ctx.state) return;
  const w = ctx.state.workshop;
  const elapsed = Math.min(
    14400,
    w.elapsed_seconds +
      (w.status === "running" && ctx.connected
        ? Math.max(0, Date.now() - snapshotAt) / 1000
        : 0),
  );
  document
    .querySelectorAll("[data-clock]")
    .forEach((el) => (el.textContent = time(elapsed)));
  document
    .querySelectorAll("[data-progress]")
    .forEach((el) => (el.style.width = `${elapsed / 144}%`));
}
function openModal(title, body, kind = "") {
  modalTrigger = focusTarget(document.activeElement);
  modalKind = kind;
  dialog.innerHTML = `<div class="dialog-heading"><h2 id="dialog-title">${title}</h2><button class="icon-btn" data-action="close-dialog" aria-label="Pencereyi kapat">${icon("close")}</button></div><div class="dialog-body">${body}</div>`;
  if (!dialog.open) dialog.showModal();
  (
    dialog.querySelector(
      '.dialog-body input:not([type="hidden"]), .dialog-body textarea, .dialog-body select',
    ) || dialog.querySelector("button")
  )?.focus();
}
dialog.addEventListener("close", () => {
  modalKind = "";
  dialog.replaceChildren();
  render();
  if (modalTrigger)
    document.querySelector(modalTrigger)?.focus({ preventScroll: true });
});
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      dialog.close();
  }
});
function modalForm(name, fields, submit = "Kaydet", extra = "") {
  return `<form class="form" data-form="${name}" ${extra}>${fields}<div class="form-error" role="alert"></div><div class="dialog-actions">${button("Vazgeç", "close-dialog", "", "secondary")}<button class="btn primary" type="submit">${submit}${icon("check")}</button></div></form>`;
}
const field = (label, name, value = "", options = "") =>
  `<label for="field-${name}">${label}</label><input id="field-${name}" name="${name}" value="${e(value)}" ${options}>`;
function showRole(id) {
  const r = role(id);
  if (!r) return;
  openModal(
    "Rol kartı",
    `${roleDetail(r, ctx.user.trainer || ctx.state.roleId === r.id)}${button("Yazdır", "print-dialog", "print", "secondary")}`,
    "role",
  );
}
function newMember() {
  openModal(
    "Ekibe katılımcı ekle",
    `<p class="dialog-intro">Katılımcının giriş bilgilerini oluştur ve rolünü seç. Bilgileri kendisiyle paylaş.</p>${modalForm("member", field("Ad soyad", "name", "", 'required maxlength="80" autocomplete="off"') + field("Kullanıcı adı", "username", "", 'required minlength="3" maxlength="40" pattern="[a-z0-9._-]{3,40}" autocomplete="off" placeholder="ornek: deniz.yilmaz" autocapitalize="none" spellcheck="false"') + '<p class="helper">Küçük harf, rakam, nokta, tire veya alt çizgi kullan.</p>' + field("Başlangıç parolası", "password", "", 'type="text" required minlength="8" maxlength="200" autocomplete="new-password" placeholder="En az 8 karakter"') + `<button type="button" class="text-link" data-action="generate-password">${icon("lock")} Parola oluştur</button><label for="field-roleId">Atölyedeki rolü</label><select id="field-roleId" name="roleId">${roleOptions(ctx.state.scenario.roles)}</select>`, "Katılımcıyı ekle")}`,
    "member",
  );
}
async function mutate(resource, data, method = "POST") {
  const result = await api(endpoint(resource), { method, data });
  if (result.workshop) {
    ctx.state = result;
    ctx.user = result.user;
    snapshotAt = Date.now();
  }
  return result;
}
function navigate(view) {
  ctx.profileOpen = false;
  ctx.navOpen = false;
  if (location.hash === `#${view}`) {
    ctx.view = view;
    render();
  } else location.hash = view;
  window.scrollTo({ top: 0, behavior: "instant" });
}
async function action(name, target) {
  if (name.startsWith("go-")) return navigate(name.slice(3));
  switch (name) {
    case "toggle-password": {
      const input = document.getElementById(target.dataset.target);
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      target.setAttribute("aria-pressed", String(show));
      target.setAttribute(
        "aria-label",
        show ? "Parolayı gizle" : "Parolayı göster",
      );
      return;
    }
    case "close-dialog":
      dialog.close();
      return;
    case "open-nav":
      ctx.navOpen = true;
      render();
      document.querySelector(".nav-item")?.focus();
      return;
    case "close-nav":
      ctx.navOpen = false;
      render();
      document.querySelector(".mobile-menu")?.focus();
      return;
    case "profile-menu":
      ctx.profileOpen = !ctx.profileOpen;
      render();
      return;
    case "logout":
      if (ctx.noteDraft !== null) {
        navigate("roles");
        toast("Çıkış yapmadan önce kişisel notunu kaydet.");
        return;
      }
      await api("/api/auth/logout", { method: "POST", data: {} });
      resetSession();
      toast("Güvenle çıkış yaptın.");
      return;
    case "role":
      showRole(target.dataset.id);
      return;
    case "map-mode":
      ctx.mapMode = target.dataset.mode;
      render();
      revealSelectedZone();
      return;
    case "zoom-in":
      ctx.zoom = Math.min(1.75, ctx.zoom + 0.25);
      render();
      revealSelectedZone();
      return;
    case "zoom-out":
      ctx.zoom = Math.max(1, ctx.zoom - 0.25);
      render();
      revealSelectedZone();
      return;
    case "zoom-reset":
      ctx.zoom = 1;
      render();
      revealSelectedZone();
      return;
    case "print-role":
      document.body.classList.add("print-role");
      window.print();
      document.body.classList.remove("print-role");
      return;
    case "print-dialog":
      document.body.classList.add("print-dialog");
      window.print();
      document.body.classList.remove("print-dialog");
      return;
    case "add-member":
      newMember();
      return;
    case "generate-password": {
      const bytes = crypto.getRandomValues(new Uint8Array(12));
      const alphabet =
        "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      document.getElementById("field-password").value = Array.from(
        bytes,
        (b) => alphabet[b % alphabet.length],
      ).join("");
      return;
    }
    case "edit-member": {
      const m = ctx.state.members.find((m) => m.id === target.dataset.id);
      openModal(
        "Rol atamasını değiştir",
        `<p class="dialog-intro">${e(m.name)} için yeni rolü seç.</p>${modalForm("edit-member", `<label for="field-roleId">Rol</label><select id="field-roleId" name="roleId">${roleOptions(ctx.state.scenario.roles, m.role_id)}</select>`, "Rolü güncelle", `data-id="${m.id}"`)}`,
      );
      return;
    }
    case "edit-zone": {
      const z = ctx.state.scenario.zones.find(
        (z) => z.id === target.dataset.id,
      );
      openModal(
        e(z.name),
        modalForm(
          "zone",
          `<label for="field-status">Bölge durumu</label><select id="field-status" name="status">${Object.entries(
            statuses,
          )
            .map(
              ([key, s]) =>
                `<option value="${key}" ${z.status === key ? "selected" : ""}>${s.label}</option>`,
            )
            .join(
              "",
            )}</select><label for="field-note">Ekiple paylaşılacak not <span class="optional">(isteğe bağlı)</span></label><textarea id="field-note" name="note" maxlength="500" rows="4" placeholder="Bölgenin güncel durumunu kısaca yaz…">${e(z.note)}</textarea><p class="helper">Bu durum ve not, atölyedeki tüm katılımcılara görünür.</p>`,
          "Güncelle",
          `data-id="${z.id}"`,
        ),
      );
      return;
    }
    case "announcements":
      if (!ctx.state) return;
      openModal(
        "Atölyeden haberler",
        `${ctx.user.trainer ? `<div class="announcements-actions">${button("Duyuru oluştur", "new-announcement", "plus", "secondary")}</div>` : ""}${ctx.state.announcements.length ? ctx.state.announcements.map((a) => announcement(a, ctx.state.scenario.roles)).join("") : empty("bell", "Şimdilik her şey sakin.", "Eğitmeninin duyuruları burada görünecek.")}`,
        "announcements",
      );
      return;
    case "new-announcement":
      openModal(
        "Yeni duyuru",
        modalForm(
          "announcement",
          `<label for="field-roleId">Kim görsün?</label><select id="field-roleId" name="roleId"><option value="">Tüm ekip</option>${roleOptions(ctx.state.scenario.roles)}</select>` +
            field(
              "Başlık",
              "title",
              "",
              'required maxlength="100" placeholder="Kısa ve anlaşılır bir başlık"',
            ) +
            '<label for="field-message">Duyuru</label><textarea id="field-message" name="message" required maxlength="1200" rows="5" placeholder="Ekibinle paylaşmak istediğin yönlendirme…"></textarea>',
          "Duyuruyu paylaş",
        ),
      );
      return;
    case "demo-accounts": {
      const demo = await api("/api/demo-accounts", { method: "POST", data: {} });
      if (!ctx.workshops.some(workshop => workshop.id === demo.workshop.id)) ctx.workshops.unshift(demo.workshop);
      openModal("Örnek kullanıcılar",
        `<p class="dialog-intro">Her rol için bir örnek katılımcı hazır. Hesaplar <strong>${e(demo.workshop.name)}</strong> içinde çalışır.</p>
        <p class="demo-password">Ortak başlangıç parolası: <code>${e(demo.initialPassword)}</code></p>
        <p class="helper">Parola bir kullanıcı tarafından değiştirildiyse yeni parolası geçerlidir. Bu ekran mevcut parolaları, rol değişikliklerini veya notları sıfırlamaz.</p>
        <ul class="demo-accounts">${demo.accounts.map(account => `<li><strong>${e(account.roleName)}</strong><span>${e(account.name)}</span><code>${e(account.username)}</code></li>`).join("")}</ul>
        <p class="helper">Katılımcı görünümünü denemek için çıkış yapıp örnek kullanıcıyla giriş yap. Site erişimi ayrıca gerekli; bu hesaplar site paylaşım iznini değiştirmez.</p>
        <div class="dialog-actions">${button("Örnek atölyeyi aç", "open-demo", "arrow", "primary", `data-id="${demo.workshop.id}"`)}</div>`);
      return;
    }
    case "open-demo":
      if (ctx.noteDraft !== null) { toast("Atölyeyi değiştirmeden önce kişisel notunu kaydet."); return; }
      await loadWorkshop(target.dataset.id);
      dialog.close(); navigate("park");
      return;
    case "new-workshop":
      openModal(
        "Yeni bir atölye başlat",
        `<p class="dialog-intro">Yeni atölyenin ekibi, saati, bölge durumları ve duyuruları ayrı tutulur.</p>${modalForm("workshop", field("Atölye adı", "name", "", 'required maxlength="100" placeholder="Örnek: GRC · Operasyon ekibi"'), "Atölyeyi oluştur")}`,
      );
      return;
    case "start":
    case "pause":
      await mutate("clock", { action: name });
      render();
      toast(
        name === "start"
          ? "Atölye saati başladı."
          : "Atölye saati duraklatıldı.",
      );
      return;
    case "jump-phase": {
      const p = ctx.state.scenario.phases.find(
        (p) => p.id === target.dataset.id,
      );
      openModal(
        "Eğitim bölümünü değiştir",
        `<p class="dialog-intro"><strong>${e(p.name)}</strong> bölümünün başlangıcına geçilecek. Saat duraklatılacak; hazır olduğunda yeniden başlatabilirsin.</p>${modalForm("phase", `<input type="hidden" name="phase" value="${p.id}">`, "Bölüme geç")}`,
      );
      return;
    }
    case "profile":
      ctx.profileOpen = false;
      openModal(
        "Profilim",
        modalForm(
          "profile",
          field(
            "Ad soyad",
            "name",
            ctx.user.name,
            'required maxlength="80" autocomplete="name"',
          ) +
            `<p class="helper">Kullanıcı adın: <strong>${e(ctx.user.username)}</strong></p>`,
        ),
      );
      return;
    case "password":
      ctx.profileOpen = false;
      openModal(
        "Parolamı değiştir",
        `<p class="dialog-intro">Parolan değiştiğinde yeniden giriş yapman istenecek.</p>${modalForm("password", field("Mevcut parola", "current", "", 'type="password" required maxlength="200" autocomplete="current-password"') + field("Yeni parola", "password", "", 'type="password" required minlength="8" maxlength="200" autocomplete="new-password"'), "Parolayı değiştir")}`,
      );
      return;
  }
}
document.addEventListener("click", async (event) => {
  const navigation = event.target.closest('.sidebar a[href^="#"]');
  if (navigation && ctx.user) {
    event.preventDefault();
    navigate(navigation.getAttribute("href").slice(1));
    return;
  }
  const zone = event.target.closest("[data-zone]");
  if (zone) {
    ctx.selectedZone = zone.dataset.zone;
    render();
    return;
  }
  const target = event.target.closest("[data-action]");
  if (!target || target.disabled) return;
  if (
    busy &&
    !["close-dialog", "toggle-password"].includes(target.dataset.action)
  )
    return;
  try {
    busy = true;
    await action(target.dataset.action, target);
  } catch (error) {
    toast(error.message);
  } finally {
    busy = false;
  }
});
document.addEventListener("keydown", (event) => {
  const zone = event.target.closest("[data-zone]");
  if (
    zone &&
    zone.tagName.toLowerCase() === "g" &&
    ["Enter", " "].includes(event.key)
  ) {
    event.preventDefault();
    ctx.selectedZone = zone.dataset.zone;
    render();
  }
  if (
    event.key === "Escape" &&
    !dialog.open &&
    (ctx.navOpen || ctx.profileOpen)
  ) {
    const wasNavOpen = ctx.navOpen;
    ctx.navOpen = false;
    ctx.profileOpen = false;
    render();
    document.querySelector(wasNavOpen ? ".mobile-menu" : "#profile-toggle")?.focus();
  }
  if (event.key === "Tab" && ctx.navOpen && !dialog.open) {
    const items = [
      ...document.querySelectorAll(".sidebar a, .sidebar button"),
    ].filter((el) => el.offsetParent !== null);
    if (event.shiftKey && document.activeElement === items[0]) {
      event.preventDefault();
      items.at(-1)?.focus();
    } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
      event.preventDefault();
      items[0]?.focus();
    }
  }
});
document.addEventListener("input", (event) => {
  if (event.target.id === "team-search") {
    ctx.teamSearch = event.target.value;
    document.querySelector("#team-grid").innerHTML = teamCards(ctx);
  }
  if (event.target.id === "personal-note") {
    ctx.noteDraft = event.target.value;
    document.querySelector("#note-status").textContent =
      "Kaydedilmemiş değişiklik";
  }
});
document.addEventListener("change", async (event) => {
  if (event.target.id !== "workshop-select") return;
  if (busy) {
    event.target.value = ctx.state.workshop.id;
    return;
  }
  if (ctx.noteDraft !== null) {
    toast("Atölye değiştirmeden önce kişisel notunu kaydet.");
    event.target.value = ctx.state.workshop.id;
    return;
  }
  const previous = ctx.state.workshop.id;
  event.target.disabled = true;
  busy = true;
  try {
    await loadWorkshop(event.target.value);
  } catch (error) {
    event.target.value = previous;
    event.target.disabled = false;
    toast(error.message);
  } finally {
    busy = false;
  }
});
document.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-form]");
  if (!form) return;
  event.preventDefault();
  if (busy) return;
  const errorBox = form.querySelector(".form-error");
  errorBox.textContent = "";
  const data = Object.fromEntries(new FormData(form));
  const submit = form.querySelector('[type="submit"]');
  const old = submit.innerHTML;
  busy = true;
  submit.disabled = true;
  submit.innerHTML = '<span class="spinner"></span> Kaydediliyor…';
  try {
    switch (form.dataset.form) {
      case "login":
        await loadAccount(
          await api("/api/auth/login", { method: "POST", data, quiet: true }),
        );
        return;
      case "member":
        await mutate("members", data);
        dialog.close();
        toast(`${data.name} ekibe eklendi.`);
        break;
      case "edit-member":
        await mutate(`members/${form.dataset.id}`, data, "PATCH");
        dialog.close();
        toast("Rol ataması güncellendi.");
        break;
      case "zone":
        await mutate(`zones/${form.dataset.id}`, data, "PATCH");
        dialog.close();
        toast("Bölge durumu ekiple paylaşıldı.");
        break;
      case "announcement":
        await mutate("announcements", data);
        dialog.close();
        toast("Duyuru paylaşıldı.");
        break;
      case "phase":
        await mutate("clock", { action: "phase", phase: data.phase });
        dialog.close();
        toast("Bölüm değişti. Saat duraklatıldı.");
        break;
      case "note": {
        await api(endpoint("note"), { method: "PUT", data });
        ctx.state.note = data.text;
        // Keep edits made while the submitted version was on its way to the server.
        if (ctx.noteDraft === data.text) ctx.noteDraft = null;
        render();
        toast(ctx.noteDraft === null
          ? "Kişisel notun kaydedildi."
          : "Gönderdiğin not kaydedildi. Son eklediklerini de kaydetmeyi unutma.");
        break;
      }
      case "workshop": {
        const { workshop } = await api("/api/workshops", {
          method: "POST",
          data,
        });
        ctx.workshops.unshift(workshop);
        await loadWorkshop(workshop.id);
        dialog.close();
        toast("Yeni atölyen hazır.");
        break;
      }
      case "profile": {
        const result = await api("/api/me", { method: "PATCH", data });
        ctx.user = result.user;
        if (ctx.state) ctx.state.user = result.user;
        dialog.close();
        toast("Profilin güncellendi.");
        break;
      }
      case "password":
        await api("/api/password", { method: "POST", data });
        resetSession();
        toast("Parolan değişti. Yeni parolanla giriş yap.");
        break;
    }
  } catch (error) {
    if (errorBox.isConnected) {
      errorBox.textContent = error.message;
      errorBox.scrollIntoView({ block: "nearest" });
    } else toast(error.message);
  } finally {
    busy = false;
    if (submit.isConnected) {
      submit.disabled = false;
      submit.innerHTML = old;
    }
  }
});
window.addEventListener("hashchange", () => {
  readView();
  ctx.profileOpen = false;
  ctx.navOpen = false;
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
  document.querySelector("h1")?.setAttribute("tabindex", "-1");
  document.querySelector("h1")?.focus({ preventScroll: true });
});
document.querySelector(".skip-link")?.addEventListener("click", (event) => {
  event.preventDefault();
  const main = document.querySelector("#main");
  main?.setAttribute("tabindex", "-1");
  main?.focus();
});
window.addEventListener("beforeunload", (event) => {
  if (ctx.noteDraft !== null) {
    event.preventDefault();
    event.returnValue = "";
  }
});
window.addEventListener("online", () => refresh());
setInterval(() => {
  if (!document.hidden) refresh();
}, 4000);
setInterval(updateClock, 1000);
try {
  ctx.authOptions = await api("/api/auth/options", { quiet: true });
} catch { /* Password sign-in remains available if this optional request fails. */ }
const platformReturn = new URL(location.href);
if (platformReturn.searchParams.get("platform") === "1") {
  platformReturn.searchParams.delete("platform");
  history.replaceState(null, "", platformReturn.pathname + platformReturn.search + platformReturn.hash);
  try {
    await loadAccount(await api("/api/auth/platform", { method: "POST", data: {}, quiet: true }));
  } catch (error) {
    render();
    toast(error.message);
  }
} else {
  try {
    await loadAccount(await api("/api/me", { quiet: true }));
  } catch {
    render();
  }
}
