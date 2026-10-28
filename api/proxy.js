/**
 * BrandForge Free — ücretsiz görsel/metin proxy çekirdeği
 *
 * TASARIM: Anahtarlar sunucu tarafında tutulur (environment variables).
 * Tarayıcı hiçbir anahtar görmez; sadece /api/proxy/image?... isteği atar.
 *
 * Backend seçim sırası (ilk bulunan kullanılır):
 *   1. POLLINATIONS_API_KEY  → gen.pollinations.ai unified API (72 görsel modeli)
 *   2. HF_TOKEN              → Hugging Face Inference (FLUX.1 Schnell, SD Turbo)
 *   3. GEMINI_API_KEY        → Google Gemini (Nano Banana) — kaliteli ama ücretli
 *   4. (anahtar yoksa)       → image.pollinations.ai klasik uç nokta (ücretsiz, burst limit'li)
 *
 * Güvenlik: yalnızca izinli host'lara proxy'lenir, Authorization başlığı
 * asla tarayıcıya sızmaz.
 */

const ALLOWED_HOSTS = [
  'image.pollinations.ai',
  'text.pollinations.ai',
  'gen.pollinations.ai',
  'router.huggingface.co',
  'generativelanguage.googleapis.com',
];

const MAX_BYTES = 25 * 1024 * 1024;
/**
 * Pollinations "Free limit reached" banner varyantlarinin SHA-256 onemi
 * (olculen: 402 banner 25348 bayt, 503 banner 23679 bayt).
 */
const KNOWN_PLACEHOLDER_HASHES = new Set([
  '805903e5e03175a67e7ff4d7',
  '52211919c36926d15bca7928',
]);

async function isKnownPlaceholder(buf) {
  try {
    // WebCrypto: Node 20 / Vercel / Netlify / Cloudflare Workers hepsinde var
    const digest = await crypto.subtle.digest('SHA-256', buf);
    const hash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return KNOWN_PLACEHOLDER_HASHES.has(hash.slice(0, 24));
  } catch {
    return false;
  }
}


