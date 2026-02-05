import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Contract, ContractVersion, ContractTemplate, ContractSignature } from "@/types/contracts";
import { FileSignature, Check, Upload, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ContractClientPage() {
  const { contractId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [contract, setContract] = useState<Contract | null>(null);
  const [latestVersion, setLatestVersion] = useState<ContractVersion | null>(null);
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [signature, setSignature] = useState<ContractSignature | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [acceptForm, setAcceptForm] = useState({ name: "", email: "" });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (contractId && token) {
      validateAndFetch();
    } else {
      setError("Link inválido");
      setLoading(false);
    }
  }, [contractId, token]);

  const validateAndFetch = async () => {
    setLoading(true);

    // Validate token
    const { data: linkData, error: linkError } = await supabase
      .from('contract_links')
      .select('*')
      .eq('contract_id', contractId)
      .eq('share_token', token)
      .eq('is_active', true)
      .maybeSingle();

    if (linkError || !linkData) {
      setError("Link inválido ou expirado");
      setLoading(false);
      return;
    }

    // Check expiration
    if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
      setError("Este link expirou");
      setLoading(false);
      return;
    }

    // Update view count
    await supabase
      .from('contract_links')
      .update({
        view_count: (linkData.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq('id', linkData.id);

    // Update contract status to viewed if not signed
    const { data: contractData } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractData) {
      if (!['signed', 'completed'].includes(contractData.status)) {
        await supabase
          .from('contracts')
          .update({ status: 'viewed' })
          .eq('id', contractId);
        contractData.status = 'viewed';
      }
      setContract(contractData as Contract);

      // Fetch template
      if ((contractData as Contract).template_id) {
        const { data: templateData } = await supabase
          .from('contract_templates')
          .select('*')
          .eq('id', (contractData as Contract).template_id)
          .single();
        if (templateData) setTemplate(templateData as ContractTemplate);
      }
    }

    // Fetch latest version
    const { data: versionData } = await supabase
      .from('contract_versions')
      .select('*')
      .eq('contract_id', contractId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (versionData) setLatestVersion(versionData as ContractVersion);

    // Check if already signed
    const { data: sigData } = await supabase
      .from('contract_signatures')
      .select('*')
      .eq('contract_id', contractId)
      .maybeSingle();

    if (sigData) setSignature(sigData as ContractSignature);

    setLoading(false);
  };

  const handleAcceptClick = async () => {
    if (!acceptForm.name || !acceptForm.email) {
      toast.error("Nome e e-mail são obrigatórios");
      return;
    }

    setSubmitting(true);

    try {
      const { error: sigError } = await supabase
        .from('contract_signatures')
        .insert([{
          contract_id: contractId,
          signer_name: acceptForm.name,
          signer_email: acceptForm.email,
          signature_type: 'accept_click',
          ip_address: 'client-side',
          user_agent: navigator.userAgent,
        }]);

      if (sigError) throw sigError;

      await supabase
        .from('contracts')
        .update({ status: 'signed' })
        .eq('id', contractId);

      toast.success("Contrato aceito com sucesso!");
      setShowAcceptModal(false);
      validateAndFetch();
    } catch (error) {
      console.error("Error accepting contract:", error);
      toast.error("Erro ao aceitar contrato");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !acceptForm.name || !acceptForm.email) {
      toast.error("Preencha nome e e-mail antes de enviar");
      return;
    }

    setUploading(true);

    try {
      const fileName = `${contractId}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('marketing-assets')
        .upload(`contracts/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('marketing-assets')
        .getPublicUrl(`contracts/${fileName}`);

      const { error: sigError } = await supabase
        .from('contract_signatures')
        .insert([{
          contract_id: contractId,
          signer_name: acceptForm.name,
          signer_email: acceptForm.email,
          signature_type: 'upload_signed_pdf',
          signed_file_url: publicUrl,
          ip_address: 'client-side',
          user_agent: navigator.userAgent,
        }]);

      if (sigError) throw sigError;

      await supabase
        .from('contracts')
        .update({ status: 'signed' })
        .eq('id', contractId);

      toast.success("PDF enviado e contrato assinado!");
      setShowUploadModal(false);
      validateAndFetch();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  const renderMarkdown = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-3xl font-light text-foreground mt-8 mb-4">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-medium text-foreground mt-6 mb-3 uppercase tracking-wide">{line.slice(3)}</h2>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="font-medium text-foreground my-2">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith('- ')) {
          return <li key={i} className="text-muted-foreground ml-4">{line.slice(2)}</li>;
        }
        if (line === '---') {
          return <Separator key={i} className="my-8" />;
        }
        if (line.trim() === '') {
          return <br key={i} />;
        }
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="text-muted-foreground leading-relaxed my-2">
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j} className="text-foreground">{part}</strong> : part
            )}
          </p>
        );
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-medium text-foreground mb-2">
            {error || "Contrato não encontrado"}
          </h1>
          <p className="text-muted-foreground">
            Entre em contato para obter um novo link.
          </p>
        </div>
      </div>
    );
  }

  const isSigned = !!signature;
  const content = latestVersion?.body_rendered || template?.body || 'Conteúdo do contrato não disponível';

  return (
    <div className="min-h-screen bg-background">
      {/* Status Banner */}
      {isSigned && (
        <div className="py-3 px-6 text-center text-sm font-medium bg-emerald-500/10 text-emerald-500">
          <span className="flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Este contrato foi assinado em {format(new Date(signature.signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Cover */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <FileSignature className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-light text-foreground tracking-tight mb-4">
            {contract.project_name || "Contrato de Prestação de Serviços"}
          </h1>
          {contract.client_name && (
            <p className="text-lg text-muted-foreground mb-2">
              Preparado para <span className="text-foreground font-medium">{contract.client_name}</span>
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Versão {contract.current_version || 1}
          </p>
        </div>

        <Separator className="my-12" />

        {/* Contract Body */}
        <div className="prose prose-invert max-w-none">
          {renderMarkdown(content)}
        </div>

        <Separator className="my-12" />

        {/* Action Buttons */}
        {!isSigned && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => setShowAcceptModal(true)}
            >
              <Check className="w-5 h-5 mr-2" />
              Aceitar Contrato
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6"
              onClick={() => setShowUploadModal(true)}
            >
              <Upload className="w-5 h-5 mr-2" />
              Enviar PDF Assinado
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground mt-12">
          <p>Documento gerado automaticamente pelo SQUAD Hub</p>
        </div>
      </div>

      {/* Accept Modal */}
      <Dialog open={showAcceptModal} onOpenChange={setShowAcceptModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aceitar Contrato</DialogTitle>
            <DialogDescription>
              Confirme seus dados para formalizar o aceite deste contrato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Seu Nome Completo *</Label>
              <Input
                placeholder="Nome completo"
                value={acceptForm.name}
                onChange={(e) => setAcceptForm({ ...acceptForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Seu E-mail *</Label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={acceptForm.email}
                onChange={(e) => setAcceptForm({ ...acceptForm, email: e.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Ao aceitar, você concorda com todos os termos e condições deste contrato.
              Um registro será criado com data, hora e informações do navegador.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAcceptClick} disabled={submitting}>
              <Check className="w-4 h-4 mr-2" />
              {submitting ? "Processando..." : "Confirmar Aceite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar PDF Assinado</DialogTitle>
            <DialogDescription>
              Faça upload do contrato assinado em formato PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Seu Nome Completo *</Label>
              <Input
                placeholder="Nome completo"
                value={acceptForm.name}
                onChange={(e) => setAcceptForm({ ...acceptForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Seu E-mail *</Label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={acceptForm.email}
                onChange={(e) => setAcceptForm({ ...acceptForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>PDF Assinado *</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={uploading || !acceptForm.name || !acceptForm.email}
              />
            </div>
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando arquivo...
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
