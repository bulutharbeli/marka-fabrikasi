import { blobToDataUrl, classifyError, ProviderError, withTimeout, type GenOutput, type GenRequest } from './types';

/* Puter.js ~500 KB → ilk yüklemede ana paketi şişirmemek için tembel (dynamic import) yüklenir. */
type PuterApi = any;
let puterApi: PuterApi | null = null;
let loadingPromise: Promise<PuterApi | null> | null = null;

export function initPuter(): Promise<PuterApi | null> {
  if (loadingPromise) return loadingPromise;
  loadingPromise = import('@heyputer/puter.js')
    .then((mod: any) => {
      puterApi = mod?.puter ?? (window as any).puter ?? null;
      return puterApi;
    })
    .catch(() => null);
  return loadingPromise;
}

function api(): PuterApi | null {
  return puterApi ?? (window as any).puter ?? null;
}

/**
 * Puter.js — "User-Pays" modeli.
 * Geliştirici hiçbir şey ödemez, kullanıcı kendi ücretsiz Puter hesabıyla giriş yapar.
 * Anahtar gerektirmez ve geliştirici tarafında kota/rate-limit yoktur.
 */

export function puterLoaded(): boolean {
  return api() !== null;
}

export function isPuterSignedIn(): boolean {
  try {
    return Boolean(api()?.auth?.isSignedIn?.());
  } catch {
    return false;
  }
}

export async function signInPuter(): Promise<{ username?: string; email?: string } | null> {
  try {
    const p = api() ?? (await initPuter());
    if (!p) throw new ProviderError('Puter SDK yüklenemedi', 'init');
    await p.auth?.signIn?.();
    const user = await puterUser();
    return user ? { username: user.username, email: user.email } : null;
  } catch (e) {
    const c = classifyError(e);
    throw new ProviderError(c.message, c.code, c.quota);
  }
}

export async function puterUser(): Promise<{ username?: string; email?: string } | null> {
  try {
    const p = api();
    const u = await p?.auth?.getUser?.();
    return u ?? null;
  } catch {
    return null;
  }
}

export async function puterUsage(): Promise<any | null> {
  try {
    const p = api();
    return await p?.auth?.getMonthlyUsage?.();
  } catch {
    return null;
  }
}

export function signOutPuter() {
  try {
    api()?.auth?.signOut?.();
  } catch {
    /* ignore */
  }
}

