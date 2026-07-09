-- Table des messages du formulaire de contact (site julientridat.com).
-- À exécuter une fois dans le SQL Editor de ton projet Supabase.
-- Insert-only via clé anonyme, champs bornés (RLS) — même logique que lead_qualifications.

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
