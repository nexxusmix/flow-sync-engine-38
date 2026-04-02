import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle, Instagram } from 'lucide-react';

type Status = 'loading' | 'success' | 'error';

export default function InstagramCallbackPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setStatus('error');
      setErrorMsg('Codigo de autorizacao nao encontrado na URL.');
      return;
    }

    const redirectUri = `${window.location.origin}/integrations/instagram/callback`;

    supabase.functions
      .invoke('instagram-oauth', {
        body: { action: 'callback', code, redirect_uri: redirectUri },
      })
      .then(({ data, error }) => {
        if (error || data?.error) {
          setStatus('error');
          setErrorMsg(data?.error || error?.message || 'Erro desconhecido ao processar autorizacao.');
          return;
        }

        setStatus('success');

        // Notify opener window so it can refresh connection status
        window.opener?.postMessage({ type: 'instagram-oauth-success' }, '*');

        // Auto-close popup after a short delay
        setTimeout(() => {
          window.close();
        }, 2000);
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err?.message || 'Falha na comunicacao com o servidor.');
      });
  }, [searchParams]);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoToEngine = () => {
    window.location.href = '/instagram-engine';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
          <Instagram className="w-6 h-6 text-white" />
        </div>

        {status === 'loading' && (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">Conectando Instagram...</h2>
            <p className="text-sm text-muted-foreground">Processando autorizacao do Facebook. Aguarde.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">Instagram conectado!</h2>
            <p className="text-sm text-muted-foreground">
              Esta janela sera fechada automaticamente.
            </p>
            <Button variant="outline" size="sm" onClick={handleGoToEngine}>
              Ir para Instagram Engine
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-10 h-10 text-destructive mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">Erro na conexao</h2>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={handleRetry}>
                Tentar novamente
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.close()}>
                Fechar
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
