<script lang="ts">
  // Aile Kodu paneli — kod üret, şifreli aile verisini paylaş, içe aktar (LWW).
  import { onMount } from 'svelte';
  import { db, getSettings, updateSettings } from '../db/db';
  import { generateAileKodu, encryptBundle, decryptBundle, isFamilyPayload } from '../ailekodu/crypto';
  import { exportFamilyBundle, importFamilyBundle, type MergeReport } from '../ailekodu/bundle';
  import type { Settings } from '../types';

  let settings = $state<Settings | null>(null);
  let busy = $state(false);
  let error = $state('');
  let lastPayload = $state('');
  let report = $state<MergeReport | null>(null);
  // içe aktarma
  let importCode = $state('');
  let importPayload = $state('');
  let fileInput = $state<HTMLInputElement | null>(null);

  async function ensureSettings() { settings = await getSettings(); }

  async function generateCode() {
    busy = true; error = '';
    try {
      await updateSettings({ aileKodu: generateAileKodu() });
      await ensureSettings();
    } catch (e) { console.error(e); error = 'Kod üretilemedi.'; }
    finally { busy = false; }
  }

  async function doExport() {
    if (!settings?.aileKodu) return;
    busy = true; error = ''; report = null;
    try {
      const bundle = await exportFamilyBundle();
      lastPayload = await encryptBundle(bundle, settings.aileKodu);
      // her başarılı dışa aktarım bir paylaşımdır → skor gerçek veriden okur
      await updateSettings({ exportedCopy: true, aileKoduSharedWith: (settings.aileKoduSharedWith ?? 0) + 1 });
      await ensureSettings();
    } catch (e) { console.error(e); error = 'Dışa aktarılamadı — tekrar deneyin.'; }
    finally { busy = false; }
  }

  async function copyPayload() {
    if (!lastPayload) return;
    try { await navigator.clipboard.writeText(lastPayload); }
    catch { error = 'Panoya kopyalanamadı — metni elle kopyalayın.'; }
  }

  function downloadPayload() {
    if (!lastPayload) return;
    const blob = new Blob([lastPayload], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `hazirplan-aile-${new Date().toISOString().slice(0, 10)}.hpk.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function doImport() {
    error = ''; report = null;
    if (!importCode.trim()) { error = 'Aile Kodunu girin.'; return; }
    if (!isFamilyPayload(importPayload)) { error = 'Veri biçimi tanınmadı — tam HPK1 metnini yapıştırın.'; return; }
    busy = true;
    try {
      const raw = await decryptBundle(importPayload, importCode);
      report = await importFamilyBundle(raw);
      importPayload = '';
      await ensureSettings();
    } catch (e) {
      console.error(e);
      error = e instanceof Error ? e.message : 'İçe aktarılamadı.';
    } finally { busy = false; }
  }

  async function pickFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    importPayload = (await file.text()).trim();
  }

  onMount(ensureSettings);
</script>

<div class="panel">
  <h2>👨‍👩‍👧 Aile Kodu</h2>
  <p class="lead">Planlar tek telefonda kalmasın. Aile verisini şifreli olarak paylaşın — kod olmadan kimse okuyamaz. Sunucu yok: veri cihazınızdan cihazına gider.</p>

  {#if settings}
    <section class="card">
      <h3>Aile Kodunuz</h3>
      {#if settings.aileKodu}
        <div class="code" role="textbox" aria-label="Aile Kodu">{settings.aileKodu}</div>
        <p class="hint">Bu kodu ailenizle paylaşın (WhatsApp yeterli). Kod hem şifre anahtarı hem aile kimliğidir.</p>
      {:else}
        <p class="hint">Henüz kod yok.</p>
        <button class="btn primary" disabled={busy} onclick={generateCode}>Kod Oluştur</button>
      {/if}
    </section>

    {#if settings.aileKodu}
      <section class="card">
        <h3>Aile Verisini Dışa Aktar (şifreli)</h3>
        <p class="hint">Tüm planlar, sayfalar ve ayarlar tek şifreli pakette. Aile üyesine gönderin; o "İçe Aktar" ile eklesin.</p>
        <div class="actions">
          <button class="btn primary" disabled={busy} onclick={doExport}>Şifreli Paket Hazırla</button>
        </div>
        {#if lastPayload}
          <div class="payloadbox">
            <textarea readonly rows="4" value={lastPayload} aria-label="Şifreli aile verisi"></textarea>
            <div class="actions">
              <button class="btn" onclick={copyPayload}>📋 Kopyala</button>
              <button class="btn" onclick={downloadPayload}>💾 Dosya indir (.hpk.txt)</button>
              <button class="btn" onclick={() => {
                if (navigator.share) navigator.share({ title: 'HazırPlan aile verisi', text: lastPayload }).catch(() => {});
                else copyPayload();
              }}>📤 Uygulamayla gönder</button>
            </div>
            <p class="hint">WhatsApp'ta bu metni göndermek uzun görünebilir — normaldir, şifreli pakettir.</p>
          </div>
        {/if}
      </section>
    {/if}

    <section class="card">
      <h3>Aile Verisini İçe Aktar</h3>
      <p class="hint">Aileden gelen şifreli paketi alınzda: kodu ve paketi girin. Değişiklikler birleştirilir — her iki tarafta yapılan güncellemeler kaybolmaz (yazma zamanı kazanır).</p>
      <label class="field">Aile Kodu
        <input type="text" placeholder="ör: AB12CD34" bind:value={importCode} maxlength="12" />
      </label>
      <label class="field">Şifreli paket (HPK1…)
        <textarea rows="4" bind:value={importPayload} placeholder="HPK1. ile başlayan metni buraya yapıştırın"></textarea>
      </label>
      <div class="actions">
        <button class="btn" onclick={() => fileInput?.click()}>📁 Dosyadan seç</button>
        <input hidden type="file" accept=".txt,.hpk.txt,text/plain" onchange={pickFile} bind:this={fileInput} />
        <button class="btn primary" disabled={busy || !importPayload} onclick={doImport}>İçe Aktar ve Birleştir</button>
      </div>
      {#if report}
        <div class="report">
          <h4>Birleştirme sonucu</h4>
          <ul>
            {#if report.plansAdded}<li>+{report.plansAdded} yeni plan</li>{/if}
            {#if report.plansUpdated}<li>{report.plansUpdated} plan güncellendi</li>{/if}
            {#if report.sheetsAdded}<li>+{report.sheetsAdded} yeni sayfa</li>{/if}
            {#if report.sheetsUpdated}<li>{report.sheetsUpdated} sayfa güncellendi</li>{/if}
            {#if report.locationsAdded || report.locationsUpdated}<li>{report.locationsAdded} yeni konum, {report.locationsUpdated} güncellendi</li>{/if}
            {#if report.drillsAdded}<li>+{report.drillsAdded} tatbikat kaydı</li>{/if}
            {#if report.sharesAdded}<li>+{report.sharesAdded} paylaşım kaydı</li>{/if}
            {#if report.settingsUpdated}<li>Ayarlar güncellendi</li>{/if}
          </ul>
          {#if !report.plansAdded && !report.plansUpdated && !report.sheetsAdded && !report.sheetsUpdated && !report.drillsAdded && !report.sharesAdded && !report.settingsUpdated && !report.locationsAdded}
            <p class="hint">Değişiklik yok — iki taraf zaten günceldi.</p>
          {/if}
        </div>
      {/if}
    </section>
  {/if}

  {#if error}<p class="error" role="alert">{error}</p>{/if}
</div>

<style>
  .panel { max-width: 640px; margin: 0 auto; padding: 16px; font-family: system-ui, sans-serif; }
  h2 { margin: 0 0 4px; }
  h3 { margin: 0 0 8px; font-size: 1rem; }
  h4 { margin: 0 0 6px; font-size: .9rem; }
  .lead { color: #374151; font-size: .95rem; }
  .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; margin: 12px 0; }
  .code { font-family: ui-monospace, monospace; font-size: 1.5rem; letter-spacing: .35em;
    background: #f9fafb; border: 1.5px dashed #f59e0b; border-radius: 12px; padding: 10px 16px; text-align: center; }
  .hint { color: #6b7280; font-size: .85rem; margin: 6px 0 0; }
  .field { display: flex; flex-direction: column; gap: 4px; font-size: .9rem; margin-bottom: 10px; }
  .field input, .field textarea, .payloadbox textarea { font: inherit; font-family: ui-monospace, monospace;
    padding: 9px 12px; border: 1px solid #e5e7eb; border-radius: 10px; width: 100%; box-sizing: border-box; }
  .actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
  .btn { font: inherit; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; padding: 9px 16px; cursor: pointer; }
  .btn.primary { background: #f59e0b; border-color: #f59e0b; font-weight: 600; color: #111; }
  .btn:disabled { opacity: .6; cursor: wait; }
  .payloadbox { margin-top: 10px; }
  .report { margin-top: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 10px 14px; }
  .report ul { list-style: none; padding: 0; margin: 0; font-size: .9rem; }
  .error { color: #dc2626; font-size: .9rem; }
</style>