import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    // Svelte 5 client build (mount) for jsdom tests
    conditions: ['browser'],
    // $app/paths SvelteKit sanal modülü — vitest'te stub gerekir
    alias: {
      '$app/paths': new URL('./src/test-stubs/app-paths.ts', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test-setup.ts'],
  },
});
