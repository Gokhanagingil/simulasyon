import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, extname, sep } from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { createStore, hashPassword, verifyPassword, digest } from "./store.js";
import {
  loadScenario,
  publicRole,
  elapsedSeconds,
  currentPhase,
} from "./content.js";

const publicRoot = resolve(
  fileURLToPath(new URL("../public/", import.meta.url)),
);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const required = (value, name, max = 120) => {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new HttpError(400, `${name} alanını kontrol et.`);
  return value.trim();
};
const secret = (value, name = "Parola") => {
  if (typeof value !== "string" || !value.length || value.length > 200)
    throw new HttpError(400, `${name} alanını kontrol et.`);
  return value;
};
const safeUser = (user) => ({
  id: user.id,
  username: user.username,
  name: user.name,
  trainer: !!user.trainer,
});

export function createApp(options = {}) {
  const scenario = options.scenario || loadScenario();
  const store = createStore(
    options.databasePath || "./data/mavi-vadi.sqlite",
    scenario,
    options.admin,
  );
  const { one, all, run } = store;
  const attempts = new Map();
  const secure = options.secureCookies ? "; Secure" : "";
  const cookie = (token) =>
    `mv_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800${secure}`;
  const roleExists = (id) => scenario.roles.some((role) => role.id === id);
  function auth(req) {
    const token = (req.headers.cookie || "")
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("mv_session="))
      ?.slice(11);
    const user =
      token &&
      one(
        "SELECT u.* FROM users u JOIN logins l ON u.id=l.user_id WHERE l.token=? AND l.expires>?",
        digest(token),
        Date.now(),
      );
    if (!user)
      throw new HttpError(401, "Oturumun sona ermiş. Lütfen tekrar giriş yap.");
    return user;
  }
  function access(id, user) {
    const workshop = one("SELECT * FROM workshops WHERE id=?", id);
    if (
      !workshop ||
      (!user.trainer &&
        !one(
          "SELECT 1 FROM memberships WHERE workshop_id=? AND user_id=?",
          id,
          user.id,
        ))
    )
      throw new HttpError(404, "Bu atölye bulunamadı.");
    return workshop;
  }
  function trainer(user) {
    if (!user.trainer)
      throw new HttpError(403, "Bu işlemi eğitmenin yapabilir.");
  }
  function workshops(user) {
    return user.trainer
      ? all("SELECT * FROM workshops ORDER BY created_at DESC")
      : all(
          "SELECT w.* FROM workshops w JOIN memberships m ON w.id=m.workshop_id WHERE m.user_id=? ORDER BY w.created_at DESC",
          user.id,
        );
  }
  function state(id, user) {
    let workshop = access(id, user);
    const seconds = elapsedSeconds(workshop);
    if (seconds >= 14400 && workshop.status === "running") {
      run(
        "UPDATE workshops SET elapsed=14400, started_at=NULL, status='completed' WHERE id=?",
        id,
      );
      workshop = one("SELECT * FROM workshops WHERE id=?", id);
    }
    const membership = one(
      "SELECT role_id FROM memberships WHERE workshop_id=? AND user_id=?",
      id,
      user.id,
    );
    const roles = scenario.roles.map((role) =>
      user.trainer || membership?.role_id === role.id ? role : publicRole(role),
    );
    const zones = scenario.zones.map((zone) => ({
      ...zone,
      ...one(
        "SELECT status,note FROM zone_states WHERE workshop_id=? AND zone_id=?",
        id,
        zone.id,
      ),
    }));
    return {
      workshop: { ...workshop, elapsed_seconds: seconds },
      user: safeUser(user),
      roleId: membership?.role_id || null,
      scenario: {
        id: scenario.id,
        version: scenario.version,
        name: scenario.name,
        description: scenario.description,
        phases: scenario.phases,
        guides: scenario.guides,
        roles,
        zones,
      },
      phase: currentPhase(scenario.phases, seconds),
      members: all(
        "SELECT u.id,u.name,u.username,m.role_id FROM users u JOIN memberships m ON u.id=m.user_id WHERE m.workshop_id=? ORDER BY u.name",
        id,
      ),
      announcements: user.trainer
        ? all(
            "SELECT * FROM announcements WHERE workshop_id=? ORDER BY created_at DESC LIMIT 30",
            id,
          )
        : all(
            "SELECT * FROM announcements WHERE workshop_id=? AND (role_id IS NULL OR role_id=?) ORDER BY created_at DESC LIMIT 30",
            id,
            membership?.role_id || "",
          ),
      note:
        one(
          "SELECT text FROM notes WHERE workshop_id=? AND user_id=?",
          id,
          user.id,
        )?.text || "",
      activity: user.trainer
        ? all(
            "SELECT a.*,u.name AS actor FROM activity a JOIN users u ON u.id=a.actor_id WHERE workshop_id=? ORDER BY created_at DESC LIMIT 20",
            id,
          )
        : [],
    };
  }
  async function body(req) {
    let text = "";
    for await (const chunk of req) {
      text += chunk;
      if (Buffer.byteLength(text) > 32768)
        throw new HttpError(413, "Bu içerik çok uzun.");
    }
    try {
      const data = JSON.parse(text || "{}");
      if (!data || typeof data !== "object" || Array.isArray(data))
        throw new Error();
      return data;
    } catch {
      throw new HttpError(400, "Gönderilen bilgi okunamadı.");
    }
  }
  const server = createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
    const send = (status, data) => {
      res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(data));
    };
    try {
      const url = new URL(req.url, "http://localhost");
      const path = url.pathname;
      if (req.method === "GET" && path === "/health")
        return send(200, { ok: true });
      if (!path.startsWith("/api/")) {
        if (!["GET", "HEAD"].includes(req.method))
          throw new HttpError(405, "Bu işlem desteklenmiyor.");
        let decoded;
        try {
          decoded = decodeURIComponent(path);
        } catch {
          throw new HttpError(400, "Geçersiz adres.");
        }
        const file = resolve(
          publicRoot,
          "." + (decoded === "/" ? "/index.html" : decoded),
        );
        if (!file.startsWith(publicRoot + sep))
          throw new HttpError(404, "Sayfa bulunamadı.");
        try {
          const content = await readFile(file);
          res.writeHead(200, {
            "Content-Type": mime[extname(file)] || "application/octet-stream",
            "Cache-Control": "no-cache",
          });
          return res.end(req.method === "HEAD" ? undefined : content);
        } catch {
          throw new HttpError(404, "Sayfa bulunamadı.");
        }
      }
      if (!["GET", "HEAD"].includes(req.method)) {
        if (req.headers["sec-fetch-site"] === "cross-site")
          throw new HttpError(403, "İstek doğrulanamadı.");
        if (req.headers.origin) {
          let origin;
          try {
            origin = new URL(req.headers.origin);
          } catch {
            throw new HttpError(403, "İstek doğrulanamadı.");
          }
          if (origin.host !== req.headers.host)
            throw new HttpError(403, "İstek doğrulanamadı.");
        }
        if (!(req.headers["content-type"] || "").startsWith("application/json"))
          throw new HttpError(415, "JSON içerik bekleniyor.");
      }
      if (path === "/api/auth/login" && req.method === "POST") {
        const input = await body(req);
        const username = required(
          input.username,
          "Kullanıcı adı",
          40,
        ).toLocaleLowerCase("en");
        const password = secret(input.password);
        const key = `${req.socket.remoteAddress}:${username}`;
        const last = attempts.get(key);
        if (last && last.until > Date.now() && last.count >= 20)
          throw new HttpError(
            429,
            "Çok sayıda deneme yapıldı. Birkaç dakika sonra tekrar dene.",
          );
        const user = one("SELECT * FROM users WHERE username=?", username);
        if (!user || !verifyPassword(password, user.password)) {
          attempts.set(key, {
            count: last?.until > Date.now() ? last.count + 1 : 1,
            until: Date.now() + 300000,
          });
          if (attempts.size > 1000)
            for (const [k, v] of attempts)
              if (v.until < Date.now()) attempts.delete(k);
          throw new HttpError(401, "Kullanıcı adı veya parola doğru değil.");
        }
        attempts.delete(key);
        const token = randomBytes(32).toString("hex");
        run(
          "INSERT INTO logins VALUES(?,?,?)",
          digest(token),
          user.id,
          Date.now() + 28800000,
        );
        res.setHeader("Set-Cookie", cookie(token));
        return send(200, { user: safeUser(user), workshops: workshops(user) });
      }
      const user = auth(req);
      if (path === "/api/auth/logout" && req.method === "POST") {
        const token = (req.headers.cookie || "")
          .split(";")
          .map((s) => s.trim())
          .find((s) => s.startsWith("mv_session="))
          ?.slice(11);
        if (token) run("DELETE FROM logins WHERE token=?", digest(token));
        res.setHeader(
          "Set-Cookie",
          `mv_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
        );
        return send(200, { ok: true });
      }
      if (path === "/api/me" && req.method === "GET")
        return send(200, { user: safeUser(user), workshops: workshops(user) });
      if (path === "/api/me" && req.method === "PATCH") {
        const input = await body(req);
        const name = required(input.name, "Ad soyad", 80);
        run("UPDATE users SET name=? WHERE id=?", name, user.id);
        return send(200, { user: safeUser({ ...user, name }) });
      }
      if (path === "/api/password" && req.method === "POST") {
        const input = await body(req);
        if (
          !verifyPassword(secret(input.current, "Mevcut parola"), user.password)
        )
          throw new HttpError(400, "Mevcut parolanı kontrol et.");
        const password = secret(input.password, "Yeni parola");
        if (password.length < 8)
          throw new HttpError(400, "Yeni parola en az 8 karakter olmalı.");
        run(
          "UPDATE users SET password=? WHERE id=?",
          hashPassword(password),
          user.id,
        );
        run("DELETE FROM logins WHERE user_id=?", user.id);
        res.setHeader(
          "Set-Cookie",
          `mv_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
        );
        return send(200, { ok: true });
      }
      if (path === "/api/workshops" && req.method === "POST") {
        trainer(user);
        const input = await body(req);
        const workshop = store.createWorkshop(
          required(input.name, "Atölye adı", 100),
        );
        store.log(workshop.id, user.id, "Atölye oluşturuldu.");
        return send(201, { workshop });
      }
      const match = path.match(
        /^\/api\/workshops\/([a-f0-9-]+)(?:\/(state|clock|members|zones|announcements|note))?(?:\/([a-zA-Z0-9-]+))?$/,
      );
      if (!match) throw new HttpError(404, "İşlem bulunamadı.");
      const [, id, resource, target] = match;
      const workshop = access(id, user);
      if (resource === "state" && req.method === "GET")
        return send(200, state(id, user));
      if (resource === "note" && req.method === "PUT") {
        const input = await body(req);
        if (typeof input.text !== "string" || input.text.length > 4000)
          throw new HttpError(400, "Not en fazla 4000 karakter olabilir.");
        run(
          "INSERT INTO notes VALUES(?,?,?) ON CONFLICT(workshop_id,user_id) DO UPDATE SET text=excluded.text",
          id,
          user.id,
          input.text,
        );
        return send(200, { ok: true });
      }
      trainer(user);
      const input = await body(req);
      if (resource === "clock" && req.method === "POST") {
        let elapsed = elapsedSeconds(workshop),
          status = workshop.status,
          started = null;
        if (input.action === "start") {
          if (elapsed >= 14400)
            throw new HttpError(
              400,
              "Atölye tamamlandı. Yeni bir atölye oluşturabilirsin.",
            );
          status = "running";
          started = Date.now();
        } else if (input.action === "pause") {
          if (status !== "completed") status = "paused";
        } else if (input.action === "phase") {
          const index = scenario.phases.findIndex((p) => p.id === input.phase);
          if (index < 0) throw new HttpError(400, "Bölüm bulunamadı.");
          elapsed = scenario.phases
            .slice(0, index)
            .reduce((n, p) => n + p.minutes * 60, 0);
          status = "paused";
        } else throw new HttpError(400, "Saat işlemi bulunamadı.");
        run(
          "UPDATE workshops SET elapsed=?,status=?,started_at=? WHERE id=?",
          elapsed,
          status,
          started,
          id,
        );
        store.log(
          id,
          user.id,
          input.action === "start"
            ? "Oturum başlatıldı."
            : input.action === "pause"
              ? "Oturum duraklatıldı."
              : "Eğitim bölümü değiştirildi.",
        );
      } else if (resource === "members" && req.method === "POST") {
        const username = required(
          input.username,
          "Kullanıcı adı",
          40,
        ).toLocaleLowerCase("en");
        if (!/^[a-z0-9._-]{3,40}$/.test(username))
          throw new HttpError(
            400,
            "Kullanıcı adı 3–40 harf, rakam, nokta, alt çizgi veya tire içermeli.",
          );
        const name = required(input.name, "Ad soyad", 80);
        const password = secret(input.password);
        if (password.length < 8)
          throw new HttpError(400, "Parola en az 8 karakter olmalı.");
        if (!roleExists(input.roleId)) throw new HttpError(400, "Bir rol seç.");
        if (one("SELECT id FROM users WHERE username=?", username))
          throw new HttpError(
            409,
            "Bu kullanıcı adı kullanılıyor. Başka bir ad seç.",
          );
        const uid = randomUUID();
        run(
          "INSERT INTO users VALUES(?,?,?,?,0)",
          uid,
          username,
          name,
          hashPassword(password),
        );
        run("INSERT INTO memberships VALUES(?,?,?)", id, uid, input.roleId);
        store.log(id, user.id, `${name} atölyeye katıldı.`);
      } else if (resource === "members" && target && req.method === "PATCH") {
        if (!roleExists(input.roleId)) throw new HttpError(400, "Bir rol seç.");
        if (
          !one(
            "SELECT 1 FROM memberships WHERE workshop_id=? AND user_id=?",
            id,
            target,
          )
        )
          throw new HttpError(404, "Katılımcı bulunamadı.");
        run(
          "UPDATE memberships SET role_id=? WHERE workshop_id=? AND user_id=?",
          input.roleId,
          id,
          target,
        );
        store.log(id, user.id, "Katılımcı rolü güncellendi.");
      } else if (resource === "zones" && target && req.method === "PATCH") {
        if (!scenario.zones.some((zone) => zone.id === target))
          throw new HttpError(404, "Bölge bulunamadı.");
        if (!["open", "monitor", "closed"].includes(input.status))
          throw new HttpError(400, "Bölge durumu geçersiz.");
        if (typeof input.note !== "string" || input.note.length > 500)
          throw new HttpError(400, "Not en fazla 500 karakter olabilir.");
        run(
          "UPDATE zone_states SET status=?,note=? WHERE workshop_id=? AND zone_id=?",
          input.status,
          input.note,
          id,
          target,
        );
        store.log(
          id,
          user.id,
          `${scenario.zones.find((z) => z.id === target).name} durumu güncellendi.`,
        );
      } else if (resource === "announcements" && req.method === "POST") {
        const title = required(input.title, "Başlık", 100),
          message = required(input.message, "Mesaj", 1200);
        if (input.roleId && !roleExists(input.roleId))
          throw new HttpError(400, "Alıcı rol bulunamadı.");
        run(
          "INSERT INTO announcements VALUES(?,?,?,?,?,?)",
          randomUUID(),
          id,
          title,
          message,
          input.roleId || null,
          Date.now(),
        );
        store.log(id, user.id, "Yeni duyuru paylaşıldı.");
      } else throw new HttpError(404, "İşlem bulunamadı.");
      return send(200, state(id, user));
    } catch (error) {
      if (!error.status) console.error(error);
      if (!res.headersSent)
        send(error.status || 500, {
          error: error.status
            ? error.message
            : "İşlem tamamlanamadı. Lütfen tekrar dene.",
        });
      else res.end();
    }
  });
  server.on("close", () => store.db.close());
  return { server, store, scenario };
}
