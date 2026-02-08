/**
 * AppLayoutStandard - Layout para páginas simples, formulários, detalhes
 * Usa largura máxima de 7xl (1280px) centrada
 */

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AppLayoutStandardProps {
  children: ReactNode;
  className?: string;
  /** Largura máxima do container */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
};

export function AppLayoutStandard({ 
  children, 
  className,
  maxWidth = '7xl',
}: AppLayoutStandardProps) {
  return (
    <div className={cn(
      "w-full mx-auto",
      maxWidthMap[maxWidth],
      className
    )}>
      {children}
    </div>
  );
}
