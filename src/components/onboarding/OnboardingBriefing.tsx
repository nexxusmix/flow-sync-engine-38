import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BriefingAnswer } from "@/hooks/useClientOnboarding";

interface Props {
  answers: BriefingAnswer[];
  onSave: (id: string, answer: string) => void;
}

export function OnboardingBriefing({ answers, onSave }: Props) {
  const [editing, setEditing] = useState<Record<string, string>>({});

  if (answers.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-10">Nenhuma pergunta de briefing configurada</p>;
  }

  // Group by section
  const sections = answers.reduce<Record<string, BriefingAnswer[]>>((acc, a) => {
    const sec = a.section || "Geral";
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(a);
    return acc;
  }, {});

  const answered = answers.filter((a) => a.answer).length;

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="material-symbols-rounded text-sm">quiz</span>
        {answered} de {answers.length} perguntas respondidas
      </div>

      {Object.entries(sections).map(([section, items]) => (
        <div key={section} className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{section}</h3>
          {items.map((item) => {
            const localVal = editing[item.id];
            const hasChange = localVal !== undefined && localVal !== (item.answer || "");

            return (
              <div key={item.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  {item.question_label}
                  {item.answer && (
                    <span className="material-symbols-rounded text-emerald-500 text-sm">check_circle</span>
                  )}
                </label>
                <Textarea
                  value={localVal ?? item.answer ?? ""}
                  onChange={(e) => setEditing((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  placeholder="Digite a resposta..."
                  className="min-h-[60px] text-sm"
                />
                {hasChange && (
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        onSave(item.id, localVal!);
                        setEditing((prev) => {
                          const n = { ...prev };
                          delete n[item.id];
                          return n;
                        });
                      }}
                    >
                      Salvar
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
