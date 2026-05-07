import Image from "next/image";
import Link from "next/link";

export default function BrandHeader() {
  return (
    <Link href="/" className="inline-flex items-center gap-3">
      <Image
        src="/logo-full.png"
        alt="mancauno.it"
        width={180}
        height={48}
        className="h-10 w-auto"
        priority
      />
    </Link>
  );
}