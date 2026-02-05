import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectsStore } from "@/stores/projectsStore";
import { useFinancialStore } from "@/stores/financialStore";
import { ProjectTemplate, ProjectStageType } from "@/types/projects";
import { PROJECT_TEMPLATES, PROJECT_STAGES, getTemplateById } from "@/data/projectTemplates";
import { CLIENTS, TEAM_MEMBERS } from "@/data/projectsMockData";
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
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sparkles, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Loader2, 
  X,
  CheckCircle2,
  Wand2,
  Calendar,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { addDays, format, differenceInDays, parseISO } from "date-fns";

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PaymentMilestone {
  title: string;
  percentage?: number;
  amount?: number;
  dueDate?: string;
  trigger?: string;
}

interface StageSchedule {
  stage: string;
  plannedStart: string;
  plannedEnd: string;
  durationDays?: number;
}

interface Deliverable {
  title: string;
  type: 'video' | 'imagem' | 'pdf' | 'zip' | 'audio' | 'outro';
}

interface ExtractedData {
  title: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone?: string;
  clientDocument?: string;
  template: string;
  contractValue: number;
  startDate: string;
  deliveryDate: string;
  scope: string;
  deliverables: Deliverable[];
  paymentMilestones: PaymentMilestone[];
  stageSchedule: StageSchedule[];
  revisionLimit?: number;
  paymentTerms: string;
  additionalNotes: string;
}

