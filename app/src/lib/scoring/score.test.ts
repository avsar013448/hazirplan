import { describe, expect, it } from 'vitest';
import { scorePlan } from './score';
import type { Plan, Settings, Sheet, DrillEntry, FamilyLocation } from '../types';

const emptySettings: Settings = {
  id: 'app', aileKodu: null, aileKoduSharedWith: 0,
  printedCopy: false, exportedCopy: false, outsidePersonAware: false,
  safeRoom: '', hasVehicle: null, updatedAt: 0,
};

const emptyPlan: Plan = {
  id: 'p1', locale: 'tr', hazard: 'earthquake', title: 'Deprem Planı',
  household: { size: 4, home: 'apartment', members: [] },
  circumstances: [], steps: [], sheetIds: [], notes: '',
  createdAt: 0, updatedAt: 0,
};

describe('scorePlan — Hazırlık Skoru', () => {
  it('empty plan scores 0% and reports "Daha yeni başladınız"', () => {
    const r = scorePlan(emptyPlan, [], [], emptySettings, []);
    expect(r.pct).toBe(0);
    expect(r.level).toBe('Daha yeni başladınız');
    // all categories present
    expect(r.categories.map((c) => c.id)).toEqual(['iletisim', 'tahliye', 'siginma', 'evrak', 'bakim', 'paylasim']);
    // bakım category is N/A when no dependents
    const bakim = r.categories.find((c) => c.id === 'bakim')!;
    expect(bakim.applicable).toBe(false);
    // applicable weights renormalize to 1
    const w = r.categories.filter((c) => c.applicable).reduce((s, c) => s + c.weight, 0);
    expect(Math.round(w * 1000)).toBe(1000);
  });

  it('fully-prepared household scores 100%', () => {
    const plan: Plan = {
      ...emptyPlan,
      household: { size: 2, home: 'apartment', members: [{ name: 'A', role: 'yetişkin' }] },
    };
    const sheets: Sheet[] = [
      { type: 'iletisim', id: 's1', title: 'İletişim', primary: 'Telefon', alternate: 'SMS', contingency: 'WhatsApp', emergency: 'Buluşma noktası', outOfAreaContact: { name: 'Teyze', phone: '0533...' }, updatedAt: 0 },
      { type: 'tahliye', id: 's2', title: 'Tahliye', destinations: [{ name: 'Kuzey', direction: 'north' }, { name: 'Güney', direction: 'south' }], routeSteps: [{ from: 'Ev', to: 'Okul' }], hasAlternateRoute: true, updatedAt: 0 },
      { type: 'envanter', id: 's3', title: 'Envanter', items: Array.from({ length: 9 }, (_, i) => ({ name: `Eşya ${i}`, qty: 1, done: true })), waterLiters: 18, updatedAt: 0 },
      { type: 'acil_kisiler', id: 's4', title: 'Acil Kişiler', contacts: [], documents: { kimlikler: true, sigorta: true, nakit: true, kopyaYeri: 'USB' }, updatedAt: 0 },
    ];
    const drills: DrillEntry[] = [{ id: 'd1', planId: 'p1', date: '2026-10-01', kind: 'comms' }];
    const settings: Settings = {
      ...emptySettings, aileKodu: 'KOD1234', aileKoduSharedWith: 3,
      printedCopy: true, outsidePersonAware: true, safeRoom: 'Banyo', hasVehicle: true,
    };
    const locations: FamilyLocation[] = [
      { id: 'l1', name: 'Okul bahçesi', type: 'rally', lat: 0, lng: 0 },
      { id: 'l2', name: 'Stadyum', type: 'rally', lat: 0, lng: 0 },
    ];
    const r = scorePlan(plan, sheets, drills, settings, locations);
    expect(r.pct).toBe(100);
    expect(r.level).toBe('Hazır Aile');
    for (const c of r.categories.filter((x) => x.applicable)) {
      expect(c.passed).toBe(c.total);
    }
  });

  it('household with dependents activates the bakım category', () => {
    const plan: Plan = {
      ...emptyPlan,
      household: { size: 3, home: 'apartment', members: [{ name: 'Kai', role: 'çocuk' }] },
    };
    const r = scorePlan(plan, [], [], emptySettings, []);
    const bakim = r.categories.find((c) => c.id === 'bakim')!;
    expect(bakim.applicable).toBe(true);
    expect(bakim.checks[0].status).toBe('planlanmadi');
  });

  it('distinguishes "planlanmadi" (topic absent) from "basarisiz" (explicitly no)', () => {
    const r = scorePlan(emptyPlan, [], [], emptySettings, []);
    const byId = (id: string) => r.categories.flatMap((c) => c.checks).find((c) => c.id === id)!;
    // no comms sheet at all → planlanmadi
    expect(byId('pace_dolu').status).toBe('planlanmadi');
    // drills exist = record exists; without comms drill → basarisiz
    expect(byId('iletisim_tatbikat').status).toBe('basarisiz');
    // printedCopy flag exists but is false → basarisiz
    expect(byId('yazdirilmis_kopya').status).toBe('basarisiz');
  });

  it('is deterministic — same inputs, same output', () => {
    const a = scorePlan(emptyPlan, [], [], emptySettings, []);
    const b = scorePlan(emptyPlan, [], [], emptySettings, []);
    expect(a).toEqual(b);
  });

  it('partial readiness lands in "Yoldasınız" band', () => {
    const settings: Settings = {
      ...emptySettings,
      printedCopy: true, safeRoom: 'Banyo', aileKodu: 'KOD1', aileKoduSharedWith: 2, outsidePersonAware: true,
    };
    const sheets: Sheet[] = [
      { type: 'iletisim', id: 's1', title: 'İletişim', primary: 'Telefon', alternate: 'SMS', contingency: 'WhatsApp', emergency: 'Buluşma noktası', outOfAreaContact: { name: 'Teyze', phone: '0533...' }, updatedAt: 0 },
      { type: 'tahliye', id: 's2', title: 'Tahliye', destinations: [{ name: 'Kuzey', direction: 'north' }, { name: 'Güney', direction: 'south' }], routeSteps: [{ from: 'Ev', to: 'Okul' }], hasAlternateRoute: true, updatedAt: 0 },
    ];
    const drills: DrillEntry[] = [{ id: 'd1', planId: 'p1', date: '2026-10-01', kind: 'comms' }];
    const locations: FamilyLocation[] = [
      { id: 'l1', name: 'Okul bahçesi', type: 'rally', lat: 0, lng: 0 },
      { id: 'l2', name: 'Stadyum', type: 'rally', lat: 0, lng: 0 },
    ];
    const r = scorePlan(emptyPlan, sheets, drills, settings, locations);
    expect(r.pct).toBeGreaterThan(40);
    expect(r.pct).toBeLessThan(70);
    expect(r.level).toBe('Yoldasınız');
  });

  it('attributes drills per-plan: another plan\'s drill does not pass this plan', () => {
    const drills: DrillEntry[] = [{ id: 'dx', planId: 'OTHER-PLAN', date: '2026-10-01', kind: 'comms' }];
    const r = scorePlan(emptyPlan, [], drills, emptySettings, []);
    const byId = (id: string) => r.categories.flatMap((c) => c.checks).find((c) => c.id === id)!;
    expect(byId('iletisim_tatbikat').status).toBe('basarisiz');
  });

  it('matches Turkish İ correctly (İlaçlar counts as meds)', () => {
    const plan: Plan = { ...emptyPlan, circumstances: ['critical_meds'] };
    const sheets: Sheet[] = [
      { type: 'envanter', id: 'e1', title: 'Envanter', items: [{ name: 'İlaçlar', qty: 2, done: true }], waterLiters: 0, updatedAt: 0 },
    ];
    const r = scorePlan(plan, sheets, [], emptySettings, []);
    const byId = (id: string) => r.categories.flatMap((c) => c.checks).find((c) => c.id === id)!;
    expect(byId('medikal_ihtiyac').status).toBe('pass');
  });

  it('envanter_doluluk requires 8 DONE items (qty alone is not enough)', () => {
    const sheets: Sheet[] = [
      { type: 'envanter', id: 'e2', title: 'Envanter',
        items: Array.from({ length: 10 }, (_, i) => ({ name: `Item ${i}`, qty: 5, done: false })),
        waterLiters: 0, updatedAt: 0 },
    ];
    const r = scorePlan(emptyPlan, sheets, [], emptySettings, []);
    const byId = (id: string) => r.categories.flatMap((c) => c.checks).find((c) => c.id === id)!;
    expect(byId('envanter_doluluk').status).toBe('basarisiz');
  });

  it('dependent household passes ozel_ihtiyac via injected step title', () => {
    const plan: Plan = {
      ...emptyPlan,
      household: { size: 3, home: 'apartment', members: [{ name: 'Kai', role: 'çocuk' }] },
      steps: [{ order: 1, title: 'Kim, kime yardım ediyor?', checklistItems: [], sheetRefs: [], done: false }],
    };
    const r = scorePlan(plan, [], [], emptySettings, [], ['Kim, kime yardım ediyor?']);
    const byId = (id: string) => r.categories.flatMap((c) => c.checks).find((c) => c.id === id)!;
    expect(byId('ozel_ihtiyac_plani').status).toBe('pass');
  });

  it('scores the FIRST sheet of a type in plan.sheetIds order', () => {
    const full: Sheet = { type: 'iletisim', id: 'A', title: 'Dolu', primary: 'p', alternate: 'a', contingency: 'c', emergency: 'e', outOfAreaContact: null, updatedAt: 0 };
    const empty: Sheet = { type: 'iletisim', id: 'B', title: 'Boş', primary: '', alternate: '', contingency: '', emergency: '', outOfAreaContact: null, updatedAt: 0 };
    // plan links B first — B is the one that counts
    const planB: Plan = { ...emptyPlan, sheetIds: ['B', 'A'] };
    const rB = scorePlan(planB, [full, empty], [], emptySettings, []);
    const byId = (r: ReturnType<typeof scorePlan>) => r.categories.flatMap((c) => c.checks).find((c) => c.id === 'pace_dolu')!;
    expect(byId(rB).status).toBe('basarisiz');
    const planA: Plan = { ...emptyPlan, sheetIds: ['A', 'B'] };
    const rA = scorePlan(planA, [full, empty], [], emptySettings, []);
    expect(byId(rA).status).toBe('pass');
  });
});
