import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Contact } from "@/hooks/useCRM";

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  onCreate: (data: { name: string; company?: string; email?: string; phone?: string; instagram?: string; notes?: string }) => void;
  onUpdate: (data: { id: string; data: Partial<{ name: string; company: string; email: string; phone: string; instagram: string; notes: string }> }) => void;
  isCreating: boolean;
}

export function ClientFormDialog({ open, onOpenChange, contact, onCreate, onUpdate, isCreating }: ClientFormDialogProps) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [notes, setNotes] = useState("");

  const isEditing = !!contact;

  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setCompany(contact.company || "");
      setEmail(contact.email || "");
      setPhone(contact.phone || "");
      setInstagram(contact.instagram || "");
      setNotes(contact.notes || "");
    } else {
      setName(""); setCompany(""); setEmail(""); setPhone(""); setInstagram(""); setNotes("");
    }
  }, [contact, open]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (isEditing && contact) {
      onUpdate({ id: contact.id, data: { name, company, email, phone, instagram, notes } });
    } else {
      onCreate({ name, company, email, phone, instagram, notes });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          <DialogDescription>{isEditing ? "Atualize os dados do cliente" : "Preencha os dados do novo cliente"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do cliente" />
          </div>
          <div>
            <Label>Empresa</Label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Nome da empresa" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </div>
          <div>
            <Label>Instagram</Label>
            <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@usuario" />
          </div>
          <div>
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || isCreating}>
              {isEditing ? "Salvar" : "Criar Cliente"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
