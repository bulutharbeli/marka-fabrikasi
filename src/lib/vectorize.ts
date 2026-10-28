import Imagetracer from 'imagetracerjs';
import { escapeXml } from './utils';

export interface VectorizeOptions {
  colors?: number;
  maxSize?: number;
  detail?: number;
}

/** PNG/JPEG → gerçek SVG yolu (potrace tarzı) */
export async function traceToSvg(src: string, opts: VectorizeOptions = {}): Promise<string> {
  const maxSize = opts.maxSize ?? 512;
  const img = await loadImage(src);
  const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * ratio));
  const h = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const imgd = ctx.getImageData(0, 0, w, h);
  const svg = Imagetracer.imagedataToSVG(imgd, {
    loglevel: 0,
    strokewidth: 0,
    lineart: 1,
    colored: 1,
    numberofcolors: opts.colors ?? 8,
    pathomit: opts.detail ?? 0,
    layeropacity: 1,
    colorquantcycles: 3,
    blur: 0,
    maxwidth: w,
    maxheight: h,
    viewbox: true,
  });
  return svg;
}

/** Vektörleştirme başarısız olursa: görseli SVG içine göm (yine .svg dosyası). */
export function embedAsSvg(src: string, width = 1024, height = 1024): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><image href="${escapeXml(src)}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/></svg>`;
}

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Görsel yüklenemedi'));
    img.src = src;
  });
}

/** SVG'yi normalize eder (viewBox ekler). */
export function normalizeSvg(svg: string): string {
  if (/xmlns=/.test(svg)) return svg;
  return svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
}
