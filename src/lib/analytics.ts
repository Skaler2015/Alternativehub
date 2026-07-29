"use client";

/**
 * Lightweight, privacy-friendly client analytics.
 *
 * Fires small, fire-and-forget events to /api/track. Uses `navigator.sendBeacon`
 * when available (survives page unloads / navigations), falling back to a
 * keepalive fetch. No cookies, no PII — just aggregate product signals.
 */

export type TrackType =
  | "PAGE_VIEW"
  | "TOOL_VIEW"
  | "SEARCH"
  | "CLICK_OUT"
  | "AFFILIATE_CLICK"
  | "COMPARE_VIEW"
  | "SHARE";

export type TrackPayload = {
  type: TrackType;
  path?: string;
  toolId?: string;
  query?: string;
};

export function track(payload: TrackPayload): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({
      ...payload,
      path: payload.path ?? window.location.pathname + window.location.search,
    });
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/track", blob);
      return;
    }
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // never let analytics break the app
  }
}
