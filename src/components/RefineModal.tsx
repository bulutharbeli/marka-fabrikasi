import { useState } from 'react';
import type { LogoResult } from '../types';
import { Button, Modal, Spinner, inputClass } from './ui';

const QUICK_EDITS = [
  'Marka adının yazımını düzelt',
  'Rengi daha koyu ve lüks yap',
  'Simgeyi daha minimal ve ince çizgili yap',
  'Arka planı tamamen beyaz yap',
  'Simgeye hafif bir 3B derinlik kat',
  'Renkleri marka paletine göre yeniden uygula',
];

export function RefineModal({
  open,
  logo,
  busy,
  onClose,
  onSubmit,
}: {
  open: boolean;
  logo: LogoResult | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (instruction: string) => void;
}) {
  const [instruction, setInstruction] = useState('');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Düzenle & İyileştir"
      subtitle="Mevcut logoyu referans alarak yeni varyant üretir"
    >
      {logo && (
        <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
          <div className="rounded-xl border border-slate-800 bg-white/95 p-3">
            <img src={logo.url} alt="Seçili logo" className="w-full object-contain" />
            <div className="mt-2 text-center text-[10px] text-slate-500">{logo.badge}</div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Ne değişsin?
            </label>
            <textarea
              className={`${inputClass} min-h-[110px] resize-y`}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Örn. Logoyu tek renge indir, çizgi kalınlığını incelt ve marka adını daha büyük göster"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_EDITS.map((q) => (
                <button
                  key={q}
                  onClick={() => setInstruction(q)}
                  className="rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-400 transition hover:border-sky-500/60 hover:text-sky-200"
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                Görsel düzenleme, referans görseli destekleyen sağlayıcıları kullanır.
              </span>
              <Button
                onClick={() => onSubmit(instruction.trim())}
                disabled={busy || !instruction.trim()}
              >
                {busy ? <Spinner /> : null}
                {busy ? 'Üretiliyor…' : 'Yeni varyant üret'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
