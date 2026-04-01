import { useEffect, RefObject, useCallback, useRef } from "react";

type EasingFunction = (t: number) => number;

const easingFunctions: Record<string, EasingFunction> = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * (t - 2)) * (2 * (t - 2)) + 1,
};

interface ScrollToOptions {
  duration?: number;
  easing?: keyof typeof easingFunctions;
}

/**
 * Inertial smooth scroll hook with optional easing and scrollTo function.
 * Applies to a scrollable container element for a luxurious, weighted feel.
 */
export function useSmoothScroll(
  containerRef: RefObject<HTMLElement>,
  factor = 0.08
) {
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const startScrollRef = useRef<number>(0);
  const targetScrollRef = useRef<number>(0);
  const isRunningRef = useRef(false);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const scrollTo = useCallback(
    (target: number, options: ScrollToOptions = {}) => {
      const { duration = 800, easing = "easeInOutCubic" } = options;
      const el = containerRef.current;
      if (!el) return;

      const easingFn = easingFunctions[easing];
      const startScroll = el.scrollTop;
      const startTime = Date.now();

      const animateScrollTo = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easingFn(progress);

        el.scrollTop = startScroll + (target - startScroll) * easedProgress;

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animateScrollTo);
        }
      };

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(animateScrollTo);
    },
    [containerRef]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    targetScrollRef.current = el.scrollTop;
    let currentScroll = el.scrollTop;

    const animate = () => {
      currentScroll = lerp(currentScroll, targetScrollRef.current, factor);

      if (Math.abs(currentScroll - targetScrollRef.current) < 0.5) {
        currentScroll = targetScrollRef.current;
        el.scrollTop = currentScroll;
        isRunningRef.current = false;
        return;
      }

      el.scrollTop = currentScroll;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (!isRunningRef.current) {
        isRunningRef.current = true;
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetScrollRef.current = Math.max(
        0,
        Math.min(
          targetScrollRef.current + e.deltaY,
          el.scrollHeight - el.clientHeight
        )
      );
      startAnimation();
    };

    const onScroll = () => {
      if (!isRunningRef.current) {
        targetScrollRef.current = el.scrollTop;
        currentScroll = el.scrollTop;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", onScroll);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [containerRef, factor]);

  return { scrollTo };
}
