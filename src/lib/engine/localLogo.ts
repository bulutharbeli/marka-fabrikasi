import { paletteOf } from '../catalog';
import { escapeXml, hashString } from '../utils';

export interface LocalLogoOptions {
  name: string;
  tagline?: string;
  style: string;
  logoType: string;
  palette: string;
  seed?: number;
  /** Farklı bir arketip seçmeyi zorlar (çeşitlilik için) */
  variantIndex?: number;
}

export interface LocalLogoResult {
  svg: string;
  dataUrl: string;
  archetype: string;
}

const SANS = 'Inter, Helvetica Neue, Arial, sans-serif';
const SERIF = 'Playfair Display, Georgia, Times New Roman, serif';

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'BF';
  if (words.length === 1) return words[0].replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toUpperCase() || 'B';
  return (words[0][0] + words[1][0]).toUpperCase();
}

interface Archetype {
  id: string;
  build: (ctx: Ctx) => string;
}

interface Ctx {
  c: string[];
  ink: string;
  accent: string;
  soft: string;
  style: string;
  initials: string;
  rnd: () => number;
  type: string;
}

/* ---------------------------------- marklar --------------------------------- */

const monogramBadge = (x: Ctx) => {
  const { c, ink, initials, style } = x;
  const stroke = style === 'minimalist' ? 10 : style === 'playful' ? 20 : 14;
  const round = style === 'playful' ? 120 : 24;
  return `
    <rect x="262" y="150" width="500" height="500" rx="${round}" fill="${c[0]}" opacity="${style === 'cyberpunk' ? 0.22 : 0.14}"/>
    <rect x="262" y="150" width="500" height="500" rx="${round}" fill="none" stroke="${c[0]}" stroke-width="${stroke}"/>
    <text x="512" y="480" text-anchor="middle" dominant-baseline="middle"
      font-family="${style === 'luxurious' || style === 'vintage' ? SERIF : SANS}"
      font-size="250" font-weight="${style === 'luxurious' ? 500 : 700}" fill="${ink}" letter-spacing="-6">${escapeXml(initials)}</text>`;
};

const orbitMark = (x: Ctx) => {
  const { c, ink, accent } = x;
  return `
    <circle cx="512" cy="400" r="150" fill="none" stroke="${ink}" stroke-width="22"/>
    <circle cx="512" cy="400" r="86" fill="${accent}"/>
    <ellipse cx="512" cy="400" rx="235" ry="90" fill="none" stroke="${ink}" stroke-width="12" transform="rotate(-24 512 400)"/>
    <circle cx="228" cy="508" r="26" fill="${c[0]}"/>
    <circle cx="796" cy="292" r="18" fill="${ink}"/>`;
};

const bauhausMark = (x: Ctx) => {
  const { c, rnd } = x;
  const a = Math.floor(rnd() * 3);
  const b = (a + 1) % 3;
  const d = (a + 2) % 3;
  return `
    <circle cx="440" cy="360" r="165" fill="${c[0]}" opacity="0.92"/>
    <rect x="430" y="330" width="250" height="250" fill="${c[1]}" opacity="0.85" transform="rotate(18 555 455)"/>
    <path d="M330 640 L512 300 L694 640 Z" fill="${c[d]}" opacity="0.9"/>`;
};

const waveMark = (x: Ctx) => {
  const { c, ink } = x;
  return `
    <path d="M240 470 C 330 380, 420 560, 512 470 C 604 380, 694 560, 784 470 L784 560 C694 650 604 470 512 560 C420 650 330 470 240 560 Z" fill="${c[0]}"/>
    <path d="M240 400 C 330 310, 420 490, 512 400 C 604 310, 694 490, 784 400" fill="none" stroke="${ink}" stroke-width="16" stroke-linecap="round"/>
    <circle cx="512" cy="285" r="58" fill="${c[1]}"/>`;
};

const petalMark = (x: Ctx) => {
  const { c, ink } = x;
  const petals = Array.from({ length: 8 }, (_, i) => {
    const a = (i * 45 * Math.PI) / 180;
    const cx = 512 + Math.cos(a) * 150;
    const cy = 400 + Math.sin(a) * 150;
    return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="72" ry="112" fill="${i % 2 ? c[0] : c[1]}" opacity="0.9" transform="rotate(${(i * 45).toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
  }).join('');
  return `${petals}<circle cx="512" cy="400" r="86" fill="${ink}"/>`;
};

const chevronMark = (x: Ctx) => {
  const { c, ink } = x;
  return `
    <path d="M300 540 L512 300 L724 540 L636 540 L512 398 L388 540 Z" fill="${c[0]}"/>
    <path d="M300 660 L512 420 L724 660 L636 660 L512 518 L388 660 Z" fill="${ink}" opacity="0.85"/>
    <circle cx="512" cy="240" r="30" fill="${c[1]}"/>`;
};

