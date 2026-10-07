import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { createApp } from "../server/app.js";

async function fixture(t) {
  const password = randomBytes(16).toString("base64url");
  const app = createApp({
    databasePath: ":memory:",
    admin: { username: "trainer", password, name: "Deniz Yılmaz" },
  });
  app.server.listen(0, "127.0.0.1");
  await once(app.server, "listening");
  const base = `http://127.0.0.1:${app.server.address().port}`;
  let browser;
  t.after(async () => {
    if (browser) await browser.close();
    await new Promise((done) => app.server.close(done));
  });
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const errors = [];
  const newContext = async (options) => {
    const context = await browser.newContext(options);
    context.setDefaultTimeout(10000);
    context.on("page", (page) => page.on("pageerror", (error) => errors.push(error.message)));
    return context;
  };
  const trainer = await newContext({ viewport: { width: 1440, height: 1100 } });
  const login = await trainer.request.post(base + "/api/auth/login", {
    data: { username: "trainer", password },
  });
  assert.equal(login.status(), 200);
  const workshop = (await login.json()).workshops[0];
  const endpoint = base + "/api/workshops/" + workshop.id;
  const request = async (resource, data, method = "post") => {
    const response = await trainer.request[method](endpoint + "/" + resource, { data });
    assert.equal(response.status(), 200, await response.text());
    return response.json();
  };
  async function participant() {
    const state = await request("members", {
      name: "Ece Demir", username: "ece", password, roleId: "R3",
    });
    const context = await newContext({ viewport: { width: 1440, height: 1000 } });
    await context.request.post(base + "/api/auth/login", { data: { username: "ece", password } });
    const page = await context.newPage();
    await page.goto(base + "/#roles");
    await page.locator("#personal-note").waitFor();
    return { page, context, member: state.members[0] };
  }
  return { base, endpoint, password, trainer, newContext, request, participant, errors };
}

const pollNow = (page) => page.evaluate(() => window.dispatchEvent(new Event("online")));

test("trainer and participant complete the foundation workflow in separate sessions", async (t) => {
  const f = await fixture(t);
  const page = await f.trainer.newPage();
  await page.goto(f.base);
  await page.getByRole("heading", { name: "Parkta yeni bir gün." }).waitFor();
  await page.locator("#nav-team").click();
  await page.getByRole("button", { name: "Katılımcı ekle", exact: true }).click();
  await page.getByLabel("Ad soyad", { exact: true }).fill("Ece Demir");
  await page.getByLabel("Kullanıcı adı", { exact: true }).fill("ece");
  await page.getByLabel("Başlangıç parolası", { exact: true }).fill(f.password);
  await page.getByLabel("Atölyedeki rolü").selectOption("R3");
  await page.getByRole("button", { name: "Katılımcıyı ekle", exact: true }).click();
  await page.getByRole("heading", { name: "Ece Demir" }).waitFor();

  const context = await f.newContext();
  const person = await context.newPage();
  await person.goto(f.base);
  await person.getByLabel("Kullanıcı adı", { exact: true }).fill("ece");
  await person.getByLabel("Parola", { exact: true }).fill("wrong-password");
  await person.getByRole("button", { name: "Parka giriş yap" }).click();
  await person.getByText("Kullanıcı adı veya parola doğru değil.", { exact: true }).waitFor();
  await person.getByLabel("Parola", { exact: true }).fill(f.password);
  await person.getByRole("button", { name: "Parka giriş yap" }).click();
  await person.getByRole("heading", { name: "Parkta yeni bir gün." }).waitFor();
  assert.equal(await person.locator("#nav-manage").count(), 0);
  await person.locator("#nav-roles").click();
  await person.getByRole("heading", { name: "Hayvan bakım sorumluları", exact: true }).waitFor();
  await person.locator("#personal-note").fill("Vardiya devrini ekiple teyit et.");
  await person.getByRole("button", { name: "Kaydet", exact: true }).click();
  await person.getByText("Kişisel notun kaydedildi.", { exact: true }).waitFor();
  await person.reload();
  await person.locator("#personal-note").waitFor();
  assert.equal(await person.locator("#personal-note").inputValue(), "Vardiya devrini ekiple teyit et.");

  await page.locator("#nav-park").click();
  await page.locator('[data-zone="savanna"]').press("Enter");
  await page.getByRole("button", { name: "Bölgeyi güncelle" }).click();
  await page.getByLabel("Bölge durumu").selectOption("monitor");
  await page.getByLabel("Ekiple paylaşılacak not").fill("Vardiya devri teyit ediliyor.");
  await page.getByRole("button", { name: "Güncelle", exact: true }).click();
  await page.locator("dialog").waitFor({ state: "hidden" });
  await person.locator("#nav-park").click();
  await pollNow(person);
  await person.getByText("Vardiya devri teyit ediliyor.", { exact: true }).waitFor();

  await page.locator("#nav-flow").click();
  await page.getByRole("button", { name: "Oturumu başlat", exact: true }).click();
  await page.getByRole("button", { name: "Duraklat", exact: true }).waitFor();
  await page.getByRole("button", { name: "Duraklat", exact: true }).click();
  await page.getByText("Oturum duraklatıldı", { exact: true }).waitFor();
  assert.deepEqual(f.errors, []);
});

