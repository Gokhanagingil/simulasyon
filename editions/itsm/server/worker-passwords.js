const encoder = new TextEncoder();
const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const unhex = text => Uint8Array.from(text.match(/../g) || [], byte => parseInt(byte, 16));
const iterations = 100000;

async function derive(password, salt, count) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: count }, key, 256));
}
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2:${iterations}:${hex(salt)}:${hex(await derive(password, salt, iterations))}`;
}
export async function verifyPassword(password, stored) {
  const match = /^pbkdf2:(\d+):([a-f0-9]{32}):([a-f0-9]{64})$/.exec(stored || '');
  if (!match || Number(match[1]) !== iterations) return false;
  const actual = await derive(password, unhex(match[2]), Number(match[1]));
  const expected = unhex(match[3]);
  let difference = 0;
  for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ expected[i];
  return difference === 0;
}
export async function digest(value) {
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));
}
