import type { Settings } from '../storage';
import { buildLocalLogo } from './localLogo';
import { geminiImage } from './gemini';
import { pollinationsImage } from './pollinations';
import { HF_MODELS, huggingfaceImage, POLLINATIONS_MODELS, pollinationsUnifiedImage } from './extra';
import { puterTxt2Img } from './puter';
import { classifyError, isAbort, ProviderError, type GenOutput, type GenRequest } from './types';

export type RouteKind = 'gemini-own' | 'puter' | 'pollinations' | 'pollinations-unified' | 'hf' | 'local';

export interface Route {
  id: string;
  group: string;
  label: string;
  badge: string;
  kind: RouteKind;
  model?: string;
  puterProvider?: string;
  tiers: ('standard' | 'pro')[];
  quality?: Partial<Record<'standard' | 'pro', string>>;
  supportsEdit: boolean;
  needsGeminiKey?: boolean;
  needsPuter?: boolean;
  needsHfToken?: boolean;
  needsPollinationsKey?: boolean;
  needsClassicPollinations?: boolean;
  note?: string;
}

export interface RouteHealth {
  fails: number;
  cooldownUntil: number;
  lastError?: string;
  lastUsed?: number;
  successes: number;
}

const ROUTES: Route[] = [
  {
    id: 'own-gemini-pro',
    group: 'own-gemini',
    label: 'Gemini (kendi anahtarınız)',
    badge: 'Nano Banana Pro',
    kind: 'gemini-own',
    model: 'gemini-3-pro-image',
    tiers: ['pro'],
    supportsEdit: true,
    needsGeminiKey: true,
  },
  {
    id: 'own-gemini-nano21',
    group: 'own-gemini',
    label: 'Gemini (kendi anahtarınız)',
    badge: 'Nano Banana 2.1',
    kind: 'gemini-own',
    model: 'gemini-nano-banana-2.1',
    tiers: ['standard', 'pro'],
    supportsEdit: true,
    needsGeminiKey: true,
  },
  {
    id: 'own-gemini-flash',
    group: 'own-gemini',
    label: 'Gemini (kendi anahtarınız)',
    badge: 'Nano Banana',
    kind: 'gemini-own',
    model: 'gemini-3.1-flash-image',
    tiers: ['standard', 'pro'],
    supportsEdit: true,
    needsGeminiKey: true,
  },
  {
    id: 'puter-nano21',
    group: 'puter-gemini',
    label: 'Puter · Gemini',
    badge: 'Nano Banana 2.1',
    kind: 'puter',
    puterProvider: 'gemini',
    model: 'gemini-nano-banana-2.1',
    tiers: ['pro'],
    quality: { pro: '2K' },
    supportsEdit: true,
    needsPuter: true,
  },
  {
    id: 'puter-gemini-pro',
    group: 'puter-gemini',
    label: 'Puter · Gemini',
    badge: 'Nano Banana Pro',
    kind: 'puter',
    puterProvider: 'gemini',
    model: 'gemini-3-pro-image',
    tiers: ['pro'],
    quality: { pro: '2K' },
    supportsEdit: true,
    needsPuter: true,
  },
  {
    id: 'puter-gemini-flash',
    group: 'puter-gemini',
    label: 'Puter · Gemini',
    badge: 'Nano Banana',
    kind: 'puter',
    puterProvider: 'gemini',
    model: 'gemini-3.1-flash-image',
    tiers: ['standard', 'pro'],
    quality: { standard: '1K', pro: '2K' },
    supportsEdit: true,
    needsPuter: true,
  },
  {
    id: 'puter-gemini-lite',
    group: 'puter-gemini',
    label: 'Puter · Gemini',
    badge: 'Nano Banana Lite',
    kind: 'puter',
    puterProvider: 'gemini',
    model: 'gemini-3.1-flash-lite-image',
    tiers: ['standard'],
    quality: { standard: '1K' },
    supportsEdit: true,
    needsPuter: true,
  },
  {
    id: 'puter-openai-flare',
    group: 'puter-openai',
    label: 'Puter · OpenAI',
    badge: 'GPT-Image 2.5',
    kind: 'puter',
    puterProvider: 'openai',
    model: 'gpt-image-2.5-flare',
    tiers: ['pro'],
    quality: { pro: 'high' },
    supportsEdit: true,
    needsPuter: true,
  },
  {
    id: 'puter-openai-2',
    group: 'puter-openai',
    label: 'Puter · OpenAI',
    badge: 'GPT-Image 2',
    kind: 'puter',
    puterProvider: 'openai',
    model: 'gpt-image-2',
    tiers: ['standard', 'pro'],
    quality: { standard: 'medium' },
    supportsEdit: true,
    needsPuter: true,
  },
  {
    id: 'puter-flux-pro',
    group: 'puter-flux',
    label: 'Puter · FLUX',
    badge: 'FLUX.2 Pro',
    kind: 'puter',
    puterProvider: 'replicate',
    model: 'black-forest-labs/flux-2-pro',
    tiers: ['pro'],
    supportsEdit: true,
    needsPuter: true,
  },
  {
    id: 'puter-flux-schnell',
    group: 'puter-flux',
    label: 'Puter · FLUX',
    badge: 'FLUX Schnell',
    kind: 'puter',
    puterProvider: 'replicate',
    model: 'black-forest-labs/flux-schnell',
    tiers: ['standard', 'pro'],
    supportsEdit: true,
    needsPuter: true,
  },
  {
    id: 'puter-cf-schnell',
    group: 'puter-cloudflare',
    label: 'Puter · Cloudflare',
    badge: 'FLUX.1 Schnell',
    kind: 'puter',
    puterProvider: 'cloudflare',
    model: '@cf/black-forest-labs/flux-1-schnell',
    tiers: ['standard', 'pro'],
    supportsEdit: false,
    needsPuter: true,
  },
  {
    id: 'puter-xai',
    group: 'puter-xai',
    label: 'Puter · xAI',
    badge: 'Grok Imagine',
    kind: 'puter',
    puterProvider: 'xai',
    model: 'grok-imagine-image',
    tiers: ['standard', 'pro'],
    supportsEdit: true,
    needsPuter: true,
  },
  {
    id: 'hf-flux',
    group: 'huggingface',
    label: 'Hugging Face',
    badge: 'FLUX.1 Schnell',
    kind: 'hf',
    model: 'black-forest-labs/FLUX.1-schnell',
    tiers: ['standard', 'pro'],
    supportsEdit: false,
    needsHfToken: true,
  },
  {
    id: 'hf-sd-turbo',
    group: 'huggingface',
    label: 'Hugging Face',
    badge: 'SD Turbo',
    kind: 'hf',
    model: 'stabilityai/sd-turbo',
    tiers: ['standard', 'pro'],
    supportsEdit: false,
    needsHfToken: true,
  },
  {
    id: 'pollinations-unified',
    group: 'pollinations-api',
    label: 'Pollinations API',
    badge: 'FLUX (unified)',
    kind: 'pollinations-unified',
    model: 'flux',
    tiers: ['standard', 'pro'],
    supportsEdit: false,
    needsPollinationsKey: true,
  },
  {
    id: 'pollinations',
    group: 'pollinations',
    label: 'Pollinations',
    badge: 'FLUX · ücretsiz',
    kind: 'pollinations',
    tiers: ['standard', 'pro'],
    supportsEdit: false,
    needsClassicPollinations: true,
  },
  {
    id: 'local-vector',
    group: 'local',
    label: 'Yerel Vektör Motoru',
    badge: 'Offline · SVG',
    kind: 'local',
    tiers: ['standard', 'pro'],
    supportsEdit: false,
  },
];

