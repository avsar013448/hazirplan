<script lang="ts">
  // İletişim Planı (PACE) editörü — P/A/C/E + bölge dışı kontak + satır içi eğitim
  import { saveSheet } from '../../saveSheet';
  import type { IletisimSheet } from '../../types';

  let { sheet }: { sheet: IletisimSheet } = $props();
  let s = $state(sheet);
  let savedAt = $state(0);

  async function persist() {
    await saveSheet(s);
    savedAt = Date.now();
  }

  function setPaceValue(key: 'primary' | 'alternate' | 'contingency' | 'emergency', e: Event) {
    s[key] = (e.currentTarget as HTMLInputElement).value;
    persist();
  }
  function setContactField(field: 'name' | 'phone', e: Event) {
    const cur = s.outOfAreaContact ?? { name: '', phone: '' };
    s.outOfAreaContact = { ...cur, [field]: (e.currentTarget as HTMLInputElement).value };
    persist();
  }

  const pace = [
    { key: 'primary' as const, label: 'P — Ana (Primary)', hint: 'Ana iletişim yönteminiz (ör. telefon)' },
    { key: 'alternate' as const, label: 'A — Yedek (Alternate)', hint: 'Ana yöntem çalışmazsa (ör. SMS — daha az şebeke ister)' },
    { key: 'contingency' as const, label: 'C — Yedek2 (Contingency)', hint: 'Ana ve yedek yoksa (ör. internet üzerinden mesajlaşma)' },
    { key: 'emergency' as const, label: 'E — Acil (Emergency)', hint: 'Son çare (ör. belirlenen buluşma noktasında buluşma)' },
  ];
</script>

<div class="pace">
  <h3>📡 {s.title}</h3>
  {#each pace as p (p.key)}
    <label>
      <span class="plabel">{p.label}</span>
      <input type="text" value={s[p.key]} placeholder={p.hint} onblur={(e) => setPaceValue(p.key, e)} />
    </label>
  {/each}

  <fieldset>
    <legend>Bölge dışı kontak</legend>
    <p class="hint">Sizden uzakta yaşayan, afetten etkilenmeyecek bir kişi. Aile durumu ona bildirir.</p>
    <div class="row">
      <input type="text" placeholder="İsim" value={s.outOfAreaContact?.name ?? ''} onblur={(e) => setContactField('name', e)} />
      <input type="tel" placeholder="Telefon" value={s.outOfAreaContact?.phone ?? ''} onblur={(e) => setContactField('phone', e)} />
    </div>
  </fieldset>
  {#if savedAt}<span class="saved">Saved</span>{/if}
</div>

<style>
  .pace { display: flex; flex-direction: column; gap: 10px; }
  h3 { margin: 0; font-size: 1rem; }
  label { display: flex; flex-direction: column; gap: 4px; }
  .plabel { font-size: .85rem; font-weight: 600; }
  input { font: inherit; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; }
  fieldset { border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px 14px; }
  legend { font-size: .85rem; font-weight: 600; padding: 0 6px; }
  .hint { color: #6b7280; font-size: .8rem; margin: 0 0 8px; }
  .row { display: flex; gap: 8px; }
  .saved { color: #16a34a; font-size: .8rem; }
</style>
