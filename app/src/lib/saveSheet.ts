// Sheet autosave helper — $state proxy'leri IndexedDB'ye yazılamaz (DataCloneError),
// her yazmadan önce düz nesneye çevir. Sheet'ler saf JSON verisi olduğu için
// JSON round-trip güvenli ve bağımlılıksızdır ($state.snapshot sadece bileşen
// içinde derleme-zamanlı çalışır).
import { db } from './db/db';
import type { Sheet } from './types';

export function plainSheet(sheet: Sheet): Sheet {
  return JSON.parse(JSON.stringify(sheet)) as Sheet;
}

export async function saveSheet(sheet: Sheet): Promise<void> {
  await db.sheets.put(plainSheet(sheet));
}
