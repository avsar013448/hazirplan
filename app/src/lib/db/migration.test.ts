import { describe, expect, it, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from './db';
import type { DrillEntry } from '../types';

// GERÇEK YÜKSELTME AKIŞI: v1 şemasında (drillLog '++id' auto-increment) oluşturulmuş
// bir veritabanı, mevcut kod (v3) açtığında ne olur? PK değişimi Dexie'de upgrade
// script'i ister — bu test yükseltmenin veri kaybı YAPMADIĞINI kanıtlar.
const DB_NAME = 'hazirplan';

function openV1Raw(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const idb = req.result;
      idb.createObjectStore('plans', { keyPath: 'id' });
      idb.createObjectStore('sheets', { keyPath: 'id' });
      idb.createObjectStore('locations', { keyPath: 'id' });
      // v1: ++id → keyPath 'id' + autoIncrement (Dexie '++id' satır-içi anahtar üretir)
      idb.createObjectStore('drillLog', { keyPath: 'id', autoIncrement: true });
      idb.createObjectStore('settings', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function putRaw(idb: IDBDatabase, store: string, value: unknown, key?: IDBValidKey): Promise<IDBValidKey> {
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(store, 'readwrite');
    const req = key !== undefined ? tx.objectStore(store).put(value, key) : tx.objectStore(store).put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

describe('Dexie v1 → v3 migration (drillLog PK change)', () => {
  beforeEach(async () => {
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    });
  });

  it('upgrades a real v1 database without throwing and preserves drill entries', async () => {
    // 1) Eski uygulama: v1 şeması + veri
    const raw = await openV1Raw();
    await putRaw(raw, 'plans', { id: 'p1', locale: 'tr', hazard: 'earthquake', title: 'Eski Plan',
      household: { size: 2, home: 'apartment', members: [] }, circumstances: [], steps: [], sheetIds: [],
      notes: '', createdAt: 1, updatedAt: 1 });
    // v1 drillLog girdisi: auto-increment anahtar (1, 2, ...) + planId alanı YOK (eski tip)
    await putRaw(raw, 'drillLog', { planId: 'p1', date: '2026-10-01', kind: 'comms' });
    await putRaw(raw, 'drillLog', { planId: 'p1', date: '2026-10-05', kind: 'full' });
    raw.close();

    // 2) Yeni uygulama aynı veritabanını açar — yükseltme gerçekleşir
    await expect(db.open()).resolves.toBeDefined();

    // 3) Veri kaybı yok mu? plan duruyor mu?
    const plan = await db.plans.get('p1');
    expect(plan?.title).toBe('Eski Plan');

    // 4) drillLog erişilebilir mi? (auto-increment anahtarları id alanına taşınmış olmalı)
    const drills = await db.drills.toArray();
    expect(drills.length).toBe(2);

    // 5) yeni giriş eklenebilir mi (id zorunlu artık)
    const entry: DrillEntry = { id: crypto.randomUUID(), planId: 'p1', date: '2026-10-10', kind: 'evac' };
    await db.drills.put(entry);
    expect(await db.drills.count()).toBe(3);
  });
});
