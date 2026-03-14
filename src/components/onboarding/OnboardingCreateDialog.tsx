import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClientOnboarding } from "@/hooks/useClientOnboarding";
import { Plus } from "lucide-react";

export function OnboardingCreateDialog() {
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [serviceType, setServiceType] = useState("social_media");
  const [dueDate, setDueDate] = useState("");
  const { createOnboarding } = useClientOnboarding();

  const handleSubmit = async () => {
    if (!clientName.trim()) return;
    await createOnboarding.mutateAsync({ client_name: clientName.trim(), service_type: serviceType, due_date: dueDate || undefined });
    setClientName("");
    setDueDate("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Onboarding
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Onboarding de Cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nome do Cliente</Label>
            <Input placeholder="Ex: Empresa ABC" value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tipo de Serviço</Label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="trafego_pago">Tráfego Pago</SelectItem>
                <SelectItem value="general">Geral</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Prazo estimado (opcional)</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={!clientName.trim() || createOnboarding.isPending}>
            {createOnboarding.isPending ? "Criando..." : "Criar Onboarding"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
