import type { BrandBrief, BrandConcept } from '../../types';
import { logoTypeOf, paletteOf, styleOf } from '../catalog';
import { geminiText } from './gemini';
import { isClassicTextBlocked, pollinationsChat, pollinationsText } from './pollinations';
import { puterChat } from './puter';
import { classifyError, isAbort } from './types';

export interface TextResult {
  text: string;
  provider: string;
}

const PUTER_CHAT_MODELS = ['gemini-3.1-flash-lite', 'gpt-5.4-nano'];

export async function completeText(
  prompt: string,
  opts: {
    geminiApiKey?: string;
    pollinationsApiKey?: string;
    proxyUrl?: string;
    signal?: AbortSignal;
    temperature?: number;
  } = {},
): Promise<TextResult> {
  const errors: string[] = [];

  if (opts.geminiApiKey) {
    try {
      const text = await geminiText(prompt, opts.geminiApiKey, 'gemini-3.1-flash-lite', opts.signal);
      if (text) return { text, provider: 'Gemini (kendi anahtarınız)' };
    } catch (e) {
      if (isAbort(e)) throw e;
      errors.push(`Gemini: ${classifyError(e).message}`);
    }
  }

  for (const model of PUTER_CHAT_MODELS) {
    try {
      const text = await puterChat(prompt, { model, signal: opts.signal });
      if (text) return { text, provider: `Puter · ${model}` };
    } catch (e) {
      if (isAbort(e)) throw e;
      errors.push(`${model}: ${classifyError(e).message}`);
      break; // Puter'e giriş yapılmamışsa diğer model denemeye gerek yok
    }
  }

  if (opts.pollinationsApiKey) {
    try {
      const text = await pollinationsChat(prompt, opts.pollinationsApiKey, undefined, opts.signal);
      if (text) return { text, provider: 'Pollinations API' };
    } catch (e) {
      if (isAbort(e)) throw e;
      errors.push(`Pollinations API: ${classifyError(e).message}`);
    }
  }

  if (!isClassicTextBlocked()) {
    try {
      const text = await pollinationsText(prompt, opts.signal, opts.proxyUrl);
      if (text) return { text, provider: 'Pollinations' };
    } catch (e) {
      if (isAbort(e)) throw e;
      errors.push(`Pollinations: ${classifyError(e).message}`);
    }
  }

  throw new Error(`Metin üretilemedi. ${errors.slice(0, 2).join(' · ')}`);
}

/* ------------------------------ prompt şablonları ----------------------------- */

export function brainstormPrompt(brief: BrandBrief): string {
  const style = styleOf(brief.style);
  const type = logoTypeOf(brief.logoType);
  return [
    `You are a senior brand strategist. Create a brand identity concept for a company called "${brief.companyName || 'New Brand'}".`,
    brief.sector ? `Sector: ${brief.sector}.` : '',
    brief.tagline ? `Current tagline: "${brief.tagline}".` : '',
    `Desired logo type: ${type.label}. Desired style: ${style.label}. Mood: ${style.mood}.`,
    `Answer ONLY with valid JSON (no markdown fences) using this exact shape:`,
    `{"headline":"...","story":"2-3 sentences","nameIdeas":["3 alternative names"],"taglines":["3 tagline options"],"keywords":["6 visual keywords"],"visualDirection":"1-2 sentences describing the ideal logo"}`,
    `Write the story in Turkish. Keep it specific to this company, not generic branding advice.`,
  ]
    .filter(Boolean)
    .join(' ');
}

export function enhancePrompt(visual: string, brief: BrandBrief): string {
  const style = styleOf(brief.style);
  const pal = paletteOf(brief.palette);
  return [
    `Improve the following logo visual description so it produces a professional brand asset.`,
    `Original idea: "${visual}".`,
    `Brand: "${brief.companyName}"${brief.sector ? ` (${brief.sector})` : ''}.`,
    `Style: ${style.label} (${style.keywords}).`,
    `Palette: ${pal.colors.slice(0, 3).join(', ')}.`,
    `Return ONLY the improved description as a single paragraph, maximum 90 words. No preamble, no quotes, no list.`,
  ].join(' ');
}

/* --------------------------- yerel (offline) üretim --------------------------- */

