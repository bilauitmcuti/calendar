# Cloud Agent Onboarding

Instructions for AI agents and cloud deployment tooling.

## Setup (minimal, idempotent)

```bash
pnpm install
```

## Required Environment

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` — required for Turnstile on feedback in production. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in **Pages build environment** (inlined into the client bundle), or `TURNSTILE_SITE_KEY` at runtime (client loads via `GET /api/turnstile/config`).

## Optional Environment

- `DISCORD_WEBHOOK_RATE_FEEDBACK` — optional server-only webhook for star rating and feedback form. Do not use `NEXT_PUBLIC_*` or commit URLs.
- `CALENDAR_API_BASE` — optional server-only override for the calendar API origin (default `https://api.bilauitmcuti.com`). Do not use `NEXT_PUBLIC_*` for this: the upstream URL must not be embedded in client bundles.

**Browser vs server:** The calendar UI calls **`/api/v1/meta`** and **`/api/v1/calendar`** (same origin); legacy **`/api/calendar-proxy/v1/...`** still works. CSP `connect-src` allows `'self'` only for calendar traffic (not the upstream host). The proxy allowlists those paths and forwards to `CALENDAR_API_BASE`.

**Chat:** The AI chat assistant lives in a **separate app** at `/chat` (same base URL). This calendar repo only hard-navigates to `/chat`; it does not ship Workers AI, chat API routes, or chat UI.

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm install` | Install dependencies |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript check |
| `pnpm build` | Next.js production build only (`next build`) |
| `pnpm build:pages` | Cloudflare Pages bundle via `@cloudflare/next-on-pages` → `.vercel/output/` |
| `pnpm dev` | Next.js dev server (`setupDevPlatform` from wrangler; run `npx wrangler login` if edge-preview auth fails) |
| `pnpm preview` | Build for Pages + `wrangler pages dev` locally |
| `pnpm pages:dev` | Preview last Pages build locally (requires `build:pages` first) |

**`pnpm dev` lock error:** If startup fails with `Unable to acquire lock at .next/dev/lock`, another `next dev` is running or a stale lock was left behind. Check port 3000, stop the other process, or delete `.next/dev/lock` when nothing is listening on 3000, then rerun `pnpm dev`. Prefer `pnpm dev` over `npm run dev` (this repo uses pnpm).

## CI

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm run build:pages`

## Health & Readiness

- `GET /api/health` — returns `{ status, timestamp }` with 200 when the calendar app is up.
- `GET /api/version` — returns build ID.

## Cloudflare Pages deployment

Dashboard settings (must match):

| Setting | Value |
|---------|--------|
| Build command | `npx @cloudflare/next-on-pages@1` or `pnpm run build:pages` |
| Build output directory | `.vercel/output/static` |
| `NODE_VERSION` | `20` (or ≥18) |

**Functions compatibility:** In Pages project **Settings → Functions**, enable **`nodejs_compat`** for production and preview; compatibility date ≥ `2022-11-30`.

All dynamic routes must export `export const runtime = 'edge'`. Restore with `node scripts/add-edge-runtime.mjs` if missing.

`wrangler.jsonc` sets `pages_build_output_dir` for Pages + local `wrangler pages dev`. See `.cursor/rules/cloudflare-pages-deploy.mdc`.

**Do not add `account_id` to `wrangler.jsonc`.** Pages rejects it at deploy (`Configuration file for Pages projects does not support "account_id"`). The Pages project already belongs to one Cloudflare account. Local `pnpm dev` / `setupDevPlatform` needs `npx wrangler login` when OAuth is stale (`Authentication error [code: 10000]`) — re-login fixes that; hardcoding `account_id` does not and must not be committed.

## Production CSS / JS broken (recurring — custom domain only)

**Symptom:** `bilauitmcuti.com` looks unstyled (SEO `sr-only` blocks and program links visible as a bullet list; calendar days stack vertically) and/or console shows MIME errors like `Refused to execute script... MIME type ('text/plain')` / stylesheets refused. **Preview (`*.pages.dev`) is fine.** Hard refresh may show SSR content but clicks still fail if JS is blocked.

This keeps coming back when zone config steals or caches bad `/_next/static` responses. Treat it as an **edge/config** issue first, not a React layout bug.

### Root causes (check in this order)

