# PawGle Frontend

Next.js + React frontend for [PawGle](https://pawgle.neokit.app) — a community platform for reuniting lost pets with their owners through AI-powered image recognition, geographic alerts, and in-app chat.

**Live site:** `https://pawgle.neokit.app`
**Backend API:** `https://pawglebackend.neokit.app` ([WhoamiI00/PawGleBackend](https://github.com/WhoamiI00/PawGleBackend))

---

## What you can do

- Register your pets and download a printable QR collar tag.
- Search by photo to identify a pet you've found.
- File lost/found reports with a geo-tagged location and photo.
- Get **auto-matched** when someone files a found report that looks like your missing pet — chat opens automatically in-app.
- Subscribe to nearby alerts ("ping me if a pet is reported within 5 km of my home").
- Chat with finders / owners inside the app (text + photos) — email is only a "you've got a new message, click to view" pager.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) + React 18 |
| Styling | Tailwind CSS 3 + CSS variables for light/dark themes |
| UI primitives | shadcn/ui (Radix) + lucide-react |
| Animation | Framer Motion |
| Maps | Leaflet + React Google Maps API |
| Image tooling | Fabric.js + imgly background removal |
| Auth | JWT access token (in memory) + httpOnly refresh cookie |
| Error tracking | [Sentry](https://sentry.io) (Next.js SDK) |
| Host | Cloudflare Pages (edge runtime for dynamic routes) |

---

## Architecture

```
┌──────────────────────────────────────────────┐
│            Cloudflare Pages (edge)           │
│                                              │
│   ○ Static pages: /, /login, /chat, /alerts, │
│     /user, /pet/map, ...                     │
│   ƒ Dynamic edge: /chat/[id], /found/[id]    │
└──────────────────┬───────────────────────────┘
                   │  fetch(withCredentials)
                   ▼
        ┌─────────────────────────┐
        │  pawglebackend.neokit.  │
        │       app (Django)      │
        └─────────────────────────┘
```

Both domains share the eTLD+1 `neokit.app`, so the refresh cookie is scoped to `.neokit.app` with `SameSite=Lax` — no third-party-cookie issues.

---

## Local development

### 1. Clone + install

```bash
git clone https://github.com/WhoamiI00/PawGleFrontend.git
cd PawGleFrontend
npm install
```

### 2. Configure `.env.local`

```env
# Backend API base. The trailing slash is auto-normalized in code, but
# it's good practice to include it.
NEXT_PUBLIC_BACKEND_API_PORT=http://localhost:8000/

# Google OAuth client (must match the backend's GOOGLE_OAUTH_CLIENT_ID).
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...

# Sentry (optional — leave unset to disable).
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
# Build-time only — for source-map upload to Sentry.
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

### 3. Run

```bash
npm run dev                # http://localhost:3000
```

For a production-shaped build / sanity check:

```bash
npm run build
npm start
```

---

## Project layout

```
app/
  layout.js                 — root layout (navbar, footer)
  page.js                   — landing page
  api/
    api.js                  — axios instance with auto-refresh interceptor
    auth.js                 — in-memory access token store + bootstrap helper
  login/page.js             — email + password / Google sign-in
  auth/magic/page.js        — passwordless magic-link sign-in
  user/page.js              — profile + pets + onboarding checklist
  user/edit/, user/update/  — add / edit a pet (multi-photo)
  user/search/page.js       — image similarity search
  pet/map/page.js           — Leaflet map of lost/found reports (mobile FAB,
                              bottom-sheet detail)
  pet/report/page.js        — file a lost/found report
  chat/page.js              — conversation list
  chat/[id]/page.js         — message thread (polling)
  alerts/page.js            — manage nearby-pet alert subscriptions
  found/[animalId]/page.js  — public landing for scanned QR tags
  dashboard/, lost/, fun/   — extra pages
components/
  navbar.js                 — top nav + notifications + chat unread badge
  footer.js
  Map.js                    — Leaflet wrapper
  ImageDropzone.js          — shared drag-drop + camera + paste upload
  ...
sentry.client.config.js     — Sentry init for browser
sentry.server.config.js     — Sentry init for Node runtime
sentry.edge.config.js       — Sentry init for Edge runtime
next.config.mjs             — image hosts + optional Sentry wrap
```

---

## How auth works (short version)

1. **Login** mints a short-lived **access token** (15 min) returned in the response body — kept in memory only, never in localStorage.
2. The backend also sets a **refresh token** as an httpOnly cookie scoped to `.neokit.app`, so JavaScript can never read it.
3. Every API call goes through `app/api/api.js` (axios) which attaches the access token to the `Authorization` header.
4. On a 401 the response interceptor calls `/api/token/refresh/` (the cookie rides along) and retries the original request with the fresh access token.
5. On page reload the in-memory access token is gone; each page calls `bootstrapAccessToken()` on mount which transparently re-mints one from the cookie.

This means an XSS payload can't steal anyone's session — there's no token in storage to grab.

---

## Key UI patterns

- **Mobile-first map** — chip strip scrolls horizontally on phones, pet detail rises as a bottom sheet, primary action is a thumb-reach FAB.
- **Shared `<ImageDropzone>`** — every photo input supports drag-drop, native camera capture (`capture="environment"` on mobile), and paste-from-clipboard.
- **Skeleton placeholders** — shape-matched shimmer (GPU-only animation) on `/chat`, `/user`, and `/pet/map` while data loads.
- **Onboarding checklist** — a fresh user with zero pets lands on a 3-step guide (add pet → print QR → set alerts).

---

## Deployment notes

Hosted on **Cloudflare Pages**. Two things to remember when adding pages:

1. **Dynamic routes (anything with `[param]`) need to opt into the edge runtime:**

   ```js
   "use client";
   export const runtime = "edge";
   ```

   Without this, `@cloudflare/next-on-pages` fails the build.

2. **`NEXT_PUBLIC_*` env vars are baked at build time.** Changing them in the dashboard does nothing until you trigger a fresh build (push or "Retry deployment").

Production environment variables to set in **Cloudflare Pages → Settings → Environment variables → Production**:

```env
NEXT_PUBLIC_BACKEND_API_PORT=https://pawglebackend.neokit.app/
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
SENTRY_AUTH_TOKEN=... (optional, for source-map upload)
SENTRY_ORG=...
SENTRY_PROJECT=pawgle-nextjs
```

---

## Contributing

1. Fork + branch from `master`.
2. `npm install` and bring up `.env.local` per the template above (you'll need a running backend, or point at the deployed one).
3. `npm run build` to confirm the route table and edge-runtime requirements stay clean.
4. Open a PR.

Issues and PRs welcome on [WhoamiI00/PawGleFrontend](https://github.com/WhoamiI00/PawGleFrontend).

---

## License

This project is part of PawGle. See the umbrella repo for license details.
