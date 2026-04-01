import { useRef, useMemo } from 'react';
import { motion, useScroll, useVelocity, useTransform } from 'framer-motion';

interface ScrollVelocityTextProps {
  text: string;
  className?: string;
  baseSpeed?: number;
  velocityMultiplier?: number;
}

export function ScrollVelocityText({
  text,
  className = '',
  baseSpeed = -5,
  velocityMultiplier = 0.01,
}: ScrollVelocityTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);

  const x = useTransform(scrollY, (v) => {
    const vel = velocity.get();
    const speed = baseSpeed + vel * velocityMultiplier;
    return (v * speed) % (text.length * 15);
  });

  const repeatedText = useMemo(() => {
    return Array(3).fill(text).join('  ');
  }, [text]);

  return (
    <div
      ref={ref}
      className={`overflow-hidden whitespace-nowrap ${className}`}
    >
      <motion.div
        style={{ x }}
        className="inline-block"
      >
        <span className="inline-block mr-8">{repeatedText}</span>
        <span className="inline-block mr-8">{repeatedText}</span>
      </motion.div>
    </div>
  );
}
