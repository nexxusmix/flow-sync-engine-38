import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Save, FileVideo, Sparkles, Lightbulb, FileText, 
  Film, Camera, Palette, MessageSquare, Hash,
  Download, Loader2, ExternalLink, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Json } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CreativePackage, CreativePackageContent } from "@/types/creative-packages";
import { CreateContentDialog } from "@/components/studio/CreateContentDialog";
import { Campaign } from "@/types/marketing";
import { useExportPdf } from "@/hooks/useExportPdf";

interface CreativePackageViewerProps {
  pkg: CreativePackage | null;
  campaign: Campaign;
  campaigns: Campaign[];
  onClose: () => void;
  onRefresh: () => void;
}

export function CreativePackageViewer({
  pkg,
  campaign,
  campaigns,
  onClose,
  onRefresh,
}: CreativePackageViewerProps) {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateContent, setShowCreateContent] = useState(false);
  const [editedContent, setEditedContent] = useState<CreativePackageContent | null>(null);
  
  // Export PDF
  const { isExporting, exportedUrl, exportCreativePackage, openPdf, copyLink, resetExport } = useExportPdf();

  // Initialize edited content when package changes
  const content = editedContent || pkg?.package_json;

  const handleContentChange = (field: keyof CreativePackageContent, value: unknown) => {
    if (!pkg) return;
    
    setEditedContent(prev => ({
      ...(prev || pkg.package_json),
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!pkg || !editedContent) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("campaign_creative_packages")
        .update({ package_json: editedContent as unknown as Json })
        .eq("id", pkg.id);

      if (error) throw error;

      toast.success("Pacote atualizado");
      onRefresh();
    } catch (error) {
      console.error("Error saving package:", error);
      toast.error("Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = editedContent !== null;

  if (!pkg) return null;

  return (
    <>
      <Sheet open={!!pkg} onOpenChange={() => onClose()}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="flex flex-row items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {pkg.title}
              </SheetTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Campanha: {campaign.name}
              </p>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCreateContent(true)}
                className="gap-2"
              >
                <FileVideo className="w-4 h-4" />
                Criar Conteúdo
              </Button>
              
              {exportedUrl ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={openPdf}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={copyLink}
                  >
                    <Copy className="w-4 h-4" />
                    Copiar Link
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => pkg && exportCreativePackage(pkg.id)}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isExporting ? "Exportando..." : "Exportar PDF"}
                </Button>
              )}
              
              {hasChanges && (
                <Button 
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
              )}
            </div>

            {/* Output Tabs */}
            <Tabs defaultValue="concept" className="w-full">
              <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
                {content?.concept && (
                  <TabsTrigger value="concept" className="text-xs gap-1">
                    <Lightbulb className="w-3 h-3" />
                    Conceito
                  </TabsTrigger>
                )}
                {content?.script && (
                  <TabsTrigger value="script" className="text-xs gap-1">
                    <FileText className="w-3 h-3" />
                    Roteiro
                  </TabsTrigger>
                )}
                {content?.storyboard && content.storyboard.length > 0 && (
                  <TabsTrigger value="storyboard" className="text-xs gap-1">
                    <Film className="w-3 h-3" />
                    Storyboard
                  </TabsTrigger>
                )}
                {content?.shotlist && content.shotlist.length > 0 && (
                  <TabsTrigger value="shotlist" className="text-xs gap-1">
                    <Camera className="w-3 h-3" />
                    Shotlist
                  </TabsTrigger>
                )}
                {content?.moodboard && (
                  <TabsTrigger value="moodboard" className="text-xs gap-1">
                    <Palette className="w-3 h-3" />
                    Moodboard
                  </TabsTrigger>
                )}
                {content?.captionVariations && content.captionVariations.length > 0 && (
                  <TabsTrigger value="captions" className="text-xs gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Legendas
                  </TabsTrigger>
                )}
                {content?.hashtags && content.hashtags.length > 0 && (
                  <TabsTrigger value="hashtags" className="text-xs gap-1">
                    <Hash className="w-3 h-3" />
                    Hashtags
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Concept Tab */}
              {content?.concept && (
                <TabsContent value="concept" className="mt-4 space-y-4">
                  {content.concept.headline && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Headline</Label>
                      <Textarea
                        value={content.concept.headline}
                        onChange={(e) => handleContentChange("concept", {
                          ...content.concept,
                          headline: e.target.value,
                        })}
                        rows={2}
                      />
                    </div>
                  )}
                  {content.concept.subheadline && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Subheadline</Label>
                      <Textarea
                        value={content.concept.subheadline}
                        onChange={(e) => handleContentChange("concept", {
                          ...content.concept,
                          subheadline: e.target.value,
                        })}
                        rows={2}
                      />
                    </div>
                  )}
                  {content.concept.big_idea && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Big Idea</Label>
                      <Textarea
                        value={content.concept.big_idea}
                        onChange={(e) => handleContentChange("concept", {
                          ...content.concept,
                          big_idea: e.target.value,
                        })}
                        rows={3}
                      />
                    </div>
                  )}
                </TabsContent>
              )}

              {/* Script Tab */}
              {content?.script && (
                <TabsContent value="script" className="mt-4 space-y-4">
                  {content.script.hook && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Hook</Label>
                      <Textarea
                        value={content.script.hook}
                        onChange={(e) => handleContentChange("script", {
                          ...content.script,
                          hook: e.target.value,
                        })}
                        rows={2}
                      />
                    </div>
                  )}
                  {content.script.desenvolvimento && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Desenvolvimento</Label>
                      <Textarea
                        value={content.script.desenvolvimento}
                        onChange={(e) => handleContentChange("script", {
                          ...content.script,
                          desenvolvimento: e.target.value,
                        })}
                        rows={8}
                      />
                    </div>
                  )}
                  {content.script.cta && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">CTA</Label>
                      <Textarea
                        value={content.script.cta}
                        onChange={(e) => handleContentChange("script", {
                          ...content.script,
                          cta: e.target.value,
                        })}
                        rows={2}
                      />
                    </div>
                  )}
                </TabsContent>
              )}

              {/* Storyboard Tab */}
              {content?.storyboard && content.storyboard.length > 0 && (
                <TabsContent value="storyboard" className="mt-4 space-y-3">
                  {content.storyboard.map((scene, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px]">
                          Cena {scene.scene_number || idx + 1}
                        </Badge>
                        {scene.duration_sec && (
                          <span className="text-[10px] text-muted-foreground">
                            {scene.duration_sec}s
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{scene.description}</p>
                      {scene.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{scene.notes}</p>
                      )}
                    </div>
                  ))}
                </TabsContent>
              )}

              {/* Shotlist Tab */}
              {content?.shotlist && content.shotlist.length > 0 && (
                <TabsContent value="shotlist" className="mt-4">
                  <div className="space-y-2">
                    {content.shotlist.map((shot, idx) => (
                      <div key={idx} className="p-3 rounded bg-muted/30 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-[10px]">
                            #{idx + 1}
                          </Badge>
                          <span className="text-sm font-medium">{shot.plano}</span>
                        </div>
                        <p className="text-sm text-foreground">{shot.descricao}</p>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                          {shot.lente_sugerida && <span>🔍 {shot.lente_sugerida}</span>}
                          {shot.ambiente && <span>📍 {shot.ambiente}</span>}
                          {shot.luz && <span>💡 {shot.luz}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}

              {/* Moodboard Tab */}
              {content?.moodboard && (
                <TabsContent value="moodboard" className="mt-4 space-y-4">
                  {content.moodboard.direcao_de_arte && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Direção de Arte</Label>
                      <p className="text-sm">{content.moodboard.direcao_de_arte}</p>
                    </div>
                  )}
                  {content.moodboard.paleta && content.moodboard.paleta.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Paleta</Label>
                      <div className="flex flex-wrap gap-2">
                        {content.moodboard.paleta.map((color, idx) => (
                          <Badge key={idx} variant="secondary">{color}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {content.moodboard.referencias && content.moodboard.referencias.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Referências</Label>
                      <ul className="text-sm list-disc list-inside">
                        {content.moodboard.referencias.map((ref, idx) => (
                          <li key={idx}>{ref}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>
              )}

              {/* Captions Tab */}
              {content?.captionVariations && content.captionVariations.length > 0 && (
                <TabsContent value="captions" className="mt-4 space-y-3">
                  {content.captionVariations.map((caption, idx) => (
                    <div key={idx} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Variação {idx + 1}
                      </Label>
                      <Textarea
                        value={caption}
                        onChange={(e) => {
                          const newCaptions = [...content.captionVariations!];
                          newCaptions[idx] = e.target.value;
                          handleContentChange("captionVariations", newCaptions);
                        }}
                        rows={3}
                      />
                    </div>
                  ))}
                </TabsContent>
              )}

              {/* Hashtags Tab */}
              {content?.hashtags && content.hashtags.length > 0 && (
                <TabsContent value="hashtags" className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {content.hashtags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Content Dialog */}
      <CreateContentDialog
        open={showCreateContent}
        onOpenChange={setShowCreateContent}
        brief={{ id: pkg.studio_run_id || pkg.id, title: pkg.title } as any}
        concept={content?.concept}
        script={content?.script}
        captionVariations={content?.captionVariations}
        hashtags={content?.hashtags}
        campaigns={campaigns}
      />
    </>
  );
}
