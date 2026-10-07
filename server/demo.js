export const demoWorkshopId = 'b5db4100-0051-4818-8e07-000000000000';
const initialPassword = 'MaviVadi2026!';
const profiles = [
  ['mudur', 'Deniz Yılmaz'], ['operasyon', 'Ece Demir'], ['bakim', 'Can Arslan'], ['teknik', 'Selin Kaya'],
  ['guvenlik', 'Bora Yıldız'], ['tedarik', 'Derya Aksoy'], ['risk', 'Mert Aydın'], ['denetim', 'İpek Şahin'],
].map(([suffix, name], index) => ({
  id: `b5db4100-0051-4818-8e07-${String(index + 1).padStart(12, '0')}`,
  username: `ornek.${suffix}`, name, roleId: `R${index + 1}`,
}));

export async function demoAccounts(store, scenario) {
  const workshop = await store.one('SELECT * FROM workshops WHERE id=?', demoWorkshopId);
  if (!workshop) return { workshop: null, accounts: [] };
  const users = await store.all('SELECT u.id,u.username,u.name,m.role_id FROM users u JOIN memberships m ON m.user_id=u.id WHERE m.workshop_id=?', demoWorkshopId);
  return { workshop, initialPassword, accounts: profiles.flatMap(profile => {
    const user = users.find(user => user.id === profile.id);
    return user ? [{ ...user, roleName: scenario.roles.find(role => role.id === user.role_id)?.name || user.role_id }] : [];
  }) };
}

export async function createDemo(store, scenario, passwords) {
  const existing = await demoAccounts(store, scenario);
  if (existing.workshop) return existing; // Never reset roles, notes or passwords.
  for (const profile of profiles) {
    if (await store.one('SELECT id FROM users WHERE username=? OR id=?', profile.username, profile.id)) {
      const error = new Error('Örnek kullanıcı adlarından biri kullanımda. Mevcut hesap değiştirilmedi.');
      error.status = 409; throw error;
    }
  }
  const statements = [[
    'INSERT INTO workshops(id,name,code,scenario_id,created_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO NOTHING',
    [demoWorkshopId, 'Mavi Vadi · Örnek atölye', 'MV-ORNEK', scenario.id, Date.now()],
  ]];
  for (const zone of scenario.zones) statements.push([
    'INSERT INTO zone_states(workshop_id,zone_id,status) VALUES(?,?,?) ON CONFLICT(workshop_id,zone_id) DO NOTHING',
    [demoWorkshopId, zone.id, zone.initialStatus || 'open'],
  ]);
  for (const profile of profiles) {
    statements.push(['INSERT INTO users VALUES(?,?,?,?,0) ON CONFLICT(id) DO NOTHING',
      [profile.id, profile.username, profile.name, await passwords.hashPassword(initialPassword)]]);
    statements.push(['INSERT INTO memberships VALUES(?,?,?) ON CONFLICT(workshop_id,user_id) DO NOTHING',
      [demoWorkshopId, profile.id, profile.roleId]]);
  }
  await store.batch(statements);
  return demoAccounts(store, scenario);
}
