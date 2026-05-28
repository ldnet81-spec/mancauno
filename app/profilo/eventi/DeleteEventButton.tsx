"use client";

type DeleteEventButtonProps = {
  eventId: string;
};

export default function DeleteEventButton({ eventId }: DeleteEventButtonProps) {
  return (
    <form
      method="post"
      action={`/api/events/${eventId}/delete`}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Vuoi eliminare definitivamente questo evento? L'azione non e reversibile e rimuove anche le partecipazioni."
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-center text-sm font-medium text-red-700 transition hover:bg-red-100"
      >
        Elimina
      </button>
    </form>
  );
}
