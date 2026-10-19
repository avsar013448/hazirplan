<script lang="ts">
  // Kontrol Listesi editörü — genel checklist (ev güvenlik, araç, yangın hazırlık…)
  import { saveSheet } from '../../saveSheet';
  import type { KontrolListesiSheet } from '../../types';

  let { sheet }: { sheet: KontrolListesiSheet } = $props();
  let s = $state(sheet);
  let saveState = $state<'idle' | 'saved' | 'error'>('idle');
  let newText = $state('');

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

  function toggleDone(i: number) {
    s.items[i].done = !s.items[i].done;
    persist();
  }
  function setText(e: Event, i: number) {
    s.items[i].text = (e.currentTarget as HTMLInputElement).value;
    persist();
  }
  function addItem() {
    if (!newText.trim()) return;
    s.items = [...s.items, { text: newText.trim(), done: false }];
    newText = '';
    persist();
  }
  function removeItem(i: number) {
    s.items = s.items.filter((_, j) => j !== i);
    persist();
  }
</script>

<div class="kontrol">
  <h3>✅ {s.title}</h3>
  <p class="progress">{s.items.filter((i) => i.done).length}/{s.items.length} tamam</p>
  <ul>
    {#each s.items as item, i (i)}
      <li class:done={item.done}>
        <label>
          <input type="checkbox" checked={item.done} onchange={() => toggleDone(i)} />
          <input type="text" class="text" value={item.text} onblur={(e) => setText(e, i)} />
        </label>
        <button class="ghost" onclick={() => removeItem(i)}>Sil</button>
      </li>
    {/each}
  </ul>
  <div class="row">
    <input type="text" placeholder="Yeni madde" bind:value={newText} />
    <button class="add" onclick={addItem}>+ Ekle</button>
  </div>
  {#if saveState === 'saved'}<span class="saved">Saved</span>{:else if saveState === 'error'}<span class="error" role="alert">⚠ Kaydedilemedi</span>{/if}
</div>

<style>
  .kontrol { display: flex; flex-direction: column; gap: 8px; }
  h3 { margin: 0; font-size: 1rem; }
  .progress { color: #6b7280; font-size: .85rem; margin: 0; }
  ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  li { display: flex; align-items: center; gap: 6px; }
  li.done .text { text-decoration: line-through; color: #9ca3af; }
  label { display: flex; gap: 8px; align-items: center; flex: 1; }
  .text { font: inherit; padding: 6px 8px; border: 1px solid #e5e7eb; border-radius: 8px; flex: 1; }
  .row { display: flex; gap: 8px; }
  .row input { flex: 1; font: inherit; padding: 6px 8px; border: 1px solid #e5e7eb; border-radius: 8px; }
  .add, .ghost { font: inherit; border: 1px solid #e5e7eb; background: #fff; border-radius: 8px; padding: 6px 12px; cursor: pointer; }
  .add { background: #f59e0b; border-color: #f59e0b; font-weight: 600; color: #111; }
  .saved { color: #16a34a; font-size: .8rem; }
  .error { color: #dc2626; font-size: .8rem; }
</style>
