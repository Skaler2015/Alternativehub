import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2", className)} aria-label="AlternativeHub home">
      <span className="relative flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 text-white shadow-md shadow-violet-500/25 transition-transform duration-300 group-hover:rotate-6">
        <svg viewBox="0 0 24 24" fill="none" className="size-4.5" aria-hidden>
          <path
            d="M7 17L12 5l5 12M8.8 13h6.4"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-lg font-bold tracking-tight">
        Alternative<span className="text-gradient">Hub</span>
      </span>
    </Link>
  );
}
