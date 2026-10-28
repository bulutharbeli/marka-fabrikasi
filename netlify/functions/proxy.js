/**
 * Netlify Function — /.netlify/functions/proxy
 * netlify.toml içindeki redirect ile /api/proxy/* adresine bağlanır.
 */
import { routeRequest } from '../../server/proxy-core.js';

/** Netlify v1 event'inde sorgu dizesi `queryStringParameters` içindedir; `path` sorgu içermez. */
function buildUrl(event) {
  const qs = new URLSearchParams(event.queryStringParameters || {}).toString();
  if (event.rawUrl) return event.rawUrl;
  const base = event.path || '/.netlify/functions/proxy';
  return qs ? `${base}?${qs}` : base;
}

export async function handler(event) {
  const result = await routeRequest({
    url: buildUrl(event),
    method: event.httpMethod || 'GET',
    body: event.body || null,
    env: process.env,
  });

  const isBinary = !String(result.headers['content-type'] || '').includes('json') &&
    !String(result.headers['content-type'] || '').startsWith('text/');

  return {
    statusCode: result.status,
    headers: result.headers,
    body: isBinary ? Buffer.from(result.body).toString('base64') : result.body,
    isBase64Encoded: isBinary,
  };
}
