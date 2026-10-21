// Dexie — local-first storage. All app data lives on this device (no backend in MVP).
import Dexie, { type Table } from 'dexie';
import type { Plan, Sheet, DrillEntry, FamilyLocation, Settings, ShareLogEntry } from '../types';

export class HazirPlanDB extends Dexie {
  plans!: Table<Plan, string>;
  sheets!: Table<Sheet, string>;
  locations!: Table<FamilyLocation, string>;
  drills!: Table<DrillEntry, string>;
  shareLog!: Table<ShareLogEntry, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('hazirplan');
    // v1 (shipped): drillLog '++id' auto-increment — cihazlar arası divergent key,
    // LWW merge imkânsız (code-review-1 bulgusu). DEXIE PRIMARY KEY DEĞİŞTİRMEYİ
    // REDDEDER ("Not yet support for changing primary key") — eski v1 kurulumlarda
    // açılış ÇÖKERTİYORDU (code-review-2 P0, migration.test.ts ile kanıtlı).
    // Doğru yol: yeni 'drills' store (client UUID) + upgrade'te veri taşıma,
    // ardından v3'te legacy drillLog tablosunu düşürmek (Dexie'de şemadan
    // çıkarılan store silinir — taşıma bittiği için güvenli).
    this.version(1).stores({
      plans: 'id, hazard, updatedAt',
      sheets: 'id, type, updatedAt',
      locations: 'id, type',
      drillLog: '++id, planId, date',
      settings: 'id',
    });
    this.version(2)
      .stores({
        plans: 'id, hazard, updatedAt',
        sheets: 'id, type, updatedAt',
        locations: 'id, type',
        drillLog: '++id, planId, date', // değişmedi — PK değişimi Dexie'de yasak
        drills: 'id, planId, date',     // yeni: client UUID anahtarlı
        settings: 'id',
      })
      .upgrade(async (tx) => {
        // eski auto-increment girdilerini UUID'li yeni tabloya taşı
        const legacy = await tx.table('drillLog').toArray();
        if (legacy.length) {
          const rows: DrillEntry[] = legacy.map((d) => ({
            id: crypto.randomUUID(),
            planId: (d as DrillEntry).planId,
            date: (d as DrillEntry).date,
            kind: (d as DrillEntry).kind,
          }));
          await tx.table('drills').bulkPut(rows);
        }
      });
    // v3: legacy drillLog düşürülür (veri v2'de drills'a taşındı) + shareLog
    // (komşu/arkadaş/misafir/grup — skor 'aile dışı haberdar' gerçek veriden okur)
    this.version(3).stores({
      plans: 'id, hazard, updatedAt',
      sheets: 'id, type, updatedAt',
      locations: 'id, type',
      drills: 'id, planId, date',
      shareLog: 'id, planId, date',
      settings: 'id',
    });
  }
}

export const db = new HazirPlanDB();

export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get('app');
  if (s) return s;
  const fresh: Settings = {
    id: 'app', aileKodu: null, aileKoduSharedWith: 0,
    printedCopy: false, exportedCopy: false,
    safeRoom: '', hasVehicle: null, updatedAt: Date.now(),
  };
  await db.settings.put(fresh);
  return fresh;
}

// Ayar güncelleme — updatedAt her zaman güncellenir (merge hazırlığı).
export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const cur = await getSettings();
  const next = { ...cur, ...patch, updatedAt: Date.now() };
  await db.settings.put(next);
  return next;
}

// Paylaşım günlüğü — her paylaşım EYLEM olarak kaydedilir; Hazırlık Skoru'nun
// 'aile dışı haberdar' kontrolü bu gerçek veriden okur (settings checkbox değil).
export async function logShare(entry: ShareLogEntry): Promise<ShareLogEntry> {
  await db.shareLog.put(entry);
  return entry;
}

export async function getShares(planId: string): Promise<ShareLogEntry[]> {
  return db.shareLog.where('planId').equals(planId).toArray();
}