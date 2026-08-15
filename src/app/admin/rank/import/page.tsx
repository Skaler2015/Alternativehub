import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CsvImport } from "@/components/admin/rank/csv-import";

export const dynamic = "force-dynamic";

export default function RankImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/rank" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Rank Tracker
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Import keywords (CSV)</h1>
        <p className="text-sm text-muted-foreground">
          Upload or paste a CSV, map the columns, preview, then import. Existing keywords are never overwritten (upsert).
        </p>
      </div>
      <Card>
        <CardContent className="p-6">
          <CsvImport />
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Supported columns: <b>Keyword</b> (required), <b>Target URL</b>, <b>Group</b>. Duplicate keywords (in the file or already
        tracked) are skipped automatically.
      </p>
    </div>
  );
}
