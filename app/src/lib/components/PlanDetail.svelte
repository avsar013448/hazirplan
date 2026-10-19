<script lang="ts" module>
  export function sheetIcon(type: string): string {
    switch (type) {
      case 'deprem_cantasi': return '🎒';
      case 'iletisim': return '📡';
      case 'tahliye': return '🗺️';
      case 'envanter': return '📦';
      case 'kontrol_listesi': return '✅';
      case 'acil_kisiler': return '👤';
      default: return '📄';
    }
  }
</script>

<script lang="ts">
  // PlanDetail — adımlar (Mark Complete) + bağlı sheet'ler (accordion)
  import { onMount } from 'svelte';
  import { db } from '../db/db';
  import type { Plan, Sheet } from '../types';
  import SheetEditor from './sheets/SheetEditor.svelte';

  let { planId }: { planId: string } = $props();

  let plan = $state<Plan | null>(null);
  let sheets = $state<Sheet[]>([]);
  let openSheetId = $state<string | null>(null);
  let savedTick = $state(0);

  async function load() {
    const p = await db.plans.get(planId);
    plan = p ?? null;
    if (p) {
      const all = await db.sheets.bulkGet(p.sheetIds);
      sheets = all.filter(Boolean) as Sheet[];
    }
  }

  async function toggleStep(order: number) {
    if (!plan) return;
    const snap = $state.snapshot(plan) as Plan;
    const s = snap.steps.find((x) => x.order === order);
    if (!s) return;
    s.done = !s.done;
    await db.plans.put(snap);
    await load();
    savedTick++;
  }

  onMount(load);
</script>

{#if plan}
  <article class="detail">
    <header>
      <h1>{plan.title}</h1>
      <span class="meta">
        {plan.steps.filter((s) => s.done).length}/{plan.steps.length} adım tamam
      </span>
    </header>

    <ol class="steps">
      {#each plan.steps as s (s.order)}
        <li class:done={s.done}>
          <button class="stephead" onclick={() => toggleStep(s.order)} aria-pressed={s.done}>
            <span class="checkbox" class:checked={s.done}>{s.done ? '✓' : ''}</span>
            <span class="t">
              <strong>{s.order}. {s.title}</strong>
              {#if s.objective}<span class="obj">{s.objective}</span>{/if}
            </span>
          </button>
          {#if s.checklistItems.length}
            <ul class="cl">
              {#each s.checklistItems as c (c.text)}
                <li>{c.done ? '☑' : '☐'} {c.text}</li>
              {/each}
            </ul>
          {/if}
          {#if s.sheetRefs.length}
            <div class="sheetlinks">
              {#each s.sheetRefs as ref (ref)}
                {@const sh = sheets.find((x) => x.id === ref)}
                {#if sh}
                  <button
                    class="sheetbtn"
                    class:open={openSheetId === ref}
                    onclick={() => (openSheetId = openSheetId === ref ? null : ref)}
                  >
                    {sheetIcon(sh.type)} {sh.title}
                  </button>
                {/if}
              {/each}
            </div>
          {/if}
        </li>
      {/each}
    </ol>

    {#if sheets.length}
      <section class="sheets">
        <h2>Sayfalar</h2>
        {#each sheets as sh (sh.id)}
          <div class="sheetblock">
            <button class="sheetbtn big" class:open={openSheetId === sh.id}
              onclick={() => (openSheetId = openSheetId === sh.id ? null : sh.id)}>
              {sheetIcon(sh.type)} {sh.title}
            </button>
            {#if openSheetId === sh.id}
              <div class="sheetcontent"><SheetEditor sheet={sh} /></div>
            {/if}
          </div>
        {/each}
      </section>
    {/if}
  </article>
{:else}
  <p>Plan bulunamadı.</p>
{/if}

<style>
  .detail { max-width: 720px; margin: 0 auto; padding: 16px; font-family: system-ui, sans-serif; }
  header { display: flex; justify-content: space-between; align-items: baseline; }
  h1 { font-size: 1.4rem; margin: 0 0 16px; }
  h2 { font-size: 1rem; margin: 24px 0 8px; }
  .meta { color: #6b7280; font-size: .9rem; }
  .steps { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px; }
  .steps li { background: #f9fafb; border-radius: 12px; padding: 10px 12px; }
  .steps li.done .t strong { text-decoration: line-through; color: #16a34a; }
  .stephead { display: flex; gap: 10px; align-items: flex-start; background: none; border: none; cursor: pointer; text-align: left; width: 100%; font: inherit; padding: 0; }
  .checkbox { min-width: 22px; height: 22px; border: 2px solid #d1d5db; border-radius: 50%; display: grid; place-items: center; font-size: .8rem; color: #16a34a; }
  .checkbox.checked { background: #16a34a; border-color: #16a34a; color: #fff; }
  .t { display: flex; flex-direction: column; gap: 2px; }
  .obj { color: #6b7280; font-size: .85rem; }
  .cl { margin: 8px 0 0 32px; padding: 0; list-style: none; font-size: .85rem; color: #374151; }
  .sheetlinks { margin: 8px 0 0 32px; display: flex; gap: 8px; flex-wrap: wrap; }
  .sheetbtn { font: inherit; font-size: .85rem; border: 1px solid #e5e7eb; background: #fff; border-radius: 999px; padding: 6px 14px; cursor: pointer; }
  .sheetbtn.open { background: #fffbeb; border-color: #f59e0b; }
  .sheetbtn.big { width: 100%; text-align: left; border-radius: 10px; margin-bottom: 6px; }
  .sheetblock { margin-bottom: 8px; }
  .sheetcontent { border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; margin-bottom: 8px; }
</style>
