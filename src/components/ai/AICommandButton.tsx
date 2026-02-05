import { useState } from "react";
import { AIAssistant } from "./AIAssistant";

export function AICommandButton() {
  const [showAssistant, setShowAssistant] = useState(false);

  return (
    <>
      {/* Floating AI Agent Trigger */}
      <button 
        onClick={() => setShowAssistant(!showAssistant)}
        className="fixed bottom-12 right-12 z-50 p-6 md:p-8 bg-primary text-primary-foreground rounded-[2rem] shadow-[0_30px_90px_-10px_hsl(var(--primary)/0.7)] hover:scale-110 active:scale-90 transition-all duration-700 group"
      >
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-3xl md:text-4xl">auto_awesome</span>
          <span className="hidden lg:inline font-black uppercase text-[12px] tracking-[0.4em]">IA COMMAND</span>
        </div>
      </button>

      {showAssistant && (
        <AIAssistant onClose={() => setShowAssistant(false)} />
      )}
    </>
  );
}
