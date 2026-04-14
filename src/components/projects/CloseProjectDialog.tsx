import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onClosed?: () => void;
}

const REASON_CATEGORIES = [
  { value: "delivered", label: "Entregue com sucesso" },
  { value: "delivered_with_issues", label: "Entregue com ressalvas" },
  { value: "client_cancelled", label: "Cliente cancelou" },
  { value: "scope_change", label: "Mudança de escopo · virou outro" },
  { value: "payment_issue", label: "Problema de pagamento" },
  { value: "relationship_end", label: "Fim de relacionamento" },
  { value: "internal_decision", label: "Decisão interna · não vai continuar" },
  { value: "other", label: "Outro motivo" },
];

export function CloseProjectDialog({
  open,
  onClose,
  projectId,
  projectName,
  onClosed,
}: Props) {
  const [category, setCategory] = useState<string>("delivered");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...list]);
  };

  const removeFile = (i: number) =>
    setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const readAsText = (f: File): Promise<string> =>
    new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.onerror = () => resolve("");
      r.readAsText(f);
    });

  const uploadFiles = async (): Promise<string[]> => {
    if (files.length === 0) return [];
    const urls: string[] = [];
    for (const f of files) {
      const path = `retrospectives/${projectId}/${Date.now()}-${f.name}`;
      const { data, error } = await supabase.storage
        .from("project-files")
        .upload(path, f, { upsert: true });
      if (!error && data) urls.push(data.path);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!reason.trim() && category !== "delivered") {
      toast.error("Descreva o motivo do encerramento");
      return;
    }
    setProcessing(true);
    try {
      setUploading(true);
      const attachment_urls = await uploadFiles();
      setUploading(false);

      // Extract text from text-based attachments (txt, md, json)
      let attachment_text = "";
      for (const f of files) {
        if (
          f.type.startsWith("text/") ||
          f.name.match(/\.(txt|md|json|csv)$/i)
        ) {
          const t = await readAsText(f);
          attachment_text += `\n\n--- ${f.name} ---\n${t.slice(0, 4000)}`;
        }
      }

      const { data, error } = await supabase.functions.invoke(
        "close-project-retrospective",
        {
          body: {
            project_id: projectId,
            reason: reason || REASON_CATEGORIES.find((r) => r.value === category)?.label,
            reason_category: category,
            user_notes: notes,
            attachment_urls,
            attachment_text,
          },
        },
      );

      if (error) throw error;
      setReport(data.report);
      toast.success("Retrospectiva IA gerada · projeto encerrado");
      onClosed?.();
    } catch (e: any) {
      toast.error(e.message || "Falha ao encerrar projeto");
    } finally {
      setProcessing(false);
      setUploading(false);
    }
  };

  const reset = () => {
    setCategory("delivered");
    setReason("");
    setNotes("");
    setFiles([]);
    setReport(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
          reset();
        }
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Encerrar Projeto · Retrospectiva IA
          </DialogTitle>
          <DialogDescription>
            {projectName} · a IA vai analisar tudo e gerar relatório completo com lições,
            ações e melhorias.
          </DialogDescription>
        </DialogHeader>

        {!report ? (
          <div className="space-y-4 py-2">
            <div>
              <Label>Motivo do encerramento</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REASON_CATEGORIES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Descrição detalhada (opcional mas recomendado)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Descreva em suas palavras como o projeto correu, o que aconteceu, contexto relevante…"
                className="mt-1.5 min-h-[80px]"
              />
            </div>

            <div>
              <Label>Notas adicionais / observações internas</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Feedback do cliente, pontos sensíveis, o que não deve aparecer no relatório público…"
                className="mt-1.5 min-h-[60px]"
              />
            </div>

            <div>
              <Label>Anexos (transcrições, feedback, PDFs, briefings)</Label>
              <div className="mt-1.5">
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFiles}
                />
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="gap-2 w-full"
                >
                  <Upload className="w-4 h-4" /> Selecionar arquivos
                </Button>
                {files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {files.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-muted/40 px-3 py-1.5 rounded text-xs"
                      >
                        <span className="truncate">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={onClose} disabled={processing}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={processing}
                className="gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {uploading ? "Subindo anexos…" : "Analisando com IA…"}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Encerrar & gerar retrospectiva
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 py-2"
          >
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-light">
                {report.overall_score}
              </div>
              <div className="flex-1">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Nota geral
                </div>
                <p className="text-sm text-foreground leading-relaxed mt-1">
                  {report.executive_summary}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="uppercase tracking-wider text-muted-foreground">
                  Satisfação cliente
                </div>
                <div className="text-sm text-foreground mt-1 capitalize">
                  {report.client_satisfaction}
                </div>
                {report.client_satisfaction_reasoning && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {report.client_satisfaction_reasoning}
                  </p>
                )}
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="uppercase tracking-wider text-muted-foreground">
                  Desempenho equipe
                </div>
                <div className="text-sm text-foreground mt-1 capitalize">
                  {report.team_performance}
                </div>
                {report.team_performance_reasoning && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {report.team_performance_reasoning}
                  </p>
                )}
              </div>
            </div>

            {report.what_went_well?.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider text-emerald-500 mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> O que funcionou
                </div>
                <ul className="space-y-1">
                  {report.what_went_well.map((w: string, i: number) => (
                    <li key={i} className="text-xs text-foreground/80 pl-3 border-l-2 border-emerald-500/30">
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.what_went_wrong?.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider text-orange-500 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> O que pode melhorar
                </div>
                <ul className="space-y-2">
                  {report.what_went_wrong.map((w: any, i: number) => (
                    <li key={i} className="text-xs pl-3 border-l-2 border-orange-500/30">
                      <div className="text-foreground font-medium">{w.issue}</div>
                      <div className="text-muted-foreground">Causa: {w.root_cause}</div>
                      <div className="text-muted-foreground">Impacto: {w.impact}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.lessons_learned?.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Lições aprendidas
                </div>
                <ul className="space-y-1">
                  {report.lessons_learned.map((l: string, i: number) => (
                    <li key={i} className="text-xs text-foreground/80">• {l}</li>
                  ))}
                </ul>
              </div>
            )}

            {report.actions_for_next?.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider text-primary mb-2">
                  Ações para próximos projetos
                </div>
                <div className="space-y-1.5">
                  {report.actions_for_next.map((a: any, i: number) => (
                    <div key={i} className="bg-primary/5 border border-primary/20 rounded px-3 py-2 text-xs">
                      <div className="text-foreground font-medium">{a.action}</div>
                      <div className="text-muted-foreground">{a.why}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={onClose}>Fechar</Button>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
