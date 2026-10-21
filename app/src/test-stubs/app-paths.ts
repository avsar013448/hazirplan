// Vitest stub for the SvelteKit 3 `$app/paths` virtual module — component tests
// kÃ¶k base ile Ã§alÄ±ÅÄ±r (deploy build'i gerÃ§ek base'i kullanÄ±r).
export const base = '';

export const asset = (path: string): string => path;

export const resolve = (route: string, params?: Record<string, string>): string => {
  let r = '/' + route.replace(/^\/+/, '');
  if (params) {
    for (const [k, v] of Object.entries(params)) r = r.replace(`[${k}]`, v);
  }
  return r;
};
