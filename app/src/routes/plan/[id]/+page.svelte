<script lang="ts">
  // /plan/[id] — route entry, takes the id from the URL
  import { page } from '$app/state';
  import PlanDetail from '#lib/components/PlanDetail.svelte';
</script>

<a href="/" class="back">← Planlar</a>
<PlanDetail planId={page.params.id ?? ''} />

<style>
  .back { display: inline-block; margin: 12px 16px 0; color: #6b7280; text-decoration: none; font-family: system-ui, sans-serif; }
</style>
