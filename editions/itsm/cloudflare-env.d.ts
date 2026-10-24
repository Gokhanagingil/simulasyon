declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    ADMIN_PASSWORD: string;
    ADMIN_NAME?: string;
    TRAINER_EMAIL?: string;
    BUCKET?: R2Bucket;
  }
}
