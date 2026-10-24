import { hashPassword } from './worker-passwords.js';

export async function createD1Store(db, scenario, admin) {
  if (!db) throw new Error('The DB binding is required.');
  const statement = (sql, args) => db.prepare(sql).bind(...args);
  const one = (sql, ...args) => statement(sql, args).first();
  const all = async (sql, ...args) => (await statement(sql, args).all()).results;
  const run = (sql, ...args) => statement(sql, args).run();
  const batch = statements => db.batch(statements.map(([sql, args]) => statement(sql, args)));

  async function createWorkshop(name, initial = false) {
    const id = initial ? 'ed006e83-fce5-4c43-a74e-2b4b36e46839' : crypto.randomUUID();
    const code = initial ? 'MV-START' : `MV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const insert = initial ? 'INSERT OR IGNORE' : 'INSERT';
    await batch([
      [`${insert} INTO workshops(id,name,code,scenario_id,created_at) VALUES(?,?,?,?,?)`, [id, name, code, scenario.id, Date.now()]],
      ...scenario.zones.map(zone => [`${insert} INTO zone_states(workshop_id,zone_id,status) VALUES(?,?,?)`, [id, zone.id, zone.initialStatus || 'open']]),
    ]);
    return one('SELECT * FROM workshops WHERE id=?', id);
  }

  // Migrations create tables before deployment. Requests only initialize data.
  // Stable bootstrap IDs make simultaneous first requests idempotent.
  if (!await one('SELECT id FROM users WHERE trainer=1')) {
    if (!admin.password || admin.password.length < 16) throw new Error('ADMIN_PASSWORD must contain at least 16 characters.');
    await run('INSERT OR IGNORE INTO users(id,username,name,password,trainer) VALUES(?,?,?,?,1)',
      '2e99db31-8c94-431e-835d-8c41c56a1b5e', 'egitmen', admin.name || 'Eğitmen', await hashPassword(admin.password));
  }
  if (!await one('SELECT id FROM workshops')) await createWorkshop('Mavi Vadi · İlk atölye', true);
  await run('DELETE FROM logins WHERE expires<?', Date.now());
  return {
    one, all, run, batch, createWorkshop,
    log: (workshop, actor, message) => run('INSERT INTO activity VALUES(?,?,?,?,?)', crypto.randomUUID(), workshop, actor, message, Date.now()),
  };
}
