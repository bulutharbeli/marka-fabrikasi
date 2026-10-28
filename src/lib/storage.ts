import type { Tier } from '../types';

export interface Settings {
  tier: Tier;
  /** Kullanıcının kendi Gemini anahtarı (varsa doğrudan nano banana kullanılır) */
  geminiApiKey: string;
  /** Pollinations classic token (boş = anonim) */
  pollinationsToken: string;
  /** Pollinations unified API anahtarı (sk_…) — ücretsiz pollen kredisi */
  pollinationsApiKey: string;
  /** Hugging Face token (hf_…) — ücretsiz aylık kredi */
  hfToken: string;
  /** Pollinations klasik uç nokta tarayıcıda genelde Turnstile ile engellenir */
  enableClassicPollinations: boolean;
  /** Sunucu tarafı proxy adresi (varsayılan: aynı origin'deki /api/proxy) */
  proxyUrl: string;
  /** Kaç alternatif üretilsin */
  resultsCount: number;
  /** Mockup oranı */
  mockupAspect: string;
  /** Yerel prosedürel vektör üretimi her zaman son çare olarak açık */
  localFallback: boolean;
  /** Otomatik failover açık mı */
  autoFailover: boolean;
  /** Puter oturumu açık mı */
  puterSignedIn: boolean;
}

const KEY = 'brandforge-free.settings.v1';

export const DEFAULT_SETTINGS: Settings = {
  tier: 'standard',
  geminiApiKey: '',
  pollinationsToken: '',
  pollinationsApiKey: '',
  hfToken: '',
  enableClassicPollinations: false,
  proxyUrl: '/api/proxy',
  resultsCount: 4,
  mockupAspect: 'auto',
  localFallback: true,
  autoFailover: true,
  puterSignedIn: false,
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
