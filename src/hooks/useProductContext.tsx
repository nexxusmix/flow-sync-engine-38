import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type ProductModule = 'production' | 'marketing' | 'full';

interface ProductContextType {
  activeModule: ProductModule;
  setActiveModule: (module: ProductModule) => void;
  hasAccess: (module: 'production' | 'marketing') => boolean;
  availableModules: ProductModule[];
}

const ProductContext = createContext<ProductContextType | null>(null);

const STORAGE_KEY = 'squad-active-module';

export function ProductProvider({ children }: { children: ReactNode }) {
  const [activeModule, setActiveModuleState] = useState<ProductModule>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ['production', 'marketing', 'full'].includes(stored)) {
        return stored as ProductModule;
      }
    } catch {}
    return 'full';
  });

  // For now, all modules available. Later this reads from profile.module_access + workspace_settings.subscription_plan
  const availableModules: ProductModule[] = ['production', 'marketing', 'full'];

  const setActiveModule = useCallback((module: ProductModule) => {
    setActiveModuleState(module);
    try {
      localStorage.setItem(STORAGE_KEY, module);
    } catch {}
  }, []);

  const hasAccess = useCallback((module: 'production' | 'marketing') => {
    if (activeModule === 'full') return true;
    return activeModule === module;
  }, [activeModule]);

  return (
    <ProductContext.Provider value={{ activeModule, setActiveModule, hasAccess, availableModules }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProductContext() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProductContext must be used within a ProductProvider');
  }
  return context;
}
