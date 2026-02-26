import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PresenceUser {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  online_at: string;
}

export function useWorkspacePresence() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel("workspace-presence", {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users: PresenceUser[] = [];
        for (const key of Object.keys(state)) {
          const presences = state[key];
          if (presences && presences.length > 0) {
            users.push(presences[0]);
          }
        }
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Anônimo",
            avatar_url: user.user_metadata?.avatar_url || null,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const isOnline = (userId: string) => onlineUsers.some((u) => u.user_id === userId);

  return { onlineUsers, isOnline };
}
