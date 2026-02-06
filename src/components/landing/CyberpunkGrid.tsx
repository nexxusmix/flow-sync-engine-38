import { motion } from 'framer-motion';

export function CyberpunkGrid() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Animated Grid */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 163, 211, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 163, 211, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
        animate={{
          backgroundPosition: ['0px 0px', '60px 60px'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Perspective Grid Floor */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[40vh]"
        style={{
          background: `
            linear-gradient(to top, rgba(0, 163, 211, 0.05), transparent),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 59px,
              rgba(0, 163, 211, 0.03) 59px,
              rgba(0, 163, 211, 0.03) 60px
            )
          `,
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'bottom center',
          maskImage: 'linear-gradient(to top, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
        }}
      />

      {/* Scan Line Effect */}
      <motion.div
        className="absolute left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0, 163, 211, 0.5), transparent)',
          boxShadow: '0 0 20px rgba(0, 163, 211, 0.5)',
        }}
        animate={{
          top: ['-10%', '110%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary/10" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-primary/10" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-primary/10" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-primary/10" />
    </div>
  );
}
