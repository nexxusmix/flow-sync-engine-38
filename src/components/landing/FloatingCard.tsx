import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface FloatingCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

export function FloatingCard({ icon: Icon, title, description, index }: FloatingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = (mouseX / width) - 0.5;
    const yPct = (mouseY / height) - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      className="relative group cursor-pointer"
      initial={{ opacity: 0, y: 60, rotateX: -15 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.8,
        delay: index * 0.15,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="glass-card p-6 rounded-xl relative overflow-hidden border border-border/50 transition-colors duration-500 group-hover:border-primary/30"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div 
            className="absolute inset-0 blur-xl"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(0, 163, 211, 0.15), transparent 70%)',
            }}
          />
        </div>

        {/* Border Glow */}
        <div 
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            boxShadow: 'inset 0 0 30px rgba(0, 163, 211, 0.1)',
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          <motion.div 
            className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300"
            style={{
              transform: 'translateZ(30px)',
            }}
          >
            <Icon className="w-6 h-6 text-primary group-hover:drop-shadow-[0_0_8px_rgba(0,163,211,0.5)] transition-all duration-300" />
          </motion.div>
          
          <motion.h3 
            className="font-medium text-foreground mb-2 group-hover:text-primary transition-colors duration-300"
            style={{
              transform: 'translateZ(20px)',
            }}
          >
            {title}
          </motion.h3>
          
          <motion.p 
            className="text-sm text-muted-foreground"
            style={{
              transform: 'translateZ(10px)',
            }}
          >
            {description}
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}
