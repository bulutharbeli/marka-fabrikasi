import type { BrandBrief } from '../types';

export interface StyleDef {
  id: string;
  label: string;
  keywords: string;
  mood: string;
}

export const STYLES: StyleDef[] = [
  {
    id: 'minimalist',
    label: 'Minimalist & Modern',
    keywords:
      'clean geometric construction, generous negative space, flat vector shapes, single-weight strokes, precise symmetry, contemporary sans-serif sensibility',
    mood: 'sıcak, sade, güvenilir',
  },
  {
    id: 'vintage',
    label: 'Vintage & Retro',
    keywords:
      'retro badge, engraved linework, halftone and paper grain texture, muted earthy palette, classic serif lettering, 1970s screen-print feel',
    mood: 'nostaljik, samimi, el yapımı',
  },
  {
    id: 'abstract',
    label: 'Abstract & Geometric',
    keywords:
      'abstract geometric mark, bauhaus primary shapes, overlapping translucent forms, swiss grid composition, strong visual tension',
    mood: 'deneysel, sofistike',
  },
  {
    id: 'luxurious',
    label: 'Luxurious & Elegant',
    keywords:
      'premium monogram crest, gold foil and metallic gradient, fine hairline detailing, symmetrical heraldic emblem, high-end atelier feel',
    mood: 'zarif, premium, seçkin',
  },
  {
    id: 'playful',
    label: 'Playful & Cartoonish',
    keywords:
      'friendly rounded mascot character, bold saturated colours, chunky sticker-style outlines, cheerful proportions',
    mood: 'neşeli, samimi, genç',
  },
  {
    id: 'cyberpunk',
    label: 'Tech & Cyberpunk',
    keywords:
      'neon cyberpunk aesthetic, liquid chrome and holographic shell, glowing edge light, futuristic HUD geometry, high contrast dark background',
    mood: 'geleceğe dönük, enerjik, cesur',
  },
];

export interface LogoTypeDef {
  id: string;
  label: string;
  hint: string;
  instruction: string;
}

export const LOGO_TYPES: LogoTypeDef[] = [
  {
    id: 'combination',
    label: 'Combination Mark',
    hint: 'İkon + yazı',
    instruction: 'a distinctive icon paired with the brand wordmark, balanced lockup',
  },
  {
    id: 'wordmark',
    label: 'Wordmark / Logotype',
    hint: 'Sadece yazı',
    instruction: 'a refined typographic wordmark only, carefully shaped letterforms, no icon',
  },
  {
    id: 'lettermark',
    label: 'Lettermark / Monogram',
    hint: 'Baş harfler',
    instruction: 'an interlocking monogram built from the brand initials inside a geometric container',
  },
  {
    id: 'pictorial',
    label: 'Pictorial Mark / Symbol',
    hint: 'Sembolik',
    instruction: 'a single meaningful pictorial symbol that tells the brand story at a glance',
  },
  {
    id: 'abstract',
    label: 'Abstract Mark',
    hint: 'Soyut',
    instruction: 'an abstract mark that suggests the brand values through pure form and geometry',
  },
  {
    id: 'mascot',
    label: 'Mascot',
    hint: 'Karakter',
    instruction: 'a friendly mascot character with a simple, memorable silhouette',
  },
  {
    id: 'emblem',
    label: 'Emblem',
    hint: 'Arma',
    instruction: 'a contained emblem / crest with a symmetrical badge structure',
  },
];

export interface PaletteDef {
  id: string;
  label: string;
  colors: string[];
  names: string[];
}

export const PALETTES: PaletteDef[] = [
  { id: 'luxury-gold', label: 'Luxury Gold', colors: ['#C9A227', '#F2E3A3', '#1A1A1A', '#0B0D12'], names: ['Altın', 'Açık Altın', 'Kömür', 'Gece'] },
  { id: 'modern-blue', label: 'Modern Blue', colors: ['#2563EB', '#7DD3FC', '#0B1220', '#E0F2FE'], names: ['Lacivert Mavi', 'Gök Mavisi', 'Derin Lacivert', 'Buz Mavisi'] },
  { id: 'tech-purple', label: 'Tech Purple', colors: ['#7C3AED', '#C4B5FD', '#0A0A18', '#EDE9FE'], names: ['Mor', 'Lavanta', 'Gece Moru', 'Soluk Lila'] },
  { id: 'nature-green', label: 'Nature Green', colors: ['#15803D', '#86EFAC', '#0B1A12', '#DCFCE7'], names: ['Orman Yeşili', 'Nane', 'Derin Orman', 'Adaçayı'] },
  { id: 'energetic-red', label: 'Energetic Red', colors: ['#DC2626', '#FCA5A5', '#140B0B', '#FEE2E2'], names: ['Kızıl', 'Pembe', 'Kömür Kırmızı', 'Masti'] },
  { id: 'warm-orange', label: 'Warm Orange', colors: ['#EA580C', '#FDBA74', '#170F0A', '#FFEDD5'], names: ['Turuncu', 'Kayısı', 'Kahve Siyahı', 'Krem'] },
  { id: 'mono', label: 'Black & White', colors: ['#111827', '#F9FAFB', '#6B7280', '#E5E7EB'], names: ['Siyah', 'Beyaz', 'Gri', 'Gümüş'] },
  { id: 'multicolor', label: 'Multicolor', colors: ['#F43F5E', '#F59E0B', '#3B82F6', '#10B981'], names: ['Koral', 'Amber', 'Mavi', 'Zümrüt'] },
];

