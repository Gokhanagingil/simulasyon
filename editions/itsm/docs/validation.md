# ITSM doğrulama

7 Ekim 2026: 19 Node HTTP/SQLite/D1 testi geçti. JavaScript kontrolü ve TypeScript kontrolü geçti. Üretim derlemesi başarılı.

Tarayıcı görsel/etkileşim QA bu turda yapılmadı; Niles entegrasyonu ve gerçek SLA kabulü henüz tamamlanmadı. `NILES-ACCEPTANCE.md` açık kabul kaydıdır.

Eski GRC ekran görüntüleri bu ITSM sürümünün doğrulama kanıtı değildir.

## 7 October 2026 — experiential ITSM hardening

- Added role-first three-step briefing and trainer first-five-minute setup guidance.
- State-driven character scenes accompany actual released incidents. Turnstile jam, visitor queue, acknowledged response team and verified recovery are derived from workshop state; no official Niles success is simulated.
- End-of-day park story uses actual decisions, closure state and post-resolution learning questions; evidence JSON and CSV identify LOCAL SIMULATION / unverified Niles acceptance.
- All UI totals follow the editable scenario. Improved readable control text, mobile wrapping, focus outlines and reduced-motion behavior.
- Hardened workshop selection, stale scenario loads, concurrent saves, released-card locking, duplicate decisions and closure races. Scenario validation rejects impossible closure dependency cycles and malformed guide content.
- 26 automated tests passed, JavaScript/scenario check passed, TypeScript passed, production build passed. ESLint has zero errors and two pre-existing unused-variable warnings in the preserved GRC public/app.js.
- Browser visual/interactive acceptance is NOT verified: supported cloud browser could not reach local preview (ERR_BLOCKED_BY_CLIENT), and private published Site needs its normal authenticated session. No alternate browser route or auth bypass was used. Tests of SVG state markup do not establish visual quality or animation smoothness.
- Existing GRC edition and Niles applications/workflows are outside this patch.
