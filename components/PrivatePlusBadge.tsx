import Image from "next/image";

type PrivatePlusBadgeProps = {
  compact?: boolean;
  className?: string;
};

export default function PrivatePlusBadge({
  compact = false,
  className = "",
}: PrivatePlusBadgeProps) {
  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-black text-orange-700 ring-1 ring-orange-200 ${className}`}
        title="Privato Plus premium"
      >
        <Image
          src="/private-plus.png"
          alt="Privato Plus premium"
          width={22}
          height={22}
          className="h-5 w-5 rounded-full object-contain"
        />
        <span>✚ Plus premium</span>
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-orange-200 ${className}`}
      title="Privato Plus premium"
    >
      <Image
        src="/private-plus.png"
        alt="Privato Plus premium"
        width={58}
        height={58}
        className="h-12 w-12 rounded-xl object-contain"
      />
      <div className="leading-tight">
        <p className="text-sm font-black text-orange-700">Privato Plus</p>
        <p className="text-xs font-semibold text-cyan-700">premium</p>
      </div>
    </div>
  );
}
