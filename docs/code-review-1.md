# Code Review 1 — Findings & Resolution Log

Date: 2026-10-19 · Method: independent reviewer subagent (fresh context, whole codebase) + self-review, merged
Commit: `de82418` · Pre-fix state: commit `14fcc3d`

## Verdict

**Failed pre-fix** (passed=false): 0 security concerns, but 8×P1 logic errors and 3×P1 spec violations. All P1s and the quick-win P2s fixed in `de82418`; post-fix gates: **30/30 tests, svelte-check 0 errors, build green**.

## Fixed (P1)

| # | Finding | Fix |
|---|---|---|
| 1 | **updatedAt never maintained** — dashboard ordering wrong; Aile Kodu LWW merge would silently drop real edits | `saveSheet` + `toggleStep` + `updateSettings` all bump `updatedAt`; tests assert it advances |
| 2 | **Visible save confirmation never showed in the real app** — dashboard's `onsaved` closed the modal before the confirmation rendered; test passed only in isolation | Flow split: `onsaved` refreshes data (modal stays open), "Tamam" calls `onclose`; tested end-to-end |
| 3 | **Free-tier 3-plan cap unenforced** (spec §8) | Wizard checks `plans.count()` after generation AND inside save; visible "Plan limiti doldu" state; test proves a 4th plan cannot be written |
| 4 | **Lost-update race in Mark Complete** — stale snapshot + put reverted concurrent toggles | Atomic read-modify-write inside `db.transaction('rw')`; no full reload (open sheet edits no longer discarded) |
| 5 | **Turkish-İ scoring bug** — `'İ'.toLowerCase()` produces combining-dot; 'İlaçlar' never matched 'ilaç' | `trFold()` (İ→i, I→ı, then tr-locale lower); regression test with 'İlaçlar' |
| 6 | **Drills unattributed** — any plan's drill passed every plan's comms check | `planDrills = drills.filter(d => d.planId === plan.id)` — decision documented: **per-plan attribution** |
| 7 | **envanter_doluluk trivially satisfied** — qty≥1 always true, `done` dead | Requires ≥8 DONE items; Envanter editor got the missing done checkbox |
| 8 | **bakım check unreachable** — keyword-matched step titles no UI could produce | Re-keyed on structurally injected step titles (assembly injects "Kim, kime yardım ediyor?" for dependent households); scoring receives titles as a param |
| 9 | **Silent IndexedDB failures** in all 6 editors + loads | persist try/catch everywhere with visible "⚠ Kaydedilemedi"; saveState replaces the once-true-forever savedAt |

## Fixed (P2 quick wins)

- Wizard `generate()`/`save()` re-entrancy guards (double-click races)
- Assembly: unknown sheet type now **throws** (was silently fabricating a wrong-typed sheet); explicit `envanter`/`kontrol_listesi` cases
- Duplicate circumstance injection guarded (same anchor sheet in 2 steps)
- **pets → circumstance, not human member** (was role:'yetişkin'); `household.size = max(size, members.length)`
- 'Diğer' hazard title input (spec §3) → `otherTitle` → plan title override
- AcilKisilerEditor writes on blur only (was a full IndexedDB write per keystroke)
- Dexie v2: drillLog `'++id'` → client UUID `'id'` (divergent auto-keys break future LWW); settings gained updatedAt
- Water guidance contradiction resolved: **9L/person target** (2L içme + 1L hazırlık/gün) — çanta copy scoped to 2L içme, Envanter label shows the 9L target
- Dead code removed (`savedTick`)

## Documented decisions (now spec-canonical)

- **Drill attribution: per-plan** (`drills.planId`), not household-wide
- **Sheet-of-type rule: first sheet in `plan.sheetIds` order** (free tier allows 2/type)
- **Status semantics: boolean settings false = "basarisiz"** (explicit no), absent topic = "planlanmadi" — applied uniformly
- **Water: 9L/person/3-day** in envanter scoring; çanta carries 2L/person drinking

## Known & deferred (accepted for MVP chunk, tracked for next chunks)

1. **No Playwright e2e yet** (spec §9 demands flight-mode e2e as release blocker) — comes with the PWA chunk; the confirmation flow is currently covered at component level
2. **Scored fields without writers**: locations UI, tatbihat "yaptım" button, settings panel (printedCopy, safeRoom, hasVehicle, outsidePersonAware), envanter sheet creation in wizard templates — these UIs are the *next chunks*; scoring is already correct against them
3. Dashboard score computes on mount/save only — Dexie liveQuery reactivity comes with the settings/chunk UIs
4. Editors own a local draft (`let s = $state(sheet)`) — intentional; prop changes after mount are ignored (svelte-check warnings state_referenced_locally, accepted)
5. Dashboard "Yeni Plan" button not disabled at cap (the wizard handles refusal visibly — acceptable UX for MVP; can pre-empt later)
6. Remaining reviewer suggestions (debounced persist, persisted-$state module, error-path tests for every editor, threshold-boundary score tests) — queued for the next review cycle