/** Puter görsel çağrısı. Sonuç: data URL (tercih) veya uzak URL. */
export async function puterTxt2Img(opts: {
  prompt: string;
  model?: string;
  provider?: string;
  quality?: string;
  ratio?: { w: number; h: number };
  inputImages?: string[];
  routeId: string;
  providerId: string;
  providerLabel: string;
  badge: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}): Promise<GenOutput> {
  const payload: Record<string, unknown> = { model: opts.model };
  if (opts.provider) payload.provider = opts.provider;
  if (opts.quality) payload.quality = opts.quality;
  if (opts.ratio) payload.ratio = opts.ratio;
  if (opts.inputImages?.length) payload.input_images = opts.inputImages;

  if (!isPuterSignedIn()) {
    throw new ProviderError('Puter oturumu gerekli (ücretsiz giriş yapın)', 'auth');
  }

  let result: any;
  try {
    const controller = new AbortController();
    if (opts.signal) opts.signal.addEventListener('abort', () => controller.abort());
    const p = api() ?? (await initPuter());
    if (!p) throw new ProviderError('Puter SDK yüklenemedi', 'init');
    result = await withTimeout(
      Promise.resolve(p.ai?.txt2img?.(opts.prompt, { ...payload, signal: controller.signal })),
      opts.timeoutMs ?? 150_000,
      'Puter görsel üretimi zaman aşımına uğradı',
      () => controller.abort(),
    );
  } catch (e) {
    const c = classifyError(e);
    throw new ProviderError(c.message, c.code, c.quota);
  }

  if (!result) throw new ProviderError('Puter boş görsel döndürdü', 'empty');

  // Sonuç biçimi: HTMLImageElement | URL stringi | {src}
  const src: string | undefined =
    typeof result === 'string'
      ? result
      : typeof result?.src === 'string'
        ? result.src
        : result instanceof HTMLImageElement
          ? result.src
          : undefined;

  if (!src) {
    // Bazen doğrudan base64 data URI döner
    if (typeof result === 'object' && typeof result.data === 'string') {
      const dataUrl = result.data.startsWith('data:') ? result.data : `data:image/png;base64,${result.data}`;
      return {
        url: dataUrl,
        dataUrl,
        routeId: opts.routeId,
        providerId: opts.providerId,
        providerLabel: opts.providerLabel,
        model: opts.model ?? 'default',
        badge: opts.badge,
      };
    }
    throw new ProviderError('Puter çıktısı okunamadı', 'bad_output');
  }

  if (src.startsWith('data:')) {
    return {
      url: src,
      dataUrl: src,
      routeId: opts.routeId,
      providerId: opts.providerId,
      providerLabel: opts.providerLabel,
      model: opts.model ?? 'default',
      badge: opts.badge,
    };
  }

  // Uzak URL: bayt indirmeye çalış (CORS açıksa data URL'a çevir)
  try {
    const res = await fetch(src, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      if (blob.type.startsWith('image/')) {
        const dataUrl = await blobToDataUrl(blob);
        return {
          url: dataUrl,
          dataUrl,
          routeId: opts.routeId,
          providerId: opts.providerId,
          providerLabel: opts.providerLabel,
          model: opts.model ?? 'default',
          badge: opts.badge,
        };
      }
    }
  } catch {
    /* CORS kapalı olabilir — uzak URL ile devam et */
  }

  return {
    url: src,
    external: true,
    routeId: opts.routeId,
    providerId: opts.providerId,
    providerLabel: opts.providerLabel,
    model: opts.model ?? 'default',
    badge: opts.badge,
  };
}

/** Puter sohbet — metin üretimi (beyin fırtınası, prompt zenginleştirme). */
export async function puterChat(
  prompt: string,
  opts: { model?: string; signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<string> {
  if (!isPuterSignedIn()) {
    throw new ProviderError('Puter oturumu gerekli (ücretsiz giriş yapın)', 'auth');
  }

  const options: Record<string, unknown> = {};
  if (opts.model) options.model = opts.model;

  let result: any;
  try {
    const controller = new AbortController();
    if (opts.signal) opts.signal.addEventListener('abort', () => controller.abort());
    const p = api() ?? (await initPuter());
    if (!p) throw new ProviderError('Puter SDK yüklenemedi', 'init');
    result = await withTimeout(
      Promise.resolve(p.ai?.chat?.(prompt, { ...options, signal: controller.signal })),
      opts.timeoutMs ?? 35_000,
      'Puter metin üretimi zaman aşımına uğradı',
      () => controller.abort(),
    );
  } catch (e) {
    const c = classifyError(e);
    throw new ProviderError(c.message, c.code, c.quota);
  }
  return normalizeChat(result);
}

export function normalizeChat(result: any): string {
  if (typeof result === 'string') return result.trim();
  if (!result) return '';
  const candidates = [
    result?.message?.content,
    result?.content,
    result?.text,
    result?.choices?.[0]?.message?.content,
    result?.choices?.[0]?.text,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
    if (Array.isArray(c)) {
      const joined = c
        .map((part: any) => (typeof part === 'string' ? part : part?.text ?? ''))
        .join('')
        .trim();
      if (joined) return joined;
    }
  }
  return '';
}

/** Kullanılabilir görsel modelleri canlı olarak keşfet (varsa). */
export async function discoverImageModels(): Promise<{ id: string; provider: string }[]> {
  try {
    const res = await api()?.drivers?.call?.('puter-image-generation', 'models', {});
    const list = res?.result ?? res;
    if (Array.isArray(list)) {
      return list.map((m: any) => ({ id: String(m.id ?? m.model ?? ''), provider: String(m.provider ?? '') }));
    }
  } catch {
    /* ignore */
  }
  return [];
}
