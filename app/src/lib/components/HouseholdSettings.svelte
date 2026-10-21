<script lang="ts">
  // Aile Ayarları — güvenli oda + araç (skor: guvenli_oda, arac_plani artık
  // uygulama üzerinden üretilebilir). Deploy-readiness slim UI.
  import { onMount } from 'svelte';
  import { db, getSettings, updateSettings } from '../db/db';
  import type { Settings } from '../types';

  let settings = $state<Settings | null>(null);
  let safeRoom = $state('');
  let hasVehicle = $state<boolean | null>(null);
  let error = $state('');

  async function load() {
    settings = await getSettings();
    safeRoom = settings.safeRoom;
    hasVehicle = settings.hasVehicle;
  }

  async function persist() {
    try {
      await updateSettings({ safeRoom: safeRoom.trim(), hasVehicle });
      settings = await getSettings();
      error = '';
    } catch (e) {
      console.error(e);
      error = 'Kaydedilemedi — tekrar deneyin.';
    }
  }

  onMount(load);
</script>

<section class="card">
  <h3>🏠 Aile Ayarları</h3>
  <p class="hint">Hazırlık Skoru bu bilgilere bakar — güvenli odanızı ve araç durumunuzu girin.</p>

  <label class="field">
    Güvenli oda (sarsıntı anında toplanılacak)
    <input type="text" placeholder="ör: Banyo / çamaşır odası" bind:value={safeRoom}
      onblur={persist} maxlength="60" />
  </label>

  <div class="field">
    <span>Araç durumu</span>
    <div class="chips">
      <button class:active={hasVehicle === true} onclick={async () => { hasVehicle = true; await persist(); }}>Aracımız var</button>
      <button class:active={hasVehicle === false} onclick={async () => { hasVehicle = false; await persist(); }}>Aracımız yok</button>
    </div>
  </div>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
</section>

<style>
  .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; margin: 12px 0; }
  h3 { margin: 0 0 8px; font-size: 1rem; }
  .hint { color: #6b7280; font-size: .85rem; margin: 0 0 12px; }
  .field { display: flex; flex-direction: column; gap: 4px; font-size: .9rem; margin-bottom: 12px; }
  .field input { font: inherit; padding: 9px 12px; border: 1px solid #e5e7eb; border-radius: 10px; }
  .chips { display: flex; gap: 8px; }
  .chips button { font: inherit; border: 1.5px solid #e5e7eb; background: #fff; border-radius: 999px;
    padding: 8px 16px; cursor: pointer; }
  .chips button.active { border-color: #f59e0b; background: #fffbeb; font-weight: 600; }
  .error { color: #dc2626; font-size: .85rem; }
</style>