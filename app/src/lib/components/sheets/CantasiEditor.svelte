<script lang="ts">
  // Deprem Çantası editörü — checklist + adet + son kullanma (specs/mvp-spec.md §6.4)
  import { saveSheet } from '../../saveSheet';
  import type { CantasiSheet } from '../../types';

  let { sheet }: { sheet: CantasiSheet } = $props();
  let s = $state(sheet);
  let saveState = $state<'idle' | 'saved' | 'error'>('idle');

  // Hata durumunda 'Kaydedilemedi' görünür — sessiz veri kaybı yok (review P1 fix).
  async function persist() {
    try {
      await saveSheet(s);
      saveState = 'saved';
    } catch (e) {
      console.error('Sheet kaydedilemedi:', e);
      saveState = 'error';
    }
  }

  function toggleDone(idx: number) {
    s.items[idx].done = !s.items[idx].done;
    persist();
  }
  function setQty(e: Event, idx: number) {
    const v = Number((e.currentTarget as HTMLInputElement).value) || 1;
    s.items[idx].qty = Math.max(1, v);
    persist();
  }
  function setExpiry(e: Event, idx: number) {
    s.items[idx].expiry = (e.currentTarget as HTMLInputElement).value;
    persist();
  }
</script>

<div class="cantasi">
  <header>
    <h3>🎒 {s.title}</h3>
    <span class="owner">Sahibi: {s.owner}</span>
    {#if saveState === 'saved'}<span class="saved">Saved</span>{:else if saveState === 'error'}<span class="error" role="alert">⚠ Kaydedilemedi</span>{/if}
  </header>
  <p class="progress">{s.items.filter((i) => i.done).length}/{s.items.length} hazır</p>
  <ul>
    {#each s.items as item, idx (idx)}
      <li class:done={item.done}>
        <label>
          <input type="checkbox" checked={item.done} onchange={() => toggleDone(idx)} />
          <span class="name">{item.name}</span>
        </label>
        <span class="fields">
          <label class="mini">
            Adet
            <input type="number" min="1" value={item.qty} onchange={(e) => setQty(e, idx)} />
          </label>
          <label class="mini">
            Son kullanma
            <input type="date" value={item.expiry ?? ''} onchange={(e) => setExpiry(e, idx)} />
          </label>
        </span>
      </li>
    {/each}
  </ul>
</div>

<style>
  .cantasi h3 { margin: 0; font-size: 1rem; }
  header { display: flex; align-items: baseline; gap: 10px; }
  .owner, .progress { color: #6b7280; font-size: .85rem; }
  .saved { color: #16a34a; font-size: .8rem; }
  .error { color: #dc2626; font-size: .8rem; }
  ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  li { display: flex; justify-content: space-between; align-items: center; gap: 8px;
    padding: 8px 10px; background: #f9fafb; border-radius: 10px; }
  li.done .name { text-decoration: line-through; color: #9ca3af; }
  label { display: flex; align-items: center; gap: 8px; }
  .name { font-size: .9rem; }
  .fields { display: flex; gap: 10px; }
  .mini { display: flex; flex-direction: column; font-size: .7rem; color: #6b7280; gap: 2px; }
  .mini input { font: inherit; padding: 4px 6px; border: 1px solid #e5e7eb; border-radius: 6px; width: 90px; }
</style>
