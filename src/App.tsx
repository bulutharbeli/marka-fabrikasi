import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TopBar } from './components/TopBar';
import { BriefPanel } from './components/BriefPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { RefineModal } from './components/RefineModal';
import { ShowcaseModal } from './components/ShowcaseModal';
import { SettingsModal } from './components/SettingsModal';
import { ToastHost } from './components/Toasts';
import { Badge, Button } from './components/ui';
import type { BrandBrief, BrandConcept, LogoResult, Mockup, Toast } from './types';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from './lib/storage';
import { ImageEngine, type GenerateEvent } from './lib/engine/imageEngine';
import { initPuter, isPuterSignedIn, puterUser, signInPuter, signOutPuter } from './lib/engine/puter';
import {
  brainstormPrompt,
  completeText,
  enhancePrompt,
  localBrainstorm,
  localEnhance,
  parseConcept,
} from './lib/engine/textEngine';
import { buildLogoPrompt, buildRefinePrompt, MOCKUPS, paletteOf } from './lib/catalog';
import { buildLocalLogo } from './lib/engine/localLogo';
import { buildInstantMockup } from './lib/mockups';
import { traceToSvg } from './lib/vectorize';
import { buildBrandKit } from './lib/brandkit';
import { downloadDataUrl, slugify, svgToPngDataUrl, uid } from './lib/utils';
import { APP_DOC_TITLE } from './lib/appName';

const EMPTY_BRIEF: BrandBrief = {
  companyName: '',
  tagline: '',
  sector: '',
  logoType: 'combination',
  style: 'minimalist',
  palette: 'modern-blue',
};