test("a live role change replaces the old briefing without losing the focused draft", async (t) => {
  const f = await fixture(t), { page, member } = await f.participant();
  const draft = "Henüz kaydetmediğim gözlem";
  await page.locator("#personal-note").fill(draft);
  await f.request("members/" + member.id, { roleId: "R4" }, "patch");
  await pollNow(page);
  await page.getByRole("heading", { name: "Teknik bakım ve tesis", exact: true }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "Hayvan bakım sorumluları", exact: true }).count(), 0);
  assert.equal(await page.locator("#personal-note").inputValue(), draft);
  assert.equal(await page.locator("#personal-note").evaluate(el => document.activeElement === el), true);
  assert.equal(await page.locator("#personal-note").evaluate(el => el.selectionStart), draft.length);
  assert.equal(await page.locator("#note-status").innerText(), "Kaydedilmemiş değişiklik");
  assert.deepEqual(f.errors, []);
});

test("slow saves keep new edits and stale polls cannot revert saved notes", async (t) => {
  const f = await fixture(t), { page, context } = await f.participant();
  let releaseSave, caughtSave;
  const saveStarted = new Promise(r => { caughtSave = r; });
  const saveReleased = new Promise(r => { releaseSave = r; });
  await page.route("**/note", async route => {
    caughtSave(); await saveReleased; await route.continue();
  });
  await page.locator("#personal-note").fill("İlk sürüm");
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await saveStarted;
  await page.locator("#personal-note").fill("İlk sürüm ve yeni satır");
  releaseSave();
  await page.getByText("Gönderdiğin not kaydedildi. Son eklediklerini de kaydetmeyi unutma.", { exact: true }).waitFor();
  assert.equal(await page.locator("#personal-note").inputValue(), "İlk sürüm ve yeni satır");
  assert.equal((await (await context.request.get(f.endpoint + "/state")).json()).note, "İlk sürüm");
  await page.unroute("**/note");

  let releasePoll, caughtPoll;
  const pollStarted = new Promise(r => { caughtPoll = r; });
  const pollReleased = new Promise(r => { releasePoll = r; });
  await page.route("**/state", async route => {
    const old = await route.fetch();
    caughtPoll(); await pollReleased; await route.fulfill({ response: old });
  });
  await pollNow(page); await pollStarted;
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await page.getByText("Kişisel notun kaydedildi.", { exact: true }).waitFor();
  const pollFinished = page.waitForResponse(r => r.url().endsWith("/state"));
  releasePoll(); await pollFinished;
  await page.unroute("**/state");
  await page.locator("#nav-team").click();
  await page.locator("#nav-roles").click();
  assert.equal(await page.locator("#personal-note").inputValue(), "İlk sürüm ve yeni satır");
  assert.deepEqual(f.errors, []);
});

test("connection changes remain visible while a participant is typing", async (t) => {
  const f = await fixture(t), { page } = await f.participant();
  await page.locator("#personal-note").fill("Bağlantıdan bağımsız taslak");
  await page.route("**/state", route => route.abort());
  await pollNow(page);
  await page.locator(".connection-banner").waitFor({ state: "visible" });
  assert.equal(await page.locator("#personal-note").inputValue(), "Bağlantıdan bağımsız taslak");
  assert.equal(await page.locator("#personal-note").evaluate(el => document.activeElement === el), true);
  await page.unroute("**/state");
  await pollNow(page);
  await page.locator(".connection-banner").waitFor({ state: "hidden" });
  assert.equal(await page.locator("#personal-note").inputValue(), "Bağlantıdan bağımsız taslak");
  assert.deepEqual(f.errors, []);
});

test("desktop, tablet and phone layouts preserve navigation and map access", async (t) => {
  const f = await fixture(t);
  const page = await f.trainer.newPage();
  const screenshotDir = process.env.SCREENSHOT_DIR;
  if (screenshotDir) await mkdir(screenshotDir, { recursive: true });
  await page.goto(f.base);
  await page.getByRole("heading", { name: "Parkta yeni bir gün." }).waitFor();
  if (screenshotDir) await page.screenshot({ path: resolve(screenshotDir, "qa-desktop.png"), fullPage: true });
  for (const width of [1440, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 900 });
    for (const view of ["park", "roles", "team", "flow", "guide", "manage"]) {
      const menu = page.getByRole("button", { name: "Menüyü aç", exact: true });
      if (await menu.isVisible()) await menu.click();
      await page.locator("#nav-" + view).click();
      await page.locator(".app-shell:not(.nav-open)").waitFor();
      assert.ok(await page.locator("h1").isVisible());
      const size = await page.evaluate(() => ({
        width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth,
      }));
      assert.ok(size.scroll <= size.width + 1, `${view} overflows at ${width}px`);
    }
    await page.goto(f.base + "/#park");
    await page.getByRole("button", { name: "Bölgeler", exact: true }).click();
    await page.locator('.zone-list-item[data-zone="water"]').click();
    await page.locator(".zone-detail").getByRole("heading", { name: "Su Yaşamı Merkezi" }).waitFor();
    await page.getByRole("button", { name: "Harita", exact: true }).click();
    const selectedVisible = await page.locator('#map-scroll [data-zone="water"] .zone-label').evaluate(el => {
      const label = el.getBoundingClientRect(), map = el.closest("#map-scroll").getBoundingClientRect();
      return label.left >= map.left && label.right <= map.right;
    });
    assert.equal(selectedVisible, true, `selected region is outside the map at ${width}px`);
    if (width === 360) {
      await page.getByRole("button", { name: "Menüyü aç", exact: true }).click();
      await page.locator("#nav-park").press("Escape");
      assert.equal(await page.locator(".mobile-menu").evaluate(el => document.activeElement === el), true);
    }
    if (screenshotDir && width === 390)
      await page.screenshot({ path: resolve(screenshotDir, "qa-mobile.png"), fullPage: true });
  }
  assert.deepEqual(f.errors, []);
});
