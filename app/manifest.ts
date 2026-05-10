import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "mancauno.it",
    short_name: "mancauno",
    description:
      "Trova giocatori per partite, allenamenti ed eventi sportivi nella tua zona.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "it",
    categories: ["sports", "social", "lifestyle"],
    icons: [
      {
        src: "/logo-full.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
