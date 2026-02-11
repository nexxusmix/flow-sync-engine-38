import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|avif|svg|bmp)$/i;

export function useProjectMedia(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-media", projectId],
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<string[]> => {
      if (!projectId) return [];

      const urls: string[] = [];

      // 1. Project files that are images
      const { data: files } = await supabase
        .from("project_files")
        .select("file_url, file_type, name")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (files) {
        for (const f of files) {
          const isImage =
            f.file_type?.startsWith("image/") ||
            IMAGE_EXTENSIONS.test(f.name || "") ||
            IMAGE_EXTENSIONS.test(f.file_url || "");
          if (isImage && f.file_url) urls.push(f.file_url);
        }
      }

      // 2. Portal deliverable thumbnails
      const { data: portalLinks } = await supabase
        .from("portal_links")
        .select("id")
        .eq("project_id", projectId)
        .limit(5);

      if (portalLinks && portalLinks.length > 0) {
        const linkIds = portalLinks.map((l) => l.id);
        const { data: deliverables } = await supabase
          .from("portal_deliverables")
          .select("thumbnail_url, file_url, type")
          .in("portal_link_id", linkIds)
          .order("created_at", { ascending: false })
          .limit(20);

        if (deliverables) {
          for (const d of deliverables) {
            if (d.thumbnail_url) urls.push(d.thumbnail_url);
            else if (d.file_url && IMAGE_EXTENSIONS.test(d.file_url)) urls.push(d.file_url);
          }
        }
      }

      // Deduplicate
      return [...new Set(urls)];
    },
  });
}