const horizonMark = (x: Ctx) => {
  const { c, ink, soft } = x;
  return `
    <circle cx="512" cy="330" r="120" fill="${c[1]}"/>
    <path d="M200 640 L400 360 L520 520 L640 400 L824 640 Z" fill="${ink}"/>
    <path d="M200 640 L824 640 L824 700 L200 700 Z" fill="${soft}" opacity="0.35"/>`;
};

const blockMark = (x: Ctx) => {
  const { c, ink, rnd } = x;
  const cells = 5;
  const size = 82;
  const gap = 18;
  const total = cells * size + (cells - 1) * gap;
  const originX = 512 - total / 2;
  const originY = 400 - total / 2;
  let out = '';
  for (let iy = 0; iy < cells; iy++) {
    for (let ix = 0; ix < cells; ix++) {
      const dist = Math.hypot(ix - 2, iy - 2);
      const on = dist < 2.35 + rnd() * 0.9;
      if (!on) continue;
      const color = dist < 1.2 ? c[0] : dist < 2 ? c[1] : ink;
      out += `<rect x="${(originX + ix * (size + gap)).toFixed(0)}" y="${(originY + iy * (size + gap)).toFixed(0)}" width="${size}" height="${size}" rx="14" fill="${color}" opacity="${(0.55 + dist * 0.12).toFixed(2)}"/>`;
    }
  }
  return out;
};

const shieldMark = (x: Ctx) => {
  const { c, ink, initials, style } = x;
  return `
    <path d="M512 140 L790 232 V520 C790 660 660 748 512 790 C364 748 234 660 234 520 V232 Z" fill="${c[0]}" opacity="0.12"/>
    <path d="M512 140 L790 232 V520 C790 660 660 748 512 790 C364 748 234 660 234 520 V232 Z" fill="none" stroke="${ink}" stroke-width="16"/>
    <path d="M512 186 L744 262 V512 C744 626 638 702 512 740 C386 702 280 626 280 512 V262 Z" fill="none" stroke="${ink}" stroke-width="6" opacity="0.55"/>
    <text x="512" y="470" text-anchor="middle" dominant-baseline="middle"
      font-family="${style === 'luxurious' || style === 'vintage' ? SERIF : SANS}"
      font-size="220" font-weight="600" fill="${ink}" letter-spacing="-4">${escapeXml(initials)}</text>`;
};

const mascotMark = (x: Ctx) => {
  const { c, ink, accent } = x;
  return `
    <circle cx="512" cy="400" r="215" fill="${accent}" opacity="0.18"/>
    <circle cx="512" cy="360" r="150" fill="${c[1]}"/>
    <circle cx="465" cy="330" r="26" fill="${ink}"/>
    <circle cx="559" cy="330" r="26" fill="${ink}"/>
    <circle cx="470" cy="324" r="9" fill="#ffffff"/>
    <circle cx="564" cy="324" r="9" fill="#ffffff"/>
    <path d="M470 400 Q512 448 554 400" fill="none" stroke="${ink}" stroke-width="16" stroke-linecap="round"/>
    <path d="M512 210 q40 -70 96 -46 q-34 34 -56 62 Z" fill="${c[0]}"/>
    <path d="M362 620 q150 74 300 0" fill="none" stroke="${ink}" stroke-width="20" stroke-linecap="round"/>`;
};

const ARCHETYPES: Archetype[] = [
  { id: 'monogram-badge', build: monogramBadge },
  { id: 'orbit', build: orbitMark },
  { id: 'bauhaus', build: bauhausMark },
  { id: 'wave', build: waveMark },
  { id: 'petal', build: petalMark },
  { id: 'chevron', build: chevronMark },
  { id: 'horizon', build: horizonMark },
  { id: 'blocks', build: blockMark },
  { id: 'shield', build: shieldMark },
  { id: 'mascot', build: mascotMark },
];

