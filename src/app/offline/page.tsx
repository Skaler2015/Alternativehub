import Link from "next/link";
import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "You're offline",
  robots: { index: false, follow: false },
};

export default async function OfflinePage() {
  const { t } = await getT();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <WifiOff className="size-8" />
      </span>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">{t("offline.title")}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t("offline.body")}</p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        {t("common.tryAgain")}
      </Link>
    </div>
  );
}