function isAllowedTarget(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    return ALLOWED_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

/** HTTP header değerleri ASCII olmak zorunda — temizleyici. */
function safeHeader(value) {
  return String(value).replace(/[^\x20-\x7E]/g, '').trim();
}

const json = (status, obj) => ({
  status,
  headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
  body: JSON.stringify(obj),
});

/* ------------------------------ ortam değişkenleri ----------------------------- */

function envValue(env, ...names) {
  if (!env) return '';
  for (const n of names) {
    if (typeof process !== 'undefined' && process.env && process.env[n]) return process.env[n];
    if (env[n] !== undefined && env[n] !== null && env[n] !== '') return env[n];
  }
  return '';
}

/* --------------------------------- yardımcılar -------------------------------- */

function decodeDataUrl(dataUrl) {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/.exec(dataUrl || '');
  if (!m) return null;
  return { mimeType: m[1], data: m[2] };
}

/* ------------------------------- backend'ler ---------------------------------- */

/** 1) Pollinations unified API (sk_ anahtarı ile) */
async function viaPollinationsUnified(prompt, model, width, height, seed, key) {
  const res = await fetch('https://gen.pollinations.ai/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || 'tongyi-mai/z-image-turbo',
      prompt,
      width: width || 1024,
      height: height || 1024,
      n: 1,
      seed: seed ?? Math.floor(Math.random() * 1e9),
      response_format: 'b64_json',
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { error: `Pollinations unified ${res.status}: ${text.slice(0, 200)}`, fatal: res.status === 401 };
  }
  const data = await res.json();
  const item = data?.data?.[0];
  if (item?.b64_json) {
    return {
      body: Buffer.from(item.b64_json, 'base64'),
      contentType: 'image/png',
      backend: `Pollinations - ${model || 'z-image-turbo'}`,
      minGap: 2,
    };
  }
  if (item?.url) {
    const img = await fetch(item.url).catch(() => null);
    if (img?.ok) {
      return {
        body: Buffer.from(await img.arrayBuffer()),
        contentType: img.headers.get('content-type') || 'image/png',
        backend: `Pollinations - ${model || 'z-image-turbo'}`,
        minGap: 2,
      };
    }
  }
  return { error: 'Pollinations görsel döndürmedi' };
}

/** 2) Hugging Face Inference (hf_ token ile) */
async function viaHuggingFace(prompt, model, width, height, token) {
  const res = await fetch(
    `https://router.huggingface.co/hf-inference/models/${model || 'black-forest-labs/FLUX.1-schnell'}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: prompt }),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { error: `Hugging Face ${res.status}: ${text.slice(0, 200)}`, fatal: res.status === 401 };
  }
  const type = res.headers.get('content-type') || '';
  if (type.includes('json')) {
    const data = await res.json();
    const b64 = data?.image ?? data?.images?.[0]?.image;
    if (b64) {
      return {
        body: Buffer.from(b64, 'base64'),
        contentType: 'image/png',
        backend: `Hugging Face - ${model || 'FLUX.1-schnell'}`,
        minGap: 3,
      };
    }
    return { error: data?.error || 'HF görsel döndürmedi' };
  }
  return {
    body: Buffer.from(await res.arrayBuffer()),
    contentType: type,
    backend: `Hugging Face - ${model || 'FLUX.1-schnell'}`,
    minGap: 3,
  };
}

/** 3) Google Gemini / Nano Banana (ücretli ama kaliteli) */
async function viaGemini(prompt, model, key, editDataUrl) {
  const parts = [];
  if (editDataUrl) {
    const parsed = decodeDataUrl(editDataUrl);
    if (parsed) parts.push({ inline_data: { mime_type: parsed.mimeType, data: parsed.data } });
  }
  parts.push({ text: prompt });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-3.1-flash-image'}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ role: 'user', parts }] }),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { error: `Gemini ${res.status}: ${text.slice(0, 200)}`, fatal: res.status === 401 || res.status === 403 };
  }
  const data = await res.json();
  for (const cand of data?.candidates ?? []) {
    for (const part of cand?.content?.parts ?? []) {
      const inline = part?.inlineData ?? part?.inline_data;
      if (inline?.data) {
        return {
          body: Buffer.from(inline.data, 'base64'),
          contentType: inline.mimeType ?? inline.mime_type ?? 'image/png',
          backend: `Gemini - ${model || 'gemini-3.1-flash-image'}`,
          minGap: 2,
        };
      }
    }
  }
  return { error: 'Gemini görsel döndürmedi' };
}

/** 4) Klasik Pollinations (anahtarsız, ücretsiz ama burst limit'li) */
async function viaClassicPollinations(prompt, model, width, height, seed, negativePrompt) {
  const params = new URLSearchParams({
    model: model || 'flux',
    width: String(width || 1024),
    height: String(height || 1024),
    nologo: 'true',
    seed: String(seed ?? Math.floor(Math.random() * 1e9)),
  });
  // Klasik uç nokta unified model id'lerini tanımaz -> klasik eşleştirme
  const classicModel = /flux/i.test(model || '') ? 'flux' : 'z-image-turbo';
  params.set('model', classicModel);
  if (negativePrompt) params.set('negative_prompt', String(negativePrompt).slice(0, 600));

  const target = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;

  const res = await fetch(target, {
    headers: { accept: 'image/*,*/*', 'user-agent': 'BrandForgeFree/1.0 (proxy)' },
  });

  const type = res.headers.get('content-type') || '';
  const retryAfter = res.headers.get('retry-after');
  const retrySec = retryAfter ? Number(retryAfter) : undefined;

  // Pollinations kotası dolduğunda "Free limit reached" YER TUTUCU BANNER'ı döner.
  // Ölçülen gerçek göstergeler:
  //   - HTTP 402 / 429 / 503 + `retry-after` başlığı
  //   - HTTP 200 + görsel + `x-pollinations-logo` başlığı YOK
  //     (gerçek üretimde bu başlık VAR; yer tutucuda YOK)
  if (res.status === 402 || res.status === 429 || res.status === 503) {
    return {
      error: `Klasik Pollinations kotası doldu (${res.status})`,
      quota: true,
      retryAfter: Number.isFinite(retrySec) && retrySec > 0 ? retrySec : 45,
      minGap: 2,
    };
  }

  if (type.startsWith('image/')) {
    const body = Buffer.from(await res.arrayBuffer());
    const isReal =
      Boolean(res.headers.get('x-pollinations-logo')) && !(await isKnownPlaceholder(body));
    if (!isReal) {
      return {
        error: 'Klasik Pollinations yer tutucu görsel döndürdü (kota)',
        quota: true,
        retryAfter: Number.isFinite(retrySec) && retrySec > 0 ? retrySec : 45,
        minGap: 2,
      };
    }
    return {
      body,
      contentType: type,
      backend: 'Pollinations classic (free)',
      minGap: 2,
    };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return {
      error: `Klasik Pollinations ${res.status}: ${text.slice(0, 180)}`,
      quota: false,
    };
  }
  return { error: 'Klasik Pollinations görsel döndürmedi' };
}

/* ------------------------------- görsel üretimi ------------------------------- */

async function handleImage(params, env) {
  const {
    prompt = '',
    model = '',
    width = 1024,
    height = 1024,
    seed,
    editDataUrl = null,
  } = params;

  if (!prompt) return json(400, { error: 'prompt is required' });

  const pollKey = envValue(env, 'POLLINATIONS_API_KEY');
  const hfToken = envValue(env, 'HF_TOKEN', 'HUGGINGFACE_TOKEN', 'HUGGINGFACE_API_TOKEN');
  const geminiKey = envValue(env, 'GEMINI_API_KEY', 'GOOGLE_API_KEY');

  const attempts = [];

  if (pollKey) {
    attempts.push(() => viaPollinationsUnified(prompt, model, width, height, seed, pollKey));
  }
  if (hfToken) {
    attempts.push(() => viaHuggingFace(prompt, model, width, height, hfToken));
  }
  if (geminiKey) {
    attempts.push(() => viaGemini(prompt, model, geminiKey, editDataUrl));
  }
  attempts.push(() => viaClassicPollinations(prompt, model, width, height, seed, params.negative_prompt));

  const errors = [];
  let quotaHit = false;
  let retryAfter = 45;
  let minGap = 2;

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      if (result.error) {
        errors.push(result.error);
        if (result.quota) {
          quotaHit = true;
          retryAfter = result.retryAfter ?? retryAfter;
          minGap = result.minGap ?? minGap;
        }
        continue;
      }
      return {
        status: 200,
        headers: {
          'content-type': result.contentType || 'image/png',
          'cache-control': 'public, max-age=600',
          'access-control-allow-origin': '*',
          'x-brandforge-backend': safeHeader(result.backend || 'unknown'),
          'x-brandforge-min-gap': String(result.minGap ?? 2),
        },
        body: result.body,
      };
    } catch (err) {
      errors.push(String(err?.message || err));
    }
  }

  if (quotaHit) {
    return {
      status: 429,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'retry-after': String(retryAfter),
        'x-brandforge-min-gap': String(minGap),
      },
      body: JSON.stringify({
        error: 'ücretsiz arka uç limitte',
        retryAfter,
        details: errors.slice(0, 2),
      }),
    };
  }

  return json(502, { error: 'tüm arka uçlar başarısız', details: errors.slice(0, 3) });
}

/* -------------------------------- metin üretimi ------------------------------- */

async function handleText(params, env) {
  const { prompt = '' } = params;
  if (!prompt) return json(400, { error: 'prompt is required' });

  const pollKey = envValue(env, 'POLLINATIONS_API_KEY');
  const geminiKey = envValue(env, 'GEMINI_API_KEY', 'GOOGLE_API_KEY');
  const errors = [];

  if (pollKey) {
    try {
      const res = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${pollKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai-fast',
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          return {
            status: 200,
            headers: {
              'content-type': 'text/plain; charset=utf-8',
              'access-control-allow-origin': '*',
              'x-brandforge-backend': 'Pollinations unified',
            },
            body: String(text),
          };
        }
      }
      errors.push(`Pollinations text ${res.status}`);
    } catch (err) {
      errors.push(String(err?.message || err));
    }
  }

  if (geminiKey) {
    try {
      const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        const text = (data?.candidates?.[0]?.content?.parts ?? [])
          .map((p) => p.text || '')
          .join('');
        if (text) {
          return {
            status: 200,
            headers: {
              'content-type': 'text/plain; charset=utf-8',
              'access-control-allow-origin': '*',
              'x-brandforge-backend': 'Gemini',
            },
            body: text,
          };
        }
      }
      errors.push(`Gemini text ${res.status}`);
    } catch (err) {
      errors.push(String(err?.message || err));
    }
  }

  // Klasik metin uç noktası
  try {
    const res = await fetch(
      `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`,
      { headers: { 'user-agent': 'BrandForgeFree/1.0 (proxy)' } },
    );
    if (res.ok) {
      const text = (await res.text()).trim();
      if (text) {
        return {
          status: 200,
          headers: {
            'content-type': 'text/plain; charset=utf-8',
            'access-control-allow-origin': '*',
            'x-brandforge-backend': 'Pollinations klasik',
          },
          body: text,
        };
      }
    }
    errors.push(`Klasik metin ${res.status}`);
  } catch (err) {
    errors.push(String(err?.message || err));
  }

  return json(502, { error: 'metin arka uçları başarısız', details: errors.slice(0, 3) });
}

/* ----------------------------- ham proxy (eski API) ---------------------------- */

async function proxyRequest(rawUrl, env) {
  if (!rawUrl) return json(400, { error: 'url query parameter is required' });
  if (!isAllowedTarget(rawUrl)) {
    return json(403, { error: 'host not allowed', allowed: ALLOWED_HOSTS });
  }
  try {
    const upstream = await fetch(rawUrl, {
      headers: { accept: '*/*', 'user-agent': 'BrandForgeFree/1.0 (proxy)' },
      redirect: 'follow',
    });
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.length > MAX_BYTES) return json(413, { error: 'payload too large' });
    return {
      status: upstream.status,
      headers: {
        'content-type': contentType,
        'cache-control': 'public, max-age=300',
        'access-control-allow-origin': '*',
      },
      body: buf,
    };
  } catch (err) {
    return json(502, { error: 'upstream failed', detail: String(err?.message || err) });
  }
}

/* --------------------------------- yönlendirme -------------------------------- */

async function routeRequest({ url, method = 'GET', body = null, env = null }) {
  const parsed = new URL(url, 'http://localhost');
  const path = parsed.pathname.replace(/\/+$/, '');
  // Son segment'e bak: Vercel (/api/proxy/image), Netlify (/.netlify/functions/proxy/image)
  // ve Worker (/api/proxy/image) yollarının hepsi "image" / "text" ile biter.
  const last = path.slice(path.lastIndexOf('/') + 1).toLowerCase();
  // Tek uç nokta kullanımı: /api/proxy?op=image  (Vercel alt yollara eşleştirmiyor)
  const op = (parsed.searchParams.get('op') || '').toLowerCase();

  if (last === 'image' || op === 'image') {
    const params = Object.fromEntries(parsed.searchParams.entries());
    if (method === 'POST' && body) {
      try {
        const parsedBody = JSON.parse(body);
        Object.assign(params, parsedBody);
      } catch {
        /* JSON değilse query parametreleri kullanılır */
      }
    }
    return handleImage(params, env);
  }

  if (last === 'text' || op === 'text') {
    const params = Object.fromEntries(parsed.searchParams.entries());
    if (method === 'POST' && body) {
      try {
        Object.assign(params, JSON.parse(body));
      } catch {
        /* yoksay */
      }
    }
    return handleText(params, env);
  }

  return proxyRequest(parsed.searchParams.get('url'), env);
}



/* ---------- Vercel handler ---------- */
/**
 * Vercel serverless function — /api/proxy
 *   GET  /api/proxy/image?prompt=...   -> görsel (ücretsiz backend seçimi sunucuda)
 *   GET  /api/proxy/text?prompt=...    -> metin
 *   POST /api/proxy/image  {prompt, editDataUrl?} -> görsel düzenleme
 *   GET  /api/proxy?url=...            -> ham proxy (eski API)
 */

async function readBody(req) {
  if (req.method !== 'POST') return null;
  if (typeof req.body === 'string') return req.body;
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body);
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
  } catch {
    return null;
  }
}

async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    return res.status(204).end();
  }

  const result = await routeRequest({
    url: req.url,
    method: req.method,
    body: await readBody(req),
    env: process.env,
  });

  res.statusCode = result.status;
  for (const [k, v] of Object.entries(result.headers)) res.setHeader(k, v);
  res.end(result.body);
}


export default handler;
