-- Tabel licenses untuk validasi keycode Cyrax Bridge mock server
create extension if not exists "pgcrypto";

create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  keycode text not null unique,
  user_type integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists licenses_keycode_idx on public.licenses (keycode);
create index if not exists licenses_active_idx on public.licenses (is_active);

alter table public.licenses enable row level security;

-- Anon key hanya boleh membaca lisensi (endpoint login tidak butuh write access).
drop policy if exists "anon can read licenses" on public.licenses;
create policy "anon can read licenses"
  on public.licenses
  for select
  to anon
  using (true);

-- Contoh lisensi aktif:
-- insert into public.licenses (keycode, user_type, is_active)
-- values ('CYRAX-PREMIUM-2026', 1, true);