export interface GenerateEvent {
  type: 'start' | 'route' | 'success' | 'fail' | 'done';
  routeId?: string;
  label?: string;
  detail?: string;
  index?: number;
  /** Üretilen çıktı (kademeli güncelleme için) */
  output?: GenOutput;
  /** Hangi kuyruk sırası */
  slot?: number;
}

const COOLDOWN_QUOTA = 120_000;
const COOLDOWN_ERROR = 25_000;
const COOLDOWN_AUTH = 300_000;

export class ImageEngine {
  private health = new Map<string, RouteHealth>();

  constructor(private readonly getSettings: () => Settings) {}

  allRoutes(): Route[] {
    return ROUTES;
  }

  routes(tier: 'standard' | 'pro', forEdit = false): Route[] {
    const s = this.getSettings();
    return ROUTES.filter((r) => {
      if (!r.tiers.includes(tier)) return false;
      if (r.needsGeminiKey && !s.geminiApiKey) return false;
      if (r.needsHfToken && !s.hfToken) return false;
      if (r.needsPollinationsKey && !s.pollinationsApiKey) return false;
      // Klasik uç nokta proxy varsa ya da kullanıcı açıkça istediyse kullanılır
      if (r.needsClassicPollinations && !s.enableClassicPollinations && !s.proxyUrl) return false;
      if (forEdit && !r.supportsEdit) return false;
      return true;
    });
  }

