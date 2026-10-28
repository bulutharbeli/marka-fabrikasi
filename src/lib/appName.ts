/**
 * Uygulama adı / sloganı — dağıtım ortamından değiştirilebilir.
 *
 * Vercel / Netlify / Cloudflare'da ortam değişkeni olarak tanımla:
 *   VITE_APP_NAME     = Logo Designer
 *   VITE_APP_TAGLINE  = Limitsiz AI logo üretimi
 *
 * Tanımlanmazsa varsayılan değerler kullanılır (BrandForge).
 * VITE_ öneki Vite tarafından istemciye açılır — gizli anahtar KOYMAYIN.
 */

function readEnv(key: string, fallback: string): string {
  try {
    const value = (import.meta.env as Record<string, string | undefined>)[key];
    const trimmed = typeof value === 'string' ? value.trim() : '';
    return trimmed || fallback;
  } catch {
    return fallback;
  }
}

export const APP_NAME = readEnv('VITE_APP_NAME', 'BrandForge');
export const APP_TAGLINE = readEnv('VITE_APP_TAGLINE', 'Limitsiz AI logo üretimi');
export const APP_DOC_TITLE = `${APP_NAME} — ${APP_TAGLINE}`;
