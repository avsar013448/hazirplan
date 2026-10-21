<script lang="ts">
  // HazırPlan — Karşılama / Dashboard (specs/mvp-spec.md §6.1)
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import pack from '../content/tr.json';
  import { db, getSettings } from '#lib/db/db';
  import type { ShareLogEntry } from '#lib/types';
  import { scorePlan, type ScoreResult } from '#lib/scoring/score';
  import { pickPrimaryPlan } from '#lib/scoring/primary';
  import type { Plan, Sheet, DrillEntry, FamilyLocation, Settings } from '#lib/types';
  import Wizard from '#lib/components/Wizard.svelte';
  import LocationsCard from '#lib/components/LocationsCard.svelte';

  let plans = $state<Plan[]>([]);
  let sheets = $state<Sheet[]>([]);
  let drills = $state<DrillEntry[]>([]);
  let locations = $state<FamilyLocation[]>([]);
  let shares = $state<ShareLogEntry[]>([]);
  let settings = $state<Settings | null>(null);
  let score = $state<ScoreResult | null>(null);
  let wizardOpen = $state(false);

  async function refresh() {
    plans = await db.plans.orderBy('updatedAt').reverse().toArray();
    sheets = await db.sheets.toArray();
    drills = await db.drills.toArray();
    locations = await db.locations.toArray();
    shares = await db.shareLog.toArray();
    settings = await getSettings();
    computeScore();
  }

  // Sihirbazın yapısal olarak enjekte ettiği adım başlıkları — bakım kontrolü
  // bunları arar (plan.sheetIds sırası yerine başlık eşleşmesi, code-review-1)
  const cs = pack.circumstanceSteps as Record<string, { title: string }>;
  const ozelIhtiyacTitles: string[] = [
    ...('dependentStep' in pack ? [(pack as { dependentStep: { title: string } }).dependentStep.title] : []),
    ...Object.values(cs).map((s) => s.title),
  ];

  function computeScore() {
    if (!settings) return;
    if (plans.length === 0) {
      // hane henüz plan yapmadı — skor kartı boş state gösterir
      score = null;
      return;
    }
    const primary = pickPrimaryPlan(plans); // en son OLUŞTURULAN plan (createdAt — karar code-review-2)
    if (!primary) { score = null; return; }
    const linkedSheets = sheets.filter((s) => primary.sheetIds.includes(s.id));
    score = scorePlan(primary, linkedSheets, drills, settings, locations, ozelIhtiyacTitles, shares);
  }

  function handleSaved() {
    refresh(); // data yenilenir ama modal AÇIK kalır — teyit ekranı görünür (review P1 fix)
  }
  function handleClose() {
    wizardOpen = false;
    refresh();
  }

  onMount(refresh);
</script>

<svelte:head>
  <title>HazırPlan — Ailenizin acil durum planı</title>
</svelte:head>

<main>
  <header class="top">
    <h1>Hazır<span class="accent">Plan</span></h1>
    <span class="tagline">Plan, afetten önce var olmalı.</span>
    <a class="aile" href={resolve('aile')} title="Aile Kodu">👨‍👩‍👧 Aile</a>
  </header>

  <section class="grid">
    <!-- Hazırlık Skoru kartı -->
    <article class="card score">
      <h2>Hazırlık Durumu</h2>
      {#if score}
        <div class="score-value">{score.pct}%</div>
        <div class="score-level">{score.level}</div>
        <ul class="cats">
          {#each score.categories.filter((c) => c.applicable) as c (c.id)}
            <li class:ok={c.passed === c.total}>
              {c.name} <span>{c.passed}/{c.total}</span>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="empty">Daha yeni başladınız. İlk planınızı oluşturun — 1 saatten kısa sürer.</p>
      {/if}
      <button class="btn primary" onclick={() => (wizardOpen = true)}>Yeni Plan</button>
    </article>

    <!-- Planlarım -->
    <article class="card plans">
      <h2>Planlarım</h2>
      {#if plans.length === 0}
        <p class="empty">Henüz plan yok. "Yeni Plan" ile sihirbazı başlatın.</p>
      {:else}
        <ul>
          {#each plans as p (p.id)}
            <li class="plan">
              <a href={resolve('plan/[id]').replace('[id]', p.id)} class="planlink">
                <strong>{p.title}</strong>
                <span class="meta">
                  {p.steps.length} adım · {p.steps.filter((s) => s.done).length}/{p.steps.length} tamam
                </span>
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </article>
  </section>

  <section class="grid">
    <div class="span2"><LocationsCard /></div>
  </section>

  {#if wizardOpen}
    <div class="modal-backdrop" role="presentation" onclick={(e) => { if (e.target === e.currentTarget) wizardOpen = false; }}>
      <div class="modal">
        <button class="close" aria-label="Kapat" onclick={() => (wizardOpen = false)}>×</button>
        <Wizard onsaved={handleSaved} onclose={handleClose} />
      </div>
    </div>
  {/if}
</main>

<style>
  main { max-width: 860px; margin: 0 auto; padding: 24px 16px 64px; font-family: system-ui, sans-serif; }
  .top { display: flex; align-items: baseline; gap: 12px; margin-bottom: 20px; }
  h1 { margin: 0; font-size: 1.6rem; }
  .accent { color: #f59e0b; }
  .tagline { color: #6b7280; font-size: .9rem; }
  .aile { margin-left: auto; text-decoration: none; font-size: .9rem; color: #b45309;
    background: #fffbeb; border: 1px solid #fcd34d; border-radius: 999px; padding: 5px 14px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .span2 { grid-column: 1 / -1; }
  @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
  .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; }
  .card h2 { margin: 0 0 12px; font-size: 1.05rem; }
  .score-value { font-size: 2.6rem; font-weight: 700; }
  .score-level { color: #f59e0b; font-weight: 600; margin-bottom: 10px; }
  .cats { list-style: none; padding: 0; margin: 0 0 16px; display: flex; flex-direction: column; gap: 4px; font-size: .88rem; }
  .cats li { display: flex; justify-content: space-between; color: #374151; }
  .cats li.ok { color: #16a34a; }
  .cats span { color: #9ca3af; }
  .empty { color: #6b7280; font-size: .92rem; }
  .plans ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
  .plan { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px;
    background: #f9fafb; border-radius: 10px; }
  .planlink { text-decoration: none; color: inherit; display: flex; flex-direction: column; gap: 2px; }
  .meta { display: block; color: #6b7280; font-size: .8rem; }
  .btn { padding: 10px 18px; border-radius: 10px; border: none; font: inherit; cursor: pointer; }
  .btn.primary { background: #f59e0b; color: #111; font-weight: 600; }
  .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: grid; place-items: center; z-index: 10; }
  .modal { background: #fff; border-radius: 16px; max-height: 90vh; overflow: auto; position: relative; }
  .close { position: absolute; top: 8px; right: 12px; background: none; border: none; font-size: 1.4rem; cursor: pointer; }
</style>
