import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			// GitHub Pages proje sitesi: /hazirplan altında servis (deploy build'i
			// PUBLIC_BASE_PATH ile kurar; lokal dev/test kökte kalır)
			paths: { base: (process.env.PUBLIC_BASE_PATH ?? '') as '' | `/${string}` },
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// HazırPlan: statik PWA (GitHub Pages hedefi). SPA fallback —
			// /plan/[id] gibi client-side rotalar sunucusuz çalışsın.
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: 'index.html',
				precompress: false,
				strict: true
			})
		})
	]
});
