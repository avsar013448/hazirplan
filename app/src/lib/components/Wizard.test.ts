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

  it('calls the onsaved callback after save', async () => {
    let called = 0;
    const { container } = render(Wizard, { props: { onsaved: () => (called++) } });
    for (let i = 0; i < 4; i++) await clickByText(container, 'Devam');
    await clickByText(container, 'Planımı Oluştur');
    await waitFor(() => expect(container.textContent).toContain('Planı Kaydet'), { timeout: 5000 });
    await clickByText(container, 'Planı Kaydet');
    await waitFor(() => expect(called).toBe(1));
  });
});
