// Deterministic plan assembly: wizard answers + TR content pack → Plan + linked Sheets.
// Pure: takes an injectable clock + id generator so it stays testable/deterministic.
import type {
  Plan, PlanStep, Sheet, Hazard, HouseholdMember, MemberRole,
} from '../types';

export interface WizardAnswers {
  hazard: Hazard;
  extraText?: string;          // step 5 free text (0/500)
  otherTitle?: string;         // 'Diğer' tehlike için plan adı (0/50)
  householdSize: number;
  home: 'apartment' | 'house';
  members: { id: string; label: string }[];        // step 3 selections
  circumstances: { id: string; label?: string }[]; // step 4 selections
}

export interface ContentPack {
  locale: string;
  planTemplates: Record<string, {
    title: string;
    steps: {
      title: string; objective?: string; notes?: string;
      checklist?: string[]; sheets: string[];
    }[];
  }>;
  sheetSkeletons: Record<string, Record<string, unknown>>;
  circumstanceSteps: Record<string, { afterSheet: string; title: string; objective: string }>;
  dependentStep?: { title: string; objective: string };
}

export interface AssembleOptions {
  now: number;                 // injected clock (ms epoch)
  idFactory: () => string;     // injected id generator
}

/**
 * assemblePlan — builds a Plan and its linked Sheets from wizard answers.
 * "Planımı Oluştur" without AI: template assembly + circumstance injection.
 */
