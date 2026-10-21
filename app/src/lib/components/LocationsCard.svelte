<script lang="ts">
  // Buluşma Noktaları — isim bazlı konum kartı (harita sonraki sürümde; skor
  // kontrolleri ad+tipe bakar). Deploy-readiness: bulusma_noktalari artık
  // uygulama üzerinden üretilebilir.
  import { onMount } from 'svelte';
  import { db } from '../db/db';
  import type { FamilyLocation } from '../types';

  let locations = $state<FamilyLocation[]>([]);
  let newName = $state('');
  let newType = $state<'rally' | 'assembly' | 'home' | 'other'>('rally');
  let error = $state('');

  const TYPE_LABEL: Record<string, string> = {
    rally: 'Buluşma noktası', assembly: 'Toplanma alanı', home: 'Ev', other: 'Diğer',
  };

  async function load() { locations = await db.locations.toArray(); }

  async function add() {
    if (!newName.trim()) return;
    try {
      const loc: FamilyLocation = {
        id: crypto.randomUUID(), name: newName.trim(), type: newType,
        lat: 0, lng: 0, updatedAt: Date.now(),
      };
      await db.locations.put(loc);
      newName = '';
      error = '';
      await load();
    } catch (e) {
      console.error(e);
      error = 'Kaydedilemedi — tekrar deneyin.';
    }
  }

  async function remove(id: string) {
    try { await db.locations.delete(id); await load(); }
    catch (e) { console.error(e); error = 'Silinemedi.'; }
  }

  onMount(load);
</script>

<article class="card">
  <h2>📍 Buluşma Noktaları</h2>
  {#if locations.length === 0}
    <p class="empty">Henüz nokta yok. En az 2 buluşma noktası belirleyin: biri evin yürüme mesafesinde, diğeri uzakta.</p>
  {:else}
    <ul>
      {#each locations as l (l.id)}
        <li class="loc">
          <div>
            <strong>{l.name}</strong>
            <span class="meta">{TYPE_LABEL[l.type]}</span>
          </div>
          <button class="del" onclick={() => remove(l.id)} aria-label="Sil {l.name}">🗑️</button>
        </li>
      {/each}
    </ul>
    {#if locations.filter((l) => l.type === 'rally').length >= 2}
      <p class="ok">✅ 2+ buluşma noktası — Hazırlık Skoru tamam</p>
    {/if}
  {/if}
  <div class="row">
    <input type="text" placeholder="Nokta adı (ör: Okul bahçesi)" bind:value={newName}
      onkeydown={(e) => { if (e.key === 'Enter') add(); }} maxlength="60" />
    <select bind:value={newType} aria-label="Nokta türü">
      <option value="rally">Buluşma</option>
      <option value="assembly">Toplanma alanı</option>
      <option value="home">Ev</option>
      <option value="other">Diğer</option>
    </select>
    <button class="btn primary" onclick={add}>+ Ekle</button>
  </div>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
</article>

<style>
  .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; }
  h2 { margin: 0 0 12px; font-size: 1.05rem; }
  .empty { color: #6b7280; font-size: .92rem; }
  ul { list-style: none; padding: 0; margin: 0 0 12px; display: flex; flex-direction: column; gap: 8px; }
  .loc { display: flex; justify-content: space-between; align-items: center; padding: 9px 12px;
    background: #f9fafb; border-radius: 10px; }
  .meta { display: block; color: #6b7280; font-size: .8rem; }
  .ok { color: #16a34a; font-size: .85rem; margin: 0 0 8px; }
  .row { display: flex; gap: 8px; }
  input, select { font: inherit; padding: 9px 12px; border: 1px solid #e5e7eb; border-radius: 10px; min-width: 0; }
  input { flex: 1; }
  .btn.primary { background: #f59e0b; border: none; border-radius: 10px; padding: 9px 16px; font: inherit; font-weight: 600; cursor: pointer; }
  .del { background: none; border: none; cursor: pointer; font-size: 1rem; }
  .error { color: #dc2626; font-size: .85rem; }
</style>