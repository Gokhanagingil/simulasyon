import { env } from 'cloudflare:workers';
import scenario from '../../../content/itsm-v1.json';
import { createD1Store } from '../../../server/d1-store.js';
import { createHandler } from '../../../server/handler.js';
import * as passwords from '../../../server/worker-passwords.js';

let ready: Promise<ReturnType<typeof createHandler>> | undefined;
async function dispatch(request: Request) {
  const bindings = env as Cloudflare.Env;
  ready ??= createD1Store(bindings.DB, scenario, {
    password: bindings.ADMIN_PASSWORD, name: bindings.ADMIN_NAME,
  }).then(store => createHandler({
    store, scenario, passwords, secureCookies: true, platformOwnerEmail: bindings.TRAINER_EMAIL,
  })).catch(error => { ready = undefined; throw error; });
  try {
    return await (await ready)(request, { remoteAddress: request.headers.get('cf-connecting-ip') || 'unknown' });
  } catch (error) {
    console.error('Workshop initialization failed', error);
    return Response.json({ error: 'Uygulama şu anda hazırlanıyor. Lütfen tekrar dene.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
export { dispatch as GET, dispatch as POST, dispatch as PUT, dispatch as PATCH, dispatch as DELETE };
