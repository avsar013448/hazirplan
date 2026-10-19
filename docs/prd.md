# PRD — ReadyPlan Clone ("Project HazırPlan — Clone Spec")

Version 0.1 · 2026-10-18 · Source: live teardown of readyplanapp.com (free + Premium, 2026-10-18; raw captures `research/readyplan-scan/01–40`)
Scope: **faithful functional clone** of ReadyPlan as a PRD. Localization deltas for the TR product live in `specs/mvp-spec.md` — this document specifies the product AS OBSERVED.

---

## 1. Product summary

A web + mobile family emergency-preparedness app built on a physical planner business (MAD Gear / The Contingency Planner). Core loop: a 6-step AI-assisted wizard generates a **Condition Plan** (ordered steps → linked **Sheets**); families share everything via **Groups**; gamification (points/achievements/quizzes) and a readiness **Audit** keep plans alive. Freemium.

**Value proposition:** "The plan has to exist before the emergency" — a complete family plan in under an hour, on every member's phone, working without signal.

## 2. Users & personas

1. **Preparedness Head of Household ("Planner")** — buys the physical planner, wants a digital living version; tactical-taste (PACE/EXFIL vocabulary lands).
2. **Household Member ("Follower")** — receives shared plans; needs zero-friction read access; drills occasionally.
3. **Team/Group organizer** — mutual-aid group, neighborhood, or church group coordinator.
4. **Prepper hobbyist** — achievements, quizzes, references, One-Time Pads.

## 3. Feature requirements

### F1 — Auth & Account
- Email+password and Google SSO (Stytch). Email managed by auth provider.
- Profile: display name, email, avatar initial, level + total points, member-since, subscription status.
- Settings tabs: Profile · Notifications · Privacy · Appearance · Account · Comms.
- Delete account/data path (FAQ promises it).

### F2 — Dashboard (home)
- Quick Actions: New Plan · Add Inventory · Checklist.
- Your Plans (empty state onboards: "Create your first condition plan…").
- Preparedness Assessment card: grade label ("Just starting. Follow the tips below.") + prioritized Recommendations (⚠️/💡/ℹ️): first plan → inventory → go bag; premium-aware gaps ("1 contingency plan missing PACE Plan").
- Achievements widget (unlocked count → view all).
- **Plan Builder wizard embedded on the dashboard** (zero-click start).

### F3 — Plan Builder wizard (6 steps, "n/6" progress)
1. Category (🌪️ Natural Disasters / 🏠 Home Emergencies / 🚗 Travel & Transit) → sub-options with one-line descriptions (Hurricane, Earthquake, Wildfire, Flood, Tornado + free-text Other 0/50)
2. Household size (1–10+, more-than-10) + optional Zip Code
3. Household members (multi-select, optional): Children, Elderly (65+), Pets, Special needs
4. Special circumstances (multi-select, optional): Mobility, Medical equipment, Critical medications, Language barriers, Limited resources, No personal vehicle, Remote location
5. Free text (0/500) + live Plan Summary → **"Generate My Plan"** (AI, streaming: "Generating steps… usually 30–60s")
6. Generated preview (8–9 steps w/ title, description, sub-bullets, inline sheet links) + refine input (0/200) + **"Apply to My Plan"** (⚠️ observed bug: did not save in 3/3 runs; manual create is the reliable path)
- Every step: Back/Continue, "optional"/"skip" escape hatches.

### F4 — Plans (Condition Plans)
- Manual editor (`/dashboard/plans/new/`): plan name; Steps (title "e.g., Assess immediate safety hazards" + objective "single sentence" + notes + **Link Items** + **Add checklist**); linked **PACE Plan** slot; linked **EXFIL Plan** slot; Planning Notes; Save Changes.
- Plan view (`/dashboard/plans/{id}/`): Pin · View · Edit · **Reset Plan** · **Download**; per-step **Mark Complete**; empty-slot states ("No PACE plan linked.").
- Plans sidebar: View all plans / Create new plan.

### F5 — Sheets (11 types)
PACE Plans · EXFIL Plans · Inventory Lists · Go Bags · Checklists · Vehicle Checklist · Notes · Reference Sheets · Card of the Day · One Time Pad · Auth Tables.
- Sheet editors: e.g. PACE Plan = Plan Type (Generic PACE / Comms Plan) + P/A/C/E fields + Notes + inline education per field.
- Per-type sidebar submenu with View all / Create new.
- Free tier: 2 sheets per type; Communication sheets Premium-only.

### F6 — Templates
- 12 plan templates + 36 sheet templates; category filters; "Suggest Template"; per-template Preview.
- Example templates: Wartime Evacuation Plan, Nuclear Incident - Quick Action, Ready/Set/Go Evacuation Levels (×3), Flood, Pre-Flood, Power Outage, Winter Weather, Wildfire, Tornado, Hurricane.
- Template structure: ordered Steps, each step → **LINKED SHEETS** of specific types (verified on Wartime template: Notes, Checklist, Go Bag, Vehicle Checklist, EXFIL Plan, References) + plan-level Notes.

