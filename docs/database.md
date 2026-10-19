# Database Structure — ReadyPlan Clone

Backend verified: **Firebase Firestore** (project `mad-gear-cp`), real-time listeners (Firestore Listen/Write channels observed); auth via Stytch (Firebase tokens refreshed via securetoken); analytics events to Amplitude.

Legend: ✅ field/shape verified from live UI · ○ inferred (safe default for the clone).

## Collections

### `users/{uid}` ✅(profile page fields)
```
uid            string (Stytch → Firebase mapping) ○
email          string ✅ ("managed by your authentication provider")
displayName    string ✅
avatarInitial  string ✅ ("B" shown)
level          int ✅ (Level 1 "Planner Initiate")
totalPoints    int ✅ (10)
memberSince    timestamp ✅ (October 2026)
subscription   enum ✅ (free | premium | lifetime; plan + renewal data ○)
               — trial: 7 days, charged after ✅
settings       map ✅ (tabs observed): notifications{}, privacy{}, appearance{}, comms{}
authProvider   enum ✅ (email | google)
```

### `plans/{planId}` ✅(plan editor + view + wizard)
```
planId         string ✅ (id-style: XOQSLsdbbMqkqpxpLMKf)
ownerId        uid ○
title          string ✅ ("Enter plan name...", e.g. "TEST - HazırPlan Research")
hazard         enum ○ (wizard: hurricane|earthquake|wildfire|flood|tornado|other; category: natural|home|travel)
householdSize  int ✅ (1–10+)
zipCode        string? ✅ (optional)
members        array ✅ (children, elderly65, pets, specialNeeds flags)
circumstances  array ✅ (mobility, medicalEquipment, criticalMeds, languageBarriers,
               limitedResources, noVehicle, remoteLocation)
steps          array ✅ [
                 order int, title string ("Step title"), objective string
                 ("single sentence"), notes string, checklistItems [] ("Add checklist"),
                 linkedSheetIds [] ("Link Items"), done bool ("Mark Complete") ○
               ]
generated      bool + generatorVersion ○ (AI-generated vs manual; v4 endpoint)
pacePlanId     ref? ✅ ("PACE Plan: None" slot)
exfilPlanId    ref? ✅
planNotes      string ✅ ("Planning Notes")
pinned         bool ✅ (Pin)
updatedAt      timestamp ✅ ("Updated 10/18/2026")
```

### `sheets/{sheetId}` ✅(taxonomy + PACE editor)
```
sheetId        string ○
ownerId / groupId ref ○ (sheets appear in personal collection AND group tabs)
type           enum ✅ (pace | exfil | inventory | goBag | checklist | vehicleChecklist |
               notes | reference | cardOfDay | oneTimePad | authTable)
title          string ○
-- type-specific payload (map): --
pace:           planType enum ✅ (genericPace | commsPlan),
                primary/alternate/contingency/emergency string ✅ (P/A/C/E fields),
                notes ✅
exfil:          routeId ref ○, waypoints[] ○ (from Route Builder "Create EXFIL Plan")
inventory/goBag: items[] {name, qty, expiry} ○ ("kit management", expiry tracked via
                achievements)
updatedAt      timestamp ○
```

### `templates/{templateId}` ✅(catalog + Wartime preview)
```
kind           enum ✅ (plan | sheet) — 12 plan + 36 sheet templates
name           string ✅ ("Wartime Evacuation Plan")
category       string ✅ ("Wartime", "Evacuation Plan", "Flood", …)
description    string ○
steps[]        ✅ [
                 order, text ("Decide on evacuation based on location of hostilities…"),
                 linkedSheets: [{name:"Wartime Evacuation Notes", type:"notes"}, …]
               ]
notes          string ✅ ("Sample wartime evacuation plan… update info as needed")
premium        bool ○ (some may gate)
```

