// Router for everything under /manager. Not protected by any code here -
// access control is meant to be enforced by Cloudflare Access at the edge,
// in front of this path, so unauthorized requests never reach this Worker
// at all. See README for the Access application setup.

import { routes as submissionRoutes } from './submissions.js';
import { routes as dataRoutes } from './data.js';
import { routes as categoryRoutes } from './categories.js';

function textResponse(text, status = 200) {
  return new Response(text, { status, headers: { 'Content-Type': 'text/plain' } });
}

function htmlResponse(html) {
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
}

async function dispatch(url, request, env) {
  const repo = env.GITHUB_REPO || 'tzurbar/Non-Obsolescence';
  const token = env.GITHUB_TOKEN;
  if (!token) return textResponse('Manager is not configured yet: missing GITHUB_TOKEN.', 500);

  const ctx = { repo, token, env, url, request };
  const path = url.pathname;
  const method = request.method;

  if (method === 'GET' && (path === '/manager' || path === '/manager/')) {
    return htmlResponse(await submissionRoutes.list(ctx));
  }

  let m = path.match(/^\/manager\/submissions\/(\d+)$/);
  if (method === 'GET' && m) return htmlResponse(await submissionRoutes.detail({ ...ctx, number: m[1] }));

  m = path.match(/^\/manager\/submissions\/(\d+)\/approve$/);
  if (method === 'POST' && m) {
    const { redirect } = await submissionRoutes.approve({ ...ctx, number: m[1] });
    return Response.redirect(new URL(redirect, url), 303);
  }

  m = path.match(/^\/manager\/submissions\/(\d+)\/reject$/);
  if (method === 'POST' && m) {
    const { redirect } = await submissionRoutes.reject({ ...ctx, number: m[1] });
    return Response.redirect(new URL(redirect, url), 303);
  }

  if (method === 'GET' && (path === '/manager/data' || path === '/manager/data/')) {
    return htmlResponse(await dataRoutes.list(ctx));
  }

  m = path.match(/^\/manager\/data\/categories\/(guides|fixability|materials)$/);
  if (method === 'GET' && m) return htmlResponse(await categoryRoutes.list({ ...ctx, domain: m[1] }));

  m = path.match(/^\/manager\/data\/categories\/(guides|fixability|materials)\/add$/);
  if (method === 'POST' && m) {
    const { redirect } = await categoryRoutes.add({ ...ctx, domain: m[1] });
    return Response.redirect(new URL(redirect, url), 303);
  }

  m = path.match(/^\/manager\/data\/categories\/(guides|fixability|materials)\/([^/]+)\/delete$/);
  if (method === 'POST' && m) {
    const { redirect } = await categoryRoutes.delete({ ...ctx, domain: m[1], slug: m[2] });
    return Response.redirect(new URL(redirect, url), 303);
  }

  m = path.match(/^\/manager\/data\/(fixability|materials)\/new$/);
  if (method === 'GET' && m) return htmlResponse(await dataRoutes.newForm({ ...ctx, collection: m[1] }));

  m = path.match(/^\/manager\/data\/(fixability|materials)\/([^/]+)\/delete$/);
  if (method === 'POST' && m) {
    const { redirect } = await dataRoutes.delete({ ...ctx, collection: m[1], slug: m[2] });
    return Response.redirect(new URL(redirect, url), 303);
  }

  m = path.match(/^\/manager\/data\/(fixability|materials)\/([^/]+)$/);
  if (method === 'GET' && m) return htmlResponse(await dataRoutes.editForm({ ...ctx, collection: m[1], slug: m[2] }));
  if (method === 'POST' && m) {
    const { redirect } = await dataRoutes.save({ ...ctx, collection: m[1], slugParam: m[2] });
    return Response.redirect(new URL(redirect, url), 303);
  }

  return textResponse('Not found', 404);
}

export async function handleManager(url, request, env) {
  try {
    return await dispatch(url, request, env);
  } catch (err) {
    return textResponse(`Manager error: ${err.message}\n${err.stack || ''}`, 500);
  }
}
