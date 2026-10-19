import { describe, expect, it, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import ShareDialog from './ShareDialog.svelte';
import { db, getSettings } from '../db/db';
import { assemblePlan } from '../assembly/assemble';
import pack from '../../content/tr.json';

const NOW = 1_700_000_000_000;

beforeEach(async () => {
  await Promise.all([db.plans.clear(), db.sheets.clear(), db.shareLog.clear(), db.settings.clear()]);
});

function fixture() {
  const built = assemblePlan(
    { hazard: 'earthquake', householdSize: 3, home: 'apartment', members: [], circumstances: [] },
    pack as never, { now: NOW, idFactory: (() => { let n = 0; return () => `sh-${++n}`; })() },
  );
  return built;
}

describe('ShareDialog — komşu/arkadaş/misafir/grup paylaşımı', () => {
  it('WhatsApp action logs a share with the selected recipient', async () => {
    const built = fixture();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { container } = render(ShareDialog, {
      props: { plan: built.plan, sheets: built.sheets, onclose: () => {} },
    });

    // Komşu seçili (varsayılan) + isim gir
    const nameInput = container.querySelector('input.name') as HTMLInputElement;
    await fireEvent.input(nameInput, { target: { value: 'Ayşe Teyze' } });
    await fireEvent.click([...container.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes('WhatsApp'))!);

    await waitFor(async () => {
      const log = await db.shareLog.toArray();
      expect(log).toHaveLength(1);
      expect(log[0].kind).toBe('komsu');
      expect(log[0].name).toBe('Ayşe Teyze');
      expect(log[0].method).toBe('whatsapp');
      expect(log[0].planId).toBe(built.plan.id);
    });
    // wa.me linki doğru metinle açıldı
    expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('wa.me'), '_blank');
    // kullanıcıya görünür teyit
    expect(container.textContent).toContain('Komşu (Ayşe Teyze) ile paylaşıldı');
    openSpy.mockRestore();
  });

  it('changing recipient kind is respected (Grup)', async () => {
    const built = fixture();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { container } = render(ShareDialog, { props: { plan: built.plan, sheets: built.sheets } });

    const grupBtn = [...container.querySelectorAll('button.kind')].find((b) => (b.textContent ?? '').includes('Grup'))!;
    await fireEvent.click(grupBtn);
    await fireEvent.click([...container.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes('Misafir görünümü'))!);

    await waitFor(async () => {
      const log = await db.shareLog.toArray();
      expect(log).toHaveLength(1);
      expect(log[0].kind).toBe('grup');
      expect(log[0].method).toBe('guest');
    });
    openSpy.mockRestore();
  });

  it('print action sets settings.printedCopy = true (real data for the score)', async () => {
    const built = fixture();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { container } = render(ShareDialog, { props: { plan: built.plan, sheets: built.sheets } });

    await fireEvent.click([...container.querySelectorAll('button')].find((b) => (b.textContent ?? '').startsWith('🖨️'))!);

    await waitFor(async () => {
      const s = await getSettings();
      expect(s.printedCopy).toBe(true);
      const log = await db.shareLog.toArray();
      expect(log[0].method).toBe('print');
    });
    expect(openSpy).toHaveBeenCalledWith(`/plan/${built.plan.id}/misafir`, '_blank');
    openSpy.mockRestore();
  });
});
