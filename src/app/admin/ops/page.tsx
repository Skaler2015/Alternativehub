import { Cpu, RefreshCw, Link2, Sparkles, Users, Wand2, PackagePlus } from "lucide-react";
import { OpsButton } from "@/components/admin/ops-button";
import { aiEnabled } from "@/lib/ai";
import { emailEnabled } from "@/lib/email";

export const dynamic = "force-dynamic";

const OPS = [
  { action: "recompute-scores", label: "Recompute scores", icon: RefreshCw, desc: "Recalculate trending, popularity, rating & trust scores for all published tools." },
  { action: "recompute-reputation", label: "Recompute reputation", icon: Users, desc: "Recalculate every contributor's reputation and badges." },
  { action: "check-links", label: "Check broken links", icon: Link2, desc: "Scan a batch of tool websites for dead links." },
  { action: "detect-alternatives", label: "Link alternatives", icon: Wand2, desc: "Find and link similar tools for listings that have none yet." },
];

export default function AdminOpsPage() {
  const ai = aiEnabled();
  const email = emailEnabled();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Cpu className="size-6 text-primary" /> Automation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          These run automatically every night. Use the buttons to trigger them on demand.
        </p>
      </div>

      <div className="space-y-3">
        {OPS.map((op) => (
          <div key={op.action} className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><op.icon className="size-4" /></span>
              <div>
                <p className="text-sm font-medium">{op.label}</p>
                <p className="text-xs text-muted-foreground">{op.desc}</p>
              </div>
            </div>
            <OpsButton action={op.action} label="Run" />
          </div>
        ))}

        {/* AI enrichment */}
        <div className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles className="size-4" /></span>
            <div>
              <p className="text-sm font-medium">AI enrich a batch</p>
              <p className="text-xs text-muted-foreground">
                Generate AI summaries & pros/cons for up to 10 un-enriched tools.
                {!ai && <span className="text-warning"> Requires GEMINI_API_KEY.</span>}
              </p>
            </div>
          </div>
          {ai ? <OpsButton action="enrich-batch" label="Run" /> : <span className="text-xs text-muted-foreground">Disabled</span>}
        </div>

        {/* AI daily generation */}
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary"><PackagePlus className="size-4" /></span>
            <div>
              <p className="text-sm font-medium">Generate new tools (AI)</p>
              <p className="text-xs text-muted-foreground">
                Discover &amp; publish up to 100 new, de-duplicated tools. Runs automatically daily at 4:00 UTC.
                {!ai && <span className="text-warning"> Requires GEMINI_API_KEY.</span>}
              </p>
            </div>
          </div>
          {ai ? <OpsButton action="generate-tools" label="Generate now" confirmText="Generate up to 100 new tools now? This may take up to a minute." /> : <span className="text-xs text-muted-foreground">Disabled</span>}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Email digest {email ? "is configured" : "needs RESEND_API_KEY"} — manage it from the Newsletter page.
      </p>
    </div>
  );
}
