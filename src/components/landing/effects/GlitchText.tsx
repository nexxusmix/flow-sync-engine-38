import { useRef } from 'react';

interface GlitchTextProps {
  children: string;
  className?: string;
}

const generateRandomOffset = () => {
  return {
    x: (Math.random() - 0.5) * 6,
    y: (Math.random() - 0.5) * 6,
  };
};

export function GlitchText({ children, className = '' }: GlitchTextProps) {
  const ref = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = () => {
    if (!ref.current) return;
    ref.current.style.animation = 'none';
    setTimeout(() => {
      if (ref.current) {
        ref.current.style.animation = 'glitch 0.3s ease-in-out';
      }
    }, 10);
  };

  return (
    <>
      <style>{`
        @keyframes glitch {
          0%, 100% {
            text-shadow: none;
            clip-path: none;
          }
          20% {
            text-shadow: 2px 2px rgba(255, 0, 0, 0.8), -2px -2px rgba(0, 255, 255, 0.8);
            clip-path: polygon(0% 0%, 100% 0%, 100% 45%, 0% 58%);
          }
          40% {
            text-shadow: -2px 3px rgba(0, 255, 0, 0.8), 3px -2px rgba(255, 0, 255, 0.8);
            clip-path: polygon(0% 25%, 100% 25%, 100% 58%, 0% 78%);
          }
          60% {
            text-shadow: 2px -1px rgba(0, 255, 255, 0.8), -3px 2px rgba(255, 0, 0, 0.8);
            clip-path: polygon(0% 0%, 100% 33%, 100% 73%, 0% 100%);
          }
          80% {
            text-shadow: -1px -2px rgba(255, 0, 255, 0.8), 2px 2px rgba(0, 255, 0, 0.8);
            clip-path: polygon(0% 10%, 100% 1%, 100% 88%, 0% 99%);
          }
        }
      `}</style>
      <span
        ref={ref}
        onMouseEnter={handleMouseEnter}
        className={`cursor-pointer transition-colors duration-200 hover:text-primary ${className}`}
      >
        {children}
      </span>
    </>
  );
}
