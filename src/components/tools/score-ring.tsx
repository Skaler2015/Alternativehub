import { cn } from "@/lib/utils";

/** Circular score indicator (0–100) used for Alternative/AI/Trust scores. */
export function ScoreRing({
  score,
  label,
  size = 56,
  className,
}: {
  score: number;
  label: string;
  size?: number;
  className?: string;
}) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - clamped / 100);
  const color =
    clamped >= 80 ? "text-emerald-500" : clamped >= 60 ? "text-amber-500" : "text-rose-500";

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth="4"
            className="stroke-muted"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("stroke-current transition-all duration-700", color)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
          {Math.round(clamped)}
        </span>
      </div>
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
