# Supabase Setup Guide

This guide walks you through connecting PromptReel to Supabase.
The integration is already wired up — you just need to set env vars + run the schema.

## ✅ What's already done

- `@supabase/supabase-js` + `@supabase/ssr` installed
- `src/lib/supabase/client.ts` — server + browser client wrappers
- `supabase/schema.sql` — full schema (users, projects, generations, assets, todos, RLS policies, triggers)
- `src/features/todos/` — working Todo example (repository + types + API route)
- `src/features/todos/TodoWidget.tsx` — UI widget on the landing page (live demo)
- `src/app/api/todos/route.ts` — CRUD API endpoint

## 🚀 Setup (5 minutes)

### Step 1 — Get your Supabase credentials

1. Go to https://supabase.com/dashboard
2. Select your project (or create a new one)
3. Go to **Settings → API**
4. Copy these 3 values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)
   - **service_role key** (only visible after revealing — keep secret!)

### Step 2 — Run the schema

1. In Supabase Dashboard → **SQL Editor → New query**
2. Open `supabase/schema.sql` from this repo
3. Paste it in the editor → **Run**

This creates all tables, enums, triggers, and RLS policies in one shot.

### Step 3 — Set environment variables

#### Local dev (.env)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   # server only — never expose to client
```

#### Vercel production
Since you've already connected Supabase via Vercel:
1. Go to Vercel → your project → **Settings → Environment Variables**
2. Add the 3 vars above (or sync from Supabase integration)
3. **Redeploy** the project

### Step 4 — Test the connection

1. Run `bun run dev`
2. Visit `http://localhost:3000`
3. Scroll down to the **"Live Supabase demo"** section
4. The badge should say **"Supabase connected"**
5. Add a todo, complete it, delete it — all persists to your DB

## 🏗️ Architecture

```
Component (TodoWidget.tsx)
   ↓ fetch
API Route (/api/todos/route.ts)
   ↓ calls
Repository (features/todos/repository.ts)
   ↓ uses
Supabase Client (lib/supabase/client.ts)
   ↓ queries
Supabase Postgres (your project)
```

### Why two clients?

- **`supabaseBrowser`** — uses the **anon key**, respects **Row Level Security** (RLS).
  Safe to import in Client Components.
- **`supabaseServer`** — uses the **service role key**, **bypasses RLS**.
  Only import in Route Handlers and Server Components. NEVER expose the service role
  key to the browser (it can do anything in your DB).

### Row Level Security (RLS)

The schema enables RLS on all tables with these policies:
- Users can only see/edit **their own** projects, generations, assets
- The `todos` table is **open** (anyone can read/write) — this is just for the demo
- For production, restrict todos with: `using (auth.uid() = user_id)`

## 📝 Adding a new entity (template)

Follow the Todo pattern to add any new entity (e.g., `videos`):

1. **Add the table to `supabase/schema.sql`**:
   ```sql
   create table if not exists public.videos (
     id uuid primary key default gen_random_uuid(),
     user_id uuid references public.users(id) on delete cascade,
     title text not null,
     created_at timestamptz default now()
   );
   ```

2. **Create types** in `src/features/videos/types.ts`

3. **Create repository** in `src/features/videos/repository.ts`:
   ```typescript
   import { supabaseServer } from '@/lib/supabase/client'
   export async function listVideos() {
     const { data, error } = await supabaseServer.from('videos').select('*')
     if (error) throw new Error(error.message)
     return data
   }
   ```

4. **Create API route** in `src/app/api/videos/route.ts` — same pattern as `todos/route.ts`

5. **Create UI component** — same pattern as `TodoWidget.tsx`

No changes needed to existing code — fully extensible.

## 🔒 Security checklist

- [x] Service role key never imported in Client Components
- [x] RLS enabled on all tables
- [x] API routes validate input
- [x] Auth.uid() check in RLS policies
- [x] `.env` in `.gitignore` (never commit secrets)
- [x] `.env.example` documents all vars (no real values)

## 🐛 Troubleshooting

**"Missing NEXT_PUBLIC_SUPABASE_URL"**
→ Env var not set. Check `.env` locally or Vercel env vars.

**"Supabase not connected" badge**
→ Either env vars missing OR the `todos` table doesn't exist.
   Run `supabase/schema.sql` in the SQL Editor.

**"Failed to fetch"**
→ CORS issue (rare for Supabase) or network.
   Check the Supabase project URL is correct (not localhost).

**RLS blocks your queries**
→ You're using `supabaseBrowser` (anon key) without auth.
   Either log in first, or use `supabaseServer` (service role, bypasses RLS)
   in API routes.
