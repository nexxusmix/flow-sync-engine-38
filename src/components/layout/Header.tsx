import { useState } from "react";
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
    <header className="sticky top-0 z-30 h-20 bg-background/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-6 md:px-12">
      {/* Left: Title with version badge */}
      <div className="flex items-center gap-4">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/5 border border-primary/20">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span className="text-[9px] font-black text-primary uppercase tracking-widest">Single Source of Truth // Alpha v2.4</span>
        </div>
      </div>

      {/* Center: Search */}
      <button
        onClick={onOpenSearch}
        className="glass-card flex items-center gap-4 px-6 py-3 rounded-2xl hover:border-white/20 transition-all min-w-[280px]"
      >
        <span className="material-symbols-outlined text-muted-foreground text-xl">search</span>
        <span className="text-sm text-muted-foreground flex-1 text-left">Buscar...</span>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-white/5 px-2 py-1 rounded font-bold">
          <span>⌘</span>
          <span>K</span>
        </div>
      </button>

      {/* Right: Quick actions + Role switcher */}
      <div className="flex items-center gap-3">
        {/* Quick Action Buttons */}
        <button className="btn-action hidden lg:flex">
          <span className="material-symbols-outlined text-sm">add</span>
          <span>Novo Lead</span>
        </button>
        <button className="btn-action hidden xl:flex">
          <span className="material-symbols-outlined text-sm">add</span>
          <span>Nova Proposta</span>
        </button>
        <button className="btn-primary hidden xl:flex">
          <span className="material-symbols-outlined text-sm">payments</span>
          <span>Pagamento</span>
        </button>

        {/* Separator */}
        <div className="h-8 w-px bg-white/5 mx-2 hidden lg:block" />

        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-[10px] font-black text-foreground uppercase tracking-widest">
              {roles.find((r) => r.id === selectedRole)?.label}
            </span>
            <span className="material-symbols-outlined text-muted-foreground text-sm">expand_more</span>
          </button>

          {roleDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setRoleDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-40 glass-card rounded-2xl shadow-2xl z-50 py-2 border border-white/10">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => {
                      setSelectedRole(role.id);
                      setRoleDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors",
                      selectedRole === role.id
                        ? "text-primary"
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
