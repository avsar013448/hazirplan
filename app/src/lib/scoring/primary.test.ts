import { describe, expect, it } from 'vitest';
import { pickPrimaryPlan } from './primary';
import type { Plan } from '../types';

const mk = (id: string, createdAt: number, updatedAt = createdAt): Plan => ({
  id, locale: 'tr', hazard: 'earthquake', title: `Plan ${id}`,
  household: { size: 2, home: 'apartment', members: [] },
  circumstances: [], steps: [], sheetIds: [], notes: '', createdAt, updatedAt,
});

describe('pickPrimaryPlan — stable household score primary', () => {
  it('picks the latest CREATED plan', () => {
    const a = mk('a', 1000);
    const b = mk('b', 2000);
    expect(pickPrimaryPlan([a, b])?.id).toBe('b');
  });

  it('Mark Complete churn does NOT re-pick the primary (code-review-2 regression)', () => {
    const a = mk('a', 1000);
    const b = mk('b', 2000);
    // eski planı düzenle — updatedAt en yeni olsun
    const toggled = { ...a, updatedAt: 999999, steps: a.steps };
    expect(pickPrimaryPlan([toggled, b])?.id).toBe('b');
  });

  it('empty → undefined', () => {
    expect(pickPrimaryPlan([])).toBeUndefined();
  });
});
