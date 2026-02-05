import { Sparkles } from "lucide-react";

export function WelcomeCard() {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Bom dia" : currentHour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="polo-card h-full">
      <div className="flex items-start justify-between">
        <div>
          <span className="polo-label">{greeting} 👋</span>
          <h1 className="text-2xl font-semibold mt-2 tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Visão geral do seu negócio
          </p>
        </div>
        <div className="p-3 rounded-xl bg-secondary border border-border">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
