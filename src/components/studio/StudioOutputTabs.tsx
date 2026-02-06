import { useState } from "react";
import { RefreshCw, Edit2, Check, X, Copy, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  ConceptContent, ScriptContent, MoodboardContent, ShotlistItem, StoryboardScene 
} from "@/types/creative-studio";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StudioOutputTabsProps {
  concept?: ConceptContent;
  script?: ScriptContent;
  moodboard?: MoodboardContent;
  shotlist?: ShotlistItem[];
  scenes: StoryboardScene[];
  onRegenerateOutput: (outputType: string) => void;
  onUpdateOutput: (outputType: string, content: unknown) => void;
  onGenerateSceneImage: (scene: StoryboardScene) => void;
  generatingImages: Set<number>;
  isRegenerating: string | null;
}

export function StudioOutputTabs({
  concept,
  script,
  moodboard,
  shotlist,
  scenes,
  onRegenerateOutput,
  onUpdateOutput,
  onGenerateSceneImage,
  generatingImages,
  isRegenerating,
}: StudioOutputTabsProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const saveEdit = (outputType: string, field: string) => {
    // Create updated content based on output type
    if (outputType === 'concept' && concept) {
      onUpdateOutput('concept', { ...concept, [field]: editValue });
    } else if (outputType === 'script' && script) {
      onUpdateOutput('script', { ...script, [field]: editValue });
    }
    setEditingField(null);
    setEditValue("");
    toast.success("Campo atualizado");
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  return (
    <Tabs defaultValue="concept" className="h-full flex flex-col">
      <TabsList className="w-full justify-start px-4 py-2 h-auto gap-1 bg-transparent border-b border-border rounded-none">
        <TabsTrigger value="concept" className="data-[state=active]:bg-primary/10 rounded-lg">
          Conceito
        </TabsTrigger>
        <TabsTrigger value="script" className="data-[state=active]:bg-primary/10 rounded-lg">
          Roteiro
        </TabsTrigger>
        <TabsTrigger value="storyboard" className="data-[state=active]:bg-primary/10 rounded-lg">
          Storyboard
          {scenes.length > 0 && (
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
              {scenes.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="shotlist" className="data-[state=active]:bg-primary/10 rounded-lg">
          Shotlist
        </TabsTrigger>
        <TabsTrigger value="moodboard" className="data-[state=active]:bg-primary/10 rounded-lg">
          Moodboard
        </TabsTrigger>
      </TabsList>

      <ScrollArea className="flex-1">
        {/* CONCEPT TAB */}
        <TabsContent value="concept" className="p-4 m-0">
          {concept ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onRegenerateOutput('concept')}
                  disabled={isRegenerating === 'concept'}
                  className="gap-2"
                >
                  <RefreshCw className={cn("w-3 h-3", isRegenerating === 'concept' && "animate-spin")} />
                  Regenerar
                </Button>
              </div>

              <EditableCard 
                label="Big Idea" 
                value={concept.big_idea} 
                highlight
                fieldKey="big_idea"
                outputType="concept"
                editingField={editingField}
                editValue={editValue}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onEditValueChange={setEditValue}
                onCopy={copyToClipboard}
              />

              <div className="grid grid-cols-2 gap-4">
                <EditableCard 
                  label="Headline" 
                  value={concept.headline}
                  fieldKey="headline"
                  outputType="concept"
                  editingField={editingField}
                  editValue={editValue}
                  onStartEdit={startEdit}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  onEditValueChange={setEditValue}
                  onCopy={copyToClipboard}
                />
                <EditableCard 
                  label="Subheadline" 
                  value={concept.subheadline}
                  fieldKey="subheadline"
                  outputType="concept"
                  editingField={editingField}
                  editValue={editValue}
                  onStartEdit={startEdit}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  onEditValueChange={setEditValue}
                  onCopy={copyToClipboard}
                />
              </div>

              <EditableCard 
                label="Premissa" 
                value={concept.premissa}
                fieldKey="premissa"
                outputType="concept"
                editingField={editingField}
                editValue={editValue}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onEditValueChange={setEditValue}
                onCopy={copyToClipboard}
              />

              <EditableCard 
                label="Promessa" 
                value={concept.promessa}
                fieldKey="promessa"
                outputType="concept"
                editingField={editingField}
                editValue={editValue}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onEditValueChange={setEditValue}
                onCopy={copyToClipboard}
              />

              <div className="grid grid-cols-2 gap-4">
                <StaticCard label="Tom" value={concept.tom} />
                <StaticCard label="Tema" value={concept.tema} />
              </div>

              <EditableCard 
                label="Metáfora Central" 
                value={concept.metafora_central}
                fieldKey="metafora_central"
                outputType="concept"
                editingField={editingField}
                editValue={editValue}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onEditValueChange={setEditValue}
                onCopy={copyToClipboard}
              />

              <EditableCard 
                label="Argumento Comercial" 
                value={concept.argumento_comercial}
                fieldKey="argumento_comercial"
                outputType="concept"
                editingField={editingField}
                editValue={editValue}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onEditValueChange={setEditValue}
                onCopy={copyToClipboard}
              />
            </div>
          ) : (
            <EmptyState message="Conceito não gerado" />
          )}
        </TabsContent>

        {/* SCRIPT TAB */}
        <TabsContent value="script" className="p-4 m-0">
          {script ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onRegenerateOutput('script')}
                  disabled={isRegenerating === 'script'}
                  className="gap-2"
                >
                  <RefreshCw className={cn("w-3 h-3", isRegenerating === 'script' && "animate-spin")} />
                  Regenerar
                </Button>
              </div>

              <EditableCard 
                label="Hook" 
                value={script.hook} 
                highlight
                fieldKey="hook"
                outputType="script"
                editingField={editingField}
                editValue={editValue}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onEditValueChange={setEditValue}
                onCopy={copyToClipboard}
              />

              <EditableCard 
                label="Desenvolvimento" 
                value={script.desenvolvimento}
                fieldKey="desenvolvimento"
                outputType="script"
                editingField={editingField}
                editValue={editValue}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onEditValueChange={setEditValue}
                onCopy={copyToClipboard}
                multiline
              />

              <div className="grid grid-cols-2 gap-4">
                <EditableCard 
                  label="CTA" 
                  value={script.cta}
                  fieldKey="cta"
                  outputType="script"
                  editingField={editingField}
                  editValue={editValue}
                  onStartEdit={startEdit}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  onEditValueChange={setEditValue}
                  onCopy={copyToClipboard}
                />
                <StaticCard label="Duração Estimada" value={script.duracao_estimada} icon="⏱️" />
              </div>
            </div>
          ) : (
            <EmptyState message="Roteiro não gerado" />
          )}
        </TabsContent>

        {/* STORYBOARD TAB */}
        <TabsContent value="storyboard" className="p-4 m-0">
          {scenes.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    scenes.filter(s => s.notes && !s.image_url).forEach(s => onGenerateSceneImage(s));
                  }}
                  disabled={generatingImages.size > 0}
                  className="gap-2"
                >
                  <Sparkles className="w-3 h-3" />
                  Gerar Todas Imagens
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onRegenerateOutput('storyboard')}
                  disabled={isRegenerating === 'storyboard'}
                  className="gap-2"
                >
                  <RefreshCw className={cn("w-3 h-3", isRegenerating === 'storyboard' && "animate-spin")} />
                  Regenerar
                </Button>
              </div>

              {scenes.map((scene) => (
                <Card key={scene.id} className="p-4 bg-muted/30">
                  <div className="flex gap-4">
                    {/* Scene Image */}
                    <div className="w-48 h-28 rounded-lg bg-background flex-shrink-0 overflow-hidden relative border border-border">
                      {scene.image_url ? (
                        <img 
                          src={scene.image_url} 
                          alt={scene.title || `Cena ${scene.scene_number}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {generatingImages.has(scene.scene_number) ? (
                            <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => onGenerateSceneImage(scene)}
                              disabled={!scene.notes}
                              className="gap-1.5"
                            >
                              <Sparkles className="w-4 h-4" />
                              Gerar
                            </Button>
                          )}
                        </div>
                      )}
                      <Badge className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-1.5">
                        {scene.scene_number}
                      </Badge>
                    </div>

                    {/* Scene Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-foreground">{scene.title}</h4>
                        {scene.duration_sec && (
                          <Badge variant="outline" className="text-[10px]">
                            {scene.duration_sec}s
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{scene.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {scene.emotion && (
                          <Badge variant="secondary" className="text-[10px]">😊 {scene.emotion}</Badge>
                        )}
                        {scene.camera && (
                          <Badge variant="secondary" className="text-[10px]">📷 {scene.camera}</Badge>
                        )}
                        {scene.audio && (
                          <Badge variant="secondary" className="text-[10px]">🔊 {scene.audio}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState message="Storyboard não gerado" />
          )}
        </TabsContent>

        {/* SHOTLIST TAB */}
        <TabsContent value="shotlist" className="p-4 m-0">
          {shotlist && shotlist.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onRegenerateOutput('shotlist')}
                  disabled={isRegenerating === 'shotlist'}
                  className="gap-2"
                >
                  <RefreshCw className={cn("w-3 h-3", isRegenerating === 'shotlist' && "animate-spin")} />
                  Regenerar
                </Button>
              </div>

              <div className="space-y-2">
                {shotlist.map((shot, i) => (
                  <Card key={i} className="p-3 bg-muted/30">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{shot.plano}</p>
                        <p className="text-sm text-muted-foreground truncate">{shot.descricao}</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <Badge variant="outline" className="text-[10px]">{shot.lente_sugerida}</Badge>
                        <Badge variant="outline" className="text-[10px]">{shot.ambiente}</Badge>
                        <Badge variant="outline" className="text-[10px]">{shot.luz}</Badge>
                        <Badge 
                          className={cn(
                            "text-[10px]",
                            shot.prioridade === 'must-have' 
                              ? "bg-destructive/80 text-destructive-foreground" 
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {shot.prioridade}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState message="Shotlist não gerado" />
          )}
        </TabsContent>

        {/* MOODBOARD TAB */}
        <TabsContent value="moodboard" className="p-4 m-0">
          {moodboard ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onRegenerateOutput('moodboard')}
                  disabled={isRegenerating === 'moodboard'}
                  className="gap-2"
                >
                  <RefreshCw className={cn("w-3 h-3", isRegenerating === 'moodboard' && "animate-spin")} />
                  Regenerar
                </Button>
              </div>

              <Card className="p-4 bg-primary/10 border-primary/30">
                <p className="text-xs text-primary uppercase font-semibold mb-2">Direção de Arte</p>
                <p className="text-foreground">{moodboard.direcao_de_arte}</p>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                {moodboard.paleta?.length > 0 && (
                  <Card className="p-4 bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Paleta</p>
                    <div className="flex flex-wrap gap-2">
                      {moodboard.paleta.map((color, i) => (
                        <Badge key={i} variant="secondary">{color}</Badge>
                      ))}
                    </div>
                  </Card>
                )}

                <Card className="p-4 bg-muted/30">
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Materiais & Texturas</p>
                  <p className="text-sm text-foreground">{moodboard.materiais_texturas}</p>
                </Card>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 bg-muted/30">
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Figurino</p>
                  <p className="text-sm text-foreground">{moodboard.figurino}</p>
                </Card>
                <Card className="p-4 bg-muted/30">
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Props</p>
                  <p className="text-sm text-foreground">{moodboard.props}</p>
                </Card>
                <Card className="p-4 bg-muted/30">
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Clima</p>
                  <p className="text-sm text-foreground">{moodboard.arquitetura_clima}</p>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {moodboard.do_visual?.length > 0 && (
                  <Card className="p-4 bg-emerald-500/10 border-emerald-500/30">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-semibold mb-2">✓ DO Visual</p>
                    <ul className="space-y-1">
                      {moodboard.do_visual.map((item, i) => (
                        <li key={i} className="text-sm text-foreground flex items-center gap-2">
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {moodboard.dont_visual?.length > 0 && (
                  <Card className="p-4 bg-destructive/10 border-destructive/30">
                    <p className="text-xs text-destructive uppercase font-semibold mb-2">✗ DON'T Visual</p>
                    <ul className="space-y-1">
                      {moodboard.dont_visual.map((item, i) => (
                        <li key={i} className="text-sm text-foreground flex items-center gap-2">
                          <X className="w-3 h-3 text-destructive flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <EmptyState message="Moodboard não gerado" />
          )}
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
}

// Helper Components

interface EditableCardProps {
  label: string;
  value: string;
  highlight?: boolean;
  fieldKey: string;
  outputType: string;
  editingField: string | null;
  editValue: string;
  onStartEdit: (field: string, value: string) => void;
  onSaveEdit: (outputType: string, field: string) => void;
  onCancelEdit: () => void;
  onEditValueChange: (value: string) => void;
  onCopy: (text: string) => void;
  multiline?: boolean;
}

function EditableCard({
  label,
  value,
  highlight,
  fieldKey,
  outputType,
  editingField,
  editValue,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditValueChange,
  onCopy,
  multiline,
}: EditableCardProps) {
  const isEditing = editingField === `${outputType}.${fieldKey}`;
  const fullKey = `${outputType}.${fieldKey}`;

  return (
    <Card className={cn("p-4 group relative", highlight ? "bg-primary/10 border-primary/30" : "bg-muted/30")}>
      <div className="flex items-center justify-between mb-2">
        <p className={cn("text-xs uppercase font-semibold", highlight ? "text-primary" : "text-muted-foreground")}>
          {label}
        </p>
        {!isEditing && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onCopy(value)}>
              <Copy className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onStartEdit(fullKey, value)}>
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Textarea 
            value={editValue} 
            onChange={(e) => onEditValueChange(e.target.value)}
            rows={multiline ? 6 : 2}
            className="resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onCancelEdit}>
              <X className="w-3 h-3 mr-1" />
              Cancelar
            </Button>
            <Button size="sm" onClick={() => onSaveEdit(outputType, fieldKey)}>
              <Check className="w-3 h-3 mr-1" />
              Salvar
            </Button>
          </div>
        </div>
      ) : (
        <p className={cn("text-foreground", highlight && "text-lg font-medium", multiline && "whitespace-pre-wrap")}>
          {value}
        </p>
      )}
    </Card>
  );
}

function StaticCard({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <Card className="p-4 bg-muted/30">
      <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">{label}</p>
      <p className="text-foreground flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {value}
      </p>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
