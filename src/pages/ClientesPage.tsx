import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useCRM, Contact } from "@/hooks/useCRM";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrencyBRL } from "@/utils/format";
import { Search, Plus, Users, Briefcase, DollarSign, UserPlus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { ClientDetailDrawer } from "@/components/clients/ClientDetailDrawer";
import { format } from "date-fns";

export default function ClientesPage() {
  const { user } = useAuth();
  const { contacts, isLoading, createContact, updateContact, deleteContact, isCreatingContact } = useCRM();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Fetch projects for metrics
  const { data: projects = [] } = useQuery({
    queryKey: ["clients-projects"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("id, name, client_name, status, contract_value");
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch contracts for metrics
  const { data: contracts = [] } = useQuery({
    queryKey: ["clients-contracts"],
    queryFn: async () => {
      const { data } = await supabase.from("contracts").select("id, client_name, total_value, status");
      return data || [];
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [contacts, search]);

  // Metrics
  const totalClients = contacts.length;
  const activeClients = useMemo(() => {
    const clientNames = new Set(
      projects.filter((p) => p.status === "active").map((p) => p.client_name?.toLowerCase())
    );
    return contacts.filter(
      (c) => clientNames.has(c.name.toLowerCase()) || clientNames.has(c.company?.toLowerCase() || "")
    ).length;
  }, [contacts, projects]);

  const totalContractValue = useMemo(() => {
    return contracts.reduce((sum, c) => sum + (c.total_value || 0), 0);
  }, [contracts]);

  const newThisMonth = useMemo(() => {
    const now = new Date();
    return contacts.filter((c) => {
      const d = new Date(c.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [contacts]);

  // Enrichment: count projects per contact
  const projectCountByContact = useMemo(() => {
    const map: Record<string, number> = {};
    contacts.forEach((c) => {
      const count = projects.filter(
        (p) =>
          p.client_name?.toLowerCase() === c.name.toLowerCase() ||
          (c.company && p.client_name?.toLowerCase() === c.company.toLowerCase())
      ).length;
      map[c.id] = count;
    });
    return map;
  }, [contacts, projects]);

  return (
    <DashboardLayout title="Clientes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter uppercase">Clientes</h1>
            <p className="text-sm text-muted-foreground font-light">Gestão completa dos seus clientes e contatos</p>
          </div>
          <Button onClick={() => { setEditingContact(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Cliente
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total de Clientes", value: totalClients, icon: Users, color: "text-primary" },
            { label: "Clientes Ativos", value: activeClients, icon: Briefcase, color: "text-primary" },
            { label: "Valor em Contratos", value: formatCurrencyBRL(totalContractValue), icon: DollarSign, color: "text-muted-foreground" },
            { label: "Novos no Mês", value: newThisMonth, icon: UserPlus, color: "text-primary" },
          ].map((m) => (
            <div key={m.label} className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <m.icon className={`w-4 h-4 ${m.color}`} />
                <span className="text-[10px] text-muted-foreground font-light uppercase tracking-wider">{m.label}</span>
              </div>
              <p className="text-xl font-bold tracking-tighter">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="groups"
            title="Nenhum cliente encontrado"
            description={search ? "Tente outra busca" : "Adicione seu primeiro cliente"}
          />
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Telefone</TableHead>
                  <TableHead className="hidden lg:table-cell">Projetos</TableHead>
                  <TableHead className="hidden lg:table-cell">Tags</TableHead>
                  <TableHead className="hidden lg:table-cell">Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedContact(c)}
                  >
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.company || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{c.email || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{c.phone || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {projectCountByContact[c.id] > 0 && (
                        <span className="bg-primary/15 text-primary text-[10px] px-2 py-0.5 rounded font-light">
                          {projectCountByContact[c.id]}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {c.tags?.slice(0, 2).map((t) => (
                          <span key={t} className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                      {format(new Date(c.createdAt), "dd/MM/yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <ClientFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        contact={editingContact}
        onCreate={createContact}
        onUpdate={updateContact}
        isCreating={isCreatingContact}
      />

      {/* Detail Drawer */}
      <ClientDetailDrawer
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
        onEdit={(c) => { setEditingContact(c); setShowForm(true); }}
        onDelete={(id) => { deleteContact(id); setSelectedContact(null); }}
      />
    </DashboardLayout>
  );
}
