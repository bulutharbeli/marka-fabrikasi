import { useState } from 'react';
import type { Route, RouteHealth } from '../lib/engine/imageEngine';
import type { Settings } from '../lib/storage';
import { Badge, Button, Field, Modal, inputClass, cx } from './ui';

export function SettingsModal({
  open,
  onClose,
  settings,
  setSettings,
  puterSignedIn,
  puterUser,
  onSignIn,
  onSignOut,
  routes,
  healthOf,
}: {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  setSettings: (s: Settings) => void;
  puterSignedIn: boolean;
  puterUser: { username?: string; email?: string } | null;
  onSignIn: () => void;
  onSignOut: () => void;
  routes: Route[];
  healthOf: (id: string) => RouteHealth;
}) {
  const [showKey, setShowKey] = useState(false);

  return (
    <Modal open={open} onClose={onClose} wide title="Ayarlar" subtitle="Sağlayıcılar, anahtarlar ve çıktı tercihleri">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              1 · Ücretsiz hesap (Puter)
            </h4>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              {puterSignedIn ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      {puterUser?.username ?? 'Puter oturumu açık'}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Nano Banana, GPT-Image ve FLUX modelleri bu oturumla ücretsiz kullanılır.
                    </p>
                  </div>
                  <Button size="sm" variant="soft" onClick={onSignOut}>
                    Çıkış
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-slate-300">Puter hesabıyla giriş yapılmadı</div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Ücretsiz kullanım için gerekli. Giriş, kullanıcının kendi ücretsiz hesabıyla olur —
                      geliştirici hiçbir ödeme yapmaz.
                    </p>
                  </div>
                  <Button size="sm" onClick={onSignIn}>
                    Giriş yap
                  </Button>
                </div>
              )}
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              2 · Kendi Gemini anahtarınız (isteğe bağlı)
            </h4>
            <Field label="Google AI Studio API anahtarı" hint="boş bırakılabilir">
              <div className="relative">
                <input
                  className={inputClass}
                  type={showKey ? 'text' : 'password'}
                  value={settings.geminiApiKey}
                  onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value.trim() })}
                  placeholder="AIza…"
                  spellCheck={false}
                />
                <button
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[11px] text-slate-500 hover:text-slate-300"
                >
                  {showKey ? 'gizle' : 'göster'}
                </button>
              </div>
            </Field>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Google'da Nano Banana görsel modelleri ücretlidir; bu anahtar <em>kendi</em> kredinizden harcar ve
              zincirin ilk sırasına girer. Anahtar olmadan da uygulama tamamen ücretsiz çalışır.
            </p>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              3 · Ek ücretsiz sağlayıcı anahtarları (isteğe bağlı)
            </h4>
            <div className="space-y-3">
              <Field label="Hugging Face token" hint="hf_…">
                <input
                  className={inputClass}
                  value={settings.hfToken}
                  onChange={(e) => setSettings({ ...settings, hfToken: e.target.value.trim() })}
                  placeholder="hf_…"
                  spellCheck={false}
                />
              </Field>
              <Field label="Pollinations API anahtarı" hint="sk_…">
                <input
                  className={inputClass}
                  value={settings.pollinationsApiKey}
                  onChange={(e) => setSettings({ ...settings, pollinationsApiKey: e.target.value.trim() })}
                  placeholder="sk_…"
                  spellCheck={false}
                />
              </Field>
              <Field label="Pollinations klasik token" hint="pk_…">
                <input
                  className={inputClass}
                  value={settings.pollinationsToken}
                  onChange={(e) => setSettings({ ...settings, pollinationsToken: e.target.value.trim() })}
                  placeholder="pk_…"
                  spellCheck={false}
                />
              </Field>
              <Field label="Sunucu proxy adresi" hint="/api/proxy">
                <input
                  className={inputClass}
                  value={settings.proxyUrl}
                  onChange={(e) => setSettings({ ...settings, proxyUrl: e.target.value.trim() })}
                  placeholder="/api/proxy"
                  spellCheck={false}
                />
              </Field>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Bu anahtarlar <em>isteğe bağlıdır</em>: Puter oturumu ve yerel vektör motoru zaten anahtarsız çalışır.
              HF ve Pollinations tarayıcıdan doğrudan çağrılabilen (CORS destekli) ek kademelerdir.
              <br />
              <strong>Proxy adresi</strong> varsayılan olarak <code>/api/proxy</code> gelir: uygulamanın kendi sunucusu
              ücretsiz sağlayıcıları çağırarak sağlayıcı limitlerini kullanıcıdan gizler. Kendi proxy adresinizi
              (ör. <code>https://marka-proxy.vercel.app/api/proxy</code>) yazabilirsiniz.
            </p>
          </section>

          <section>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">4 · Çıktı</h4>
            <div className="space-y-3">
              <Field label={`Alternatif sayısı: ${settings.resultsCount}`}>
                <input
                  type="range"
                  min={1}
                  max={6}
                  step={1}
                  value={settings.resultsCount}
                  onChange={(e) => setSettings({ ...settings, resultsCount: Number(e.target.value) })}
                  className="w-full"
                />
              </Field>
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.enableClassicPollinations}
                  onChange={(e) => setSettings({ ...settings, enableClassicPollinations: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 accent-sky-500"
                />
                Pollinations klasik uç noktayı dene (tarayıcıda genelde Turnstile ile engellenir)
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.localFallback}
                  onChange={(e) => setSettings({ ...settings, localFallback: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 accent-sky-500"
                />
                Tüm API'ler başarısız olursa yerel vektör motoruna düş
              </label>
            </div>
          </section>
        </div>

        <section className="space-y-4">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sağlayıcı zinciri & durum
            </h4>
            <div className="max-h-[420px] space-y-1.5 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              {routes.map((r) => {
                const h = healthOf(r.id);
                const cooling = h.cooldownUntil > Date.now();
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-800/80 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-slate-200">{r.badge}</div>
                      <div className="truncate text-[10px] text-slate-500">
                        {r.label}
                        {r.model ? ` · ${r.model}` : ''}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {h.successes > 0 && <Badge tone="emerald">{h.successes} başarılı</Badge>}
                      {cooling ? (
                        <Badge tone="rose">beklemede</Badge>
                      ) : h.fails > 0 ? (
                        <Badge tone="amber">{h.fails} hata</Badge>
                      ) : (
                        <Badge tone="slate">hazır</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Sağlayıcı hata verdiğinde kısa süre devre dışı bırakılır ve istek bir sonraki sağlayıcıya yönlendirilir.
              Böylece kullanıcı hiçbir zaman “rate limit” hatası görmez.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Limitsiz nasıl çalışıyor?
            </div>
            <ul className="space-y-1.5 text-[11px] leading-relaxed text-slate-400">
              <li>· Nano Banana modelleri Google'da ücretli olduğu için Puter “User-Pays” katmanı üzerinden ücretsiz sunulur.</li>
              <li>· Kullanıcı yalnızca kendi ücretsiz Puter hesabıyla giriş yapar; geliştirici hiçbir ödeme yapmaz.</li>
              <li>· Pollinations ve yerel SVG motoru, giriş yapılmasa bile her zaman devrede.</li>
              <li>· Hiçbir sağlayıcı yanıt vermezse prosedürel vektör motoru anında devreye girer.</li>
            </ul>
          </div>
        </section>
      </div>
    </Modal>
  );
}
