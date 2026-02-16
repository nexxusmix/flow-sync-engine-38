import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.96,
    filter: "blur(6px)",
    y: 12,
  },
  animate: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    y: 0,
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    filter: "blur(4px)",
    y: -8,
  },
};

const pageTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20,
  mass: 0.8,
};

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="w-full flex-1"
      style={{ transformStyle: "preserve-3d", perspective: 1200 }}
    >
      {children}
    </motion.div>
  );
}
