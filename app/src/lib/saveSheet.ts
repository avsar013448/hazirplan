// Sheet autosave helper — $state proxy'leri IndexedDB'ye yazılamaz (DataCloneError),
// her yazmadan önce düz nesneye çevir. Sheet'ler saf JSON verisi olduğu için
// JSON round-trip güvenli ve bağımlılıksızdır ($state.snapshot sadece bileşen
// içinde derleme-zamanlı çalışır).
import { db } from './db/db';
import type { Sheet } from './types';

export function plainSheet(sheet: Sheet): Sheet {
  return JSON.parse(JSON.stringify(sheet)) as Sheet;
}

// updatedAt HER yazmada güncellenir: dashboard sıralaması ve gelecek Aile Kodu
// last-write-wins merge'i bu alana dayanır (code-review-1 P1 fix).
export async function saveSheet(sheet: Sheet): Promise<Sheet> {
  const now = Date.now();
  const plain = plainSheet(sheet);
  plain.updatedAt = now;
  await db.sheets.put(plain);
  return plain;
}
