import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|avif|svg|bmp)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|avi|mkv)$/i;

export type MediaItemType = "image" | "video" | "file";

export interface MediaItem {
  url: string;
  type: MediaItemType;
  title?: string;
  sourceType?: "file" | "deliverable" | "banner" | "cover" | "logo";
}

function detectMediaType(url: string, mimeType?: string | null): MediaItemType {
  if (mimeType?.startsWith("video/") || VIDEO_EXTENSIONS.test(url)) return "video";
  if (mimeType?.startsWith("image/") || IMAGE_EXTENSIONS.test(url)) return "image";
  return "file";
}

export function useProjectMedia(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-media", projectId],
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<MediaItem[]> => {
      if (!projectId) return [];

      const items: MediaItem[] = [];

      // 1. Project files (images + videos)
      const { data: files } = await supabase
        .from("project_files")
        .select("file_url, file_type, name")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (files) {
        for (const f of files) {
          const mt = detectMediaType(f.file_url || "", f.file_type);
          if ((mt === "image" || mt === "video") && f.file_url) {
            items.push({ url: f.file_url, type: mt, title: f.name || undefined, sourceType: "file" });
          }
        }
      }

      // 2. Portal deliverable thumbnails & videos
      const { data: portalLinks } = await supabase
        .from("portal_links")
        .select("id")
        .eq("project_id", projectId)
        .limit(5);

      if (portalLinks && portalLinks.length > 0) {
        const linkIds = portalLinks.map((l) => l.id);
        const { data: deliverables } = await supabase
          .from("portal_deliverables")
          .select("thumbnail_url, file_url, type, title")
          .in("portal_link_id", linkIds)
          .order("created_at", { ascending: false })
          .limit(20);

        if (deliverables) {
          for (const d of deliverables) {
            if (d.file_url) {
              const mt = detectMediaType(d.file_url, d.type);
              if (mt === "video") {
                items.push({ url: d.file_url, type: "video", title: d.title || undefined, sourceType: "deliverable" });
                continue;
              }
            }
            if (d.thumbnail_url) {
              items.push({ url: d.thumbnail_url, type: "image", title: d.title || undefined, sourceType: "deliverable" });
            } else if (d.file_url && IMAGE_EXTENSIONS.test(d.file_url)) {
              items.push({ url: d.file_url, type: "image", title: d.title || undefined, sourceType: "deliverable" });
            }
          }
        }
      }

      // Deduplicate by URL
      const seen = new Set<string>();
      return items.filter((item) => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
      });
    },
  });
}

/** Legacy compat: returns just URL strings */
export function useProjectMediaUrls(projectId: string | undefined) {
  const query = useProjectMedia(projectId);
  return {
    ...query,
    data: query.data?.map((item) => item.url),
  };
}
