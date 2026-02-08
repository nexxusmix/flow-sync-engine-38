/**
 * AppLayoutWide - Layout responsivo para dashboards e páginas de dados
 * Usa largura máxima maior (1600px) e grids de 12 colunas
 */

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AppLayoutWideProps {
  children: ReactNode;
  className?: string;
  /** Componente opcional para sidebar/aside - se não existir, main ocupa 100% */
  aside?: ReactNode;
  /** Se deve forçar full width mesmo com aside */
  asidePosition?: 'right' | 'left';
  /** Controla se aside é visível */
  hasAside?: boolean;
}

export function AppLayoutWide({ 
  children, 
  className,
  aside,
  asidePosition = 'right',
  hasAside = !!aside,
}: AppLayoutWideProps) {
  // Se não tem aside, main ocupa tudo
  const mainColSpan = hasAside ? "lg:col-span-8 xl:col-span-9" : "lg:col-span-12";
  const asideColSpan = "lg:col-span-4 xl:col-span-3";

  return (
    <div className={cn(
      "w-full max-w-[1600px] 2xl:max-w-[1800px] mx-auto",
      className
    )}>
      {hasAside ? (
        <div className={cn(
          "grid grid-cols-1 lg:grid-cols-12 gap-6",
          asidePosition === 'left' && "lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1"
        )}>
          <div className={cn("space-y-6", mainColSpan)}>
            {children}
          </div>
          <div className={cn("space-y-6", asideColSpan)}>
            {aside}
          </div>
        </div>
      ) : (
        <div className="w-full">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Grid responsivo que preenche a largura disponível
 * Ajusta colunas automaticamente baseado no tamanho da tela
 */
interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  /** Mínimo de colunas em mobile */
  minCols?: 1 | 2;
  /** Máximo de colunas em 2xl */
  maxCols?: 2 | 3 | 4 | 5 | 6;
}

export function ResponsiveGrid({ 
  children, 
  className,
  minCols = 1,
  maxCols = 4,
}: ResponsiveGridProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
    6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6",
  };

  const minColsClass = minCols === 2 ? "sm:grid-cols-2" : "";

  return (
    <div className={cn(
      "grid gap-4 md:gap-6",
      gridCols[maxCols],
      minColsClass,
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Section que preenche a largura completa
 */
interface FullWidthSectionProps {
  children: ReactNode;
  className?: string;
}

export function FullWidthSection({ children, className }: FullWidthSectionProps) {
  return (
    <section className={cn("w-full", className)}>
      {children}
    </section>
  );
}
