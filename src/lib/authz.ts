import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

/**
 * RBAC — role → permission mapping. Role checks stay on the JWT hot path;
 * this module is the single authority on what each role may do.
 */
export const PERMISSIONS = {
  USER: ["review.create", "bookmark.create", "tool.submit", "report.create"],
  MODERATOR: [
    "review.create", "bookmark.create", "tool.submit", "report.create",
    "tool.approve", "tool.reject", "review.moderate", "report.resolve",
  ],
  ADMIN: ["*"],
} as const satisfies Record<UserRole, readonly string[]>;

export function hasPermission(role: UserRole, permission: string): boolean {
  const perms: readonly string[] = PERMISSIONS[role];
  return perms.includes("*") || perms.includes(permission);
}

/** Server-side guard for authenticated pages. Redirects to /login. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/** Server-side guard for admin/moderator surfaces. */
export async function requireRole(...roles: UserRole[]) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!roles.includes(session.user.role)) redirect("/");
  return session.user;
}

/** API-route variant: returns null instead of redirecting. */
export async function getApiUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Audit trail for every privileged mutation. */
export async function logActivity(input: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        meta: input.meta as never,
      },
    });
  } catch {
    // audit logging must never break the mutation itself
  }
}
