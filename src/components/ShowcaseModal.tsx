import { useState } from 'react';
import type { LogoResult, Mockup } from '../types';
import { MOCKUPS } from '../lib/catalog';
import { Badge, Button, Modal, Spinner, cx } from './ui';

export function ShowcaseModal({
  open,
  logo,
  busy,
  mockups,
  onClose,
  onInstant,
  onAi,
  onDownloadKit,
}: {
  open: boolean;
  logo: LogoResult | null;
  busy: boolean;
  mockups: Mockup[];
  onClose: () => void;
  onInstant: (scenarioId: string) => void;
  onAi: (scenarioId: string) => void;
  onDownloadKit: () => void;
}) {
  const [mode, setMode] = useState<'instant' | 'ai'>('instant');

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Marka Vitrini"
      subtitle="Logoyu gerçek uygulamalarda göster"
    >
      {logo && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-slate-700 p-0.5">
              <button
                onClick={() => setMode('instant')}
                className={cx(
                  'rounded-md px-3 py-1.5 text-[11px] font-semibold transition',
                  mode === 'instant' ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300',
                )}
              >
                Anında Mockup · ücretsiz
              </button>
              <button
                onClick={() => setMode('ai')}
                className={cx(
                  'rounded-md px-3 py-1.5 text-[11px] font-semibold transition',
                  mode === 'ai' ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300',
                )}
              >
                AI Mockup · gerçek fotoğraf
              </button>
            </div>
            <span className="text-[11px] text-slate-500">
              {mode === 'instant'
                ? 'Tamamen tarayıcıda üretilir — API çağrısı yok, anında ve limitsiz.'
                : 'Logoyu referans alarak gerçekçi fotoğraf mockupı üretir.'}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MOCKUPS.map((m) => {
              const made = mockups.filter((x) => x.scenarioId === m.id);
              return (
                <div key={m.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">{m.label}</span>
                    {made.length > 0 && <Badge tone="emerald">hazır</Badge>}
                  </div>
                  <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-slate-900/60">
                    {made.length > 0 ? (
                      <img src={made[0].url} alt={m.label} className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-[11px] text-slate-600">{mode === 'instant' ? 'üretilmemiş' : '—'}</span>
                    )}
                  </div>
                  <Button
                    data-testid={`mockup-btn-${m.id}`}
                    size="sm"
                    variant="soft"
                    className="mt-2 w-full"
                    disabled={busy}
                    onClick={() => (mode === 'instant' ? onInstant(m.id) : onAi(m.id))}
                  >
                    {busy ? <Spinner /> : null}
                    {made.length ? 'Yeniden üret' : 'Üret'}
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
            <span className="text-[11px] text-slate-500">
              {mockups.length} mockup hazır · logo PNG/SVG + rehber + konsept ile ZIP
            </span>
            <Button data-testid="kit-btn" variant="gold" onClick={onDownloadKit} disabled={!mockups.length}>
              <DownloadIcon />
              Brand Kit (ZIP) indir
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12m0 0 5-5m-5 5-5-5M4 21h16" />
  </svg>
);
