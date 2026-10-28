import { useRef, useState } from 'react';
import type { BrandBrief, BrandConcept, Tier } from '../types';
import { LOGO_TYPES, PALETTES, PROMPT_SUGGESTIONS, STYLES, paletteOf } from '../lib/catalog';
import { Badge, Button, Field, SectionTitle, Spinner, cx, inputClass } from './ui';

export function BriefPanel({
  brief,
  setBrief,
  visual,
  setVisual,
  reference,
  setReference,
  concept,
  onBrainstorm,
  onEnhance,
  onGenerate,
  onUseConcept,
  busy,
  busyLabel,
  tier,
  setTier,
}: {
  brief: BrandBrief;
  setBrief: (b: BrandBrief) => void;
  visual: string;
  setVisual: (v: string) => void;
  reference: string | null;
  setReference: (r: string | null) => void;
  concept: BrandConcept | null;
  onBrainstorm: () => void;
  onEnhance: () => void;
  onGenerate: () => void;
  onUseConcept: (text: string) => void;
  busy: boolean;
  busyLabel?: string;
  tier: Tier;
  setTier: (t: Tier) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const set = <K extends keyof BrandBrief>(key: K, value: BrandBrief[K]) =>
    setBrief({ ...brief, [key]: value });

  async function handleFile(file?: File | null) {
    if (!file) return;
    const dataUrl = await downscale(file, 1024);
    setReference(dataUrl);
  }

  const pal = paletteOf(brief.palette);

  return (
    <div className="flex flex-col gap-5">
      {/* 1 — beyin fırtınası */}
      <section className="card p-5">
        <SectionTitle
          step="1"
          title="Marka Konseptini Beyin Fırtınası"
          right={
            <Button data-testid="brainstorm-btn" size="sm" variant="soft" onClick={onBrainstorm} disabled={busy}>
              {busyLabel === 'brainstorm' ? <Spinner /> : <BrainIcon />}
              Beyin Fırtınası
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Şirket Adı">
            <input
              data-testid="company-input"
              className={inputClass}
              value={brief.companyName}
              onChange={(e) => set('companyName', e.target.value)}
              placeholder="Örn. Kuzey Kahve"
            />
          </Field>
          <Field label="Sektör / Slogan">
            <input
              data-testid="sector-input"
              className={inputClass}
              value={brief.sector}
              onChange={(e) => set('sector', e.target.value)}
              placeholder="Örn. özel kahve, kavurma"
            />
          </Field>
          <Field label="Slogan" hint="isteğe bağlı">
            <input
              className={inputClass}
              value={brief.tagline}
              onChange={(e) => set('tagline', e.target.value)}
              placeholder="Örn. Her yudumda başlangıç"
            />
          </Field>
          <Field label="Logo Tipi">
            <select className={inputClass} value={brief.logoType} onChange={(e) => set('logoType', e.target.value)}>
              {LOGO_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} — {t.hint}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Görsel Stil">
            <select className={inputClass} value={brief.style} onChange={(e) => set('style', e.target.value)}>
              {STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Renk Paleti">
            <div className="flex flex-wrap gap-2">
              {PALETTES.map((p) => {
                const active = p.id === brief.palette;
                return (
                  <button
                    key={p.id}
                    onClick={() => set('palette', p.id)}
                    title={p.label}
                    className={cx(
                      'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition',
                      active
                        ? 'border-sky-500/70 bg-sky-500/10 text-sky-200'
                        : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200',
                    )}
                  >
                    <span className="flex -space-x-1">
                      {p.colors.slice(0, 3).map((c) => (
                        <span key={c} className="h-3 w-3 rounded-full ring-1 ring-slate-900" style={{ background: c }} />
                      ))}
                    </span>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        {concept && (
          <div data-testid="concept-panel" className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-100">{concept.headline}</h3>
              <Badge tone="violet">konsept</Badge>
            </div>
            <p className="text-[13px] leading-relaxed text-slate-400">{concept.story}</p>

            {concept.taglines.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {concept.taglines.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      set('tagline', t);
                      onUseConcept(t);
                    }}
                    className="rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-300 transition hover:border-sky-500/60 hover:text-sky-200"
                  >
                    “{t}”
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="soft"
                onClick={() => onUseConcept(concept.visualDirection)}
              >
                Görsel yönü prompta uygula
              </Button>
              {concept.nameIdeas.map((n) => (
                <button
                  key={n}
                  onClick={() => set('companyName', n)}
                  className="rounded-full border border-dashed border-slate-700 px-3 py-1 text-[11px] text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 2 — görsel açıklama */}
      <section className="card p-5">
        <SectionTitle step="2" title="Görsel Açıklama" />
        <Field label="Logo nasıl görünmeli?">
          <textarea
            className={cx(inputClass, 'min-h-[132px] resize-y leading-relaxed')}
            value={visual}
            onChange={(e) => setVisual(e.target.value)}
            placeholder="Örn. Altın bir balık figürü, çevresinde ince çember, altında ince serif yazı"
          />
        </Field>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button data-testid="enhance-btn" size="sm" variant="soft" onClick={onEnhance} disabled={busy}>
            {busyLabel === 'enhance' ? <Spinner /> : <SparkIcon />}
            AI Enhance
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setVisual(PROMPT_SUGGESTIONS[Math.floor(Math.random() * PROMPT_SUGGESTIONS.length)])}
          >
            <RefreshIcon />
            Yenile
          </Button>
          <span className="text-[11px] text-slate-500">
            {visual.length} karakter
          </span>
        </div>

        <div className="mt-4">
          <Field label="Referans Logo / Çizim" hint="isteğe bağlı">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                void handleFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => fileRef.current?.click()}
              className={cx(
                'flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 transition',
                drag ? 'border-sky-500 bg-sky-500/5' : 'border-slate-700 hover:border-slate-500',
              )}
            >
              {reference ? (
                <>
                  <img src={reference} alt="Referans" className="h-14 w-14 rounded-lg bg-white object-contain" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-200">Referans yüklendi</div>
                    <div className="text-[11px] text-slate-500">Bu görsel üretime yön verecek</div>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReference(null);
                    }}
                  >
                    Kaldır
                  </Button>
                </>
              ) : (
                <>
                  <UploadIcon />
                  <div>
                    <div className="text-sm font-medium text-slate-300">Görsel yükle veya sürükleyip bırak</div>
                    <div className="text-[11px] text-slate-500">PNG / JPG · maks 1024px</div>
                  </div>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void handleFile(e.target.files?.[0])}
              />
            </div>
          </Field>
        </div>
      </section>

      {/* 3 — üretim */}
      <section className="card p-5">
        <SectionTitle
          step="3"
          title="Logo Alternatifleri Üret"
          right={
            <div className="flex rounded-lg border border-slate-700 p-0.5">
              {(['standard', 'pro'] as Tier[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={cx(
                    'rounded-md px-3 py-1 text-[11px] font-semibold transition',
                    tier === t
                      ? t === 'pro'
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-600 text-slate-950'
                        : 'bg-slate-700 text-slate-100'
                      : 'text-slate-500 hover:text-slate-300',
                  )}
                >
                  {t === 'pro' ? 'Pro · Yüksek Kalite' : 'Standard · Ücretsiz'}
                </button>
              ))}
            </div>
          }
        />

        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Nano Banana öncelikli
          </span>
          <span>→ GPT-Image → FLUX → Pollinations → yerel vektör</span>
        </div>

        <Button data-testid="generate-btn" size="lg" onClick={onGenerate} disabled={busy} className="w-full">
          {busyLabel === 'generate' ? <Spinner /> : <SparkIcon />}
          {busyLabel === 'generate' ? 'Logo seçenekleri üretiliyor…' : 'Yeni Logo Seçenekleri Üret'}
        </Button>

        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-600">
          <span className="inline-flex items-center gap-1">
            <PaletteSwatch colors={pal.colors} />
            {pal.label}
          </span>
        </div>
      </section>
    </div>
  );
}

export function PaletteSwatch({ colors }: { colors: string[] }) {
  return (
    <span className="flex -space-x-1">
      {colors.slice(0, 4).map((c) => (
        <span key={c} className="h-2.5 w-2.5 rounded-full ring-1 ring-slate-900" style={{ background: c }} />
      ))}
    </span>
  );
}

export async function downscale(file: File, max = 1024): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });
    const ratio = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * ratio);
    canvas.height = Math.round(img.height * ratio);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } catch {
    return dataUrl;
  }
}

/* --------------------------------- ikonlar --------------------------------- */

const iconProps = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const };
export const BrainIcon = () => (
  <svg {...iconProps}>
    <path d="M9.5 3A3.5 3.5 0 0 0 6 6.5 3 3 0 0 0 4.5 12 3 3 0 0 0 6 17.5 3.5 3.5 0 0 0 9.5 21H12V3H9.5ZM14.5 3A3.5 3.5 0 0 1 18 6.5a3 3 0 0 1 1.5 5.5 3 3 0 0 1-1.5 5.5A3.5 3.5 0 0 1 14.5 21H12V3h2.5Z" />
  </svg>
);
export const SparkIcon = () => (
  <svg {...iconProps}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
  </svg>
);
export const RefreshIcon = () => (
  <svg {...iconProps}>
    <path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" />
  </svg>
);
export const UploadIcon = () => (
  <svg {...iconProps} width="22" height="22" className="text-slate-500">
    <path d="M12 16V4m0 0L7 9m5-5 5 5M4 20h16" />
  </svg>
);
