import Image from "next/image";

type ClubProBadgeProps = {
  compact?: boolean;
  className?: string;
};

export default function ClubProBadge({
  compact = false,
  className = "",
}: ClubProBadgeProps) {
  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-black text-blue-700 ring-1 ring-cyan-200 ${className}`}
        title="Club Pro verificato"
      >
        <Image
          src="/club-pro-verified.png"
          alt="Club Pro verificato"
          width={22}
          height={22}
          className="h-5 w-5 rounded-full object-contain"
        />
        <span>✓ Pro verificato</span>
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-cyan-200 ${className}`}
      title="Club Pro verificato"
    >
      <Image
        src="/club-pro-verified.png"
        alt="Club Pro verificato"
        width={58}
        height={58}
        className="h-12 w-12 rounded-xl object-contain"
      />
      <div className="leading-tight">
        <p className="text-sm font-black text-blue-800">Club Pro</p>
        <p className="text-xs font-semibold text-cyan-700">verificato</p>
      </div>
    </div>
  );
}
