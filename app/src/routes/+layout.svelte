<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { dev } from '$app/env';
	import { asset, resolve } from '$app/paths';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// Service worker kaydı — üretimde sadece (dev'te HMR ile çakışır).
	// SvelteKit src/service-worker.ts dosyasını /service-worker.js olarak build eder.
	onMount(() => {
		if (!dev && 'serviceWorker' in navigator) {
			const root = resolve('/');
			navigator.serviceWorker.register(`${root.endsWith('/') ? root : root + '/'}service-worker.js`).catch((e) => {
				console.error('Service worker kaydedilemedi:', e);
			});
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="manifest" href={asset('manifest.webmanifest')} />
	<meta name="theme-color" content="#f59e0b" />
</svelte:head>

{@render children()}