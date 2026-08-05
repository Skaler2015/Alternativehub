import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Deals data access. All reads are failure-safe (return [] on error) so a deals
 * outage never breaks a tool page or the homepage.
 */

const dealToolSelect = {
  id: true,
  title: true,
  description: true,
  discountLabel: true,
  couponCode: true,
  featured: true,
  endsAt: true,
  tool: { select: { slug: true, name: true, logoUrl: true, tagline: true } },
} satisfies Prisma.DealSelect;

export type DealCardData = Prisma.DealGetPayload<{ select: typeof dealToolSelect }>;

/** A deal is live if active and (no window, or now within [startsAt, endsAt]). */
function liveWhere(now: Date): Prisma.DealWhereInput {
  return {
    active: true,
    tool: { status: "PUBLISHED", deletedAt: null },
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
  };
}

/** All currently-live deals, featured first, then soonest to expire. */
export async function getActiveDeals(now: Date, limit = 60): Promise<DealCardData[]> {
  try {
    return await prisma.deal.findMany({
      where: liveWhere(now),
      orderBy: [{ featured: "desc" }, { endsAt: "asc" }, { createdAt: "desc" }],
      take: limit,
      select: dealToolSelect,
    });
  } catch {
    return [];
  }
}

/** Live deals for a single tool (shown on the tool detail page). */
export async function getDealsForTool(toolId: string, now: Date): Promise<DealCardData[]> {
  try {
    return await prisma.deal.findMany({
      where: { ...liveWhere(now), toolId },
      orderBy: [{ featured: "desc" }, { endsAt: "asc" }],
      take: 6,
      select: dealToolSelect,
    });
  } catch {
    return [];
  }
}

/** Admin listing — every deal regardless of state. */
export async function getAllDealsForAdmin() {
  return prisma.deal.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 300,
    select: {
      id: true,
      title: true,
      discountLabel: true,
      couponCode: true,
      url: true,
      featured: true,
      active: true,
      startsAt: true,
      endsAt: true,
      clicks: true,
      tool: { select: { name: true, slug: true } },
    },
  });
}
