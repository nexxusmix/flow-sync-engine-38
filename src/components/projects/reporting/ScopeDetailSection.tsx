/**
 * ScopeDetailSection - Report-style scope section (02 — ESCOPO DETALHADO)
 * Quote block + two-column lists for approach/responsibilities
 */

import { ReportSectionHeader } from "./ReportSectionHeader";
import { CheckCircle2, Info } from "lucide-react";

interface ScopeDetailSectionProps {
  scopeQuote?: string | null;
  approachItems?: string[];
  responsibilityItems?: string[];
  deliveryFormats?: string | null;
}

// Default items if none provided
const DEFAULT_APPROACH = [
  "Equipamentos Cinema 4K",
  "Captação com Drone 4K",
  "Color Grading Profissional",
  "Licensing (Trilha Sonora)",
];

const DEFAULT_RESPONSIBILITIES = [
  "Acesso irrestrito aos locais",
  "Aprovações conforme cronograma",
  "Pagamentos nas datas estipuladas",
];

export function ScopeDetailSection({
  scopeQuote,
  approachItems = DEFAULT_APPROACH,
  responsibilityItems = DEFAULT_RESPONSIBILITIES,
  deliveryFormats,
}: ScopeDetailSectionProps) {
  const hasContent = scopeQuote || approachItems.length > 0 || responsibilityItems.length > 0;

  if (!hasContent) {
    return (
      <div className="bg-card border border-border p-8 md:p-12">
        <ReportSectionHeader index="02" title="ESCOPO DETALHADO" />
        <p className="text-muted-foreground text-center py-8">
          Nenhum escopo detalhado definido ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border p-8 md:p-12">
      <ReportSectionHeader index="02" title="ESCOPO DETALHADO" />

      {/* Quote Block */}
      {scopeQuote && (
        <blockquote className="border-l-4 border-primary pl-6 mb-8 py-4">
          <p className="text-sm text-muted-foreground leading-relaxed uppercase tracking-wide">
            {scopeQuote}
          </p>
        </blockquote>
      )}

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Approach & Technique */}
        <div>
          <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-4 block">
            Abordagem & Técnica
          </span>
          <div className="space-y-3">
            {approachItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Responsibilities */}
        <div>
          <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-4 block">
            Responsabilidades
          </span>
          <div className="space-y-3">
            {responsibilityItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Info className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delivery Formats */}
      {deliveryFormats && (
        <p className="text-sm text-muted-foreground border-t border-border pt-6">
          <span className="font-medium text-foreground">Formatos de Entrega: </span>
          {deliveryFormats}
        </p>
      )}
    </div>
  );
}
