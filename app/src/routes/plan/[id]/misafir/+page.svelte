<script lang="ts">
  // Misafir Görünümü — salt-okunur, yazdırılabilir plan sayfası.
  // Komşuya/arkadaşa telefonda göstermek veya buzdolabına asmak için.
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { db } from '#lib/db/db';
  import type { Plan, Sheet } from '#lib/types';

  let plan = $state<Plan | null>(null);
  let sheets = $state<Sheet[]>([]);
  const kisiler = $derived(sheets.find((x) => x.type === 'acil_kisiler'));
  const pace = $derived(sheets.find((x) => x.type === 'iletisim'));

  async function load() {
    const id = page.params.id ?? '';
    const p = await db.plans.get(id);
    plan = p ?? null;
    if (p) {
      const all = await db.sheets.bulkGet(p.sheetIds);
      sheets = all.filter(Boolean) as Sheet[];
    }
  }
  onMount(load);
</script>

<svelte:head><title>{plan?.title ?? 'Misafir Görünümü'} — HazırPlan</title></svelte:head>

{#if plan}
  <main class="guest">
    <header>
      <h1>{plan.title}</h1>
      <p class="sub">HazırPlan — salt okunur misafir kopyası</p>
    </header>

    <section class="steps">
      <h2>Adımlar</h2>
      <ol>
        {#each plan.steps as s (s.order)}
          <li class:done={s.done}>
            <strong>{s.order}. {s.title}</strong>
            {#if s.objective}<span class="obj">{s.objective}</span>{/if}
          </li>
        {/each}
      </ol>
    </section>

    {#if kisiler && kisiler.type === 'acil_kisiler' && kisiler.contacts.length}
      <section>
        <h2>Acil Kişiler</h2>
        <ul class="kisiler">
          {#each kisiler.contacts as c (c.name + c.phone)}
            {#if c.name || c.phone}<li><strong>{c.name}</strong>{c.phone ? ` — ${c.phone}` : ''}</li>{/if}
          {/each}
        </ul>
      </section>
    {/if}

    {#if pace && pace.type === 'iletisim'}
      <section>
        <h2>İletişim (PACE)</h2>
        <ul class="pace">
          {#if pace.primary}<li><strong>Ana:</strong> {pace.primary}</li>{/if}
          {#if pace.alternate}<li><strong>Yedek:</strong> {pace.alternate}</li>{/if}
          {#if pace.contingency}<li><strong>Yedek2:</strong> {pace.contingency}</li>{/if}
          {#if pace.emergency}<li><strong>Acil:</strong> {pace.emergency}</li>{/if}
          {#if pace.outOfAreaContact?.phone}<li><strong>Bölge dışı:</strong> {pace.outOfAreaContact.name} — {pace.outOfAreaContact.phone}</li>{/if}
        </ul>
      </section>
    {/if}

    <footer class="noprint">
      <button class="print" onclick={() => window.print()}>🖨️ Yazdır</button>
    </footer>
  </main>
{:else}
  <p class="missing">Plan bulunamadı.</p>
{/if}

<style>
  .guest { max-width: 640px; margin: 0 auto; padding: 24px 16px 48px; font-family: system-ui, sans-serif; }
  h1 { margin: 0; font-size: 1.5rem; }
  h2 { font-size: 1rem; margin: 18px 0 8px; }
  .sub { color: #6b7280; font-size: .85rem; margin: 4px 0 0; }
  .steps ol { padding-left: 20px; display: flex; flex-direction: column; gap: 8px; }
  .steps li { display: flex; flex-direction: column; }
  .steps li.done strong { text-decoration: line-through; }
  .obj { color: #6b7280; font-size: .85rem; }
  .kisiler, .pace { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 4px; font-size: .95rem; }
  .print { background: #f59e0b; border: none; border-radius: 10px; padding: 11px 22px; font: inherit; font-weight: 600; cursor: pointer; }
  .missing { text-align: center; padding: 40px; color: #6b7280; }

  /* Buzdolabı posteri: yazdırmada sadece plan kalır */
  @media print {
    .noprint { display: none !important; }
    .guest { padding: 0; max-width: 100%; }
    body { background: #fff; }
  }
</style>
