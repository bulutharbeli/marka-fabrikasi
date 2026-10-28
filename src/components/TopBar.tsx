import { Badge, Button } from './ui';
import { APP_NAME, APP_TAGLINE } from '../lib/appName';

export function TopBar({
  puterSignedIn,
  puterUser,
  onSignIn,
  onSignOut,
  onOpenSettings,
  freeMode,
}: {
  puterSignedIn: boolean;
  puterUser: { username?: string; email?: string } | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenSettings: () => void;
  freeMode: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/70 bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 shadow-lg shadow-violet-500/25">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" />
              <path d="M12 12v9M4 7.5 12 12l8-4.5" />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-slate-100">{APP_NAME}</span>
              <Badge tone="emerald">FREE</Badge>
            </div>
            <span className="text-[11px] text-slate-500">{APP_TAGLINE}</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {freeMode && (
            <span className="hidden items-center gap-1.5 text-[11px] text-slate-500 md:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              6 sağlayıcı · otomatik yedekleme
            </span>
          )}
          {puterSignedIn ? (
            <button
              onClick={onSignOut}
              title="Puter oturumunu kapat"
              className="hidden items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-600 hover:text-slate-100 sm:inline-flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {puterUser?.username ?? 'Puter oturumu'}
            </button>
          ) : (
            <Button size="sm" variant="soft" onClick={onSignIn} title="Ücretsiz Nano Banana erişimi için Puter hesabıyla giriş yapın">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
              </svg>
              Puter ile giriş
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onOpenSettings} title="Ayarlar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </Button>
        </div>
      </div>
    </header>
  );
}
