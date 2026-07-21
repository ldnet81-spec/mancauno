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

-- IMPORTANTE: il backfill va fatto PRIMA di creare i trigger. Il trigger
-- imposta updated_at = now() a ogni UPDATE e sovrascriverebbe il backfill,
-- lasciando tutte le righe con la stessa identica data (lastmod inutile).

-- 1) Backfill: allinea le righe esistenti alla loro data di creazione.
update public.profiles set updated_at = created_at
  where created_at is not null;
update public.events set updated_at = created_at
  where created_at is not null;

-- 2) Funzione condivisa: aggiorna updated_at a ogni modifica della riga.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 3) Trigger (creati DOPO il backfill)
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- Se i trigger esistono gia' e serve rifare il backfill, disabilitali prima:
--
--   alter table public.profiles disable trigger profiles_set_updated_at;
--   update public.profiles set updated_at = created_at where created_at is not null;
--   alter table public.profiles enable trigger profiles_set_updated_at;
--
--   alter table public.events disable trigger events_set_updated_at;
--   update public.events set updated_at = created_at where created_at is not null;
--   alter table public.events enable trigger events_set_updated_at;
