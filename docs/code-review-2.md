# Code Review 2 — Findings & Resolution Log

Date: 2026-10-21 · Method: independent reviewer subagent (fresh context, full MVP incl. Aile Kodu + PWA) + self-review with empirical migration test, merged
Scope: everything through commit `cca1cc2`

## Verdict

**Failed pre-fix** (1×P0, 4×P1, 5×P2). All P0/P1 and the quick-win P2s fixed; deferred items listed. Post-fix gates: **unit 60/60 (10 files), svelte-check 0 errors, build ✔, playwright 2/2**.

## Fixed

| # | Sev | Finding | Fix |
|---|---|---|---|
| 1 | **P0** | **Dexie v1→v2 changed drillLog's primary key — Dexie throws `Not yet support for changing primary key`, bricking the app + all data for every pre-fix install** (both reviewer and my own empirical test proved it; caught by writing a real-upgrade-flow test that constructs a raw v1 IDB) | New `drills` store (client UUID) + `.upgrade()` copying legacy `++id` rows + legacy table dropped in v3. **migration.test.ts** builds a genuine v1 database with data → asserts clean upgrade, zero loss. (Reviewer's option (a) — implemented before its report arrived.) |
| 2 | P1 | Import bypassed the 3-plan wizard cap (inconsistent paths) | **Product decision recorded**: cap applies to wizard *creation* only; Aile Kodu import is sync and never truncates family data (data integrity > product limit). Documented in bundle.ts + spec §5.4 + pinned by a behavior test (`DOCUMENTED DECISION` test). |
| 3 | P1 | `printedCopy` set on opening the print view — intent, not action; popup-blocked opens still logged shares | `afterprint` on the misafir page is now the only thing that sets printedCopy (real print event); `window.open()` return checked — null (popup blocked) → visible error, **no share logged**. Tests updated + popup-blocked regression test. |
| 4 | P1 | **Score-primary plan churn**: dashboard picked `plans[0]` by `updatedAt` — toggling a step on ANY plan silently re-selected which plan drives the household Hazırlık Skoru | New pure `pickPrimaryPlan()` = latest **createdAt** (stable under edit churn); unit-tested that updatedAt churn does NOT re-pick; decision recorded in spec §5.4. |
| 5 | P1 | Location LWW merge was a silent no-op (no `updatedAt` on FamilyLocation — incoming edits could never win) | `updatedAt?` added to FamilyLocation; merge compares it; **documented current behavior is add-only** (no locations writer yet) with a pinning test asserting no data loss. |
| 6 | P2 | decryptBundle leaked raw DOMException on corrupted salt/iv base64 | parse+derive moved into try; friendly Turkish error; salt-corruption regression test. |
| 7 | P2 | assertBundle only validated plans/sheets — missing arrays threw raw TypeErrors | all bundle sections validated with specific messages; tests for missing locations/drillLog/shareLog/settings. |
| 8 | P2 | AileKoduPanel: payload buttons unguarded, navigator.share failures swallowed, same-file re-pick fired no change | busy-guards, share errors surfaced (AbortError excluded), `input.value=''` reset. |
| 9 | P2 | SW runtime-cached cross-origin GETs into the versioned cache | fetch handler now same-origin only. |
| 10 | P2 | normalizeCode U→V / İ→1 mappings untested/undocumented | tests + comments added (Crockford alias mapping). |

## Deferred (accepted, tracked)

1. **SW cleanup ordering** (claim-then-delete grace on redeploy) — low urgency for a fully-static app; revisit when real deploys are frequent.
2. **SW install-failure surfacing** (visible "çevrimdışı mod hazır değil") — P3 UX; console error today.
3. **AileKoduPanel component test** (busy/disabled states) — module-level tests cover crypto/bundle; panel test queued for next round.
4. **Second-deploy SW e2e** (version bump → old cache deleted, new precache complete) — add when a real second build exists to ship.
5. **Review-1 deferred items** (unchanged): Dexie liveQuery reactivity, settings/locations/tatbihat UIs, debounced persist.

## Canonical decisions added (spec §5.4)

- Free-tier 3-plan cap: wizard creation only; family import never truncates.
- Score primary plan: latest **createdAt** (stable); edits never re-pick.
- printedCopy tracks the actual `afterprint` event.