export function assemblePlan(answers: WizardAnswers, pack: ContentPack, opts: AssembleOptions): { plan: Plan; sheets: Sheet[] } {
  const template = pack.planTemplates[answers.hazard] ?? pack.planTemplates.other;
  const sheets: Sheet[] = [];
  const planId = opts.idFactory();

  const mkStep = (s: { title: string; objective?: string; notes?: string; checklist?: string[] }, sheetRefs: string[]): PlanStep => ({
    order: 0, // assigned below
    title: s.title,
    objective: s.objective,
    notes: s.notes,
    checklistItems: (s.checklist ?? []).map((text) => ({ text, done: false })),
    sheetRefs,
    done: false,
  });

  // sheet factory per skeleton type
  const makeSheet = (type: string): Sheet => {
    const id = opts.idFactory();
    switch (type) {
      case 'deprem_cantasi': {
        const skel = pack.sheetSkeletons.deprem_cantasi as { title: string; items: { name: string; qty: number }[] };
        const sheet: Sheet = { type: 'deprem_cantasi', id, title: skel.title, owner: 'Aile',
          items: skel.items.map((i) => ({ name: i.name, qty: i.qty, done: false })), updatedAt: opts.now };
        return sheet;
      }
      case 'iletisim': {
        const skel = pack.sheetSkeletons.iletisim as { title: string; primary: string; alternate: string; contingency: string; emergency: string };
        const sheet: Sheet = { type: 'iletisim', id, title: skel.title, primary: skel.primary, alternate: skel.alternate,
          contingency: skel.contingency, emergency: skel.emergency, outOfAreaContact: null, updatedAt: opts.now };
        return sheet;
      }
      case 'tahliye': {
        const skel = pack.sheetSkeletons.tahliye as { title: string; routeSteps: { from: string; to: string }[] };
        const sheet: Sheet = { type: 'tahliye', id, title: skel.title, destinations: [],
          routeSteps: skel.routeSteps.map((r) => ({ ...r })), hasAlternateRoute: false,
          transitPlan: answers.circumstances.some((c) => c.id === 'no_vehicle') ? '' : undefined, updatedAt: opts.now };
        return sheet;
      }
      case 'acil_kisiler': {
        const skel = pack.sheetSkeletons.acil_kisiler as { title: string; contacts: { name: string; phone: string; relation: string }[] };
        const sheet: Sheet = { type: 'acil_kisiler', id, title: skel.title,
          contacts: skel.contacts.map((c) => ({ ...c })), updatedAt: opts.now };
        return sheet;
      }
      case 'envanter': {
        const sheet: Sheet = { type: 'envanter', id, title: 'Envanter', items: [], waterLiters: 0, updatedAt: opts.now };
        return sheet;
      }
      case 'kontrol_listesi': {
        const sheet: Sheet = { type: 'kontrol_listesi', id, title: 'Kontrol Listesi', items: [], updatedAt: opts.now };
        return sheet;
      }
      default: {
        // Bilinmeyen tip = content pack hatası. Sessizce yanlış sheet üretmek
        // yerine bağıra bağıra patla (code-review-1 P2 fix).
        throw new Error(`Bilinmeyen sheet tipi: "${type}" — content pack ile kod uyuşmuyor`);
      }
    }
  };

  const roleFor = (memberId: string): MemberRole | undefined =>
    memberId === 'children' ? 'çocuk' : memberId === 'elderly' ? 'yaşlı'
    : memberId === 'special_needs' ? 'engelli' : 'yetişkin';

  const steps: PlanStep[] = [];
  // Aynı koşul, birden fazla anchor adımına bağlanmışsa her seferinde yeniden
  // enjekte edilmesin (code-review-1 P2 fix)
  const injectedCircumstances = new Set<string>();
  const addCircumstanceStepsAfter = (sheetType: string) => {
    for (const c of answers.circumstances) {
      const inj = pack.circumstanceSteps[c.id];
      if (inj && inj.afterSheet === sheetType && !injectedCircumstances.has(c.id)) {
        steps.push(mkStep({ title: inj.title, objective: inj.objective }, []));
        injectedCircumstances.add(c.id);
      }
    }
  };

  for (const s of template.steps) {
    const refs: string[] = [];
    for (const type of s.sheets) {
      const sheet = makeSheet(type);
      sheets.push(sheet);
      refs.push(sheet.id);
    }
    steps.push(mkStep(s, refs));
    // circumstance steps attach right AFTER the step that owns their anchor sheet
    for (const type of s.sheets) addCircumstanceStepsAfter(type);
  }
  // Bağımlı hane üyesi (çocuk/yaşlı/özel bakım) varsa "kim, kime yardım ediyor?"
  // adımı enjekte edilir — Hazırlık Skoru'nun ozel_ihtiyac_plani kontrolü tam bu
  // adımı arar; böylece kontrol UI'sız producer veriyle geçilebilir (review P1 fix).
  if (pack.dependentStep && answers.members.some((m) => ['children', 'elderly', 'special_needs'].includes(m.id))) {
    steps.push(mkStep({ title: pack.dependentStep.title, objective: pack.dependentStep.objective }, []));
  }
  steps.forEach((s, i) => (s.order = i + 1));

  // Evcil hayvan İNSAN üyesi değil: 'pets' seçimi circumstances'a gider,
  // members listesine değil (code-review-1 P2 fix).
  const humanMemberAnswers = answers.members.filter((m) => m.id !== 'pets');
  const hasPets = answers.members.some((m) => m.id === 'pets');
  const members: HouseholdMember[] = humanMemberAnswers.map((m) => ({
    name: m.label, role: roleFor(m.id) ?? 'yetişkin',
  }));
  const circumstances = answers.circumstances.map((c) => c.id);
  if (hasPets && !circumstances.includes('pets')) circumstances.push('pets');

  // Hane tutarlılığı: üye sayısı > seçilen kişi sayısı ise üye sayısını kullan
  // (skor requiredWater ve bağımlı tespiti buna dayanır — code-review-1 P2 fix).
  const householdSize = Math.max(answers.householdSize, members.length);

  const plan: Plan = {
    id: planId,
    locale: pack.locale === 'tr' ? 'tr' : 'es-PE',
    hazard: answers.hazard,
    title: (answers.hazard === 'other' && answers.otherTitle?.trim())
      ? answers.otherTitle.trim().slice(0, 50)
      : template.title,
    household: { size: householdSize, home: answers.home, members },
    circumstances,
    steps,
    sheetIds: sheets.map((s) => s.id),
    notes: answers.extraText ?? '',
    createdAt: opts.now,
    updatedAt: opts.now,
  };

  return { plan, sheets };
}
