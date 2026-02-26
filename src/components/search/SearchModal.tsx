import { useState, useEffect, useRef } from "react";
import { Search, X, FolderKanban, FileText, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjects } from "@/hooks/useProjects";
import { useFinancialStore } from "@/stores/financialStore";
import { Portal } from "@/components/ui/Portal";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

type SearchResult = {
  id: string;
  type: "project" | "invoice" | "contract";
  title: string;
  subtitle: string;
};

const typeIcons = {
  project: FolderKanban,
  invoice: Wallet,
  contract: FileText,
};

const typeLabels = {
  project: "Projeto",
  invoice: "Fatura",
  contract: "Contrato",
};

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { projects } = useProjects();
  const { revenues, contracts } = useFinancialStore();

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search projects
    projects.forEach((proj) => {
      if (proj.name?.toLowerCase().includes(q) || proj.client_name?.toLowerCase().includes(q)) {
        searchResults.push({
          id: proj.id,
          type: "project",
          title: proj.name,
          subtitle: proj.client_name || 'Sem cliente',
        });
      }
    });

    // Search revenues/invoices
    revenues.forEach((rev) => {
      if (rev.description?.toLowerCase().includes(q)) {
        searchResults.push({
          id: rev.id,
          type: "invoice",
          title: rev.description,
          subtitle: `R$ ${rev.amount?.toLocaleString() || 0}`,
        });
      }
    });

    // Search contracts
    contracts.forEach((contract) => {
      if (contract.project_name?.toLowerCase().includes(q) || contract.client_name?.toLowerCase().includes(q)) {
        searchResults.push({
          id: contract.id,
          type: "contract",
          title: contract.project_name || 'Contrato',
          subtitle: `${contract.client_name || 'Sem cliente'} • R$ ${contract.total_value?.toLocaleString() || 0}`,
        });
      }
    });

    setResults(searchResults.slice(0, 10));
    setSelectedIndex(0);
  }, [query, projects, revenues, contracts]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      console.log("Selected:", results[selectedIndex]);
      onClose();
    }
  };

  if (!open) return null;

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <Portal>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/4 z-50 w-full max-w-xl -translate-x-1/2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar projetos, faturas, contratos..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
          />
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {query && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhum resultado para "{query}"</p>
            </div>
          )}

          {Object.entries(groupedResults).map(([type, items]) => {
            const Icon = typeIcons[type as keyof typeof typeIcons];
            return (
              <div key={type}>
                <div className="px-4 py-2 bg-muted/30">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                    {typeLabels[type as keyof typeof typeLabels]}
                  </span>
                </div>
                {items.map((result) => {
                  const globalIndex = results.findIndex((r) => r.id === result.id);
                  return (
                    <button
                      key={result.id}
                      onClick={() => {
                        console.log("Selected:", result);
                        onClose();
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                        globalIndex === selectedIndex ? "bg-muted" : "hover:bg-muted/50"
                      )}
                    >
                      <div className="icon-box">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}

          {!query && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Digite para buscar projetos, faturas ou contratos
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center gap-4 text-xs text-muted-foreground">
          <span>↑↓ Navegar</span>
          <span>↵ Abrir</span>
          <span>Esc Fechar</span>
        </div>
      </div>
    </Portal>
  );
}
