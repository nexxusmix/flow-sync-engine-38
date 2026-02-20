import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import squadHubLogo from "@/assets/squad-hub-logo.png";
import { Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type PageState = 'loading' | 'form' | 'success' | 'error';

export default function AcceptInvitePage() {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Supabase sends the token via hash fragment: #access_token=...&type=invite
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', ''));
    const type = params.get('type');
    const accessToken = params.get('access_token');

    if ((type === 'invite' || type === 'recovery' || type === 'signup') && accessToken) {
      // Set session from the URL tokens so we can call updateUser
      const refreshToken = params.get('refresh_token') || '';
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data, error }) => {
          if (error || !data.session) {
            setPageState('error');
          } else {
            setUserEmail(data.session.user?.email || '');
            setPageState('form');
          }
        });
    } else {
      // Maybe the session was already set via onAuthStateChange
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          setUserEmail(data.session.user.email || '');
          setPageState('form');
        } else {
          setPageState('error');
        }
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Por favor, informe seu nome completo.');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Update password and display name
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: { full_name: fullName },
      });

      if (updateError) {
        setError(updateError.message);
        setIsSubmitting(false);
        return;
      }

      // Also update the profile table
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user?.id) {
        await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('user_id', sessionData.session.user.id);
      }

      setPageState('success');
      toast.success('Conta criada com sucesso! Redirecionando...');
      setTimeout(() => navigate('/'), 2000);
    } catch {
      setError('Ocorreu um erro. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background subtle gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <img src={squadHubLogo} alt="Squad HUB" className="h-8 object-contain" />
        </div>

        <div className="glass-card rounded-3xl p-8 space-y-6">
          {/* Loading */}
          {pageState === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-muted-foreground text-sm">Verificando convite...</p>
            </div>
          )}

          {/* Error */}
          {pageState === 'error' && (
            <div className="text-center py-8 space-y-4">
              <p className="text-destructive font-medium">Link de convite inválido ou expirado.</p>
              <p className="text-sm text-muted-foreground">
                Solicite um novo convite ao administrador da plataforma.
              </p>
              <Button variant="outline" onClick={() => navigate('/login')}>
                Ir para o login
              </Button>
            </div>
          )}

          {/* Success */}
          {pageState === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-success" />
              <h2 className="text-xl font-medium text-foreground">Conta criada!</h2>
              <p className="text-sm text-muted-foreground">
                Redirecionando para a plataforma...
              </p>
            </div>
          )}

          {/* Form */}
          {pageState === 'form' && (
            <>
              <div>
                <h1 className="text-2xl font-light text-foreground tracking-tight">
                  Criar sua conta
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Você foi convidado para a plataforma
                  {userEmail && (
                    <span className="text-foreground font-medium"> · {userEmail}</span>
                  )}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full name */}
                <div className="space-y-1.5">
                  <Label htmlFor="full-name">Nome completo</Label>
                  <Input
                    id="full-name"
                    type="text"
                    placeholder="Seu nome"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoFocus
                    autoComplete="name"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirmar senha</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repita a senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowConfirm((v) => !v)}
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          password.length >= i * 3
                            ? i <= 1 ? 'bg-destructive' : i <= 2 ? 'bg-warning' : i <= 3 ? 'bg-primary/70' : 'bg-success'
                            : 'bg-muted'
                        }`}
                      />
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {password.length < 4 ? 'Muito curta' : password.length < 7 ? 'Fraca' : password.length < 10 ? 'Boa' : 'Forte'}
                    </p>
                  </div>
                )}

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !fullName || !password || !confirmPassword}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    'Criar conta e acessar'
                  )}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground">
                Já tem uma conta?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-primary hover:underline"
                >
                  Fazer login
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
