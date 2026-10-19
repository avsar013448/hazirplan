<script lang="ts">
  // Tahliye Rotası editörü — hedefler, rota adımları, alternatif, toplu taşıma
  import { saveSheet } from '../../saveSheet';
  import type { TahliyeSheet } from '../../types';

  let { sheet }: { sheet: TahliyeSheet } = $props();
  let s = $state(sheet);
  let savedAt = $state(0);
  let newDest = $state('');

  async function persist() {
    await saveSheet(s);
    savedAt = Date.now();
  }

  function addDest() {
    if (!newDest.trim()) return;
    s.destinations = [...s.destinations, { name: newDest.trim(), direction: 'other' }];
    newDest = '';
    persist();
  }

  function setDestName(e: Event, i: number) {
    s.destinations[i].name = (e.currentTarget as HTMLInputElement).value;
    persist();
  }
  function setDestDir(e: Event, i: number) {
    s.destinations[i].direction = (e.currentTarget as HTMLSelectElement).value as 'north';
    persist();
  }
  function setFrom(e: Event, i: number) {
    s.routeSteps[i].from = (e.currentTarget as HTMLInputElement).value;
    persist();
  }
  function setTo(e: Event, i: number) {
    s.routeSteps[i].to = (e.currentTarget as HTMLInputElement).value;
    persist();
  }
  function setAlternate(e: Event) {
    s.hasAlternateRoute = (e.currentTarget as HTMLInputElement).checked;
    persist();
  }
  function setTransit(e: Event) {
    s.transitPlan = (e.currentTarget as HTMLTextAreaElement).value;
    persist();
  }
</script>

<div class="tahliye">
  <h3>🗺️ {s.title}</h3>

  <section>
    <h4>Tahliye hedefleri ({s.destinations.length})</h4>
    <p class="hint">İki hedef farklı yönlerde olsun — tek yönde iki adres, tek kapanan yola denk gelir.</p>
    {#each s.destinations as d, i (i)}
      <div class="row">
        <input type="text" value={d.name} onblur={(e) => setDestName(e, i)} />
        <select value={d.direction} onchange={(e) => setDestDir(e, i)}>
          <option value="north">Kuzey</option>
          <option value="south">Güney</option>
          <option value="east">Doğu</option>
          <option value="west">Batı</option>
          <option value="other">Diğer</option>
        </select>
        <button class="ghost" onclick={async () => { s.destinations = s.destinations.filter((_, j) => j !== i); await persist(); }}>Sil</button>
      </div>
    {/each}
    <div class="row">
      <input type="text" placeholder="Hedef adı (ör: teyzemin evi, Kadıköy)" bind:value={newDest} />
      <button class="add" onclick={addDest}>+ Ekle</button>
    </div>
  </section>

  <section>
    <h4>Rota adımları ({s.routeSteps.length})</h4>
    {#each s.routeSteps as r, i (i)}
      <div class="row">
        <input type="text" value={r.from} aria-label="Nereden" onblur={(e) => setFrom(e, i)} />
        <span class="arrow">→</span>
        <input type="text" value={r.to} aria-label="Nereye" onblur={(e) => setTo(e, i)} />
        <button class="ghost" onclick={async () => { s.routeSteps = s.routeSteps.filter((_, j) => j !== i); await persist(); }}>Sil</button>
      </div>
    {/each}
    <button class="add" onclick={async () => { s.routeSteps = [...s.routeSteps, { from: '', to: '' }]; await persist(); }}>+ Rota adımı</button>
  </section>

  <label class="checkline">
    <input type="checkbox" checked={s.hasAlternateRoute} onchange={setAlternate} />
    Alternatif rota belirledik
  </label>

  {#if s.transitPlan !== undefined}
    <label class="col">
      Toplu taşıma / yürüyüş planı (araçsız hane)
      <textarea rows="2" placeholder="Otomatik: güzergâh + yürüyüş alternatifi yazın"
        value={s.transitPlan} onblur={setTransit}></textarea>
    </label>
  {/if}
  {#if savedAt}<span class="saved">Saved</span>{/if}
</div>

<style>
  .tahliye { display: flex; flex-direction: column; gap: 14px; }
  h3, h4 { margin: 0; font-size: 1rem; }
  h4 { font-size: .9rem; color: #374151; }
  .hint { color: #6b7280; font-size: .8rem; margin: 2px 0 8px; }
  .row { display: flex; gap: 8px; margin-bottom: 6px; align-items: center; }
  input, select, textarea { font: inherit; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; flex: 1; }
  .arrow { color: #9ca3af; }
  .add, .ghost { font: inherit; border: 1px solid #e5e7eb; background: #fff; border-radius: 8px; padding: 6px 12px; cursor: pointer; }
  .add { background: #f59e0b; border-color: #f59e0b; font-weight: 600; color: #111; }
  .checkline { display: flex; align-items: center; gap: 8px; font-size: .9rem; }
  .col { display: flex; flex-direction: column; gap: 4px; font-size: .9rem; }
  .saved { color: #16a34a; font-size: .8rem; }
</style>
