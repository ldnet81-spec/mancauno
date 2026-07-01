import type { SupabaseClient } from "@supabase/supabase-js";

// Carica il logo/immagine di un club nel bucket "avatars" usando il client
// admin (service-role): bypassa le RLS dello storage, necessario perche' l'id
// del club puo' essere diverso da quello dell'utente che sta caricando
// (schede create da admin o club rivendicati).
export async function uploadClubLogo(
  admin: SupabaseClient,
  clubId: string,
  file: File
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Carica un file immagine valido.");
  }

  if (file.size > 3 * 1024 * 1024) {
    throw new Error("L'immagine non puo superare 3 MB.");
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${clubId}/logo-${Date.now()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage.from("avatars").upload(path, bytes, {
    contentType: file.type,
    upsert: true,
    cacheControl: "0",
  });

  if (error) {
    throw error;
  }

  const { data } = admin.storage.from("avatars").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

// Estrae il file logo dal FormData, se presente e non vuoto.
export function getLogoFile(formData: FormData): File | null {
  const value = formData.get("logo");
  if (value instanceof File && value.size > 0) {
    return value;
  }
  return null;
}
