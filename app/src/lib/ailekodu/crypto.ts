// Aile Kodu — şifreli aile verisi (WebCrypto AES-GCM, backend yok).
// Kod: 8 karakter Crockford base32 (≡ 40 bit; PBKDF2 ile brute-force maliyeti artırılır).
// Zarf biçimi: "HPK1." + b64(salt) + "." + b64(iv) + "." + b64(ciphertext)

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // I,L,O,U hariç — karışma engeli
const KEY_ITERATIONS = 210_000; // OWASP PBKDF2-SHA256 önerisi

export function generateAileKodu(length = 8): string {
  const vals = new Uint8Array(length);
  crypto.getRandomValues(vals);
  let out = '';
  for (let i = 0; i < length; i++) out += CROCKFORD[vals[i] % CROCKFORD.length];
  return out;
}

function b64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function unb64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(code: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', enc.encode(normalizeCode(code)), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations: KEY_ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export function normalizeCode(code: string): string {
  // Kullanıcı küçük harf/o harfleri karışık yazabilir; boşluk/tire de girebilir
  return code.trim().toUpperCase().replace(/[\s-]/g, '')
    .replace(/[Oo]/g, '0').replace(/[Iİı]/g, '1').replace(/[Uu]/g, 'V');
}

export async function encryptBundle(data: unknown, code: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const key = await deriveKey(code, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as unknown as BufferSource }, key, plaintext));
  return `HPK1.${b64(salt)}.${b64(iv)}.${b64(ct)}`;
}

export async function decryptBundle(payload: string, code: string): Promise<unknown> {
  const parts = payload.trim().split('.');
  if (parts.length !== 4 || parts[0] !== 'HPK1') {
    throw new Error('Biçim geçersiz: bu bir HazırPlan aile verisi değil (HPK1 zarfı bekleniyor).');
  }
  const [, saltB, ivB, ctB] = parts;
  const key = await deriveKey(code, unb64(saltB));
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: unb64(ivB) as unknown as BufferSource },
      key,
      unb64(ctB) as unknown as BufferSource,
    );
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    throw new Error('Aile Kodu hatalı ya da veri bozuk — çözülemedi.');
  }
}

export function isFamilyPayload(text: string): boolean {
  return /^HPK1\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/.test(text.trim());
}