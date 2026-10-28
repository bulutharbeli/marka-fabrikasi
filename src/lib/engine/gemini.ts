import { classifyError, ProviderError, withTimeout, type GenOutput, type GenRequest } from './types';

/**
 * Kendi Gemini anahtarınızı kullanırsanız doğrudan Google API'ye gideriz.
 * Nano Banana modelleri (gemini-3-pro-image, gemini-nano-banana-2.1, gemini-3.1-flash-image)
 * Google'da ücretli olduğu için bu yol kendi kredinizden harcar.
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

export const GEMINI_IMAGE_MODELS = {
  pro: 'gemini-3-pro-image',
  nano21: 'gemini-nano-banana-2.1',
  flash: 'gemini-3.1-flash-image',
  lite: 'gemini-3.1-flash-lite-image',
} as const;

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/.exec(dataUrl);
  if (!m) return null;
  return { mimeType: m[1], data: m[2] };
}

export async function geminiImage(
  req: GenRequest,
  apiKey: string,
  meta: { routeId: string; providerId: string; providerLabel: string; badge: string },
): Promise<GenOutput> {
  const model =
    req.tier === 'pro' ? GEMINI_IMAGE_MODELS.pro : req.tier === 'standard' ? GEMINI_IMAGE_MODELS.flash : GEMINI_IMAGE_MODELS.nano21;

  const parts: any[] = [];
  if (req.reference) {
    const parsed = parseDataUrl(req.reference);
    if (parsed) {
      parts.push({ inline_data: { mime_type: parsed.mimeType, data: parsed.data } });
    }
  }
  parts.push({ text: req.prompt });

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  };

  let res: Response;
  try {
    res = await withTimeout(
      fetch(`${ENDPOINT}/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
        signal: req.signal,
      }),
      180_000,
      'Gemini görsel üretimi zaman aşımına uğradı',
    );
  } catch (e) {
    const c = classifyError(e);
    throw new ProviderError(c.message, c.code, c.quota);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const c = classifyError(text || `HTTP ${res.status}`);
    throw new ProviderError(
      res.status === 429 || res.status === 403 || res.status === 400
        ? `Gemini ${res.status}: ${c.message}`
        : c.message,
      c.code,
      c.quota,
    );
  }

  const json: any = await res.json();
  const candidates = json?.candidates ?? [];
  for (const cand of candidates) {
    for (const part of cand?.content?.parts ?? []) {
      const inline = part?.inlineData ?? part?.inline_data;
      if (inline?.data) {
        const mime = inline.mimeType ?? inline.mime_type ?? 'image/png';
        const dataUrl = `data:${mime};base64,${inline.data}`;
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
    }
  }

  throw new ProviderError('Gemini görsel döndürmedi', 'no_image');
}

/** Kendi anahtarınızla metin üretimi (beyin fırtınası). */
export async function geminiText(
  prompt: string,
  apiKey: string,
  model = 'gemini-3.1-flash-lite',
  signal?: AbortSignal,
): Promise<string> {
  const res = await withTimeout(
    fetch(`${ENDPOINT}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
      signal,
    }),
    45_000,
    'Gemini metin üretimi zaman aşımına uğradı',
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const c = classifyError(text);
    throw new ProviderError(c.message, c.code, c.quota);
  }
  const json: any = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p: any) => (typeof p.text === 'string' ? p.text : ''))
    .join('')
    .trim();
}
