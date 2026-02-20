import { useState, useRef } from "react";
import { useProjects, CreateProjectInput } from "@/hooks/useProjects";
import { PROJECT_TEMPLATES } from "@/data/projectTemplates";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Wand2, 
  Upload, 
  FileText, 
  Image, 
  X, 
  Loader2, 
  Sparkles,
  CheckCircle2,
  File,
  ChevronDown,
  Package,
  Calendar,
  DollarSign,
  FileCheck,
  ClipboardList,
  Images,
} from "lucide-react";
import { toast } from "sonner";

interface AIProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UploadedFile {
  file: File;
  preview?: string;
  type: 'pdf' | 'image' | 'docx' | 'txt' | 'other';
}

interface Deliverable {
  title: string;
  type: 'video' | 'imagem' | 'pdf' | 'zip' | 'audio' | 'outro';
  specifications?: string;
  quantity?: number;
  selected?: boolean;
}

interface PaymentMilestone {
  title: string;
  percentage?: number;
  amount: number;
  dueDate?: string;
  trigger?: string;
}

interface StageSchedule {
  stage: string;
  plannedStart?: string;
  plannedEnd?: string;
  durationDays?: number;
}

interface ExtractedData {
  title: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;
  clientDocument: string;
  template: string;
  contractValue: number;
  startDate: string;
  deliveryDate: string;
  revisionLimit: number;
  executiveSummary: string;
  fullScope: string;
  deliverables: Deliverable[];
  paymentMilestones: PaymentMilestone[];
  stageSchedule: StageSchedule[];
  paymentTerms: string;
  additionalNotes: string;
  rawExtractedContent: string;
  has_payment_block: boolean;
}

const STAGE_NAMES: Record<string, string> = {
  briefing: "Briefing",
  roteiro: "Roteiro",
  pre_producao: "Pré-Produção",
  captacao: "Captação",
  edicao: "Edição",
  revisao: "Revisão",
  aprovacao: "Aprovação",
  entrega: "Entrega",
  pos_venda: "Pós-Venda"
};

const DELIVERABLE_TYPE_LABELS: Record<string, string> = {
  video: "Vídeo",
  imagem: "Imagem",
  pdf: "PDF",
  zip: "Arquivo ZIP",
  audio: "Áudio",
  outro: "Outro"
};

