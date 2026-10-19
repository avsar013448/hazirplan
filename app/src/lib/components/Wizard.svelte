<script lang="ts">
  // Plan Sihirbazı — 5 adımlı rehberli kurulum (specs/mvp-spec.md §3)
  import pack from '../../content/tr.json';
  import { assemblePlan } from '../assembly/assemble';
  import { db } from '../db/db';
  import type { Plan } from '../types';

  let { onsaved = () => {}, onclose = () => {} }: { onsaved?: () => void; onclose?: () => void } = $props();

  const W = pack.wizardCopy;
  const hazards = pack.hazards;
  const membersList = pack.household.members;
  const circumstancesList = pack.household.circumstances;
  const FREE_PLAN_LIMIT = 3; // specs/mvp-spec.md §8

  let step = $state(1);
  let hazard = $state('earthquake');
  let otherTitle = $state('');
  let extra = $state('');
  let size = $state(2);
  let home = $state<'apartment' | 'house'>('apartment');
  let members = $state<string[]>([]);
  let circumstances = $state<string[]>([]);
  let generating = $state(false);
  let revealCount = $state(0);
  let result = $state<{ plan: Plan; sheets: import('../types').Sheet[] } | null>(null);
  let saving = $state(false);
  let savedPlan = $state<Plan | null>(null);
  let saveError = $state('');
  let limitReached = $state(false);

  const stepTitle = () => (W as Record<string, string>)['step' + step + 'Title'];
  const hazardLabel = $derived(hazards.find((h) => h.id === hazard)?.label ?? '');

  const toggle = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

  function next() { step = Math.min(5, step + 1); }
  function back() { step = Math.max(1, step - 1); }

  async function generate() {
    if (generating) return; // çift-tık koruması (code-review-1 P2 fix)
    generating = true;
    saveError = '';
    const built = assemblePlan(
      {
        hazard: hazard as Plan['hazard'],
        extraText: extra || undefined,
        otherTitle: hazard === 'other' ? otherTitle : undefined,
        householdSize: size,
        home,
        members: membersList.filter((m) => members.includes(m.id)).map((m) => ({ id: m.id, label: m.label })),
        circumstances: circumstancesList.filter((c) => circumstances.includes(c.id)).map((c) => ({ id: c.id })),
      },
      pack as never,
      { now: Date.now(), idFactory: () => crypto.randomUUID() },
    );
    result = built;
    // "Adım ekleniyor..." — deterministic assembly, streaming presentation
    revealCount = 0;
    for (let i = 1; i <= built.plan.steps.length; i++) {
      await new Promise((r) => setTimeout(r, 220));
      revealCount = i;
    }
    generating = false;
    // Ücretsiz plan limiti: 3 plan (specs §8) — kaydetmeden önce kontrol (review P1 fix)
    const planCount = await db.plans.count();
    limitReached = planCount >= FREE_PLAN_LIMIT;
  }

  async function save() {
    if (!result || saving) return; // re-entrancy koruması (code-review-1 P2 fix)
    saving = true;
    saveError = '';
    try {
      const planCount = await db.plans.count();
      if (planCount >= FREE_PLAN_LIMIT) {
        limitReached = true;
        return;
      }
      // $state proxy'leri IndexedDB'ye yazılamaz — snapshot ile düz nesneye çevir
      const plan = $state.snapshot(result.plan);
      const sheets = $state.snapshot(result.sheets);
      await db.transaction('rw', db.plans, db.sheets, async () => {
        await db.plans.put(plan);
        await db.sheets.bulkPut(sheets);
      });
      savedPlan = plan;
      // NOT: modal burada KAPANMAZ — görünür teyit ekranı gösterilir;
      // "Tamam" onclose() çağırır (code-review-1 P1 fix: teyit gerçek uygulamada
      // hiç görünmüyordu çünkü dashboard onsaved ile modalı hemen kapatıyordu).
      onsaved();
    } catch (e) {
      saveError = 'Kayıt başarısız oldu. Tekrar deneyin. (' + (e as Error).message + ')';
    } finally {
      saving = false;
    }
  }
</script>

