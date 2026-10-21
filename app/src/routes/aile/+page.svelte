<script lang="ts">
  // /aile — Aile Kodu sayfası
  import AileKoduPanel from '#lib/components/AileKoduPanel.svelte';
</script>

<svelte:head><title>Aile Kodu — HazırPlan</title></svelte:head>

<a href="/" class="back">← Panel</a>
<AileKoduPanel />

<style>
  .back { display: inline-block; margin: 12px 16px 0; color: #6b7280; text-decoration: none; font-family: system-ui, sans-serif; }
</style>