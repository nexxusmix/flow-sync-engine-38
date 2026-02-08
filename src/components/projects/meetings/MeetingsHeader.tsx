/**
 * MeetingsHeader - Header with filters and new button
 */

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Users, MessageSquare, Phone, FileText } from "lucide-react";

interface MeetingsHeaderProps {
  filter: string;
  onFilterChange: (filter: string) => void;
  period: string;
  onPeriodChange: (period: string) => void;
  onNew: () => void;
  totalCount: number;
}

const typeOptions = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'reuniao', label: 'Reuniões' },
  { value: 'pedido_cliente', label: 'Pedidos do Cliente' },
  { value: 'mensagem_cliente', label: 'Mensagens' },
  { value: 'alinhamento_interno', label: 'Alinhamentos Internos' },
];

const periodOptions = [
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '1y', label: 'Último ano' },
];

export function MeetingsHeader({
  filter,
  onFilterChange,
  period,
  onPeriodChange,
  onNew,
  totalCount,
}: MeetingsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Reuniões & Alinhamentos
        </h2>
        <p className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? 'interação' : 'interações'} registradas
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Type Filter */}
        <Select value={filter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Period Filter */}
        <Select value={period} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* New Button */}
        <Button onClick={onNew} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Interação
        </Button>
      </div>
    </div>
  );
}
