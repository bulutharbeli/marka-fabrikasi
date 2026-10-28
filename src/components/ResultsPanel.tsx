import type { LogoResult } from '../types';
import type { GenerateEvent } from '../lib/engine/imageEngine';
import { Badge, Button, Spinner, cx } from './ui';

export function ResultsPanel({
  results,
  selectedId,
  busy,
  progress,
  onSelect,
  onRefine,
  onVectorize,
  onShowcase,
  onDownload,
  onRegenerate,
}: {
  results: LogoResult[];
  selectedId: string | null;
  busy: boolean;
  progress: GenerateEvent[];
  onSelect: (id: string) => void;
  onRefine: (id: string) => void;
  onVectorize: (id: string) => void;
  onShowcase: (id: string) => void;
  onDownload: (id: string) => void;
  onRegenerate: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="card relative z-20 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Logo Seçenekleri</h2>
            <p className="text-[11px] text-slate-500">
              {results.length ? `${results.length} alternatif hazır` : 'Henüz üretim yapılmadı'}
            </p>
          </div>
          <Button size="sm" variant="soft" onClick={onRegenerate} disabled={busy}>
            {busy ? <Spinner /> : <RefreshIcon />}
            Yeniden üret
          </Button>
        </div>

        {busy && <ProgressLog events={progress} />}

        {!results.length && !busy && (
          <EmptyState />
        )}

        {results.length > 0 && (
          <div data-testid="results-grid" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {results.map((r) => (
              <LogoCard
                key={r.id}
                result={r}
                selected={selectedId === r.id}
                onSelect={() => onSelect(r.id)}
                onRefine={() => onRefine(r.id)}
                onVectorize={() => onVectorize(r.id)}
                onShowcase={() => onShowcase(r.id)}
                onDownload={() => onDownload(r.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LogoCard({
  result,
  selected,
  onSelect,
  onRefine,
  onVectorize,
  onShowcase,
  onDownload,
}: {
  result: LogoResult;
  selected: boolean;
  onSelect: () => void;
  onRefine: () => void;
  onVectorize: () => void;
  onShowcase: () => void;
  onDownload: () => void;
}) {
  return (
    <div
      data-testid="result-card"
      className={cx(
        'group relative overflow-hidden rounded-xl border transition',
        selected
          ? 'border-sky-500/70 ring-2 ring-sky-500/25'
          : 'border-slate-800 hover:border-slate-600',
      )}
    >
      <button onClick={onSelect} className="block w-full">
        <div
          className="flex aspect-square items-center justify-center p-3"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #0f172a 25%, transparent 25%), linear-gradient(-45deg, #0f172a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #0f172a 75%), linear-gradient(-45deg, transparent 75%, #0f172a 75%)',
            backgroundSize: '18px 18px',
            backgroundPosition: '0 0, 0 9px, 9px -9px, -9px 0px',
            backgroundColor: '#f8fafc',
          }}
        >
          <img
            src={result.url}
            alt={result.model}
            className="max-h-full max-w-full object-contain drop-shadow-sm transition group-hover:scale-[1.03]"
          />
        </div>
      </button>

      <div className="flex items-center justify-between gap-2 border-t border-slate-800 bg-slate-950/60 px-3 py-2">
        <div className="min-w-0">
          <div className="truncate text-[11px] font-medium text-slate-300">{result.badge}</div>
          <div className="truncate text-[10px] text-slate-600">{result.providerLabel}</div>
        </div>
        {result.kind === 'vector' && <Badge tone="emerald">SVG</Badge>}
        {result.kind === 'local' && <Badge tone="sky">Offline</Badge>}
      </div>

      <div className="absolute right-2 top-2 flex gap-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
        <IconButton title="Düzenle & İyileştir" testId="refine-btn" onClick={onRefine}>
          <EditIcon />
        </IconButton>
        <IconButton title="Vektöre çevir (SVG)" testId="vector-btn" onClick={onVectorize}>
          <VectorIcon />
        </IconButton>
        <IconButton title="Marka vitrini / mockup" testId="showcase-btn" onClick={onShowcase}>
          <GridIcon />
        </IconButton>
        <IconButton title="PNG indir" testId="download-btn" onClick={onDownload}>
          <DownloadIcon />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  title,
  testId,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  testId?: string;
}) {
  return (
    <button
      title={title}
      data-testid={testId}
      onClick={onClick}
      className="rounded-lg border border-slate-700 bg-slate-900/90 p-1.5 text-slate-300 backdrop-blur transition hover:border-sky-500/60 hover:text-sky-200"
    >
      {children}
    </button>
  );
}

function ProgressLog({ events }: { events: GenerateEvent[] }) {
  const lines = events.filter((e) => e.type === 'route' || e.type === 'fail' || e.type === 'success');
  if (!lines.length) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2.5 text-xs text-slate-400">
        <Spinner /> Sağlayıcı zinciri taranıyor…
      </div>
    );
  }
  return (
    <div className="mb-4 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[11px]">
      {lines.map((e, i) => (
        <div key={i} className="flex items-start gap-2">
          <span
            className={cx(
              'mt-1 h-1.5 w-1.5 shrink-0 rounded-full',
              e.type === 'success' ? 'bg-emerald-400' : e.type === 'fail' ? 'bg-rose-400' : 'bg-sky-400',
            )}
          />
          <span className="text-slate-400">
            <span className="text-slate-200">{e.label}</span>
            {e.type === 'fail' && <span className="text-rose-300/90"> — {e.detail}</span>}
            {e.type === 'success' && <span className="text-emerald-300/90"> — başarılı</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/15 to-violet-500/15 ring-1 ring-slate-700">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-slate-500">
          <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" />
          <path d="M12 12v9M4 7.5 12 12l8-4.5" />
        </svg>
      </div>
      <p className="max-w-sm text-sm text-slate-400">
        Soldaki adımları tamamlayıp <span className="text-slate-200">“Yeni Logo Seçenekleri Üret”</span> butonuna bas.
      </p>
      <p className="mt-2 max-w-sm text-[11px] text-slate-600">
        Nano Banana öncelikli çalışır; sağlayıcı limit'e takılırsa zincir otomatik olarak bir sonrakine geçer.
      </p>
    </div>
  );
}

/* --------------------------------- ikonlar --------------------------------- */
const ip = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
export const EditIcon = () => (
  <svg {...ip}>
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
export const VectorIcon = () => (
  <svg {...ip}>
    <path d="M4 4h16v16H4z" />
    <path d="M4 16 9 9l4 4 3-4 4 5" />
  </svg>
);
export const GridIcon = () => (
  <svg {...ip}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
export const DownloadIcon = () => (
  <svg {...ip}>
    <path d="M12 3v12m0 0 5-5m-5 5-5-5M4 21h16" />
  </svg>
);
export const RefreshIcon = () => (
  <svg {...ip}>
    <path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" />
  </svg>
);
