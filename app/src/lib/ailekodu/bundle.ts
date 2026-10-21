// Aile verisi paketi — dışa aktarma, içe aktarma, LWW birleştirme.
// Birleştirme kuralı (specs/mvp-spec.md §6.6 + code-review-1 updatedAt ground truth):
//   plans/sheets/locations/settings: kayıt başına last-write-wins (updatedAt)
//   drillLog/shareLog: id birleşimi (girdiler değişmez)
import { db, getSettings } from '../db/db';
import type { Plan, Sheet, FamilyLocation, DrillEntry, ShareLogEntry, Settings } from '../types';

export interface FamilyBundle {
  v: 1;
  exportedAt: number;
  plans: Plan[];
  sheets: Sheet[];
  locations: FamilyLocation[];
  drillLog: DrillEntry[];
  shareLog: ShareLogEntry[];
  settings: Settings;
}

export interface MergeReport {
  plansAdded: number; plansUpdated: number;
  sheetsAdded: number; sheetsUpdated: number;
  locationsAdded: number; locationsUpdated: number;
  drillsAdded: number; sharesAdded: number;
  settingsUpdated: boolean;
}

export async function exportFamilyBundle(): Promise<FamilyBundle> {
  const [plans, sheets, locations, drillLog, shareLog, settings] = await Promise.all([
    db.plans.toArray(), db.sheets.toArray(), db.locations.toArray(),
    db.drillLog.toArray(), db.shareLog.toArray(), getSettings(),
  ]);
  return { v: 1, exportedAt: Date.now(), plans, sheets, locations, drillLog, shareLog, settings };
}

function assertBundle(x: unknown): FamilyBundle {
  const b = x as FamilyBundle;
  if (!b || b.v !== 1 || !Array.isArray(b.plans) || !Array.isArray(b.sheets)) {
    throw new Error('Paket içeriği tanınamadı — lütfen dışa aktarılan aile verisini kullanın.');
  }
  return b;
}

export async function importFamilyBundle(raw: unknown): Promise<MergeReport> {
  const b = assertBundle(raw);
  const report: MergeReport = {
    plansAdded: 0, plansUpdated: 0, sheetsAdded: 0, sheetsUpdated: 0,
    locationsAdded: 0, locationsUpdated: 0, drillsAdded: 0, sharesAdded: 0,
    settingsUpdated: false,
  };

  await db.transaction('rw', [db.plans, db.sheets, db.locations, db.drillLog, db.shareLog, db.settings], async () => {
    // plans — LWW
    for (const inc of b.plans) {
      const cur = await db.plans.get(inc.id);
      if (!cur) { await db.plans.put(inc); report.plansAdded++; }
      else if (inc.updatedAt > cur.updatedAt) { await db.plans.put(inc); report.plansUpdated++; }
    }
    // sheets — LWW
    for (const inc of b.sheets) {
      const cur = await db.sheets.get(inc.id);
      if (!cur) { await db.sheets.put(inc); report.sheetsAdded++; }
      else if (inc.updatedAt > cur.updatedAt) { await db.sheets.put(inc); report.sheetsUpdated++; }
    }
    // locations — LWW (updatedAt alanı yoksa 0 kabul edilir)
    for (const inc of b.locations) {
      const cur = await db.locations.get(inc.id);
      const incAt = (inc as { updatedAt?: number }).updatedAt ?? 0;
      const curAt = (cur as { updatedAt?: number } | undefined)?.updatedAt ?? 0;
      if (!cur) { await db.locations.put(inc); report.locationsAdded++; }
      else if (incAt > curAt) { await db.locations.put(inc); report.locationsUpdated++; }
    }
    // drillLog / shareLog — id birleşimi (girdiler değişmez)
    for (const inc of b.drillLog) {
      const cur = await db.drillLog.get(inc.id);
      if (!cur) { await db.drillLog.put(inc); report.drillsAdded++; }
    }
    for (const inc of b.shareLog) {
      const cur = await db.shareLog.get(inc.id);
      if (!cur) { await db.shareLog.put(inc); report.sharesAdded++; }
    }
    // settings — kayıt bazında LWW (updatedAt)
    const curSettings = await getSettings();
    if (b.settings && (b.settings.updatedAt ?? 0) > (curSettings.updatedAt ?? 0)) {
      // aileKodu yerel kimliğidir — gelen pakettekiyle ezme, kendi kodun korunur
      await db.settings.put({ ...b.settings, id: 'app', aileKodu: curSettings.aileKodu, aileKoduSharedWith: curSettings.aileKoduSharedWith });
      report.settingsUpdated = true;
    }
  });

  return report;
}