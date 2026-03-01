/**
 * VisualMarkdownRenderer - Renders markdown with visual cards, tables, and structured layouts
 * Detects sections like "ENTREGAS", "CONDIÇÕES FINANCEIRAS", etc. and renders them appropriately
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Video, 
  DollarSign, 
  FileText, 
  AlertCircle, 
  Settings, 
  Package,
  CheckCircle2,
  Clock,
  CreditCard,
  Calendar,
  Clapperboard,
  Eye,
  Scale
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VisualMarkdownRendererProps {
  content: string;
  className?: string;
}

interface ParsedSection {
  type: 'paragraph' | 'heading' | 'list' | 'deliverables' | 'financial' | 'observations' | 'config' | 'scope' | 'table';
  title?: string;
  content: string[];
  level?: number;
}

// Section icons and colors
const SECTION_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  'entregas': { 
    icon: <Package className="w-4 h-4" />, 
    color: 'text-primary', 
    bgColor: 'bg-primary/10 border-primary/20' 
  },
  'condições financeiras': { 
    icon: <DollarSign className="w-4 h-4" />, 
    color: 'text-primary/70', 
    bgColor: 'bg-primary/10 border-primary/20' 
  },
  'observações': { 
    icon: <AlertCircle className="w-4 h-4" />, 
    color: 'text-primary/60', 
    bgColor: 'bg-primary/10 border-primary/20' 
  },
  'configurações': { 
    icon: <Settings className="w-4 h-4" />, 
    color: 'text-primary/50', 
    bgColor: 'bg-primary/10 border-primary/20' 
  },
  'escopo detalhado': { 
    icon: <FileText className="w-4 h-4" />, 
    color: 'text-primary', 
    bgColor: 'bg-primary/10 border-primary/20' 
  },
  'resumo executivo': { 
    icon: <Eye className="w-4 h-4" />, 
    color: 'text-primary', 
    bgColor: 'bg-primary/10 border-primary/20' 
  },
  'obrigações': { 
    icon: <Scale className="w-4 h-4" />, 
    color: 'text-primary/70', 
    bgColor: 'bg-primary/10 border-primary/20' 
  },
};

function getSectionConfig(title: string) {
  const lowerTitle = title.toLowerCase();
  for (const [key, config] of Object.entries(SECTION_CONFIG)) {
    if (lowerTitle.includes(key)) {
      return config;
    }
  }
  return { 
    icon: <FileText className="w-4 h-4" />, 
    color: 'text-muted-foreground', 
    bgColor: 'bg-muted/30 border-border' 
  };
}

function parseContent(content: string): ParsedSection[] {
  const lines = content.split('\n');
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;
  let buffer: string[] = [];

  const flushBuffer = () => {
    if (buffer.length > 0 && currentSection) {
      currentSection.content = [...buffer];
      sections.push(currentSection);
      buffer = [];
      currentSection = null;
    } else if (buffer.length > 0) {
      sections.push({ type: 'paragraph', content: buffer });
      buffer = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines but preserve section boundaries
    if (!trimmed) {
      if (buffer.length > 0) {
        flushBuffer();
      }
      continue;
    }

    // Detect markdown headings
    if (trimmed.startsWith('## ') || trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 60) {
      flushBuffer();
      const title = trimmed.replace(/^##\s*/, '').replace(/^\*\*|\*\*$/g, '');
      
      // Determine section type based on title
      const lowerTitle = title.toLowerCase();
      let sectionType: ParsedSection['type'] = 'heading';
      
      if (lowerTitle.includes('entreg')) sectionType = 'deliverables';
      else if (lowerTitle.includes('financeir') || lowerTitle.includes('pagamento') || lowerTitle.includes('parcela')) sectionType = 'financial';
      else if (lowerTitle.includes('observa')) sectionType = 'observations';
      else if (lowerTitle.includes('config')) sectionType = 'config';
      else if (lowerTitle.includes('escopo')) sectionType = 'scope';
      
      currentSection = { type: sectionType, title, content: [] };
      continue;
    }

    // Detect list items
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.match(/^\d+\.\s/)) {
      const itemContent = trimmed.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '');
      buffer.push(itemContent);
      continue;
    }

    // Regular paragraph content
    buffer.push(trimmed);
  }

  flushBuffer();
  return sections;
}

// Parse deliverable item into structured format
function parseDeliverableItem(item: string) {
  // Pattern: "01 VÍDEO LANÇAMENTO (Vídeo): Até 02m30s. Formatos Wide e Vertical. Qualidade Cinema 4K."
  const match = item.match(/^(\d+)\s+([^(]+)\s*\(([^)]+)\):\s*(.+)$/);
  if (match) {
    return {
      quantity: match[1],
      title: match[2].trim(),
      type: match[3].trim(),
      specs: match[4].trim(),
    };
  }
  
  // Simpler pattern: "Vídeo Lançamento: Até 02m30s..."
  const simpleMatch = item.match(/^([^:]+):\s*(.+)$/);
  if (simpleMatch) {
    return {
      quantity: '01',
      title: simpleMatch[1].trim(),
      type: 'Vídeo',
      specs: simpleMatch[2].trim(),
    };
  }

  return { quantity: '01', title: item, type: '', specs: '' };
}

