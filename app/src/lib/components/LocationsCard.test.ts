import { describe, expect, it, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import LocationsCard from './LocationsCard.svelte';
import { db } from '../db/db';

beforeEach(async () => {
  await db.locations.clear();
});

describe('LocationsCard — buluşma noktaları (deploy-readiness producer)', () => {
  it('adds a rally point that persists to Dexie and shows the score hint at 2+', async () => {
    const { container } = render(LocationsCard);
    expect(container.textContent).toContain('Henüz nokta yok');

    for (const name of ['Okul bahçesi', 'Stadyum']) {
      const input = container.querySelector('input[type=text]') as HTMLInputElement;
      await fireEvent.input(input, { target: { value: name } });
      await fireEvent.click([...container.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes('Ekle'))!);
    }

    await waitFor(async () => {
      const locs = await db.locations.toArray();
      expect(locs).toHaveLength(2);
      expect(locs.filter((l) => l.type === 'rally')).toHaveLength(2);
    });
    await waitFor(() => expect(container.textContent).toContain('2+ buluşma noktası'));

    // silme çalışır
    await fireEvent.click(container.querySelector('button.del')!);
    await waitFor(async () => expect((await db.locations.toArray()).length).toBe(1));
  });
});
