import { motion, Variants } from 'framer-motion';

interface MaskTitleProps {
  text: string;
  highlightWord?: string;
  className?: string;
}

/**
 * MaskTitle — editorial text-mask-reveal headline.
 * Replaces NeonTitle with clean clip-path animation, no glow/neon effects.
 */
export function MaskTitle({ text, highlightWord, className = '' }: MaskTitleProps) {
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
      y: "100%",
      opacity: 0,
    },
    visible: { 
      y: "0%",
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <motion.h1
      className={`text-4xl md:text-6xl font-light text-foreground tracking-tight leading-tight ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => {
        const isHighlighted = word.toLowerCase() === highlightWord?.toLowerCase();
        
        return (
          <span key={index} className="overflow-hidden inline-block mr-[0.25em]">
            <motion.span
              variants={wordVariants}
              className={`inline-block ${
                isHighlighted 
                  ? 'text-primary font-normal' 
                  : ''
              }`}
            >
              {word}
            </motion.span>
          </span>
        );
      })}
    </motion.h1>
  );
}
