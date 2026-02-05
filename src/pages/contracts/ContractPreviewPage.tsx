import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Contract, ContractVersion, ContractTemplate } from "@/types/contracts";
import { ArrowLeft, FileSignature, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ContractPreviewPage() {
  const { contractId } = useParams();
  const navigate = useNavigate();

  const [contract, setContract] = useState<Contract | null>(null);
  const [latestVersion, setLatestVersion] = useState<ContractVersion | null>(null);
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contractId) fetchData();
  }, [contractId]);

  const fetchData = async () => {
    setLoading(true);

    const { data: contractData } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractData) {
      setContract(contractData as Contract);

      // Fetch template if assigned
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

    setLoading(false);
  };

  const renderMarkdown = (text: string) => {
    // Simple markdown rendering
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
        // Handle bold text within line
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
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const content = latestVersion?.body_rendered || template?.body || 'Nenhum conteúdo disponível';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/contratos/${contractId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Editor
          </Button>
          <Badge variant="outline">Preview Interno</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Cover */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <FileSignature className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-light text-foreground tracking-tight mb-4">
            {contract?.project_name || "Contrato de Prestação de Serviços"}
          </h1>
          {contract?.client_name && (
            <p className="text-lg text-muted-foreground mb-2">
              Preparado para <span className="text-foreground font-medium">{contract.client_name}</span>
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Versão {contract?.current_version || 1} • {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        <Separator className="my-12" />

        {/* Contract Body */}
        <div className="prose prose-invert max-w-none">
          {renderMarkdown(content)}
        </div>

        <Separator className="my-12" />

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Documento gerado automaticamente pelo SQUAD Hub</p>
          <p className="text-xs mt-1">
            Este é um preview interno. O cliente receberá uma versão otimizada.
          </p>
        </div>
      </div>
    </div>
  );
}
