import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ScanLine,
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileSignature,
  ShieldCheck,
  Users,
  Stamp,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SignatureElement {
  type: string;
  description: string;
  location: string;
  confidence: number;
  signer_name?: string | null;
  signer_role?: string | null;
  has_date?: boolean;
  date_found?: string | null;
}

interface ScanResult {
  has_signature: boolean;
  has_legal_seal: boolean;
  has_witness_signature: boolean;
  signatures_found: SignatureElement[];
  seals_found: SignatureElement[];
  document_appears_signed: boolean;
  confidence_overall: number;
  notes: string;
}

interface ScanResponse {
  scan: ScanResult;
  contract_updated: boolean;
  signature_record_created: boolean;
  message: string;
}

interface SignatureScanPanelProps {
  contractId: string;
  contractStatus: string;
  clientName?: string;
  clientEmail?: string;
  onSigned?: () => void;
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80
      ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
      : pct >= 50
      ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
      : "bg-red-500/20 text-red-500 border-red-500/30";
  return (
    <Badge variant="outline" className={cn("text-[10px] h-4 px-1", color)}>
      {pct}% confiança
    </Badge>
  );
}

function ElementCard({ el, icon }: { el: SignatureElement; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/40">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-foreground">{el.description}</span>
          <ConfidenceBadge value={el.confidence} />
        </div>
        <p className="text-[11px] text-muted-foreground">📍 {el.location}</p>
        {el.signer_name && (
          <p className="text-[11px] text-muted-foreground">👤 {el.signer_name}</p>
        )}
        {el.has_date && el.date_found && (
          <p className="text-[11px] text-muted-foreground">📅 {el.date_found}</p>
        )}
      </div>
    </div>
  );
}

export function SignatureScanPanel({
  contractId,
  contractStatus,
  clientName,
  clientEmail,
  onSigned,
}: SignatureScanPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [markAsSigned, setMarkAsSigned] = useState(false);
  const [signerName, setSignerName] = useState(clientName || "");
  const [signerEmail, setSignerEmail] = useState(clientEmail || "");
  const [showDetails, setShowDetails] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isAlreadySigned = contractStatus === "signed";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Formatos suportados: PDF, JPG, PNG, WEBP");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 20MB.");
      return;
    }
    setSelectedFile(file);
    setResult(null);
  };

  const handleScan = async () => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo para escanear");
      return;
    }

    setIsScanning(true);
    setResult(null);

    try {
      // Read file as base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const b64 = (reader.result as string).split(",")[1];
          resolve(b64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Sessão expirada");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/scan-contract-signatures`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contract_id: contractId,
            fileBase64: base64,
            mimeType: selectedFile.type,
            fileName: selectedFile.name,
            mark_as_signed: markAsSigned,
            signer_name: signerName || undefined,
            signer_email: signerEmail || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao escanear documento");
      }

      setResult(data as ScanResponse);

      if (data.contract_updated) {
        toast.success("✅ Contrato marcado como Assinado!");
        onSigned?.();
      } else if (data.scan?.document_appears_signed) {
        toast.success(`🔍 ${data.message}`);
      } else {
        toast.info(`🔍 ${data.message}`);
      }

      setShowDetails(true);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Erro ao escanear");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Already signed banner */}
      {isAlreadySigned && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            Este contrato já está marcado como Assinado. Você pode escanear para validação adicional.
          </p>
        </div>
      )}

      {/* Upload area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors",
          selectedFile
            ? "border-primary/50 bg-primary/5"
            : "border-border/50 hover:border-primary/40 hover:bg-muted/30"
        )}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
        />
        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <FileSignature className="w-6 h-6 text-primary" />
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Clique para trocar
              </p>
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Clique para selecionar o PDF ou imagem assinados
            </p>
            <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, WEBP • até 20MB</p>
          </>
        )}
      </div>

      {/* Options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Marcar como Assinado</p>
              <p className="text-xs text-muted-foreground">
                Se assinaturas forem detectadas (≥60% confiança), o status muda para Assinado
              </p>
            </div>
          </div>
          <Switch
            checked={markAsSigned}
            onCheckedChange={setMarkAsSigned}
            disabled={isAlreadySigned}
          />
        </div>

        {markAsSigned && (
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/20 border border-border/30">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do signatário</Label>
              <Input
                placeholder={clientName || "Nome do assinante"}
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input
                placeholder={clientEmail || "email@exemplo.com"}
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Scan button */}
      <Button
        className="w-full gap-2"
        onClick={handleScan}
        disabled={isScanning || !selectedFile}
      >
        {isScanning ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analisando documento com IA...
          </>
        ) : (
          <>
            <ScanLine className="w-4 h-4" />
            Escanear Assinaturas com IA
          </>
        )}
      </Button>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Assinaturas",
                value: result.scan.signatures_found.length,
                icon: <FileSignature className="w-4 h-4" />,
                active: result.scan.has_signature,
              },
              {
                label: "Carimbos/Selos",
                value: result.scan.seals_found.length,
                icon: <Stamp className="w-4 h-4" />,
                active: result.scan.has_legal_seal,
              },
              {
                label: "Testemunhas",
                value: result.scan.has_witness_signature ? "Sim" : "Não",
                icon: <Users className="w-4 h-4" />,
                active: result.scan.has_witness_signature,
              },
              {
                label: "Doc. Assinado",
                value: result.scan.document_appears_signed ? "Sim" : "Não",
                icon: <ShieldCheck className="w-4 h-4" />,
                active: result.scan.document_appears_signed,
              },
            ].map((item, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-xl p-3 text-center border transition-colors",
                  item.active
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-muted/20 border-border/30"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5",
                    item.active ? "bg-emerald-500/20 text-emerald-500" : "bg-muted/40 text-muted-foreground"
                  )}
                >
                  {item.icon}
                </div>
                <p className="text-lg font-semibold text-foreground">{item.value}</p>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Overall confidence */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
            <Info className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-foreground">Confiança geral da análise</p>
                <span className="text-xs font-mono font-semibold text-foreground">
                  {Math.round(result.scan.confidence_overall * 100)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    result.scan.confidence_overall >= 0.8
                      ? "bg-emerald-500"
                      : result.scan.confidence_overall >= 0.5
                      ? "bg-amber-500"
                      : "bg-red-500"
                  )}
                  style={{ width: `${result.scan.confidence_overall * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          {result.scan.notes && (
            <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
              <p className="text-xs text-muted-foreground">{result.scan.notes}</p>
            </div>
          )}

          {/* Contract update status */}
          {result.contract_updated && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                Contrato atualizado para <strong>Assinado</strong>
              </p>
            </div>
          )}

          {/* Detailed findings toggle */}
          {(result.scan.signatures_found.length > 0 || result.scan.seals_found.length > 0) && (
            <div className="space-y-3">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showDetails ? "Ocultar detalhes" : "Ver elementos detectados"}
              </button>

              {showDetails && (
                <div className="space-y-2">
                  {result.scan.signatures_found.map((sig, i) => (
                    <ElementCard
                      key={`sig-${i}`}
                      el={sig}
                      icon={<FileSignature className="w-4 h-4 text-primary" />}
                    />
                  ))}
                  {result.scan.seals_found.map((seal, i) => (
                    <ElementCard
                      key={`seal-${i}`}
                      el={seal}
                      icon={<Stamp className="w-4 h-4 text-primary" />}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
