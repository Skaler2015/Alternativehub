import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  size = 14,
  className,
  showValue = false,
  reviewCount,
}: {
  rating: number;
  size?: number;
  className?: string;
  showValue?: boolean;
  reviewCount?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-flex gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            style={{ width: size, height: size }}
            className={cn(
              i <= Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted",
            )}
          />
        ))}
      </span>
      {showValue && (
        <span className="text-xs font-medium text-muted-foreground">
          {rating.toFixed(1)}
          {reviewCount !== undefined && ` (${reviewCount})`}
        </span>
      )}
    </span>
  );
}
