import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, GripVertical, Loader2, Sparkles } from "lucide-react";

interface TemplateVar { key: string; label: string; default_value: string; }
interface TemplateSection { key: string; label: string; ai_instruction: string; }

interface TemplateFormData {
  id?: string;
  title: string;
  description: string;
  format: string;
  category: string;
  thumbnail_emoji: string;
  prompt_template: string;
  variables: TemplateVar[];
  sections: TemplateSection[];
}

const EMPTY_FORM: TemplateFormData = {
  title: "",
  description: "",
  format: "reels",
  category: "geral",
  thumbnail_emoji: "📝",
  prompt_template: "",
  variables: [],
  sections: [],
};

const FORMATS = [
  { value: "reels", label: "Reels" },
  { value: "carrossel", label: "Carrossel" },
  { value: "stories", label: "Stories" },
  { value: "post", label: "Post" },
  { value: "thread", label: "Thread" },
];

const CATEGORIES = [
  { value: "educacional", label: "Educacional" },
  { value: "vendas", label: "Vendas" },
  { value: "engajamento", label: "Engajamento" },
  { value: "bastidores", label: "Bastidores" },
  { value: "autoridade", label: "Autoridade" },
  { value: "geral", label: "Geral" },
];

const EMOJI_OPTIONS = ["📝", "🎬", "🎯", "💡", "🔥", "✨", "🚀", "💎", "📸", "🎨", "📊", "🤝", "🎤", "📢", "💰"];

interface CustomTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTemplate?: TemplateFormData | null;
  onSaved: () => void;
}

