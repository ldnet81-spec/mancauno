import BrandHeader from "../../components/BrandHeader";

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white px-6 py-8 text-black">
      <BrandHeader />

      <article className="mt-10 space-y-8">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">
            Privacy Policy
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Bozza informativa da far verificare prima della pubblicazione.
            Aggiornata al 10 maggio 2026.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Titolare del trattamento</h2>
          <p className="text-gray-700">
            Il titolare del trattamento e Professional Business Consultancy.
            Inserire qui denominazione completa, sede legale, P. IVA/C.F.,
            indirizzo email e contatto privacy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Dati trattati</h2>
          <p className="text-gray-700">
            Trattiamo i dati necessari per creare e gestire l'account, creare
            eventi, partecipare agli eventi, ricevere notifiche e amministrare
            la piattaforma. Possono includere nome pubblico, email, citta,
            telefono, bio, foto profilo, eventi creati, partecipazioni,
            richieste e notifiche.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Finalita e basi giuridiche</h2>
          <p className="text-gray-700">
            I dati sono trattati per fornire il servizio richiesto, gestire la
            sicurezza della piattaforma, inviare notifiche operative e
            adempiere a obblighi di legge. La base giuridica puo essere
            l'esecuzione del contratto, l'adempimento di obblighi legali, il
            legittimo interesse o il consenso quando richiesto.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Cookie e strumenti tecnici</h2>
          <p className="text-gray-700">
            Il sito usa cookie tecnici e strumenti equivalenti necessari al
            funzionamento, inclusi i cookie/sessioni di autenticazione gestiti
            da Supabase. Non vengono usati cookie di profilazione senza
            consenso preventivo.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Fornitori e trasferimenti</h2>
          <p className="text-gray-700">
            Il servizio usa Supabase per autenticazione, database e storage.
            Inserire qui l'elenco completo dei fornitori, le sedi dei
            trattamenti e gli eventuali meccanismi di trasferimento extra SEE.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Conservazione</h2>
          <p className="text-gray-700">
            I dati sono conservati per il tempo necessario a fornire il servizio
            e per adempiere agli obblighi applicabili. L'utente puo chiedere la
            cancellazione dell'account dal profilo.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Diritti GDPR</h2>
          <p className="text-gray-700">
            Puoi chiedere accesso, rettifica, cancellazione, limitazione,
            opposizione e portabilita dei dati. Puoi esercitare questi diritti
            dal profilo o contattando il titolare ai recapiti indicati in questa
            pagina. Hai inoltre diritto di proporre reclamo al Garante per la
            protezione dei dati personali.
          </p>
        </section>
      </article>

    </main>
  );
}
