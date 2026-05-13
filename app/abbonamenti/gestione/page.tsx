import Link from "next/link";
import { redirect } from "next/navigation";
import AppHeaderServer from "../../../components/AppHeaderServer";
import BrandHeader from "../../../components/BrandHeader";
import LogoutButton from "../../profilo/LogoutButton";
import { createClient } from "../../../lib/supabase/server";

export default async function GestioneAbbonamentoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/quick-signup?next=/abbonamenti");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, account_type, account_plan, club_name")
    .eq("id", user.id)
    .single();

  const profileName =
    profile?.account_type === "circolo" && profile.club_name
      ? profile.club_name
      : profile?.display_name || user.email || "Il tuo profilo";
  const isPro = profile?.account_plan === "pro";

  return (
    <main className="mx-auto min-h-screen max-w-md px-6 py-8">
      <AppHeaderServer />

      <div className="mb-8">
        <BrandHeader />
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.06em] text-blue-600">
          Ritorno da Stripe
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          Gestione abbonamento
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Sei rientrato dal portale Stripe. Il browser e ancora collegato a
          questo account:
        </p>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Account attuale
          </p>
          <p className="mt-1 text-lg font-black text-slate-950">
            {profileName}
          </p>
          <p className="mt-1 text-sm text-slate-600">{user.email}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black !text-white">
              {profile?.account_type === "circolo" ? "Club" : "Privato"}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${
                isPro
                  ? "bg-green-100 text-green-800"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {isPro ? "Piano Pro attivo" : "Piano Free"}
            </span>
          </div>
        </div>

        <p className="mt-4 rounded-2xl bg-orange-50 p-4 text-sm leading-6 text-orange-800">
          Se hai annullato l&apos;abbonamento ma vedi ancora il piano Pro, puo
          essere normale: Stripe puo mantenerlo attivo fino alla fine del
          periodo gia pagato. Se invece stai testando con account diversi, esci
          e rientra con l&apos;account corretto.
        </p>

        <div className="mt-6 grid gap-3">
          <Link
            href="/profilo"
            className="rounded-2xl bg-slate-950 px-5 py-3 text-center font-black !text-white"
          >
            Vai al profilo
          </Link>

          <Link
            href="/abbonamenti"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center font-bold text-slate-950"
          >
            Torna agli abbonamenti
          </Link>

          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
