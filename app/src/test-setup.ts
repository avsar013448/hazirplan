// jsdom'un crypto'sunda subtle yok — Node webcrypto ile tamamla (sadece test)
import { webcrypto } from 'node:crypto';

if (!(globalThis.crypto as { subtle?: unknown })?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}
export {};