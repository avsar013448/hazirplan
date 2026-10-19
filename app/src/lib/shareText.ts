// Paylaşım metni üreticisi — saf fonksiyon, WhatsApp/Web Share/pano için.
import type { Plan, Sheet } from './types';

const KIND_LABEL: Record<string, string> = {
  komsu: 'Komşu', arkadas: 'Arkadaş', misafir: 'Misafir', grup: 'Grup',
};
export function shareKindLabel(kind: string): string {
  return KIND_LABEL[kind] ?? kind;
}

export function buildShareText(plan: Plan, sheets: Sheet[]): string {
  const lines: string[] = [];
  lines.push(`🛡️ ${plan.title}`);
  lines.push('');
  lines.push('ADIMLAR:');
  for (const s of plan.steps) {
    lines.push(`${s.done ? '✅' : '⬜'} ${s.order}. ${s.title}`);
  }

  const kisiler = sheets.find((x) => x.type === 'acil_kisiler');
  if (kisiler && kisiler.type === 'acil_kisiler' && kisiler.contacts.length) {
    lines.push('');
    lines.push('ACİL KİŞİLER:');
    for (const c of kisiler.contacts) {
      if (c.name || c.phone) lines.push(`• ${c.name}${c.phone ? ` — ${c.phone}` : ''}`);
    }
  }

  const pace = sheets.find((x) => x.type === 'iletisim');
  if (pace && pace.type === 'iletisim') {
    const parts = [
      pace.primary && `Ana: ${pace.primary}`,
      pace.alternate && `Yedek: ${pace.alternate}`,
      pace.contingency && `Yedek2: ${pace.contingency}`,
      pace.emergency && `Acil: ${pace.emergency}`,
    ].filter(Boolean);
    if (parts.length) {
      lines.push('');
      lines.push('İLETİŞİM (PACE):');
      lines.push(`• ${parts.join(' | ')}`);
    }
    if (pace.outOfAreaContact?.phone) {
      lines.push(`• Bölge dışı kontak: ${pace.outOfAreaContact.name} — ${pace.outOfAreaContact.phone}`);
    }
  }

  lines.push('');
  lines.push('— HazırPlan ile hazırlandı. Siz de ücretsiz plan yapın.');
  return lines.join('\n');
}
