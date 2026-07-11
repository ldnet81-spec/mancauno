import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import CookieBanner from "../components/CookieBanner";
import AppFooter from "../components/AppFooter";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://mancauno.it"
  ),
  applicationName: "mancauno.it",
  title: {
    default: "mancauno.it | Trova giocatori per eventi sportivi",
    template: "%s | mancauno.it",
  },
  description:
    "mancauno.it aiuta giocatori e circoli sportivi a completare partite, allenamenti e uscite condivise con eventi facili da creare, cercare e condividere.",
  keywords: [
    "eventi sportivi",
    "trova giocatori",
    "calcetto",
    "padel",
    "tennis",
    "basket",
    "running",
    "circoli sportivi",
    "sport in Italia",
  ],
  authors: [{ name: "Professional Business Consultancy" }],
  creator: "Professional Business Consultancy",
  publisher: "Professional Business Consultancy",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "mancauno.it | Trova giocatori per eventi sportivi",
    description:
      "Crea un evento, condividi il link e trova chi manca per completare il gruppo. Utile per giocatori, organizzatori e circoli sportivi.",
    url: "/",
    siteName: "mancauno.it",
    locale: "it_IT",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "mancauno.it",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "mancauno.it | Trova giocatori per eventi sportivi",
    description:
      "Trova partecipanti per partite, allenamenti e uscite sportive nella tua zona.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Le icone sono gestite via file convention di Next: app/favicon.ico,
  // app/icon.png e app/apple-icon.png (generati dall'emblema mancauno).
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>
        {children}
        <div className="mx-auto max-w-2xl px-6 pb-8">
          <AppFooter />
        </div>
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
