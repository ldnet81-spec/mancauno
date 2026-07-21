import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import {
  findDuplicateClub,
  duplicateReasonLabel,
} from "../../../../lib/club-duplicates";

export const runtime = "nodejs";

// Verifica se esiste gia' una scheda club con questi dati.
// I dati dei club sono pubblici (directory /club), quindi la risposta non
// espone nulla di riservato: solo nome, citta' e slug della scheda esistente.
export async function POST(request: Request) {
  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    // Senza service role non possiamo verificare: non blocchiamo la creazione.
    return NextResponse.json({ duplicate: null });
  }

  let payload: {
    club_name?: string;
    city?: string;
    phone?: string;
    email?: string;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ duplicate: null });
  }

  const duplicate = await findDuplicateClub(adminSupabase, {
    clubName: payload.club_name,
    city: payload.city,
    phone: payload.phone,
    email: payload.email,
  });

  if (!duplicate) {
    return NextResponse.json({ duplicate: null });
  }

  return NextResponse.json({
    duplicate: {
      name: duplicate.name,
      city: duplicate.city,
      slug: duplicate.slug ?? duplicate.id,
      reason: duplicateReasonLabel(duplicate.reason),
    },
  });
}