<div class="wizard" role="dialog" aria-label="Plan Sihirbazı">
  {#if savedPlan}
    <!-- Görünür kayıt teyidi — ReadyPlan'ın kaçırdığı kritik an.
         Modal KAPANMAZ; "Tamam" kapatır (code-review-1 P1 fix). -->
    <div class="saved">
      <div class="saved-icon">✅</div>
      <h2>Plan kaydedildi: {savedPlan.title}</h2>
      <p>{savedPlan.steps.length} adım ve {savedPlan.sheetIds.length} sayfa, Planlarım listesinde.</p>
      <button class="btn primary" onclick={() => onclose()}>Tamam</button>
    </div>
  {:else if result && limitReached}
    <div class="saved">
      <div class="saved-icon">⚠️</div>
      <h2>Plan limiti doldu</h2>
      <p>Ücretsiz planda en fazla {FREE_PLAN_LIMIT} plan bulunur. Var olan bir planı silin veya planlarınızdan birini güncelleyin.</p>
      <button class="btn ghost" onclick={() => (result = null)}>Geri Dön</button>
      <button class="btn primary" onclick={() => onclose()}>Kapat</button>
    </div>
  {:else if result}
    <header>
      <h2>Planınız hazır!</h2>
      <span class="badge">{result.plan.title}</span>
    </header>
    <ol class="steps">
      {#each result.plan.steps.slice(0, revealCount) as s (s.order)}
        <li class:late={s.order > revealCount - 1}>
          <strong>{s.order}. {s.title}</strong>
          {#if s.objective}<span class="obj">{s.objective}</span>{/if}
        </li>
      {/each}
    </ol>
    {#if revealCount >= result.plan.steps.length}
      <div class="actions">
        <button class="btn ghost" onclick={() => (result = null)}>Geri Dön</button>
        <button class="btn primary" onclick={save} disabled={saving}>
          {saving ? 'Kaydediliyor…' : 'Planı Kaydet'}
        </button>
      </div>
      {#if saveError}<p class="error" role="alert">{saveError}</p>{/if}
    {/if}
  {:else}
    <header>
      <h2>{stepTitle()}</h2>
      <span class="progress">Adım {step}/5</span>
    </header>

    {#if step === 1}
      <div class="options">
        {#each hazards as h (h.id)}
          <button
            class="option"
            class:active={hazard === h.id}
            onclick={() => (hazard = h.id)}
            aria-pressed={hazard === h.id}
          >
            <span class="emoji">{h.emoji}</span>
            <span class="label">{h.label}{h.default ? ' ★' : ''}</span>
            <span class="desc">{h.description}</span>
          </button>
        {/each}
      </div>
      {#if hazard === 'other'}
        <label class="othertitle">
          Planınızın adı ne olsun?
          <input type="text" bind:value={otherTitle} maxlength="50" placeholder="ör: Mahalle yangın planı" />
        </label>
      {/if}
    {:else if step === 2}
      <div class="row">
        <label>
          Kişi sayısı
          <select bind:value={size}>
            {#each [1, 2, 3, 4, 5, 6] as n (n)}<option value={n}>{n} kişi</option>{/each}
          </select>
        </label>
        <label>
          Konut
          <select bind:value={home}>
            <option value="apartment">Apartman</option>
            <option value="house">Müstakil</option>
          </select>
        </label>
      </div>
    {:else if step === 3}
      <p class="hint">{W.allOptional}</p>
      <div class="options small">
        {#each membersList as m (m.id)}
          <button class="option" class:active={members.includes(m.id)} onclick={() => (members = toggle(members, m.id))}>
            {m.label}
          </button>
        {/each}
      </div>
    {:else if step === 4}
      <p class="hint">{W.allOptional}</p>
      <div class="options small">
        {#each circumstancesList as c (c.id)}
          <button class="option" class:active={circumstances.includes(c.id)} onclick={() => (circumstances = toggle(circumstances, c.id))}>
            <span class="label">{c.label}</span>
            <span class="desc">{c.description}</span>
          </button>
        {/each}
      </div>
    {:else if step === 5}
      <label class="freetext">
        {W.step5Title}
        <textarea bind:value={extra} maxlength="500" rows="4" placeholder="Örn: bodrumda kiraç depomuz var, kapı anahtarı komşuda…"></textarea>
      </label>
      <div class="summary">
        <h3>{W.summaryTitle}</h3>
        <p>Tehlike: <strong>{hazardLabel}</strong></p>
        <p>Hane: <strong>{size} kişi · {home === 'apartment' ? 'Apartman' : 'Müstakil'}</strong></p>
      </div>
    {/if}

    <div class="actions">
      {#if step > 1}<button class="btn ghost" onclick={back}>Geri</button>{/if}
      {#if step < 5}
        <button class="btn primary" onclick={next}>Devam</button>
      {:else}
        <button class="btn primary" onclick={generate} disabled={generating}>
          {generating ? 'Planınız oluşturuluyor…' : W.generate}
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .wizard { max-width: 560px; margin: 0 auto; padding: 24px; }
  header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; }
  h2 { margin: 0; font-size: 1.25rem; }
  .progress { color: #6b7280; font-size: .85rem; }
  .badge { display: inline-block; background: #eef2ff; padding: 2px 10px; border-radius: 999px; }
  .options { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
  .options.small { grid-template-columns: 1fr 1fr; }
  .option { display: flex; flex-direction: column; gap: 4px; text-align: left; padding: 12px;
    border: 1.5px solid #e5e7eb; border-radius: 12px; background: #fff; cursor: pointer; font: inherit; }
  .option.active { border-color: #f59e0b; background: #fffbeb; }
  .emoji { font-size: 1.4rem; }
  .desc { color: #6b7280; font-size: .8rem; }
  .row { display: flex; gap: 16px; }
  label { display: flex; flex-direction: column; gap: 6px; font-size: .9rem; }
  select, textarea { padding: 8px; border: 1px solid #e5e7eb; border-radius: 8px; font: inherit; }
  .hint { color: #6b7280; font-size: .85rem; }
  .summary { background: #f9fafb; border-radius: 12px; padding: 12px 16px; margin-top: 12px; }
  .summary h3 { margin: 0 0 6px; font-size: .95rem; }
  .summary p { margin: 2px 0; font-size: .9rem; }
  .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
  .btn { padding: 10px 20px; border-radius: 10px; border: none; font: inherit; cursor: pointer; }
  .btn.primary { background: #f59e0b; color: #111; font-weight: 600; }
  .btn.primary:disabled { opacity: .6; cursor: wait; }
  .btn.ghost { background: transparent; border: 1px solid #e5e7eb; }
  .othertitle { display: flex; flex-direction: column; gap: 4px; margin-top: 10px; font-size: .9rem; }
  .othertitle input { font: inherit; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; }
  .steps { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px; }
  .steps li { background: #f9fafb; border-radius: 10px; padding: 10px 14px; display: flex; flex-direction: column; }
  .steps li.late { animation: pop .25s ease-out; }
  @keyframes pop { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; } }
  .obj { color: #6b7280; font-size: .85rem; }
  .saved { text-align: center; padding: 32px 0; }
  .saved-icon { font-size: 2.5rem; }
  .error { color: #dc2626; font-size: .85rem; text-align: right; }
</style>