function styleDecor(x: Ctx): string {
  const { style, ink, accent } = x;
  switch (style) {
    case 'luxurious':
      return `
        <circle cx="512" cy="400" r="300" fill="none" stroke="${accent}" stroke-width="3" opacity="0.85"/>
        <circle cx="512" cy="400" r="322" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.6"/>
        <path d="M512 92 l14 26 28 4 -20 20 5 28 -27 -14 -27 14 5 -28 -20 -20 28 -4 Z" fill="${accent}" opacity="0.9"/>`;
    case 'vintage':
      return `
        <circle cx="512" cy="400" r="296" fill="none" stroke="${ink}" stroke-width="8"/>
        <circle cx="512" cy="400" r="282" fill="none" stroke="${ink}" stroke-width="2" stroke-dasharray="3 14" stroke-linecap="round"/>
        <path d="M512 88 l12 22 24 4 -18 16 4 24 -22 -12 -22 12 4 -24 -18 -16 24 -4 Z" fill="${ink}" opacity="0.8"/>`;
    case 'cyberpunk':
      return `
        <rect x="212" y="298" width="120" height="14" fill="${accent}" opacity="0.8"/>
        <rect x="690" y="492" width="150" height="10" fill="${accent}" opacity="0.6"/>
        <rect x="250" y="512" width="60" height="8" fill="${accent}" opacity="0.5"/>
        <circle cx="512" cy="400" r="272" fill="none" stroke="${accent}" stroke-width="2" opacity="0.5" stroke-dasharray="18 14"/>`;
    case 'playful':
      return `
        <circle cx="222" cy="236" r="20" fill="${accent}"/>
        <circle cx="806" cy="300" r="13" fill="${accent}"/>
        <circle cx="760" cy="600" r="17" fill="${accent}"/>
        <circle cx="272" cy="586" r="10" fill="${accent}"/>`;
    case 'abstract':
      return `
        <circle cx="512" cy="400" r="286" fill="none" stroke="${ink}" stroke-width="2" stroke-dasharray="26 22" opacity="0.35"/>`;
    default:
      return '';
  }
}

export function buildLocalLogo(opts: LocalLogoOptions): LocalLogoResult {
  const palette = paletteOf(opts.palette);
  const seed = opts.seed ?? hashString(`${opts.name}|${opts.style}|${opts.logoType}|${opts.palette}`);
  const rnd = (() => {
    let s = seed || 1;
    return () => {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return ((s >>> 0) % 10000) / 10000;
    };
  })();

  const type = opts.logoType || 'combination';
  let pool = ARCHETYPES;
  if (type === 'mascot') pool = ARCHETYPES.filter((a) => a.id === 'mascot');
  else if (type === 'lettermark' || type === 'emblem')
    pool = ARCHETYPES.filter((a) => a.id === 'monogram-badge' || a.id === 'shield');
  else if (type === 'abstract')
    pool = ARCHETYPES.filter((a) =>
      ['bauhaus', 'petal', 'blocks', 'orbit'].includes(a.id),
    );
  else if (type === 'pictorial')
    pool = ARCHETYPES.filter((a) => ['wave', 'horizon', 'chevron', 'orbit'].includes(a.id));

  const archetype = pool[(opts.variantIndex ?? seed) % pool.length];

  const ctx: Ctx = {
    c: palette.colors,
    ink: palette.colors[2],
    accent: palette.colors[0],
    soft: palette.colors[3],
    style: opts.style,
    initials: initialsOf(opts.name),
    rnd,
    type,
  };

  const font = opts.style === 'luxurious' || opts.style === 'vintage' ? SERIF : SANS;
  const wordmark = opts.name.trim() || 'BRAND';
  const showWordmark = type === 'combination' || type === 'wordmark' || type === 'emblem';
  const wordmarkMarkup = showWordmark
    ? `<text x="512" y="${type === 'wordmark' ? 470 : 830}" text-anchor="middle"
        font-family="${font}" font-size="${type === 'wordmark' ? 150 : 88}" font-weight="${opts.style === 'luxurious' ? 500 : 700}"
        fill="${palette.colors[2]}" letter-spacing="${type === 'wordmark' ? '-3' : '2'}">${escapeXml(wordmark.toUpperCase())}</text>`
    : '';

  const taglineMarkup =
    showWordmark && opts.tagline?.trim()
      ? `<text x="512" y="${type === 'wordmark' ? 580 : 890}" text-anchor="middle" font-family="${font}"
          font-size="38" font-weight="400" fill="${palette.colors[0]}" opacity="0.85" letter-spacing="3">${escapeXml(opts.tagline.toUpperCase())}</text>`
      : '';

  const mark = type === 'wordmark' ? '' : archetype.build(ctx);
  const deco = type === 'wordmark' ? '' : styleDecor(ctx);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024" role="img" aria-label="${escapeXml(wordmark)} logosu">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.colors[0]}"/>
      <stop offset="100%" stop-color="${palette.colors[1]}"/>
    </linearGradient>
  </defs>
  ${deco}
  ${mark}
  ${wordmarkMarkup}
  ${taglineMarkup}
</svg>`;

  return {
    svg,
    dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    archetype: archetype.id,
  };
}

/** Prosedürel logoyu PNG'ye çevir (brand kit için). */
export async function localLogoToPng(dataUrl: string, size = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('svg render failed'));
    img.src = dataUrl;
  });
}
