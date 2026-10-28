import { blobToDataUrl, classifyError, ProviderError, withTimeout, type GenOutput, type GenRequest } from './types';

/**
 * Pollinations — tamamen ücretsiz görsel/metin kaynağı.
 *
 * Tarayıcıdan doğrudan çağrıldığında Cloudflare Turnstile 403 döndürür.
 * Bu yüzden önce sunucu tarafı proxy denenir (/api/proxy); proxy yoksa
 * doğrudan çağrıya düşülür (bazı ağlarda çalışır).
 */

const IMAGE_ENDPOINT = 'https://image.pollinations.ai/prompt';
const TEXT_ENDPOINT = 'https://text.pollinations.ai';

const FREE_IMAGE_MODELS = ['flux', 'z-image-turbo'];

/** Proxy bu ortamda yoksa bir daha denenmesin (konsol hatası gürültüsü olmasın) */
let proxyMissing = false;

export function isProxyMissing(): boolean {
  return proxyMissing;
}

export function resetProxyMissing(): void {
  proxyMissing = false;
}

/**
 * Proxy üzerinden GÖRSEL isteği.
 * Proxy, sunucudaki anahtarlara göre en iyi ücretsiz backend'i seçer
 * (Pollinations unified → Hugging Face → Gemini → klasik Pollinations).
 * 404 → proxy yok (çağıran doğrudan denemeli).
 */
async function fetchImageViaProxy(
  proxyBase: string,
  params: {
    prompt: string;
    model?: string;
    width?: number;
    height?: number;
    seed?: number;
    editDataUrl?: string | null;
  },
  signal?: AbortSignal,
): Promise<Blob> {
  const base = proxyBase.replace(/\/+$/, '');
  const hasEdit = Boolean(params.editDataUrl);
  const url = `${base}/image?${new URLSearchParams({
    prompt: params.prompt,
    model: params.model || '',
    w: String(params.width ?? 1024),
    h: String(params.height ?? 1024),
    seed: String(params.seed ?? Math.floor(Math.random() * 1e9)),
  }).toString()}`;

  const res = await withTimeout(
    fetch(url, {
      method: hasEdit ? 'POST' : 'GET',
      headers: hasEdit ? { 'Content-Type': 'application/json' } : undefined,
      body: hasEdit
        ? JSON.stringify({ prompt: params.prompt, model: params.model, editDataUrl: params.editDataUrl })
        : undefined,
      signal,
    }),
    180_000,
    'Proxy görsel üretimi zaman aşımına uğradı',
  );

  if (res.status === 404) {
    proxyMissing = true;
    throw new ProviderError('Proxy bulunamadı (404)', 'no_proxy');
  }
  const gapHeader = res.headers.get('x-brandforge-min-gap');
  if (gapHeader) {
    const gap = Number(gapHeader);
    if (Number.isFinite(gap) && gap > 0) MIN_GAP_MS = Math.max(2_000, gap * 1000);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const c = classifyError(body || `HTTP ${res.status}`);
    if (res.status === 502 || res.status === 503 || res.status === 429) {
      const retryAfter = Number(res.headers.get('retry-after'));
      // Upstream limitte — Retry-After kadar bekleyip tekrar denenecek
      throw new ProviderError(
        'Ücretsiz arka uç şu an limitte',
        'busy',
        true,
        Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : undefined,
      );
    }
    throw new ProviderError(
      res.status === 429 || res.status === 402 ? 'Görsel kotası doldu' : c.message,
      c.code,
      c.quota,
    );
  }
  const type = res.headers.get('content-type') || '';
  if (!type.startsWith('image/')) {
    throw new ProviderError('Proxy görsel döndürmedi', 'bad_output');
  }
  return res.blob();
}

/**
 * Proxy üzerinden ham istek (eski API uyumluluğu).
 */
