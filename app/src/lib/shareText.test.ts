import { describe, expect, it } from 'vitest';
import { buildShareText } from './shareText';
import type { Plan, Sheet } from './types';

const plan: Plan = {
  id: 'p1', locale: 'tr', hazard: 'earthquake', title: 'Deprem Planı',
  household: { size: 3, home: 'apartment', members: [] },
  circumstances: [], sheetIds: ['s1', 's2'],
  steps: [
    { order: 1, title: 'Çök-Kapan-Tutun', checklistItems: [], sheetRefs: [], done: true },
    { order: 2, title: 'Gaz kontrolü', checklistItems: [], sheetRefs: [], done: false },
  ],
  notes: '', createdAt: 0, updatedAt: 0,
};

describe('buildShareText', () => {
  it('includes title, numbered steps with done markers, contacts and PACE', () => {
    const sheets: Sheet[] = [
      { type: 'acil_kisiler', id: 's1', title: 'Acil Kişiler',
        contacts: [{ name: 'Acil Çağrı Merkezi', phone: '112', relation: 'kurum' },
                   { name: 'Ayşe Teyze', phone: '0533...', relation: 'akraba' }],
        updatedAt: 0 },
      { type: 'iletisim', id: 's2', title: 'İletişim', primary: 'Telefon', alternate: 'SMS',
        contingency: 'WhatsApp', emergency: 'Buluşma', outOfAreaContact: { name: 'Teyze', phone: '0533...' }, updatedAt: 0 },
    ];
    const text = buildShareText(plan, sheets);
    expect(text).toContain('Deprem Planı');
    expect(text).toContain('✅ 1. Çök-Kapan-Tutun');
    expect(text).toContain('⬜ 2. Gaz kontrolü');
    expect(text).toContain('112');
    expect(text).toContain('Ana: Telefon | Yedek: SMS');
    expect(text).toContain('Bölge dışı kontak: Teyze — 0533...');
    expect(text).toContain('HazırPlan');
  });

  it('omits empty sections (no contacts, no PACE fields)', () => {
    const sheets: Sheet[] = [
      { type: 'acil_kisiler', id: 's1', title: 'Acil Kişiler', contacts: [], updatedAt: 0 },
      { type: 'iletisim', id: 's2', title: 'İletişim', primary: '', alternate: '', contingency: '', emergency: '', outOfAreaContact: null, updatedAt: 0 },
    ];
    const text = buildShareText(plan, sheets);
    expect(text).not.toContain('ACİL KİŞİLER');
    expect(text).not.toContain('İLETİŞİM (PACE)');
    expect(text).toContain('ADIMLAR');
  });
});
