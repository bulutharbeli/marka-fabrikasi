/**
 * Cloudflare Worker — hem statik siteyi hem /api/proxy ucunu sunar.
 *
 * Deploy:
 *   npx wrangler deploy
 * Anahtar tanımlama:
 *   npx wrangler secret put POLLINATIONS_API_KEY
 */
import { routeRequest } from '../server/proxy-core.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/proxy')) {
      const body = request.method === 'POST' ? await request.text().catch(() => null) : null;
      const result = await routeRequest({
        url: request.url,
        method: request.method,
        body,
        env,
      });
      return new Response(result.body, {
        status: result.status,
        headers: result.headers,
      });
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);

    return new Response('BrandForge Free Worker', {
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  },
};
