import { Contact } from "@/hooks/useCRM";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrencyBRL } from "@/utils/format";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Mail, Phone, Instagram, Building, Calendar, Briefcase, FileText, DollarSign } from "lucide-react";

interface ClientDetailDrawerProps {
  contact: Contact | null;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
}

export function ClientDetailDrawer({ contact, onClose, onEdit, onDelete }: ClientDetailDrawerProps) {
  const contactName = contact?.name?.toLowerCase() || "";
  const contactCompany = contact?.company?.toLowerCase() || "";

  // Fetch related projects
  const { data: projects = [] } = useQuery({
    queryKey: ["client-projects", contact?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, client_name, status, contract_value, created_at")
        .or(`client_name.ilike.%${contactName}%${contactCompany ? `,client_name.ilike.%${contactCompany}%` : ""}`);
      return data || [];
    },
    enabled: !!contact,
  });

  // Fetch related deals
  const { data: deals = [] } = useQuery({
    queryKey: ["client-deals", contact?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_deals")
        .select("id, title, stage_key, value, created_at")
        .eq("contact_id", contact!.id);
      return data || [];
    },
    enabled: !!contact,
  });

  // Fetch related contracts
  const { data: contracts = [] } = useQuery({
    queryKey: ["client-contracts", contact?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("contracts")
        .select("id, project_name, total_value, status, start_date")
        .or(`client_name.ilike.%${contactName}%${contactCompany ? `,client_name.ilike.%${contactCompany}%` : ""}`);
      return data || [];
    },
    enabled: !!contact,
  });

  // Fetch revenues from client projects
  const projectIds = projects.map((p) => p.id);
  const { data: revenues = [] } = useQuery({
    queryKey: ["client-revenues", contact?.id, projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return [];
      const { data } = await supabase
        .from("revenues")
        .select("id, description, amount, status, due_date, project_id")
        .in("project_id", projectIds);
      return data || [];
    },
    enabled: !!contact && projectIds.length > 0,
  });

  if (!contact) return null;

  const totalProjectValue = projects.reduce((s, p) => s + (p.contract_value || 0), 0);
  const totalRevenue = revenues.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <Sheet open={!!contact} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl font-bold tracking-tighter">{contact.name}</SheetTitle>
              {contact.company && (
                <p className="text-sm text-muted-foreground font-light flex items-center gap-1 mt-1">
                  <Building className="w-3 h-3" /> {contact.company}
                </p>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => onEdit(contact)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(contact.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-wrap gap-3 pt-2">
            {contact.email && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="w-3 h-3" /> {contact.email}
              </span>
            )}
            {contact.phone && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="w-3 h-3" /> {contact.phone}
              </span>
            )}
            {contact.instagram && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Instagram className="w-3 h-3" /> {contact.instagram}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" /> Desde {format(new Date(contact.createdAt), "dd/MM/yyyy")}
            </span>
          </div>
        </SheetHeader>

        <Tabs defaultValue="resumo" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="projetos">Projetos</TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="contratos">Contratos</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          </TabsList>

          {/* Resumo */}
          <TabsContent value="resumo" className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-light">Projetos</p>
                <p className="text-lg font-bold">{projects.length}</p>
              </div>
              <div className="glass-card rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-light">Deals</p>
                <p className="text-lg font-bold">{deals.length}</p>
              </div>
              <div className="glass-card rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-light">Valor Projetos</p>
                <p className="text-lg font-bold">{formatCurrencyBRL(totalProjectValue)}</p>
              </div>
              <div className="glass-card rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-light">Receitas</p>
                <p className="text-lg font-bold">{formatCurrencyBRL(totalRevenue)}</p>
              </div>
            </div>
            {contact.notes && (
              <div className="glass-card rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-light mb-1">Notas</p>
                <p className="text-sm text-foreground/80">{contact.notes}</p>
              </div>
            )}
            {contact.tags?.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {contact.tags.map((t) => (
                  <span key={t} className="bg-primary/15 text-primary text-[10px] px-2 py-0.5 rounded">{t}</span>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Projetos */}
          <TabsContent value="projetos" className="space-y-2 pt-2">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum projeto vinculado</p>
            ) : (
              projects.map((p) => (
                <div key={p.id} className="glass-card rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Briefcase className="w-3 h-3 text-primary" /> {p.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">{p.status}</p>
                  </div>
                  <span className="text-sm font-light">{formatCurrencyBRL(p.contract_value || 0)}</span>
                </div>
              ))
            )}
          </TabsContent>

          {/* Deals */}
          <TabsContent value="deals" className="space-y-2 pt-2">
            {deals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum deal vinculado</p>
            ) : (
              deals.map((d) => (
                <div key={d.id} className="glass-card rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{d.title}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{d.stage_key}</p>
                  </div>
                  <span className="text-sm font-light">{formatCurrencyBRL(d.value || 0)}</span>
                </div>
              ))
            )}
          </TabsContent>

          {/* Contratos */}
          <TabsContent value="contratos" className="space-y-2 pt-2">
            {contracts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum contrato vinculado</p>
            ) : (
              contracts.map((c) => (
                <div key={c.id} className="glass-card rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-primary" /> {c.project_name || "Contrato"}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">{c.status}</p>
                  </div>
                  <span className="text-sm font-light">{formatCurrencyBRL(c.total_value || 0)}</span>
                </div>
              ))
            )}
          </TabsContent>

          {/* Financeiro */}
          <TabsContent value="financeiro" className="space-y-2 pt-2">
            {revenues.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma receita vinculada</p>
            ) : (
              revenues.map((r) => (
                <div key={r.id} className="glass-card rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <DollarSign className="w-3 h-3 text-primary" /> {r.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">
                      {r.status} • {r.due_date ? format(new Date(r.due_date), "dd/MM/yyyy") : "—"}
                    </p>
                  </div>
                  <span className="text-sm font-light">{formatCurrencyBRL(r.amount || 0)}</span>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
