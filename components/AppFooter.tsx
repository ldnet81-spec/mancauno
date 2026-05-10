import Link from "next/link";

export default function AppFooter() {
  return (
    <footer className="mt-12 border-t border-gray-200 pt-6 text-center text-xs text-gray-500">
      <p>
        Titolare del servizio:{" "}
        <a
          href="https://www.lucianodilauro.it"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-gray-700 underline decoration-gray-300 underline-offset-4"
        >
          Professional Business Consultancy
        </a>
      </p>
{/* 
      <p className="mt-2">
        Dati fiscali, sede legale e contatti privacy da completare prima della
        pubblicazione.
      </p>
*/}
      <nav className="mt-4 flex flex-wrap justify-center gap-3">
        <Link href="/privacy" className="underline underline-offset-4">
          Privacy Policy
        </Link>

        <Link href="/termini" className="underline underline-offset-4">
          Termini di Servizio
        </Link>
      </nav>
    </footer>
  );
}
