import { ReactNode } from "react";
import { motion, Variants } from "framer-motion";

const VIEWPORT = { once: true, margin: "-80px" as any };

// --- ScrollMotion: generic fade+slide wrapper ---
type ScrollMotionVariant = "fadeUp" | "fadeDown" | "fadeLeft" | "fadeRight" | "scaleUp";

const variantMap: Record<ScrollMotionVariant, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: "easeOut" } },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -24, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: "easeOut" } },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: -24, filter: "blur(4px)" },
    visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: "easeOut" } },
  },
  fadeRight: {
    hidden: { opacity: 0, x: 24, filter: "blur(4px)" },
    visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: "easeOut" } },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.92, filter: "blur(4px)" },
    visible: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: 0.5, ease: "easeOut" } },
  },
};

interface ScrollMotionProps {
  children: ReactNode;
  variant?: ScrollMotionVariant;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article";
}

export function ScrollMotion({ children, variant = "fadeUp", delay = 0, className, as = "div" }: ScrollMotionProps) {
  const Component = motion[as];
  const v = variantMap[variant];
  const variants: Variants = {
    hidden: v.hidden,
    visible: {
      ...v.visible,
      transition: { ...(v.visible as any).transition, delay },
    },
  };

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={variants}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </Component>
  );
}

// --- ScrollMotionWord: animate word-by-word ---
interface ScrollMotionWordProps {
  text: string;
  className?: string;
  highlightWord?: string;
  highlightClass?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export function ScrollMotionWord({
  text,
  className = "",
  highlightWord,
  highlightClass = "text-primary font-normal",
  delay = 0,
  as = "h2",
}: ScrollMotionWordProps) {
  const words = text.split(" ");
  const Tag = motion[as];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: delay },
    },
  };

  const wordVariants: Variants = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { type: "spring", damping: 14, stiffness: 120 },
    },
  };

  return (
    <Tag
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      style={{ willChange: "opacity, transform" }}
    >
      {words.map((word, i) => {
        const isHighlighted = highlightWord && word.toLowerCase() === highlightWord.toLowerCase();
        return (
          <motion.span
            key={i}
            variants={wordVariants}
            className={`inline-block mr-[0.3em] ${isHighlighted ? highlightClass : ""}`}
          >
            {word}
          </motion.span>
        );
      })}
    </Tag>
  );
}

// --- ScrollMotionStagger: container with stagger ---
interface ScrollMotionStaggerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  delay?: number;
}

const staggerContainer = (staggerDelay: number, delay: number): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: staggerDelay, delayChildren: delay },
  },
});

export function ScrollMotionStagger({ children, className, staggerDelay = 0.05, delay = 0 }: ScrollMotionStaggerProps) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer(staggerDelay, delay)}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
    >
      {children}
    </motion.div>
  );
}

// --- ScrollMotionItem: child of stagger ---
interface ScrollMotionItemProps {
  children: ReactNode;
  className?: string;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 100, damping: 16 },
  },
};

export function ScrollMotionItem({ children, className }: ScrollMotionItemProps) {
  return (
    <motion.div
      className={className}
      variants={itemVariants}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
}
