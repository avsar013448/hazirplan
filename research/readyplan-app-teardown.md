# ReadyPlan — Logged-In Product Teardown (Inspiration Doc for HazırPlan)

Explored live 2026-10-18 with the user's account (free tier, empty state). Raw captures in `readyplan-scan/` (01–20).
**Read-only exploration: no plans, sheets, or settings were created or modified.**

---

## 1. Product architecture (the big picture)

ReadyPlan = **Plans + Sheets + Groups**, wrapped in gamification and an AI assistant.

- **Plan** ("Condition Plan") = an ordered list of **Steps**. Each step is one action ("Grab bugout bag, and secure vehicle") and links to one or more **typed Sheets** that back it (Go Bag, Vehicle Checklist, EXFIL Plan...). Plans also carry free-text Notes.
- **Sheet types (11):** PACE Plans, EXFIL Plans, Inventory Lists, Go Bags, Checklists, Vehicle Checklist, Notes, Reference Sheets, Card of the Day, One Time Pad, Auth Tables.
- **Groups** = the family-sharing unit. Members join by invite; free users can join 1 group, Premium can create unlimited.
- **Templates**: 12 plan templates + 36 sheet templates, browsable with filters, plus "Suggest Template."
- **AI** ("Generate My Plan") turns wizard answers into a full plan; the Assistant (OpenAI-powered chat) is Premium.

The mental model is tactical/military throughout: PACE (Primary/Alternate/Contingency/Emergency comms), EXFIL (evacuation routes), One-Time Pads, Cipher, Authentication Tables, Q-codes, NATO phonetic alphabet, Morse code. The audience: preparedness-minded households (the founder is ex-Navy; the physical planner is sold via madgear.shop).

## 2. Information architecture (real URLs)

Sidebar (persistent): Dashboard, Plans (View all / Create new), Sheets (11 subtypes), Groups, Templates, Assistant, Route Builder, Locations, Audit, Knowledge Check, Achievements, References, Profile, Help & Support, Upgrade to Premium, Sign Out.

- `/dashboard/` — home: Quick Actions (New Plan, Add Inventory, Checklist), Your Plans, **Preparedness Assessment**, Recommendations, Achievements widget, and the **Plan Builder wizard embedded on the page**
- `/templates/`, `/groups/`, `/ai-chat/`, `/knowledge-check/`, `/achievements/`, `/profile/`, `/upgrade/`, `/contact/`, `/faq/`, `/references/`
- `/dashboard/route-builder/`, `/dashboard/locations/`, `/dashboard/audit/`
- Plans/Sheets are client-side views (no standalone URL) — sheet list lives in an expanding sidebar submenu
- Empty-state copy doubles as onboarding: "Create your first condition plan to start organizing your emergency preparedness strategy"

## 3. Plan Builder wizard (6 steps — exact structure)

1. **"What are you planning for?"** — category → sub-emergency drill-down + free text "Other" (0/50):
   - 🌪️ Natural Disasters → Hurricane, Earthquake, Wildfire, Flood, Tornado
   - 🏠 Home Emergencies — 🚗 Travel & Transit
   - Each option carries a one-line plain-language description ("Ground shaking and structural damage")
2. **"Household size"** — 1 person … More than 10 + **optional Zip Code** ("Helps us give location-specific guidance")
3. **"Who's in your household?"** — multi-select: Children (under 18), Elderly (65+), Pets, Special needs members ("All fields are optional. Skip if none apply.")
4. **"Any special circumstances?"** — multi-select: Mobility limitations, Medical equipment, Critical medications, Language barriers, Limited resources, No personal vehicle, Remote location
5. **"Anything else to plan for?"** — free text 0/500 + **live Plan Summary** (Emergency / Household) → **"Generate My Plan"**

Design notes: progress shown as "n/6"; every step has Back/Continue; generous optionality ("optional" repeated); the summary builds user confidence before the AI generation moment.

## 4. Sheet taxonomy (the real content model)

| Type | Purpose (inferred from usage) |
|---|---|
| PACE Plan | Comms plan: Primary/Alternate/Contingency/Emergency methods |
| EXFIL Plan | Evacuation routes |
| Inventory List | Supplies tracking |
| Go Bag | Packing checklist per person/bag |
| Checklist | Generic checklists |
| Vehicle Checklist | Per-vehicle readiness (template example: "F-150") |
| Notes | Free notes |
| Reference Sheets | e.g., Emergency Contacts |
| Card of the Day | Daily preparedness challenge/card |
| One Time Pad | Comms security aid |
| Auth Tables | Code-word authentication tables |

## 5. Plan → Steps → Sheets (verified template: Wartime Evacuation Plan)

