import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import squadHubLogo from "@/assets/squad-hub-logo.png";
import { toast } from 'sonner';
import { lovable } from '@/integrations/lovable';

type AuthMode = 'login' | 'signup' | 'reset';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(
    (searchParams.get('mode') as AuthMode) || 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message === 'Invalid login credentials' 
            ? 'Credenciais inválidas. Verifique seu email e senha.' 
            : error.message);
        } else {
          navigate('/');
        }
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setError(error.message);
        } else {
          toast.success('Conta criada! Verifique seu email para confirmar.');
          setMode('login');
        }
      } else if (mode === 'reset') {
        const { error } = await resetPassword(email);
        if (error) {
          setError(error.message);
        } else {
          toast.success('Email de recuperação enviado!');
          setMode('login');
        }
      }
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Criar Conta';
      case 'reset': return 'Recuperar Senha';
      default: return 'Acessar Estúdio';
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Processando...';
    switch (mode) {
      case 'signup': return 'Criar Conta';
      case 'reset': return 'Enviar Link';
      default: return 'Entrar no Estúdio';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center overflow-hidden font-sans">
      {/* Background Cinematic Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-primary/10 blur-[180px] rounded-full animate-float"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-white/5 blur-[150px] rounded-full animate-float" style={{ animationDelay: '-4s' }}></div>
        <div className="grain"></div>
      </div>

      <div className="relative z-10 w-full max-w-xl px-6 animate-fade-in">
        {/* Branding */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-border bg-card backdrop-blur-xl mb-4">
            <span className="material-symbols-outlined text-primary text-sm animate-pulse">lock</span>
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.5em]">
              {mode === 'signup' ? 'Novo Usuário // Registro' : mode === 'reset' ? 'Recuperação // Reset' : 'Acesso Restrito // Studio Root'}
            </span>
          </div>
          <img 
            src={squadHubLogo} 
            alt="SQUAD Hub" 
            className="h-16 md:h-20 w-auto mx-auto object-contain"
          />
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.4em] font-bold">Inteligência Cinematográfica & Gestão de Luxo</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-12 md:p-16 rounded-[4rem] border-border bg-card/40 backdrop-blur-3xl shadow-[0_100px_100px_-50px_rgba(0,0,0,0.9)]">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              {mode === 'signup' && (
                <div className="group relative">
                  <label className="absolute -top-3 left-6 px-2 bg-card text-[8px] font-black text-primary uppercase tracking-widest z-10">Nome Completo</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Seu nome"
                    className={`w-full bg-muted border ${error ? 'border-destructive/50' : 'border-border'} rounded-2xl px-8 py-5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/50`}
                  />
                </div>
              )}

              <div className="group relative">
                <label className="absolute -top-3 left-6 px-2 bg-card text-[8px] font-black text-primary uppercase tracking-widest z-10">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="seu@email.com"
                  className={`w-full bg-muted border ${error ? 'border-destructive/50' : 'border-border'} rounded-2xl px-8 py-5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/50`}
                  required
                />
              </div>

              {(mode === 'login' || mode === 'signup') && (
                <div className="group relative">
                  <label className="absolute -top-3 left-6 px-2 bg-card text-[8px] font-black text-primary uppercase tracking-widest z-10">Senha</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="••••••••"
                    className={`w-full bg-muted border ${error ? 'border-destructive/50' : 'border-border'} rounded-2xl px-8 py-5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/50`}
                    required
                    minLength={6}
                  />
                </div>
              )}

              {error && (
                <div className="px-6 py-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 animate-pulse">
                  <span className="material-symbols-outlined text-destructive text-sm">error</span>
                  <span className="text-[10px] font-black text-destructive uppercase tracking-widest">{error}</span>
                </div>
              )}
            </div>

            {mode === 'login' && (
              <div className="flex items-center justify-between px-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-4 h-4 rounded border border-border flex items-center justify-center group-hover:border-primary transition-colors">
                    <div className="w-2 h-2 bg-primary rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">Lembrar neste terminal</span>
                </label>
                <button 
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-[9px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors underline underline-offset-4"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              className="relative w-full py-6 rounded-full bg-foreground text-background font-black uppercase text-[11px] tracking-[0.4em] overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl disabled:opacity-50"
            >
              <span className={`relative z-10 transition-transform duration-500 ${isHovering && !isLoading ? '-translate-y-12 block opacity-0' : 'block opacity-100'}`}>
                {getButtonText()}
              </span>
              <span className={`absolute inset-0 flex items-center justify-center transition-transform duration-500 ${isHovering && !isLoading ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
                <span className="material-symbols-outlined mr-3 animate-spin">sync</span>
                Processando...
              </span>
            </button>

            {/* Google OAuth */}
            <div className="relative flex items-center justify-center my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <span className="relative px-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest bg-card/40">ou</span>
            </div>

            <button
              type="button"
              onClick={async () => {
                setIsLoading(true);
                try {
                  const { error } = await lovable.auth.signInWithOAuth('google', {
                    redirect_uri: window.location.origin,
                  });
                  if (error) setError(error.message || 'Erro ao conectar com Google');
                } catch {
                  setError('Erro ao conectar com Google');
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="w-full py-5 rounded-full border border-border bg-card/60 hover:bg-card text-foreground font-bold uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar com Google
            </button>

            {/* Mode Switcher */}
            <div className="text-center pt-4">
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-[9px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors"
                >
                  Não tem conta? <span className="underline underline-offset-4">Criar agora</span>
                </button>
              )}
              {(mode === 'signup' || mode === 'reset') && (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-[9px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors"
                >
                  Já tem conta? <span className="underline underline-offset-4">Entrar</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Footer Support */}
        <div className="mt-12 text-center">
          <p className="text-[9px] text-muted-foreground/50 font-bold uppercase tracking-[0.3em]">© {new Date().getFullYear()} SQUAD FILM GLOBAL • TODOS OS DIREITOS RESERVADOS</p>
        </div>
      </div>
      
      {/* Decorative Large Background Letters */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] select-none pointer-events-none">
        <span className="text-[60rem] font-black text-foreground leading-none tracking-tighter">SF</span>
      </div>
    </div>
  );
}
