import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, LogOut, ChevronDown, CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuickActionsMenu } from "./QuickActionsMenu";

interface HeaderProps {
  title: string;
  onOpenSearch: () => void;
}

const roles = [
  { id: "dono", label: "Dono" },
  { id: "comercial", label: "Comercial" },
  { id: "operacao", label: "Operação" },
  { id: "financeiro", label: "Financeiro" },
];

export function Header({ title, onOpenSearch }: HeaderProps) {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("dono");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const { logout } = useAuth();
  
  // Modal states
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form states
  const [newLead, setNewLead] = useState({ title: "", company: "", value: "" });
  const [newProposal, setNewProposal] = useState({ title: "", client_name: "", client_email: "" });

  const handleCreateLead = async () => {
    if (!newLead.title) {
      toast.error("Título é obrigatório");
      return;
    }
    
    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('crm_deals')
        .insert([{
          title: newLead.title,
          stage_key: 'lead',
          value: newLead.value ? parseFloat(newLead.value) : 0,
        }])
        .select()
        .single();

      if (error) throw error;

      // If company provided, create contact
      if (newLead.company) {
        await supabase.from('crm_contacts').insert([{
          name: newLead.company,
          company: newLead.company,
        }]).select().single().then(async (contactRes) => {
          if (contactRes.data) {
            await supabase.from('crm_deals').update({ contact_id: contactRes.data.id }).eq('id', data.id);
          }
        });
      }

      toast.success("Lead criado com sucesso!");
      setShowLeadModal(false);
      setNewLead({ title: "", company: "", value: "" });
      navigate('/crm');
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error("Erro ao criar lead");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateProposal = async () => {
    if (!newProposal.title || !newProposal.client_name) {
      toast.error("Título e cliente são obrigatórios");
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('proposals')
        .insert([{
          title: newProposal.title,
          client_name: newProposal.client_name,
          client_email: newProposal.client_email || null,
          status: 'draft',
          total_value: 0,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success("Proposta criada!");
      setShowProposalModal(false);
      setNewProposal({ title: "", client_name: "", client_email: "" });
      navigate(`/propostas/${data.id}`);
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error("Erro ao criar proposta");
    } finally {
      setIsCreating(false);
    }
  };

  const handlePayment = () => {
    navigate('/financeiro/projetos');
  };

  return (
    <>
      <motion.header 
        className="sticky top-0 z-30 h-16 bg-background/60 backdrop-blur-xl border-b border-white/[0.04] flex items-center justify-between px-4 md:px-6"
        initial={{ y: -56, opacity: 0, filter: "blur(10px)" }}
        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 150, damping: 22 }}
      >
        {/* Left: Version badge (subtle) */}
        <motion.div 
          className="flex items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="hidden md:flex items-center gap-2 text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em]">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse" />
            <span>Alpha v2.4</span>
          </div>
        </motion.div>

        {/* Center: Search (constrained width) */}
        <motion.button
          onClick={onOpenSearch}
          className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.05] transition-all max-w-xs w-full md:w-72"
          initial={{ opacity: 0, y: -10, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -1 }}
        >
          <Search className="h-4 w-4 text-muted-foreground/70" />
          <span className="text-xs text-muted-foreground/70 flex-1 text-left">Buscar...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/50 bg-white/[0.04] px-1.5 py-0.5 rounded">
            <span>⌘</span>
            <span>K</span>
          </kbd>
        </motion.button>

        {/* Right: Actions + Role + Logout */}
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Quick Actions Menu (+ Novo) */}
          <QuickActionsMenu 
            onNewLead={() => setShowLeadModal(true)}
            onNewProposal={() => setShowProposalModal(true)}
          />

          {/* Primary CTA: Pagamento */}
          <Button
            size="sm"
            className="h-9 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            onClick={handlePayment}
          >
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline text-xs uppercase tracking-wider font-light">Pagamento</span>
          </Button>

          {/* Separator */}
          <div className="h-6 w-px bg-white/[0.06] mx-1 hidden md:block" />

          {/* Role Switcher (compact) */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
            >
              <span className="text-[10px] font-light text-foreground/90 uppercase tracking-wider">
                {roles.find((r) => r.id === selectedRole)?.label}
              </span>
              <ChevronDown 
                className={cn(
                  "h-3 w-3 text-muted-foreground/60 transition-transform",
                  roleDropdownOpen && "rotate-180"
                )} 
              />
            </button>

            <AnimatePresence>
              {roleDropdownOpen && (
                <>
                  <motion.div
                    className="fixed inset-0 z-40"
                    onClick={() => setRoleDropdownOpen(false)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                  <motion.div 
                    className="absolute right-0 top-full mt-1.5 w-36 bg-background/95 backdrop-blur-xl rounded-lg border border-white/10 shadow-2xl z-50 py-1 overflow-hidden"
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                  >
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => {
                          setSelectedRole(role.id);
                          setRoleDropdownOpen(false);
                          toast.success(`Modo: ${role.label}`);
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-left text-[10px] font-light uppercase tracking-wider transition-colors",
                          selectedRole === role.id
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        )}
                      >
                        {role.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Logout Button (icon only) */}
          <button
            onClick={async () => {
              await logout();
              window.location.href = '/';
            }}
            className="w-9 h-9 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-destructive/20 hover:border-destructive/30 hover:text-destructive flex items-center justify-center transition-colors"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </motion.div>
      </motion.header>

      {/* New Lead Modal */}
      <Dialog open={showLeadModal} onOpenChange={setShowLeadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
            <DialogDescription>
              Adicione um novo lead ao pipeline comercial
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título do Deal *</Label>
              <Input
                placeholder="Ex: Vídeo Institucional - Empresa XYZ"
                value={newLead.title}
                onChange={(e) => setNewLead({ ...newLead, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa / Cliente</Label>
              <Input
                placeholder="Ex: Empresa XYZ Ltda"
                value={newLead.company}
                onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Estimado (R$)</Label>
              <Input
                type="number"
                placeholder="Ex: 15000"
                value={newLead.value}
                onChange={(e) => setNewLead({ ...newLead, value: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeadModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateLead} disabled={isCreating}>
              {isCreating ? "Criando..." : "Criar Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Proposal Modal */}
      <Dialog open={showProposalModal} onOpenChange={setShowProposalModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Proposta</DialogTitle>
            <DialogDescription>
              Crie uma nova proposta comercial
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título da Proposta *</Label>
              <Input
                placeholder="Ex: Vídeo Institucional - Empresa XYZ"
                value={newProposal.title}
                onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome do Cliente *</Label>
              <Input
                placeholder="Ex: João Silva"
                value={newProposal.client_name}
                onChange={(e) => setNewProposal({ ...newProposal, client_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail do Cliente</Label>
              <Input
                type="email"
                placeholder="cliente@email.com"
                value={newProposal.client_email}
                onChange={(e) => setNewProposal({ ...newProposal, client_email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProposalModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateProposal} disabled={isCreating}>
              {isCreating ? "Criando..." : "Criar Proposta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
