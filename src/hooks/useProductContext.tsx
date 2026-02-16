import { createContext, useContext, ReactNode, useCallback } from 'react';

export type ProductModule = 'production' | 'marketing' | 'full';

interface ProductContextType {
  activeModule: ProductModule;
  setActiveModule: (module: ProductModule) => void;
  hasAccess: (module: 'production' | 'marketing') => boolean;
  availableModules: ProductModule[];
}

const ProductContext = createContext<ProductContextType | null>(null);

export function ProductProvider({ children }: { children: ReactNode }) {
  const activeModule: ProductModule = 'full';
  const availableModules: ProductModule[] = ['full'];

  const setActiveModule = useCallback((_module: ProductModule) => {
    // No-op: platform is unified
  }, []);

  const hasAccess = useCallback((_module: 'production' | 'marketing') => {
    return true;
  }, []);

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
