import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download, Share, Plus, Smartphone, CheckCircle2, Wifi, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InstallPage() {
  const { canInstall, isInstalled, isIOS, isStandalone, promptInstall } = usePWAInstall();

  if (isStandalone || isInstalled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4 max-w-sm">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">App já instalado!</h1>
          <p className="text-muted-foreground">
            O SQUAD Hub já está instalado no seu dispositivo. Abra pela tela inicial.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-6 py-12 space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Instalar SQUAD Hub</h1>
          <p className="text-muted-foreground">
            Tenha acesso instantâneo à plataforma direto do seu celular, como um app nativo.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 gap-3">
          {[
            { icon: Zap, title: "Acesso instantâneo", desc: "Abra direto da tela inicial, sem navegador" },
            { icon: Wifi, title: "Funciona offline", desc: "Dados em cache para acesso sem internet" },
            { icon: Shield, title: "Sempre atualizado", desc: "Atualizações automáticas em background" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
              <Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Install CTA */}
        {canInstall && (
          <Button onClick={promptInstall} size="lg" className="w-full gap-2 text-base">
            <Download className="w-5 h-5" /> Instalar agora
          </Button>
        )}

        {/* iOS instructions */}
        {isIOS && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground text-center">Como instalar no iPhone/iPad</h2>
            <div className="space-y-3">
              {[
                { step: 1, text: <>Toque no botão <Share className="w-4 h-4 inline text-primary" /> <strong>Compartilhar</strong> na barra do Safari</> },
                { step: 2, text: <>Role e toque em <Plus className="w-4 h-4 inline text-primary" /> <strong>"Adicionar à Tela de Início"</strong></> },
                { step: 3, text: <>Confirme tocando em <strong>"Adicionar"</strong></> },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    {step}
                  </span>
                  <p className="text-sm text-foreground pt-0.5">{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Android fallback */}
        {!isIOS && !canInstall && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground text-center">Como instalar</h2>
            <div className="space-y-3">
              {[
                { step: 1, text: <>Abra o menu do navegador <strong>(⋮)</strong></> },
                { step: 2, text: <>Toque em <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong></> },
                { step: 3, text: <>Confirme a instalação</> },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    {step}
                  </span>
                  <p className="text-sm text-foreground pt-0.5">{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
