<script lang="ts">
  // SheetEditor — tipe göre doğru editörü render eder
  import type { Sheet } from '../../types';
  import Cantasi from './CantasiEditor.svelte';
  import Iletisim from './IletisimEditor.svelte';
  import Tahliye from './TahliyeEditor.svelte';
  import Envanter from './EnvanterEditor.svelte';
  import KontrolListesi from './KontrolListesiEditor.svelte';
  import AcilKisiler from './AcilKisilerEditor.svelte';

  let { sheet }: { sheet: Sheet } = $props();
</script>

{#if sheet.type === 'deprem_cantasi'}
  <Cantasi {sheet} />
{:else if sheet.type === 'iletisim'}
  <Iletisim {sheet} />
{:else if sheet.type === 'tahliye'}
  <Tahliye {sheet} />
{:else if sheet.type === 'envanter'}
  <Envanter {sheet} />
{:else if sheet.type === 'kontrol_listesi'}
  <KontrolListesi {sheet} />
{:else if sheet.type === 'acil_kisiler'}
  <AcilKisiler {sheet} />
{/if}
