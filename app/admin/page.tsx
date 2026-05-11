import { createClient } from "../../lib/supabase/server";
import { createAdminClient } from "../../lib/supabase/admin";
import AppHeaderServer from "../../components/AppHeaderServer";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  formatDateTimeItaly,
  toItalyDateInputValue,
  toItalyTimeInputValue,
} from "../../lib/date-time";

type AdminSection = "users" | "clubs" | "events" | "settings";

type AdminPageProps = {
  searchParams: Promise<{
    section?: string;
    q?: string;
    error?: string;
    banned?: string;
    unbanned?: string;
    event_deleted?: string;
    event_updated?: string;
    user_deleted?: string;
    role_updated?: string;
    limits_updated?: string;
    settings_updated?: string;
  }>;
};

const sections: Array<{ key: AdminSection; label: string }> = [
  { key: "users", label: "Utenti" },
  { key: "clubs", label: "Club" },
  { key: "events", label: "Eventi" },
  { key: "settings", label: "Impostazioni" },
];

function getSection(value?: string): AdminSection {
  if (value === "clubs" || value === "events" || value === "settings") {
    return value;
  }

  return "users";
}

function formatDate(date: string) {
  return formatDateTimeItaly(date);
}

function formatRemainingSpots(remainingSpots: number) {
  if (remainingSpots <= 0) {
    return "Completo";
  }

  if (remainingSpots === 1) {
    return "Ultimo posto";
  }

  return `Mancano ${remainingSpots} posti`;
}

function formatSkillLevel(level: string | null | undefined) {
  if (level === "intermedio") {
    return "Intermedio";
  }

  if (level === "esperto") {
    return "Esperto";
  }

  return "Amatoriale";
}

function getSetting(settings: any[] | null, key: string, fallback: string) {
  return (
    settings?.find((setting: any) => setting.key === key)?.value_text ||
    fallback
  );
}

function getProfileName(profile: any) {
  if (profile.account_type === "circolo" && profile.club_name) {
    return profile.club_name;
  }

  return profile.display_name || "Utente senza nome";
}

