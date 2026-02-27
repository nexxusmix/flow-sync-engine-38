import { useState } from "react";
import { AIAssistant } from "./AIAssistant";
import { motion, AnimatePresence } from "framer-motion";

export function AICommandButton() {
  const [showAssistant, setShowAssistant] = useState(false);

  return (
    <>
      {/* Floating AI Agent Trigger - safe-area aware */}
      <motion.button 
        onClick={() => setShowAssistant(!showAssistant)}
        className="fixed z-50 p-3.5 md:p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg"
        style={{
          bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))',
          right: 'max(1.5rem, env(safe-area-inset-right, 0px))',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring" as const, stiffness: 200, damping: 15, delay: 0.5 }}
        whileHover={{ 
          scale: 1.1, 
          boxShadow: "0 20px 40px -10px rgba(0, 163, 211, 0.5)",
        }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div 
          className="flex items-center gap-2"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="material-symbols-outlined text-xl">
            auto_awesome
          </span>
          <span className="hidden md:inline font-normal uppercase text-mono tracking-wider">IA</span>
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {showAssistant && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring" as const, stiffness: 300, damping: 25 }}
          >
            <AIAssistant onClose={() => setShowAssistant(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
