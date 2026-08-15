import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getOrCreateProject } from "@/lib/rank/data";
import { maskSecret } from "@/lib/rank/crypto";
import { RankSettingsForm, type RankSettingsData } from "@/components/admin/rank/settings-form";

export const dynamic = "force-dynamic";

export default async function RankSettingsPage() {
  const project = await getOrCreateProject();
  const cfg = await prisma.rankProviderConfig.findUnique({ where: { id: "default" } });

  const initial: RankSettingsData = {
    name: project.name,
    domain: project.domain,
    country: project.country,
    language: project.language,
    device: project.device,
    rankDepth: project.rankDepth,
    active: project.active,
    autoTracking: project.autoTracking,
    frequency: project.frequency,
    preferredHour: project.preferredHour,
    intervalDays: project.intervalDays,
    timezone: project.timezone,
    historyRetentionDays: project.historyRetentionDays,
    provider: cfg?.provider ?? "none",
    maskedApiKey: maskSecret(cfg?.apiKeyEnc),
    maskedApiSecret: maskSecret(cfg?.apiSecretEnc),
    endpoint: cfg?.endpoint ?? "",
    requestsPerMinute: cfg?.requestsPerMinute ?? 30,
    batchSize: cfg?.batchSize ?? 10,
    requestDelayMs: cfg?.requestDelayMs ?? 1200,
    maxRetries: cfg?.maxRetries ?? 3,
    dailyQuota: cfg?.dailyQuota ?? null,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/rank" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Rank Tracker
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure the tracked website, search options, automation and the rank provider.</p>
      </div>
      <Card>
        <CardContent className="p-6">
          <RankSettingsForm initial={initial} />
        </CardContent>
      </Card>
    </div>
  );
}
