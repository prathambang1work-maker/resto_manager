# Embercard — Restaurant Manager

A dark, kitchen-styled restaurant management app: orders, menu, kitchens, and business analytics, backed by a real shared database (Supabase/Postgres) so every device stays in sync automatically. Installable as a PWA.

## Stack
React 18 (Vite) · Tailwind CSS · React Router · Supabase (Postgres + Auth + Realtime) · `vite-plugin-pwa`

---

## One-time setup (do this before anything works)

### 1. Create a Supabase project
Go to [supabase.com](https://supabase.com), sign up free (no card required), and create a new project. Wait a minute or two for it to finish provisioning.

### 2. Run the schema
In your Supabase project: **SQL Editor → New query**, paste the entire contents of `supabase-schema.sql` from this repo, and run it. This creates the `kitchens`, `menu_items`, `orders`, and `profiles` tables, sets up Row Level Security, and enables realtime sync.

*(If you already ran an older version of this schema for Phase 2, run `supabase-migration-phase3.sql` instead — it safely upgrades an existing project to add kitchen accounts.)*

### 3. Get your API keys
**Project Settings → API**. Copy the **Project URL** and the **anon public** key.

### 4. Configure the app
```bash
cp .env.example .env
```
Paste your URL and anon key into `.env`:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

For your live Netlify site, add the same two variables under **Site configuration → Environment variables**, then redeploy.

### 5. Create your accounts
Everyone needs a real login now — there's no more open/no-login mode. In Supabase: **Authentication → Users → Add user**, create an email + password for each person, and note the user's ID (the UUID Supabase assigns).

Then, in **SQL Editor**, give each one a role:

```sql
-- Admin account (sees revenue, manages kitchens)
insert into public.profiles (id, email, role)
values ('paste-the-user-uuid-here', 'you@example.com', 'admin');

-- Staff account (takes orders, edits menu — no revenue access)
insert into public.profiles (id, email, role)
values ('paste-the-user-uuid-here', 'staff@example.com', 'staff');

-- Kitchen account (only sees + marks ready orders for ONE kitchen)
insert into public.profiles (id, email, role, kitchen_id)
values (
  'paste-the-user-uuid-here',
  'kitchen1@example.com',
  'kitchen',
  (select id from public.kitchens where name = 'Kitchen 1')
);
```

Repeat the kitchen block once per kitchen (Kitchen 1 / 2 / 3 by default — see Admin to rename or add more).

**Security note:** unlike the old Phase 1/2 version, this is now real authentication — Supabase handles passwords server-side, nothing sensitive lives in the browser. Row Level Security enforces who can read/write what at the database level, not just in the app's UI, so it holds up even if someone inspects network requests.

---

## Roles

| Role | Can do |
|---|---|
| **admin** | Everything staff can, plus: revenue/sales analytics with filters, manage kitchens, change own password |
| **staff** | Dashboard (operational view), take/manage orders, edit menu — no revenue access |
| **kitchen** | Full-screen Kitchen Display only, showing pending orders for their one assigned kitchen, with a "Mark Ready" button and a sound alert on new orders |

Everyone signs in at the same login screen — role and kitchen assignment are looked up automatically after login and determine what they see.

## Kitchen Display

A kitchen account is dropped straight into a big-button, tablet-friendly screen — no sidebar, no navigation, just their queue (Zomato/Swiggy-style). Tap **Enable order alerts** once per session (browsers require a tap before allowing sound) and a short chime plays automatically whenever a new order comes in for that kitchen — no polling, pushed live via Supabase Realtime. Tap **Mark Ready** to clear an order off their screen.

There's no time limit or pickup-tracking step — marking an order ready is the final action for that kitchen.

## Admin analytics

Admin → **Sales analysis** lets you filter by date range (Today / 7 days / 30 days / All time) and by kitchen, recomputing revenue, order count, average order value, the revenue trend chart, and top-selling items live as you change filters.

## Currency
All amounts are formatted as Indian Rupees (₹) via `src/utils/currency.js`.

---

## Project structure

```
src/
  components/
    Button, Card, Sidebar, Layout, OrderTicket   # presentation only
    RequireAuth.jsx        # blocks the app behind login
    RequireAdmin.jsx       # blocks /admin behind the admin role
  context/
    AuthContext.jsx        # tracks session + role + kitchenId app-wide
  pages/
    Login.jsx               # shared sign-in screen for every role
    Dashboard.jsx            # staff/admin operational view
    Orders.jsx, Menu.jsx     # staff/admin day-to-day
    Admin.jsx                # kitchens, sales analysis, password change
    Kitchen.jsx               # full-screen Kitchen Display (role: kitchen)
  utils/
    supabaseClient.js        # Supabase client singleton
    auth.js                  # sign in/out, profile lookup, password change
    storage.js                # ALL data access + business logic (Supabase queries)
    currency.js               # ₹ formatting
    soundAlert.js              # generated chime for new kitchen orders
  App.jsx                   # routes + role-based branching
  main.jsx
public/
  icons/, favicon.svg, _redirects
supabase-schema.sql          # fresh-install database schema
supabase-migration-phase3.sql # upgrade script for existing Phase 2 projects
.env.example
```

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
1. Push this repo to GitHub.
2. In Netlify: **New site from Git** → pick the repo.
3. Build command: `npm run build` · Publish directory: `dist`
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Site configuration → Environment variables.
5. Deploy. `public/_redirects` is already set up for SPA routing.

## Data model

```ts
// orders table
{ id, item, quantity, price, status: "pending" | "completed", created_at, kitchen_id }

// menu_items table
{ id, name, price, kitchen_id }

// kitchens table
{ id, name }

// profiles table (one row per login)
{ id, email, role: "staff" | "admin" | "kitchen", kitchen_id }
```

## Debugging tips
- All data access goes through `src/utils/storage.js` — every function is `async` and talks to Supabase. Set a breakpoint there first.
- If the app shows "Supabase isn't configured yet" — your `.env` (local) or Netlify environment variables (live) are missing or misnamed.
- If a kitchen account signs in but sees "No kitchen assigned" — its `profiles.kitchen_id` wasn't set. Fix with the SQL in step 5 above.
- If orders/menu changes don't appear on another device — check the Supabase dashboard's **Database → Replication** page to confirm `orders`, `menu_items`, and `kitchens` are enabled for realtime (the schema script does this automatically, but worth checking if you edited RLS by hand).
- Browser blocks the kitchen alert sound until a tap happens on the page — that's why there's an "Enable order alerts" button, not automatic playback.
