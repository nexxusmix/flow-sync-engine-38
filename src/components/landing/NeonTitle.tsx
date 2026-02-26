import { motion, Variants } from 'framer-motion';

interface NeonTitleProps {
  text: string;
  highlightWord?: string;
  className?: string;
}

export function NeonTitle({ text, highlightWord, className = '' }: NeonTitleProps) {
  const words = text.split(' ');

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const wordVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 40,
      rotateX: -90,
      filter: 'blur(4px)',
    },
    visible: { 
      opacity: 1, 
      y: 0,
      rotateX: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring' as const,
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.h1
      className={`text-4xl md:text-6xl font-light text-foreground tracking-tight leading-tight ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ perspective: '1000px' }}
    >
      {words.map((word, index) => {
        const isHighlighted = word.toLowerCase() === highlightWord?.toLowerCase();
        
        return (
          <motion.span
            key={index}
            variants={wordVariants}
            className={`inline-block mr-[0.3em] ${
              isHighlighted 
                ? 'text-primary font-normal' 
                : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            {word}
          </motion.span>
        );
      })}
    </motion.h1>
  );
}
