import { useRef, ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface MagneticElementProps {
  children: ReactNode;
  maxDistance?: number;
  strength?: number;
  friction?: number;
}

export function MagneticElement({
  children,
  maxDistance = 15,
  strength = 0.5,
  friction = 30
}: MagneticElementProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const xSpring = useSpring(x, { stiffness: 150, damping: friction });
  const ySpring = useSpring(y, { stiffness: 150, damping: friction });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distance = Math.sqrt(
      Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
    );

    if (distance < maxDistance * 3) {
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const pull = Math.min(maxDistance, maxDistance * (1 - distance / (maxDistance * 3)));

      x.set(Math.cos(angle) * pull * strength);
      y.set(Math.sin(angle) * pull * strength);
    }
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: xSpring, y: ySpring }}
      className="cursor-pointer"
    >
      {children}
    </motion.div>
  );
}
