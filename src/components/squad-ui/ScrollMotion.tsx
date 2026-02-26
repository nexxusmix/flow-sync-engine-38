import { ReactNode, useRef } from "react";
import { motion, Variants, useScroll, useTransform, useSpring, useInView } from "framer-motion";

const VIEWPORT = { once: true, margin: "-80px" as any };
const SPRING = { stiffness: 120, damping: 18 };

// --- Variant map ---
type ScrollMotionVariant = "fadeUp" | "fadeDown" | "fadeLeft" | "fadeRight" | "scaleUp" | "textMask" | "imageReveal";

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
  textMask: {
    hidden: { opacity: 0, y: "100%", filter: "blur(2px)" },
    visible: {
      opacity: 1,
      y: "0%",
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  },
  imageReveal: {
    hidden: { opacity: 0, scale: 1.08, filter: "blur(8px)" },
    visible: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  },
};

// --- ScrollMotion: generic scroll-triggered wrapper ---
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
      style={{
        willChange: "opacity, transform",
        ...(variant === "textMask" ? { overflow: "hidden", display: "inline-block" } : {}),
      }}
    >
      {children}
    </Component>
  );
}

// --- ScrollMotionWord: animate word-by-word with textMask ---
interface ScrollMotionWordProps {
  text: string;
  className?: string;
  highlightWord?: string;
  highlightClass?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  variant?: "spring" | "textMask";
}

export function ScrollMotionWord({
  text,
  className = "",
  highlightWord,
  highlightClass = "text-primary font-normal",
  delay = 0,
  as = "h2",
  variant = "spring",
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

  const wordVariants: Variants =
    variant === "textMask"
      ? {
          hidden: { y: "100%", opacity: 0 },
          visible: {
            y: "0%",
            opacity: 1,
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
          },
        }
      : {
          hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
          visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: { type: "spring", ...SPRING },
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
          <span key={i} className="overflow-hidden inline-block mr-[0.25em]">
            <motion.span
              variants={wordVariants}
              className={`inline-block ${isHighlighted ? highlightClass : ""}`}
            >
              {word}
            </motion.span>
          </span>
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
    transition: { type: "spring", ...SPRING },
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

// --- ScrollMotionAccordion: expand/collapse with spring ---
interface ScrollMotionAccordionProps {
  children: ReactNode;
  isOpen: boolean;
  className?: string;
}

export function ScrollMotionAccordion({ children, isOpen, className }: ScrollMotionAccordionProps) {
  return (
    <motion.div
      className={className}
      initial={false}
      animate={{
        height: isOpen ? "auto" : 0,
        opacity: isOpen ? 1 : 0,
      }}
      transition={{ type: "spring", ...SPRING }}
      style={{ overflow: "hidden" }}
    >
      {children}
    </motion.div>
  );
}

// --- StickyLabel: section label that sticks to top during scroll ---
interface StickyLabelProps {
  children: ReactNode;
  className?: string;
  offsetTop?: number;
}

export function StickyLabel({ children, className, offsetTop = 80 }: StickyLabelProps) {
  return (
    <div
      className={`z-30 ${className ?? ""}`}
      style={{
        position: "sticky",
        top: offsetTop,
      }}
    >
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
