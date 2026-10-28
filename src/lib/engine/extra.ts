import { classifyError, ProviderError, withTimeout, type GenOutput, type GenRequest } from './types';

/**
 * Tarayıcıdan doğrudan çağrılabilen (CORS dostu) ücretsiz sağlayıcılar.
 *  - Hugging Face Inference: ücretsiz kullanıcı token'ı ile aylık küçük kredi
 *  - Pollinations Unified API: ücretsiz pollen kredisi ile (akış anahtarı)
 */

export interface ExtraMeta {
  routeId: string;
  providerId: string;
  providerLabel: string;
  badge: string;
}

/* --------------------------- Hugging Face Inference -------------------------- */

export const HF_MODELS = [
  { id: 'black-forest-labs/FLUX.1-schnell', badge: 'FLUX.1 Schnell', quality: '512' },
  { id: 'stabilityai/sd-turbo', badge: 'SD Turbo', quality: '512' },
  { id: 'stabilityai/stable-diffusion-xl-base-1.0', badge: 'SDXL', quality: '1024' },
];

export async function huggingfaceImage(
  req: GenRequest,
  token: string,
  model: string,
  meta: ExtraMeta,
): Promise<GenOutput> {
  if (!token) throw new ProviderError('Hugging Face token gerekli', 'auth');

  let res: Response;
  try {
    res = await withTimeout(
      fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: req.prompt }),
        signal: req.signal,
      }),
      120_000,
      'Hugging Face üretimi zaman aşımına uğradı',
    );
  } catch (e) {
    const c = classifyError(e);
    throw new ProviderError(c.message, c.code, c.quota);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const c = classifyError(body || `HTTP ${res.status}`);
    throw new ProviderError(
      res.status === 429 ? 'Hugging Face kotası doldu' : c.message,
      c.code,
      c.quota,
    );
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('json')) {
    const json: any = await res.json();
    const b64 = json?.image ?? json?.images?.[0]?.image;
    if (b64) {
      const dataUrl = `data:image/png;base64,${b64}`;
      return { url: dataUrl, dataUrl, ...meta, model };
    }
    throw new ProviderError(json?.error ?? 'Hugging Face görsel döndürmedi', 'no_image');
  }

  const blob = await res.blob();
  const dataUrl = await blobToDataUrlSafe(blob);
  return { url: dataUrl, dataUrl, ...meta, model };
}

/* -------------------------- Pollinations Unified API ------------------------- */

export const POLLINATIONS_MODELS = [
  { id: 'flux', badge: 'FLUX (ücretsiz)' },
  { id: 'z-image-turbo', badge: 'Z-Image Turbo' },
];

export async function pollinationsUnifiedImage(
  req: GenRequest,
  apiKey: string,
  model: string,
  meta: ExtraMeta,
): Promise<GenOutput> {
  if (!apiKey) throw new ProviderError('Pollinations API anahtarı gerekli', 'auth');

  let res: Response;
  try {
    res = await withTimeout(
      fetch('https://gen.pollinations.ai/v1/images/generations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: req.prompt,
          width: 1024,
          height: 1024,
          n: 1,
          response_format: 'b64_json',
        }),
        signal: req.signal,
      }),
      120_000,
      'Pollinations üretimi zaman aşımına uğradı',
    );
  } catch (e) {
    const c = classifyError(e);
    throw new ProviderError(c.message, c.code, c.quota);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const c = classifyError(body || `HTTP ${res.status}`);
    throw new ProviderError(c.message, c.code, c.quota);
  }

  const json: any = await res.json();
  const item = json?.data?.[0];
  const b64 = item?.b64_json;
  if (b64) {
    const dataUrl = `data:image/png;base64,${b64}`;
    return { url: dataUrl, dataUrl, ...meta, model };
  }
  const url = item?.url;
  if (url) {
    const fetched = await fetch(url, { mode: 'cors' }).catch(() => null);
    if (fetched?.ok) {
      const blob = await fetched.blob();
      const dataUrl = await blobToDataUrlSafe(blob);
      return { url: dataUrl, dataUrl, ...meta, model };
    }
    return { url, external: true, ...meta, model };
  }
  throw new ProviderError('Pollinations görsel döndürmedi', 'no_image');
}

/* --------------------------------- yardımcı --------------------------------- */

function blobToDataUrlSafe(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
