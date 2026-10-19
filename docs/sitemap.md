# Sitemap — ReadyPlan Clone

Verified live 2026-10-18 (authenticated, Premium). All URLs on `https://www.readyplanapp.com`.

## Public (unauthenticated)

```
/                       Marketing landing (hero, social proof, how-it-works, pricing, founder story)
/login/                 Email+password / Continue with Google
/register/              Sign-up (7-day trial CTAs point here)
/contact/               Help & Support (contact form + FAQs link)
/faq/                   FAQ hub — categories: Getting Started · Plans & Organization ·
                        Groups & Sharing · Premium Features · AI Features ·
                        Security & Privacy · Points & Achievements · Technical
/upgrade/               Pricing page (also in-app)
External: madgear.shop (physical planner store, privacy, terms)
```

## App (authenticated)

```
/dashboard/                         Home: Quick Actions (New Plan · Add Inventory ·
                                    Checklist) · Your Plans · Preparedness Assessment +
                                    Recommendations · Achievements widget · embedded
                                    Plan Builder wizard (modal)
/dashboard/plans/new/               Manual plan editor (name, steps, PACE/EXFIL slots,
                                    notes, Save Changes)
/dashboard/plans/{planId}/          Plan view (Pin · View · Edit · Reset Plan · Download ·
                                    steps w/ Mark Complete)
/templates/                         Template catalog: 12 plan templates · 36 sheet
                                    templates · Filters · Suggest Template ·
                                    Preview (steps → linked sheets)
/groups/                            Groups list (create w/ Premium; join w/ invite)
/groups/{groupId}/                  Group view: tabs Plans · Sheets · Locations ·
                                    Members (Invite Member → email; roles; Delete Group)
/ai-chat/                           AI Assistant (Premium; plain chat)
/knowledge-check/                   Quiz hub (12 quizzes × 10 questions)
/knowledge-check/{quizId}/          Quiz runner (Question n/10 · Exit · Score ·
                                    progress · difficulty label · True/False)
/achievements/                      31 achievements · points · levels · filters
                                    (All / Completed / In Progress)
/profile/                           Profile & Settings tabs: Profile · Notifications ·
                                    Privacy · Appearance · Account · Comms
/dashboard/route-builder/           Route Builder (Premium): start/end, map click,
                                    Routes/Waypoints/Options, Calculate Routes,
                                    Create EXFIL Plan
/dashboard/locations/               Locations map (free cap: 5)
/dashboard/audit/                   Plan Audit (Premium, 5/mo): plan picker →
                                    5-question self-assessment → rubric score
/references/                        Reference cards: Morse Code · NATO Phonetic ·
                                    Q-Codes
/upgrade/                           Billing/upsell (Free vs Premium $59.99-yr/$6.99-mo;
                                    Lifetime $99.99; trial; code entry)
```

## Client-side states (no standalone URL)

- **Sheets views:** Sheets sidebar submenu (11 types, each with View all / Create new);
  sheet editors open in-page (`/dashboard/sheets/*` resolves 404 as direct URL — in-app
  navigation only)
- **Plan Builder wizard:** modal over /dashboard/ (steps 1–6 incl. streaming generation)
- **Group creation / Invite Member modals**

## Navigation model

Persistent sidebar (all pages): Dashboard · Plans (View all plans / Create new plan) ·
Sheets (11 subtypes) · Groups · Templates · Assistant · Route Builder · Locations ·
Audit · Knowledge Check · Achievements · References · Profile · Help & Support ·
Upgrade to Premium · Sign Out. Mobile nav: hamburger → same tree.
