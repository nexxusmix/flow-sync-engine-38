/**
 * PortalAnimatedSection - Wrapper de animação reutilizável
 * 
 * Features:
 * - Fade-in-up com stagger para múltiplos filhos
 * - Suporte a useInView para animações ao entrar na viewport
 * - Respeita prefers-reduced-motion
 */

import { memo, ReactNode } from "react";
import { motion, Variants, useReducedMotion } from "framer-motion";

interface PortalAnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: boolean;
  staggerDelay?: number;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (custom: { stagger: boolean; staggerDelay: number }) => ({
    opacity: 1,
    transition: {
      staggerChildren: custom.stagger ? custom.staggerDelay : 0,
      delayChildren: 0.1,
    },
  }),
};

const itemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 16,
    scale: 0.98,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

function PortalAnimatedSectionComponent({
  children,
  className = "",
  delay = 0,
  stagger = false,
  staggerDelay = 0.08,
}: PortalAnimatedSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      custom={{ stagger, staggerDelay }}
      variants={containerVariants}
      style={{ willChange: 'opacity' }}
    >
      <motion.div
        variants={itemVariants}
        transition={{ delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export const PortalAnimatedSection = memo(PortalAnimatedSectionComponent);

// Export variants for use in child components
export { itemVariants, containerVariants };

// Simple fade-in component for individual items
interface AnimatedItemProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

function AnimatedItemComponent({ children, className = "", delay = 0 }: AnimatedItemProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.35, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
}

export const AnimatedItem = memo(AnimatedItemComponent);

// Stagger container for grid/list items
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

function StaggerContainerComponent({ 
  children, 
  className = "",
  staggerDelay = 0.05,
}: StaggerContainerProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export const StaggerContainer = memo(StaggerContainerComponent);

// Stagger item to use inside StaggerContainer
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

function StaggerItemComponent({ children, className = "" }: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 8, scale: 0.98 },
        visible: { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: {
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export const StaggerItem = memo(StaggerItemComponent);

// Hover lift effect for cards
interface HoverLiftProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

function HoverLiftComponent({ children, className = "", glowColor }: HoverLiftProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      whileHover={shouldReduceMotion ? {} : { 
        y: -4, 
        scale: 1.01,
        boxShadow: glowColor 
          ? `0 8px 24px -8px ${glowColor}` 
          : "0 8px 24px -8px rgba(6, 182, 212, 0.15)",
      }}
      transition={{ 
        duration: 0.2,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}

export const HoverLift = memo(HoverLiftComponent);
