import { prisma } from "@/lib/prisma";
import { sendPush } from "@/lib/push";
import type { NotificationType } from "@prisma/client";

/**
 * Notification helper. Creating a notification must never break the action that
 * triggered it, so everything here is failure-safe.
 */
export async function notify(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      },
    });
    // Best-effort browser/OS push (no-op without VAPID keys).
    void sendPush(input.userId, { title: input.title, body: input.body, url: input.link ?? "/" });
  } catch {
    // never propagate
  }
}

/** Notify a tool's submitter when its listing is approved or rejected. */
export async function notifyToolStatus(toolId: string, approved: boolean): Promise<void> {
  try {
    const tool = await prisma.tool.findUnique({
      where: { id: toolId },
      select: { name: true, slug: true, submittedById: true },
    });
    if (!tool?.submittedById) return;
    await notify({
      userId: tool.submittedById,
      type: approved ? "TOOL_APPROVED" : "TOOL_REJECTED",
      title: approved ? `“${tool.name}” was approved 🎉` : `“${tool.name}” was not approved`,
      body: approved
        ? "Your submitted tool is now live on AlternativeHub."
        : "Your submitted tool didn't meet the listing guidelines this time.",
      link: approved ? `/tools/${tool.slug}` : "/dashboard",
    });
  } catch {
    // ignore
  }
}
