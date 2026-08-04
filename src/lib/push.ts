import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/constants";

/**
 * Web Push (browser/OS notifications). Fully optional and graceful: with no
 * VAPID keys configured, everything is a no-op. Set VAPID_PUBLIC_KEY,
 * VAPID_PRIVATE_KEY (and NEXT_PUBLIC_VAPID_PUBLIC_KEY = the same public key)
 * to enable. Generate a pair with:  npx web-push generate-vapid-keys
 */
let configured = false;
function ensureConfigured(): boolean {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  if (!configured) {
    webpush.setVapidDetails(`mailto:${SITE.email}`, pub, priv);
    configured = true;
  }
  return true;
}

export function pushEnabled(): boolean {
  return !!process.env.VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY;
}

/** Send a push to all of a user's subscriptions. Dead subscriptions are pruned. */
export async function sendPush(
  userId: string,
  payload: { title: string; body?: string; url?: string },
): Promise<number> {
  if (!ensureConfigured()) return 0;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } }).catch(() => []);
  if (subs.length === 0) return 0;

  const data = JSON.stringify({
    title: payload.title,
    body: payload.body ?? "",
    url: payload.url ?? "/",
  });

  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data,
        );
        sent += 1;
      } catch (err: unknown) {
        const code = (err as { statusCode?: number }).statusCode;
        // 404/410 = subscription gone → remove it
        if (code === 404 || code === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        }
      }
    }),
  );
  return sent;
}
