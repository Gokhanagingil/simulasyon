import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 32).toString("hex")}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const candidate = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
}

export const digest = (value) =>
  createHash("sha256").update(value).digest("hex");

export function createStore(path, scenario, admin = {}) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password TEXT NOT NULL, trainer INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS logins(token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS workshops(id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT UNIQUE NOT NULL, scenario_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ready', elapsed INTEGER NOT NULL DEFAULT 0, started_at INTEGER, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS memberships(workshop_id TEXT NOT NULL REFERENCES workshops(id), user_id TEXT NOT NULL REFERENCES users(id), role_id TEXT NOT NULL, PRIMARY KEY(workshop_id,user_id));
    CREATE TABLE IF NOT EXISTS zone_states(workshop_id TEXT NOT NULL REFERENCES workshops(id), zone_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', note TEXT NOT NULL DEFAULT '', PRIMARY KEY(workshop_id,zone_id));
    CREATE TABLE IF NOT EXISTS announcements(id TEXT PRIMARY KEY, workshop_id TEXT NOT NULL REFERENCES workshops(id), title TEXT NOT NULL, message TEXT NOT NULL, role_id TEXT, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS notes(workshop_id TEXT NOT NULL REFERENCES workshops(id), user_id TEXT NOT NULL REFERENCES users(id), text TEXT NOT NULL DEFAULT '', PRIMARY KEY(workshop_id,user_id));
    CREATE TABLE IF NOT EXISTS activity(id TEXT PRIMARY KEY, workshop_id TEXT NOT NULL REFERENCES workshops(id), actor_id TEXT NOT NULL REFERENCES users(id), message TEXT NOT NULL, created_at INTEGER NOT NULL);
  `);
  const one = (sql, ...args) => db.prepare(sql).get(...args);
  const all = (sql, ...args) => db.prepare(sql).all(...args);
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const createWorkshop = (name) => {
    const id = randomUUID();
    run(
      "INSERT INTO workshops(id,name,code,scenario_id,created_at) VALUES(?,?,?,?,?)",
      id,
      name,
      `MV-${randomBytes(3).toString("hex").toUpperCase()}`,
      scenario.id,
      Date.now(),
    );
    for (const zone of scenario.zones)
      run(
        "INSERT INTO zone_states(workshop_id,zone_id,status) VALUES(?,?,?)",
        id,
        zone.id,
        zone.initialStatus || "open",
      );
    return one("SELECT * FROM workshops WHERE id=?", id);
  };
  let bootstrap = null;
  if (!one("SELECT id FROM users WHERE trainer=1")) {
    const password = admin.password || randomBytes(12).toString("base64url");
    if (password.length < 8)
      throw new Error("ADMIN_PASSWORD must contain at least 8 characters");
    const username = (admin.username || "egitmen")
      .trim()
      .toLocaleLowerCase("en");
    if (!/^[a-z0-9._-]{3,40}$/.test(username))
      throw new Error(
        "ADMIN_USERNAME must contain 3–40 lowercase letters, numbers, dots, underscores or hyphens",
      );
    run(
      "INSERT INTO users VALUES(?,?,?,?,1)",
      randomUUID(),
      username,
      admin.name || "Eğitmen",
      hashPassword(password),
    );
    bootstrap = { username, password, generated: !admin.password };
  }
  if (!one("SELECT id FROM workshops"))
    createWorkshop("Mavi Vadi · İlk atölye");
  run("DELETE FROM logins WHERE expires<?", Date.now());
  return {
    db,
    one,
    all,
    run,
    createWorkshop,
    bootstrap,
    log(workshop, actor, message) {
      run(
        "INSERT INTO activity VALUES(?,?,?,?,?)",
        randomUUID(),
        workshop,
        actor,
        message,
        Date.now(),
      );
    },
  };
}
