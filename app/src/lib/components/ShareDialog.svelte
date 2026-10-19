<script lang="ts">
  // Paylaş diyaloğu — komşu/arkadaş/misafir/grup ile plan paylaşımı.
  // Her EYLEM shareLog'a yazılır; Hazırlık Skoru'nun 'aile dışı haberdar'
  // kontrolü bu gerçek veriden okur (settings checkbox'ı değil).
  import type { Plan, Sheet, ShareKind, ShareLogEntry } from '../types';
  import { db, logShare, updateSettings } from '../db/db';
  import { buildShareText, shareKindLabel } from '../shareText';

  let { plan, sheets, onclose }: { plan: Plan; sheets: Sheet[]; onclose?: () => void } = $props();

  const kinds: { id: ShareKind; label: string; emoji: string }[] = [
    { id: 'komsu', label: 'Komşu', emoji: '🏘️' },
    { id: 'arkadas', label: 'Arkadaş', emoji: '🤝' },
    { id: 'misafir', label: 'Misafir', emoji: '🚪' },
    { id: 'grup', label: 'Grup', emoji: '👥' },
  ];

  let kind = $state<ShareKind>('komsu');
  let name = $state('');
  let lastShares = $state<ShareLogEntry[]>([]);
  let error = $state('');

  const text = $derived(buildShareText(plan, sheets));

  function recipientLabel(): string {
    return shareKindLabel(kind) + (name.trim() ? ` (${name.trim()})` : '');
  }

  async function record(method: ShareLogEntry['method']) {
    try {
      const entry: ShareLogEntry = {
        id: crypto.randomUUID(),
        planId: plan.id,
        kind,
        name: name.trim() || undefined,
        method,
        date: new Date().toISOString(),
      };
      await logShare(entry);
      lastShares = [...lastShares, entry];
      error = '';
    } catch (e) {
      console.error('Paylaşım kaydedilemedi:', e);
      error = 'Paylaşım kaydedilemedi — tekrar deneyin.';
    }
  }

  async function doPrint() {
    window.open(`/plan/${plan.id}/misafir`, '_blank');
    // Yazdırılan kopya = gerçek veri: settings.printedCopy artık otomatik doğru
    await updateSettings({ printedCopy: true });
    await record('print');
  }

  async function doWebShare() {
    let method: ShareLogEntry['method'] = 'webshare';
    try {
      if (navigator.share) {
        await navigator.share({ title: plan.title, text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        method = 'clipboard';
      } else {
        method = 'clipboard';
      }
      await record(method);
    } catch (e) {
      // kullanıcı vazgeçti (AbortError) — kayıt yazma
      if ((e as Error).name !== 'AbortError') {
        console.error('Paylaşım hatası:', e);
        error = 'Paylaşılamadı — başka yöntem deneyin.';
      }
    }
  }

  async function doWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    await record('whatsapp');
  }

  function doGuestView() {
    window.open(`/plan/${plan.id}/misafir`, '_blank');
    record('guest');
  }
</script>

<div class="share" role="dialog" aria-label="Planı paylaş">
  <header>
    <h2>Paylaş: {plan.title}</h2>
  </header>

  <p class="q">Kimle paylaşıyorsunuz?</p>
  <div class="kinds">
    {#each kinds as k (k.id)}
      <button class="kind" class:active={kind === k.id} onclick={() => (kind = k.id)} aria-pressed={kind === k.id}>
        <span class="emoji">{k.emoji}</span>
        <span>{k.label}</span>
      </button>
    {/each}
  </div>
  <input class="name" type="text" placeholder="İsim (isteğe bağlı — ör: Ayşe Teyze)" bind:value={name} maxlength="40" />

  <div class="actions">
    <button class="act" onclick={doPrint}>🖨️ Yazdır<span>Misafir kopyası — buzdolabına asılacak</span></button>
    <button class="act" onclick={doWhatsApp}>💬 WhatsApp<span>Plan özetini mesaj olarak gönder</span></button>
    <button class="act" onclick={doWebShare}>📤 Uygulamayla gönder<span>Paylaş menüsü / panoya kopyala</span></button>
    <button class="act" onclick={doGuestView}>🚪 Misafir görünümü<span>Telefonu göster — okunabilir tek sayfa</span></button>
  </div>

  {#if lastShares.length}
    <ul class="log">
      {#each lastShares as s (s.id)}
        <li>✅ {shareKindLabel(s.kind)}{s.name ? ` (${s.name})` : ''} ile paylaşıldı</li>
      {/each}
    </ul>
  {/if}
  {#if error}<p class="error" role="alert">{error}</p>{/if}

  <div class="footer">
    <span class="hint">Her paylaşım kaydedilir ve Hazırlık Skoru'na sayılır.</span>
    {#if onclose}<button class="done" onclick={onclose}>Tamam</button>{/if}
  </div>
</div>

<style>
  .share { max-width: 480px; padding: 20px; font-family: system-ui, sans-serif; }
  h2 { margin: 0 0 8px; font-size: 1.15rem; }
  .q { margin: 0 0 8px; font-size: .9rem; color: #374151; }
  .kinds { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .kind { display: flex; flex-direction: column; gap: 4px; align-items: center; padding: 10px 4px;
    border: 1.5px solid #e5e7eb; border-radius: 12px; background: #fff; cursor: pointer; font: inherit; font-size: .8rem; }
  .kind.active { border-color: #f59e0b; background: #fffbeb; }
  .emoji { font-size: 1.3rem; }
  .name { width: 100%; margin-top: 10px; font: inherit; padding: 9px 12px; border: 1px solid #e5e7eb; border-radius: 10px; box-sizing: border-box; }
  .actions { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
  .act { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border: 1px solid #e5e7eb;
    border-radius: 12px; background: #fff; cursor: pointer; font: inherit; text-align: left; }
  .act span { color: #6b7280; font-size: .78rem; display: block; }
  .log { list-style: none; padding: 0; margin: 12px 0 0; color: #16a34a; font-size: .85rem; }
  .error { color: #dc2626; font-size: .85rem; }
  .footer { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; }
  .hint { color: #9ca3af; font-size: .75rem; }
  .done { background: #f59e0b; border: none; border-radius: 10px; padding: 9px 18px; font: inherit; font-weight: 600; cursor: pointer; }
</style>
