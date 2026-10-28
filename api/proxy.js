/**
 * Vercel serverless function — /api/proxy
 *   GET  /api/proxy/image?prompt=...   -> görsel (ücretsiz backend seçimi sunucuda)
 *   GET  /api/proxy/text?prompt=...    -> metin
 *   POST /api/proxy/image  {prompt, editDataUrl?} -> görsel düzenleme
 *   GET  /api/proxy?url=...            -> ham proxy (eski API)
 */
import { routeRequest } from '../server/proxy-core.js';

async function readBody(req) {
  if (req.method !== 'POST') return null;
  if (typeof req.body === 'string') return req.body;
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body);
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    return res.status(204).end();
  }

  const result = await routeRequest({
    url: req.url,
    method: req.method,
    body: await readBody(req),
    env: process.env,
  });

  res.statusCode = result.status;
  for (const [k, v] of Object.entries(result.headers)) res.setHeader(k, v);
  res.end(result.body);
}
