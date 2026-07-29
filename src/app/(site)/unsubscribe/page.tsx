import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ status?: string }>;

export default async function UnsubscribePage({ searchParams }: { searchParams: SearchParams }) {
  const { status } = await searchParams;
  const ok = status === "ok";

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <span
        className={`flex size-16 items-center justify-center rounded-2xl ${
          ok ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
        }`}
      >
        {ok ? <CheckCircle2 className="size-8" /> : <XCircle className="size-8" />}
      </span>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">
        {ok ? "You're unsubscribed" : "Link not valid"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {ok
          ? "You won't receive the weekly digest anymore. Changed your mind? You can resubscribe anytime from the footer."
          : "This unsubscribe link is invalid or expired. If you keep getting emails, contact us and we'll remove you."}
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Back to home
        </Link>
        {!ok && (
          <Link href="/contact" className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40">
            Contact us
          </Link>
        )}
      </div>
    </div>
  );
}
