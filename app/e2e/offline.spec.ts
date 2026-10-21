// UÇUŞ MODU E2E — release blocker (specs/mvp-spec.md §9).
//
// Playwright setOffline emülasyonu, sayfa-initiated fetch'leri service worker
// KATMANINDAN ÖNCE keser (gerçek uçak modunda olmayan bir Chromium davranışı).
// Bu yüzden:
//   A) Isınmış-chunk offline yolculuğu: rotalar önceden ziyaret edilir (gerçek
//      kullanıcı telefonunda da böyledir), sonra ağ kapanır ve TAM kullanıcı
//      yolculuğu (2. plan oluşturma → teyit → detay → paylaş → Aile Kodu)
//      offline yürütülür.
//   B) Soğuk offline açılış kanıtı: Cache API ile doğrudan — SW precache'in
//      TAMAMEN dolu olduğu (her asset cache'te + '/' fallback HTML) ağ
//      olmadan doğrulanır. Gerçek uçak modunda SW bunları cache-first sunar.
import { test, expect, type Page } from '@playwright/test';

async function waitForSW(page: Page) {
  await page.waitForFunction(
    async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      return !!reg && !!reg.active;
    },
    undefined,
    { timeout: 15_000 },
  );
}

async function walkWizardAndSave(page: Page) {
  await page.getByRole('button', { name: 'Yeni Plan' }).click();
  await expect(page.getByText('Neye karşı planlıyorsunuz?')).toBeVisible();
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: 'Devam' }).click();
  }
  await expect(page.getByText('Plan Özeti')).toBeVisible();
  await page.getByRole('button', { name: 'Planımı Oluştur' }).click();
  await page.getByRole('button', { name: 'Planı Kaydet' }).click({ timeout: 15_000 });
  await expect(page.getByText('Plan kaydedildi: Deprem Planı')).toBeVisible();
  await page.getByRole('button', { name: 'Tamam' }).click();
  await expect(page.getByRole('link', { name: /Deprem Planı/ }).first()).toBeVisible();
}

test.describe('HazırPlan — full offline journey (flight mode)', () => {
  test('warm-chunk offline journey: plan → detail → share → Aile Kodu', async ({ page, context }) => {
    await page.goto('/');
    await waitForSW(page);

    // 1) ÇEVRİMİÇİ ısınma: 1. plan + rota chunk'ları yüklensin
    await walkWizardAndSave(page);
    await page.getByRole('link', { name: /Deprem Planı/ }).first().click();
    await expect(page.getByText('adım tamam')).toBeVisible();
    await page.getByRole('link', { name: '← Planlar' }).click();
    await page.getByRole('link', { name: 'Aile' }).click();
    // SPA navigasyonu tick ister — hedef spesifik, retryable bekleme
    await expect(page.getByRole('heading', { level: 2, name: /Aile Kodu/ })).toBeVisible();
    await page.getByRole('link', { name: '← Panel' }).click();
    await expect(page.getByRole('button', { name: 'Yeni Plan' })).toBeVisible();

    // 2) UÇUŞ MODU — ağ tamamen kapalı
    await context.setOffline(true);

    // 3) 2. plan TAMAMEN offline: sihirbaz → üret → kaydet → GÖRÜNÜR TEYİT
    await walkWizardAndSave(page);
    await expect(page.getByRole('link', { name: /Deprem Planı/ }).first()).toBeVisible();

    // 4) Offline SPA navigasyonu: plan detayı
    await page.getByRole('link', { name: /Deprem Planı/ }).first().click();
    await expect(page.getByText('adım tamam')).toBeVisible();
    await expect(page.getByRole('button', { name: /Paylaş/ })).toBeVisible();

    // 5) Paylaş diyaloğu offline (buildShareText + Dexie okuma)
    await page.getByRole('button', { name: /Paylaş/ }).click();
    await expect(page.getByText('Kimle paylaşıyorsunuz?')).toBeVisible();
    await page.getByRole('button', { name: 'Tamam' }).click();

    // 6) Aile Kodu offline: WebCrypto üret + şifreli paket (HPK1)
    await page.getByRole('link', { name: '← Planlar' }).click();
    await page.getByRole('link', { name: 'Aile' }).click();
    await expect(page.getByRole('heading', { level: 2, name: /Aile Kodu/ })).toBeVisible();
    await page.getByRole('button', { name: 'Kod Oluştur' }).click();
    await expect(page.locator('.code')).toContainText(/[0-9A-Z]{8}/);
    await page.getByRole('button', { name: 'Şifreli Paket Hazırla' }).click();
    // PBKDF2 (210k iterasyon) asenkron — retryable bekle
    await expect(page.locator('textarea').first()).toHaveValue(/^HPK1\./, { timeout: 15_000 });
  });

  test('cold offline start proof: SW precache is COMPLETE via Cache API', async ({ page }) => {
    await page.goto('/');
    await waitForSW(page);

    const result = await page.evaluate(async () => {
      const keys = await caches.keys();
      if (!keys.length) return { error: 'no cache' };
      const cache = await caches.open(keys[0]);
      const reqs = await cache.keys();
      const bad: string[] = [];
      let html = false;
      for (const req of reqs) {
        const res = await cache.match(req); // Cache API — ağ yok, saf doğrulama
        if (!res || !res.ok) bad.push(new URL(req.url).pathname);
        if (new URL(req.url).pathname === '/' && res?.ok && (res.headers.get('content-type') ?? '').includes('html')) html = true;
      }
      const js = reqs.filter((r) => r.url.includes('/_app/')).length;
      return { total: reqs.length, bad, rootIsHtml: html, appAssets: js };
    });

    expect(result.error).toBeUndefined();
    // app shell + tüm route chunk'ları + CSS + ikonlar + manifest — hepsi precache'te
    expect(result.appAssets).toBeGreaterThan(10);
    expect(result.total).toBeGreaterThan(result.appAssets);
    expect(result.bad).toEqual([]);
    // '/' fallback HTML olarak önbellekte — offline navigasyonların kökü
    expect(result.rootIsHtml).toBe(true);
  });
});
