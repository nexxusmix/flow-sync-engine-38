import { useState } from "react";
import { AIAssistant } from "./AIAssistant";

export function AICommandButton() {
  const [showAssistant, setShowAssistant] = useState(false);

  return (
    <>
      {/* Floating AI Agent Trigger - positioned to not overlap content */}
      <button 
        onClick={() => setShowAssistant(!showAssistant)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-300"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xl">auto_awesome</span>
          <span className="hidden md:inline font-medium uppercase text-[10px] tracking-wider">IA</span>
        </div>
      </button>

      {showAssistant && (
        <AIAssistant onClose={() => setShowAssistant(false)} />
      )}
    </>
  );
}