// Parse payment info
function parsePaymentItem(item: string) {
  // Pattern: "Sinal / Reserva: R$ 7.795 (2026-01-15) - Na assinatura/reserva"
  const match = item.match(/([^:]+):\s*R?\$\s*([\d.,]+)\s*\(([^)]+)\)\s*[-–]\s*(.+)/);
  if (match) {
    return {
      label: match[1].trim(),
      value: match[2].trim(),
      date: match[3].trim(),
      note: match[4].trim(),
    };
  }
  return null;
}

function DeliverableCard({ item, index }: { item: string; index: number }) {
  const parsed = parseDeliverableItem(item);
  
  return (
    <div className="group flex items-start gap-4 p-4 bg-muted/20 border border-border rounded-xl hover:bg-muted/30 hover:border-primary/30 transition-all">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Clapperboard className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 border-primary/30 text-primary">
            {parsed.quantity}x
          </Badge>
          {parsed.type && (
            <Badge variant="outline" className="text-[10px] bg-muted/50 border-border text-muted-foreground">
              {parsed.type}
            </Badge>
          )}
        </div>
        <h4 className="font-medium text-foreground text-sm mb-1">{parsed.title}</h4>
        {parsed.specs && (
          <p className="text-xs text-muted-foreground leading-relaxed">{parsed.specs}</p>
        )}
      </div>
    </div>
  );
}

function PaymentCard({ items }: { items: string[] }) {
  const payments = items.map(parsePaymentItem).filter(Boolean);
  const regularItems = items.filter(item => !parsePaymentItem(item));

  return (
    <div className="space-y-4">
      {/* Payment method info */}
      {regularItems.length > 0 && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-primary/70" />
            <span className="text-sm font-medium text-foreground">Forma de Pagamento</span>
          </div>
          {regularItems.map((item, i) => (
            <p key={i} className="text-sm text-muted-foreground">{item}</p>
          ))}
        </div>
      )}

      {/* Payment schedule table */}
      {payments.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-4 py-3">Parcela</th>
                <th className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider px-4 py-3">Valor</th>
                <th className="text-center text-xs font-bold text-muted-foreground uppercase tracking-wider px-4 py-3">Vencimento</th>
                <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wider px-4 py-3">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((payment, i) => (
                <tr key={i} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-foreground">{payment!.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-emerald-400">R$ {payment!.value}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-xs bg-muted/50">
                      <Calendar className="w-3 h-3 mr-1" />
                      {payment!.date}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">{payment!.note}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ObservationsList({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div 
          key={i} 
          className="flex items-start gap-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg"
        >
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
            <span className="text-[10px] font-bold text-blue-400">{i + 1}</span>
          </div>
          <p className="text-sm text-muted-foreground flex-1">{item}</p>
        </div>
      ))}
    </div>
  );
}

function SectionCard({ section }: { section: ParsedSection }) {
  if (!section.title) {
    // Render as simple paragraphs
    return (
      <div className="space-y-4">
        {section.content.map((p, i) => (
          <p key={i} className="text-lg text-muted-foreground leading-[1.8] font-light">
            {p}
          </p>
        ))}
      </div>
    );
  }

  const config = getSectionConfig(section.title);

  return (
    <Card className={cn("border overflow-hidden", config.bgColor)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-background/50", config.color)}>
            {config.icon}
          </div>
          <span className="text-sm font-bold uppercase tracking-wider">{section.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {section.type === 'deliverables' ? (
          <div className="grid gap-3 md:grid-cols-2">
            {section.content.map((item, i) => (
              <DeliverableCard key={i} item={item} index={i} />
            ))}
          </div>
        ) : section.type === 'financial' ? (
          <PaymentCard items={section.content} />
        ) : section.type === 'observations' ? (
          <ObservationsList items={section.content} />
        ) : section.type === 'config' ? (
          <div className="grid gap-2">
            {section.content.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span className="text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        ) : section.type === 'scope' ? (
          <div className="prose prose-invert max-w-none">
            {section.content.map((p, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-3 last:mb-0">
                {p}
              </p>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {section.content.map((item, i) => (
              <p key={i} className="text-sm text-muted-foreground">{item}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function VisualMarkdownRenderer({ content, className }: VisualMarkdownRendererProps) {
  const sections = parseContent(content);

  if (sections.length === 0) {
    return null;
  }

  // Group consecutive paragraphs together, keep section cards separate
  const groupedSections: ParsedSection[] = [];
  let paragraphBuffer: string[] = [];

  for (const section of sections) {
    if (section.type === 'paragraph' && !section.title) {
      paragraphBuffer.push(...section.content);
    } else {
      if (paragraphBuffer.length > 0) {
        groupedSections.push({ type: 'paragraph', content: paragraphBuffer });
        paragraphBuffer = [];
      }
      groupedSections.push(section);
    }
  }

  if (paragraphBuffer.length > 0) {
    groupedSections.push({ type: 'paragraph', content: paragraphBuffer });
  }

  return (
    <div className={cn("space-y-6", className)}>
      {groupedSections.map((section, i) => (
        <SectionCard key={i} section={section} />
      ))}
    </div>
  );
}