/**
 * Upstream classic API, sunucudan bile "1 istek / ~10 sn" burst limit'i uygular.
 * Bu yüzden istekler tek bir kuyruktan geçer (en az 12 sn aralıkla) ve
 * "limit'e takıldım" yanıtında otomatik yeniden denenir. Kullanıcı hiçbir
 * zaman limit hatası görmez; sadece üretim biraz daha sürer.
 */
let MIN_GAP_MS = 12_000;
let queue: Promise<unknown> = Promise.resolve();
let lastStart = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = Math.max(0, MIN_GAP_MS - (Date.now() - lastStart));
    if (wait > 0) await sleep(wait);
    lastStart = Date.now();
    return fn();
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** Pollinations "at its limit" yanıtı → yeniden denenecek mi? */
function isBusyResponse(status: number, bodyText: string): boolean {
  if (status === 503) return true;
  return /at its limit|rate.?limit|too many requests|slow down/i.test(bodyText);
}

export async function pollinationsImage(
  req: GenRequest,
  token: string,
  meta: { routeId: string; providerId: string; providerLabel: string; badge: string },
  proxyBase?: string,
): Promise<GenOutput> {
  const model = req.tier === 'pro' ? 'flux' : 'z-image-turbo';
  const seed = req.seed ?? Math.floor(Math.random() * 1_000_000);

  const params = new URLSearchParams({
    model,
    width: '1024',
    height: '1024',
    nologo: 'true',
    seed: String(seed),
  });
  if (token) params.set('token', token);

  const target = `${IMAGE_ENDPOINT}/${encodeURIComponent(req.prompt)}?${params.toString()}`;

  // Klasik Pollinations "jeton kovası" mantığıyla çalışır: pencere başına ~1 görsel.
  // Bu yüzden istekler TEK bir kuyruktan, aralıkla geçer ve "limitte" yanıtında
  // sunucunun verdiği Retry-After kadar beklenip yeniden denenir.
  // Kullanıcı hiçbir zaman limit hatası görmez; sadece üretim sürer.
  return enqueue(async () => {
    for (let attempt = 0; attempt < 4; attempt++) {
      // 1) Sunucu tarafı proxy (en iyi ücretsiz backend'i sunucu seçer)
      if (proxyBase && !proxyMissing) {
        try {
          const blob = await fetchImageViaProxy(
            proxyBase,
            {
              prompt: req.prompt,
              model: req.tier === 'pro' ? 'black-forest-labs/flux.1.1-pro' : 'tongyi-mai/z-image-turbo',
              width: 1024,
              height: 1024,
              seed,
              editDataUrl: req.reference ?? null,
            },
            req.signal,
          );
          const dataUrl = await blobToDataUrl(blob);
          return {
            url: dataUrl,
            dataUrl,
            routeId: meta.routeId,
            providerId: meta.providerId,
            providerLabel: meta.providerLabel,
            model,
            badge: meta.badge,
          };
        } catch (err) {
          if (err instanceof ProviderError && err.code === 'no_proxy') {
            // proxy yok -> doğrudan dene
          } else if (err instanceof ProviderError && err.code === 'busy' && attempt < 3) {
            const wait = err.retryAfterMs ?? MIN_GAP_MS + attempt * 5_000;
            await sleep(Math.max(MIN_GAP_MS, wait));
            continue;
          } else {
            throw err;
          }
        }
      }

      // 2) Doğrudan çağrı (tarayıcıda genelde Turnstile 403 döner)
      let res: Response;
      try {
        res = await withTimeout(
          fetch(target, { signal: req.signal }),
          120_000,
          'Pollinations üretimi zaman aşımına uğradı',
        );
      } catch (e) {
        const c = classifyError(e);
        throw new ProviderError(c.message, c.code, c.quota);
      }

      const contentType = res.headers.get('content-type') ?? '';

      // Pollinations kotalıyken 402/429 döndürüp gövdede görsel gönderiyor
      if (!res.ok && !contentType.startsWith('image/')) {
        if (res.status === 402 || res.status === 429) {
          const retryAfter = Number(res.headers.get('retry-after'));
          throw new ProviderError(
            'Pollinations ücretsiz kotası doldu',
            'busy',
            true,
            Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : undefined,
          );
        }
        const body = await res.text().catch(() => '');
        if (isBusyResponse(res.status, body) && attempt < 3) {
          await sleep(MIN_GAP_MS + attempt * 5_000);
          continue;
        }
        const c = classifyError(body || `HTTP ${res.status}`);
        throw new ProviderError(c.message, c.code, c.quota);
      }

      if (contentType.includes('application/json')) {
        const payload = await res.json().catch(() => null);
        throw new ProviderError(payload?.error?.message ?? 'Pollinations kotası doldu', 'quota', true);
      }

      const blob = await res.blob();
      const dataUrl = await blobToDataUrl(blob);
      return {
        url: dataUrl,
        dataUrl,
        routeId: meta.routeId,
        providerId: meta.providerId,
        providerLabel: meta.providerLabel,
        model,
        badge: meta.badge,
      };
    }
    throw new ProviderError('Pollinations limitte, lütfen tekrar deneyin', 'busy', true);
  });
}

