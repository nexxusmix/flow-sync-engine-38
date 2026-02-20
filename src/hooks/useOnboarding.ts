import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

export function useOnboarding() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("onboarding_dismissed") === "true";
  });

  const { data: projectCount, isLoading } = useQuery({
    queryKey: ["onboarding-projects", user?.id],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("projects")
        .select("id", { count: "exact", head: true });
      return count ?? 0;
    },
    enabled: !!user && !dismissed,
    staleTime: 30_000,
  });

  const isNewUser = !!user && (() => {
    if (!user.created_at) return false;
    const createdAt = new Date(user.created_at);
    const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation < 48;
  })();

  const shouldShow =
    !dismissed &&
    !isLoading &&
    isNewUser &&
    (projectCount === 0 || projectCount === null);

  const dismiss = () => {
    localStorage.setItem("onboarding_dismissed", "true");
    setDismissed(true);
  };

  return { shouldShow, dismiss, isLoading };
}
