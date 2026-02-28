import { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, Sparkles, Loader2, CheckCircle, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExtractedData {
  client_name?: string;
  client_email?: string;
  client_document?: string;
  total_value?: number;
  payment_terms?: string;
  start_date?: string;
  end_date?: string;
  project_name?: string;
  notes?: string;
}

interface ContractAiUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  projectName?: string;
  onSuccess?: (contractId: string) => void;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const ACCEPTED_EXTENSIONS = ".pdf,.docx,.doc,.jpg,.jpeg,.png,.webp,.zip";

const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

type Step = "upload" | "processing" | "preview" | "generating" | "done";

export function ContractAiUploadDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  onSuccess,
}: ContractAiUploadDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<ExtractedData>({});
  const [contractId, setContractId] = useState<string | null>(null);
  const [createdRevenues, setCreatedRevenues] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("Analisando documento com IA...");
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload");
    setSelectedFile(null);
    setExtracted({});
    setContractId(null);
    setCreatedRevenues(0);
    setIsDragging(false);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Formato não suportado. Use PDF, DOCX, JPG ou PNG.`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `Arquivo muito grande. Máximo ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const processFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSelectedFile(file);
    setStep("processing");
    setProcessingMessage("Lendo arquivo...");

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip the data URL prefix
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setProcessingMessage("Analisando documento com IA...");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-contract-from-file`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            fileBase64: base64,
            mimeType: file.type,
            fileName: file.name,
            project_id: projectId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const msg = data?.error || "Erro ao processar documento";
        toast.error(msg);
        setStep("upload");
        return;
      }

      setExtracted(data.extracted || {});
      setContractId(data.contract_id || null);
      setCreatedRevenues(data.created_revenues || 0);

      if (data.warning === "existing_contract") {
        toast.warning("Este projeto já possui um contrato. Revise os dados extraídos.");
      }

      setStep("preview");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar arquivo. Tente novamente.");
      setStep("upload");
    }
  }, [projectId]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleConfirm = async () => {
    if (!contractId) {
      toast.error("Nenhum contrato para confirmar");
      return;
    }

    // Step 1: notify user
    toast.success(
      `Contrato criado com IA! ${createdRevenues > 0 ? `${createdRevenues} parcela(s) gerada(s).` : ""}`
    );

    // Step 2: generate juridical text in background
    setStep("generating");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-contract-text`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ contract_id: contractId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.warn("Contract text generation warning:", data?.error);
        // Non-blocking: continue even if text generation fails
        toast.warning("Contrato criado, mas o texto jurídico não pôde ser gerado agora. Acesse o contrato para gerar manualmente.");
      } else {
        toast.success(`Texto jurídico gerado com IA • ${data.message || "Versão 1 salva"}`);
      }
    } catch (err) {
      console.warn("Contract text generation error:", err);
      toast.warning("Contrato criado. Gere o texto jurídico abrindo o contrato.");
    }

    setStep("done");
    onSuccess?.(contractId);

    setTimeout(() => {
      handleClose();
    }, 1800);
  };

  const updateField = (field: keyof ExtractedData, value: string | number) => {
    setExtracted((prev) => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (value?: number) => {
    if (!value) return "";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Criar Contrato com IA
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Envie um contrato ou proposta comercial. A IA extrai os dados e gera o texto jurídico formal."}
            {step === "processing" && "Processando seu documento..."}
            {step === "preview" && "Revise os dados extraídos antes de confirmar."}
            {step === "generating" && "Aguarde enquanto a IA redige o texto jurídico..."}
            {step === "done" && "Contrato criado e texto jurídico gerado com sucesso!"}
          </DialogDescription>
        </DialogHeader>

        {/* UPLOAD STEP */}
        {step === "upload" && (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                className="hidden"
                onChange={handleFileInput}
              />
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                Arraste e solte ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, DOCX, JPG, PNG — máximo {MAX_SIZE_MB}MB
              </p>
            </div>

            <div className="rounded-lg bg-muted/30 border border-border p-3">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">A IA extrai automaticamente:</strong> cliente, valor, condições de pagamento, datas e escopo do serviço.
                Funciona com contratos existentes e propostas comerciais.
              </p>
            </div>
          </div>
        )}

        {/* PROCESSING STEP */}
        {step === "processing" && (
          <div className="flex flex-col items-center py-10 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <Loader2 className="absolute inset-0 m-auto w-16 h-16 text-primary/30 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{processingMessage}</p>
              {selectedFile && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <FileText className="w-3 h-3" />
                  {selectedFile.name}
                </p>
              )}
            </div>
          </div>
        )}

        {/* GENERATING LEGAL TEXT STEP */}
        {step === "generating" && (
          <div className="flex flex-col items-center py-10 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <Loader2 className="absolute inset-0 m-auto w-16 h-16 text-primary/30 animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">Redigindo texto jurídico...</p>
              <p className="text-xs text-muted-foreground">A IA está gerando as cláusulas do contrato formal</p>
            </div>
          </div>
        )}

        {/* PREVIEW STEP */}
        {step === "preview" && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {selectedFile && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border">
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{selectedFile.name}</span>
                <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto flex-shrink-0" />
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome do Projeto</Label>
                  <Input
                    value={extracted.project_name || ""}
                    onChange={(e) => updateField("project_name", e.target.value)}
                    placeholder="Nome do projeto"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Cliente</Label>
                  <Input
                    value={extracted.client_name || ""}
                    onChange={(e) => updateField("client_name", e.target.value)}
                    placeholder="Nome do cliente"
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">E-mail</Label>
                  <Input
                    value={extracted.client_email || ""}
                    onChange={(e) => updateField("client_email", e.target.value)}
                    placeholder="email@cliente.com"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">CPF / CNPJ</Label>
                  <Input
                    value={extracted.client_document || ""}
                    onChange={(e) => updateField("client_document", e.target.value)}
                    placeholder="000.000.000-00"
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor Total (R$)</Label>
                  <Input
                    type="number"
                    value={extracted.total_value || ""}
                    onChange={(e) => updateField("total_value", parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Condições de Pagamento</Label>
                  <Input
                    value={extracted.payment_terms || ""}
                    onChange={(e) => updateField("payment_terms", e.target.value)}
                    placeholder="Ex: 50% entrada + 50%"
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Data de Início</Label>
                  <Input
                    type="date"
                    value={extracted.start_date || ""}
                    onChange={(e) => updateField("start_date", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Data de Término</Label>
                  <Input
                    type="date"
                    value={extracted.end_date || ""}
                    onChange={(e) => updateField("end_date", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Escopo / Observações</Label>
                <Textarea
                  value={extracted.notes || ""}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Descrição do serviço contratado..."
                  className="text-sm resize-none"
                  rows={3}
                />
              </div>
            </div>

            {createdRevenues > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  <strong>{createdRevenues} parcela(s)</strong> gerada(s) automaticamente com base nas condições de pagamento.
                </p>
              </div>
            )}

            {!extracted.total_value && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Valor não identificado. Preencha o valor para gerar as parcelas financeiras.
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={reset} className="flex-1">
                <X className="w-3 h-3 mr-1" />
                Tentar Outro Arquivo
              </Button>
              <Button size="sm" onClick={handleConfirm} className="flex-1">
                <CheckCircle className="w-3 h-3 mr-1" />
                Confirmar e Criar Contrato
              </Button>
            </div>
          </div>
        )}

        {/* DONE STEP */}
        {step === "done" && (
          <div className="flex flex-col items-center py-10 gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-foreground">Contrato criado com sucesso!</p>
            {createdRevenues > 0 && (
              <p className="text-xs text-muted-foreground">{createdRevenues} parcela(s) financeira(s) gerada(s)</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
