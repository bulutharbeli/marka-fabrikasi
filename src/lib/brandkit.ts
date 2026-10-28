import { APP_NAME } from './appName';
import JSZip from 'jszip';
import type { BrandConcept } from '../types';
import { PALETTES, paletteOf, styleOf, logoTypeOf } from './catalog';
import { dataUrlToBytes, slugify } from './utils';

export interface BrandKitInput {
  companyName: string;
  tagline: string;
  sector: string;
  concept?: BrandConcept | null;
  logoPng?: string | null;
  logoSvg?: string | null;
  logoSvgFileName?: string;
  mockups: { label: string; dataUrl: string }[];
  palette: string;
  style: string;
  logoType: string;
  prompt?: string;
}

export async function buildBrandKit(input: BrandKitInput): Promise<Blob> {
  const zip = new JSZip();
  const base = slugify(input.companyName || 'brand');
  const folder = zip.folder(`${base}-brand-kit`)!;
  const pal = paletteOf(input.palette);

  if (input.logoPng) {
    folder.file('logo.png', dataUrlToBytes(input.logoPng));
  }
  if (input.logoSvg) {
    folder.file(input.logoSvgFileName ?? 'logo.svg', input.logoSvg);
  }

  const mockupFolder = folder.folder('mockups')!;
  input.mockups.forEach((m, i) => {
    if (!m.dataUrl) return;
    mockupFolder.file(`${slugify(m.label)}-${i + 1}.png`, dataUrlToBytes(m.dataUrl));
  });

  const guide = [
    `# ${input.companyName || 'Brand'} — Marka Kiti`,
    '',
    `**Slogan:** ${input.tagline || '—'}`,
    `**Sektör:** ${input.sector || '—'}`,
    `**Logo tipi:** ${logoTypeOf(input.logoType).label}`,
    `**Görsel dil:** ${styleOf(input.style).label}`,
    `**Üretim promptu:**`,
    '',
    '```',
    input.prompt ?? '—',
    '```',
    '',
    '## Renk Paleti',
    '',
    '| Renk | HEX | Kullanım |',
    '| --- | --- | --- |',
    ...pal.colors.map((c, i) => `| ${pal.names[i]} | \`${c}\` | %${i === 0 ? 60 : i === 1 ? 25 : 15} |`),
    '',
    '## Tipografi',
    '',
    '- Başlık: Inter / Helvetica Neue',
    '- Gövde: Inter / system-ui',
    '',
  ].join('\n');
  folder.file('brand-guide.md', guide);

  if (input.concept) {
    folder.file(
      'concept.md',
      [
        `# ${input.concept.headline}`,
        '',
        input.concept.story,
        '',
        '## Alternatif isimler',
        ...input.concept.nameIdeas.map((n) => `- ${n}`),
        '',
        '## Slogan önerileri',
        ...input.concept.taglines.map((t) => `- ${t}`),
        '',
        '## Anahtar kelimeler',
        input.concept.keywords.join(', '),
        '',
        '## Görsel yön',
        input.concept.visualDirection,
      ].join('\n'),
    );
  }

  folder.file(
    'README.txt',
    [
      `${input.companyName || 'Brand'} — Brand Kit`,
      '',
      'Klasör yapısı:',
      '  logo.png / logo.svg  → ana logo dosyaları',
      '  mockups/             → uygulama örnekleri',
      '  brand-guide.md       → renk paleti ve tipografi',
      '  concept.md           → marka konsepti',
      '',
      `Bu kit ${APP_NAME} ile üretildi (tamamen ücretsiz, limitsiz sağlayıcı zinciri).`,
    ].join('\n'),
  );

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

export function allPalettes() {
  return PALETTES;
}