  healthOf(routeId: string): RouteHealth {
    return (
      this.health.get(routeId) ?? { fails: 0, cooldownUntil: 0, successes: 0 }
    );
  }

  isCooling(routeId: string): boolean {
    return this.healthOf(routeId).cooldownUntil > Date.now();
  }

  private markFail(routeId: string, quota: boolean, auth: boolean, message: string) {
    const h = this.healthOf(routeId);
    const base = quota ? COOLDOWN_QUOTA : auth ? COOLDOWN_AUTH : COOLDOWN_ERROR;
    const factor = Math.min(h.fails + 1, 4);
    this.health.set(routeId, {
      ...h,
      fails: h.fails + 1,
      cooldownUntil: Date.now() + Math.min(base * factor, 10 * 60_000),
      lastError: message,
    });
  }

  private markSuccess(routeId: string) {
    const h = this.healthOf(routeId);
    this.health.set(routeId, { ...h, fails: 0, cooldownUntil: 0, lastError: undefined, successes: h.successes + 1, lastUsed: Date.now() });
  }

  /** Tek bir üretim — tüm rota zincirini failover ile dener. */
  async generate(
    req: GenRequest,
    onEvent?: (e: GenerateEvent) => void,
    preferRouteId?: string,
  ): Promise<GenOutput> {
    const s = this.getSettings();
    const routes = this.routes(req.tier, Boolean(req.edit || req.reference));
    const ordered = preferRouteId
      ? [...routes.filter((r) => r.id === preferRouteId), ...routes.filter((r) => r.id !== preferRouteId)]
      : routes;

    const errors: string[] = [];

    for (const route of ordered) {
      if (route.kind === 'local') continue;
      if (this.isCooling(route.id)) {
        errors.push(`${route.badge}: beklemede (önceki hata)`);
        continue;
      }
      if (route.needsPuter && !s.puterSignedIn) {
        errors.push(`${route.badge}: Puter oturumu yok`);
        continue;
      }
      if (route.needsHfToken && !s.hfToken) {
        errors.push(`${route.badge}: HF token yok`);
        continue;
      }
      if (route.needsPollinationsKey && !s.pollinationsApiKey) {
        errors.push(`${route.badge}: Pollinations anahtarı yok`);
        continue;
      }
      if (route.needsClassicPollinations && !s.enableClassicPollinations && !s.proxyUrl) {
        errors.push(`${route.badge}: kapalı`);
        continue;
      }

      onEvent?.({ type: 'route', routeId: route.id, label: route.badge });

      try {
        const out = await this.runRoute(route, req);
        this.markSuccess(route.id);
        onEvent?.({ type: 'success', routeId: route.id, label: route.badge });
        return out;
      } catch (err) {
        if (isAbort(err)) throw err;
        const c = classifyError(err);
        this.markFail(route.id, c.quota, c.auth, c.message);
        errors.push(`${route.badge}: ${c.message}`);
        onEvent?.({ type: 'fail', routeId: route.id, label: route.badge, detail: c.message });
      }
    }

    // Son çare: tamamen yerel vektör üretimi (limitsiz, çevrimdışı)
    if (s.localFallback && req.local) {
      const local = buildLocalLogo({
        name: req.local.name,
        tagline: req.local.tagline,
        style: req.local.style,
        logoType: req.local.logoType,
        palette: req.local.palette,
        seed: req.seed,
        variantIndex: req.variantIndex,
      });
      onEvent?.({ type: 'success', routeId: 'local-vector', label: 'Yerel Vektör' });
      return {
        url: local.dataUrl,
        dataUrl: local.dataUrl,
        routeId: 'local-vector',
        providerId: 'local',
        providerLabel: 'Yerel Vektör Motoru',
        model: local.archetype,
        badge: 'Offline · SVG',
      };
    }

    throw new ProviderError(
      `Hiçbir sağlayıcı yanıt vermedi. ${errors.slice(0, 3).join(' · ')}`,
      'all_failed',
    );
  }

