import { useRef, ReactNode, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ParallaxLayerProps {
  children: ReactNode;
  offset?: number;
  speedY?: number;
  speedX?: number;
  className?: string;
}

interface ParallaxLayerGroupProps {
  children: ReactNode;
  className?: string;
}

export function ParallaxLayer({
  children,
  offset = 0,
  speedY = 0.5,
  speedX = 0,
  className = ''
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  const y = useTransform(scrollY, (v) => {
    if (!ref.current) return offset;
    const rect = ref.current.getBoundingClientRect();
    const elementTop = window.innerHeight - rect.top;
    return (elementTop - window.innerHeight) * speedY * -1 + offset;
  });

  const x = useTransform(scrollY, (v) => {
    if (!ref.current) return 0;
    return v * speedX;
  });

  return (
    <motion.div
      ref={ref}
      style={{ y, x }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ParallaxLayerGroup({
  children,
  className = ''
}: ParallaxLayerGroupProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