/** Tarayıcıda klasik metin uç noktası genelde Turnstile ile engellenir; bir kez 403 alınca tekrar denenmez. */
let classicTextBlocked = false;

export function isClassicTextBlocked(): boolean {
  return classicTextBlocked;
}

export async function pollinationsText(
  prompt: string,
  signal?: AbortSignal,
  proxyBase?: string,
): Promise<string> {
  const target = `${TEXT_ENDPOINT}/${encodeURIComponent(prompt)}?model=openai`;

  if (proxyBase && !proxyMissing) {
    try {
      const base = proxyBase.replace(/\/+$/, '');
      const res = await withTimeout(
        fetch(`${base}/text?${new URLSearchParams({ prompt }).toString()}`, { signal }),
        60_000,
        'Proxy metin üretimi zaman aşımına uğradı',
      );
      if (res.status === 404) {
        proxyMissing = true;
        throw new ProviderError('Proxy bulunamadı (404)', 'no_proxy');
      }
      if (res.ok) {
        const text = (await res.text()).trim();
        if (text) return text;
      }
    } catch (err) {
      if (err instanceof ProviderError && err.code === 'no_proxy') {
        // proxy yok -> doğrudan dene
      } else {
        throw err;
      }
    }
  }

  if (classicTextBlocked) {
    throw new ProviderError('Pollinations klasik metin uç noktası bu tarayıcıda engellendi', 'blocked');
  }
  const res = await withTimeout(fetch(target, { signal }), 25_000, 'Pollinations metin zaman aşımına uğradı');
  if (res.status === 403) {
    classicTextBlocked = true;
    throw new ProviderError('Pollinations klasik metin uç noktası tarayıcıdan engellendi', 'blocked');
  }
  if (!res.ok) throw new ProviderError(`Pollinations metin ${res.status}`, 'http');
  const text = (await res.text()).trim();
  if (!text) throw new ProviderError('Pollinations boş metin döndürdü', 'empty');
  return text;
}

/** Pollinations unified API ile sohbet (akış anahtarı gerekir). */
export async function pollinationsChat(
  prompt: string,
  apiKey: string,
  model = 'openai-fast',
  signal?: AbortSignal,
): Promise<string> {
  if (!apiKey) throw new ProviderError('Pollinations API anahtarı gerekli', 'auth');
  const res = await withTimeout(
    fetch('https://gen.pollinations.ai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }),
      signal,
    }),
    45_000,
    'Pollinations sohbet zaman aşımına uğradı',
  );
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const c = classifyError(body || `HTTP ${res.status}`);
    throw new ProviderError(c.message, c.code, c.quota);
  }
  const json: any = await res.json();
  const text = json?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    throw new ProviderError('Pollinations boş metin döndürdü', 'empty');
  }
  return text.trim();
}

export { FREE_IMAGE_MODELS };
