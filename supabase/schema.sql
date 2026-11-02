-- ═══════════════════════════════════════════════════════════════
--  PromptReel — Supabase Schema
--  Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
--  or via: supabase db push  (after `supabase link`)
-- ═══════════════════════════════════════════════════════════════

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('FREE', 'CREATOR', 'STUDIO', 'ADMIN');
  end if;
  if not exists (select 1 from pg_type where typname = 'project_status') then
    create type project_status as enum ('DRAFT', 'GENERATING', 'READY', 'EXPORTING', 'EXPORTED', 'FAILED');
  end if;
  if not exists (select 1 from pg_type where typname = 'generation_type') then
    create type generation_type as enum (
      'TEXT_TO_VIDEO', 'IMAGE_TO_VIDEO', 'VIDEO_TO_VIDEO', 'SCRIPT_TO_VIDEO',
      'IMAGE_GENERATION', 'VOICE_SYNTHESIS', 'DUBBING', 'TRANSLATION',
      'SUBTITLES', 'UPSCALING', 'SUMMARIZATION'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'generation_status') then
    create type generation_status as enum ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED');
  end if;
  if not exists (select 1 from pg_type where typname = 'asset_type') then
    create type asset_type as enum ('VIDEO', 'IMAGE', 'AUDIO', 'SUBTITLE', 'AVATAR', 'THUMBNAIL');
  end if;
end
$$;

-- ─── Tables ──────────────────────────────────────────────────

-- Users (linked to Supabase auth.users via id)
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  name        text,
  image       text,
  role        user_role not null default 'FREE',
  credits     integer not null default 10,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Subscriptions
create table if not exists public.subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  status              text not null default 'trialing',
  plan                user_role not null default 'FREE',
  stripe_customer_id  text,
  stripe_sub_id       text,
  current_period_end  timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id)
);

-- Credit transactions (audit log of credits added/used)
create table if not exists public.credit_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  amount      integer not null,  -- positive = credit added, negative = credit used
  reason      text not null,     -- 'generation', 'topup', 'refund', 'bonus'
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_credit_tx_user on public.credit_transactions(user_id);

-- Projects
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  name        text not null,
  description text,
  status      project_status not null default 'DRAFT',
  thumbnail   text,
  duration    double precision,
  resolution  text,
  fps         integer not null default 30,
  language    text not null default 'en',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_projects_user on public.projects(user_id);
create index if not exists idx_projects_status on public.projects(status);

-- Generations (AI generation jobs)
create table if not exists public.generations (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  project_id        uuid references public.projects(id) on delete set null,
  type              generation_type not null,
  status            generation_status not null default 'QUEUED',
  provider          text not null,
  prompt            text,
  negative_prompt  text,
  input_asset_ids   jsonb,    -- array of asset IDs
  output_asset_ids  jsonb,
  parameters        jsonb,
  language          text,
  credits_used      integer not null default 0,
  error_message     text,
  started_at        timestamptz,
  completed_at       timestamptz,
  created_at        timestamptz not null default now()
);
create index if not exists idx_gens_user on public.generations(user_id);
create index if not exists idx_gens_project on public.generations(project_id);
create index if not exists idx_gens_status on public.generations(status);

-- Assets (media library)
create table if not exists public.assets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  type        asset_type not null,
  name        text not null,
  url         text not null,
  thumbnail   text,
  mime_type   text not null,
  size        bigint not null,  -- bytes
  duration    double precision,
  width       integer,
  height      integer,
  fps         integer,
  language    text,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_assets_user on public.assets(user_id);
create index if not exists idx_assets_type on public.assets(type);

-- ─── Todos (demo table — proof of Supabase connection) ───────
create table if not exists public.todos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete set null,
  title       text not null,
  completed   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_todos_user on public.todos(user_id);

-- ─── updated_at triggers ─────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_users_updated on public.users;
create trigger trg_users_updated before update on public.users
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_subscriptions_updated on public.subscriptions;
create trigger trg_subscriptions_updated before update on public.subscriptions
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_projects_updated on public.projects;
create trigger trg_projects_updated before update on public.projects
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_todos_updated on public.todos;
create trigger trg_todos_updated before update on public.todos
  for each row execute function public.handle_updated_at();

-- ─── Row Level Security ──────────────────────────────────────
alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.projects enable row level security;
alter table public.generations enable row level security;
alter table public.assets enable row level security;
alter table public.todos enable row level security;

-- Users can see/edit their own rows
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can view own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "Users can view own credit tx" on public.credit_transactions
  for select using (auth.uid() = user_id);

create policy "Users can CRUD own projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can CRUD own generations" on public.generations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can CRUD own assets" on public.assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Todos: anyone can read (demo), only owner can write
create policy "Anyone can view todos" on public.todos
  for select using (true);
create policy "Anyone can insert todos" on public.todos
  for insert with check (true);
create policy "Anyone can update todos" on public.todos
  for update using (true);
create policy "Anyone can delete todos" on public.todos
  for delete using (true);

-- ─── Auto-create user profile on signup ─────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, image)
  values (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
