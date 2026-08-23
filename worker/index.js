// Entry point for Cloudflare's Workers-with-static-assets deployment model
// (what their dashboard now creates by default, folding in what used to be
// a separate "Pages" product). Reuses the exact same submission handler
// from functions/api/submit-guide.js - that file also still works locally
// via `wrangler pages dev`, which uses the older Pages Functions convention
// independently of this file.

import { onRequestPost as submitGuide } from '../functions/api/submit-guide.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/submit-guide' && request.method === 'POST') {
      return submitGuide({ request, env, ctx });
    }
    return env.ASSETS.fetch(request);
  }
};
