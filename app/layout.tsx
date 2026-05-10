import type { Metadata, Viewport } from "next";
import CookieBanner from "../components/CookieBanner";
import AppFooter from "../components/AppFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "mancauno.it",
  description:
    "Crea eventi sportivi, condividi il link e trova chi manca per completare il gruppo.",
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
        <div className="mx-auto max-w-2xl px-6 pb-28 sm:pb-8">
          <AppFooter />
        </div>
        <CookieBanner />
      </body>
    </html>
  );
}
