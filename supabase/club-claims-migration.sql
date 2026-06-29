-- ============================================================================
-- mancauno.it — Schede club non rivendicate + rivendicazione
-- Eseguire UNA VOLTA nell'editor SQL di Supabase.
-- ============================================================================

-- 1) Nuovi campi su profiles ------------------------------------------------
alter table profiles
  add column if not exists owner_id uuid,
  add column if not exists claim_status text not null default 'not_claimed',
  add column if not exists is_verified boolean not null default false,
  add column if not exists created_by uuid,
  add column if not exists created_by_type text;

-- 2) Rimuovere il vincolo FK profiles.id -> auth.users ----------------------
--    Serve per permettere all'admin di creare schede club SENZA un utente
--    auth reale (id generato). Gli utenti veri continuano comunque ad avere
--    id = auth.uid() perche e' il codice a impostarlo cosi al signup.
--    Il nome del constraint puo' variare: verificalo con la query qui sotto e
--    sostituiscilo se necessario.
--
--    select conname from pg_constraint
--    where conrelid = 'profiles'::regclass and contype = 'f';
--
alter table profiles drop constraint if exists profiles_id_fkey;

-- 3) Backfill profili esistenti: ognuno e' gia' "proprietario di se stesso" --
update profiles
set claim_status   = 'approved',
    owner_id       = id,
    created_by     = id,
    created_by_type = 'user',
    is_verified    = case when account_type = 'circolo' then true else is_verified end
where owner_id is null;

-- 4) Tabella richieste di rivendicazione ------------------------------------
create table if not exists club_claims (
  id                uuid primary key default gen_random_uuid(),
  club_id           uuid not null references profiles(id) on delete cascade,
  user_id           uuid references auth.users(id) on delete set null,
  full_name         text,
  email             text,
  phone             text,
  role              text,
  website_or_social text,
  message           text,
  status            text not null default 'pending',
  reviewed_by       uuid references auth.users(id),
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists club_claims_club_id_idx on club_claims(club_id);
create index if not exists club_claims_status_idx  on club_claims(status);
create index if not exists club_claims_user_id_idx on club_claims(user_id);

-- 5) event_source sugli eventi ----------------------------------------------
alter table events
  add column if not exists event_source text;

-- Backfill: gli eventi esistenti sono creati dagli utenti -> community.
update events set event_source = 'community' where event_source is null;

-- 6) RLS --------------------------------------------------------------------
--    NOTA: tutte le scritture sensibili (creazione schede, claim, approvazioni)
--    passano da route server con service-role key, quindi bypassano la RLS.
--    Queste policy servono solo per le letture/scritture dirette dei client.
--
--    a) Un owner approvato puo' aggiornare il proprio club (oltre al caso
--       classico id = auth.uid() gia' coperto dalle policy esistenti).
--
--    Adatta il nome delle policy esistenti alla tua configurazione. Esempio:
--
--    drop policy if exists "profiles_update_owner" on profiles;
--    create policy "profiles_update_owner" on profiles
--      for update using ( auth.uid() = id or auth.uid() = owner_id )
--      with check ( auth.uid() = id or auth.uid() = owner_id );
--
--    b) club_claims: abilitare RLS e lasciare la gestione alle route server.
--
--    alter table club_claims enable row level security;
--    -- un utente puo' vedere le proprie richieste:
--    create policy "club_claims_select_own" on club_claims
--      for select using ( auth.uid() = user_id );
--
--    IMPORTANTE lato sicurezza (gia' garantito dal codice server):
--    - solo admin approva/rifiuta e assegna owner_id
--    - un utente non puo' impostare is_verified o claim_status='approved' da client
--    - un utente non puo' modificare club non suoi
