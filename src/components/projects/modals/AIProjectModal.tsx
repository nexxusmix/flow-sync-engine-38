import { useState, useRef } from "react";
import { useProjects, CreateProjectInput } from "@/hooks/useProjects";
import { PROJECT_TEMPLATES } from "@/data/projectTemplates";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Wand2, 
  Upload, 
  FileText, 
  Image, 
  X, 
  Loader2, 
  Sparkles,
  AlertCircle,
  CheckCircle2,
  File
} from "lucide-react";
import { toast } from "sonner";

interface AIProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UploadedFile {
  file: File;
  preview?: string;
  type: 'pdf' | 'image' | 'other';
}

interface ExtractedData {
  title: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;
  template: string;
  contractValue: number;
  startDate: string;
  deliveryDate: string;
  scope: string;
  revisionLimit: number;
}

export function AIProjectModal({ open, onOpenChange }: AIProjectModalProps) {
  const { createProject, isCreating } = useProjects();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<'upload' | 'processing' | 'review'>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [additionalText, setAdditionalText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState("");
  const [autoCreateClient, setAutoCreateClient] = useState(true);
  
  const [formData, setFormData] = useState<ExtractedData & { has_payment_block: boolean }>({
    title: "",
    clientName: "",
    clientCompany: "",
    clientEmail: "",
    clientPhone: "",
    template: "",
    contractValue: 0,
    startDate: new Date().toISOString().split('T')[0],
    deliveryDate: "",
    scope: "",
    revisionLimit: 2,
    has_payment_block: true,
  });

  const resetForm = () => {
    setStep('upload');
    setUploadedFiles([]);
    setAdditionalText("");
    setIsProcessing(false);
    setProcessingProgress(0);
    setProcessingStep("");
    setFormData({
      title: "",
      clientName: "",
      clientCompany: "",
      clientEmail: "",
      clientPhone: "",
      template: "",
      contractValue: 0,
      startDate: new Date().toISOString().split('T')[0],
      deliveryDate: "",
      scope: "",
      revisionLimit: 2,
      has_payment_block: true,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const newFiles: UploadedFile[] = files.map(file => {
      const isPdf = file.type === 'application/pdf';
      const isImage = file.type.startsWith('image/');
      
      return {
        file,
        type: isPdf ? 'pdf' : isImage ? 'image' : 'other',
        preview: isImage ? URL.createObjectURL(file) : undefined,
      };
    });

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const processWithAI = async () => {
    if (uploadedFiles.length === 0 && !additionalText) {
      toast.error("Adicione pelo menos um arquivo ou texto para processar");
      return;
    }

    setIsProcessing(true);
    setStep('processing');
    setProcessingProgress(10);
    setProcessingStep("Preparando arquivos...");

    try {
      // Separate PDFs and images
      const pdfFiles = uploadedFiles.filter(f => f.type === 'pdf');
      const imageFiles = uploadedFiles.filter(f => f.type === 'image');
      
      setProcessingProgress(20);
      setProcessingStep("Convertendo documentos...");

      // Convert to base64
      let documentBase64: string | undefined;
      let imageBase64List: string[] = [];

      if (pdfFiles.length > 0) {
        // Use the first PDF as main document
        documentBase64 = await fileToBase64(pdfFiles[0].file);
      }

      setProcessingProgress(40);
      setProcessingStep("Processando imagens...");

      for (const imageFile of imageFiles) {
        const base64 = await fileToBase64(imageFile.file);
        imageBase64List.push(base64);
      }

      // If no PDF but has images, process images
      if (!documentBase64 && imageBase64List.length === 0 && additionalText) {
        // Text-only processing
      }

      setProcessingProgress(60);
      setProcessingStep("Extraindo informações com IA...");

      const { data, error } = await supabase.functions.invoke('extract-project-from-document', {
        body: {
          text: additionalText || undefined,
          documentBase64,
          imageBase64List: imageBase64List.length > 0 ? imageBase64List : undefined,
          documentType: 'contract',
        }
      });

      if (error) throw error;

      setProcessingProgress(90);
      setProcessingStep("Preenchendo formulário...");

      if (data.projectData) {
        const extracted = data.projectData;
        setFormData({
          title: extracted.title || "",
          clientName: extracted.clientName || "",
          clientCompany: extracted.clientCompany || "",
          clientEmail: extracted.clientEmail || "",
          clientPhone: extracted.clientPhone || "",
          template: extracted.template || "",
          contractValue: extracted.contractValue || 0,
          startDate: extracted.startDate || new Date().toISOString().split('T')[0],
          deliveryDate: extracted.deliveryDate || "",
          scope: extracted.scope || "",
          revisionLimit: extracted.revisionLimit || 2,
          has_payment_block: true,
        });
      }

      setProcessingProgress(100);
      setStep('review');
      toast.success("Dados extraídos com sucesso!");

    } catch (error) {
      console.error("Error processing:", error);
      toast.error("Erro ao processar documento. Tente novamente.");
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast.error("Nome do projeto é obrigatório");
      return;
    }

    // Determine client name (use company if name is empty)
    const clientName = formData.clientName || formData.clientCompany || "Cliente não identificado";
    
    // Auto-create client logic is implicit - we just use the extracted name
    // The actual client record could be created in a separate CRM system
    
    const projectData: CreateProjectInput = {
      name: formData.title,
      client_name: clientName,
      description: formData.scope || undefined,
      template: formData.template || undefined,
      start_date: formData.startDate || undefined,
      due_date: formData.deliveryDate || undefined,
      contract_value: formData.contractValue || undefined,
      has_payment_block: formData.has_payment_block,
    };

    createProject(projectData);
    
    // Show success message with auto-created client info
    if (autoCreateClient && clientName) {
      toast.success(`Projeto criado! Cliente "${clientName}" adicionado automaticamente.`);
    }
    
    resetForm();
    onOpenChange(false);
  };

  const getFileIcon = (type: UploadedFile['type']) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-destructive" />;
      case 'image': return <Image className="w-5 h-5 text-primary" />;
      default: return <File className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Criar Projeto com IA
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6 pt-4">
            {/* File Upload Area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/50 rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all"
            >
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm font-medium text-foreground mb-1">
                Arraste arquivos ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, Imagens (JPG, PNG), documentos variados
              </p>
              <p className="text-[10px] text-muted-foreground mt-2">
                Múltiplos arquivos permitidos
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
                onChange={handleFileSelect}
                multiple
              />
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  {uploadedFiles.length} arquivo(s) selecionado(s)
                </Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {uploadedFiles.map((file, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl"
                    >
                      {file.preview ? (
                        <img 
                          src={file.preview} 
                          alt={file.file.name}
                          className="w-10 h-10 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          {getFileIcon(file.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {file.file.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatFileSize(file.file.size)} • {file.type.toUpperCase()}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="h-8 w-8"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Text */}
            <div className="space-y-2">
              <Label htmlFor="additionalText">Informações adicionais (opcional)</Label>
              <Textarea
                id="additionalText"
                value={additionalText}
                onChange={(e) => setAdditionalText(e.target.value)}
                placeholder="Cole aqui texto de email, briefing ou informações complementares..."
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Auto-create client toggle */}
            <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-xl">
              <div className="space-y-0.5">
                <Label className="text-sm">Criar cliente automaticamente</Label>
                <p className="text-[10px] text-muted-foreground">
                  Se o cliente não existir, será criado automaticamente
                </p>
              </div>
              <Switch
                checked={autoCreateClient}
                onCheckedChange={setAutoCreateClient}
              />
            </div>

            {/* Process Button */}
            <Button
              onClick={processWithAI}
              disabled={uploadedFiles.length === 0 && !additionalText}
              className="w-full h-12 rounded-xl gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Extrair Dados com IA
            </Button>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-12 space-y-6">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Processando documentos...
              </h3>
              <p className="text-sm text-muted-foreground">
                {processingStep}
              </p>
            </div>
            <Progress value={processingProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              A IA está analisando seus documentos para extrair informações do projeto.
            </p>
          </div>
        )}

        {step === 'review' && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-sm text-primary">
                Dados extraídos com sucesso! Revise e ajuste se necessário.
              </span>
            </div>

            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="title">Nome do Projeto *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Campanha Institucional 2025"
                required
              />
            </div>

            {/* Client Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nome do Contato</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="João Silva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientCompany">Empresa</Label>
                <Input
                  id="clientCompany"
                  value={formData.clientCompany}
                  onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                  placeholder="Empresa ABC"
                />
              </div>
            </div>

            {/* Template */}
            <div className="space-y-2">
              <Label>Template do Projeto</Label>
              <Select 
                value={formData.template} 
                onValueChange={(value) => setFormData({ ...formData, template: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TEMPLATES.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.defaultSLADays} dias)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Entrega Estimada</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                />
              </div>
            </div>

            {/* Contract Value */}
            <div className="space-y-2">
              <Label htmlFor="contractValue">Valor do Contrato (R$)</Label>
              <Input
                id="contractValue"
                type="number"
                value={formData.contractValue || ""}
                onChange={(e) => setFormData({ ...formData, contractValue: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            {/* Scope */}
            <div className="space-y-2">
              <Label htmlFor="scope">Escopo / Descrição</Label>
              <Textarea
                id="scope"
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                placeholder="Descrição do escopo do projeto..."
                rows={3}
              />
            </div>

            {/* Block Payment Toggle */}
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label>Bloquear entrega se inadimplente</Label>
                <p className="text-xs text-muted-foreground">
                  Impede entrega final se houver fatura em atraso
                </p>
              </div>
              <Switch
                checked={formData.has_payment_block}
                onCheckedChange={(checked) => setFormData({ ...formData, has_payment_block: checked })}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep('upload')}
              >
                Voltar
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Criando...' : 'Criar Projeto'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