function formatMonthlyLimit(profile: any, settings: any[] | null) {
  if (profile.account_plan === "pro") {
    return "Illimitati";
  }

  if (profile.monthly_event_limit_override !== null) {
    return `${profile.monthly_event_limit_override} eventi/mese`;
  }

  const fallback =
    profile.account_type === "circolo"
      ? getSetting(settings, "default_club_monthly_event_limit", "4")
      : getSetting(settings, "default_private_monthly_event_limit", "8");

  return `${fallback} eventi/mese`;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const section = getSection(params.section);
  const searchQuery = params.q?.trim() ?? "";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/quick-signup");
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("id, role, banned_at")
    .eq("id", user.id)
    .single();

  if (
    !currentProfile ||
    currentProfile.role !== "admin" ||
    currentProfile.banned_at
  ) {
    redirect("/");
  }

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    redirect(
      "/?error=Admin non configurato: manca SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  const profileSelect =
    "id, display_name, email, city, role, banned_at, created_at, account_type, account_plan, monthly_event_limit_override, club_name, phone, club_address, club_whatsapp, club_email, club_website, club_instagram, club_sports, club_services";

  let profilesQuery = adminSupabase
    .from("profiles")
    .select(profileSelect)
    .order("created_at", { ascending: false })
    .limit(200);

  if (section === "users") {
    profilesQuery = profilesQuery.neq("account_type", "circolo");
  }

  if (section === "clubs") {
    profilesQuery = profilesQuery.eq("account_type", "circolo");
  }

  if (searchQuery && (section === "users" || section === "clubs")) {
    profilesQuery = profilesQuery.or(
      `email.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,club_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`
    );
  }

  const { data: profiles } =
    section === "users" || section === "clubs"
      ? await profilesQuery
      : { data: [] };

  let eventsQuery = adminSupabase
    .from("event_with_counts")
    .select("*")
    .order("starts_at", { ascending: true })
    .limit(200);

  if (searchQuery && section === "events") {
    eventsQuery = eventsQuery.or(
      `title.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,sport.ilike.%${searchQuery}%,location_name.ilike.%${searchQuery}%`
    );
  }

  const { data: events } = section === "events" ? await eventsQuery : { data: [] };

  const { data: settings } = await adminSupabase
    .from("app_settings")
    .select("key, value_text, description")
    .in("key", [
      "default_private_monthly_event_limit",
      "default_club_monthly_event_limit",
    ]);

  const { count: totalUsers } = await adminSupabase
    .from("profiles")
    .select("id", { count: "exact", head: true });
  const { count: totalClubs } = await adminSupabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("account_type", "circolo");
  const { count: totalEvents } = await adminSupabase
    .from("events")
    .select("id", { count: "exact", head: true });
  const { count: activeEvents } = await adminSupabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-white px-6 py-8 text-black">
      <AppHeaderServer />

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Amministrazione
        </h1>

        <p className="mt-2 text-gray-600">
          Controllo completo di utenti, club, eventi e limiti mensili della
          piattaforma.
        </p>
      </div>

      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl bg-gray-50 p-4">
          <p className="text-2xl font-semibold">{totalUsers ?? 0}</p>
          <p className="mt-1 text-sm text-gray-600">Profili totali</p>
        </div>

        <div className="rounded-2xl bg-gray-50 p-4">
          <p className="text-2xl font-semibold">{totalClubs ?? 0}</p>
          <p className="mt-1 text-sm text-gray-600">Club</p>
        </div>

        <div className="rounded-2xl bg-gray-50 p-4">
          <p className="text-2xl font-semibold">{totalEvents ?? 0}</p>
          <p className="mt-1 text-sm text-gray-600">Eventi totali</p>
        </div>

        <div className="rounded-2xl bg-gray-50 p-4">
          <p className="text-2xl font-semibold">{activeEvents ?? 0}</p>
          <p className="mt-1 text-sm text-gray-600">Eventi attivi</p>
        </div>
      </section>

      <nav className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1 md:grid-cols-4">
        {sections.map((item) => (
          <Link
            key={item.key}
            href={`/admin?section=${item.key}`}
            className={`rounded-xl px-4 py-3 text-center text-sm font-medium ${
              section === item.key
                ? "bg-black !text-white"
                : "bg-white text-gray-800"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {params.error ? (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {params.error}
        </div>
      ) : null}

      {params.banned ||
      params.unbanned ||
      params.user_deleted ||
      params.role_updated ||
      params.event_deleted ||
      params.event_updated ||
      params.limits_updated ||
      params.settings_updated ? (
        <div className="mb-5 rounded-2xl bg-green-50 p-4 text-sm text-green-700">
          Modifica salvata correttamente.
        </div>
      ) : null}

      {section !== "settings" ? (
        <form action="/admin" className="mb-6">
          <input type="hidden" name="section" value={section} />

          <label className="block">
            <span className="text-sm font-medium text-black">
              Cerca {section === "events" ? "evento" : "profilo"}
            </span>

            <div className="mt-2 flex gap-2">
              <input
                name="q"
                defaultValue={searchQuery}
                placeholder={
                  section === "events"
                    ? "Titolo, citta, sport o luogo"
                    : "Email, nome, telefono, citta o club"
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
              />

              <button
                type="submit"
                className="rounded-xl bg-black px-4 py-3 text-sm font-medium !text-white"
              >
                Cerca
              </button>
            </div>
          </label>

          {searchQuery ? (
            <Link
              href={`/admin?section=${section}`}
              className="mt-2 inline-block text-sm text-gray-600 underline"
            >
              Pulisci ricerca
            </Link>
          ) : null}
        </form>
      ) : null}

      {section === "settings" ? (
        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-gray-200 p-5">
            <h2 className="text-2xl font-semibold">Limiti di default</h2>
            <p className="mt-2 text-sm text-gray-600">
              Questi valori vengono usati per gli account free quando non hai
              impostato un limite specifico sul singolo profilo.
            </p>

            <form method="post" action="/api/admin/settings" className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-black">
                  Eventi mensili utenti privati free
                </span>
                <input
                  type="number"
                  min={0}
                  name="default_private_monthly_event_limit"
                  defaultValue={getSetting(
                    settings,
                    "default_private_monthly_event_limit",
                    "8"
                  )}
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-black">
                  Eventi mensili club free
                </span>
                <input
                  type="number"
                  min={0}
                  name="default_club_monthly_event_limit"
                  defaultValue={getSetting(
                    settings,
                    "default_club_monthly_event_limit",
                    "4"
                  )}
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-xl bg-black px-4 py-3 font-semibold !text-white"
              >
                Salva impostazioni
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-gray-200 p-5">
            <h2 className="text-2xl font-semibold">Come funzionano</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <p>
                Gli utenti free usano il limite globale, salvo override
                impostato sulla scheda del singolo profilo.
              </p>
              <p>
                I club free usano il limite globale dei club. I club Pro
                possono essere impostati come illimitati dal menu del profilo.
              </p>
              <p>
                Il campo override puo essere lasciato vuoto per tornare al
                valore di default.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {section === "users" || section === "clubs" ? (
        <section>
          <h2 className="text-2xl font-semibold">
            {section === "clubs" ? "Club e circoli" : "Utenti privati"}
          </h2>

          <div className="mt-4 space-y-4">
            {!profiles?.length ? (
              <p className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
                Nessun profilo trovato.
              </p>
            ) : (
              profiles.map((item: any) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-gray-200 bg-white p-5"
                >
                  <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold">
                        {getProfileName(item)}
                      </p>

                      {item.account_type === "circolo" && item.display_name ? (
                        <p className="mt-1 text-sm text-gray-600">
                          Referente: {item.display_name}
                        </p>
                      ) : null}

                      <div className="mt-3 grid gap-1 text-sm text-gray-700 sm:grid-cols-2">
                        <p>Email: {item.email || "Non disponibile"}</p>
                        <p>Telefono: {item.phone || "Non indicato"}</p>
                        <p>Citta: {item.city || "Non indicata"}</p>
                        <p>Creato: {formatDate(item.created_at)}</p>
                        {item.club_address ? (
                          <p>Indirizzo: {item.club_address}</p>
                        ) : null}
                        {item.club_email ? <p>Email club: {item.club_email}</p> : null}
                        {item.club_whatsapp ? (
                          <p>WhatsApp: {item.club_whatsapp}</p>
                        ) : null}
                        {item.club_website ? <p>Sito: {item.club_website}</p> : null}
                        {item.club_instagram ? (
                          <p>Instagram: {item.club_instagram}</p>
                        ) : null}
                      </div>

                      <p className="mt-3 break-all text-xs text-gray-400">
                        ID: {item.id}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                          {item.role === "admin" ? "Admin" : "User"}
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                          {item.account_type === "circolo"
                            ? "Circolo"
                            : "Privato"}
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                          Piano {item.account_plan || "free"}
                        </span>
                        <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold !text-white">
                          {formatMonthlyLimit(item, settings)}
                        </span>
                        {item.banned_at ? (
                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700">
                            Bannato
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-700">
                            Attivo
                          </span>
                        )}
                      </div>

                      {item.account_type === "circolo" ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.club_sports?.map((sport: string) => (
                            <span
                              key={sport}
                              className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-700"
                            >
                              {sport}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-3">
                      <form
                        method="post"
                        action={`/api/admin/users/${item.id}/limits`}
                        className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-3"
                      >
                        <label className="block">
                          <span className="text-xs font-medium text-gray-600">
                            Piano
                          </span>
                          <select
                            name="account_plan"
                            defaultValue={item.account_plan || "free"}
                            className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black"
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro illimitato</option>
                          </select>
                        </label>

                        <label className="block">
                          <span className="text-xs font-medium text-gray-600">
                            Override eventi mensili
                          </span>
                          <input
                            type="number"
                            min={0}
                            name="monthly_event_limit_override"
                            defaultValue={item.monthly_event_limit_override ?? ""}
                            placeholder="Vuoto = default"
                            className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black"
                          />
                        </label>

                        <button
                          type="submit"
                          className="w-full rounded-xl bg-black px-4 py-2 text-sm font-medium !text-white"
                        >
                          Salva limite
                        </button>
                      </form>

                      {item.role === "admin" ? (
                        item.id !== user.id ? (
                          <form
                            method="post"
                            action={`/api/admin/users/${item.id}/remove-admin`}
                            className="space-y-2"
                          >
                            <input
                              name="reason"
                              placeholder="Motivo rimozione admin"
                              required
                              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-black"
                            />
                            <button
                              type="submit"
                              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800"
                            >
                              Rimuovi admin
                            </button>
                          </form>
                        ) : null
                      ) : (
                        <form
                          method="post"
                          action={`/api/admin/users/${item.id}/make-admin`}
                          className="space-y-2"
                        >
                          <input
                            name="reason"
                            placeholder="Motivo promozione admin"
                            required
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-black"
                          />
                          <button
                            type="submit"
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800"
                          >
                            Rendi admin
                          </button>
                        </form>
                      )}

                      {item.banned_at ? (
                        <form
                          method="post"
                          action={`/api/admin/users/${item.id}/unban`}
                          className="space-y-2"
                        >
                          <input
                            name="reason"
                            placeholder="Motivo sbannamento"
                            required
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-black"
                          />
                          <button
                            type="submit"
                            className="w-full rounded-xl bg-black px-4 py-2 text-sm font-medium !text-white"
                          >
                            Sbanna
                          </button>
                        </form>
                      ) : (
                        <form
                          method="post"
                          action={`/api/admin/users/${item.id}/ban`}
                          className="space-y-2"
                        >
                          <input
                            name="reason"
                            placeholder="Motivo ban"
                            required
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-black"
                          />
                          <button
                            type="submit"
                            className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700"
                          >
                            Banna
                          </button>
                        </form>
                      )}

                      {item.id !== user.id ? (
                        <form
                          method="post"
                          action={`/api/admin/users/${item.id}/delete`}
                          className="space-y-2 rounded-2xl border border-red-100 bg-red-50 p-3"
                        >
                          <input
                            name="reason"
                            placeholder="Motivo eliminazione"
                            required
                            className="w-full rounded-xl border border-red-200 bg-white px-4 py-2 text-sm text-black"
                          />
                          <button
                            type="submit"
                            className="w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-medium !text-white"
                          >
                            Elimina profilo
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}

      {section === "events" ? (
        <section>
          <h2 className="text-2xl font-semibold">Eventi</h2>

          <div className="mt-4 space-y-4">
            {!events?.length ? (
              <p className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
                Nessun evento trovato.
              </p>
            ) : (
              events.map((event: any) => (
                <div
                  key={event.id}
                  className="rounded-3xl border border-gray-200 bg-white p-5"
                >
                  <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
                    <div>
                      <p className="text-3xl">{event.sport_emoji}</p>
                      <h3 className="mt-2 text-lg font-semibold">
                        {event.title}
                      </h3>
                      <div className="mt-3 grid gap-1 text-sm text-gray-700 sm:grid-cols-2">
                        <p>Sport: {event.sport}</p>
                        <p>Livello: {formatSkillLevel(event.skill_level)}</p>
                        <p>Luogo: {event.location_name}</p>
                        <p>Citta: {event.city}</p>
                        <p>Data: {formatDate(event.starts_at)}</p>
                        <p>Status: {event.status}</p>
                        <p>{formatRemainingSpots(event.remaining_spots)}</p>
                        <p>Coda: {event.waitlisted_count ?? 0}</p>
                        <p>Creatore: {event.creator_club_name || event.creator_display_name || event.creator_id}</p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                          href={`/e/${event.short_code}`}
                          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-black"
                        >
                          Apri evento
                        </Link>
                        <Link
                          href={`/eventi/${event.id}/modifica`}
                          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-black"
                        >
                          Modifica come creatore
                        </Link>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <form
                        method="post"
                        action={`/api/admin/events/${event.id}/update`}
                        className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            name="sport_emoji"
                            defaultValue={event.sport_emoji}
                            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black"
                          />
                          <input
                            name="sport"
                            defaultValue={event.sport}
                            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black"
                          />
                        </div>

                        <input
                          name="title"
                          defaultValue={event.title}
                          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            name="date"
                            defaultValue={toItalyDateInputValue(event.starts_at)}
                            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black"
                          />
                          <input
                            type="time"
                            name="time"
                            defaultValue={toItalyTimeInputValue(event.starts_at)}
                            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black"
                          />
                        </div>

                        <input
                          name="location_name"
                          defaultValue={event.location_name}
                          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black"
                        />

                        <input
                          name="city"
                          defaultValue={event.city}
                          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            min={2}
                            name="total_spots"
                            defaultValue={event.total_spots}
                            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black"
                          />
                          <select
                            name="status"
                            defaultValue={event.status}
                            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black"
                          >
                            <option value="active">Attivo</option>
                            <option value="cancelled">Annullato</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <select
                            name="entry_type"
                            defaultValue={event.entry_type}
                            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black"
                          >
                            <option value="approval">Su autorizzazione</option>
                            <option value="open">Ingresso libero</option>
                          </select>
                          <select
                            name="skill_level"
                            defaultValue={event.skill_level || "amatoriale"}
                            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black"
                          >
                            <option value="amatoriale">Amatoriale</option>
                            <option value="intermedio">Intermedio</option>
                            <option value="esperto">Esperto</option>
                          </select>
                        </div>

                        <textarea
                          name="notes"
                          defaultValue={event.notes ?? ""}
                          rows={3}
                          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black"
                        />

                        <button
                          type="submit"
                          className="w-full rounded-xl bg-black px-4 py-2 text-sm font-medium !text-white"
                        >
                          Salva evento
                        </button>
                      </form>

                      <form
                        method="post"
                        action={`/api/admin/events/${event.id}/delete`}
                        className="space-y-2 rounded-2xl border border-red-100 bg-red-50 p-3"
                      >
                        <input
                          name="reason"
                          placeholder="Motivo eliminazione"
                          required
                          className="w-full rounded-xl border border-red-200 bg-white px-4 py-2 text-sm text-black"
                        />

                        <button
                          type="submit"
                          className="w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-medium !text-white"
                        >
                          Elimina evento
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
