import { useRef, useMemo } from 'react';
import { motion, useInView, Variants } from 'framer-motion';

type RevealEffect = 'rise' | 'blur' | 'scale' | 'rotate3d';

interface TextRevealByCharProps {
  text: string;
  effect?: RevealEffect;
  staggerDelay?: number;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

const effectVariants: Record<RevealEffect, Variants> = {
  rise: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  blur: {
    hidden: { opacity: 0, filter: 'blur(8px)' },
    visible: { opacity: 1, filter: 'blur(0px)' },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
  rotate3d: {
    hidden: { opacity: 0, rotateX: 90 },
    visible: { opacity: 1, rotateX: 0 },
  },
};

export function TextRevealByChar({
  text,
  effect = 'rise',
  staggerDelay = 0.02,
  className = '',
  as: Component = 'p',
}: TextRevealByCharProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.8 });

  const variants = effectVariants[effect];
  const chars = useMemo(() => text.split(''), [text]);

  return (
    <Component ref={ref as any} className={className}>
      <motion.span
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        className="inline-block"
      >
        {chars.map((char, index) => (
          <motion.span
            key={index}
            variants={variants}
            transition={{
              duration: 0.4,
              delay: index * staggerDelay,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="inline-block"
            style={{ perspective: '1000px' }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.span>
    </Component>
  );
}
