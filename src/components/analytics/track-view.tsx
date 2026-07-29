"use client";

import * as React from "react";
import { track, type TrackType, type TrackPayload } from "@/lib/analytics";

/**
 * Fires a single analytics event on mount. Drop into any server-rendered page
 * to record a typed view, e.g. <TrackView type="TOOL_VIEW" toolId={tool.id} />.
 */
export function TrackView({ type, toolId, query }: { type: TrackType; toolId?: string; query?: string }) {
  React.useEffect(() => {
    const payload: TrackPayload = { type, toolId, query };
    track(payload);
    // fire once per tool/type
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, toolId, query]);
  return null;
}
