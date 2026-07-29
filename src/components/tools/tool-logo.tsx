/* eslint-disable @next/next/no-img-element */
import { cn, getInitials } from "@/lib/utils";

const GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-rose-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-sky-500 to-blue-600",
  "from-amber-500 to-red-500",
  "from-fuchsia-500 to-purple-600",
];

export function ToolLogo({
  name,
  logoUrl,
  size = 40,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
}) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        width={size}
        height={size}
        loading="lazy"
        className={cn("shrink-0 rounded-xl border bg-white object-contain p-1", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  const gradient = GRADIENTS[name.length % GRADIENTS.length];
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-bold text-white",
        gradient,
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {getInitials(name)}
    </span>
  );
}
