"use client";

import BrandHeader from "../../../components/BrandHeader";
import { createClient } from "../../../lib/supabase/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatDateTimeItaly } from "../../../lib/date-time";
import { sanitizeNextPath } from "../../../lib/auth-redirect";
import { SPORTS } from "../../../lib/sports";
import { CLUB_SERVICES } from "../../../lib/club-services";
import { toSlug } from "../../../lib/slug";

// Gli sport che un club puo dichiarare di offrire (esclusa "Altro evento").
const availableSports = SPORTS.filter(
  (sport) => sport.label !== "Altro evento"
).map((sport) => sport.label);

const availableServices = CLUB_SERVICES;

type EventPreview = {
  title: string;
  sport_emoji: string | null;
  starts_at: string;
  city: string | null;
  location_name: string | null;
  remaining_spots: number | null;
  status: string | null;
};

function formatEventDate(date: string) {
  return formatDateTimeItaly(date);
}

function formatAvailability(remainingSpots: number | null, status: string | null) {
  if (status !== "active") {
    return "Evento non disponibile";
  }

  if (!remainingSpots || remainingSpots <= 0) {
    return "Evento completo: puoi metterti in coda";
  }

  if (remainingSpots === 1) {
    return "Ultimo posto disponibile";
  }

  return `Mancano ${remainingSpots} posti disponibili`;
}

