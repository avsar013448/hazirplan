// Hane skorunu belirleyen 'birincil plan' seçimi — SAF, kararlaştırılmış:
// EN SON OLUŞTURULAN plan (createdAt). code-review-2 bulgusu: updatedAt bazlı
// seçim, adım işaretleme (Mark Complete) sırasında scoreboard'un planını
// tesadüfi biçimde değiştiriyordu. createdAt sabittir — düzenlemeler birincil
// planı değiştirmez, yalnızca yeni plan oluşturmak değiştirir.
import type { Plan } from '../types';

export function pickPrimaryPlan(plans: Plan[]): Plan | undefined {
  if (plans.length === 0) return undefined;
  return plans.reduce((a, b) => (b.createdAt > a.createdAt ? b : a));
}
