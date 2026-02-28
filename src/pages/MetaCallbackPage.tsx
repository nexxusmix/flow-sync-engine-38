import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMetaOAuthCallback } from '@/hooks/useInstagramAPI';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MetaCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const callback = useMetaOAuthCallback();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMsg(searchParams.get('error_description') || 'Permissão negada pelo usuário');
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMsg('Código de autorização não encontrado');
      return;
    }

    const redirectUri = `${window.location.origin}/meta-callback`;

    callback.mutate({ code, redirect_uri: redirectUri }, {
      onSuccess: () => setStatus('success'),
      onError: (err) => {
        setStatus('error');
        setErrorMsg(err.message);
      },
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">Conectando ao Instagram...</h2>
            <p className="text-sm text-muted-foreground">Estamos trocando as credenciais com a Meta. Aguarde um momento.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">Conectado com sucesso!</h2>
            <p className="text-sm text-muted-foreground">Sua conta Instagram Business foi vinculada. Agora você pode sincronizar métricas reais.</p>
            <Button onClick={() => navigate('/instagram-engine')} className="mt-4">
              Ir para Instagram Engine
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">Erro na conexão</h2>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <div className="flex gap-3 justify-center mt-4">
              <Button variant="outline" onClick={() => navigate('/instagram-engine')}>Voltar</Button>
              <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
