// Hazırlık Skoru — deterministic readiness rubric (specs/mvp-spec.md §5)
// Pure function: no I/O, no randomness, no Date.now(). Same input → same output.
import type { DrillEntry, FamilyLocation, Plan, Settings, Sheet } from '../types';

export type CheckStatus = 'pass' | 'planlanmadi' | 'basarisiz';

export interface CheckResult {
  id: string;
  label: string;
  status: CheckStatus;
  evidence: string;   // plandaki ilgili alan alıntısı
  nextStep: string;   // tek cümle, somut
}

export interface CategoryScore {
  id: string;
  name: string;
  weight: number;        // 0..1 (renormalized over applicable categories)
  applicable: boolean;
  passed: number;
  total: number;
  checks: CheckResult[];
}

export interface ScoreResult {
  pct: number;           // 0..100
  level: 'Daha yeni başladınız' | 'Yoldasınız' | 'Hazır Aile';
  categories: CategoryScore[];
}

const W = { iletisim: 0.30, tahliye: 0.20, siginma: 0.15, evrak: 0.15, bakim: 0.10, paylasim: 0.10 };

// Türkçe-güvenli metin katlama: JS 'İ'.toLowerCase() → 'i̇' (birleşik nokta U+0307)
// üretir ve eşleştirmeyi bozar (code-review-1 P1 fix).
function trFold(s: string): string {
  return s.replace(/İ/g, 'i').replace(/I/g, 'ı').toLocaleLowerCase('tr');
}

// Bir tipteki hangi sheet skorlanır? KURAL: plan.sheetIds sırasındaki İLK sheet.
// Plan bağlantılı sheet yoksa (elle eklenen) array'deki ilkine düşer.
// Ücretsiz tier tipte 2 sheet'e izin verir; kural deterministik ve belgelenmiştir.
function sheetOf(plan: Plan, sheets: Sheet[], type: Sheet['type']): Sheet | undefined {
  for (const id of plan.sheetIds) {
    const s = sheets.find((x) => x.id === id && x.type === type);
    if (s) return s;
  }
  return sheets.find((x) => x.type === type);
}

function mk(id: string, label: string, ok: boolean | null, evidence: string, nextStep: string): CheckResult {
  // ok === null → konu planda hiç yok ("planlanmadi"); false → açıkça hayır/eksik
  return { id, label, status: ok === true ? 'pass' : ok === false ? 'basarisiz' : 'planlanmadi', evidence, nextStep };
}

/**
 * scorePlan — computes the Hazırlık Skoru.
 * Deterministic: depends only on its inputs.
 */
