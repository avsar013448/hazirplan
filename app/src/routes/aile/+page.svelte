<script lang="ts">
  // /aile — Aile Kodu sayfası
  import { resolve } from '$app/paths';
  import AileKoduPanel from '#lib/components/AileKoduPanel.svelte';
  import HouseholdSettings from '#lib/components/HouseholdSettings.svelte';
</script>

<svelte:head><title>Aile Kodu — HazırPlan</title></svelte:head>

<a href={resolve('/')} class="back">← Panel</a>
<AileKoduPanel />
<HouseholdSettings />

<style>
  .back { display: inline-block; margin: 12px 16px 0; color: #6b7280; text-decoration: none; font-family: system-ui, sans-serif; }
</style>