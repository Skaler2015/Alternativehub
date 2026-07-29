import { NextResponse } from "next/server";
import { searchTools } from "@/lib/search";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const rl = await rateLimit(`search:${getClientIp(req)}`, 60, 60);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category") ?? undefined;

  if (!q) return NextResponse.json({ hits: [] });

  try {
    const { hits, source } = await searchTools(q.slice(0, 100), { category, limit: 8 });
    return NextResponse.json(
      { hits, source },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
    );
  } catch {
    return NextResponse.json({ hits: [] });
  }
}
