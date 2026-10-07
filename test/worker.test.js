import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { createD1Store } from '../server/d1-store.js';
import { createHandler } from '../server/handler.js';
import * as passwords from '../server/worker-passwords.js';
import { loadScenario } from '../server/content.js';

// Runs the actual deployment migration and D1 adapter against SQLite. The async
// D1 contract catches accidental reliance on the synchronous local adapter.
async function fixture(t) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys=ON');
  for (const file of readdirSync('drizzle').filter(f => f.endsWith('.sql')).sort())
    sqlite.exec(readFileSync(`drizzle/${file}`, 'utf8'));
  t.after(() => sqlite.close());
  const db = {
    prepare(sql) {
      return { bind(...args) {
        return {
          first: async () => sqlite.prepare(sql).get(...args) || null,
          all: async () => ({ results: sqlite.prepare(sql).all(...args) }),
          run: async () => sqlite.prepare(sql).run(...args),
        };
      } };
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        sqlite.exec('COMMIT');
        return results;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  const scenario = loadScenario();
  const admin = { name: 'Test Eğitmeni', password: 'initial-test-password-938' };
  let store, handler;
  async function restart() {
    store = await createD1Store(db, scenario, admin);
    handler = createHandler({ store, scenario, passwords, secureCookies: true, platformOwnerEmail: 'owner@example.test' });
  }
  await restart();
  function client(identity = {}) {
    let cookie = '';
    async function request(path, method = 'GET', data) {
      const response = await handler(new Request(`https://workshop.example.test${path}`, {
        method, headers: { ...identity, ...(cookie ? { Cookie: cookie } : {}), ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}) },
        body: data === undefined ? undefined : JSON.stringify(data),
      }));
      if (response.headers.has('Set-Cookie')) cookie = response.headers.get('Set-Cookie').split(';')[0];
      return { status: response.status, headers: response.headers, body: await response.json() };
    }
    return { request, login: (username, password) => request('/api/auth/login', 'POST', { username, password }) };
  }
  return { client, restart, getStore: () => store };
}

test('deployed migration and async D1 store preserve workshops, private notes and roles across instances', async t => {
  const f = await fixture(t), trainer = f.client();
  const login = await trainer.login('egitmen', 'initial-test-password-938');
  assert.equal(login.status, 200);
  assert.match(login.headers.get('Set-Cookie'), /HttpOnly; SameSite=Lax; Max-Age=28800; Secure/);
  const path = `/api/workshops/${login.body.workshops[0].id}`;
  assert.equal((await trainer.request(`${path}/members`, 'POST', {
    username: 'member', name: 'Katılımcı', password: 'participant-password-928', roleId: 'R3',
  })).status, 200);
  const participant = f.client();
  assert.equal((await participant.login('member', 'participant-password-928')).status, 200);
  assert.equal((await participant.request(`${path}/note`, 'PUT', { text: 'Kalıcı kişisel not' })).status, 200);
  await trainer.request(`${path}/zones/water`, 'PATCH', { status: 'monitor', note: 'Kontrol bekleniyor' });
  const other = await trainer.request('/api/workshops', 'POST', { name: 'İkinci oturum' });
  assert.equal(other.status, 201);
  assert.equal((await participant.request(`/api/workshops/${other.body.workshop.id}/state`)).status, 404);
  assert.equal((await participant.request(`${path}/clock`, 'POST', { action: 'start' })).status, 403);
  await f.restart();
  const state = await participant.request(`${path}/state`);
  assert.equal(state.status, 200);
  assert.equal(state.body.note, 'Kalıcı kişisel not');
  assert.equal(state.body.scenario.zones.length, 8);
  assert.equal(state.body.scenario.zones.find(z => z.id === 'water').status, 'monitor');
  assert.ok(state.body.scenario.roles.find(r => r.id === 'R3').briefing);
  assert.equal(state.body.scenario.roles.find(r => r.id === 'R4').briefing, undefined);
  assert.equal((await trainer.request(`${path}/state`)).body.note, '');
  assert.equal((await trainer.request('/api/me')).body.workshops.length, 2);
  assert.equal((await f.getStore().all('SELECT * FROM users WHERE trainer=1')).length, 1);
});

test('platform trainer sign-in binds only the configured owner and then uses the stable identity', async t => {
  const f = await fixture(t);
  const login = client => client.request('/api/auth/platform', 'POST', {});
  assert.equal((await login(f.client())).status, 401);
  assert.equal((await login(f.client({ 'oai-authenticated-user-id': 'outsider', 'oai-authenticated-user-email': 'someone@example.test' }))).status, 403);
  const owner = f.client({ 'oai-authenticated-user-id': 'owner-id', 'oai-authenticated-user-email': 'owner@example.test' });
  const result = await login(owner);
  assert.equal(result.status, 200);
  assert.equal(result.body.user.trainer, true);
  assert.equal(result.body.user.platform, true);
  assert.equal((await owner.request('/api/me')).body.user.platform, true);
  assert.equal((await login(f.client({ 'oai-authenticated-user-id': 'different-id', 'oai-authenticated-user-email': 'owner@example.test' }))).status, 403);
  await f.restart();
  assert.equal((await login(f.client({ 'oai-authenticated-user-id': 'owner-id', 'oai-authenticated-user-email': 'updated@example.test' }))).status, 200);
});

test('Worker password hashes reject incorrect passwords and malformed hashes', async () => {
  const hash = await passwords.hashPassword('correct-horse-test');
  assert.equal(await passwords.verifyPassword('correct-horse-test', hash), true);
  assert.equal(await passwords.verifyPassword('incorrect', hash), false);
  assert.equal(await passwords.verifyPassword('incorrect', 'invalid'), false);
});