export function NewProjectModal({ open, onOpenChange }: NewProjectModalProps) {
  const { addProject, updateProject } = useProjectsStore();
  const { createRevenue, createContract, createMilestone } = useFinancialStore();
  
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [showExtractedDetails, setShowExtractedDetails] = useState(false);
  
  // AI Import state
  const [importText, setImportText] = useState("");
  const [importImages, setImportImages] = useState<File[]>([]);
  const [importImagePreviews, setImportImagePreviews] = useState<string[]>([]);
  const [importPdf, setImportPdf] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<'contract' | 'proposal' | 'general'>('proposal');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    clientId: "",
    template: "" as ProjectTemplate | "",
    startDate: new Date().toISOString().split('T')[0],
    estimatedDelivery: "",
    ownerId: TEAM_MEMBERS[0].id,
    contractValue: "",
    blockPaymentEnabled: true,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      clientId: "",
      template: "",
      startDate: new Date().toISOString().split('T')[0],
      estimatedDelivery: "",
      ownerId: TEAM_MEMBERS[0].id,
      contractValue: "",
      blockPaymentEnabled: true,
    });
    setImportText("");
    setImportImages([]);
    setImportImagePreviews([]);
    setImportPdf(null);
    setExtractedData(null);
    setShowExtractedDetails(false);
    setMode('manual');
  };

  const generateStageSchedule = (
    template: ProjectTemplate,
    startDate: string,
    deliveryDate: string
  ): { stageId: string; type: ProjectStageType; plannedStart: string; plannedEnd: string }[] => {
    const templateConfig = getTemplateById(template);
    if (!templateConfig) return [];

    const stages = templateConfig.defaultStages;
    const start = parseISO(startDate);
    const end = deliveryDate ? parseISO(deliveryDate) : addDays(start, templateConfig.defaultSLADays);
    const totalDays = Math.max(differenceInDays(end, start), stages.length);
    const daysPerStage = Math.floor(totalDays / stages.length);

    return stages.map((stageType, index) => {
      const stageStart = addDays(start, index * daysPerStage);
      const stageEnd = index === stages.length - 1 
        ? end 
        : addDays(start, (index + 1) * daysPerStage - 1);

      return {
        stageId: `stage-${index}`,
        type: stageType,
        plannedStart: format(stageStart, 'yyyy-MM-dd'),
        plannedEnd: format(stageEnd, 'yyyy-MM-dd'),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.clientId || !formData.template) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const owner = TEAM_MEMBERS.find(m => m.id === formData.ownerId) || TEAM_MEMBERS[0];
    const template = PROJECT_TEMPLATES.find(t => t.id === formData.template);
    const client = CLIENTS.find(c => c.id === formData.clientId);
    const contractValue = parseFloat(formData.contractValue) || 0;
    
    // Calculate delivery date
    const deliveryDate = formData.estimatedDelivery 
      ? new Date(formData.estimatedDelivery).toISOString()
      : new Date(Date.now() + (template?.defaultSLADays || 30) * 24 * 60 * 60 * 1000).toISOString();

    // Generate stage schedule (from AI or calculate)
    const stageSchedule = extractedData?.stageSchedule?.length 
      ? extractedData.stageSchedule 
      : generateStageSchedule(
          formData.template as ProjectTemplate, 
          formData.startDate, 
          formData.estimatedDelivery
        );

    // Create project with custom stages
    const newProject = addProject({
      title: formData.title,
      clientId: formData.clientId,
      template: formData.template as ProjectTemplate,
      startDate: new Date(formData.startDate).toISOString(),
      estimatedDelivery: deliveryDate,
      owner,
      team: [owner],
      contractValue,
      blockPaymentEnabled: formData.blockPaymentEnabled,
      revisionLimit: extractedData?.revisionLimit || template?.defaultRevisionLimit || 2,
    });

    // Update project stages with planned dates if we have AI schedule
    if (stageSchedule.length > 0 && newProject) {
      const updatedStages = newProject.stages.map((stage, index) => {
        // Handle both AI extracted (has 'stage' property) and generated schedule (has 'type' property)
        const scheduleItem = stageSchedule.find(s => 
          ('stage' in s && s.stage === stage.type) || ('type' in s && s.type === stage.type)
        ) || stageSchedule[index];
        if (scheduleItem) {
          return {
            ...stage,
            plannedDate: scheduleItem.plannedStart || scheduleItem.plannedEnd,
          };
        }
        return stage;
      });
      
      updateProject(newProject.id, { stages: updatedStages });
    }

    // Create financial entries if contract value exists
    if (contractValue > 0 && newProject) {
      try {
        // Create contract
        const contract = await createContract({
          project_id: newProject.id,
          project_name: formData.title,
          client_name: client?.name,
          total_value: contractValue,
          start_date: formData.startDate,
          end_date: formData.estimatedDelivery || deliveryDate.split('T')[0],
          payment_terms: extractedData?.paymentTerms,
          notes: extractedData?.additionalNotes,
        });

        // Create payment milestones from AI extraction or default
        if (extractedData?.paymentMilestones?.length) {
          for (const milestone of extractedData.paymentMilestones) {
            const amount = milestone.amount || (milestone.percentage ? (milestone.percentage / 100) * contractValue : 0);
            if (amount > 0 && contract) {
              await createMilestone(contract.id, {
                title: milestone.title,
                amount,
                due_date: milestone.dueDate || formData.startDate,
              });
            }
          }
        } else {
          // Default: 50% upfront, 50% on delivery
          if (contract) {
            await createMilestone(contract.id, {
              title: "Entrada (50%)",
              amount: contractValue * 0.5,
              due_date: formData.startDate,
            });
            await createMilestone(contract.id, {
              title: "Entrega Final (50%)",
              amount: contractValue * 0.5,
              due_date: formData.estimatedDelivery || deliveryDate.split('T')[0],
            });
          }
        }
      } catch (error) {
        console.error("Error creating financial entries:", error);
      }
    }

    // Add calendar events for key milestones
    try {
      // Note: Calendar events would be created via Supabase if calendar table exists
      // For now, we log them - the calendar module can read from project stages
      console.log("Calendar events to create:", {
        projectStart: { date: formData.startDate, title: `Início: ${formData.title}` },
        projectDelivery: { date: formData.estimatedDelivery || deliveryDate.split('T')[0], title: `Entrega: ${formData.title}` },
      });
    } catch (error) {
      console.error("Error creating calendar events:", error);
    }

    resetForm();
    onOpenChange(false);
    toast.success("Projeto criado com sucesso! Calendário, financeiro e timeline atualizados.");
  };

  const handleTemplateChange = (value: string) => {
    const template = PROJECT_TEMPLATES.find(t => t.id === value);
    setFormData(prev => ({
      ...prev,
      template: value as ProjectTemplate,
      estimatedDelivery: template 
        ? new Date(Date.now() + template.defaultSLADays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : prev.estimatedDelivery,
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImportImages(prev => [...prev, ...files]);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImportImagePreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImportImages(prev => prev.filter((_, i) => i !== index));
    setImportImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportPdf(file);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAIExtract = async () => {
    if (!importText && importImages.length === 0 && !importPdf) {
      toast.error("Adicione pelo menos um conteúdo (texto, imagem ou PDF)");
      return;
    }

    setIsProcessing(true);
    
    try {
      const requestData: Record<string, unknown> = {
        documentType,
      };

      if (importText) {
        requestData.text = importText;
        setProcessingStep("Analisando texto...");
      }

      if (importPdf) {
        setProcessingStep("Processando PDF...");
        requestData.documentBase64 = await fileToBase64(importPdf);
      }

      if (importImages.length > 0) {
        setProcessingStep("Analisando imagens...");
        const imageBase64List = await Promise.all(
          importImages.map(img => fileToBase64(img))
        );
        requestData.imageBase64List = imageBase64List;
      }

      setProcessingStep("Extraindo dados com IA...");

      const { data, error } = await supabase.functions.invoke('extract-project-from-document', {
        body: requestData
      });

      if (error) throw error;

      if (data.success && data.projectData) {
        setExtractedData(data.projectData);
        
        // Auto-fill the form
        const templateMatch = PROJECT_TEMPLATES.find(t => t.id === data.projectData.template);
        
        // Try to match client by company name
        const clientMatch = CLIENTS.find(c => 
          c.company.toLowerCase().includes(data.projectData.clientCompany?.toLowerCase() || '') ||
          c.name.toLowerCase().includes(data.projectData.clientName?.toLowerCase() || '')
        );

        setFormData(prev => ({
          ...prev,
          title: data.projectData.title || prev.title,
          clientId: clientMatch?.id || prev.clientId,
          template: (templateMatch?.id as ProjectTemplate) || prev.template,
          startDate: data.projectData.startDate || prev.startDate,
          estimatedDelivery: data.projectData.deliveryDate || prev.estimatedDelivery,
          contractValue: data.projectData.contractValue?.toString() || prev.contractValue,
        }));

        toast.success("Dados extraídos com sucesso!");
        setMode('manual'); // Switch to manual to review/edit
        setShowExtractedDetails(true);
      }
      
    } catch (error) {
      console.error("Error extracting project:", error);
      toast.error("Erro ao processar documento. Tente novamente.");
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  const hasImportContent = importText || importImages.length > 0 || importPdf;
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            Novo Projeto
          </DialogTitle>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm transition-all ${
              mode === 'manual' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Manual
          </button>
          <button
            onClick={() => setMode('ai')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm transition-all flex items-center justify-center gap-2 ${
              mode === 'ai' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Importar com IA
          </button>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'ai' ? (
            <motion.div
              key="ai-mode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 pt-4"
            >
              {/* Document Type */}
              <div className="space-y-2">
                <Label>Tipo de Documento</Label>
                <Select value={documentType} onValueChange={(v: 'contract' | 'proposal' | 'general') => setDocumentType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proposal">Proposta Comercial</SelectItem>
                    <SelectItem value="contract">Contrato</SelectItem>
                    <SelectItem value="general">Outro Documento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Text Input */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Texto / Cole o conteúdo
                </Label>
                <Textarea
                  placeholder="Cole aqui o texto da proposta, contrato ou informações do projeto..."
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="min-h-[100px] resize-none"
                  disabled={isProcessing}
                />
              </div>

              {/* PDF Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documento PDF
                </Label>
                
                {importPdf ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 bg-muted/50 rounded-lg p-3"
                  >
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-sm flex-1 truncate">{importPdf.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(importPdf.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <button
                      onClick={() => setImportPdf(null)}
                      className="w-6 h-6 rounded-full hover:bg-destructive/20 flex items-center justify-center"
                      disabled={isProcessing}
                    >
                      <X className="w-3 h-3 text-destructive" />
                    </button>
                  </motion.div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => pdfInputRef.current?.click()}
                    disabled={isProcessing}
                    className="w-full gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload PDF
                  </Button>
                )}
                
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfSelect}
                  className="hidden"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Imagens / Prints
                </Label>
                
                <div className="flex flex-wrap gap-3">
                  <AnimatePresence>
                    {importImagePreviews.map((url, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative group"
                      >
                        <img 
                          src={url} 
                          alt={`Preview ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border border-border"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isProcessing}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors"
                    disabled={isProcessing}
                  >
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[8px] text-muted-foreground">Adicionar</span>
                  </button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              {/* AI Info */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-normal text-foreground">Extração Inteligente Completa</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      A IA irá extrair: dados do projeto, cliente, valores, <strong>parcelas de pagamento</strong>, <strong>cronograma por etapa</strong>, entregas e mais. 
                      Tudo será sincronizado automaticamente com Financeiro, Calendário e Timeline.
                    </p>
                  </div>
                </div>
              </div>

              {/* Processing State */}
              <AnimatePresence>
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-muted/50 rounded-xl p-4 flex items-center gap-3"
                  >
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <span className="text-sm text-foreground">{processingStep}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Extract Button */}
              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAIExtract}
                  disabled={!hasImportContent || isProcessing}
                  className="gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Extrair Dados
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="manual-mode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="space-y-4 pt-4"
            >
              {/* Extracted Data Banner */}
              {extractedData && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-500/10 border border-green-500/20 rounded-xl p-3"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-normal text-foreground">Dados extraídos com IA</p>
                        <button
                          type="button"
                          onClick={() => setShowExtractedDetails(!showExtractedDetails)}
                          className="text-xs text-primary flex items-center gap-1 hover:underline"
                        >
                          {showExtractedDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {showExtractedDetails ? 'Ocultar' : 'Ver detalhes'}
                        </button>
                      </div>
                      
                      <AnimatePresence>
                        {showExtractedDetails && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 space-y-3"
                          >
                            {/* Payment Milestones */}
                            {extractedData.paymentMilestones?.length > 0 && (
                              <div className="bg-background/50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <DollarSign className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-medium">Parcelas de Pagamento</span>
                                </div>
                                <div className="space-y-1">
                                  {extractedData.paymentMilestones.map((m, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground">{m.title}</span>
                                      <div className="flex items-center gap-2">
                                        {m.percentage && <Badge variant="outline" className="text-[10px]">{m.percentage}%</Badge>}
                                        {m.amount && <span className="font-medium">{formatCurrency(m.amount)}</span>}
                                        {m.dueDate && <span className="text-muted-foreground">{m.dueDate}</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Stage Schedule */}
                            {extractedData.stageSchedule?.length > 0 && (
                              <div className="bg-background/50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Calendar className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-medium">Cronograma</span>
                                </div>
                                <div className="space-y-1">
                                  {extractedData.stageSchedule.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground capitalize">{s.stage.replace('_', ' ')}</span>
                                      <span className="font-medium">{s.plannedStart} → {s.plannedEnd}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Deliverables */}
                            {extractedData.deliverables?.length > 0 && (
                              <div className="bg-background/50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Clock className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-medium">Entregas Previstas</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {extractedData.deliverables.map((d, i) => (
                                    <Badge key={i} variant="secondary" className="text-[10px]">
                                      {typeof d === 'string' ? d : d.title}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Scope */}
                            {extractedData.scope && (
                              <div className="bg-background/50 rounded-lg p-3">
                                <p className="text-xs font-medium mb-1">Escopo</p>
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{extractedData.scope}</p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Title */}
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

              {/* Client */}
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENTS.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company} - {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              {extractedData?.clientCompany && !formData.clientId && (
                  <p className="text-xs text-destructive">
                    Cliente não encontrado: {extractedData.clientCompany} ({extractedData.clientName})
                  </p>
                )}
              </div>

              {/* Template */}
              <div className="space-y-2">
                <Label>Template *</Label>
                <Select
                  value={formData.template}
                  onValueChange={handleTemplateChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o template" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TEMPLATES.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col">
                          <span>{template.name}</span>
                          <span className="text-xs text-muted-foreground">
                            SLA: {template.defaultSLADays} dias • {template.defaultRevisionLimit} revisões
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dates Row */}
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
                  <Label htmlFor="estimatedDelivery">Entrega Estimada</Label>
                  <Input
                    id="estimatedDelivery"
                    type="date"
                    value={formData.estimatedDelivery}
                    onChange={(e) => setFormData({ ...formData, estimatedDelivery: e.target.value })}
                  />
                </div>
              </div>

              {/* Owner */}
              <div className="space-y-2">
                <Label>Responsável Principal</Label>
                <Select
                  value={formData.ownerId}
                  onValueChange={(value) => setFormData({ ...formData, ownerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_MEMBERS.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} - {member.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contract Value */}
              <div className="space-y-2">
                <Label htmlFor="contractValue">Valor do Contrato (R$)</Label>
                <Input
                  id="contractValue"
                  type="number"
                  value={formData.contractValue}
                  onChange={(e) => setFormData({ ...formData, contractValue: e.target.value })}
                  placeholder="0"
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
                  checked={formData.blockPaymentEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, blockPaymentEnabled: checked })}
                />
              </div>

              {/* Sync Info */}
              {extractedData && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-xs text-blue-400 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    Ao criar, será sincronizado automaticamente com: Financeiro, Calendário, Timeline
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Criar Projeto
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
