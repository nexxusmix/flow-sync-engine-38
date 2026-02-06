import { useState } from "react";
import { Wand2, Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { BrandKit } from "@/types/marketing";
import { PACKAGE_TYPES, PackageType } from "@/types/creative-studio";

const OBJECTIVES = [
  { value: 'conversion', label: 'Conversão', description: 'Foco em vendas e leads' },
  { value: 'branding', label: 'Branding', description: 'Posicionamento de marca' },
  { value: 'engagement', label: 'Engajamento', description: 'Interação e comunidade' },
  { value: 'awareness', label: 'Awareness', description: 'Alcance e visibilidade' },
  { value: 'education', label: 'Educação', description: 'Conteúdo informativo' },
];

const DELIVERY_TYPES = [
  { value: 'video', label: 'Vídeo', icon: '🎬' },
  { value: 'reels', label: 'Reels/Shorts', icon: '📱' },
  { value: 'campaign', label: 'Campanha', icon: '🎯' },
  { value: 'institutional', label: 'Institucional', icon: '🏢' },
  { value: 'social_post', label: 'Post Social', icon: '📲' },
  { value: 'stories', label: 'Stories', icon: '⏱️' },
];

interface StudioBriefFormProps {
  brandKits: BrandKit[];
  isGenerating: boolean;
  progress: number;
  onGenerate: (data: {
    title: string;
    inputText: string;
    brandKitId: string | null;
    packageType: PackageType;
    objective: string;
    deliveryType: string;
    referenceFiles: File[];
  }) => void;
}

export function StudioBriefForm({ brandKits, isGenerating, progress, onGenerate }: StudioBriefFormProps) {
  const [title, setTitle] = useState("");
  const [inputText, setInputText] = useState("");
  const [selectedBrandKit, setSelectedBrandKit] = useState<string>("none");
  const [packageType, setPackageType] = useState<PackageType>("full");
  const [objective, setObjective] = useState<string>("conversion");
  const [deliveryType, setDeliveryType] = useState<string>("video");
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setReferenceFiles(prev => [...prev, ...newFiles].slice(0, 5)); // Max 5 files
    }
  };

  const removeFile = (index: number) => {
    setReferenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!title || !inputText) return;
    
    onGenerate({
      title,
      inputText,
      brandKitId: selectedBrandKit === "none" ? null : selectedBrandKit,
      packageType,
      objective,
      deliveryType,
      referenceFiles,
    });
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="w-3 h-3" />;
    return <FileText className="w-3 h-3" />;
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 p-5">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-primary" />
        Novo Brief Criativo
      </h3>

      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Título do Projeto</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Campanha Black Friday 2024"
            disabled={isGenerating}
            className="h-9"
          />
        </div>

        {/* Row: Brand Kit + Package Type */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Brand Kit</Label>
            <Select value={selectedBrandKit} onValueChange={setSelectedBrandKit} disabled={isGenerating}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {brandKits.map(kit => (
                  <SelectItem key={kit.id} value={kit.id}>{kit.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Pacote</Label>
            <Select value={packageType} onValueChange={(v) => setPackageType(v as PackageType)} disabled={isGenerating}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PACKAGE_TYPES.map(pkg => (
                  <SelectItem key={pkg.type} value={pkg.type}>
                    {pkg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row: Objective + Delivery Type */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Objetivo</Label>
            <Select value={objective} onValueChange={setObjective} disabled={isGenerating}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OBJECTIVES.map(obj => (
                  <SelectItem key={obj.value} value={obj.value}>
                    {obj.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Tipo de Entrega</Label>
            <Select value={deliveryType} onValueChange={setDeliveryType} disabled={isGenerating}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DELIVERY_TYPES.map(dt => (
                  <SelectItem key={dt.value} value={dt.value}>
                    <span className="flex items-center gap-2">
                      <span>{dt.icon}</span>
                      <span>{dt.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Briefing */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Briefing</Label>
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Descreva o projeto: objetivo, público-alvo, tom de voz, restrições, referências..."
            rows={5}
            disabled={isGenerating}
            className="resize-none"
          />
        </div>

        {/* Reference Files */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Referências (opcional)</Label>
          <div className="border border-dashed border-border rounded-lg p-3">
            {referenceFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {referenceFiles.map((file, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="gap-1.5 pr-1"
                  >
                    {getFileIcon(file)}
                    <span className="max-w-[100px] truncate text-xs">{file.name}</span>
                    <button 
                      onClick={() => removeFile(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <label className="flex items-center justify-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Upload className="w-4 h-4" />
              <span>Adicionar arquivos</span>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
                disabled={isGenerating || referenceFiles.length >= 5}
                className="hidden"
              />
            </label>
            <p className="text-[10px] text-muted-foreground text-center mt-1">
              PDF, DOCX ou imagens (máx. 5 arquivos)
            </p>
          </div>
        </div>

        {/* Progress */}
        {isGenerating && (
          <div className="space-y-2 py-2">
            <Progress value={progress} className="h-1.5" />
            <p className="text-xs text-muted-foreground text-center">
              Gerando pacote criativo com IA...
            </p>
          </div>
        )}

        {/* Submit */}
        <Button 
          className="w-full h-10 gap-2"
          onClick={handleSubmit}
          disabled={isGenerating || !title || !inputText}
        >
          <Wand2 className="w-4 h-4" />
          {isGenerating ? "Processando..." : "Gerar com IA"}
        </Button>
      </div>
    </Card>
  );
}
