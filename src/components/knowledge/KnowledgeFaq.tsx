import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronDown, ChevronRight, Plus, HelpCircle } from "lucide-react";
import type { KnowledgeFaqItem } from "@/hooks/useKnowledge";

interface Props {
  items: KnowledgeFaqItem[];
  onCreateFaq: (item: { question: string; answer: string }) => void;
}

export function KnowledgeFaq({ items, onCreateFaq }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const handleCreate = () => {
    if (!question.trim() || !answer.trim()) return;
    onCreateFaq({ question: question.trim(), answer: answer.trim() });
    setQuestion("");
    setAnswer("");
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Perguntas Frequentes</h3>
          <span className="text-xs text-muted-foreground">{items.length} itens</span>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2 h-7 text-xs">
              <Plus className="w-3 h-3" /> Nova FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Nova Pergunta Frequente</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Input placeholder="Pergunta" value={question} onChange={e => setQuestion(e.target.value)} />
              <Textarea placeholder="Resposta" value={answer} onChange={e => setAnswer(e.target.value)} className="min-h-[100px]" />
              <Button className="w-full" onClick={handleCreate} disabled={!question.trim() || !answer.trim()}>Criar FAQ</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <HelpCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma FAQ criada ainda</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="rounded-lg border border-border bg-card overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
              >
                {expandedId === item.id ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-sm font-medium text-foreground">{item.question}</span>
              </button>
              {expandedId === item.id && (
                <div className="px-4 pb-3 pl-10">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
