import { describe, expect, it } from 'vitest';
import { assemblePlan, type WizardAnswers } from './assemble';
import pack from '../../content/tr.json';

const baseAnswers: WizardAnswers = {
  hazard: 'earthquake',
  householdSize: 4,
  home: 'apartment',
  members: [{ id: 'children', label: 'Çocuk (0-18)' }],
  circumstances: [],
};

const opts = { now: 1_700_000_000_000, idFactory: (() => { let n = 0; return () => `id-${++n}`; })() };
const freshOpts = () => ({ now: 1_700_000_000_000, idFactory: (() => { let n = 0; return () => `id-${++n}`; })() });

describe('assemblePlan — deterministic template assembly', () => {
  it('earthquake template builds 6 steps with linked sheets', () => {
    const { plan, sheets } = assemblePlan(baseAnswers, pack as never, opts);
    expect(plan.title).toBe('Deprem Planı');
    expect(plan.steps).toHaveLength(6);
    expect(plan.steps.map((s) => s.order)).toEqual([1, 2, 3, 4, 5, 6]);
    // çanta, tahliye, iletisim, acil_kisiler sheets created + linked
    const types = sheets.map((s) => s.type).sort();
    expect(types).toEqual(['acil_kisiler', 'deprem_cantasi', 'iletisim', 'tahliye']);
    const cantasi = plan.steps[2]; // "Çantayı ve aileyi topla"
    expect(cantasi.sheetRefs).toHaveLength(1);
    expect(sheets.find((s) => s.id === cantasi.sheetRefs[0])?.type).toBe('deprem_cantasi');
    // çanta skeleton has the 12 curated items
    const cantasiSheet = sheets.find((s) => s.type === 'deprem_cantasi')!;
    expect(cantasiSheet.type === 'deprem_cantasi' && cantasiSheet.items).toHaveLength(12);
    // household + members carried through
    expect(plan.household.size).toBe(4);
    expect(plan.household.members[0].role).toBe('çocuk');
  });

  it('wildfire template uses Hazır/Bekle/Tahliye phased structure', () => {
    const { plan } = assemblePlan({ ...baseAnswers, hazard: 'wildfire' }, pack as never, opts);
    expect(plan.title).toBe('Orman Yangını Planı');
    expect(plan.steps.map((s) => s.title)).toEqual([
      'Uyarı takibi: AFAD ve mahalle hattını kontrol et',
      '"Hazır" seviyesi: evin çevresini ve çantayı hazırla',
      '"Bekle" seviyesi: herkes hazır, rota net',
      '"Tahliye" seviyesi: buluşma noktasına hareket',
      'İletişim: aile ve mahalle hattı',
    ]);
  });

  it('injects circumstance steps after their anchor sheet steps', () => {
    const answers: WizardAnswers = {
      ...baseAnswers,
      circumstances: [
        { id: 'critical_meds' }, { id: 'no_vehicle' }, { id: 'pets' },
      ],
    };
    const { plan } = assemblePlan(answers, pack as never, opts);
    const titles = plan.steps.map((s) => s.title);
    // ilaç step right after the çanta step
    const cantasiIdx = titles.findIndex((t) => t.includes('Çantayı'));
    expect(titles[cantasiIdx + 1]).toBe('Kritik ilaçları ve reçeteleri al');
    expect(titles).toContain('Evcil hayvan planı');
    expect(titles).toContain('Toplu taşıma / yürüyüş planı');
    expect(plan.circumstances).toEqual(['critical_meds', 'no_vehicle', 'pets']);
  });

  it('is deterministic: same answers → identical output', () => {
    const a = assemblePlan(baseAnswers, pack as never, freshOpts());
    const b = assemblePlan(baseAnswers, pack as never, freshOpts());
    expect(a).toEqual(b);
  });

  it('unknown hazard falls back to generic template', () => {
    const { plan } = assemblePlan({ ...baseAnswers, hazard: 'other' }, pack as never, opts);
    expect(plan.title).toBe('Acil Durum Planı');
  });

  it('no_vehicle pre-arms the tahliye sheet transit plan', () => {
    const { sheets } = assemblePlan(
      { ...baseAnswers, circumstances: [{ id: 'no_vehicle' }] }, pack as never, opts);
    const tahliye = sheets.find((s) => s.type === 'tahliye');
    expect(tahliye && tahliye.type === 'tahliye' && 'transitPlan' in tahliye).toBe(true);
  });
});
