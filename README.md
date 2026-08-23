# Non-Obsolescence

Fix it. Don't toss it.

A free, community-built platform for repair and building guides — plus data
on which products are actually worth fixing, and which materials are worth
building with. Started by someone who's been opening up electronics and
building things from scrap timber since he was a kid, and wants that
knowledge to be easy for anyone to find and add to.

**Status: early build.** The site isn't deployed yet — this is active,
local development.

## The three pillars

- **Guides** — step-by-step repair and building guides, each step optionally
  with its own photo, part links, and video links.
- **Fixability data** — repairability info by brand/product category, so
  people can tell which products are actually worth fixing before they buy
  or before they give up on something.
- **Materials reference** — what to build with for durability and
  repairability, for people building or buying furniture and fixtures, not
  just fixing what they already own.

## Why this stack

Fully self-owned and portable, deliberately avoiding lock-in to any single
platform:

- **[Astro](https://astro.build)** static site, styled with **Tailwind
  CSS v4**. Content lives as Markdown files with a typed schema
  ([`src/content.config.ts`](src/content.config.ts)), not in a database.
- **Multi-language**: English, Hebrew, Arabic, Spanish, Portuguese, with
  RTL handled automatically for Hebrew/Arabic. New languages are drafted by
  machine translation and marked `machine` until a human reviews and edits
  them — see [`scripts/translate.mjs`](scripts/translate.mjs).
- **Deploys to Cloudflare Pages** (static hosting + a couple of small
  serverless Functions), not a rented server. Static-first: no database,
  no backend to run, to keep it maintainable by one person.
- **Submissions have no backend of their own** — the on-site `/submit` form
  posts to a Cloudflare Function
  ([`functions/api/submit-guide.js`](functions/api/submit-guide.js)) that
  files a GitHub issue (tagged `pending-review`) and stages any uploaded
  photos into the repo. GitHub doubles as the review queue for free.
- **Reviewing submissions** happens with a local-only tool (not part of the
  public site) — `npm run review:web` for a browser UI pre-filled from the
  submission, or `npm run review` for a terminal version. See
  [`scripts/review-server.mjs`](scripts/review-server.mjs).

## Local development

```sh
npm install
npm run dev              # fast dev server at localhost:4321, content/design work
npm run dev:full          # site + the submission Function together, for testing /submit
npm run build              # production build to ./dist
npm run translate          # generate/update machine-translated draft content
npm run review              # review pending guide submissions (terminal)
npm run review:web          # review pending guide submissions (browser, local-only)
```

`npm run dev:full` and `npm run review`/`review:web` need a GitHub token —
copy [`.dev.vars.example`](.dev.vars.example) to `.dev.vars` (git-ignored)
and fill it in. See that file for the exact permissions needed.

## `Old/`

Two earlier attempts at this project, kept for reference rather than
deleted: a first static HTML/CSS/JS prototype, and a later React app
scaffolded through a no-code AI builder. Neither is part of the active
site — the current build started fresh from `src/`.

## License

MIT

## Contact

Tzur bar-cochva — tzurbar@gmail.com
