import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'comercial' | 'operacao' | 'financeiro';

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export function useUserRole() {
  const { user } = useAuth();

  const { data: roles, isLoading, error } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_role_assignments')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as UserRoleAssignment[];
    },
    enabled: !!user?.id,
  });

  const hasRole = (role: AppRole): boolean => {
    return roles?.some(r => r.role === role) ?? false;
  };

  const isAdmin = hasRole('admin');
  const primaryRole = roles?.[0]?.role ?? 'operacao';

  return {
    roles,
    isLoading,
    error,
    hasRole,
    isAdmin,
    primaryRole,
  };
}
