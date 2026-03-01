import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useInsightsReports() {
  return useQuery({
    queryKey: ['instagram-insights-reports'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('instagram_insights_reports' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useSaveInsightsReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (report: {
      input_text: string;
      input_files: any[];
      command: string | null;
      report_json: any;
      report_type: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase
        .from('instagram_insights_reports' as any)
        .insert({
          user_id: user.id,
          ...report,
        });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instagram-insights-reports'] }),
    onError: (e: any) => toast.error(e.message),
  });
}