export function scorePlan(plan: Plan, sheets: Sheet[], drills: DrillEntry[], settings: Settings, locations: FamilyLocation[] = [], ozelIhtiyacStepTitles: string[] = []): ScoreResult {
  const iletisim = sheetOf(plan, sheets, 'iletisim') as IletisimLike | undefined;
  const tahliye = sheetOf(plan, sheets, 'tahliye') as TahliyeLike | undefined;
  const envanter = sheetOf(plan, sheets, 'envanter') as EnvanterLike | undefined;
  const acilKisiler = sheetOf(plan, sheets, 'acil_kisiler') as KisilerLike | undefined;
  // Tatbikat kayıtları PLAN BAZLI değerlendirilir (karar: per-plan attribution,
  // code-review-1 fix) — başka planın tatbikatı bu plana puan vermez.
  const planDrills = drills.filter((d) => d.planId === plan.id);

  // ---------- İletişim (30%) ----------
  const paceCount = iletisim ? [iletisim.primary, iletisim.alternate, iletisim.contingency, iletisim.emergency].filter(Boolean).length : 0;
  const commsChecks: CheckResult[] = [
    mk('pace_dolu', 'PACE dolu (4/4 yöntem)',
      iletisim ? paceCount === 4 : null,
      iletisim ? `İletişim Planı: ${paceCount}/4 yöntem dolu` : 'İletişim Planı yok',
      'Ana, yedek, yedek2 ve acil iletişim yöntemlerini yazın. Cep şebekesi çalışmayabilir: aile radiosu, mesajlaşma uygulaması ve fiziksel buluşma noktası yedek olarak düşünün.'),
    mk('bolge_disi_kontak', 'Bölge dışı kontak tanımlı',
      iletisim?.outOfAreaContact ? !!iletisim.outOfAreaContact.phone : null,
      iletisim?.outOfAreaContact ? `Kontak: ${iletisim.outOfAreaContact.name}` : 'Bölge dışı kontak yok',
      'Sizden uzakta yaşayan bir kişiyi seçin, haber verin. Aile fertleri herkesin numarasını telefonun yanına yazılı tutsun.'),
    mk('cevrimdisi_kontak', 'Kontaklar çevrimdışı erişilebilir',
      settings.printedCopy || settings.exportedCopy,
      settings.printedCopy ? 'Yazdırılmış kopya var' : settings.exportedCopy ? 'Dijital yedek var' : 'Yazdırılmış/dijital kopya yok',
      'Kişi listesini yazdırın. Bir kopyası çantaya, biri buzdolabına, biri de araca.'),
    mk('bulusma_noktalari', '2 buluşma noktası tanımlı',
      locations.filter((l) => l.type === 'rally').length >= 2 ? true : null,
      locations.length ? `Konumlar: ${locations.length}, buluşma: ${locations.filter((l) => l.type === 'rally').length}` : 'Konum yok',
      'İki gerçek yer seçin. Biri evin yürüme mesafesinde, diğeri birkaç km ötede, gideceğiniz yönde. Adres veya tanımlı yer adı verin.'),
    mk('iletisim_tatbikat', 'İletişim tatbikatı yapıldı',
      planDrills.some((d) => d.kind === 'comms' || d.kind === 'full') ? true : false,
      planDrills.length ? `Bu planın tatbikat kaydı: ${planDrills.length}` : 'Bu plan için tatbihat kaydı yok',
      'Bir Cumartesi seçin. Planın iletişim kısmını baştan sona çalıştırın. Bozuk bir şey mutlaka bulacaksınız. Onu düzeltin.'),
  ];

  // ---------- Tahliye (20%) ----------
  const noVehicle = plan.circumstances.includes('no_vehicle') || settings.hasVehicle === false;
  const aracCheck = noVehicle
    ? mk('arac_plani', 'Toplu taşıma planı', tahliye?.transitPlan ? true : false,
        tahliye?.transitPlan ? 'Toplu taşıma planı var' : 'Araç yok, plan yok',
        'Araçsız hane: otobüs/metro/dolmuş güzergâhlarını ve yürüyüş alternatifini yazın.')
    : settings.hasVehicle === true
      ? mk('arac_plani', 'Araç/Yol planı', true, 'Araç var',
          'Benzin deposunu yarım tutmayın; tatbikatta rotayı bir kez arabayla sürün.')
      : mk('arac_plani', 'Araç/Yol planı', null, 'Araç durumu belirtilmemiş',
          'Ayarlar bölümünde aracınız olup olmadığını işaretleyin; araçsızsanız toplu taşıma planı isteriz.');
  const tahliyeChecks: CheckResult[] = [
    mk('tahliye_hedefleri', '2 farklı yönde tahliye hedefi',
      tahliye ? (tahliye.destinations.length >= 2 && new Set(tahliye.destinations.map((d) => d.direction)).size >= 2) : null,
      tahliye ? `Hedefler: ${tahliye.destinations.length}` : 'Tahliye Rotası yok',
      'Kuzeyde bir yakınınız, güneyde bir diğerini seçin. Arayın, kabul edeceklerini teyit edin. İki adresi de yazın.'),
    mk('rota_adimlari', 'Rota adımları girili',
      tahliye ? tahliye.routeSteps.length > 0 : null,
      tahliye ? `Rota adımı: ${tahliye.routeSteps.length}` : 'Rota adımı yok',
      'Evden buluşma noktasına ve oradan toplanma alanına giden adımları yazın. Köprüleri ve tek geçiş noktalarını not edin.'),
    mk('alternatif_rota', 'Alternatif rota var',
      tahliye ? tahliye.hasAlternateRoute : null,
      tahliye ? (tahliye.hasAlternateRoute ? 'Alternatif rota işaretli' : 'Alternatif rota yok') : 'Rota yok',
      'Ana rota kapanırsa: bir alternatif belirleyin. Duman veya enkaz yüzünden yollar kapanır.'),
    aracCheck
  ];

  // ---------- Evde Sığınma (15%) ----------
  const requiredWater = plan.household.size * 9; // 3 gün × kişi başı 3L (2L içme + 1L hazırlık)
  const medsNeeded = plan.circumstances.includes('critical_meds') || plan.circumstances.includes('medical_equipment');
  const siginmaChecks: CheckResult[] = [
    mk('guvenli_oda', 'Güvenli oda tanımlı',
      settings.safeRoom ? true : null,
      settings.safeRoom ? `Güvenli oda: ${settings.safeRoom}` : 'Güvenli oda belirtilmemiş',
      'Evde dış duvarlardan uzak, düşen eşyadan korunan bir oda seçin (genelde banyo/çamaşır odası gibi küçük iç mekânlar).'),
    mk('su_72s', '72 saat su (kişi başı)',
      envanter ? envanter.waterLiters >= requiredWater : null,
      envanter ? `Su: ${envanter.waterLiters}L / gerekli ${requiredWater}L` : 'Envanter yok',
      `Hane başına gereken: ${requiredWater}L. Kapalı şişelerle, karanlık ve serin bir yerde saklayın.`),
    mk('envanter_doluluk', 'Envanter temel eşyalar dolu',
      envanter ? envanter.items.filter((i) => i.done).length >= 8 : null,
      envanter ? `Envanter: ${envanter.items.length} kalem, ${envanter.items.filter((i) => i.done).length} hazır` : 'Envanter yok',
      'İlk yardım, el feneri, yedek pil, güç bankası, ıslık, toz maskesi, uzun ömürlü gıda — temel listeyi tamamlayın ve "hazır" olarak işaretleyin.'),
  ];
  if (medsNeeded) {
    siginmaChecks.push(
      mk('medikal_ihtiyac', 'İlaç/medikal ihtiyaçlar kayıtlı',
        envanter && envanter.items.some((i) => trFold(i.name).includes('ilaç') || trFold(i.name).includes('ilac')) ? true : false,
        'Kritik ilaç/medikal cihaz işaretli',
        'Sürekli kullanılan ilaçların 7 günlük yedeğini envantere ekleyin; son kullanma tarihini takip edin.'));
  }

  // ---------- Evrak & Finans (15%) ----------
  const docs = acilKisiler?.documents;
  const evrakChecks: CheckResult[] = [
    mk('kimlik_listesi', 'Kimlik belgeleri listesi', docs ? docs.kimlikler : null,
      docs ? (docs.kimlikler ? 'Kimlik listesi tam' : 'Kimlik listesi eksik') : 'Evrak bölümü yok',
      'Kimlik, tapu, diploma, sağlık belgeleri: neyin nerede olduğunu yazın (dolap, banka kasası...).'),
    mk('sigorta_bilgi', 'Sigorta bilgileri', docs ? docs.sigorta : null,
      docs ? (docs.sigorta ? 'Sigorta bilgisi var' : 'Sigorta bilgisi yok') : 'Evrak bölümü yok',
      'DASK ve varsa diğer poliçelerin poliçe numaralarını ve telefonlarını plana yazın.'),
    mk('nakit_kopya', 'Nakit buffer + kopya yeri', docs ? docs.nakit && !!docs.kopyaYeri : null,
      docs ? `Nakit: ${docs.nakit ? 'var' : 'yok'} · Kopya: ${docs.kopyaYeri || 'belirtilmemiş'}` : 'Evrak bölümü yok',
      'Elektrik/POS çöker: evde nakit bulundurun. Belgelerin fotoğrafını çantadaki USB\'ye kopyalayın.'),
  ];

  // ---------- Bakıma Muhtaş Kişiler (10%, koşullu) ----------
  const hasDependents = plan.household.members.some((m) => m.role === 'çocuk' || m.role === 'yaşlı' || m.role === 'engelli')
    || plan.circumstances.includes('mobility') || plan.circumstances.includes('medical_equipment');
  const bakimChecks: CheckResult[] = hasDependents ? [
    mk('ozel_ihtiyac_plani', 'Özel ihtiyaç planı kayıtlı',
      // Yapısal veri: sihirbaz, bağımlı hanelere ve koşullara otomatik adım enjekte
      // eder (assemble.ts). Kontrol, bilinen enjekte-adım başlıklarını arar —
      // serbest metin eşleştirmesi değil (code-review-1 P1 fix).
      plan.steps.length === 0 ? null : plan.steps.some((s) => ozelIhtiyacStepTitles.includes(s.title)),
      plan.steps.length ? `Adım sayısı: ${plan.steps.length}, özel ihtiyaç adımı aranıyor` : 'Plan adımı yok',
      'Kim kime, ne zaman yardım edecek? Planı yeniden oluşturun: sihirbaz, hane üyelerinize göre "kim sorumlu" adımını otomatik ekler.'),
  ] : [];

  // ---------- Paylaşım & Erişilebilirlik (10%) ----------
  const paylasimChecks: CheckResult[] = [
    mk('aile_kodu', 'Aile Kodu ile paylaşılmış (≥1 üye)',
      settings.aileKodu ? settings.aileKoduSharedWith >= 1 : null,
      settings.aileKodu ? `Paylaşılan üye: ${settings.aileKoduSharedWith}` : 'Aile Kodu oluşturulmamış',
      'Aile Kodunu oluşturup herkese gönderin:QR ya da kod. Plan tek telefonda kalırsa, o telefon kaybolursa plan da kaybolur.'),
    mk('yazdirilmis_kopya', 'Yazdırılmış kopya var',
      settings.printedCopy ? true : false,
      settings.printedCopy ? 'Yazdırılmış' : 'Yazdırılmamış',
      'Planı yazdırıp buzdolabına asın. Telefon biter, kağıt bitmez.'),
    mk('aile_disi_haberdar', 'Aile dışı bir kişi planın varlığından haberdar',
      settings.outsidePersonAware ? true : null,
      settings.outsidePersonAware ? 'Haberdar kişi işaretli' : 'İşaretlenmemiş',
      'Bir komşu veya akraba, planınızın olduğunu bilsin. O koordine edebilir.'),
  ];

  // ---------- Assemble ----------
  const cats: CategoryScore[] = [];
  const push = (id: string, name: string, weight: number, checks: CheckResult[], applicable: boolean) => {
    const total = checks.length;
    if (!applicable || total === 0) { cats.push({ id, name, weight: 0, applicable: false, passed: 0, total: 0, checks: [] }); return; }
    const passed = checks.filter((c) => c.status === 'pass').length;
    cats.push({ id, name, weight, applicable: true, passed, total, checks });
  };
  push('iletisim', 'İletişim', W.iletisim, commsChecks, true);
  push('tahliye', 'Tahliye', W.tahliye, tahliyeChecks, true);
  push('siginma', 'Evde Sığınma', W.siginma, siginmaChecks, true);
  push('evrak', 'Evrak & Finans', W.evrak, evrakChecks, true);
  push('bakim', 'Bakıma Muhtaş Kişiler', W.bakim, bakimChecks, hasDependents);
  push('paylasim', 'Paylaşım & Erişilebilirlik', W.paylasim, paylasimChecks, true);

  const applicableWeight = cats.filter((c) => c.applicable).reduce((s, c) => s + c.weight, 0) || 1;
  const score = cats
    .filter((c) => c.applicable)
    .reduce((s, c) => s + (c.total ? c.passed / c.total : 0) * (c.weight / applicableWeight), 0);
  const pct = Math.round(score * 100);
  const level = pct < 40 ? 'Daha yeni başladınız' : pct < 70 ? 'Yoldasınız' : 'Hazır Aile';
  return { pct, level, categories: cats.map((c) => ({ ...c, weight: c.applicable ? c.weight / applicableWeight : 0 })) };
}

// minimal structural interfaces (avoid circular imports)
interface IletisimLike { primary: string; alternate: string; contingency: string; emergency: string; outOfAreaContact: { name: string; phone: string } | null }
interface TahliyeLike { destinations: { direction: string }[]; routeSteps: unknown[]; hasAlternateRoute: boolean; transitPlan?: string }
interface EnvanterLike { waterLiters: number; items: { name: string; qty: number; done: boolean }[] }
interface KisilerLike { documents?: { kimlikler: boolean; sigorta: boolean; nakit: boolean; kopyaYeri: string } }