1. **Zone Workers route on `/_next/*` (most common)**  
   A route such as `bilauitmcuti.com/_next/*` → another Worker (e.g. `find-my-internship`) intercepts Next chunks meant for this Pages app. The Worker returns HTML/`text/plain` instead of real CSS/JS. With `X-Content-Type-Options: nosniff` ([`lib/security-headers.mjs`](lib/security-headers.mjs) / [`public/_headers`](public/_headers)), the browser refuses the assets → CSS broken + dead JS.  
   **Fix:** Workers → zone `bilauitmcuti.com` → **Triggers / Routes** — **delete** any `bilauitmcuti.com/_next/*` (or `/_next/static/*`) route. Keep internship on `app.bilauitmcuti.com/*` and path routes (`/internship*`, `/post*`, …) only — **never** apex `/_next/*`.

2. **Stale edge cache of 404 / wrong body (Cache Rules)**  
   Zone rules below cache `/_next/static/` for **1 year** and `.js`/other extensions for **7 days**. If a chunk is requested before the new deployment is live on the custom domain, Cloudflare can cache a **404 `text/plain`** (or wrong Worker body) as if it were the asset. Preview never hits these zone rules the same way.  
   **Fix:** Caching → **Purge Cache** for `bilauitmcuti.com` (everything, or at least `/_next/static/*`). After purge, confirm chunks return **200** + `Content-Type: text/css` / `application/javascript`.

3. **Do not “fix” with `assetPrefix: '/calendar-static'`**  
   That only hid the Workers-route conflict and broke when HTML pointed at `/calendar-static/_next/...` without a matching rewrite. Serve assets from **`/_next/static` only** — no `assetPrefix`, no `/calendar-static` in [`next.config.mjs`](next.config.mjs) or [`public/_headers`](public/_headers).

4. **Service worker**  
   [`public/sw.js`](public/sw.js) must **not** intercept `/_next/static/` (bypass so the edge MIME type wins). After a bad cache episode, users may need one hard refresh or to unregister the SW.

### Quick diagnose

```text
# HTML should reference /_next/static/... (not /calendar-static/...)
curl -sI "https://bilauitmcuti.com/_next/static/chunks/<hash>.css"
# Expect: 200, content-type: text/css

curl -sI "https://bilauitmcuti.com/_next/static/chunks/<hash>.js"
# Expect: 200, content-type: application/javascript (or equivalent)

# Compare the same URLs on the current production deploy host (*.bilauitmcuti.pages.dev).
# If pages.dev is OK and apex is not → Workers route or zone cache on bilauitmcuti.com.
```

Dashboard: **Workers → Routes** (no apex `/_next/*`) and **Caching → Cache Rules** (rules below only; no `/calendar-static`).

## Cloudflare WAF (zone, Free plan)

