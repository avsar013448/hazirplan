// Deterministic plan assembly: wizard answers + TR content pack → Plan + linked Sheets.
// Pure: takes an injectable clock + id generator so it stays testable/deterministic.
import type {
  Plan, PlanStep, Sheet, Hazard, HouseholdMember, MemberRole,
} from '../types';

export interface WizardAnswers {
  hazard: Hazard;
  extraText?: string;          // step 5 free text (0/500)
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
      default: {
        const sheet: Sheet = { type: 'kontrol_listesi', id, title: type, items: [], updatedAt: opts.now };
        return sheet;
      }
    }
  };

  const roleFor = (memberId: string): MemberRole | undefined =>
    memberId === 'children' ? 'çocuk' : memberId === 'elderly' ? 'yaşlı'
    : memberId === 'special_needs' ? 'engelli' : 'yetişkin';

  const steps: PlanStep[] = [];
  const addCircumstanceStepsAfter = (sheetType: string) => {
    for (const c of answers.circumstances) {
      const inj = pack.circumstanceSteps[c.id];
      if (inj && inj.afterSheet === sheetType) {
        steps.push(mkStep({ title: inj.title, objective: inj.objective }, []));
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
  steps.forEach((s, i) => (s.order = i + 1));

  const members: HouseholdMember[] = answers.members.map((m) => ({
    name: m.label, role: roleFor(m.id) ?? 'yetişkin',
  }));

  const plan: Plan = {
    id: planId,
    locale: pack.locale === 'tr' ? 'tr' : 'es-PE',
    hazard: answers.hazard,
    title: template.title,
    household: { size: answers.householdSize, home: answers.home, members },
    circumstances: answers.circumstances.map((c) => c.id),
    steps,
    sheetIds: sheets.map((s) => s.id),
    notes: answers.extraText ?? '',
    createdAt: opts.now,
    updatedAt: opts.now,
  };

  return { plan, sheets };
}
