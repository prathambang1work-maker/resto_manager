# Embercard — Restaurant Manager

A dark, kitchen-styled dashboard for small restaurants: orders, menu, and revenue, built as an installable PWA. No backend — everything persists to `localStorage`.

## Stack
React 18 (Vite) · Tailwind CSS · React Router · `vite-plugin-pwa`

## Project structure

```
src/
  components/     # Reusable, presentation-only UI (Button, Card, Sidebar, Layout, OrderTicket)
  pages/          # Route-level screens (Dashboard, Orders, Menu, Admin) — compose components only
  utils/
    storage.js    # ALL order/menu/kitchen business logic + localStorage access
    auth.js       # Admin login/logout/credentials (client-side gate only, see below)
    currency.js   # ₹ (INR) formatting helper
  App.jsx         # Router + route table
  main.jsx        # React entry point
public/
  icons/          # PWA icons (192, 512, 512 maskable)
  favicon.svg
  _redirects      # Netlify SPA rewrite rule
```

## Admin section

Reachable at `#/admin` (the small lock icon at the bottom of the sidebar). Default login:

```
Email:    admin@embercard.app
Password: admin123
```

**Change this immediately after first login** (Admin → Admin credentials).

From the Admin panel you can:
- Add, rename, or delete kitchens
- Change the admin email/password

**Security note:** this app has no backend, so the admin login is a client-side convenience gate only — credentials and the "logged in" flag are stored in the browser's `localStorage`, which is readable/editable via devtools. It stops casual access to kitchen setup but is **not real security**. Don't rely on it to protect anything sensitive; a genuine login needs a server-side auth system.

## Kitchens & orders

- Kitchens are managed in Admin. Three are seeded by default: Kitchen 1, Kitchen 2, Kitchen 3.
- Each menu item can have a default kitchen (set in Menu). Picking that item from "Quick add from menu" on the Orders page auto-fills its kitchen — the manager can still override it per order.
- The Orders page has a kitchen filter, and the Dashboard shows live active-order counts per kitchen.

## Currency

All amounts are formatted as Indian Rupees (₹) via `src/utils/currency.js`, using `Intl.NumberFormat('en-IN', ...)` for correct Indian digit grouping.

Each file has one job, so a bug in "can't delete an order" is always in `utils/storage.js` or `OrderTicket.jsx` — never buried in a 500-line component.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

## Build

```bash
npm run build       # outputs to dist/
npm run preview     # serve the production build locally
```

## Deploy (Netlify)

1. Push this repo to GitHub (see below).
2. In Netlify: **New site from Git** → pick the repo.
3. Build command: `npm run build` · Publish directory: `dist`
4. Netlify picks up `public/_redirects` automatically for SPA routing.

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Embercard restaurant dashboard"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

Because every concern lives in its own file, future commits stay small and reviewable, e.g.:

```bash
git commit -m "fix(orders): correct total calc in OrderTicket"
git commit -m "feat(menu): add inline edit for menu items"
```

## Data model

```ts
// Order
{ id, item, quantity, price, status: "pending" | "completed", timestamp, kitchenId: string | null }

// Menu item
{ id, name, price, kitchenId: string | null }

// Kitchen
{ id, name }
```

## Debugging tips

- All reads/writes to `localStorage` funnel through `src/utils/storage.js` — set a breakpoint there first.
- Each page (`Dashboard`, `Orders`, `Menu`) only calls functions from `storage.js` and renders components; it holds no persistence logic itself.
- `OrderTicket.jsx` is the only place order totals are rendered — check there if numbers look wrong.
- To reset all demo data, clear `localStorage` keys `embercard:orders` and `embercard:menu` in devtools.
