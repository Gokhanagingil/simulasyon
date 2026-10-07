import { createApp } from "./app.js";

const { server, store } = createApp({
  databasePath: process.env.DATABASE_PATH,
  secureCookies: process.env.COOKIE_SECURE === "true",
  admin: {
    username: process.env.ADMIN_USERNAME,
    name: process.env.ADMIN_NAME,
    password: process.env.ADMIN_PASSWORD,
  },
});
const port = Number(process.env.PORT || 3000);
server.listen(port, process.env.HOST || "0.0.0.0", () => {
  console.log(`Mavi Vadi hazır: http://localhost:${port}`);
  if (store.bootstrap) {
    console.log(`İlk eğitmen hesabı: ${store.bootstrap.username}`);
    if (store.bootstrap.generated)
      console.log(
        `Tek seferlik gösterilen başlangıç parolası: ${store.bootstrap.password}`,
      );
  }
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close(() => process.exit(0)));
