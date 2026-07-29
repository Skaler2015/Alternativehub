/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type MediaItem = { id: string; url: string; alt: string | null; type: string };

export function ScreenshotGallery({ media, toolName }: { media: MediaItem[]; toolName: string }) {
  const [selected, setSelected] = React.useState<MediaItem | null>(null);
  const screenshots = media.filter((m) => m.type === "SCREENSHOT" || m.type === "BANNER");
  const video = media.find((m) => m.type === "VIDEO");

  if (screenshots.length === 0 && !video) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Screenshots & Media</h2>

      {video && (
        <div className="aspect-video overflow-hidden rounded-2xl border">
          <iframe
            src={video.url}
            title={`${toolName} video demo`}
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}

      {screenshots.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {screenshots.map((shot) => (
            <button
              key={shot.id}
              onClick={() => setSelected(shot)}
              className="shrink-0 overflow-hidden rounded-xl border transition-transform hover:scale-[1.02]"
            >
              <img
                src={shot.url}
                alt={shot.alt ?? `${toolName} screenshot`}
                className="h-44 w-auto object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-4xl p-2">
          <DialogTitle className="sr-only">{toolName} screenshot</DialogTitle>
          {selected && (
            <img
              src={selected.url}
              alt={selected.alt ?? `${toolName} screenshot`}
              className="w-full rounded-xl"
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
