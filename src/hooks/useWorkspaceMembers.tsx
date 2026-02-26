import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WorkspaceMember {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export function useWorkspaceMembers() {
  return useQuery({
    queryKey: ['workspace-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .order('full_name');
      if (error) throw error;
      return (data as WorkspaceMember[]) || [];
    },
    staleTime: 60_000,
  });
}
