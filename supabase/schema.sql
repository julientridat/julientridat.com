-- ============================================================
-- Schéma Supabase — site julientridat.com
-- À exécuter UNE FOIS dans le SQL Editor de ton projet Supabase.
-- Crée les 2 tables des formulaires : audit (lead_qualifications)
-- et contact (contact_messages). Insert-only via clé anonyme (RLS).
-- ============================================================

-- 1) Formulaire d'audit / diagnostic (bouton « Réserver un audit »)
create table if not exists public.lead_qualifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company text not null,
  company_size text not null,
  company_url text not null,
  email text,
  ai_tools text[] not null default '{}',
  ai_tools_other text
);

alter table public.lead_qualifications enable row level security;

drop policy if exists "Anyone can submit a qualification" on public.lead_qualifications;
create policy "Anyone can submit a qualification"
  on public.lead_qualifications for insert
  to anon, authenticated
  with check (
    length(company) between 1 and 200
    and length(company_size) between 1 and 50
    and length(company_url) between 1 and 500
    and array_length(ai_tools, 1) is not null
    and coalesce(length(ai_tools_other), 0) <= 200
  );

-- 2) Formulaire de contact (bouton « Contact »)
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  company text,
  message text not null
);

alter table public.contact_messages enable row level security;

drop policy if exists "Anyone can send a contact message" on public.contact_messages;
create policy "Anyone can send a contact message"
  on public.contact_messages for insert
  to anon, authenticated
  with check (
    length(name) between 1 and 120
    and length(email) between 3 and 200
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and length(message) between 5 and 2000
    and coalesce(length(company), 0) <= 160
  );
