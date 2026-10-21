// HazırPlan tamamen client-side: IndexedDB (Dexie) + offline PWA.
// SSR kapalı (Dexie window/IndexedDB ister), prerender kapalı (SPA fallback var).
export const ssr = false;
export const prerender = false;
export const trailingSlash = 'never';
