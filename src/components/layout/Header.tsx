import { useState } from "react";
import { Search, Plus, DollarSign, ChevronDown, Command } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [selectedRole, setSelectedRole] = useState("dono");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-14 bg-background/95 backdrop-blur border-b border-border flex items-center justify-between px-6">
      {/* Left: Title */}
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>

      {/* Center: Search */}
      <button
        onClick={onOpenSearch}
        className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50 border border-border hover:border-muted-foreground/30 transition-colors min-w-[280px]"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground flex-1 text-left">Buscar...</span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background px-1.5 py-0.5 rounded">
          <Command className="h-3 w-3" />
          <span>K</span>
        </div>
      </button>

      {/* Right: Quick actions + Role switcher */}
      <div className="flex items-center gap-2">
        {/* Quick Action Buttons */}
        <button className="btn-action">
          <Plus className="h-3.5 w-3.5" />
          <span>Novo Lead</span>
        </button>
        <button className="btn-action">
          <Plus className="h-3.5 w-3.5" />
          <span>Nova Proposta</span>
        </button>
        <button className="btn-action hidden lg:flex">
          <Plus className="h-3.5 w-3.5" />
          <span>Novo Projeto</span>
        </button>
        <button className="btn-action hidden xl:flex">
          <DollarSign className="h-3.5 w-3.5" />
          <span>Registrar Pagamento</span>
        </button>

        {/* Separator */}
        <div className="h-6 w-px bg-border mx-1" />

        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <span className="text-xs font-medium text-foreground">
              {roles.find((r) => r.id === selectedRole)?.label}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {roleDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setRoleDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-36 bg-popover border border-border rounded-lg shadow-lg z-50 py-1">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => {
                      setSelectedRole(role.id);
                      setRoleDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors",
                      selectedRole === role.id
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
