// Dexie — local-first storage. All app data lives on this device (no backend in MVP).
import Dexie, { type Table } from 'dexie';
import type { Plan, Sheet, DrillEntry, FamilyLocation, Settings } from '../types';

export class HazirPlanDB extends Dexie {
  plans!: Table<Plan, string>;
  sheets!: Table<Sheet, string>;
  locations!: Table<FamilyLocation, string>;
  drillLog!: Table<DrillEntry, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('hazirplan');
    this.version(1).stores({
      plans: 'id, hazard, updatedAt',
      sheets: 'id, type, updatedAt',
      locations: 'id, type',
      drillLog: '++id, planId, date',
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
    printedCopy: false, exportedCopy: false, outsidePersonAware: false,
    safeRoom: '', hasVehicle: null,
  };
  await db.settings.put(fresh);
  return fresh;
}