  private async runRoute(route: Route, req: GenRequest): Promise<GenOutput> {
    const s = this.getSettings();
    const meta = {
      routeId: route.id,
      providerId: route.group,
      providerLabel: route.label,
      badge: route.badge,
    };

    if (route.kind === 'gemini-own') {
      return geminiImage(req, s.geminiApiKey, meta);
    }
    if (route.kind === 'pollinations') {
      return pollinationsImage(req, s.pollinationsToken, meta, s.proxyUrl);
    }
    if (route.kind === 'pollinations-unified') {
      return pollinationsUnifiedImage(req, s.pollinationsApiKey, route.model ?? 'flux', meta);
    }
    if (route.kind === 'hf') {
      return huggingfaceImage(req, s.hfToken, route.model ?? HF_MODELS[0].id, meta);
    }
    // puter
    const quality = route.quality?.[req.tier];
    const inputImages = req.reference ? [req.reference] : undefined;
    return puterTxt2Img({
      prompt: req.prompt,
      model: route.model,
      provider: route.puterProvider,
      quality,
      ratio: req.ratio,
      inputImages,
      ...meta,
      signal: req.signal,
    });
  }

  /** N adet alternatif üretir; sağlayıcıları paralel dağıtır. */
  async generateMany(
    req: GenRequest,
    count: number,
    onEvent?: (e: GenerateEvent) => void,
  ): Promise<{ outputs: GenOutput[]; failures: string[] }> {
    const healthy = this.routes(req.tier).filter((r) => r.kind !== 'local' && !this.isCooling(r.id));
    const outputs: GenOutput[] = [];
    const failures: string[] = [];

    const tasks = Array.from({ length: count }, async (_, i) => {
      const prefer = healthy.length ? healthy[i % healthy.length].id : undefined;
      onEvent?.({ type: 'start', index: i });
      try {
        // Her slot için farklı seed → hem AI üretimde hem yerel vektörde çeşitlilik
        const slotReq: GenRequest = {
          ...req,
          seed: req.seed ?? Math.floor(Math.random() * 1_000_000_000) + i * 7919,
          variantIndex: i,
        };
        const out = await this.generate(slotReq, onEvent, prefer);
        outputs.push(out);
        onEvent?.({ type: 'success', routeId: out.routeId, label: out.badge, output: out, index: i });
      } catch (err) {
        if (isAbort(err)) throw err;
        failures.push(err instanceof Error ? err.message : String(err));
      }
    });

    await Promise.all(tasks);
    onEvent?.({ type: 'done' });
    return { outputs, failures };
  }
}
