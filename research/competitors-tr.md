# HazırPlan — Phase 0.1 Competitor Teardown (Turkey)

Verified 2026-10-18 via live listings (Google Play, Apple App Store, afad.gov.tr) and search-index data.

## Feature matrix

| Capability | AFAD Acil (official) | Afet Hazırlık ve Acil Rehber (MeftunTech) | Kriz / Türkiye Acil Durum | Life Signal (Offline Mesh SOS) | Deprem apps (various) | **HazırPlan (planned)** |
|---|---|---|---|---|---|---|
| Structured family plan builder (roles, routes, rally points, comms) | ✗ | Partial (family member registration + assembly areas, static) | Unknown | ✗ | ✗ | ✅ Core |
| Share plan to every family member's device | ✗ | ✗ | Unknown | ✗ (community board, not family) | ✗ | ✅ Core (QR/export, offline) |
| Works fully offline | Partial (nearest assembly area needs map data) | Unclear | Yes — "all critical features continue to work" | Yes (mesh/bulletin) | No (data feeds) | ✅ Core, release blocker |
| Deprem çantası / inventory with expiry tracking | ✗ | Partial (earthquake kit management, no expiry) | Unknown | ✗ | ✗ | ✅ Differentiator |
| Drill / tatbihat reminders | ✗ | ✗ | Unknown | ✗ | ✗ | ✅ Differentiator |
| Earthquake alerts / Kandilli-USGS feeds | ✗ | ✅ | ✅ | ✗ | ✅ | ✗ (deliberate — we are the plan, not the alert) |
| Rally-point map | ✗ (nearest public assembly area only) | ✅ | Unknown | ✗ | ✗ | ✅ Family's own rally points |
| Print / analog backup | ✗ | ✗ | ✗ | ✗ | ✗ | ✅ |
| Turkish, first-class | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Price | Free (government) | Free, ad-supported | Unknown (listing currently unreachable) | Free/Freemium | Free/mixed | **Free core** |

## Per-competitor notes

### 1. AFAD Acil (com.tr — official, iOS/Android)
One-touch emergency call (112), nearest assembly area with routing, disaster training videos. **Strength:** institutional authority, pre-installed trust. **Weakness:** it is a response tool — nothing in it prepares a family *before* the event, and it holds no family-specific data. **Our stance:** complementary, never adversarial. Position: "Resmi uygulamalar afet anında yanınızda. HazırPlan afetten önce ailenizin yanında."

### 2. Afet Hazırlık ve Acil Rehber — MeftunTech (Google Play)
Closest feature-overlap: SOS button, earthquake kit management, disaster guides (earthquake/flood/fire), family member registration, assembly areas, siren/flashlight, quake notifications. Solo developer (İzmir), ad-supported, "no data collected", updated Oct 2026. **Strengths:** breadth, active maintenance. **Weaknesses:** static data entry (no guided plan), no cross-device sharing or sync, ads erode trust in an emergency context, no drills, no expiry tracking, no print. **Our edge:** guided wizard → shared → drilled. The ad model is our opening: "Reklamsız. Veriniz cihazınızda kalır."

### 3. Kriz / Türkiye Acil Durum (id6761036814)
Search-indexed description: "Turkey's most comprehensive emergency preparedness app... All critical features continue to work even [offline]" + Kandilli Rasathanesi & USGS live earthquake data. **Both App Store listings (US + TR storefronts) return 404 as of 2026-10-18** — removed or renamed. Action: re-check in 2 weeks; if relaunched under a new name, re-teardown. Offline + alert-data focus suggests it's a monitoring/SOS app, not a plan-sharing product.

### 4. Life Signal: Offline Mesh SOS (Google Play)
Offline mesh SOS, offline bulletin board for assembly points / water / food / safe zones, crisis chat. **Interesting adjacency:** proves demand for offline-first crisis sharing in TR. But it's a *during-crisis community* tool — no pre-event family planning, no structured scenarios. Not a direct competitor; a potential post-launch integration story.

### 5. Deprem monitoring apps (Deprem Bilgi Sistemi, Deprem Uyarılarım, etc.)
Earthquake feeds and alerts (Kandilli/AFAD/EMSC data). Alert fatigue is real; none hold family plans. Out of scope — we will NOT do alerts (scope discipline + differentiate on plan).

## Strategic conclusions for the TR MVP

1. **The plan-sharing gap is confirmed live.** No Turkish app takes a family through scenario-building and puts the result on every member's phone, offline, for free. AFAD can't (institutional scope), MeftunTech doesn't (static + ads), Kriz may be gone.
2. **"Free + offline + no-ads + data stays on device" is a trust-pitch with no incumbent making it.** In a market scarred by 2023, privacy + reliability messaging converts.
3. **Deliberate non-features:** no earthquake alerts (that's AFAD/Kandilli territory; keeps us fast, free, and out of the "yet another deprem app" graveyard).
4. **Complement, don't attack, AFAD** — mandatory for partner/NGO credibility (AHBAP, Kızılay, municipal channels).
5. **Compliance upside:** local-only storage in MVP means no KVKK registration burden at launch; revisit only when household sync ships (Phase 2).

## Appendix — Peru (verified earlier, for the later es-PE pack)
- **Familia Preparada** (INDECI + UNICEF, free, Android): family emergency plan, safe zones, mochila/caja de reserva, SOS familiar, news section. Government-grade distribution, weak on cross-device sharing/sync/depth.
- Institutional anchors: INDECI, Defensa Civil, Bomberos (116), SAMU (101), Policía (105).
- Conclusion unchanged from the master plan: PE entry = differentiate on sharing/sync/print/drills or go institution-first.
