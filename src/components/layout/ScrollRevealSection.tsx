import { ReactNode } from "react";
import { motion } from "framer-motion";

interface ScrollRevealSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}

const directionMap = {
  up: { y: 30, x: 0 },
  down: { y: -30, x: 0 },
  left: { x: 40, y: 0 },
  right: { x: -40, y: 0 },
};

export function ScrollRevealSection({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: ScrollRevealSectionProps) {
  const offset = directionMap[direction];

  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        filter: "blur(4px)",
        ...offset,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        x: 0,
        filter: "blur(0px)",
      }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.6,
        delay,
        type: "spring",
        stiffness: 80,
        damping: 18,
      }}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </motion.div>
  );
}
