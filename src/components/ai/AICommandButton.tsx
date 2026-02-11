import { useState } from "react";
import { AIAssistant } from "./AIAssistant";
import { motion, AnimatePresence } from "framer-motion";

export function AICommandButton() {
  const [showAssistant, setShowAssistant] = useState(false);

  return (
    <>
      {/* Floating AI Agent Trigger - positioned to not overlap content */}
      <motion.button 
        onClick={() => setShowAssistant(!showAssistant)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring" as const, stiffness: 200, damping: 15, delay: 0.5 }}
        whileHover={{ 
          scale: 1.1, 
          boxShadow: "0 20px 40px -10px rgba(0, 163, 211, 0.5)",
          rotate: [0, -5, 5, 0],
        }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div 
          className="flex items-center gap-2"
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="material-symbols-outlined text-xl">
            auto_awesome
          </span>
          <span className="hidden md:inline font-normal uppercase text-[10px] tracking-wider">IA</span>
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
