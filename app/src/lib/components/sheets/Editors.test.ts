import { describe, expect, it, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import CantasiEditor from './CantasiEditor.svelte';
import PlanDetail from '../PlanDetail.svelte';
import { db } from '../../db/db';
import { assemblePlan } from '../../assembly/assemble';
import pack from '../../../content/tr.json';

const NOW = 1_700_000_000_000;

beforeEach(async () => {
  await Promise.all([db.plans.clear(), db.sheets.clear()]);
});

describe('CantasiEditor — çanta checklist persistence', () => {
  it('toggling an item persists done=true to Dexie', async () => {
    const built = assemblePlan(
      { hazard: 'earthquake', householdSize: 3, home: 'apartment', members: [], circumstances: [] },
      pack as never, { now: NOW, idFactory: () => 's1' },
    );
    const cantasi = built.sheets.find((s) => s.type === 'deprem_cantasi')!;
    await db.sheets.put(cantasi);

    const { container } = render(CantasiEditor, { props: { sheet: cantasi } });
    expect(container.textContent).toContain('0/12 hazır');

    const checkbox = container.querySelector('input[type="checkbox"]')!;
    await fireEvent.click(checkbox);

    await waitFor(async () => {
      const stored = (await db.sheets.get('s1'))!;
      expect(stored.type === 'deprem_cantasi' && stored.items[0].done).toBe(true);
    });
    expect(container.textContent).toContain('1/12 hazır');
  });

  it('setting expiry persists to Dexie', async () => {
    const built = assemblePlan(
      { hazard: 'earthquake', householdSize: 3, home: 'apartment', members: [], circumstances: [] },
      pack as never, { now: NOW, idFactory: () => 's2' },
    );
    const cantasi = built.sheets.find((s) => s.type === 'deprem_cantasi')!;
    await db.sheets.put(cantasi);

    const { container } = render(CantasiEditor, { props: { sheet: cantasi } });
    const dateInput = container.querySelector('input[type="date"]')!;
    await fireEvent.input(dateInput, { target: { value: '2027-06-01' } });
    await fireEvent.change(dateInput, { target: { value: '2027-06-01' } });

    await waitFor(async () => {
      const stored = (await db.sheets.get('s2'))!;
      expect(stored.type === 'deprem_cantasi' && stored.items[0].expiry).toBe('2027-06-01');
    });
  });
});

describe('PlanDetail — Mark Complete', () => {
  it('toggling a step persists and updates the progress counter', async () => {
    const built = assemblePlan(
      { hazard: 'earthquake', householdSize: 3, home: 'apartment', members: [], circumstances: [] },
      pack as never, { now: NOW, idFactory: (() => { let n = 0; return () => `p1-${++n}`; })() },
    );
    const planId = built.plan.id;
    await db.plans.put(built.plan);
    await db.sheets.bulkPut(built.sheets);

    const { container } = render(PlanDetail, { props: { planId } });
    await waitFor(() => expect(container.textContent).toContain('Deprem Planı'));
    expect(container.textContent).toContain('0/6 adım tamam');

    // ilk adımı tamamla
    const stepBtn = container.querySelector('.stephead')!;
    await fireEvent.click(stepBtn);

    await waitFor(async () => {
      const stored = await db.plans.get(planId);
      expect(stored?.steps[0].done).toBe(true);
    });
    await waitFor(() => expect(container.textContent).toContain('1/6 adım tamam'));
  });

  it('opens a linked sheet editor from the accordion', async () => {
    const built = assemblePlan(
      { hazard: 'earthquake', householdSize: 3, home: 'apartment', members: [], circumstances: [] },
      pack as never, { now: NOW, idFactory: (() => { let n = 0; return () => `p2-${++n}`; })() },
    );
    await db.plans.put(built.plan);
    await db.sheets.bulkPut(built.sheets);

    const { container } = render(PlanDetail, { props: { planId: built.plan.id } });
    await waitFor(() => expect(container.textContent).toContain('Sayfalar'));

    // çanta sayfasını aç
    const btns = [...container.querySelectorAll('.sheetbtn')];
    const cantasiBtn = btns.find((b) => (b.textContent ?? '').includes('Deprem Çantası'))!;
    await fireEvent.click(cantasiBtn);

    await waitFor(() => {
      expect(container.textContent).toContain('0/12 hazır');
    });
  });
});
