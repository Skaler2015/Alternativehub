import { prisma } from "@/lib/prisma";

export function toolFavicon(url: string): string | null {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`;
  } catch {
    return null;
  }
}

/** Sync a tool's tags from an array of tag names (create missing, drop removed). */
export async function syncTags(toolId: string, names: string[]): Promise<void> {
  const wanted = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  const tagIds: string[] = [];
  for (const name of wanted) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) continue;
    const tag = await prisma.tag.upsert({ where: { slug }, create: { slug, name }, update: {} });
    tagIds.push(tag.id);
  }
  await prisma.toolTag.deleteMany({ where: { toolId, tagId: { notIn: tagIds } } });
  for (const tagId of tagIds) {
    await prisma.toolTag
      .upsert({ where: { toolId_tagId: { toolId, tagId } }, create: { toolId, tagId }, update: {} })
      .catch(() => {});
  }
}
