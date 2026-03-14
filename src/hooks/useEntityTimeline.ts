import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TimelineEvent {
  id: string;
  entity_type: string;
  entity_id: string;
  parent_entity_type: string | null;
  parent_entity_id: string | null;
  related_project_id: string | null;
  event_type: string;
  title: string;
  description: string | null;
  status_from: string | null;
  status_to: string | null;
  visibility: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_type: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

interface UseEntityTimelineOptions {
  entityType: string;
  entityId?: string;
  /** Fetch events for a parent entity (e.g. all events in a project) */
  parentEntityType?: string;
  parentEntityId?: string;
  /** Fetch events by project */
  projectId?: string;
  /** Filter by visibility */
  visibility?: "internal" | "client" | "all";
  limit?: number;
  enabled?: boolean;
}

export function useEntityTimeline({
  entityType,
  entityId,
  parentEntityType,
  parentEntityId,
  projectId,
  visibility = "all",
  limit = 100,
  enabled = true,
}: UseEntityTimelineOptions) {
  return useQuery({
    queryKey: [
      "entity-timeline",
      entityType,
      entityId,
      parentEntityType,
      parentEntityId,
      projectId,
      visibility,
    ],
    queryFn: async () => {
      let query = supabase
        .from("timeline_events" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (entityId) {
        query = query.eq("entity_type", entityType).eq("entity_id", entityId);
      } else if (parentEntityType && parentEntityId) {
        query = query
          .eq("parent_entity_type", parentEntityType)
          .eq("parent_entity_id", parentEntityId);
      } else if (projectId) {
        query = query.eq("related_project_id", projectId);
      } else {
        query = query.eq("entity_type", entityType);
      }

      if (visibility !== "all") {
        query = query.eq("visibility", visibility);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as TimelineEvent[];
    },
    enabled: enabled && !!(entityId || (parentEntityType && parentEntityId) || projectId),
    staleTime: 30_000,
  });
}

/** Log a timeline event from client code */
export async function logTimelineEvent(event: {
  entityType: string;
  entityId: string;
  parentEntityType?: string;
  parentEntityId?: string;
  relatedProjectId?: string;
  eventType: string;
  title: string;
  description?: string;
  statusFrom?: string;
  statusTo?: string;
  visibility?: "internal" | "client";
  actorName?: string;
  metadata?: Record<string, any>;
}) {
  const { error } = await supabase.from("timeline_events" as any).insert({
    entity_type: event.entityType,
    entity_id: event.entityId,
    parent_entity_type: event.parentEntityType || null,
    parent_entity_id: event.parentEntityId || null,
    related_project_id: event.relatedProjectId || null,
    event_type: event.eventType,
    title: event.title,
    description: event.description || null,
    status_from: event.statusFrom || null,
    status_to: event.statusTo || null,
    visibility: event.visibility || "internal",
    actor_name: event.actorName || null,
    metadata: event.metadata || {},
  });

  if (error) console.error("Failed to log timeline event:", error);
}
