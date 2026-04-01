import { useRef, ReactNode, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface DepthBlurProps {
  children: ReactNode;
  depth?: number;
  blurStrength?: number;
  className?: string;
}

export function DepthBlur({
  children,
  depth = 0.5,
  blurStrength = 20,
  className = ''
}: DepthBlurProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  const blur = useTransform(scrollY, (v) => {
    const maxBlur = blurStrength * (1 - depth);
    const normalizedDepth = Math.abs(v) / (window.innerHeight * 2);
    return Math.max(0, Math.min(maxBlur, normalizedDepth * blurStrength));
  });

  const opacity = useTransform(scrollY, (v) => {
    const normalizedDepth = Math.abs(v) / (window.innerHeight * 3);
    return Math.min(1, Math.max(0.3, 1 - normalizedDepth * (1 - depth)));
  });

  return (
    <motion.div
      ref={ref}
      style={{
        filter: blur.get() > 0 ? blur.get() : 'none',
        opacity
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
