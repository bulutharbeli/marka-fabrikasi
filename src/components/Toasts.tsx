import type { Toast } from '../types';

export function ToastHost({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (!toasts.length) return null;
  const tones: Record<Toast['kind'], string> = {
    info: 'border-sky-500/40 bg-sky-500/10 text-sky-100',
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
    error: 'border-rose-500/40 bg-rose-500/10 text-rose-100',
    warn: 'border-amber-500/40 bg-amber-500/10 text-amber-100',
  };
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[min(92vw,26rem)] flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={`float-in pointer-events-auto rounded-xl border px-4 py-3 text-left shadow-xl backdrop-blur ${tones[t.kind]}`}
        >
          <div className="text-sm font-semibold">{t.title}</div>
          {t.detail && <div className="mt-0.5 text-xs opacity-80">{t.detail}</div>}
        </button>
      ))}
    </div>
  );
}
