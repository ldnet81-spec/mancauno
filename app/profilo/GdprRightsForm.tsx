"use client";

import { useState } from "react";

export default function GdprRightsForm() {
  const [requestType, setRequestType] = useState("access");
  const [notes, setNotes] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const isDeleteRequest = requestType === "delete";

  return (
    <div className="space-y-5">
      <form method="post" action="/api/account/gdpr-request" className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-black">Richiesta</span>

          <select
            name="request_type"
            value={requestType}
            onChange={(event) => setRequestType(event.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
          >
            <option value="access">Accesso ai dati</option>
            <option value="rectification">Rettifica dati</option>
            <option value="portability">Portabilita dati</option>
            <option value="restriction">Limitazione trattamento</option>
            <option value="objection">Opposizione</option>
            <option value="delete">Cancellazione account</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">Dettagli</span>

          <textarea
            name="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder="Aggiungi eventuali dettagli utili alla richiesta."
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
          />
        </label>

        {isDeleteRequest ? (
          <label className="block rounded-2xl border border-red-100 bg-red-50 p-4">
            <span className="text-sm font-medium text-red-800">
              Per confermare scrivi CANCELLA
            </span>

            <input
              name="confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="mt-2 w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-black"
            />

            <p className="mt-2 text-xs text-red-700">
              La cancellazione rimuove l'accesso all'account. Prima di attivarla
              verifica backup, obblighi fiscali/legali e regole di conservazione.
            </p>
          </label>
        ) : null}

        <button
          type="submit"
          disabled={isDeleteRequest && confirmation !== "CANCELLA"}
          className="w-full rounded-xl bg-black px-4 py-3 font-medium !text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleteRequest ? "Cancella account" : "Invia richiesta GDPR"}
        </button>
      </form>
    </div>
  );
}
