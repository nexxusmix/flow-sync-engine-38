import { useState, useEffect } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download, X, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function PWAInstallBanner() {
  const { canInstall, isInstalled, isIOS, isStandalone, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show if already installed/standalone or previously dismissed this session
    if (isStandalone || isInstalled) return;
    const wasDismissed = sessionStorage.getItem("pwa-banner-dismissed");
    if (wasDismissed) return;

    // Show after 30s delay
    const timer = setTimeout(() => {
      if (canInstall || isIOS) setShow(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, [canInstall, isIOS, isStandalone, isInstalled]);

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
    sessionStorage.setItem("pwa-banner-dismissed", "1");
  };

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) handleDismiss();
  };

  if (dismissed || !show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      >
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xl safe-area-bottom">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-foreground">Instalar SQUAD Hub</h4>
              {isIOS ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Toque em <Share className="w-3 h-3 inline" /> e depois em{" "}
                  <span className="font-medium">"Adicionar à Tela Inicial"</span>{" "}
                  <Plus className="w-3 h-3 inline" />
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  Acesse direto do seu celular, offline e sem navegador.
                </p>
              )}
            </div>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          {!isIOS && canInstall && (
            <Button onClick={handleInstall} size="sm" className="w-full mt-3 gap-2">
              <Download className="w-4 h-4" /> Instalar agora
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
