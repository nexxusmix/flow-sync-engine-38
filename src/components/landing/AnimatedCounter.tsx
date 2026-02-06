import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ 
  value, 
  prefix = '', 
  suffix = '', 
  duration = 2,
  className = ''
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (value >= 1000000) {
      return `${(latest / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${Math.round(latest / 1000)}`;
    }
    return Math.round(latest).toString();
  });

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, {
        duration,
        ease: [0.25, 0.1, 0.25, 1],
      });
      return controls.stop;
    }
  }, [isInView, value, duration, count]);

  return (
    <motion.span 
      ref={ref}
      className={`tabular-nums ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  );
}
