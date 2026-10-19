// Wizard save-path test — ReadyPlan'ın kaçırdığı kritik an (specs/mvp-spec.md §3, §9):
// sihirbaz bitince plan görünür şekilde kaydedilmeli VE Planlarım listesinde görünmeli.
import { describe, expect, it, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import Wizard from './Wizard.svelte';
import { db } from '../db/db';

beforeEach(async () => {
  await Promise.all([db.plans.clear(), db.sheets.clear()]);
});

async function clickByText(container: HTMLElement, text: string) {
  const el = [...container.querySelectorAll('button')]
    .find((b) => (b.textContent ?? '').includes(text));
  if (!el) throw new Error(`button not found: ${text}`);
  await fireEvent.click(el);
}

describe('Wizard — save path', () => {
  it('walks 5 steps, generates, saves, and confirms visibly', async () => {
    const { container } = render(Wizard);

    // Adım 1: Deprem varsayılan seçili → Devam ×4
    expect(container.textContent).toContain('Neye karşı planlıyorsunuz?');
    for (let i = 0; i < 4; i++) {
      await clickByText(container, 'Devam');
    }
    // Adım 5: Plan Özeti + Planımı Oluştur
    expect(container.textContent).toContain('Plan Özeti');
    expect(container.textContent).toContain('Deprem');
    await clickByText(container, 'Planımı Oluştur');

    // akış gösterimi biter, Kaydet butonu çıkar
    await waitFor(() => {
      expect(container.textContent).toContain('Planı Kaydet');
    }, { timeout: 5000 });
    await clickByText(container, 'Planı Kaydet');

    // GÖRÜNÜR KAYIT TEYİDİ
    await waitFor(() => {
      expect(container.textContent).toContain('Plan kaydedildi: Deprem Planı');
    });
    expect(container.textContent).toContain('Planlarım listesinde');

    // DB'YE GERÇEKTEN YAZILDI MI?
    const planCount = await db.plans.count();
    const sheetCount = await db.sheets.count();
    expect(planCount).toBe(1);
    expect(sheetCount).toBe(4); // çanta + tahliye + iletişim + acil kişiler
    const saved = await db.plans.toArray();
    expect(saved[0].title).toBe('Deprem Planı');
    expect(saved[0].steps).toHaveLength(6);
  });

  it('calls onsaved on save, onclose only on Tamam (confirmation stays visible)', async () => {
    let savedCalls = 0;
    let closeCalls = 0;
    const { container } = render(Wizard, {
      props: { onsaved: () => (savedCalls++), onclose: () => (closeCalls++) },
    });
    for (let i = 0; i < 4; i++) await clickByText(container, 'Devam');
    await clickByText(container, 'Planımı Oluştur');
    await waitFor(() => expect(container.textContent).toContain('Planı Kaydet'), { timeout: 5000 });
    await clickByText(container, 'Planı Kaydet');
    // teyit ekrani gorunur + onsaved cagrildi + modal HALE acik (onclose degil)
    await waitFor(() => expect(container.textContent).toContain('Plan kaydedildi: Deprem Planı'));
    expect(savedCalls).toBe(1);
    expect(closeCalls).toBe(0);
    // Tamam -> onclose
    await clickByText(container, 'Tamam');
    expect(closeCalls).toBe(1);
  });

  it('bumps updatedAt on save (Aile Kodu LWW merge ground truth)', async () => {
    const { container } = render(Wizard);
    for (let i = 0; i < 4; i++) await clickByText(container, 'Devam');
    await clickByText(container, 'Planımı Oluştur');
    await waitFor(() => expect(container.textContent).toContain('Planı Kaydet'), { timeout: 5000 });
    await clickByText(container, 'Planı Kaydet');
    await waitFor(async () => {
      const stored = await db.plans.toArray();
      expect(stored[0].updatedAt).toBeGreaterThan(0);
      expect(stored[0].updatedAt).toBeGreaterThanOrEqual(stored[0].createdAt);
    });
  });

  it('enforces the free-tier 3-plan cap: 4th plan is refused visibly', async () => {
    // 3 mevcut plan
    for (let i = 0; i < 3; i++) {
      await db.plans.put({
        id: `existing-${i}`, locale: 'tr', hazard: 'earthquake', title: `Plan ${i}`,
        household: { size: 2, home: 'apartment', members: [] },
        circumstances: [], steps: [], sheetIds: [], notes: '',
        createdAt: 1, updatedAt: 1,
      });
    }
    const { container } = render(Wizard);
    for (let i = 0; i < 4; i++) await clickByText(container, 'Devam');
    await clickByText(container, 'Planımı Oluştur');
    await waitFor(() => expect(container.textContent).toContain('Plan limiti doldu'), { timeout: 5000 });
    expect(await db.plans.count()).toBe(3); // 4. plan YAZILMADI
    // ve Kaydet butonu görünmez/korunaklı: 4. plan kaydedilemez
    expect([...container.querySelectorAll('button')].some((b) => (b.textContent ?? '').includes('Planı Kaydet'))).toBe(false);
  });
});
