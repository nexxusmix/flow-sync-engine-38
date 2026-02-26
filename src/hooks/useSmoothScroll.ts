import { useEffect, RefObject } from "react";

/**
 * Inertial smooth scroll hook using requestAnimationFrame + lerp.
 * Applies to a scrollable container element for a luxurious, weighted feel.
 */
export function useSmoothScroll(containerRef: RefObject<HTMLElement>, factor = 0.08) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let targetScroll = el.scrollTop;
    let currentScroll = el.scrollTop;
    let rafId: number;
    let isRunning = false;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      currentScroll = lerp(currentScroll, targetScroll, factor);

      // Stop if close enough
      if (Math.abs(currentScroll - targetScroll) < 0.5) {
        currentScroll = targetScroll;
        el.scrollTop = currentScroll;
        isRunning = false;
        return;
      }

      el.scrollTop = currentScroll;
      rafId = requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (!isRunning) {
        isRunning = true;
        rafId = requestAnimationFrame(animate);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetScroll = Math.max(
        0,
        Math.min(
          targetScroll + e.deltaY,
          el.scrollHeight - el.clientHeight
        )
      );
      startAnimation();
    };

    // Sync on manual scroll (touch, keyboard)
    const onScroll = () => {
      if (!isRunning) {
        targetScroll = el.scrollTop;
        currentScroll = el.scrollTop;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [containerRef, factor]);
}
