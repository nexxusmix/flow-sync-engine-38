import { useState, useEffect, useRef } from "react";
import { Search, X, User, FolderKanban, FileText, Wallet, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { accounts, deals, projects, invoices, contacts } from "@/data/mockData";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

type SearchResult = {
  id: string;
  type: "account" | "deal" | "project" | "invoice" | "contact";
  title: string;
  subtitle: string;
};

const typeIcons = {
  account: Building2,
  deal: FileText,
  project: FolderKanban,
  invoice: Wallet,
  contact: User,
};

const typeLabels = {
  account: "Conta",
  deal: "Deal",
  project: "Projeto",
  invoice: "Fatura",
  contact: "Contato",
};

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

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

    // Search accounts
    accounts.forEach((acc) => {
      if (acc.name.toLowerCase().includes(q)) {
        searchResults.push({
          id: acc.id,
          type: "account",
          title: acc.name,
          subtitle: acc.segment,
        });
      }
    });

    // Search contacts
    contacts.forEach((con) => {
      if (con.name.toLowerCase().includes(q) || con.email.toLowerCase().includes(q)) {
        searchResults.push({
          id: con.id,
          type: "contact",
          title: con.name,
          subtitle: con.email,
        });
      }
    });

    // Search deals
    deals.forEach((deal) => {
      if (deal.title.toLowerCase().includes(q) || deal.accountName.toLowerCase().includes(q)) {
        searchResults.push({
          id: deal.id,
          type: "deal",
          title: deal.title,
          subtitle: `${deal.accountName} • R$ ${deal.value.toLocaleString()}`,
        });
      }
    });

    // Search projects
    projects.forEach((proj) => {
      if (proj.title.toLowerCase().includes(q) || proj.accountName.toLowerCase().includes(q)) {
        searchResults.push({
          id: proj.id,
          type: "project",
          title: proj.title,
          subtitle: proj.accountName,
        });
      }
    });

    // Search invoices
    invoices.forEach((inv) => {
      if (inv.accountName.toLowerCase().includes(q) || inv.projectTitle.toLowerCase().includes(q)) {
        searchResults.push({
          id: inv.id,
          type: "invoice",
          title: `Fatura ${inv.installment}`,
          subtitle: `${inv.accountName} • R$ ${inv.amount.toLocaleString()}`,
        });
      }
    });

    setResults(searchResults.slice(0, 10));
    setSelectedIndex(0);
  }, [query]);

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
      // Handle selection - would open drawer
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
    <>
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
            placeholder="Buscar clientes, deals, projetos, faturas..."
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
                {items.map((result, idx) => {
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
                Digite para buscar clientes, deals, projetos ou faturas
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
    </>
  );
}