export interface MockupDef {
  id: string;
  label: string;
  prompt: string;
  aspect: { w: number; h: number };
}

export const MOCKUPS: MockupDef[] = [
  {
    id: 'business-card',
    label: 'Kartvizit',
    aspect: { w: 16, h: 9 },
    prompt:
      'ultra realistic professional business card mockup, the logo printed on premium matte card stock, soft studio lighting, subtle paper texture, top-down angle',
  },
  {
    id: 'tshirt',
    label: 'Merchandise / Tişört',
    aspect: { w: 4, h: 5 },
    prompt:
      'photorealistic premium t-shirt mockup, the logo printed large on the chest, soft fabric folds, neutral studio background, e-commerce product photography',
  },
  {
    id: 'signage',
    label: 'Ofis Tabelası',
    aspect: { w: 16, h: 9 },
    prompt:
      'modern office wall signage mockup, the logo mounted as dimensional letters on a dark wall, architectural lighting, wide interior shot',
  },
  {
    id: 'social',
    label: 'Sosyal Medya Postu',
    aspect: { w: 1, h: 1 },
    prompt:
      'square social media post mockup, the logo centred on a branded background, clean modern feed layout, flat design composition',
  },
  {
    id: 'packaging',
    label: 'Paketleme',
    aspect: { w: 1, h: 1 },
    prompt:
      'premium product packaging mockup, the logo printed on a minimal box, studio product photography, soft gradient background, high detail',
  },
  {
    id: 'icon',
    label: 'App İkonu / Avatar',
    aspect: { w: 1, h: 1 },
    prompt:
      'mobile app icon mockup, the logo inside a rounded square app tile, crisp ui rendering, subtle depth, centred composition',
  },
];

export const FONT_STACKS = [
  { id: 'inter', label: 'Inter / Sans', value: 'Inter, Helvetica Neue, Arial, sans-serif' },
  { id: 'serif', label: 'Editorial Serif', value: 'Playfair Display, Georgia, Times New Roman, serif' },
  { id: 'grotesk', label: 'Grotesk', value: 'Space Grotesk, Helvetica Neue, Arial, sans-serif' },
  { id: 'mono', label: 'Monospace', value: 'IBM Plex Mono, SFMono-Regular, Menlo, monospace' },
];

export function paletteOf(id: string): PaletteDef {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[1];
}
export function styleOf(id: string): StyleDef {
  return STYLES.find((s) => s.id === id) ?? STYLES[0];
}
export function logoTypeOf(id: string): LogoTypeDef {
  return LOGO_TYPES.find((l) => l.id === id) ?? LOGO_TYPES[0];
}

/**
 * Ana görsel üretim prompt'u. Profesyonel brief mantığıyla kurulur:
 * rol, marka bağlamı, tip, stil, palet, kompozisyon, negatif kısıtlar.
 */
export function buildLogoPrompt(brief: BrandBrief, visualNote?: string): string {
  const style = styleOf(brief.style);
  const type = logoTypeOf(brief.logoType);
  const pal = paletteOf(brief.palette);
  const paletteSentence = pal.colors
    .slice(0, 3)
    .map((c, i) => `${c} (${pal.names[i]})`)
    .join(', ');

  const name = brief.companyName?.trim() || 'the brand';
  const sector = brief.sector?.trim();
  const tagline = brief.tagline?.trim();

  const parts = [
    `Design a professional brand logo for "${name}".`,
    sector ? `The brand operates in the ${sector} sector.` : '',
    tagline ? `Brand tagline: "${tagline}".` : '',
    `Logo type: ${type.label} — ${type.instruction}.`,
    `Visual style: ${style.label} — ${style.keywords}.`,
    `Color palette: ${paletteSentence}.`,
    visualNote ? `Visual direction: ${visualNote}.` : '',
    `Composition: single centred mark on a plain flat background, balanced proportions, strong silhouette, readable at small sizes.`,
    `Render as a flat vector-style brand asset, crisp edges, high contrast, no photographic effects.`,
    `Exclude: mockup scenes, business cards, wallpapers, multiple logo variants, watermarks, lorem ipsum text, misspelled brand name, drop shadows, 3D renders, gradients on background.`,
  ];
  return parts.filter(Boolean).join(' ');
}

/** Düzenleme (refine) prompt'u — mevcut görsel üzerinde çalışır. */
export function buildRefinePrompt(brief: BrandBrief, instruction: string): string {
  const style = styleOf(brief.style);
  return [
    `Edit this logo for "${brief.companyName}" keeping its identity, proportions and colour scheme recognisable.`,
    `Requested change: ${instruction}.`,
    `Keep the ${style.label} style (${style.keywords}).`,
    `Return a single flat brand asset on a plain background, same framing as the original.`,
  ].join(' ');
}

export const PROMPT_SUGGESTIONS = [
  'Cyberpunk lobster with neon chrome shell',
  'Ukiyo-e style tsunami inside a floating glass bulb',
  'Minimalist Bauhaus geometry with primary colours',
  'Sacred geometry mandala with bioluminescent veins',
  'Steampunk mechanical heart with copper gears',
  'Brutalist architecture silhouette with glitch effects',
  'Art deco peacock feather in emerald and gold',
  'Origami crane folded from brushed titanium',
];
