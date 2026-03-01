import { ReactNode, useRef } from "react";
import { motion, useScroll, useTransform, useSpring, MotionValue } from "framer-motion";

interface ScrollLinkedProps {
  children: ReactNode;
  className?: string;
  id?: string;
  /** vertical offset in px at entry */
  yIn?: number;
  /** vertical offset in px at exit */
  yOut?: number;
  /** scale at entry */
  scaleIn?: number;
  /** scale at exit */
  scaleOut?: number;
  /** horizontal slide from left (-) or right (+) at entry */
  xIn?: number;
  xOut?: number;
  /** scroll offset config */
  offset?: [string, string];
}

const springConfig = { stiffness: 120, damping: 30, mass: 0.5 };

export function ScrollLinked({
  children,
  className = "",
  id,
  yIn = 60,
  yOut = -30,
  scaleIn = 0.97,
  scaleOut = 1,
  xIn = 0,
  xOut = 0,
  offset = ["start end", "end start"],
}: ScrollLinkedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: offset as any });

  const rawOpacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);
  const rawY = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [yIn, 0, 0, yOut]);
  const rawScale = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [scaleIn, 1, 1, scaleOut]);
  const rawX = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [xIn, 0, 0, xOut]);

  const opacity = useSpring(rawOpacity, springConfig);
  const y = useSpring(rawY, springConfig);
  const scale = useSpring(rawScale, springConfig);
  const x = useSpring(rawX, springConfig);

  return (
    <motion.div
      ref={ref}
      id={id}
      className={className}
      style={{ opacity, y, scale, x }}
    >
      {children}
    </motion.div>
  );
}

/** Hook for individual items within a scroll-linked section */
export function useScrollLinkedItem(
  containerProgress: MotionValue<number>,
  index: number,
  total: number
) {
  const start = (index / total) * 0.5;
  const end = start + 0.3;

  const opacity = useTransform(containerProgress, [start, end], [0, 1]);
  const y = useTransform(containerProgress, [start, end], [30, 0]);

  return {
    opacity: useSpring(opacity, springConfig),
    y: useSpring(y, springConfig),
  };
}