const NAME_PARTS = ['Nova', 'Astra', 'Verde', 'Lumen', 'Orbit', 'Kite', 'Ember', 'Atlas', 'Vela', 'Sable', 'Onda', 'Zephyr'];
const SUFFIX = ['Labs', 'Studio', 'Works', 'Collective', 'Group', 'House', 'Bros', 'Company', 'Atelier'];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export function localBrainstorm(brief: BrandBrief, seed = Date.now()): BrandConcept {
  const name = brief.companyName?.trim() || 'Nova';
  const sector = brief.sector?.trim() || 'modern marka';
  const style = styleOf(brief.style);
  const type = logoTypeOf(brief.logoType);
  const s = seed % 9973;

  const nameIdeas = Array.from({ length: 3 }, (_, i) =>
    `${pick(NAME_PARTS, s + i * 7)}${sector.toLowerCase().includes('tech') ? '' : ''} ${pick(SUFFIX, s + i * 3)}`,
  );

  const taglines = [
    `${name} ile ${sector} dünyasında yeni bir standart.`,
    `Tasarımda netlik, üretimde güven.`,
    `${name}: küçük detaylarda büyük fark.`,
  ];

  const keywords = [
    style.label.toLowerCase(),
    type.label.toLowerCase(),
    'vektör',
    'ölçeklenebilir',
    'akılda kalıcı',
    'güven',
  ];

  return {
    headline: `${name} için ${style.label.toLowerCase()} bir marka yönü`,
    story: `${name}, ${sector} alanında ${style.mood} bir iz bırakmak istiyor. Markanın görsel dili ${style.label} ekseninde kuruluyor: sade formlar, güçlü siluet ve tek bir akılda kalıcı detay. Logo, küçük boyutta da okunabilen bir ${type.label.toLowerCase()} olarak tasarlanacak.`,
    nameIdeas,
    taglines,
    keywords,
    visualDirection: `Tek renk ağırlıklı, güçlü siluetli ve ${style.label.toLowerCase()} özelliklerini taşıyan ${type.label.toLowerCase()}; marka adını sade bir tipografiyle birlikte dengeleyen bir işaret.`,
  };
}

const ENHANCE_TEMPLATES = [
  (v: string, style: string, pal: string) =>
    `${v}. ${style} dilinde, tek bir güçlü siluete indirgenmiş, düz vektör marka varlığı; ${pal} paleti, dengeli kompozisyon, küçük boyutta okunabilir ayrıntı, saf beyaz zemin üzerinde.`,
  (v: string, style: string, pal: string) =>
    `Logo fikri: ${v}. Görsel dil ${style}; ${pal} renkleri; minimal geometrik yapı, eşitlik ve ritim vurgulanmış, gölgesiz, ölçeklenebilir, profesyonel marka dosyasına hazır.`,
  (v: string, style: string, pal: string) =>
    `${v} fikri üzerine kurulmuş ${style} bir işaret: ${pal} paleti, belirgin bir ana form, destekleyen ikincil form, dengeli tipografi ve marka adının doğru yazımı.`,
];

export function localEnhance(visual: string, brief: BrandBrief, seed = Date.now()): string {
  const style = styleOf(brief.style).label;
  const pal = paletteOf(brief.palette).colors.slice(0, 3).join(', ');
  const base = visual.trim() || 'Marka için soyut, geometrik ve akılda kalıcı bir işaret';
  return pick(ENHANCE_TEMPLATES, seed)(base, style, pal);
}

/** LLM'den gelen JSON metnini BrandConcept'e çevirir; bozuksa yerel üretime düşer. */
export function parseConcept(text: string, brief: BrandBrief, seed = Date.now()): BrandConcept {
  const fallback = localBrainstorm(brief, seed);
  if (!text) return fallback;
  const match = /\{[\s\S]*\}/.exec(text);
  if (!match) return { ...fallback, story: text.trim() };
  try {
    const raw = JSON.parse(match[0]);
    return {
      headline: String(raw.headline ?? fallback.headline),
      story: String(raw.story ?? fallback.story),
      nameIdeas: Array.isArray(raw.nameIdeas) ? raw.nameIdeas.map(String) : fallback.nameIdeas,
      taglines: Array.isArray(raw.taglines) ? raw.taglines.map(String) : fallback.taglines,
      keywords: Array.isArray(raw.keywords) ? raw.keywords.map(String) : fallback.keywords,
      visualDirection: String(raw.visualDirection ?? fallback.visualDirection),
    };
  } catch {
    return { ...fallback, story: text.trim() };
  }
}
