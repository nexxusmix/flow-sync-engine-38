import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { formatCurrencyBRL } from '@/utils/format';
import { motion } from 'framer-motion';

interface RevenueForecasterProps {
  forecast30: number;
  forecast60: number;
  forecast90: number;
}

export function RevenueForecaster({ forecast30, forecast60, forecast90 }: RevenueForecasterProps) {
  const items = [
    { label: '30 dias', value: forecast30, confidence: 'Alta' },
    { label: '60 dias', value: forecast60, confidence: 'Média' },
    { label: '90 dias', value: forecast90, confidence: 'Baixa' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h2 className="text-xs font-medium text-primary uppercase tracking-widest">Receita Projetada</h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="glass-card p-4 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{item.label}</p>
              <p className="text-lg font-semibold text-foreground">{formatCurrencyBRL(item.value)}</p>
              <p className={`text-[10px] mt-1 ${
                item.confidence === 'Alta' ? 'text-primary' :
                item.confidence === 'Média' ? 'text-muted-foreground' : 'text-muted-foreground/60'
              }`}>
                Confiança: {item.confidence}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
