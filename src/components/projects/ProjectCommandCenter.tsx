/**
 * ProjectCommandCenter — IA Command Center drawer for project-scoped AI operations
 * Reuses existing Polo AI infrastructure (useAgentChat) with project context injection
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { RefreshCw, Sparkles, X, Mic, ChevronDown, Undo2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VoiceInputButton } from "@/components/ai/VoiceInputButton";
import { ExecutionPlanView } from "@/components/ai/ExecutionPlanView";
import { useAgentChat } from "@/hooks/useAgentChat";
import { cn } from "@/lib/utils";
import type { AttachmentInfo } from "@/types/agent";

interface ProjectCommandCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  projectContext?: {
    status?: string;
    stage?: string;
    clientName?: string;
    contractValue?: number;
    healthScore?: number;
  };
}

const QUICK_CHIPS = [
  { label: "Criar tarefas", prompt: "Cria tarefas para este projeto" },
  { label: "Atualizar etapa", prompt: "Atualize a etapa do projeto" },
  { label: "Adicionar entregas", prompt: "Adicione entregáveis ao projeto" },
  { label: "Registrar reunião", prompt: "Registre uma reunião para este projeto" },
  { label: "Gerar resumo", prompt: "Gere um resumo executivo do projeto" },
  { label: "Atualizar financeiro", prompt: "Atualize as parcelas financeiras do projeto" },
];

export function ProjectCommandCenter({
  open,
  onOpenChange,
  projectId,
  projectName,
  projectContext,
}: ProjectCommandCenterProps) {
  const location = useLocation();
  const {
    messages,
    isLoading,
    isExecuting,
    sendMessage,
    handleExecutePlan,
    regeneratePlan,
    cancelStream,
    setMessages,
  } = useAgentChat();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const buildContextPrefix = useCallback(() => {
    const parts = [`[CONTEXTO DO PROJETO]\nID: ${projectId}\nNome: ${projectName}`];
    if (projectContext?.status) parts.push(`Status: ${projectContext.status}`);
    if (projectContext?.stage) parts.push(`Etapa: ${projectContext.stage}`);
    if (projectContext?.clientName) parts.push(`Cliente: ${projectContext.clientName}`);
    if (projectContext?.contractValue) parts.push(`Valor: R$ ${projectContext.contractValue.toLocaleString("pt-BR")}`);
    if (projectContext?.healthScore !== undefined) parts.push(`Saúde: ${projectContext.healthScore}%`);
    return parts.join("\n") + "\n\n[COMANDO DO USUÁRIO]\n";
  }, [projectId, projectName, projectContext]);

  const handleSend = async (text?: string) => {
    const finalText = text || input.trim();
    if (!finalText || isLoading) return;
    
    const contextualMessage = buildContextPrefix() + finalText;
    setInput("");
    await sendMessage(contextualMessage, [], location.pathname);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Summary stats from results
  const lastResultMsg = [...messages].reverse().find(m => m.results);
  const resultSummary = lastResultMsg?.results
    ? {
        success: lastResultMsg.results.filter((r: any) => r.status === "success").length,
        error: lastResultMsg.results.filter((r: any) => r.status === "error").length,
        total: lastResultMsg.results.length,
      }
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[520px] sm:max-w-[520px] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">IA Command Center</h3>
              <p className="text-[10px] text-muted-foreground truncate max-w-[280px]">{projectName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-semibold text-green-500 uppercase">Ativo</span>
          </div>
        </div>

        {/* Project Context Bar */}
        <div className="px-4 py-2 border-b border-border bg-muted/30 flex flex-wrap gap-2 shrink-0">
          {projectContext?.status && (
            <span className="text-[9px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium">
              {projectContext.status}
            </span>
          )}
          {projectContext?.stage && (
            <span className="text-[9px] px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              {projectContext.stage}
            </span>
          )}
          {projectContext?.clientName && (
            <span className="text-[9px] px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              {projectContext.clientName}
            </span>
          )}
          {projectContext?.healthScore !== undefined && (
            <span className={cn(
              "text-[9px] px-2 py-0.5 rounded border font-medium",
              projectContext.healthScore >= 80 ? "bg-green-500/10 text-green-500 border-green-500/20" :
              projectContext.healthScore >= 50 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
              "bg-red-500/10 text-red-500 border-red-500/20"
            )}>
              Saúde {projectContext.healthScore}%
            </span>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">Comando IA do Projeto</p>
                <p className="text-xs text-muted-foreground max-w-[280px] mb-6">
                  Digite ou fale o que precisa. A IA vai planejar e executar as ações no projeto.
                </p>

                {/* Quick Chips */}
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => handleSend(chip.prompt)}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all text-muted-foreground hover:text-foreground"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={cn(
                  "max-w-[90%] px-4 py-3 rounded-2xl text-sm",
                  msg.role === "user"
                    ? "bg-foreground text-background font-medium"
                    : "bg-muted border border-border text-foreground"
                )}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                    </div>
                  ) : (
                    <span>{msg.content.replace(/\[CONTEXTO DO PROJETO\][\s\S]*?\[COMANDO DO USUÁRIO\]\n/, "")}</span>
                  )}
                </div>

                {/* Execution Plan */}
                {msg.plan && (
                  <div className="max-w-[90%] mt-2">
                    <ExecutionPlanView
                      plan={msg.plan}
                      results={msg.results}
                      isExecuting={isExecuting && msg.runId !== undefined && !msg.results}
                      needsConfirmation={msg.needsConfirmation}
                      onConfirm={() => handleExecutePlan(i)}
                      onCancel={() => {
                        setMessages(prev => {
                          const newMsgs = [...prev];
                          newMsgs[i] = { ...newMsgs[i], needsConfirmation: false, plan: undefined };
                          return newMsgs;
                        });
                      }}
                    />
                    {msg.plan && !msg.results && !isExecuting && !msg.needsConfirmation && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleExecutePlan(i)}
                          className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                        >
                          <Zap className="w-4 h-4" />
                          EXECUTAR
                        </button>
                        <button
                          onClick={() => regeneratePlan(i, location.pathname)}
                          disabled={isLoading}
                          className="py-2.5 px-4 bg-muted border border-border text-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-accent transition-all disabled:opacity-50"
                        >
                          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                        </button>
                      </div>
                    )}
                    {msg.plan && msg.results && msg.results.some((r: any) => r.status === "error") && !isExecuting && (
                      <button
                        onClick={() => regeneratePlan(i, location.pathname)}
                        disabled={isLoading}
                        className="mt-3 w-full py-2.5 bg-destructive text-destructive-foreground rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50"
                      >
                        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                        REGENERAR PLANO
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="bg-muted border border-border px-4 py-3 rounded-2xl">
                  <span className="flex gap-1.5">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card/80 shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Diga o que precisa fazer neste projeto..."
              disabled={isLoading}
              className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground transition-colors disabled:opacity-50 min-w-0"
            />
            <VoiceInputButton
              onTranscript={(text) => setInput(prev => prev ? prev + " " + text : text)}
              mode="append"
              disabled={isLoading}
              className="w-10 h-10 rounded-xl"
              size="icon"
            />
            <button
              onClick={isLoading ? cancelStream : () => handleSend()}
              disabled={!isLoading && !input.trim()}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0",
                isLoading
                  ? "bg-destructive text-destructive-foreground hover:opacity-90"
                  : "bg-primary text-primary-foreground disabled:opacity-50 hover:scale-105 active:scale-95 shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.5)]"
              )}
            >
              {isLoading ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
