// Entry point for Cloudflare's Workers-with-static-assets deployment model
// (what their dashboard now creates by default, folding in what used to be
// a separate "Pages" product). Used both for production (`wrangler deploy`)
// and local testing (`wrangler dev`, via npm run dev:functions), so the
// same code path is exercised in both places. Reuses the submission
// handler from functions/api/submit-guide.js as a plain function - that
// file's Pages-Functions-style export name is no longer load-bearing, it's
// just imported and called directly here.

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
