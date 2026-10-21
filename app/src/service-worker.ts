// HazırPlan service worker — TAM ÇEVRİMDIŞI: build çıktısının tamamı precache.
// SvelteKit 3: $service-worker kaldırıldı → $app/manifest (immutable, assets)
// + $app/env (version). Bu dosya tsconfig'ten hariçtir (webworker lib çakışması).
/// <reference lib="webworker" />

import { immutable, assets } from '$app/manifest';
// SW bağlamında $app/paths güvenli değil — scope'tan türet ('/hazirplan/' ya da '/')
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, '') || '/';
import { version } from '$app/env';

const CACHE = `hazirplan-${version}`;
const ASSETS: string[] = [
  ...(immutable as { path: string }[]).map((a) => a.path),
  ...(assets as { path: string }[]).map((a) => a.path),
  BASE, // SPA kökü (base'iyle) — vite preview '/index.html'e 404 verir
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first (tamamı yerel statik); ağ hiç gerekmez — offline-first taahhüdü.
// Sadece AYNI ORIGIN cache'lenir (code-review-2: cross-origin GET'ler
// versiyonlu cache'i başkası adına şişiriyordu).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      // navigasyonlar için fallback (SPA route'ları offline'da da açılır)
      if (event.request.mode === 'navigate') {
        return caches.match(BASE).then((fb) => fb ?? fetch(event.request));
      }
      return fetch(event.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return res;
      });
    })
  );
});
