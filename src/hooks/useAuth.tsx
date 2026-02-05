import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Auto-authenticate for development
    return true;
  });

  useEffect(() => {
    // Persist auth state
    localStorage.setItem('squad_auth', isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  const login = () => setIsAuthenticated(true);
  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('squad_auth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
