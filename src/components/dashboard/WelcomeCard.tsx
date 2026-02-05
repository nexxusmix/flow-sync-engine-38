import { Sparkles } from "lucide-react";

export function WelcomeCard() {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Bom dia" : currentHour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="bento-card bg-gradient-to-br from-card to-secondary/30">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{greeting}! 👋</p>
          <h1 className="text-2xl font-semibold mt-1 tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Visão geral do seu negócio
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-secondary">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
