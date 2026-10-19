# ReadyPlan Premium Pass — Addendum to the Teardown

Explored live 2026-10-18 with Premium active (user upgraded). Raw captures: `readyplan-scan/21–34`.
Account state note: one test plan created during exploration — **"TEST - HazırPlan Research"** (id `XOQSLsdbbMqkqpxpLMKf`, 1 step: "Check gas and electricity"). Keep for reference or delete via plan Edit; used 1 of 5 monthly audit quota (result: 0/20).

---

## 1. Tech stack (from network capture)

- **Firebase Firestore** backend (project `mad-gear-cp`) — real-time sync via Firestore channels; plans saved client-side through the SDK, no REST API
- **Stytch** for auth (email + Google SSO)
- **Amplitude** for analytics
- **AI generation:** `POST /api/ai/onboarding/v4/stream` — one big prompt: *"Create a comprehensive emergency preparedness plan for a household with the following profile: **Location & Context** No specific location provided…"* → streaming response rendered as steps appear live ("Generating steps… This usually takes 30-60 seconds")
- **Google Maps** in Route Builder

## 2. AI Plan Generation (Premium's core) — UX and quality

- **Generation UX:** streaming steps with title + one-line description appearing one by one; then full detail (sub-bullets per step). Plan #1: 8 steps, plan #3: 9 steps → non-deterministic.
- **Generated quality (Earthquake, 1-person household):** steps like "Drop, cover, and hold" → "Assess immediate safety hazards" ("Sniff for gas leaks — IF detected: do not operate any switches, evacuate immediately, and call **911**") → "Execute PACE check-in" → "Evaluate evacuation triggers" → "Retrieve go-bag and documents" → "Activate shelter-in-place resources" (72-hour water math included) → … → "Document damage and begin recovery" (insurance photos, certified inspector). Sub-bullets reference linked sheets inline: "Open PACE Communication Plan", "Open Evacuation Route plan", "Pull up Go Bag packing list".
- **Refinement:** "Want to refine this plan?" free-text (0/200) + **"Apply to My Plan"**.
- **⚠️ Observed UX flaw:** in 3 wizard runs, "Apply to My Plan" never closed the wizard or saved the plan ("No Plans Yet" persisted). Manual creation saved instantly. Likely a real onboarding drop-off bug — and a warning for us: **the wizard→save path must be bulletproof and visibly confirmed.**
- **Localization proof:** generated content says "call 911" — US-locked. HazırPlan's 112/localized content is a genuine differentiator, and the whole AI-content moat is thin: it's one prompt + streaming. Our deterministic TR templates can match this quality offline, free.

## 3. Manual Plan editor + Plan view (the real CRUD model)

- Editor (`/dashboard/plans/new/`): **Plan name** → **Steps** (each: title *("e.g., Assess immediate safety hazards")* + objective *"(single sentence)"* + notes + **"Link Items"** + **"Add checklist"**) → linked **PACE Plan** slot → linked **EXFIL Plan** slot → **Planning Notes** → Save Changes.
- Plan view: **Pin / View / Edit / Reset Plan / Download**; each step has **"Mark Complete"** (progress tracking); empty states: "No PACE plan linked." / "No EXFIL plan linked."
- **Recommendations engine** (dashboard) auto-detects gaps: *"💡 1 contingency plan missing PACE Plan"* — simple, high-value, easy to replicate deterministically.

## 4. Plan Audit — the "consumer-household-readiness v1.2.0" rubric ⭐

Pre-audit self-assessment (5 questions):
1. "Have you conducted a drill of this plan?" Yes/No
2. "Do you have an out-of-area emergency contact?" (+ why-it-matters line)
3. "Offline access to plan/contacts?" multi-select: Printed / Handwritten / Digital copy (USB, PDF) / Binder / Other
4. "Have other household members seen or have access to this plan?"
5. "Does at least one person outside your household know this plan exists?"

Rubric (6 weighted categories, 20 checks):
| Category | Weight | Checks |
|---|---|---|
| Communications | 30% | Pace Defined, Out Of Area Contact, Contact Info Offline, Meeting Locations, Communications Tested |
| Evacuation | 20% | Evac Destinations, Evac Routes, +2 |
| Shelter in place | 15% | 4 |
| Documents and finances | 15% | 3 |
| Kids, pets, and people who depend on you | 10% | 1 |
| Sharing and accessibility | 10% | 3 |

Per-check output: **status** ("Not captured" = topic absent vs "Fail" = explicitly failed) · **confidence %** (97–100%) · **evidence quote** from the plan · analysis · **"Next step:"** remediation. Copywriting is excellent and worth studying: *"Pick a Saturday. Run the comms portion of your plan end to end. You will find something broken. Fix it."* / *"Print the contact list. Put a copy in each go-bag, one on the fridge, and one in each vehicle."*

Verdict scale: "Not ready — You have a plan started. Most of the work is still ahead." Quota: **5 audits** (per month).

**HazırPlan implication: this rubric becomes our Hazırlık Skoru — but deterministic (rule-based, computed locally), free, offline, with the same evidence + next-step UX. It's their best premium feature and we can ship its essence in the free MVP.**

## 5. PACE Plan sheet (Premium comms sheet)

Editor: **Plan Type** (Generic PACE / Comms Plan) → **P - Primary / A - Alternate / C - Contingency / E - Emergency** fields → Notes. Inline education: "Primary: Your main method of communication / Alternate: Your backup if primary fails / Contingency: … / Emergency: Last resort."

## 6. Route Builder (Premium)

Map-based: **Starting Point** ("Or click on the map to set this point") + **Destination** → tabs **Routes / Waypoints / Options** → "Calculate Routes" → **"Create EXFIL Plan"** (route → sheet conversion). Map/Satellite toggle (Google).

## 7. AI Assistant (Premium)

Plain OpenAI-powered chat: "I can help with emergency preparedness, survival techniques, and planning questions." No special scaffolding — low moat.

## 8. Updated copy-vs-change list for HazırPlan

**Steal (adapted):**
- The audit rubric → deterministic **Hazırlık Skoru** with the same 6-category shape, TR checks (112, toplanma alanı, Kızılay), evidence + next steps; drill question feeds from our tatbihat log (they ask "have you drilled?" — we *know*)
- Gap-detection recommendations ("plan eksik: İletişim Planı")
- Step "Mark Complete" progress + plan Pin
- PACE sheet with inline education
- 5-question self-assessment as a sharing-feature onboarding moment
- Streaming-style generation UX → our wizard can show steps being "assembled" with the same excitement (fake-stream the deterministic assembly)

**Their weaknesses confirmed:**
- Cloud Firestore = dead without signal (their offline claim is app-shell only — plan data needs sync)
- AI content is US-locked (911) and non-deterministic (8 vs 9 steps for identical input)
- Wizard→save path is fragile (observed bug)
- Audit quota (5/mo) — premium gate on the feature that creates the most habit
