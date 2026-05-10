import BrandHeader from "../../components/BrandHeader";

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white px-6 py-8 text-black">
      <BrandHeader />

      <article className="mt-10 space-y-8">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">
            Termini di Servizio
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Bozza contrattuale da far verificare prima della pubblicazione.
            Aggiornata al 10 maggio 2026.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Titolare del servizio</h2>
          <p className="text-gray-700">
            Il servizio mancauno.it e gestito da Professional Business
            Consultancy. Inserire denominazione completa, sede legale, P.
            IVA/C.F. e contatti ufficiali.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Oggetto</h2>
          <p className="text-gray-700">
            mancauno.it consente agli utenti di creare, cercare e condividere
            eventi sportivi o ricreativi, e di inviare richieste di
            partecipazione agli organizzatori.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Account</h2>
          <p className="text-gray-700">
            L'utente e responsabile della correttezza dei dati inseriti, della
            sicurezza delle credenziali e dell'uso del proprio account. Il
            gestore puo sospendere o rimuovere account che violano questi
            termini o la legge.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Eventi e responsabilita</h2>
          <p className="text-gray-700">
            Gli eventi sono creati dagli utenti o dai circoli. L'organizzatore
            e responsabile delle informazioni pubblicate, della gestione delle
            partecipazioni e del rispetto delle norme applicabili all'evento.
            mancauno.it non organizza direttamente gli eventi salvo diversa
            indicazione.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Condotte vietate</h2>
          <p className="text-gray-700">
            E vietato usare il servizio per contenuti illeciti, discriminatori,
            ingannevoli, offensivi, spam, raccolta non autorizzata di dati o
            attivita che danneggino altri utenti o la piattaforma.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Limitazioni e modifiche</h2>
          <p className="text-gray-700">
            Il servizio puo essere aggiornato, sospeso o modificato per motivi
            tecnici, organizzativi o di sicurezza. Inserire qui eventuali
            clausole specifiche su responsabilita, recesso, legge applicabile e
            foro competente.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Privacy</h2>
          <p className="text-gray-700">
            Il trattamento dei dati personali e descritto nella Privacy Policy,
            che costituisce parte integrante dell'esperienza d'uso del servizio.
          </p>
        </section>
      </article>

    </main>
  );
}
