import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/misc";
import { UserRoleActions } from "@/components/admin/user-role-actions";
import { requireRole } from "@/lib/authz";
import { getInitials, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = await requireRole("ADMIN");
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, name: true, email: true, image: true, role: true,
      isBanned: true, createdAt: true,
      _count: { select: { reviews: true, submittedTools: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">Role management & moderation</p>
      </div>

      <div className="divide-y rounded-2xl border bg-card">
        {users.map((user) => (
          <div key={user.id} className="flex flex-wrap items-center gap-3 p-4">
            <Avatar>
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback>{getInitials(user.name ?? user.email)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{user.name ?? "—"}</span>
                <Badge
                  variant={
                    user.role === "ADMIN" ? "gradient" : user.role === "MODERATOR" ? "default" : "secondary"
                  }
                >
                  {user.role.toLowerCase()}
                </Badge>
                {user.isBanned && <Badge variant="destructive">banned</Badge>}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {user.email} · joined {timeAgo(user.createdAt)} · {user._count.reviews} reviews ·{" "}
                {user._count.submittedTools} submissions
              </p>
            </div>
            {user.id !== admin.id && (
              <UserRoleActions userId={user.id} role={user.role} isBanned={user.isBanned} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
