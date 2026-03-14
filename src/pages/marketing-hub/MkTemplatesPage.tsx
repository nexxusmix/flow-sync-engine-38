/**
 * MkTemplatesPage — Biblioteca de Templates de Conteúdo com IA
 * Grid premium com geração de roteiro, legendas, shotlist e prompts de design
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MkCard } from "@/components/marketing-hub/mk-ui/MkCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles, FileText, Copy, Check, ChevronLeft, Wand2, Camera, LayoutGrid,
  MessageSquare, Palette, Loader2, Film, Image as ImageIcon, BookOpen,
  Plus, Pencil, Trash2, Lock
} from "lucide-react";
import { CustomTemplateDialog } from "@/components/marketing-hub/CustomTemplateDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TemplateVar { key: string; label: string; default_value: string; }
interface TemplateSection { key: string; label: string; ai_instruction: string; }
interface Template {
  id: string;
  title: string;
  description: string | null;
  format: string;
  category: string | null;
  thumbnail_emoji: string | null;
  prompt_template: string | null;
  sections: TemplateSection[];
  variables: TemplateVar[];
  is_system: boolean;
  use_count: number;
}

interface Generation {
  script?: { hook?: string; body?: string; cta?: string; hashtags?: string };
  captions?: { tone: string; text: string }[];
  shotlist?: { scene: number; description: string; camera: string; duration: string; visual_note?: string }[];
  design_prompt?: string;
}

const FORMAT_CONFIG: Record<string, { icon: typeof Film; label: string; color: string }> = {
  reels: { icon: Film, label: "Reels", color: "text-primary" },
  carrossel: { icon: LayoutGrid, label: "Carrossel", color: "text-primary/80" },
  stories: { icon: Camera, label: "Stories", color: "text-primary/70" },
  post: { icon: ImageIcon, label: "Post", color: "text-primary/60" },
  thread: { icon: MessageSquare, label: "Thread", color: "text-primary/50" },
};

const CATEGORY_LABELS: Record<string, string> = {
  educacional: "Educacional",
  vendas: "Vendas",
  engajamento: "Engajamento",
  bastidores: "Bastidores",
  autoridade: "Autoridade",
  geral: "Geral",
};

export default function MkTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [filterFormat, setFilterFormat] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterOwnership, setFilterOwnership] = useState<"all" | "system" | "custom">("all");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("content_templates")
      .select("*")
      .order("use_count", { ascending: false });
    if (error) { toast.error("Erro ao carregar templates"); console.error(error); }
    else setTemplates((data || []) as unknown as Template[]);
    setLoading(false);
  };

  const openTemplate = (t: Template) => {
    setSelectedTemplate(t);
    setGeneration(null);
    const vars: Record<string, string> = {};
    t.variables.forEach(v => { vars[v.key] = v.default_value || ""; });
    setVariables(vars);
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    setGenerating(true);
    setGeneration(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-from-template", {
        body: {
          template: {
            format: selectedTemplate.format,
            category: selectedTemplate.category,
            prompt_template: selectedTemplate.prompt_template,
            sections: selectedTemplate.sections,
          },
          variables,
          outputs: ["script", "captions", "shotlist", "design_prompt"],
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setGeneration(data);

      // Increment use_count
      await supabase.from("content_templates").update({ use_count: (selectedTemplate.use_count || 0) + 1 }).eq("id", selectedTemplate.id);

      // Save generation
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("template_generations").insert({
        template_id: selectedTemplate.id,
        created_by: user?.id,
        format: selectedTemplate.format,
        variables_used: variables,
        script: data.script || null,
        captions: data.captions || null,
        shotlist: data.shotlist || null,
        design_prompt: data.design_prompt || null,
      });

      toast.success("Conteúdo gerado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar conteúdo");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copiado!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("content_templates").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir template");
    else { toast.success("Template excluído"); fetchTemplates(); }
    setDeletingId(null);
  };

  const filtered = templates
    .filter(t => !filterFormat || t.format === filterFormat)
    .filter(t => filterOwnership === "all" ? true : filterOwnership === "system" ? t.is_system : !t.is_system);

  // ── Template Grid View ──
  if (!selectedTemplate) {
    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[rgba(0,156,202,0.08)] border border-[rgba(0,156,202,0.15)] flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[hsl(195,100%,50%)]" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-foreground tracking-tight">Templates de Conteúdo</h1>
              <p className="text-[11px] text-muted-foreground">Biblioteca de formatos reutilizáveis com geração IA</p>
            </div>
          </div>
          <Button size="sm" className="gap-1.5 text-xs" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-3.5 h-3.5" /> Novo Template
          </Button>
        </div>
        {/* Ownership filter */}
        <div className="flex gap-2 mb-2">
          {(["all", "system", "custom"] as const).map(key => {
            const labels = { all: "Todos", system: "Sistema", custom: "Meus Templates" };
            return (
              <button
                key={key}
                onClick={() => setFilterOwnership(key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-[0.1em] font-medium border transition-all",
                  filterOwnership === key
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-border/20 text-muted-foreground hover:text-foreground hover:border-border/40"
                )}
              >
                {key === "system" && <Lock className="w-2.5 h-2.5 inline mr-1" />}
                {labels[key]}
              </button>
            );
          })}
        </div>

        {/* Format filter pills */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterFormat(null)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-[0.1em] font-medium border transition-all",
              !filterFormat
                ? "bg-[rgba(0,156,202,0.12)] border-[rgba(0,156,202,0.3)] text-[hsl(195,100%,60%)]"
                : "border-white/5 text-white/30 hover:text-white/50 hover:border-white/10"
            )}
          >
            Todos
          </button>
          {Object.entries(FORMAT_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilterFormat(key === filterFormat ? null : key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-[0.1em] font-medium border transition-all flex items-center gap-1.5",
                filterFormat === key
                  ? "bg-[rgba(0,156,202,0.12)] border-[rgba(0,156,202,0.3)] text-[hsl(195,100%,60%)]"
                  : "border-white/5 text-white/30 hover:text-white/50 hover:border-white/10"
              )}
            >
              <cfg.icon className="w-3 h-3" />
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[hsl(195,100%,50%)]" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t, i) => {
              const fmt = FORMAT_CONFIG[t.format] || FORMAT_CONFIG.post;
              const FmtIcon = fmt.icon;
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <MkCard
                    hover
                    onClick={() => openTemplate(t)}
                    className="group h-full"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-2xl">{t.thumbnail_emoji || "📝"}</span>
                        <div className={cn("flex items-center gap-1 text-[9px] uppercase tracking-wider font-medium", fmt.color)}>
                          <FmtIcon className="w-3 h-3" />
                          {fmt.label}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white/85 group-hover:text-white transition-colors">{t.title}</h3>
                        <p className="text-[11px] text-white/30 mt-0.5 line-clamp-2">{t.description}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {t.is_system && <Lock className="w-2.5 h-2.5 text-muted-foreground/30" />}
                          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">
                            {CATEGORY_LABELS[t.category || "geral"]}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {!t.is_system && (
                            <>
                              <button
                                onClick={e => { e.stopPropagation(); setEditingTemplate(t); }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted/30 transition-all"
                              >
                                <Pencil className="w-3 h-3 text-muted-foreground" />
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); setDeletingId(t.id); }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-all"
                              >
                                <Trash2 className="w-3 h-3 text-destructive/60" />
                              </button>
                            </>
                          )}
                          <span className="text-[9px] text-muted-foreground/30 font-mono">{t.use_count}×</span>
                        </div>
                      </div>
                    </div>
                  </MkCard>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <CustomTemplateDialog
          open={showCreateDialog || !!editingTemplate}
          onOpenChange={open => { if (!open) { setShowCreateDialog(false); setEditingTemplate(null); } }}
          editTemplate={editingTemplate ? {
            id: editingTemplate.id,
            title: editingTemplate.title,
            description: editingTemplate.description || "",
            format: editingTemplate.format,
            category: editingTemplate.category || "geral",
            thumbnail_emoji: editingTemplate.thumbnail_emoji || "📝",
            prompt_template: editingTemplate.prompt_template || "",
            variables: editingTemplate.variables || [],
            sections: editingTemplate.sections || [],
          } : null}
          onSaved={fetchTemplates}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingId} onOpenChange={open => !open && setDeletingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm">Excluir template?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                Esta ação não pode ser desfeita. O template será removido permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-xs h-8">Cancelar</AlertDialogCancel>
              <AlertDialogAction className="text-xs h-8 bg-destructive hover:bg-destructive/90" onClick={() => deletingId && handleDelete(deletingId)}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ── Template Detail + Generator View ──
  const fmt = FORMAT_CONFIG[selectedTemplate.format] || FORMAT_CONFIG.post;
  const FmtIcon = fmt.icon;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => { setSelectedTemplate(null); setGeneration(null); }}
        className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Voltar à biblioteca
      </button>

      {/* Template header */}
      <MkCard className="!p-5">
        <div className="flex items-start gap-4">
          <span className="text-3xl">{selectedTemplate.thumbnail_emoji}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium text-white/90">{selectedTemplate.title}</h2>
              <span className={cn("flex items-center gap-1 text-[9px] uppercase tracking-wider", fmt.color)}>
                <FmtIcon className="w-3 h-3" />{fmt.label}
              </span>
            </div>
            <p className="text-[11px] text-white/35 mt-1">{selectedTemplate.description}</p>
          </div>
        </div>
      </MkCard>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* Variables Form */}
        <MkCard className="!p-4 space-y-4 self-start">
          <div className="flex items-center gap-2">
            <Wand2 className="w-3.5 h-3.5 text-[hsl(195,100%,50%)]" />
            <span className="text-[10px] uppercase tracking-[0.12em] text-white/50 font-medium">Preencha as variáveis</span>
          </div>
          <div className="space-y-3">
            {selectedTemplate.variables.map(v => (
              <div key={v.key} className="space-y-1">
                <label className="text-[10px] text-white/40 font-medium">{v.label}</label>
                <Input
                  value={variables[v.key] || ""}
                  onChange={e => setVariables(prev => ({ ...prev, [v.key]: e.target.value }))}
                  placeholder={v.default_value || v.label}
                  className="h-8 text-xs bg-white/[0.03] border-white/10 text-white/80 placeholder:text-white/15"
                />
              </div>
            ))}
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full gap-2 bg-[hsl(195,100%,45%)] hover:bg-[hsl(195,100%,50%)] text-white text-xs h-9"
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {generating ? "Gerando com IA..." : "Gerar Conteúdo"}
          </Button>

          {/* Sections preview */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <span className="text-[9px] uppercase tracking-wider text-white/20">Seções geradas</span>
            {selectedTemplate.sections.map(s => (
              <div key={s.key} className="flex items-center gap-2 text-[10px] text-white/30">
                <div className="w-1 h-1 rounded-full bg-[hsl(195,100%,50%)]" />
                {s.label}
              </div>
            ))}
            <div className="flex items-center gap-2 text-[10px] text-white/30">
              <div className="w-1 h-1 rounded-full bg-primary/60" />
              3 variações de legenda
            </div>
            <div className="flex items-center gap-2 text-[10px] text-white/30">
              <div className="w-1 h-1 rounded-full bg-primary/50" />
              Shotlist / Decupagem
            </div>
            <div className="flex items-center gap-2 text-[10px] text-white/30">
              <div className="w-1 h-1 rounded-full bg-primary/50" />
              Prompt de Design
            </div>
          </div>
        </MkCard>

        {/* Generation Output */}
        <div className="space-y-3">
          <AnimatePresence>
            {!generation && !generating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6 text-white/10" />
                </div>
                <p className="text-xs text-white/25">Preencha as variáveis e clique em gerar</p>
              </motion.div>
            )}

            {generating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-8 h-8 text-[hsl(195,100%,50%)]" />
                </motion.div>
                <p className="text-xs text-white/40 mt-3">Gerando roteiro, legendas, shotlist e prompts...</p>
              </motion.div>
            )}

            {generation && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Script */}
                {generation.script && (
                  <OutputCard
                    title="Roteiro / Script"
                    icon={<FileText className="w-3.5 h-3.5 text-[hsl(195,100%,50%)]" />}
                    onCopy={() => copyToClipboard(
                      `Hook: ${generation.script?.hook}\n\n${generation.script?.body}\n\nCTA: ${generation.script?.cta}\n\n${generation.script?.hashtags}`,
                      "script"
                    )}
                    copied={copiedKey === "script"}
                  >
                    <div className="space-y-2.5 text-[11px] text-white/60 leading-relaxed">
                      {generation.script.hook && (
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-[hsl(195,100%,50%)] font-medium">Hook</span>
                          <p className="mt-0.5 text-white/70 font-medium">{generation.script.hook}</p>
                        </div>
                      )}
                      {generation.script.body && (
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-white/25 font-medium">Corpo</span>
                          <p className="mt-0.5 whitespace-pre-wrap">{generation.script.body}</p>
                        </div>
                      )}
                      {generation.script.cta && (
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-primary/70 font-medium">CTA</span>
                          <p className="mt-0.5">{generation.script.cta}</p>
                        </div>
                      )}
                      {generation.script.hashtags && (
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-white/25 font-medium">Hashtags</span>
                          <p className="mt-0.5 text-[hsl(195,100%,50%)]/60">{generation.script.hashtags}</p>
                        </div>
                      )}
                    </div>
                  </OutputCard>
                )}

                {/* Captions */}
                {generation.captions && generation.captions.length > 0 && (
                  <OutputCard
                    title="Legendas (3 variações)"
                    icon={<MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />}
                    onCopy={() => copyToClipboard(
                      generation.captions!.map(c => `[${c.tone}]\n${c.text}`).join("\n\n---\n\n"),
                      "captions"
                    )}
                    copied={copiedKey === "captions"}
                  >
                    <div className="space-y-3">
                      {generation.captions.map((c, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-medium">{c.tone}</span>
                          <p className="text-[11px] text-white/55 mt-1 whitespace-pre-wrap leading-relaxed">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  </OutputCard>
                )}

                {/* Shotlist */}
                {generation.shotlist && generation.shotlist.length > 0 && (
                  <OutputCard
                    title="Shotlist / Decupagem"
                    icon={<Camera className="w-3.5 h-3.5 text-primary/60" />}
                    onCopy={() => copyToClipboard(
                      generation.shotlist!.map(s => `Cena ${s.scene}: ${s.description} | ${s.camera} | ${s.duration}`).join("\n"),
                      "shotlist"
                    )}
                    copied={copiedKey === "shotlist"}
                  >
                    <div className="space-y-1.5">
                      {generation.shotlist.map((s, i) => (
                        <div key={i} className="flex gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/5 text-[10px]">
                          <span className="text-primary/40 font-mono font-medium shrink-0">#{s.scene}</span>
                          <div className="flex-1">
                            <p className="text-white/55">{s.description}</p>
                            <div className="flex gap-3 mt-1 text-white/25">
                              <span>📷 {s.camera}</span>
                              <span>⏱ {s.duration}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </OutputCard>
                )}

                {/* Design Prompt */}
                {generation.design_prompt && (
                  <OutputCard
                    title="Prompt de Design"
                    icon={<Palette className="w-3.5 h-3.5 text-purple-400" />}
                    onCopy={() => copyToClipboard(generation.design_prompt!, "design")}
                    copied={copiedKey === "design"}
                  >
                    <p className="text-[11px] text-white/50 leading-relaxed whitespace-pre-wrap">{generation.design_prompt}</p>
                  </OutputCard>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Output Card ──
function OutputCard({ title, icon, children, onCopy, copied }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <MkCard className="!p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-[10px] uppercase tracking-[0.12em] text-white/50 font-medium">{title}</span>
        </div>
        <button
          onClick={onCopy}
          className="flex items-center gap-1 text-[9px] text-white/20 hover:text-white/50 transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      {children}
    </MkCard>
  );
}
