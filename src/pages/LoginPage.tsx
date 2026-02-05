import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import squadHubLogo from "@/assets/squad-hub-logo.png";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Credenciais: matheus.fellip@hotmail.com / Math@.13
    if (email === 'matheus.fellip@hotmail.com' && password === 'Math@.13') {
      setError('');
      onLogin();
      navigate('/');
    } else {
      setError('Credenciais de estúdio inválidas. Tente novamente.');
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
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.5em]">Acesso Restrito // Studio Root</span>
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
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-6">
              <div className="group relative">
                <label className="absolute -top-3 left-6 px-2 bg-card text-[8px] font-black text-primary uppercase tracking-widest z-10">Identificação (Email)</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="matheus.fellip@hotmail.com"
                  className={`w-full bg-muted border ${error ? 'border-destructive/50' : 'border-border'} rounded-2xl px-8 py-5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/50`}
                  required
                />
              </div>

              <div className="group relative">
                <label className="absolute -top-3 left-6 px-2 bg-card text-[8px] font-black text-primary uppercase tracking-widest z-10">Chave de Acesso</label>
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
                />
              </div>

              {error && (
                <div className="px-6 py-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 animate-pulse">
                  <span className="material-symbols-outlined text-destructive text-sm">error</span>
                  <span className="text-[10px] font-black text-destructive uppercase tracking-widest">{error}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="w-4 h-4 rounded border border-border flex items-center justify-center group-hover:border-primary transition-colors">
                  <div className="w-2 h-2 bg-primary rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">Lembrar neste terminal</span>
              </label>
              <a href="#" className="text-[9px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors underline underline-offset-4">Resetar Credenciais</a>
            </div>

            <button 
              type="submit"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              className="relative w-full py-6 rounded-full bg-foreground text-background font-black uppercase text-[11px] tracking-[0.4em] overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl"
            >
              <span className={`relative z-10 transition-transform duration-500 ${isHovering ? '-translate-y-12 block opacity-0' : 'block opacity-100'}`}>Entrar no Estúdio</span>
              <span className={`absolute inset-0 flex items-center justify-center transition-transform duration-500 ${isHovering ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
                <span className="material-symbols-outlined mr-3 animate-spin">sync</span>
                Autenticando...
              </span>
            </button>
          </form>
        </div>

        {/* Footer Support */}
        <div className="mt-12 text-center">
          <p className="text-[9px] text-muted-foreground/50 font-bold uppercase tracking-[0.3em]">© 2024 SQUAD FILM GLOBAL • TODOS OS DIREITOS RESERVADOS</p>
        </div>
      </div>
      
      {/* Decorative Large Background Letters */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] select-none pointer-events-none">
        <span className="text-[60rem] font-black text-foreground leading-none tracking-tighter">SF</span>
      </div>
    </div>
  );
}
