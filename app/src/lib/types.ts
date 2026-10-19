// HazırPlan core types — see specs/mvp-spec.md §2
export type Hazard = 'earthquake' | 'wildfire' | 'fire' | 'flood' | 'landslide' | 'power_outage' | 'other';
export type MemberRole = 'yetişkin' | 'çocuk' | 'yaşlı' | 'engelli';

export interface HouseholdMember {
  name: string;
  role: MemberRole;
  notes?: string;
  phone?: string;
}

export interface PlanStep {
  order: number;
  title: string;
  objective?: string; // single sentence
  notes?: string;
  checklistItems: { text: string; done: boolean }[];
  sheetRefs: string[]; // linked sheets
  done: boolean;       // Mark Complete
}

export interface Plan {
  id: string;
  locale: 'tr' | 'es-PE';
  hazard: Hazard;
  title: string;
  household: {
    size: number;
    home: 'apartment' | 'house';
    members: HouseholdMember[];
  };
  circumstances: string[]; // mobility | medical_equipment | critical_meds | no_vehicle | pets | remote
  steps: PlanStep[];
  sheetIds: string[];
  notes: string;
  createdAt: number;
  updatedAt: number;
}

// ---- Sheets (6 MVP types) ----
export type SheetType = 'iletisim' | 'tahliye' | 'deprem_cantasi' | 'envanter' | 'kontrol_listesi' | 'acil_kisiler';

export interface IletisimSheet {
  type: 'iletisim';
  id: string;
  title: string;
  // PACE
  primary: string;
  alternate: string;
  contingency: string;
  emergency: string;
  outOfAreaContact: { name: string; phone: string } | null; // bölge dışı kontak
  updatedAt: number;
}

export interface TahliyeSheet {
  type: 'tahliye';
  id: string;
  title: string;
  destinations: { name: string; direction: 'north' | 'south' | 'east' | 'west' | 'other' }[];
  routeSteps: { from: string; to: string; detail?: string }[];
  hasAlternateRoute: boolean;
  transitPlan?: string; // araçsız hane için toplu taşıma planı
  updatedAt: number;
}

export interface CantItem { name: string; qty: number; expiry?: string; done: boolean }

export interface CantasiSheet {
  type: 'deprem_cantasi';
  id: string;
  title: string;
  owner: string;
  items: CantItem[];
  updatedAt: number;
}

export interface EnvanterSheet {
  type: 'envanter';
  id: string;
  title: string;
  items: CantItem[];
  waterLiters: number; // stored drinking water
  updatedAt: number;
}

export interface KontrolListesiSheet {
  type: 'kontrol_listesi';
  id: string;
  title: string;
  items: { text: string; done: boolean }[];
  updatedAt: number;
}

export interface AcilKisilerSheet {
  type: 'acil_kisiler';
  id: string;
  title: string;
  contacts: { name: string; phone: string; relation: string }[];
  // evrak & finans için referans alanlar
  documents?: { kimlikler: boolean; sigorta: boolean; nakit: boolean; kopyaYeri: string };
  updatedAt: number;
}

export type Sheet =
  | IletisimSheet | TahliyeSheet | CantasiSheet
  | EnvanterSheet | KontrolListesiSheet | AcilKisilerSheet;

// ---- Family / locations / drills ----
export interface FamilyLocation {
  id: string;
  name: string;
  type: 'rally' | 'assembly' | 'home' | 'other';
  lat: number;
  lng: number;
  notes?: string;
}

export interface DrillEntry { planId: string; date: string; kind: 'full' | 'comms' | 'evac' }

export interface Settings {
  id: 'app'; // singleton
  aileKodu: string | null;
  aileKoduSharedWith: number;
  printedCopy: boolean;
  exportedCopy: boolean;
  outsidePersonAware: boolean;
  safeRoom: string;          // güvenli oda
  hasVehicle: boolean | null; // null = kullanıcı henüz belirtmedi
}