### F7 — Groups (family/team sharing)
- Create group (Premium): Name*, Description, **Private Group** toggle ("Only invited members can see and join").
- Benefits copy: "Share emergency plans and checklists · Collaborate on preparedness strategies · Keep everyone on the same page."
- Group view tabs: **Plans / Sheets / Locations / Members**; "Add Plans from My Collection" to share; Delete Group (owner).
- Members: role "Admin" (owner); **Invite Member = Email Address → Send Invitation** (email invites).
- Free: join 1 group (limited functionality); Premium: unlimited + create.

### F8 — Locations
- Map ("Manage and visualize your important locations"); Add Location or click-on-map; **free cap 5** ("0/5 locations"); empty state onboards.

### F9 — Route Builder (Premium)
- Start & End Points (type or click map; Google Maps) → tabs **Routes / Waypoints / Options** → "Calculate Routes" → **"Create EXFIL Plan"** (route→sheet conversion). Map/Satellite toggle.

### F10 — Plan Audit (Premium, 5/month quota)
- Pre-audit self-assessment (5 Yes/No+multi questions): drill conducted? out-of-area contact? offline access (Printed/Handwritten/Digital copy/Binder/Other)? household access? outsider knows plan exists?
- Grades against **"consumer-household-readiness v1.2.0"** rubric:
  Communications 30% (5 checks: PACE Defined, Out Of Area Contact, Contact Info Offline, Meeting Locations, Communications Tested) · Evacuation 20% (4: Evac Destinations, Evac Routes, …) · Shelter in place 15% (4) · Documents & finances 15% (3) · Kids/pets/dependents 10% (1) · Sharing & accessibility 10% (3). 20 checks.
- Per-check output: status (**Not captured** vs **Fail**) · confidence % (97–100) · evidence quote · analysis · **"Next step:"** remediation.
- Verdicts: "Not ready — You have a plan started. Most of the work is still ahead." Scored runs kept with timestamp; "Audit Another Plan."

### F11 — Knowledge Check (quizzes)
- 12 quizzes × 10 questions: Random, PACE Plan, EXFIL Plan, Authentication Table, Card of the Day, One-Time Pad, Cipher, Inventory, Vehicle Checklist, Go-Bag, Notes & Checklists, Planning Principles.
- Quiz UI: "Question 1 of 10", Exit Quiz, Score, progress %, **difficulty label** (e.g. DIFFICULT), True/False statements. 80%+ unlocks achievements.

### F12 — Achievements & gamification
- 31 achievements, +10…+50 pts, levels ("Level 1 — Planner Initiate"), profile shows total points + level + completed count.
- Examples: Boots on the Ground (first login, +10), First Scenario (first plan, +10), Drill Responder (click drill notification, +50), Group Member (+50), Go-Bag Secured (100% checklist, +20), Full Spectrum Comms (all 4 PACE methods, +20), quiz-mastery achievements (+20 each).

### F13 — AI Assistant (Premium)
- OpenAI-powered chat: "emergency preparedness, survival techniques, and general questions." Plain chat UI; message timestamps; Enter to send.

### F14 — References
- Static reference cards: International Morse Code, NATO Phonetic Alphabet, Q-Codes (radio comms).

### F15 — Billing & paywall
- Free $0 forever: 2 condition plans, 2 sheets of every type, join 1 group (limited). Excluded: Communication sheets, AI features, Route Builder, unlimited groups, priority support.
- Premium: **$59.99/yr** (7-day free trial; recommended) · **$6.99/mo** · **Lifetime $99.99** one-time.
- Risk reversal: "Complete the guided setup and still don't think it was worth it — we'll refund your first year."
- Gated pages (Assistant, Route Builder, Audit pre-plan) are upsell pages listing the full Premium checklist + CTA. "Already purchased? Enter your code."

### F16 — Notifications
- Drill notifications (achievement references "Click on a drill notification and open the app"); notification settings tab in Profile.

### F17 — Support
- Contact form (email + message); direct email app@madgear.shop; FAQ hub with categories (Getting Started, Plans & Organization, Groups & Sharing, Premium Features, AI Features, Security & Privacy, Points & Achievements, Technical); physical planner store (madgear.shop).

## 4. Non-functional requirements

- **Offline claim:** marketing promises offline sync; observed: Firestore cloud backend — app shell may cache, but CRUD needs connectivity. (Clone decision for HazırPlan: true offline-first, local-first storage.)
- Auth SSO must not break in embedded webviews (observed failure).
- Wizard→save must be atomic and confirmed (their bug).
- Analytics: Amplitude events on all actions.

## 5. Tech stack (verified)

Next.js (static export + RSC) · Firebase **Firestore** (project `mad-gear-cp`) · **Stytch** auth (email + Google OAuth) · **Amplitude** analytics · **OpenAI** (generation: `POST /api/ai/onboarding/v4/stream`; audit grading; assistant) · **Google Maps** (Route Builder) · Payments: code-entry ("Enter your code") + trial flow (provider unseen).

## 6. Success metrics (clone targets)

- Time-to-first-plan < 60 min (marketing promise)
- Plan completion %, sheets/plan, group invites sent, drill-notification CTR, audit runs/user, quiz completion, free→premium conversion on Audit/Assistant gates.