export default function App() {
  const [settings, setSettingsState] = useState<Settings>(() => ({
    ...DEFAULT_SETTINGS,
    ...loadSettings(),
    puterSignedIn: false,
  }));
  const settingsRef = useRef(settings);
  const puterSignedInRef = useRef(false);

  const [brief, setBrief] = useState<BrandBrief>(EMPTY_BRIEF);
  const [visual, setVisual] = useState('');
  const [reference, setReference] = useState<string | null>(null);
  const [concept, setConcept] = useState<BrandConcept | null>(null);
  const [results, setResults] = useState<LogoResult[]>([]);
  const [vectorSvgs, setVectorSvgs] = useState<Record<string, string>>({});
  const [mockups, setMockups] = useState<Mockup[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busyLabel, setBusyLabel] = useState<string | undefined>();
  const [progress, setProgress] = useState<GenerateEvent[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [puterSignedIn, setPuterSignedIn] = useState(false);
  const [puterAccount, setPuterAccount] = useState<{ username?: string; email?: string } | null>(null);

  const [refineOpen, setRefineOpen] = useState(false);
  const [showcaseOpen, setShowcaseOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [refineBusy, setRefineBusy] = useState(false);
  const [showcaseBusy, setShowcaseBusy] = useState(false);

  const setSettings = useCallback((s: Settings) => {
    settingsRef.current = s;
    setSettingsState(s);
    saveSettings(s);
  }, []);

  const engine = useMemo(
    () =>
      new ImageEngine(() => ({
        ...settingsRef.current,
        puterSignedIn: puterSignedInRef.current,
      })),
    [],
  );

  const toast = useCallback((kind: Toast['kind'], title: string, detail?: string) => {
    const id = uid('toast');
    setToasts((t) => [...t, { id, kind, title, detail }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }, []);

  /* ------------------------------ puter oturumu ------------------------------ */
  useEffect(() => {
    document.title = APP_DOC_TITLE;
  }, []);

  useEffect(() => {
    // Puter SDK arka planda yüklenir (ana paketi şişirmemek için tembel import)
    void initPuter().then(() => {
      const signed = isPuterSignedIn();
      puterSignedInRef.current = signed;
      setPuterSignedIn(signed);
      if (signed) {
        void puterUser().then((u) => {
          setPuterAccount(u);
          setSettings({ ...settingsRef.current, puterSignedIn: true });
        });
      }
    });
  }, [setSettings]);

  const handleSignIn = async () => {
    try {
      const user = await signInPuter();
      puterSignedInRef.current = true;
      setPuterSignedIn(true);
      setPuterAccount(user);
      setSettings({ ...settingsRef.current, puterSignedIn: true });
      toast('success', 'Puter oturumu açıldı', 'Nano Banana ve FLUX modelleri ücretsiz kullanılabilir.');
    } catch (e) {
      toast('error', 'Giriş yapılamadı', e instanceof Error ? e.message : String(e));
    }
  };

  const handleSignOut = () => {
    signOutPuter();
    puterSignedInRef.current = false;
    setPuterSignedIn(false);
    setPuterAccount(null);
    setSettings({ ...settingsRef.current, puterSignedIn: false });
  };

  /* -------------------------------- eylemler -------------------------------- */
  const handleBrainstorm = async () => {
    setBusyLabel('brainstorm');
    try {
      const res = await completeText(brainstormPrompt(brief), {
        geminiApiKey: settingsRef.current.geminiApiKey,
        pollinationsApiKey: settingsRef.current.pollinationsApiKey,
        proxyUrl: settingsRef.current.proxyUrl,
      });
      setConcept(parseConcept(res.text, brief));
      toast('success', 'Marka konsepti hazır', res.provider);
    } catch (e) {
      setConcept(localBrainstorm(brief));
      toast('warn', 'AI erişimi kapalı — yerel strateji üretildi', e instanceof Error ? e.message : undefined);
    } finally {
      setBusyLabel(undefined);
    }
  };

  const handleEnhance = async () => {
    setBusyLabel('enhance');
    try {
      const res = await completeText(enhancePrompt(visual, brief), {
        geminiApiKey: settingsRef.current.geminiApiKey,
        pollinationsApiKey: settingsRef.current.pollinationsApiKey,
        proxyUrl: settingsRef.current.proxyUrl,
      });
      setVisual(res.text);
      toast('success', 'Prompt zenginleştirildi', res.provider);
    } catch {
      setVisual(localEnhance(visual, brief));
      toast('info', 'Prompt yerel olarak zenginleştirildi');
    } finally {
      setBusyLabel(undefined);
    }
  };

  const handleGenerate = async () => {
    setBusyLabel('generate');
    setProgress([]);
    const prompt = buildLogoPrompt(brief, visual);
    const tier = settingsRef.current.tier;

    // 1) ANINDA YEREL VEKTÖR TASLAKLARI — kullanıcı beklemez, sonra AI ile yükselir
    const drafts: LogoResult[] = Array.from(
      { length: settingsRef.current.resultsCount },
      (_, i) => {
        const local = buildLocalLogo({
          name: brief.companyName,
          tagline: brief.tagline,
          style: brief.style,
          logoType: brief.logoType,
          palette: brief.palette,
          seed: Math.floor(Math.random() * 1_000_000_000) + i * 7919,
        });
        return {
          id: uid('draft'),
          kind: 'local' as const,
          url: local.dataUrl,
          dataUrl: local.dataUrl,
          prompt,
          providerId: 'local',
          providerLabel: 'Yerel Vektör Motoru',
          model: local.archetype,
          badge: 'Anında taslak',
          createdAt: Date.now() + i,
        };
      },
    );
    setResults((prev) => [...drafts, ...prev]);
    setSelectedId(drafts[0]?.id ?? null);

    // 2) AI GÖRSELLERİ — arka planda üretilir, bitince taslakları günceller
    try {
      const { outputs, failures } = await engine.generateMany(
        {
          prompt,
          tier,
          ratio: { w: 1, h: 1 },
          reference,
          edit: Boolean(reference),
          local: {
            name: brief.companyName,
            tagline: brief.tagline,
            style: brief.style,
            logoType: brief.logoType,
            palette: brief.palette,
          },
        },
        settingsRef.current.resultsCount,
        (e) => {
          setProgress((p) => [...p.slice(-40), e]);
          // Her AI logosu bitince ilgili taslağın yerine geçer (kademeli)
          if (e.type === 'success' && e.output && typeof e.index === 'number') {
            const draft = drafts[e.index];
            if (draft) {
              const upgraded: LogoResult = {
                id: uid('logo'),
                kind: e.output.providerId === 'local' ? 'local' : 'ai',
                url: e.output.url,
                dataUrl: e.output.dataUrl,
                external: e.output.external,
                prompt,
                providerId: e.output.providerId,
                providerLabel: e.output.providerLabel,
                model: e.output.model,
                badge: e.output.badge,
                createdAt: Date.now(),
                draftId: draft.id,
              };
              setResults((prev) => prev.map((r) => (r.id === draft.id ? upgraded : r)));
            }
          }
        },
      );

      const created: LogoResult[] = outputs.map((o, i) => ({
        id: uid('logo'),
        kind: o.providerId === 'local' ? 'local' : 'ai',
        url: o.url,
        dataUrl: o.dataUrl,
        external: o.external,
        prompt,
        providerId: o.providerId,
        providerLabel: o.providerLabel,
        model: o.model,
        badge: o.badge,
        createdAt: Date.now() + i,
        draftId: drafts[i]?.id,
      }));

      // AI sonuçları hazır olunca anında gösterilen taslakların yerine geçer
      if (created.length) {
        setResults((prev) => {
          const byDraft = new Map(created.map((c) => [c.draftId, c]));
          const upgraded = prev.map((r) => byDraft.get(r.id) ?? r);
          const extra = created.filter((c) => !c.draftId);
          return [...extra, ...upgraded];
        });
        setSelectedId(created[0].id);
        toast('success', `${created.length} AI logosu üretildi`, created.map((c) => c.badge).join(' · '));
      }
      if (failures.length) toast('warn', 'Bazı alternatifler üretilemedi', failures[0]);
    } catch (e) {
      toast('error', 'Üretim başarısız', e instanceof Error ? e.message : String(e));
    } finally {
      setBusyLabel(undefined);
    }
  };

  const handleRefineSubmit = async (instruction: string) => {
    const logo = results.find((r) => r.id === selectedId);
    if (!logo) return;
    setRefineBusy(true);
    const prompt = buildRefinePrompt(brief, instruction);
    try {
      const out = await engine.generate({
        prompt,
        tier: settingsRef.current.tier,
        ratio: { w: 1, h: 1 },
        reference: logo.dataUrl ?? logo.url,
        edit: true,
        local: {
          name: brief.companyName,
          tagline: brief.tagline,
          style: brief.style,
          logoType: brief.logoType,
          palette: brief.palette,
        },
      });
      const created: LogoResult = {
        id: uid('logo'),
        kind: out.providerId === 'local' ? 'local' : 'ai',
        url: out.url,
        dataUrl: out.dataUrl,
        external: out.external,
        prompt,
        providerId: out.providerId,
        providerLabel: out.providerLabel,
        model: out.model,
        badge: out.badge,
        createdAt: Date.now(),
      };
      setResults((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setRefineOpen(false);
      toast('success', 'Yeni varyant üretildi', out.badge);
    } catch (e) {
      toast('error', 'Düzenleme üretilemedi', e instanceof Error ? e.message : String(e));
    } finally {
      setRefineBusy(false);
    }
  };

  const handleVectorize = async (id: string) => {
    const logo = results.find((r) => r.id === id);
    if (!logo) return;
    try {
      const svg = await traceToSvg(logo.dataUrl ?? logo.url, { colors: 8, maxSize: 512 });
      const created: LogoResult = {
        id: uid('vector'),
        kind: 'vector',
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
        dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
        prompt: logo.prompt,
        providerId: 'vectorizer',
        providerLabel: 'imagetracer (istemci)',
        model: 'SVG trace',
        badge: 'Vektör SVG',
        createdAt: Date.now(),
      };
      setVectorSvgs((s) => ({ ...s, [created.id]: svg }));
      setResults((prev) => [created, ...prev]);
      setSelectedId(created.id);
      toast('success', 'Logo vektöre çevrildi', 'Ölçeklenebilir SVG hazır');
    } catch (e) {
      toast('error', 'Vektörleştirme başarısız', e instanceof Error ? e.message : String(e));
    }
  };

  const handleDownload = (id: string) => {
    const logo = results.find((r) => r.id === id);
    if (!logo) return;
    const name = slugify(brief.companyName || 'logo');
    if (logo.kind === 'vector') {
      const svg = vectorSvgs[logo.id];
      if (svg) {
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        downloadDataUrl(logo.url!, `${name}-logo.svg`);
        URL.revokeObjectURL(url);
        return;
      }
    }
    if (logo.dataUrl) {
      const ext = logo.dataUrl.startsWith('data:image/svg') ? 'svg' : 'png';
      downloadDataUrl(logo.dataUrl, `${name}-logo.${ext}`);
    } else {
      window.open(logo.url, '_blank', 'noopener');
    }
  };

  const selectedLogo = results.find((r) => r.id === selectedId) ?? null;

  const handleInstantMockup = async (scenarioId: string) => {
    const logo = selectedLogo;
    if (!logo) return;
    const sc = MOCKUPS.find((m) => m.id === scenarioId)!;
    try {
      const { svg, width, height } = buildInstantMockup({
        scenarioId,
        logoDataUrl: logo.dataUrl ?? logo.url,
        name: brief.companyName,
        tagline: brief.tagline,
        palette: brief.palette,
      });
      const png = await svgToPngDataUrl(svg, width, height);
      setMockups((prev) => [
        ...prev.filter((m) => m.scenarioId !== scenarioId),
        {
          id: uid('mockup'),
          scenarioId,
          label: sc.label,
          url: png,
          dataUrl: png,
          mode: 'instant',
          providerLabel: 'Yerel SVG',
        },
      ]);
    } catch (e) {
      toast('error', 'Mockup üretilemedi', e instanceof Error ? e.message : String(e));
    }
  };

  const handleAiMockup = async (scenarioId: string) => {
    const logo = selectedLogo;
    if (!logo) return;
    const sc = MOCKUPS.find((m) => m.id === scenarioId)!;
    setShowcaseBusy(true);
    const prompt = [
      `Create a photorealistic ${sc.label.toLowerCase()} mockup.`,
      sc.prompt,
      `Place the logo from the reference image onto it completely unchanged, keeping its exact shape, proportions and colours.`,
      `Do not redraw, restyle or invent any lettering.`,
    ].join(' ');
    try {
      const out = await engine.generate({
        prompt,
        tier: settingsRef.current.tier,
        ratio: sc.aspect,
        reference: logo.dataUrl ?? logo.url,
        edit: true,
        local: {
          name: brief.companyName,
          tagline: brief.tagline,
          style: brief.style,
          logoType: brief.logoType,
          palette: brief.palette,
        },
      });
      setMockups((prev) => [
        ...prev.filter((m) => m.scenarioId !== scenarioId),
        {
          id: uid('mockup'),
          scenarioId,
          label: sc.label,
          url: out.url,
          dataUrl: out.dataUrl,
          mode: 'ai',
          providerLabel: out.badge,
        },
      ]);
      toast('success', `${sc.label} mockup hazır`, out.badge);
    } catch (e) {
      toast('error', 'AI mockup üretilemedi', e instanceof Error ? e.message : String(e));
    } finally {
      setShowcaseBusy(false);
    }
  };

  const handleDownloadKit = async () => {
    const logo = selectedLogo;
    if (!logo) return;
    try {
      const svgText =
        vectorSvgs[logo.id] ??
        (logo.url.startsWith('data:image/svg') ? decodeURIComponent(logo.url.split(',')[1]) : undefined);
      const blob = await buildBrandKit({
        companyName: brief.companyName,
        tagline: brief.tagline,
        sector: brief.sector,
        concept,
        logoPng: logo.dataUrl && !logo.dataUrl.startsWith('data:image/svg') ? logo.dataUrl : null,
        logoSvg: svgText ?? null,
        mockups: mockups.filter((m) => m.dataUrl).map((m) => ({ label: m.label, dataUrl: m.dataUrl! })),
        palette: brief.palette,
        style: brief.style,
        logoType: brief.logoType,
        prompt: logo.prompt,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slugify(brief.companyName || 'brand')}-brand-kit.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast('success', 'Brand Kit indirildi', 'Logo + mockup + rehber + konsept');
    } catch (e) {
      toast('error', 'Brand Kit oluşturulamadı', e instanceof Error ? e.message : String(e));
    }
  };

  const pal = paletteOf(brief.palette);

  return (
    <div className="min-h-full">
      <TopBar
        puterSignedIn={puterSignedIn}
        puterUser={puterAccount}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onOpenSettings={() => setSettingsOpen(true)}
        freeMode
      />

      {/* hero */}
      <section className="mx-auto max-w-[1500px] px-4 pt-10 sm:px-6">
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge tone="emerald">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Tamamen ücretsiz · limitsiz · anahtar gerekmez
            </Badge>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-50 sm:text-4xl">
              Marka Yolculuğunu Başlat
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
              Şirketini anlat, AI marka kimliğini tasarlasın. Nano Banana öncelikli çalışır; bir sağlayıcı limit'e
              takılırsa zincir otomatik olarak diğerine geçer — hiçbir zaman “rate limit” hatası görmezsin.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-[11px]">
              {[
                'Nano Banana 2.1',
                'Nano Banana Pro',
                'GPT-Image 2.5',
                'FLUX.2',
                'Grok Imagine',
                'Pollinations',
                'Yerel SVG',
              ].map((m) => (
                <span
                  key={m}
                  className="rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-slate-400"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90">
              <img src={paletteSwatchImage(pal)} alt="Palet" className="h-7 w-7 object-contain" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Aktif palet</div>
              <div className="text-sm font-semibold text-slate-200">{pal.label}</div>
            </div>
          </div>
        </div>
      </section>

      {/* puter banner */}
      {!puterSignedIn && (
        <div className="mx-auto max-w-[1500px] px-4 pt-6 sm:px-6">
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                </svg>
              </span>
              <div>
                <div className="text-sm font-semibold text-amber-100">
                  Ücretsiz AI görseller için Puter hesabıyla giriş yapın
                </div>
                <div className="text-[11px] text-amber-200/70">
                  Nano Banana 2.1 / Pro, GPT-Image ve FLUX modelleri Puter’in “User-Pays” katmanı üzerinden tamamen
                  ücretsiz çalışır — siz kendi ücretsiz hesabınızla giriş yaparsınız, geliştirici hiçbir ödeme yapmaz.
                  Giriş olmadan da uygulama çalışır; yerel vektör motoru devreye girer.
                </div>
              </div>
            </div>
            <Button size="sm" variant="gold" onClick={handleSignIn} className="shrink-0">
              Ücretsiz giriş yap
            </Button>
          </div>
        </div>
      )}

      {/* ana alan */}
      <main className="mx-auto grid max-w-[1500px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
        <BriefPanel
          brief={brief}
          setBrief={setBrief}
          visual={visual}
          setVisual={setVisual}
          reference={reference}
          setReference={setReference}
          concept={concept}
          onBrainstorm={handleBrainstorm}
          onEnhance={handleEnhance}
          onGenerate={handleGenerate}
          onUseConcept={(text) => setVisual((v) => (v ? `${v}. ${text}` : text))}
          busy={Boolean(busyLabel)}
          busyLabel={busyLabel}
          tier={settings.tier}
          setTier={(t) => setSettings({ ...settingsRef.current, tier: t })}
        />

        <ResultsPanel
          results={results}
          selectedId={selectedId}
          busy={busyLabel === 'generate'}
          progress={progress}
          onSelect={setSelectedId}
          onRefine={(id) => {
            setSelectedId(id);
            setRefineOpen(true);
          }}
          onVectorize={handleVectorize}
          onShowcase={(id) => {
            setSelectedId(id);
            setShowcaseOpen(true);
          }}
          onDownload={handleDownload}
          onRegenerate={handleGenerate}
        />
      </main>

      <footer className="border-t border-slate-800/70 py-8">
        <div className="mx-auto flex max-w-[1500px] flex-col items-center gap-2 px-4 text-center text-[11px] text-slate-600 sm:px-6">
          <span>
            BrandForge Free · Google’ın görsel modelleri ücretli olduğu için Puter “User-Pays” katmanı ve ücretsiz
            Pollinations kullanılır. Geliştirici hiçbir ödeme yapmaz.
          </span>
          <span>Kaynak kod MIT lisanslı · Tüm üretim tarayıcıda gerçekleşir.</span>
        </div>
      </footer>

      <RefineModal
        open={refineOpen}
        logo={selectedLogo}
        busy={refineBusy}
        onClose={() => setRefineOpen(false)}
        onSubmit={handleRefineSubmit}
      />

      <ShowcaseModal
        open={showcaseOpen}
        logo={selectedLogo}
        busy={showcaseBusy}
        mockups={mockups}
        onClose={() => setShowcaseOpen(false)}
        onInstant={handleInstantMockup}
        onAi={handleAiMockup}
        onDownloadKit={handleDownloadKit}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
        puterSignedIn={puterSignedIn}
        puterUser={puterAccount}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        routes={engine.allRoutes()}
        healthOf={engine.healthOf.bind(engine)}
      />

      <ToastHost toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}

function paletteSwatchImage(pal: { colors: string[] }): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${pal.colors
    .slice(0, 4)
    .map(
      (c, i) =>
        `<rect x="${(i % 2) * 50}" y="${Math.floor(i / 2) * 50}" width="50" height="50" fill="${c}"/>`,
    )
    .join('')}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