export function AIProjectModal({ open, onOpenChange }: AIProjectModalProps) {
  const { createProject, isCreating } = useProjects();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<'upload' | 'processing' | 'extracting_visuals' | 'review'>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [additionalText, setAdditionalText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState("");
  const [autoCreateClient, setAutoCreateClient] = useState(true);
  const [activeTab, setActiveTab] = useState("projeto");
  const [scopeExpanded, setScopeExpanded] = useState(false);
  const [extractedAssets, setExtractedAssets] = useState<any[]>([]);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ExtractedData>({
    title: "",
    clientName: "",
    clientCompany: "",
    clientEmail: "",
    clientPhone: "",
    clientDocument: "",
    template: "",
    contractValue: 0,
    startDate: new Date().toISOString().split('T')[0],
    deliveryDate: "",
    revisionLimit: 2,
    executiveSummary: "",
    fullScope: "",
    deliverables: [],
    paymentMilestones: [],
    stageSchedule: [],
    paymentTerms: "",
    additionalNotes: "",
    rawExtractedContent: "",
    has_payment_block: true,
  });

  const resetForm = () => {
    setStep('upload');
    setUploadedFiles([]);
    setAdditionalText("");
    setIsProcessing(false);
    setProcessingProgress(0);
    setProcessingStep("");
    setActiveTab("projeto");
    setScopeExpanded(false);
    setExtractedAssets([]);
    setCreatedProjectId(null);
    setFormData({
      title: "",
      clientName: "",
      clientCompany: "",
      clientEmail: "",
      clientPhone: "",
      clientDocument: "",
      template: "",
      contractValue: 0,
      startDate: new Date().toISOString().split('T')[0],
      deliveryDate: "",
      revisionLimit: 2,
      executiveSummary: "",
      fullScope: "",
      deliverables: [],
      paymentMilestones: [],
      stageSchedule: [],
      paymentTerms: "",
      additionalNotes: "",
      rawExtractedContent: "",
      has_payment_block: true,
    });
  };

  const detectFileType = (file: File): UploadedFile['type'] => {
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.startsWith('image/')) return 'image';
    if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword' ||
      file.name.endsWith('.docx') ||
      file.name.endsWith('.doc')
    ) return 'docx';
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) return 'txt';
    return 'other';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const newFiles: UploadedFile[] = files.map(file => {
      const fileType = detectFileType(file);
      const isImage = fileType === 'image';
      
      return {
        file,
        type: fileType,
        preview: isImage ? URL.createObjectURL(file) : undefined,
      };
    });

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
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
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  // Read TXT file as plain text
  const readTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file, 'utf-8');
      reader.onload = () => resolve(reader.result as string);
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
      const pdfFiles = uploadedFiles.filter(f => f.type === 'pdf');
      const imageFiles = uploadedFiles.filter(f => f.type === 'image');
      const docxFiles = uploadedFiles.filter(f => f.type === 'docx');
      const txtFiles = uploadedFiles.filter(f => f.type === 'txt');
      
      setProcessingProgress(20);
      setProcessingStep("Convertendo documentos...");

      let documentBase64: string | undefined;
      let imageBase64List: string[] = [];
      const textDocuments: Array<{ name: string; content: string; mimeType: string }> = [];

      if (pdfFiles.length > 0) {
        documentBase64 = await fileToBase64(pdfFiles[0].file);
      }

      // Convert DOCX to base64 for edge function processing
      for (const docxFile of docxFiles) {
        const base64 = await fileToBase64(docxFile.file);
        textDocuments.push({
          name: docxFile.file.name,
          content: base64,
          mimeType: docxFile.file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
      }

      setProcessingProgress(30);
      setProcessingStep("Lendo arquivos de texto...");

      // Read TXT files as plain text
      for (const txtFile of txtFiles) {
        const text = await readTextFile(txtFile.file);
        textDocuments.push({
          name: txtFile.file.name,
          content: text,
          mimeType: 'text/plain',
        });
      }

      setProcessingProgress(40);
      setProcessingStep("Processando imagens...");

      for (const imageFile of imageFiles) {
        const base64 = await fileToBase64(imageFile.file);
        imageBase64List.push(base64);
      }

      setProcessingProgress(60);
      setProcessingStep("Extraindo informações com IA (detalhamento completo)...");

      const { data, error } = await supabase.functions.invoke('extract-project-from-document', {
        body: {
          text: additionalText || undefined,
          documentBase64,
          imageBase64List: imageBase64List.length > 0 ? imageBase64List : undefined,
          textDocuments: textDocuments.length > 0 ? textDocuments : undefined,
          documentType: 'contract',
        }
      });

      if (error) throw error;

      setProcessingProgress(85);
      setProcessingStep("Preenchendo formulário...");

      if (data.projectData) {
        const extracted = data.projectData;
        
        const deliverablesWithSelection = (extracted.deliverables || []).map((d: Deliverable) => ({
          ...d,
          selected: true
        }));

        setFormData({
          title: extracted.title || "",
          clientName: extracted.clientName || "",
          clientCompany: extracted.clientCompany || "",
          clientEmail: extracted.clientEmail || "",
          clientPhone: extracted.clientPhone || "",
          clientDocument: extracted.clientDocument || "",
          template: extracted.template || "",
          contractValue: extracted.contractValue || 0,
          startDate: extracted.startDate || new Date().toISOString().split('T')[0],
          deliveryDate: extracted.deliveryDate || "",
          revisionLimit: extracted.revisionLimit || 2,
          executiveSummary: extracted.executiveSummary || "",
          fullScope: extracted.fullScope || "",
          deliverables: deliverablesWithSelection,
          paymentMilestones: extracted.paymentMilestones || [],
          stageSchedule: extracted.stageSchedule || [],
          paymentTerms: extracted.paymentTerms || "",
          additionalNotes: extracted.additionalNotes || "",
          rawExtractedContent: extracted.rawExtractedContent || "",
          has_payment_block: true,
        });
      }

      // Step 2: Extract visual assets in background
      setProcessingProgress(90);
      setProcessingStep("Extraindo assets visuais com IA...");
      setStep('extracting_visuals');

      // Run visual extraction non-blocking
      try {
        const allFilesForVisual = uploadedFiles.filter(f => f.file.size <= 20 * 1024 * 1024);
        if (allFilesForVisual.length > 0) {
          const filesPayload = await Promise.all(
            allFilesForVisual.map(async (uf) => ({
              name: uf.file.name,
              base64: await fileToBase64(uf.file),
              mime_type: uf.file.type,
              size_bytes: uf.file.size,
            }))
          );

          const { data: visualData } = await supabase.functions.invoke('extract-visual-assets', {
            body: {
              project_id: '__pending__', // will be linked after project creation
              files: filesPayload,
              uploaded_by_user_id: user?.id,
            }
          });

          if (visualData?.assets) {
            setExtractedAssets(visualData.assets);
          }
        }
      } catch (visualErr) {
        console.warn('Visual extraction failed (non-blocking):', visualErr);
      }

      setProcessingProgress(100);
      setStep('review');
      toast.success("Dados extraídos com sucesso! Revise todas as abas.");

    } catch (error) {
      console.error("Error processing:", error);
      toast.error("Erro ao processar documento. Tente novamente.");
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const buildCompleteDescription = (): string => {
    const parts: string[] = [];

    if (formData.executiveSummary) {
      parts.push(`## RESUMO EXECUTIVO\n${formData.executiveSummary}`);
    }

    if (formData.fullScope) {
      parts.push(`## ESCOPO DETALHADO\n${formData.fullScope}`);
    }

    if (formData.deliverables.length > 0) {
      const selectedDeliverables = formData.deliverables.filter(d => d.selected !== false);
      const deliverablesList = selectedDeliverables
        .map(d => `- ${d.title} (${DELIVERABLE_TYPE_LABELS[d.type] || d.type})${d.specifications ? `: ${d.specifications}` : ''}${d.quantity ? ` x${d.quantity}` : ''}`)
        .join('\n');
      parts.push(`## ENTREGAS\n${deliverablesList}`);
    }

    if (formData.paymentTerms || formData.paymentMilestones.length > 0) {
      let conditionsText = "";
      if (formData.paymentTerms) {
        conditionsText += formData.paymentTerms + "\n\n";
      }
      if (formData.paymentMilestones.length > 0) {
        conditionsText += "Parcelas:\n" + formData.paymentMilestones
          .map(m => `- ${m.title}: R$ ${m.amount.toLocaleString('pt-BR')}${m.dueDate ? ` (${m.dueDate})` : ''}${m.trigger ? ` - ${m.trigger}` : ''}`)
          .join('\n');
      }
      parts.push(`## CONDIÇÕES FINANCEIRAS\n${conditionsText}`);
    }

    if (formData.additionalNotes) {
      parts.push(`## OBSERVAÇÕES\n${formData.additionalNotes}`);
    }

    parts.push(`## CONFIGURAÇÕES\n- Limite de revisões: ${formData.revisionLimit}`);

    return parts.join('\n\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast.error("Nome do projeto é obrigatório");
      return;
    }

    const clientName = formData.clientName || formData.clientCompany || "Cliente não identificado";
    
    // Auto-create CRM contact if we have client data
    if (autoCreateClient && (formData.clientName || formData.clientCompany)) {
      try {
        // Check if contact already exists
        const { data: existingContact } = await supabase
          .from('crm_contacts')
          .select('id')
          .or(`name.ilike.%${formData.clientName}%,company.ilike.%${formData.clientCompany}%`)
          .limit(1)
          .maybeSingle();

        if (!existingContact) {
          await supabase.from('crm_contacts').insert({
            name: formData.clientName || formData.clientCompany || 'Cliente',
            company: formData.clientCompany || null,
            email: formData.clientEmail || null,
            phone: formData.clientPhone || null,
            tags: ['importado-ia'],
          });
          
          await supabase.from('event_logs').insert({
            action: 'crm_contact_auto_created',
            entity_type: 'crm_contact',
            details: { source: 'ai_project_import', client_name: formData.clientName },
          });
        }
      } catch (err) {
        console.error('Error auto-creating CRM contact:', err);
      }
    }

    const projectData: CreateProjectInput = {
      name: formData.title,
      client_name: clientName,
      description: buildCompleteDescription(),
      template: formData.template || undefined,
      start_date: formData.startDate || undefined,
      due_date: formData.deliveryDate || undefined,
      contract_value: formData.contractValue || undefined,
      has_payment_block: formData.has_payment_block,
      client_document: formData.clientDocument || undefined,
      payment_terms: formData.paymentTerms || undefined,
      payment_milestones: formData.paymentMilestones.length > 0
        ? formData.paymentMilestones.map(m => ({
            title: m.title,
            percentage: m.percentage,
            amount: m.amount,
            dueDate: m.dueDate,
            trigger: m.trigger,
          }))
        : undefined,
    };

    createProject(projectData);
    
    if (autoCreateClient && clientName) {
      toast.success(`Projeto criado! Cliente "${clientName}" adicionado automaticamente.`);
    }
    
    resetForm();
    onOpenChange(false);
  };

  const toggleDeliverable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map((d, i) => 
        i === index ? { ...d, selected: !d.selected } : d
      )
    }));
  };

  const getFileIcon = (type: UploadedFile['type']) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-destructive" />;
      case 'image': return <Image className="w-5 h-5 text-primary" />;
      case 'docx': return <FileText className="w-5 h-5 text-primary" />;
      case 'txt': return <FileText className="w-5 h-5 text-muted-foreground" />;
      default: return <File className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Criar Projeto com IA
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6 pt-4 overflow-y-auto">
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
                PDF, DOCX, TXT, Imagens (JPG, PNG)
              </p>
              <p className="text-[10px] text-muted-foreground mt-2">
                Múltiplos arquivos permitidos
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.txt"
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

        {(step === 'processing' || step === 'extracting_visuals') && (
          <div className="py-12 space-y-6">
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
                {step === 'extracting_visuals' && (
                  <Sparkles className="w-5 h-5 text-primary absolute -top-1 -right-1 animate-pulse" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {step === 'extracting_visuals' ? 'Extraindo assets visuais...' : 'Processando documentos...'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {processingStep}
              </p>
            </div>
            <Progress value={processingProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {step === 'extracting_visuals'
                ? 'A IA está identificando logos, identidade visual, assinaturas e outros elementos.'
                : 'A IA está analisando seus documentos para extrair TODAS as informações do projeto.'}
            </p>
          </div>
        )}

        {step === 'review' && (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-xl mb-4">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm text-primary">
                Dados extraídos! Revise todas as abas antes de criar.
                {extractedAssets.length > 0 && ` • ${extractedAssets.length} asset(s) visual(is) detectado(s).`}
              </span>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className={`grid w-full mb-4 ${extractedAssets.length > 0 ? 'grid-cols-5' : 'grid-cols-4'}`}>
                <TabsTrigger value="projeto" className="gap-1 text-xs">
                  <FileCheck className="w-3 h-3" />
                  Projeto
                </TabsTrigger>
                <TabsTrigger value="escopo" className="gap-1 text-xs">
                  <ClipboardList className="w-3 h-3" />
                  Escopo
                </TabsTrigger>
                <TabsTrigger value="entregas" className="gap-1 text-xs">
                  <Package className="w-3 h-3" />
                  Entregas
                  {formData.deliverables.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                      {formData.deliverables.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="financeiro" className="gap-1 text-xs">
                  <DollarSign className="w-3 h-3" />
                  Financeiro
                </TabsTrigger>
                {extractedAssets.length > 0 && (
                  <TabsTrigger value="visual" className="gap-1 text-xs">
                    <Images className="w-3 h-3" />
                    Visual
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                      {extractedAssets.length}
                    </Badge>
                  </TabsTrigger>
                )}
              </TabsList>

              <ScrollArea className="flex-1 pr-4">
                {/* Tab: Projeto */}
                <TabsContent value="projeto" className="space-y-4 mt-0">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientEmail">Email</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={formData.clientEmail}
                        onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                        placeholder="email@empresa.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientPhone">Telefone</Label>
                      <Input
                        id="clientPhone"
                        value={formData.clientPhone}
                        onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

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
                </TabsContent>

                {/* Tab: Escopo */}
                <TabsContent value="escopo" className="space-y-4 mt-0">
                  {formData.executiveSummary && (
                    <div className="space-y-2">
                      <Label>Resumo Executivo</Label>
                      <div className="p-4 bg-muted/30 rounded-xl text-sm text-foreground whitespace-pre-wrap">
                        {formData.executiveSummary}
                      </div>
                    </div>
                  )}

                  <Collapsible open={scopeExpanded} onOpenChange={setScopeExpanded}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span className="flex items-center gap-2">
                          <ClipboardList className="w-4 h-4" />
                          Escopo Completo ({formData.fullScope.length} caracteres)
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${scopeExpanded ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <Textarea
                        value={formData.fullScope}
                        onChange={(e) => setFormData({ ...formData, fullScope: e.target.value })}
                        placeholder="Escopo detalhado do projeto..."
                        rows={12}
                        className="font-mono text-xs"
                      />
                    </CollapsibleContent>
                  </Collapsible>

                  {formData.additionalNotes && (
                    <div className="space-y-2">
                      <Label>Observações e Cláusulas</Label>
                      <Textarea
                        value={formData.additionalNotes}
                        onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                        placeholder="Cláusulas especiais, restrições..."
                        rows={4}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="revisionLimit">Limite de Revisões</Label>
                    <Input
                      id="revisionLimit"
                      type="number"
                      min={0}
                      value={formData.revisionLimit}
                      onChange={(e) => setFormData({ ...formData, revisionLimit: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  {formData.stageSchedule.length > 0 && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Cronograma por Etapa
                      </Label>
                      <div className="space-y-2">
                        {formData.stageSchedule.map((schedule, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <span className="text-sm font-medium">
                              {STAGE_NAMES[schedule.stage] || schedule.stage}
                            </span>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {schedule.plannedStart && (
                                <span>Início: {schedule.plannedStart}</span>
                              )}
                              {schedule.plannedEnd && (
                                <span>Fim: {schedule.plannedEnd}</span>
                              )}
                              {schedule.durationDays && (
                                <Badge variant="secondary">{schedule.durationDays} dias</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Tab: Entregas */}
                <TabsContent value="entregas" className="space-y-4 mt-0">
                  {formData.deliverables.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma entrega identificada no documento</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Entregas Previstas</Label>
                        <span className="text-xs text-muted-foreground">
                          {formData.deliverables.filter(d => d.selected !== false).length} selecionadas
                        </span>
                      </div>
                      <div className="space-y-2">
                        {formData.deliverables.map((deliverable, index) => (
                          <div 
                            key={index}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                              deliverable.selected !== false 
                                ? 'bg-primary/5 border-primary/30' 
                                : 'bg-muted/20 border-transparent'
                            }`}
                          >
                            <Checkbox
                              checked={deliverable.selected !== false}
                              onCheckedChange={() => toggleDeliverable(index)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{deliverable.title}</span>
                                <Badge variant="outline" className="text-[10px]">
                                  {DELIVERABLE_TYPE_LABELS[deliverable.type] || deliverable.type}
                                </Badge>
                                {deliverable.quantity && deliverable.quantity > 1 && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    x{deliverable.quantity}
                                  </Badge>
                                )}
                              </div>
                              {deliverable.specifications && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {deliverable.specifications}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Tab: Financeiro */}
                <TabsContent value="financeiro" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="contractValue">Valor Total do Contrato</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                      <Input
                        id="contractValue"
                        type="number"
                        value={formData.contractValue || ""}
                        onChange={(e) => setFormData({ ...formData, contractValue: parseFloat(e.target.value) || 0 })}
                        placeholder="0,00"
                        className="pl-10"
                      />
                    </div>
                    {formData.contractValue > 0 && (
                      <p className="text-lg font-semibold text-primary">
                        {formatCurrency(formData.contractValue)}
                      </p>
                    )}
                  </div>

                  {formData.paymentMilestones.length > 0 && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Parcelas / Milestones
                      </Label>
                      <div className="space-y-2">
                        {formData.paymentMilestones.map((milestone, index) => (
                          <div key={index} className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{milestone.title}</span>
                              <span className="text-sm font-semibold text-primary">
                                {formatCurrency(milestone.amount)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {milestone.percentage && (
                                <span>{milestone.percentage}% do total</span>
                              )}
                              {milestone.dueDate && (
                                <span>Vencimento: {milestone.dueDate}</span>
                              )}
                              {milestone.trigger && (
                                <Badge variant="outline" className="text-[10px]">
                                  {milestone.trigger}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.paymentTerms && (
                    <div className="space-y-2">
                      <Label>Condições de Pagamento</Label>
                      <div className="p-3 bg-muted/30 rounded-lg text-sm">
                        {formData.paymentTerms}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Tab: Visual Assets */}
                {extractedAssets.length > 0 && (
                  <TabsContent value="visual" className="space-y-4 mt-0">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        A IA detectou <strong>{extractedAssets.length}</strong> asset(s) nos documentos enviados. Eles foram salvos e estarão disponíveis na aba <strong>Galeria IA</strong> do projeto.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {extractedAssets.slice(0, 6).map((asset: any, i: number) => (
                        <div key={i} className="p-3 bg-muted/30 rounded-xl space-y-1.5">
                          {asset.thumb_url && (
                            <img src={asset.thumb_url} alt={asset.ai_title || asset.title} className="w-full h-24 object-cover rounded-lg mb-2" />
                          )}
                          <p className="text-xs font-medium text-foreground truncate">
                            {asset.ai_title || asset.title}
                          </p>
                          {asset.ai_summary && (
                            <p className="text-[10px] text-muted-foreground line-clamp-2">{asset.ai_summary}</p>
                          )}
                          {asset.ai_tags && asset.ai_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {asset.ai_tags.slice(0, 3).map((tag: string, j: number) => (
                                <span key={j} className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {extractedAssets.length > 6 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{extractedAssets.length - 6} assets adicionais salvos na Galeria IA
                      </p>
                    )}
                  </TabsContent>
                )}
              </ScrollArea>
            </Tabs>

            {/* Actions */}
            <div className="flex justify-between gap-3 pt-4 mt-4 border-t">
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
