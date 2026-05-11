import type { Metadata } from "next";
import Link from "next/link";
import AppHeaderServer from "../../components/AppHeaderServer";

type SupportPageProps = {
  searchParams: Promise<{
    sent?: string;
    error?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Supporto clienti",
  description:
    "Segnala problemi, reclami o richieste di assistenza per mancauno.it.",
};

export default async function SupportPage({ searchParams }: SupportPageProps) {
  const params = await searchParams;

  return (
    <main className="mx-auto min-h-screen max-w-md bg-white px-6 py-8 text-black">
      <AppHeaderServer />

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Supporto clienti
        </h1>

        <p className="mt-2 text-gray-600">
          Usa questo modulo per segnalare problemi tecnici, reclami o richieste
          di assistenza.
        </p>
      </div>

      {params.sent ? (
        <div className="mb-5 rounded-2xl bg-green-50 p-4 text-sm text-green-700">
          Richiesta inviata. Ti risponderemo appena possibile.
        </div>
      ) : null}

      {params.error ? (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {params.error}
        </div>
      ) : null}

      <form
        method="post"
        action="/api/support"
        className="space-y-5 rounded-3xl border border-gray-200 p-5"
      >
        <label className="block">
          <span className="text-sm font-medium text-black">Tipo richiesta</span>
          <select
            name="request_type"
            required
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
          >
            <option value="problema">Problema tecnico</option>
            <option value="reclamo">Reclamo</option>
            <option value="assistenza">Assistenza</option>
            <option value="suggerimento">Suggerimento</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">Email</span>
          <input
            type="email"
            name="email"
            required
            placeholder="nome@email.it"
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">Oggetto</span>
          <input
            name="subject"
            required
            placeholder="Descrivi brevemente il problema"
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">Messaggio</span>
          <textarea
            name="message"
            required
            rows={6}
            placeholder="Scrivi cosa e successo, da quale pagina e con quale dispositivo."
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-xl bg-black px-4 py-3 font-semibold !text-white"
        >
          Invia richiesta
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Hai bisogno di tornare alla piattaforma?{" "}
        <Link href="/" className="font-medium text-black underline">
          Vai alla Home
        </Link>
      </p>
    </main>
  );
}
