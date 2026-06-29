-- ============================================================================
-- mancauno.it — Eventi segnalati da MancaUno per i club (PARTE 2)
-- Eseguire DOPO club-claims-migration.sql, una volta su Supabase.
-- ============================================================================

-- Collega un evento a un club SENZA usare creator_id (che resta l'autore reale
-- dell'evento, p.es. l'admin). Questo evita problemi di foreign key quando il
-- club e' una scheda non rivendicata (senza utente auth dietro).
alter table events
  add column if not exists club_id uuid;

create index if not exists events_club_id_idx on events(club_id);

-- La pagina del club mostra:
--   - gli eventi con creator_id = club.id (eventi pubblicati direttamente dal
--     club registrato), e
--   - gli eventi con club_id = club.id (eventi "segnalati da MancaUno",
--     event_source = 'mancauno_suggested', creati dall'admin per conto del club).
