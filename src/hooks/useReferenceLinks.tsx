import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InstagramReference } from "@/types/marketing";
import { ReferenceLink, ReferenceEntityType, ReferenceLinkWithDetails } from "@/types/reference-links";
import { toast } from "sonner";

export function useReferenceLinks(entityType: ReferenceEntityType, entityId: string) {
  const [links, setLinks] = useState<ReferenceLinkWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLinks = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reference_links')
        .select(`
          *,
          reference:instagram_references(
            id, thumbnail_url, media_url, permalink, caption, note, media_type, tags
          )
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks((data || []) as ReferenceLinkWithDetails[]);
    } catch (err) {
      console.error('Error fetching reference links:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  const linkReference = useCallback(async (referenceId: string) => {
    try {
      const { data, error } = await supabase
        .from('reference_links')
        .insert({
          reference_id: referenceId,
          entity_type: entityType,
          entity_id: entityId,
        })
        .select(`
          *,
          reference:instagram_references(
            id, thumbnail_url, media_url, permalink, caption, note, media_type, tags
          )
        `)
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('Esta referência já está vinculada');
          return false;
        }
        throw error;
      }

      setLinks(prev => [data as ReferenceLinkWithDetails, ...prev]);
      toast.success('Referência vinculada!');
      return true;
    } catch (err) {
      console.error('Error linking reference:', err);
      toast.error('Erro ao vincular referência');
      return false;
    }
  }, [entityType, entityId]);

  const unlinkReference = useCallback(async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('reference_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      setLinks(prev => prev.filter(l => l.id !== linkId));
      toast.success('Referência desvinculada');
      return true;
    } catch (err) {
      console.error('Error unlinking reference:', err);
      toast.error('Erro ao desvincular');
      return false;
    }
  }, []);

  const getLinkedReferenceIds = useCallback(() => {
    return links.map(l => l.reference_id);
  }, [links]);

  return {
    links,
    isLoading,
    fetchLinks,
    linkReference,
    unlinkReference,
    getLinkedReferenceIds,
    count: links.length,
  };
}

// Hook for getting reference count for an entity (lightweight)
export function useReferenceLinkCount(entityType: ReferenceEntityType, entityId: string) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    setIsLoading(true);
    try {
      const { count: total, error } = await supabase
        .from('reference_links')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (error) throw error;
      setCount(total || 0);
    } catch (err) {
      console.error('Error fetching reference count:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  return { count, isLoading, fetchCount };
}
