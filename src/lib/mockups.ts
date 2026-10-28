import { MOCKUPS, paletteOf, type MockupDef } from './catalog';
import { escapeXml } from './utils';

export interface MockupInput {
  scenarioId: string;
  logoDataUrl: string;
  name: string;
  tagline?: string;
  palette: string;
  aspect?: { w: number; h: number };
}

const SCENARIO_BY_ID = (id: string): MockupDef =>
  MOCKUPS.find((m) => m.id === id) ?? MOCKUPS[0];

/**
 * Tamamen client-side, sıfır API çağrısıyla üretilen SVG mockup'lar.
 * Marka kiti ZIP'ine PNG olarak da işlenir.
 */
export function buildInstantMockup(input: MockupInput): { svg: string; width: number; height: number } {
  const sc = SCENARIO_BY_ID(input.scenarioId);
  const pal = paletteOf(input.palette);
  const [c0, c1, c2, c3] = pal.colors;
  const name = input.name || 'BRAND';
  const tagline = input.tagline || '';
  const logo = input.logoDataUrl;

  switch (sc.id) {
    case 'business-card':
      return {
        width: 1600,
        height: 1000,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/></linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-opacity="0.45"/></filter>
  </defs>
  <rect width="1600" height="1000" fill="url(#bg)"/>
  <g filter="url(#shadow)">
    <rect x="150" y="200" width="760" height="440" rx="22" fill="${c3}"/>
    <rect x="150" y="200" width="760" height="440" rx="22" fill="none" stroke="${c0}" stroke-width="2" opacity="0.35"/>
    <image href="${escapeXml(logo)}" x="200" y="235" width="190" height="190" preserveAspectRatio="xMidYMid meet"/>
    <text x="200" y="500" font-family="Inter, Arial, sans-serif" font-size="46" font-weight="700" fill="${c2}" letter-spacing="5">${escapeXml(name.toUpperCase())}</text>
    <text x="200" y="546" font-family="Inter, Arial, sans-serif" font-size="20" fill="${c0}" letter-spacing="3" opacity="0.9">${escapeXml(tagline.toUpperCase())}</text>
    <rect x="200" y="580" width="86" height="4" rx="2" fill="${c0}" opacity="0.65"/>
  </g>
  <g filter="url(#shadow)">
    <rect x="980" y="300" width="470" height="270" rx="18" fill="${c0}"/>
    <image href="${escapeXml(logo)}" x="1020" y="340" width="150" height="150" preserveAspectRatio="xMidYMid meet"/>
    <text x="1020" y="530" font-family="Inter, Arial, sans-serif" font-size="17" fill="${c2}" opacity="0.85">hello@${escapeXml(name.toLowerCase().replace(/\s+/g, ''))}.com</text>
    <text x="1020" y="556" font-family="Inter, Arial, sans-serif" font-size="17" fill="${c2}" opacity="0.85">+90 000 000 00 00</text>
  </g>
</svg>`,
      };

    case 'tshirt':
      return {
        width: 1000,
        height: 1250,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1250" viewBox="0 0 1000 1250">
  <defs><linearGradient id="tee" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#94a3b8"/></linearGradient></defs>
  <rect width="1000" height="1250" fill="#0f172a"/>
  <path d="M340 190 L200 250 L90 400 L230 500 L280 420 L280 1080 L720 1080 L720 420 L770 500 L910 400 L800 250 L660 190 C630 250 370 250 340 190 Z" fill="url(#tee)"/>
  <path d="M340 190 C370 250 630 250 660 190" fill="none" stroke="#cbd5e1" stroke-width="10"/>
  <image href="${escapeXml(logo)}" x="340" y="430" width="320" height="320" preserveAspectRatio="xMidYMid meet"/>
  <text x="500" y="820" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="700" fill="#0f172a" letter-spacing="6">${escapeXml(name.toUpperCase())}</text>
  <text x="500" y="866" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" fill="#475569" letter-spacing="4">${escapeXml(tagline.toUpperCase())}</text>
</svg>`,
      };

    case 'signage':
      return {
        width: 1600,
        height: 900,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1e293b"/><stop offset="100%" stop-color="#0b1220"/></linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="18" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="1600" height="900" fill="url(#wall)"/>
  <rect y="700" width="1600" height="200" fill="#080d18"/>
  <g filter="url(#glow)">
    <image href="${escapeXml(logo)}" x="620" y="220" width="360" height="360" preserveAspectRatio="xMidYMid meet"/>
  </g>
  <text x="800" y="660" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="46" font-weight="700" fill="${c0}" letter-spacing="10">${escapeXml(name.toUpperCase())}</text>
  <text x="800" y="706" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" fill="#94a3b8" letter-spacing="6">${escapeXml(tagline.toUpperCase())}</text>
</svg>`,
      };

    case 'social':
      return {
        width: 1080,
        height: 1080,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c0}"/><stop offset="100%" stop-color="${c1}"/></linearGradient></defs>
  <rect width="1080" height="1080" fill="#0b1220"/>
  <rect x="60" y="60" width="960" height="960" rx="46" fill="url(#g)" opacity="0.16"/>
  <rect x="60" y="60" width="960" height="960" rx="46" fill="none" stroke="${c0}" stroke-width="3" opacity="0.5"/>
  <image href="${escapeXml(logo)}" x="310" y="250" width="460" height="460" preserveAspectRatio="xMidYMid meet"/>
  <text x="540" y="810" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="58" font-weight="700" fill="#f8fafc" letter-spacing="8">${escapeXml(name.toUpperCase())}</text>
  <text x="540" y="870" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" fill="#cbd5e1" letter-spacing="3">${escapeXml(tagline.toUpperCase())}</text>
</svg>`,
      };

    case 'packaging':
      return {
        width: 1080,
        height: 1080,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bgp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#e2e8f0"/></linearGradient>
    <linearGradient id="box" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c3}"/><stop offset="100%" stop-color="${c1}"/></linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="20" stdDeviation="26" flood-opacity="0.28"/></filter>
  </defs>
  <rect width="1080" height="1080" fill="url(#bgp)"/>
  <g filter="url(#sh)">
    <path d="M280 430 L540 320 L800 430 L540 540 Z" fill="${c1}"/>
    <path d="M280 430 L540 540 L540 860 L280 750 Z" fill="${c3}"/>
    <path d="M800 430 L540 540 L540 860 L800 750 Z" fill="${c0}" opacity="0.82"/>
    <image href="${escapeXml(logo)}" x="330" y="470" width="200" height="200" preserveAspectRatio="xMidYMid meet"/>
  </g>
  <text x="540" y="960" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="40" font-weight="700" fill="${c2}" letter-spacing="6">${escapeXml(name.toUpperCase())}</text>
</svg>`,
      };

    case 'icon':
    default:
      return {
        width: 1024,
        height: 1024,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c0}"/><stop offset="100%" stop-color="${c1}"/></linearGradient>
    <filter id="sh2" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="16" stdDeviation="28" flood-opacity="0.35"/></filter>
  </defs>
  <rect width="1024" height="1024" fill="#0b1220"/>
  <g filter="url(#sh2)">
    <rect x="212" y="212" width="600" height="600" rx="140" fill="url(#tile)"/>
  </g>
  <image href="${escapeXml(logo)}" x="300" y="300" width="424" height="424" preserveAspectRatio="xMidYMid meet"/>
</svg>`,
      };
  }
}
