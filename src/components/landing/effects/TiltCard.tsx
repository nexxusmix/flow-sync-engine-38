import { useRef, ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface TiltCardProps {
  children: ReactNode;
  maxRotation?: number;
  perspective?: number;
  className?: string;
}

export function TiltCard({
  children,
  maxRotation = 12,
  perspective = 1000,
  className = ''
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(
    useTransform(y, [-1, 1], [maxRotation, -maxRotation]),
    { stiffness: 100, damping: 20 }
  );

  const rotateY = useSpring(
    useTransform(x, [-1, 1], [-maxRotation, maxRotation]),
    { stiffness: 100, damping: 20 }
  );

  const spotX = useMotionValue('50%');
  const spotY = useMotionValue('50%');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rotateXPercent = ((e.clientY - centerY) / rect.height) * 2;
    const rotateYPercent = ((e.clientX - centerX) / rect.width) * 2;

    x.set(rotateYPercent);
    y.set(rotateXPercent);

    spotX.set(`${((e.clientX - rect.left) / rect.width) * 100}%`);
    spotY.set(`${((e.clientY - rect.top) / rect.height) * 100}%`);
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
      style={{
        rotateX,
        rotateY,
        perspective,
        transformStyle: 'preserve-3d',
      }}
      className={`relative ${className}`}
    >
      {children}

      <motion.div
        className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl overflow-hidden"
        style={{
          background: `radial-gradient(circle at ${spotX} ${spotY}, rgba(255, 255, 255, 0.1), transparent 50%)`
        }}
      />
    </motion.div>
  );
}
