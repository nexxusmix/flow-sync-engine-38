
# Plano: Correção da Formatação de Moeda e Alinhamento dos Cards

## Problema Identificado

Analisando o componente `PortalMetricsGrid.tsx` e `AnimatedCounter`:

1. **Moeda sem centavos**: `minimumFractionDigits: 0` → exibe "R$ 15590"
2. **Falta separador de milhar no contador animado**: `AnimatedCounter` exibe número cru sem formatação
3. **Cards desalinhados**: Alturas inconsistentes e gap pequeno

## Alterações Técnicas

### 1. Arquivo `src/components/client-portal/PortalMetricsGrid.tsx`

**A) Corrigir função formatCurrency (linha 47-53)**
```typescript
// Antes
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,  // ← Problema
  }).format(value);
};

// Depois
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
```

**B) Usar displayValue formatado em vez do AnimatedCounter para moeda (linha 158-167)**

O AnimatedCounter exibe números sem formatação. Para moeda, vamos usar o valor já formatado:
```typescript
// Alterar de isCounter: true para isCounter: false no primeiro métric
// Ou atualizar AnimatedCounter para aceitar formatação
```

**C) Melhorar alinhamento do grid (linha 113)**
```typescript
// Antes
className="grid grid-cols-2 lg:grid-cols-4 gap-1"

// Depois
className="grid grid-cols-2 lg:grid-cols-4 gap-4"
```

**D) Adicionar altura mínima consistente nos cards (linha 127)**
```typescript
// Adicionar min-h para consistência
className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 min-h-[140px] relative overflow-hidden..."
```

### 2. Arquivo `src/components/client-portal/animations/PortalAnimations.tsx`

**Atualizar AnimatedCounter para suportar formatação de moeda (linhas 395-431)**

Adicionar prop opcional `formatAsCurrency` e usar `toLocaleString`:
```typescript
interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
  formatAsCurrency?: boolean;  // Novo
}

export function AnimatedCounter({ 
  value, 
  suffix = "", 
  prefix = "",
  className,
  duration = 2,
  formatAsCurrency = false  // Novo
}: AnimatedCounterProps) {
  // ...
  
  const formattedValue = formatAsCurrency 
    ? displayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : displayValue.toLocaleString('pt-BR');
  
  return (
    <span ref={ref} className={className}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}
```

### Resultado Visual Esperado

| Campo | Antes | Depois |
|-------|-------|--------|
| Valor | R$ 15590 | R$ 15.590,00 |
| Gap entre cards | 4px (gap-1) | 16px (gap-4) |
| Altura | Variável | Mínimo 140px |

## Arquivos a Modificar

1. `src/components/client-portal/PortalMetricsGrid.tsx`
2. `src/components/client-portal/animations/PortalAnimations.tsx`
