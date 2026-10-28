import type { Tier } from '../../types';

export interface GenRequest {
  prompt: string;
  tier: Tier;
  ratio?: { w: number; h: number };
  quality?: string;
  reference?: string | null;
  edit?: boolean;
  seed?: number;
  /** Paralel üretimde slot indeksi → yerel vektörde farklı arketip garantisi */
  variantIndex?: number;
  signal?: AbortSignal;
  /** API'ler tamamen başarısız olursa kullanılacak yerel vektör üretimi için brief */
  local?: {
    name: string;
    tagline?: string;
    style: string;
    logoType: string;
    palette: string;
  };
}

export interface GenOutput {
  url: string;
  dataUrl?: string;
  external?: boolean;
  routeId: string;
  providerId: string;
  providerLabel: string;
  model: string;
  badge: string;
}

export class ProviderError extends Error {
  code: string;
  quota: boolean;
  /** Kaç saniye sonra tekrar denemeli (Retry-After) */
  retryAfterMs?: number;
  constructor(message: string, code = 'unknown', quota = false, retryAfterMs?: number) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.quota = quota;
    this.retryAfterMs = retryAfterMs;
  }
}

const QUOTA_PATTERNS =
  /quota|rate.?limit|429|402|payment|billing|not available|insufficient|resource_exhausted|resource has been exhausted|too many requests|out of credit|allowance|permission denied|unauthorized|401|403|forbidden|not enabled|billing required/i;

const AUTH_PATTERNS = /auth|sign in|signin|login|unauthor|credential|token|401|403|forbidden/i;

/** Sağlayıcı hatalarını sınıflandırır: kota mı, yetki mi, yoksa geçici ağ hatası mı. */
export function classifyError(err: unknown): { message: string; code: string; quota: boolean; auth: boolean } {
  const raw = err instanceof Error ? err.message : String(err);
  const msg = raw.replace(/\s+/g, ' ').trim().slice(0, 260);
  const quota = QUOTA_PATTERNS.test(raw);
  const auth = !quota && AUTH_PATTERNS.test(raw);
  return {
    message: msg || 'bilinmeyen hata',
    code: quota ? 'quota' : auth ? 'auth' : 'error',
    quota,
    auth,
  };
}

export function isAbort(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === 'AbortError') ||
    (err instanceof Error && err.name === 'AbortError') ||
    /abort/i.test(err instanceof Error ? err.message : String(err))
  );
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Zaman aşımı sarmalayıcı — hiçbir sağlayıcı isteği sonsuza kadar asılı kalamaz.
 * Sağlayıcı limit'e takıldığında zincir bir sonrakine geçebilsin diye kritik.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
  onTimeout?: () => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout?.();
      reject(new ProviderError(message, 'timeout'));
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}