Steps: 1) Decide on evacuation (→ Notes) → 2) Pre-departure checklist (→ Checklist) → 3) Grab bugout bag & secure vehicle (→ Go Bag + Vehicle Checklist) → 4) Evacuate to safe zone (→ EXFIL Plan) → 5) Communicate with friends/family (→ References: Emergency Contacts). Notes: "Sample wartime evacuation plan… location purposely vague, please update info as needed."

**This step-linked-to-sheets model is the single most copyable design decision** — it makes plans actionable scripts instead of documents.

## 6. Gamification (retention engine)

- **31 achievements**, points (+10 … +50), levels (Level 1 = "Planner Initiate"), profile shows points + level + completed count
- Examples: First Scenario (+10, first plan), Drill Responder (+50, click a drill notification), Group Member (+50, join a group), Go-Bag Secured (+20, 100% a Go-Bag checklist), Full Spectrum Comms (+20, all 4 PACE methods defined), Authentication Master (+20, 80% on quiz)
- **Knowledge Check**: 12 quizzes × 10 questions (Random, PACE Plan, EXFIL Plan, Authentication Table, Card of the Day, One-Time Pad, Cipher, Inventory, Vehicle Checklist, Go-Bag, Notes & Checklists, Planning Principles)
- Dashboard "Preparedness Assessment": grade ("Just starting. Follow the tips below.") + prioritized recommendations (⚠️ create plan → 💡 inventory → ℹ️ go bag)
- First-run achievement "Boots on the Ground" (+10, first login) — instant positive reinforcement

## 7. Premium gating & pricing (exact)

**Free forever:** up to 2 condition plans · 2 sheets of every type · join 1 group (limited functionality). NOT free: Communication sheets, AI features, Route Builder, Audit, unlimited groups, priority support. Locations capped at 5 (free).

**Premium:** $59.99/yr (recommended, 7-day free trial) or $6.99/mo; **Lifetime $99.99** one-time. Risk reversal: "Complete the guided setup and still don't think it was worth it — we'll refund your first year."

Gated screens are **upsell pages**, not dead ends: each shows the full Premium feature checklist + "Upgrade to Premium" CTA (Assistant, Route Builder, Audit all follow this pattern).

**Plan Audit (Premium):** "grades your plan against the consumer-household readiness rubric" — overall score + category breakdown (communications, evacuation, shelter, dependents, and more) + per-item evidence.

## 8. UX patterns worth stealing

1. **Wizard embedded in the dashboard** — zero-click start, no "create" friction
2. **Every question has an escape hatch** ("optional", "skip if none apply") — fatigue-proof
3. **Live plan summary before generation** — confidence builder
4. **Empty states that instruct** — each tells you exactly what to do first
5. **Recommendation engine on dashboard** (⚠️/💡/ℹ️ priority icons)
6. **AI as the finisher, not the starter** — user picks options, AI writes the plan
7. **Tactical vocabulary as brand** (PACE, EXFIL) — credibility with the prepper segment
8. **Reference library built-in** (Morse, phonetic alphabet, Q-codes) — offline value
9. **One ecosystem across web/mobile/print** with the physical planner as upsell

## 9. What HazırPlan TR should copy vs. change

**Copy directly:**
- Plan = Steps → linked typed Sheets model (adapts perfectly to JSON content packs)
- 6-step wizard skeleton with optional-everything philosophy
- Dashboard: Preparedness Assessment + recommendations + achievements widget
- Gamification loop (achievements/points/levels/drill notifications) — drives the monthly drill habit
- Sheet taxonomy core: PACE→"İletişim Planı (PACE)", EXFIL→"Tahliye Rotaları", Go Bag→"Deprem Çantası", Inventory→"Envanter", Vehicle→"Araç Kontrol Listesi"
- Freemium shape: 2 free plans + capped groups; premium for unlimited
- Empty-state copy that onboards

**Change / localize for TR:**
- Hazard list: Earthquake (primary), Wildfire, Flood + home emergencies; drop Hurricane/Tornado prominence
- Household questions: add apartment vs. house (Turkish urban context), extended-family households (common in TR)
- Tactical vocab → Turkish civil-defense framing: AFAD-compatible language, not military jargon (retain PACE/EXFIL concepts but name them plainly: "Yedek İletişim Planı", "Tahliye Rotası")
- References: 112, toplanma alanları (assembly areas), Kızılay, deprem çantası checklist instead of Morse/OTP
- **Offline-first** (their weakness — cloud Next.js app): our core, as decided
- **Sharing without accounts** (their weakness: groups need accounts + invites): Aile Kodu QR
- Drop paywalled AI generation → deterministic wizard (decided)
- Pricing: PPP — ₺-based, lower absolute numbers, keep lifetime tier (converts well with this audience)
