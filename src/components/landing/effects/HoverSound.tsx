import { useRef, ReactNode, useCallback, useEffect } from 'react';

interface HoverSoundProps {
  children: ReactNode;
  pitch?: number;
  volume?: number;
  duration?: number;
  className?: string;
}

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

const playTick = (pitch: number, volume: number, duration: number) => {
  try {
    const context = getAudioContext();
    if (context.state === 'suspended') {
      context.resume();
    }

    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.connect(gain);
    gain.connect(context.destination);

    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  } catch (e) {
    // Silently fail if Web Audio API is not available
  }
};

export function HoverSound({
  children,
  pitch = 800,
  volume = 0.03,
  duration = 0.05,
  className = ''
}: HoverSoundProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isPlayingRef = useRef(false);

  const handleMouseEnter = useCallback(() => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    playTick(pitch, volume, duration);
    setTimeout(() => {
      isPlayingRef.current = false;
    }, duration * 1000);
  }, [pitch, volume, duration]);

  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      className={className}
    >
      {children}
    </div>
  );
}