Configure in the dashboard for zone `bilauitmcuti.com`. Docs: [Deploy managed ruleset](https://developers.cloudflare.com/waf/managed-rules/deploy-zone-dashboard/), [Managed rules availability](https://developers.cloudflare.com/waf/managed-rules/).

1. **Security → WAF → Managed rules** — deploy **Cloudflare Free Managed Ruleset**.
2. **Security → WAF → Custom rules** — block Next.js middleware bypass ([CVE-2025-29927](https://developers.cloudflare.com/changelog/product/workers/7/)):
   - Expression: `http.request.headers["x-middleware-subrequest"] exists`
   - Action: **Block**

Turnstile remains in place for feedback.

## Cloudflare Cache Rules (zone)

Docs: [Cache Rules settings](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/). Existing [`public/_headers`](public/_headers) sets `/_next/static/*` to 1 year immutable; zone rules reinforce and extend caching. Do **not** add rules or `_headers` entries for `/calendar-static/` — that prefix is not used.

**Warning:** Long TTL on `/_next/static/` means a bad response (404 `text/plain`, or a body from a mistaken Workers route) can stick on **production only** and look like “CSS/JS randomly broken after deploy.” See **Production CSS / JS broken** above — purge before debugging app code.

Create in **Caching → Cache Rules** (order matters — most specific first):

| # | Name | Expression | Action |
|---|------|------------|--------|
| 1 | `bypass_dynamic` | `(http.request.uri.path starts_with "/api/")` | **Bypass cache** |
| 2 | `cache_next_static` | `(http.request.uri.path starts_with "/_next/static/")` | Eligible for cache, edge TTL **override 1 year** |
| 3 | `cache_public_assets` | `(http.request.uri.path.extension in {"ico" "png" "webp" "json" "js" "woff" "woff2"})` | Eligible for cache, edge TTL **7 days** |
| 4 | `cache_sw_short` | `(http.request.uri.path eq "/sw.js")` | Eligible for cache, edge TTL **5 minutes** |

After a deploy that changes static asset hashes, or after removing a bad Workers route, **Purge Cache** for `bilauitmcuti.com` (or at least `/_next/static/*`) so the custom domain does not keep stale edge responses that preview (`*.pages.dev`) never saw.

## Cloudflare Zaraz + Google Analytics 4

Analytics uses **GA4** (`G-D94Q17TQ22`) delivered through **Cloudflare Zaraz** on the edge — no `gtag.js` in the app bundle. Zaraz auto-injects on proxied `bilauitmcuti.com` traffic.

```
Browser → Zaraz (Cloudflare edge) → Google Analytics 4
```

### Dashboard setup (one-time)

1. Cloudflare dashboard → **Tag setup** (Zaraz) for zone `bilauitmcuti.com`.
2. **Third-party tools** → Add **Google Analytics 4** → Measurement ID `G-D94Q17TQ22` (see `GA_MEASUREMENT_ID` in [`lib/zaraz.ts`](lib/zaraz.ts)).
3. On the GA4 tool, enable automatic actions:
   - **Pageviews** — first page load (and `Pageview` events from [`components/zaraz-page-view.tsx`](components/zaraz-page-view.tsx) on Next.js client navigations).
   - **Events** — forwards all `zaraz.track()` calls (including custom events below) to GA4.
4. **Settings** → leave **Single Page Application support** **off** (the app sends virtual pageviews via `ZarazPageView` instead, to avoid double-counting).
5. Publish Zaraz config. Verify with [Debug mode](https://developers.cloudflare.com/zaraz/web-api/debug-mode/) on production.

### Custom events (app → Zaraz → GA4)

Client code uses [`lib/zaraz.ts`](lib/zaraz.ts) (`trackZarazEvent`, `ZARAZ_EVENTS`). Events are no-ops when Zaraz is absent (local `pnpm dev` without Cloudflare proxy).

| `ZARAZ_EVENTS` key | GA4 event name | When |
|---------------------|----------------|------|
| `pageview` | `Pageview` | Next.js client route change |
| `engagementPromptShown` | `engagement_prompt_shown` | Engagement prompt opens |
| `engagementRating` | `engagement_rating` | Star rating submitted |
| `engagementShare` | `engagement_share` | Share/copy link from prompt |
| `engagementFeedbackClick` | `engagement_feedback_click` | User taps “Send feedback” in prompt |
| `selectProgram` | `select_program` | User selects a program |
| `selectSession` | `select_session` | User toggles a session |
| `viewCalendarDate` | `view_calendar_date` | User opens a calendar day (drawer) |
| `navigateCalendarDay` | `navigate_calendar_day` | User moves to prev/next day in drawer |
| `changeViewMode` | `change_view_mode` | User switches grid ↔ list |
| `toggleCalendarFilter` | `toggle_calendar_filter` | User toggles an activity filter |
| `openSettings` | `open_settings` | User opens settings popover |
| `openChat` | `open_chat` | User taps Chat |
| `openDownload` | `open_download` | User opens Download (settings or PWA hint) |
| `openFeedback` | `open_feedback` | User opens Feedback (settings or engagement prompt) |
| `copyShareLink` | `copy_share_link` | User copies share link on Download page |

With **Events** automatic action enabled on the GA4 tool, these appear in GA4 without extra trigger configuration.

**GA4 custom dimensions** (Admin → Custom definitions): register event-scoped dimensions for `program`, `program_group`, `calendar_session_id`, `calendar_session_ids`, `date`, `view`, `filter_key`, `source`, `action`, `from`, `to`, `direction`, `path` so Explorations can report top programs, sessions, and dates. Do not use `session_id` — GA4 reserves that name.

## Known Limitations

- In-app rate limiting ([`lib/rate-limit.ts`](lib/rate-limit.ts)) applies to contact, engagement, and feedback routes.
- `@cloudflare/next-on-pages` is deprecated in favor of OpenNext; this project intentionally uses next-on-pages for Cloudflare Pages Git deploys.
- Middleware deprecation warning: Next.js 16 recommends "proxy" over "middleware" — non-blocking.
- Custom-domain static assets share the zone with other Workers (`find-my-internship` on `app.bilauitmcuti.com` and selected apex paths). Re-adding `bilauitmcuti.com/_next/*` as a Workers route will break this site’s CSS/JS again — see **Production CSS / JS broken**.
