# Deploy Readiness — Analysis & Gap Closure

Date: 2026-10-21 · Target: **GitHub Pages** at `https://avsar013448.github.io/hazirplan/` (public repo `avsar013448/hazirplan`; push via stored git credentials — no gh CLI; mumo pattern. Netlify credit exhausted, pages.dev blocked in TR; github.io reachable in TR — mumo is LIVE there.)

## ✅ READY (verified)

| Item | Evidence |
|---|---|
| Static build | adapter-static SPA (fallback index.html), `build/` output ✔ |
| Offline-first | Full-precache SW; flight-mode e2e 2/2 (warm journey + cold precache proof) |
| Core loop | wizard → visible save confirmation → plan detail → sheet editors (autosave) |
| Sharing | person-level (komşu/arkadaş/misafir/grup) + encrypted Aile Kodu (HPK1, LWW merge) |
| Free tier | no accounts, no paywall, no backend, KVKK-clean |
| Data integrity | reviews 1+2 closed; migration test guards schema changes; updatedAt LWW |
| Quality gates | unit 60/60, svelte-check 0, build ✔, e2e 2/2 |
| PWA install | manifest (tr, icons 192/512+maskable), theme color, HTTPS secure context (WebCrypto OK) |
| Turkish copy | all UI TR-first |

## 🔧 NEEDED BEFORE DEPLOY (this round)

1. **Base path `/hazirplan`** — project pages serve under the repo name:
   - `paths.base` via env (local dev/test stay at root); audit hardcoded links (`href="/aile"`, back links), `window.open('/plan/...')` (ShareDialog→misafir), SW registration path, SW ASSETS (`'/'` entry), navigate fallback — all must respect base.
2. **Score-actionability gaps** — 6/20 score checks have NO producer in the shipped UI (deployed score card would show honest-but-dead "Planlanmadı" with no in-app path; review-1 deferred item, promoted pre-deploy):
   - **envanter sheet never created** (su_72s + envanter_doluluk checks dead) → add "Envanteri ve su stokunu kontrol et" step + envanter sheet to deprem/wildfire/other templates
   - **locations UI missing** (bulusma_noktalari dead) → slim "Buluşma Noktaları" card: named rally/assembly points add/remove (no map yet — offline-map UI is a later chunk; check needs names+type only)
   - **settings UI missing** (guvenli_oda, arac_plani dead) → slim "Aile Ayarları" on /aile: güvenli oda + araç var/yok
3. **Landing page** — NOT in this deploy (waitlist form endpoint is a TODO; deploy the app first, landing after endpoint wired).

## ⏸️ POSTPONED (user decision)

- Tatbikat reminders + achievements (score check `iletisim_tatbikat` stays "Başarısız" honestly until shipped — fine: drills ARE un-done today)
- Map/offline tiles, QR share (needs Phase 2 backend), Peru pack

## Deploy steps (executed in this round)

1. Fix base path + all hardcoded routes; slim locations/settings UI; envanter template step → full gates
2. Create public repo `avsar013448/hazirplan`, push `main` (docs+app)
3. Build with `PUBLIC_BASE_PATH=/hazirplan` → push `build/` → `gh-pages` branch
4. Enable Pages (API: source gh-pages) → verify live URL, SW active, prod smoke test