<script lang="ts">
  // Envanter editörü — ev stokları + su litresi (72 saat hedefi)
  import { saveSheet } from '../../saveSheet';
  import type { EnvanterSheet } from '../../types';

  let { sheet }: { sheet: EnvanterSheet } = $props();
  let s = $state(sheet);
  let saveState = $state<'idle' | 'saved' | 'error'>('idle');
  let newItem = $state('');

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

  function setWater(e: Event) {
    s.waterLiters = Math.max(0, Number((e.currentTarget as HTMLInputElement).value) || 0);
    persist();
  }
  function setQty(e: Event, i: number) {
    s.items[i].qty = Math.max(1, Number((e.currentTarget as HTMLInputElement).value) || 1);
    persist();
  }
  function setExpiry(e: Event, i: number) {
    s.items[i].expiry = (e.currentTarget as HTMLInputElement).value;
    persist();
  }
  function setName(e: Event, i: number) {
    s.items[i].name = (e.currentTarget as HTMLInputElement).value;
    persist();
  }
  function addItem() {
    if (!newItem.trim()) return;
    s.items = [...s.items, { name: newItem.trim(), qty: 1, done: false }];
    newItem = '';
    persist();
  }
  function toggleDone(i: number) {
    s.items[i].done = !s.items[i].done;
    persist();
  }
  function removeItem(i: number) {
    s.items = s.items.filter((_, j) => j !== i);
    persist();
  }
</script>

<div class="envanter">
  <h3>📦 {s.title}</h3>
  <label class="water">
    Depolanan içme suyu (litre) — hedef: kişi başı 9L (3 gün × 2L içme + 1L hazırlık)
    <input type="number" min="0" value={s.waterLiters} onchange={setWater} />
  </label>

  <ul>
    {#each s.items as item, i (i)}
      <li class:done={item.done}>
        <input type="checkbox" checked={item.done} aria-label="hazır" onchange={() => toggleDone(i)} />
        <input type="text" value={item.name} onblur={(e) => setName(e, i)} />
        <input class="qty" type="number" min="1" value={item.qty} aria-label="adet" onchange={(e) => setQty(e, i)} />
        <input class="exp" type="date" value={item.expiry ?? ''} aria-label="son kullanma" onchange={(e) => setExpiry(e, i)} />
        <button class="ghost" onclick={() => removeItem(i)}>Sil</button>
      </li>
    {/each}
  </ul>
  <div class="row">
    <input type="text" placeholder="Yeni kalem (ör: konserve turşu)" bind:value={newItem} />
    <button class="add" onclick={addItem}>+ Ekle</button>
  </div>
  {#if saveState === 'saved'}<span class="saved">Saved</span>{:else if saveState === 'error'}<span class="error" role="alert">⚠ Kaydedilemedi</span>{/if}
</div>

<style>
  .envanter { display: flex; flex-direction: column; gap: 10px; }
  h3 { margin: 0; font-size: 1rem; }
  .water { display: flex; flex-direction: column; gap: 4px; font-size: .9rem; }
  .water input { width: 140px; }
  ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  li { display: flex; gap: 6px; align-items: center; }
  li.done input:first-child { text-decoration: line-through; color: #9ca3af; }
  input, .qty, .exp { font: inherit; padding: 6px 8px; border: 1px solid #e5e7eb; border-radius: 8px; }
  li input:first-child { flex: 1; }
  .qty { width: 70px; } .exp { width: 140px; }
  .row { display: flex; gap: 8px; }
  .row input { flex: 1; font: inherit; padding: 6px 8px; border: 1px solid #e5e7eb; border-radius: 8px; }
  .add, .ghost { font: inherit; border: 1px solid #e5e7eb; background: #fff; border-radius: 8px; padding: 6px 12px; cursor: pointer; }
  .add { background: #f59e0b; border-color: #f59e0b; font-weight: 600; color: #111; }
  .saved { color: #16a34a; font-size: .8rem; }
  .error { color: #dc2626; font-size: .8rem; }
</style>
