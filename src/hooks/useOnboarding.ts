import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export function useOnboarding() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    if (!user) return false;
    return localStorage.getItem(`onboarding_dismissed_${user.id}`) === "true";
  });

  const { data: workspaceData, isLoading } = useQuery({
    queryKey: ["onboarding-workspace", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("workspace_settings")
        .select("company_name")
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !dismissed,
    staleTime: 60_000,
  });

  // Show onboarding if workspace has no company name configured yet
  const hasCompletedSetup = !!workspaceData?.company_name;

  const shouldShow = !dismissed && !isLoading && !hasCompletedSetup && !!user;

  const dismiss = () => {
    if (user) localStorage.setItem(`onboarding_dismissed_${user.id}`, "true");
    setDismissed(true);
  };

  return { shouldShow, dismiss, isLoading };
}