### `groups/{groupId}` ✅(create modal + group view)
```
groupId        string ○
name           string ✅
description    string? ✅
isPrivate      bool ✅ ("Only invited members can see and join this group")
ownerId        uid ○
memberCount    int ✅ ("1 members")
sheetCount     int ✅ ("0 sheets")
sharedPlanRefs [] ✅ ("Add Plans from My Collection")
sharedSheetRefs [] ○, sharedLocationRefs [] ○ (group tabs: Plans/Sheets/Locations)
createdAt      timestamp ○
```

### `groups/{groupId}/members/{uid}` ✅(members tab)
```
uid            ref ✅ (member entry)
role           enum ✅ (admin — "Admin · You"; member/viewer ○)
displayName    string ✅ ("Unknown User" until profile sync)
joinedAt       timestamp ○
```

### `invites/{inviteId}` ○(Invite Member modal: email + Send Invitation)
```
groupId ref · email string · status enum (sent|accepted|expired) ·
role default ○ · invitedBy uid · createdAt
```

### `locations/{locationId}` ✅(locations page; free cap 5)
```
ownerId/groupRef ○ · name string ✅ · lat/lng ✅ (click-on-map) ·
type enum ○ (home/rally/assembly) · notes ○
```

### `routes/{routeId}` ○(Route Builder: start/end, waypoints, options; Create EXFIL Plan links)
```
ownerId · start {lat,lng,name} · end {lat,lng,name} · waypoints[] ·
options map · provider: "google" ✅
```

### `audits/{auditId}` ✅(audit page + result)
```
planId ref ✅ · rubricVersion "consumer-household-readiness-v1.2.0" ✅
selfAssessment map ✅ (drill bool, outOfAreaContact bool, offlineAccess [printed|
  handwritten|digitalCopy|binder|other], householdAccess bool, outsiderAware bool)
score            0–100 ✅ · verdictLabel ✅ ("Not ready") ·
categoryScores[] ✅ {name, weight, checksPassed, checksTotal} ·
checkResults[] ✅ {name, status: notCaptured|fail, confidencePct, evidenceQuote,
  analysis, nextStep} · quota 5/month ✅ · createdAt ✅ (scored timestamp shown)
```

### `quizzes/{quizId}` + `quizAttempts/{attemptId}` ✅(knowledge check)
```
quiz:    title ✅ (12 quizzes) · questionCount 10 ✅ ·
         questions[] {statement string, answer bool (True/False), difficulty enum ✅}
attempt: quizId · userId · score ✅ ("Score: 0/0") · completedAt ·
         unlock threshold 80% ✅ (achievements)
```

### `achievements/{achievementId}` + `users/{uid}/achievements/{...}` ✅(achievements page)
```
achievement: key, title ("Drill Responder"), description ("Click on a drill notification
  and open the app"), points (10–50), target int ("0/1", "0/3") — 31 total ✅
userAchievement: status (completed ✅ "Completed on 10/17/2026" | inProgress) · completedAt
```

### `notifications/{id}` ○(drill reminders; "Drill Responder" achievement references
notification click; Profile → Notifications settings tab ✅)
```
userId · kind enum (drill | achievement | product) · payload · readAt
```

## Key relationships

```
users 1─n plans n─n steps (embedded) ─n linked sheets (by ref)
users 1─n sheets; groups n─m users (via members subcollection)
groups 1─n sharedPlans/sharedSheets (refs to personal items — "Add Plans from My Collection")
plans 1─1 pacePlanId / exfilPlanId (optional slot refs)
routes 1─0..1 exfilPlan ("Create EXFIL Plan")
plans 1─n audits (5/month quota enforcement)
users 1─n quizAttempts; quiz ≥80% → achievements
templates → instantiated as plans/sheets on use
```

## Security rules sketch (clone)

- Plans/sheets/locations: owner-only read/write; group-shared items readable by
  group members (members subcollection lookup).
- Invites: write-only by group admin; readable by invite email's user.
- Audit quota: enforced server-side (5/month) — counter doc per user+month.
- KVKK note (TR clone): this Firestore shape = personal data in cloud; TR MVP
  avoids the backend entirely (local-first, see specs/mvp-spec.md) and re-introduces
  only this sync model in Phase 2 with compliance review.
