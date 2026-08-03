import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/authz";
import { rateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications";

type Params = Promise<{ id: string }>;

/** Follow a user. */
export async function POST(_req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { id } = await params;
  if (id === user.id) return NextResponse.json({ error: "You can't follow yourself" }, { status: 400 });

  const rl = await rateLimit(`follow:${user.id}`, 60, 3600);
  if (!rl.success) return NextResponse.json({ error: "Too many actions — slow down" }, { status: 429 });

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, isBanned: true } });
  if (!target || target.isBanned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: user.id, followingId: id } },
    select: { followerId: true },
  });

  if (!existing) {
    await prisma.follow.create({ data: { followerId: user.id, followingId: id } });
    void notify({
      userId: id,
      type: "SYSTEM",
      title: `${user.name ?? "Someone"} started following you`,
      body: "Check out their profile and follow back.",
      link: `/u/${user.id}`,
    });
  }

  const followers = await prisma.follow.count({ where: { followingId: id } });
  return NextResponse.json({ ok: true, following: true, followers }, { status: 201 });
}

/** Unfollow a user. */
export async function DELETE(_req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { id } = await params;
  await prisma.follow
    .delete({ where: { followerId_followingId: { followerId: user.id, followingId: id } } })
    .catch(() => null);

  const followers = await prisma.follow.count({ where: { followingId: id } });
  return NextResponse.json({ ok: true, following: false, followers });
}
