-- ============================================================================
-- mancauno.it — updated_at su profiles ed events per un lastmod veritiero
-- Eseguire una volta nell'SQL Editor di Supabase.
-- Rende il lastmod della sitemap reattivo alle modifiche reali (Google
-- ri-scansiona la scheda club appena viene aggiornata).
-- ============================================================================

alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

alter table public.events
  add column if not exists updated_at timestamptz not null default now();

-- Funzione condivisa: aggiorna updated_at a ogni modifica della riga.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger su profiles
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Trigger su events
drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- Allinea le righe esistenti alla loro data di creazione (cosi' il primo
-- lastmod non e' "ora" per tutte, ma la data reale di creazione).
update public.profiles set updated_at = created_at
  where created_at is not null;
update public.events set updated_at = created_at
  where created_at is not null;