export default function QuickSignupForm() {
  const searchParams = useSearchParams();
  const event = searchParams.get("event");
  const nextParam = searchParams.get("next");
  const errorParam = searchParams.get("error");

  // Se l'utente arriva dalla rivendicazione di un club, deve creare un account
  // PERSONALE: rivendicare non serve a creare un nuovo club (che sarebbe un
  // doppione), ma a collegare la scheda esistente al proprio profilo.
  const isClaimFlow = Boolean(nextParam && nextParam.includes("/rivendica"));

  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [accountType, setAccountType] = useState<"privato" | "circolo">(
    "privato"
  );
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [clubName, setClubName] = useState("");
  const [clubAddress, setClubAddress] = useState("");
  const [clubWhatsapp, setClubWhatsapp] = useState("");
  const [clubEmail, setClubEmail] = useState("");
  const [clubWebsite, setClubWebsite] = useState("");
  const [clubInstagram, setClubInstagram] = useState("");
  const [clubSports, setClubSports] = useState<string[]>([]);
  const [clubServices, setClubServices] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  function toggleSelection(
    value: string,
    selected: string[],
    setter: (values: string[]) => void
  ) {
    if (selected.includes(value)) {
      setter(selected.filter((item) => item !== value));
      return;
    }
    setter([...selected, value]);
  }

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    errorParam === "link-non-valido"
      ? "Il link di accesso non e piu valido o e gia stato usato. Accedi di nuovo."
      : ""
  );
  const [eventPreview, setEventPreview] = useState<EventPreview | null>(null);
  const [eventPreviewLoading, setEventPreviewLoading] = useState(false);
  const [eventPreviewError, setEventPreviewError] = useState("");

  useEffect(() => {
    if (!event) {
      setEventPreview(null);
      setEventPreviewError("");
      return;
    }

    let ignore = false;

    async function loadEventPreview() {
      setEventPreviewLoading(true);
      setEventPreviewError("");

      const { data, error } = await supabase
        .from("event_with_counts")
        .select(
          "title, sport_emoji, starts_at, city, location_name, remaining_spots, status"
        )
        .eq("short_code", event)
        .single();

      if (ignore) {
        return;
      }

      setEventPreviewLoading(false);

      if (error || !data) {
        setEventPreview(null);
        setEventPreviewError(
          "Non siamo riusciti a caricare il riepilogo dell'evento."
        );
        return;
      }

      setEventPreview(data);
    }

    loadEventPreview();

    return () => {
      ignore = true;
    };
  }, [event, supabase]);

  async function uploadAvatar(userId: string) {
    if (!avatarFile) {
      return null;
    }

    const fileExt = avatarFile.name.split(".").pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, {
        upsert: true,
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function continueWithEmailPassword() {
    setLoading(true);
    setErrorMessage("");

    const next = event
      ? `/e/${event}?join=1`
      : sanitizeNextPath(nextParam, "/profilo");

    try {
      if (mode === "signup") {
        if (!email || !password) {
          setErrorMessage("Inserisci email e password.");
          setLoading(false);
          return;
        }

        if (password.length < 8) {
          setErrorMessage("La password deve avere almeno 8 caratteri.");
          setLoading(false);
          return;
        }

        if (!displayName.trim()) {
          setErrorMessage("Inserisci il tuo nome.");
          setLoading(false);
          return;
        }

        if (accountType === "circolo" && !clubName.trim()) {
          setErrorMessage("Inserisci il nome del circolo.");
          setLoading(false);
          return;
        }

        const isCircolo = accountType === "circolo";

        // Per i circoli generiamo subito uno slug univoco usato come URL
        // pubblica (es. /club/motori-dei-marsi). In caso di duplicato
        // aggiungiamo un contatore -2, -3, ecc.
        let clubSlug: string | null = null;
        if (isCircolo) {
          const baseSlug =
            toSlug(clubName.trim() || displayName.trim()) || "club";
          for (let counter = 1; counter <= 100; counter++) {
            const candidate = counter === 1 ? baseSlug : `${baseSlug}-${counter}`;
            const { count: existing } = await supabase
              .from("profiles")
              .select("id", { count: "exact", head: true })
              .eq("slug", candidate);
            if (!existing) {
              clubSlug = candidate;
              break;
            }
          }
          if (!clubSlug) {
            clubSlug = `${baseSlug}-${Date.now().toString(36)}`;
          }
        }

        const clubFields = {
          club_name: isCircolo ? clubName.trim() || null : null,
          club_address: isCircolo ? clubAddress.trim() || null : null,
          club_whatsapp: isCircolo ? clubWhatsapp.trim() || null : null,
          club_email: isCircolo ? clubEmail.trim() || null : null,
          club_website: isCircolo ? clubWebsite.trim() || null : null,
          club_instagram: isCircolo ? clubInstagram.trim() || null : null,
          club_sports: isCircolo ? clubSports : [],
          club_services: isCircolo ? clubServices : [],
          slug: clubSlug,
        };

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName.trim() || null,
              account_type: accountType,
              phone: phone.trim() || null,
              city: city.trim() || null,
              bio: bio.trim() || null,
              monthly_event_limit_override: 5,
              ...clubFields,
            },
          },
        });

        if (error) {
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }

        const user = data.user;

        if (!user) {
          setErrorMessage("Account creato. Controlla la tua email per confermare l'accesso.");
          setLoading(false);
          return;
        }

        let avatarUrl: string | null = null;

        if (data.session) {
          avatarUrl = await uploadAvatar(user.id);

          await supabase
            .from("profiles")
            .update({
              display_name: displayName.trim() || null,
              account_type: accountType,
              phone: phone.trim() || null,
              city: city.trim() || null,
              bio: bio.trim() || null,
              monthly_event_limit_override: 5,
              ...clubFields,
              avatar_url: avatarUrl,
            })
            .eq("id", user.id);
        }

        window.location.assign(next);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      window.location.assign(next);
    } catch (error: any) {
      setErrorMessage(error.message || "Si è verificato un errore.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-white px-6 py-8 text-black">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-6">
          <BrandHeader />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          {event ? "Accedi per unirti" : "Accedi a mancauno.it"}
        </h1>

        <p className="mt-2 text-gray-600">
          {event
            ? "Accedi o crea un account: poi invieremo automaticamente la tua richiesta."
            : "Accedi o crea un account per partecipare agli eventi."}
        </p>

        {event ? (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            {eventPreviewLoading ? (
              <p className="text-sm text-gray-600">
                Caricamento evento...
              </p>
            ) : eventPreview ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Stai per unirti a
                </p>

                <div className="mt-3 flex items-start gap-3">
                  <div className="text-3xl">
                    {eventPreview.sport_emoji || "?"}
                  </div>

                  <div className="min-w-0">
                    <h2 className="font-semibold text-black">
                      {eventPreview.title}
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                      {formatEventDate(eventPreview.starts_at)}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      {[eventPreview.location_name, eventPreview.city]
                        .filter(Boolean)
                        .join(", ")}
                    </p>

                    <p className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
                      {formatAvailability(
                        eventPreview.remaining_spots,
                        eventPreview.status
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {eventPreviewError || "Evento non trovato."}
              </p>
            )}

            <Link
              href={`/e/${event}`}
              className="mt-4 block text-sm font-medium text-black underline underline-offset-4"
            >
              Rivedi la pagina evento
            </Link>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-lg px-3 py-2 text-sm ${
              mode === "login" ? "bg-white shadow-sm" : "text-gray-600"
            }`}
          >
            Accedi
          </button>

          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-lg px-3 py-2 text-sm ${
              mode === "signup" ? "bg-white shadow-sm" : "text-gray-600"
            }`}
          >
            Registrati
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {mode === "signup" ? (
            <>
              {isClaimFlow ? (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                  Stai per rivendicare un club. Crea qui il tuo{" "}
                  <strong>account personale</strong>: dopo l&apos;approvazione
                  gestirai la scheda del club direttamente da questo account,
                  senza crearne una nuova.
                </div>
              ) : (
                <label className="block">
                  <span className="text-sm font-medium">Tipo account</span>

                  <select
                    value={accountType}
                    onChange={(event) =>
                      setAccountType(
                        event.target.value as "privato" | "circolo"
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
                  >
                    <option value="privato">Utente privato</option>
                    <option value="circolo">Circolo</option>
                  </select>
                </label>
              )}

              {!isClaimFlow && accountType === "circolo" ? (
                <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-black">
                      Dati del circolo
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      Compila qui sotto il profilo del club. Questi campi
                      appariranno sulla pagina pubblica del circolo e li potrai
                      modificare in qualsiasi momento dal tuo profilo.
                    </p>
                  </div>

                  <input
                    type="text"
                    placeholder="Nome circolo"
                    value={clubName}
                    onChange={(event) => setClubName(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
                  />

                  <input
                    type="text"
                    placeholder="Nome pubblico / referente"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
                  />

                  <input
                    type="text"
                    placeholder="Indirizzo (Via Roma 10)"
                    value={clubAddress}
                    onChange={(event) => setClubAddress(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
                  />

                  <input
                    type="text"
                    placeholder="Citta"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="tel"
                      placeholder="Telefono"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
                    />
                    <input
                      type="tel"
                      placeholder="WhatsApp"
                      value={clubWhatsapp}
                      onChange={(event) => setClubWhatsapp(event.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
                    />
                  </div>

                  <input
                    type="email"
                    placeholder="Email club (info@club.it)"
                    value={clubEmail}
                    onChange={(event) => setClubEmail(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
                  />

                  <input
                    type="url"
                    placeholder="Sito web (https://www.tuoclub.it)"
                    value={clubWebsite}
                    onChange={(event) => setClubWebsite(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
                  />

                  <input
                    type="url"
                    placeholder="Instagram (https://instagram.com/tuoclub)"
                    value={clubInstagram}
                    onChange={(event) => setClubInstagram(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
                  />

                  <div>
                    <span className="text-sm font-medium">
                      Sport disponibili
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {availableSports.map((sport) => (
                        <button
                          key={sport}
                          type="button"
                          onClick={() =>
                            toggleSelection(sport, clubSports, setClubSports)
                          }
                          className={`rounded-full px-3 py-1 text-sm font-medium ${
                            clubSports.includes(sport)
                              ? "bg-black !text-white"
                              : "border border-gray-200 bg-white text-gray-700"
                          }`}
                        >
                          {sport}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-medium">Servizi</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {availableServices.map((service) => (
                        <button
                          key={service}
                          type="button"
                          onClick={() =>
                            toggleSelection(
                              service,
                              clubServices,
                              setClubServices
                            )
                          }
                          className={`rounded-full px-3 py-1 text-sm font-medium ${
                            clubServices.includes(service)
                              ? "bg-black !text-white"
                              : "border border-gray-200 bg-white text-gray-700"
                          }`}
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    placeholder="Bio: descrivi il circolo, gli sport offerti, i servizi"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
                  />
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Nome"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
                  />

                  <input
                    type="tel"
                    placeholder="Telefono opzionale"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
                  />
                </>
              )}

              <label className="block rounded-xl border border-dashed border-gray-300 bg-white p-4">
                <span className="text-sm font-medium">Foto profilo</span>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setAvatarFile(event.target.files?.[0] ?? null)
                  }
                  className="mt-3 block w-full text-sm text-gray-600"
                />

                {avatarFile ? (
                  <p className="mt-2 text-xs text-gray-500">
                    File selezionato: {avatarFile.name}
                  </p>
                ) : null}
              </label>
            </>
          ) : null}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
          />

          {errorMessage ? (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            onClick={continueWithEmailPassword}
            disabled={loading || !email || !password}
            className="w-full rounded-xl bg-black px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Attendi..."
              : mode === "login"
                ? "Accedi"
                : "Crea account"}
          </button>

          {mode === "login" ? (
            <Link
              href="/auth/forgot-password"
              className="block text-center text-sm text-gray-600 underline"
            >
              Hai dimenticato la password?
            </Link>
          ) : null}

          <Link
            href="/"
            className="block text-center text-sm text-gray-500 underline"
          >
            Torna alla homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
