import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect, useCallback, useRef } from "react";

export type MediaItemType = "image" | "video" | "external_video" | "file" | "link";
export type SourceType = "deliverable" | "file" | "link" | "project_banner" | "project_cover";

export interface ProjectMediaItem {
  id: string;
  project_id: string;
  source_type: SourceType;
  source_id: string | null;
  media_type: MediaItemType;
  title: string;
  thumb_url: string | null;
  media_url: string | null;
  external_url: string | null;
  duration_sec: number | null;
  status: string;
  pinned: boolean;
  sort_order: number;
  created_at: string;
}

/** YouTube/Vimeo thumbnail extraction */
function extractVideoThumbnail(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  // Vimeo - returns placeholder, actual thumbnail needs API call
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
  return null;
}

function isExternalVideo(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
}

/** Hook: consolidated media feed for a project from project_media_items table */
export function useProjectMediaFeed(projectId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["project-media-feed", projectId],
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<ProjectMediaItem[]> => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_media_items")
        .select("*")
        .eq("project_id", projectId)
        .eq("status", "active")
        .order("pinned", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as ProjectMediaItem[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel(`media-feed-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_media_items",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["project-media-feed", projectId] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId, queryClient]);

  return query;
}

/** Hook: persist and restore UI state (slide index etc.) */
export function useUiState(scope: string, scopeKey: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const query = useQuery({
    queryKey: ["ui-state", scope, scopeKey],
    enabled: !!user,
    staleTime: Infinity,
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("ui_state")
        .select("state")
        .eq("user_id", user.id)
        .eq("scope", scope)
        .eq("scope_key", scopeKey)
        .maybeSingle();
      return (data?.state as Record<string, any>) || null;
    },
  });

  const saveState = useCallback((state: Record<string, any>) => {
    if (!user) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await supabase
        .from("ui_state")
        .upsert(
          {
            user_id: user.id,
            scope,
            scope_key: scopeKey,
            state: state as any,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,scope,scope_key" }
        );
    }, 800);
  }, [user, scope, scopeKey]);

  return { state: query.data, saveState, isLoading: query.isLoading };
}

/** Add a media item to a project's feed */
export function useAddProjectMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<ProjectMediaItem, "id" | "created_at" | "status">) => {
      const { data, error } = await supabase
        .from("project_media_items")
        .insert({ ...item, status: "active" } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["project-media-feed", vars.project_id] });
    },
  });
}

export { extractVideoThumbnail, isExternalVideo };
