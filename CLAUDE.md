# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The Holidaybank Expeditions public website plus the `/admin` dashboard, as one Next.js 15 app (App Router, React 19, Tailwind CSS v4, TypeScript). There is no database here. All content and auth come from the Django API in the sibling repo **holidaybank-api** (`../holidaybank-api`), which is expected on `http://localhost:8000` in dev. Many cross-repo contracts, listed below, must be kept in step with that repo.

## Commands

```bash
npm install
cp .env.example .env.local
npm run dev                                  # http://localhost:3000
npm run lint && npx tsc --noEmit && npm run build   # what CI runs (.github/workflows/ci.yml)
```

Node 20 (`.nvmrc`). There is no test suite. `npm run build` has to pass without a running API. Public pages rely on the `*Safe` fetch helpers to fall back to empty states, so don't add a public read that throws when the API is down.

## Architecture

**Route groups.** `src/app/(public)/` holds the marketing site: server components that fetch at render time. `src/app/admin/` holds the dashboard, which is mostly `'use client'` pages. `src/app/api/revalidate/route.ts` is the only route handler.

**Two API clients. Pick by where the code runs:**
- `src/lib/api.ts` is used by server components and public reads. `apiGet`/`apiList` throw `ApiRequestError`. `apiGetSafe`/`apiListSafe` log the error and return a fallback. On the server it uses `API_INTERNAL_URL` if that is set, otherwise `NEXT_PUBLIC_API_URL`.
- `src/lib/adminApi.ts` is used by client-side admin pages. It always sends `credentials: 'include'` and `no-store`. Any 401 redirects to `/admin/login?from=…`, except on `post(..., { signingIn: true })` (the login form). It also provides the bulk endpoints (`bulkStatus`/`bulkRemove` at `/api/admin/<resource>/bulk…`) and `upload`.
- Both expect the API envelope `{ success, data, meta?, error?: { message, code, details } }`.

**Caching and revalidation (Next 15 semantics).** Next 15 doesn't cache `fetch` by default, so every public read goes through `request()`, which sets `next: { revalidate: DEFAULT_REVALIDATE (300s), tags }`. Pass `revalidate: false` for no-store. After any admin write, the Django API POSTs `{ tags: [...] }` to `/api/revalidate` with header `x-revalidate-secret` (`REVALIDATE_SECRET`, which must match the API's). The tag vocabulary in `src/lib/tags.ts` has to match the `tags` callbacks in the API's `apps/{catalog,content}/resources.py`. When you add a public fetch, tag it with the right `TAGS.*` or admin edits won't show up until the 300s window expires. `revalidateTag` takes one argument here. `updateTag`/`cacheLife` are Next 16 APIs and will throw.

**Auth.** The API sets an httpOnly JWT cookie, `hb_admin_token`. `src/middleware.ts` only checks that the cookie exists, for `/admin/:path*`. The web app never verifies the JWT. `getCurrentAdmin()` (`src/lib/auth.ts`) forwards the cookie to `/api/auth/me`. Permissions are strings resolved by the API. Gate UI with `can(admin, 'perm', ...)`, not with the legacy `role` field.

**Site and API on different domains.** `next.config.ts` rewrites `/backend/*` to `API_INTERNAL_URL`. If the site and API share no parent domain, set `NEXT_PUBLIC_API_URL=https://<site>/backend` so the cookie belongs to the site's origin. `next.config.ts` also derives the `images.remotePatterns` for `/uploads/**` from both API URLs. Admin-uploaded images won't render in `<Image>` unless the API host appears there.

**Content is API-driven, with fallbacks.**
- `getSettings()` (`src/lib/settings.ts`) merges the live `/api/settings` over a hardcoded `FALLBACK`, which mirrors the API's `apps/content/defaults.py`. When a settings section is added, update the `SiteSettings` type and `FALLBACK` together.
- The category tree (`getCategories()` in `src/lib/catalog.ts`) drives the footer, the tour filters and, by default, the header menu. Don't hardcode product lines.
- The header menu is `settings.navigation`, arranged at `/admin/settings/navigation`. An empty list means automatic: `defaultNavigation(categories)` in `src/lib/navigation.ts` builds it from the category tree.
  - A top-level item with a `source` (category, area or destination slug) is linked. Its route and dropdown, and its title when the label is blank, are resolved from the live catalogue by `resolveItem()`/`toHeaderNav()` at render time, so it follows renames.
  - The public layout only fetches areas and destinations when the menu links to them.
- Travel areas (`getAreas()`, `/api/areas`) are a regional tree (Kenyan > Diani, Europe > France…) separate from categories; a tour can be in several. The "kenyan" group's areas are the homepage's Kenyan Packages portrait cards (`KenyanAreasGrid`), and `/tours?area=` filters by them.
- Types for API payloads live in `src/types/index.ts`. Records use `_id`.

**Admin list-page pattern** (see `src/app/admin/tours/page.tsx`): list state (page/q/sort/status) lives in the URL via `useListParams`, and defaults are left out of the query string. Pages use `DataTable` + `ListToolbar` + `Pagination` + `BulkBar`, `useConfirm` for destructive actions, and `useToast` with Undo for status changes. Because `useSearchParams` is used, the page's default export wraps the view in `<Suspense>`.

**No `loading.tsx` above a `[slug]` route.** A loading boundary streams a 200 before the page can call `notFound()`, so missing tours, destinations and posts would answer 200 (a soft 404). Listing pages put their skeletons in a `<Suspense>` inside `page.tsx` instead. The detail pages also call `notFound()` from `generateMetadata`. Check with `curl -I http://localhost:3000/tours/nope`.

**Next 15 specifics used throughout:** `searchParams`/`params` are Promises and must be awaited, and `cookies()` is async.

**Styling.** Tailwind v4 with the theme tokens (`cream`, `charcoal`, `gold`, `leaf`, `maroon`…) and utilities such as `container-page` defined in `src/app/globals.css` under `@theme`. There is no `tailwind.config`.

**Images.** `public/images/` photos are registered in the API's media library (`ImageAsset`) with credits. Content refers to those records rather than embedding URLs. See `public/images/CREDITS.md`. The logo variants are in `public/brand/`.

The admin area is deliberately `noindex`, disallowed in `robots.ts`, and not linked from the public site. Keep it that way.