export function CustomTemplateDialog({ open, onOpenChange, editTemplate, onSaved }: CustomTemplateDialogProps) {
  const [form, setForm] = useState<TemplateFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "variables" | "sections">("info");

  useEffect(() => {
    if (open) {
      setForm(editTemplate || EMPTY_FORM);
      setActiveTab("info");
    }
  }, [open, editTemplate]);

  const updateForm = (patch: Partial<TemplateFormData>) => setForm(prev => ({ ...prev, ...patch }));

  const addVariable = () => {
    const idx = form.variables.length + 1;
    updateForm({
      variables: [...form.variables, { key: `var_${idx}`, label: `Variável ${idx}`, default_value: "" }],
    });
  };

  const updateVariable = (i: number, patch: Partial<TemplateVar>) => {
    const vars = [...form.variables];
    vars[i] = { ...vars[i], ...patch };
    updateForm({ variables: vars });
  };

  const removeVariable = (i: number) => {
    updateForm({ variables: form.variables.filter((_, idx) => idx !== i) });
  };

  const addSection = () => {
    const idx = form.sections.length + 1;
    updateForm({
      sections: [...form.sections, { key: `section_${idx}`, label: `Seção ${idx}`, ai_instruction: "" }],
    });
  };

  const updateSection = (i: number, patch: Partial<TemplateSection>) => {
    const secs = [...form.sections];
    secs[i] = { ...secs[i], ...patch };
    updateForm({ sections: secs });
  };

  const removeSection = (i: number) => {
    updateForm({ sections: form.sections.filter((_, idx) => idx !== i) });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Nome do template é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const payload = {
        title: form.title,
        description: form.description || null,
        format: form.format,
        category: form.category || null,
        thumbnail_emoji: form.thumbnail_emoji || null,
        prompt_template: form.prompt_template || null,
        variables: form.variables as any,
        sections: form.sections as any,
        is_system: false,
        created_by: user.id,
      };

      if (form.id) {
        const { error } = await supabase.from("content_templates").update(payload).eq("id", form.id);
        if (error) throw error;
        toast.success("Template atualizado!");
      } else {
        const { error } = await supabase.from("content_templates").insert(payload);
        if (error) throw error;
        toast.success("Template criado!");
      }
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar template");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: "info" as const, label: "Informações" },
    { key: "variables" as const, label: `Variáveis (${form.variables.length})` },
    { key: "sections" as const, label: `Seções (${form.sections.length})` },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            {form.id ? "Editar Template" : "Novo Template"}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border/20 pb-0">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-3 py-2 text-[10px] uppercase tracking-[0.1em] font-medium border-b-2 -mb-px transition-all",
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 min-h-0">
          {activeTab === "info" && (
            <div className="space-y-3">
              {/* Emoji picker */}
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Ícone</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {EMOJI_OPTIONS.map(e => (
                    <button
                      key={e}
                      onClick={() => updateForm({ thumbnail_emoji: e })}
                      className={cn(
                        "w-8 h-8 rounded-lg border text-lg flex items-center justify-center transition-all",
                        form.thumbnail_emoji === e
                          ? "border-primary bg-primary/10"
                          : "border-border/20 hover:border-border/40"
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Nome do Template *</Label>
                <Input
                  value={form.title}
                  onChange={e => updateForm({ title: e.target.value })}
                  placeholder="Ex: Reels de Autoridade"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Descrição</Label>
                <Textarea
                  value={form.description}
                  onChange={e => updateForm({ description: e.target.value })}
                  placeholder="Descreva o objetivo deste template..."
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Formato</Label>
                  <Select value={form.format} onValueChange={v => updateForm({ format: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FORMATS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Categoria</Label>
                  <Select value={form.category} onValueChange={v => updateForm({ category: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Prompt Base (instruções para a IA)</Label>
                <Textarea
                  value={form.prompt_template}
                  onChange={e => updateForm({ prompt_template: e.target.value })}
                  placeholder="Ex: Crie um roteiro persuasivo de {format} sobre {tema} para o nicho {nicho}..."
                  rows={4}
                  className="text-xs resize-none font-mono"
                />
                <p className="text-[9px] text-muted-foreground/50">
                  Use {"{variavel}"} para referenciar variáveis definidas na aba Variáveis
                </p>
              </div>
            </div>
          )}

          {activeTab === "variables" && (
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground/60">
                Variáveis são campos que o usuário preenche antes de gerar. Elas podem ser usadas no prompt com {"{chave}"}.
              </p>

              <AnimatePresence>
                {form.variables.map((v, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-lg border border-border/20 bg-muted/5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <GripVertical className="w-3 h-3 text-muted-foreground/20" />
                        <span className="text-[9px] font-mono text-muted-foreground/40">#{i + 1}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive/60" onClick={() => removeVariable(i)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <Label className="text-[9px] text-muted-foreground/50">Chave</Label>
                        <Input
                          value={v.key}
                          onChange={e => updateVariable(i, { key: e.target.value.replace(/\s/g, "_").toLowerCase() })}
                          placeholder="tema"
                          className="h-7 text-[10px] font-mono"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-[9px] text-muted-foreground/50">Rótulo</Label>
                        <Input
                          value={v.label}
                          onChange={e => updateVariable(i, { label: e.target.value })}
                          placeholder="Tema principal"
                          className="h-7 text-[10px]"
                        />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-[9px] text-muted-foreground/50">Valor padrão</Label>
                      <Input
                        value={v.default_value}
                        onChange={e => updateVariable(i, { default_value: e.target.value })}
                        placeholder="Opcional"
                        className="h-7 text-[10px]"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={addVariable}>
                <Plus className="w-3.5 h-3.5" /> Adicionar Variável
              </Button>
            </div>
          )}

          {activeTab === "sections" && (
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground/60">
                Seções definem as partes do output gerado. A IA usará a instrução de cada seção para gerar o conteúdo.
              </p>

              <AnimatePresence>
                {form.sections.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-lg border border-border/20 bg-muted/5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <GripVertical className="w-3 h-3 text-muted-foreground/20" />
                        <span className="text-[9px] font-mono text-muted-foreground/40">#{i + 1}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive/60" onClick={() => removeSection(i)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <Label className="text-[9px] text-muted-foreground/50">Chave</Label>
                        <Input
                          value={s.key}
                          onChange={e => updateSection(i, { key: e.target.value.replace(/\s/g, "_").toLowerCase() })}
                          placeholder="hook"
                          className="h-7 text-[10px] font-mono"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-[9px] text-muted-foreground/50">Rótulo</Label>
                        <Input
                          value={s.label}
                          onChange={e => updateSection(i, { label: e.target.value })}
                          placeholder="Hook / Abertura"
                          className="h-7 text-[10px]"
                        />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-[9px] text-muted-foreground/50">Instrução IA</Label>
                      <Textarea
                        value={s.ai_instruction}
                        onChange={e => updateSection(i, { ai_instruction: e.target.value })}
                        placeholder="Ex: Crie um hook provocativo de 1 frase que gere curiosidade..."
                        rows={2}
                        className="text-[10px] resize-none"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={addSection}>
                <Plus className="w-3.5 h-3.5" /> Adicionar Seção
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 pt-2 border-t border-border/20">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 text-xs">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {form.id ? "Salvar Alterações" : "Criar Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
