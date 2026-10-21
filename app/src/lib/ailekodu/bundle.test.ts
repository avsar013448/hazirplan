import { describe, expect, it, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { exportFamilyBundle, importFamilyBundle } from './bundle';
import { db, getSettings } from '../db/db';
import { assemblePlan } from '../assembly/assemble';
import type { Plan, Sheet } from '../types';
import pack from '../../content/tr.json';

const NOW = 1_700_000_000_000;
const ids = (() => { let n = 0; return () => `m-${++n}`; })();

beforeEach(async () => {
  await Promise.all([db.plans.clear(), db.sheets.clear(), db.locations.clear(),
    db.drillLog.clear(), db.shareLog.clear(), db.settings.clear()]);
});

function planFixture(title: string, updatedAt: number): { plan: Plan; sheets: Sheet[] } {
  const built = assemblePlan(
    { hazard: 'earthquake', householdSize: 2, home: 'apartment', members: [], circumstances: [] },
    pack as never, { now: NOW, idFactory: ids },
  );
  built.plan.title = title;
  built.plan.updatedAt = updatedAt;
  return built;
}

describe('Aile verisi — LWW birleştirme', () => {
  it('export produces a complete v1 bundle of everything in the DB', async () => {
    const built = planFixture('Deprem Planı', NOW);
    await db.plans.put(built.plan);
    await db.sheets.bulkPut(built.sheets);
    await getSettings();

    const bundle = await exportFamilyBundle();
    expect(bundle.v).toBe(1);
    expect(bundle.plans).toHaveLength(1);
    expect(bundle.sheets).toHaveLength(4);
    expect(bundle.settings.id).toBe('app');
    expect(bundle.exportedAt).toBeGreaterThan(0);
  });

  it('import adds missing records and keeps newer local ones (LWW)', async () => {
    // yerelde: plan (güncel, updatedAt 2000) + sheet'ler
    const local = planFixture('Yerel Deprem', 2000);
    await db.plans.put(local.plan);
    await db.sheets.bulkPut(local.sheets);

    // gelen pakette: aynı id'li ama ESKİ plan (1000) + yeni bir plan
    const older = planFixture('Eski Başlık', 1000);
    older.plan.id = local.plan.id;
    const fresh = planFixture('Yeni Plan', 3000);
    const bundle = {
      v: 1 as const, exportedAt: NOW + 1,
      plans: [older.plan, fresh.plan],
      sheets: older.sheets, locations: [], drillLog: [], shareLog: [],
      settings: { ...(await getSettings()), updatedAt: 1 },
    };

    const report = await importFamilyBundle(bundle);

    // eski plan yerelde kalır (başlık korunur), yeni plan eklenir
    expect(await db.plans.get(local.plan.id)).toMatchObject({ title: 'Yerel Deprem' });
    expect(report.plansUpdated).toBe(0);
    expect(report.plansAdded).toBe(1);
    expect(await db.plans.count()).toBe(2);
  });

  it('import updates local records when incoming updatedAt is newer', async () => {
    const local = planFixture('Yerel', 1000);
    await db.plans.put(local.plan);

    const newer = planFixture('Uzak Düzenleme', 2000);
    newer.plan.id = local.plan.id;
    const bundle = {
      v: 1 as const, exportedAt: NOW, plans: [newer.plan], sheets: [],
      locations: [], drillLog: [], shareLog: [],
      settings: { ...(await getSettings()), updatedAt: 1 },
    };

    const report = await importFamilyBundle(bundle);
    expect(report.plansUpdated).toBe(1);
    expect(await db.plans.get(local.plan.id)).toMatchObject({ title: 'Uzak Düzenleme' });
  });

  it('import never overwrites local aileKodu identity from a bundle', async () => {
    await getSettings();
    const { updateSettings } = await import('../db/db');
    await updateSettings({ aileKodu: 'AB12CD34', safeRoom: 'Banyo' });
    const localSettings = await getSettings();

    const bundle = {
      v: 1 as const, exportedAt: NOW, plans: [], sheets: [], locations: [],
      drillLog: [], shareLog: [],
      settings: { ...localSettings, aileKodu: 'ZZZZ9999', updatedAt: localSettings.updatedAt + 1000 },
    };
    await importFamilyBundle(bundle);

    const after = await getSettings();
    expect(after.aileKodu).toBe('AB12CD34'); // yerel kod korunur
  });

  it('drill/share logs merge as union by id (no duplicates)', async () => {
    await getSettings();
    const s = await getSettings();
    const bundle = {
      v: 1 as const, exportedAt: NOW, plans: [], sheets: [], locations: [],
      drillLog: [{ id: 'd1', planId: 'pX', date: '2026-10-01', kind: 'comms' as const }],
      shareLog: [{ id: 'sh1', planId: 'pX', kind: 'komsu' as const, method: 'whatsapp' as const, date: '2026-10-01' }],
      settings: { ...s, updatedAt: 1 },
    };
    await importFamilyBundle(bundle);
    await importFamilyBundle(bundle); // ikinci kez — çoğalmasın
    expect(await db.drillLog.count()).toBe(1);
    expect(await db.shareLog.count()).toBe(1);
  });

  it('rejects malformed bundles loudly', async () => {
    await expect(importFamilyBundle({ v: 9, plans: [] })).rejects.toThrow(/tanınamadı|HPK1/);
    await expect(importFamilyBundle(null)).rejects.toThrow();
  });
});