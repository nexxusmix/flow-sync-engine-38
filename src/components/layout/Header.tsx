import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
        className="sticky top-0 z-30 h-20 bg-background/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-6 md:px-12"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring" as const, stiffness: 100, damping: 20 }}
      >
        {/* Left: Title with version badge */}
        <motion.div 
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/5 border border-primary/20"
            whileHover={{ scale: 1.02, borderColor: "rgba(0, 163, 211, 0.4)" }}
          >
            <motion.span 
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-[9px] font-normal text-primary uppercase tracking-widest">Single Source of Truth // Alpha v2.4</span>
          </motion.div>
        </motion.div>

        {/* Center: Search */}
        <motion.button
          onClick={onOpenSearch}
          className="glass-card flex items-center gap-4 px-6 py-3 rounded-2xl min-w-[280px]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ 
            scale: 1.02, 
            borderColor: "rgba(255,255,255,0.2)",
            boxShadow: "0 10px 30px -10px rgba(0, 163, 211, 0.2)"
          }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.span 
            className="material-symbols-outlined text-muted-foreground text-xl"
            whileHover={{ rotate: [0, -10, 10, 0] }}
          >
            search
          </motion.span>
          <span className="text-sm text-muted-foreground flex-1 text-left">Buscar...</span>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-white/5 px-2 py-1 rounded font-normal">
            <span>⌘</span>
            <span>K</span>
          </div>
        </motion.button>

        {/* Right: Quick actions + Role switcher */}
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Quick Action Buttons */}
          <motion.button 
            className="btn-action hidden lg:flex"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLeadModal(true)}
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Novo Lead</span>
          </motion.button>
          <motion.button 
            className="btn-action hidden xl:flex"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowProposalModal(true)}
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Nova Proposta</span>
          </motion.button>
          <motion.button 
            className="btn-primary hidden xl:flex"
            whileHover={{ scale: 1.05, y: -2, boxShadow: "0 25px 60px -15px rgba(0, 163, 211, 0.6)" }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePayment}
          >
            <span className="material-symbols-outlined text-sm">payments</span>
            <span>Pagamento</span>
          </motion.button>

          {/* Separator */}
          <div className="h-8 w-px bg-white/5 mx-2 hidden lg:block" />

          {/* Role Switcher */}
          <div className="relative">
            <motion.button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-white/5 bg-white/5"
              whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-[10px] font-normal text-foreground uppercase tracking-widest">
                {roles.find((r) => r.id === selectedRole)?.label}
              </span>
              <motion.span 
                className="material-symbols-outlined text-muted-foreground text-sm"
                animate={{ rotate: roleDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                expand_more
              </motion.span>
            </motion.button>

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
                    className="absolute right-0 top-full mt-2 w-40 glass-card rounded-2xl shadow-2xl z-50 py-2 border border-white/10 overflow-hidden"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    {roles.map((role, index) => (
                      <motion.button
                        key={role.id}
                        onClick={() => {
                          setSelectedRole(role.id);
                          setRoleDropdownOpen(false);
                          toast.success(`Modo: ${role.label}`);
                        }}
                        className={cn(
                          "w-full px-4 py-3 text-left text-[10px] font-normal uppercase tracking-widest transition-colors",
                          selectedRole === role.id
                            ? "text-primary bg-primary/5"
                            : "text-muted-foreground hover:bg-white/5"
                        )}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ x: 4 }}
                      >
                        {role.label}
                      </motion.button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Logout Button */}
          <motion.button
            onClick={async () => {
              await logout();
              window.location.href = '/';
            }}
            className="w-10 h-10 rounded-2xl border border-border bg-muted/50 flex items-center justify-center"
            title="Sair"
            whileHover={{ 
              scale: 1.1, 
              backgroundColor: "rgba(239, 68, 68, 0.2)",
              borderColor: "rgba(239, 68, 68, 0.3)"
            }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="material-symbols-outlined text-xl">logout</span>
          </motion.button>
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
