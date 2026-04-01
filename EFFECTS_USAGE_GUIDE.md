# Landing Page Effects Components - Usage Guide

All dynamic effects have been created for the SQUAD Hub landing page. These are lightweight, performant components that enhance the user experience without requiring additional dependencies.

## Components Overview

### 1. MagneticElement
Makes children magnetically attracted to the cursor on hover.

```tsx
import { MagneticElement } from '@/components/landing/effects';

<MagneticElement maxDistance={15} strength={0.5}>
  <button>Hover me!</button>
</MagneticElement>
```

**Props:**
- `children`: ReactNode - Content to apply magnetic effect to
- `maxDistance`: number (default: 15) - Maximum pull distance in pixels
- `strength`: number (default: 0.5) - Pull force multiplier
- `friction`: number (default: 30) - Spring damping value

---

### 2. ParallaxLayer
Multi-layer parallax component for depth effects on scroll.

```tsx
import { ParallaxLayer, ParallaxLayerGroup } from '@/components/landing/effects';

<ParallaxLayerGroup>
  <ParallaxLayer speedY={0.3}>
    <img src="background.png" />
  </ParallaxLayer>
  <ParallexLayer speedY={0.6}>
    <img src="midground.png" />
  </ParallaxLayer>
  <ParallaxLayer speedY={1}>
    <img src="foreground.png" />
  </ParallaxLayer>
</ParallaxLayerGroup>
```

**Props:**
- `children`: ReactNode - Content for this layer
- `speedY`: number (default: 0.5) - Y-axis parallax speed
- `speedX`: number (default: 0) - X-axis parallax speed
- `offset`: number (default: 0) - Initial offset in pixels
- `className`: string - CSS classes

---

### 3. TextRevealByChar
Character-by-character text reveal animation on scroll.

```tsx
import { TextRevealByChar } from '@/components/landing/effects';

<TextRevealByChar
  text="Hyper Dynamic Content"
  effect="rise"
  staggerDelay={0.02}
  as="h1"
  className="text-4xl font-bold"
/>
```

**Props:**
- `text`: string - Text to animate
- `effect`: 'rise' | 'blur' | 'scale' | 'rotate3d' (default: 'rise')
- `staggerDelay`: number (default: 0.02) - Delay between characters
- `className`: string - CSS classes
- `as`: h1 | h2 | h3 | p | span | div (default: 'p')

---

### 4. DepthBlur
Creates a depth-of-field effect with blur based on scroll position.

```tsx
import { DepthBlur } from '@/components/landing/effects';

<DepthBlur depth={0.3} blurStrength={20}>
  <div className="content">Deep background content</div>
</DepthBlur>
```

**Props:**
- `children`: ReactNode - Content to apply effect to
- `depth`: number (default: 0.5) - Depth level (0-1)
- `blurStrength`: number (default: 20) - Maximum blur amount in pixels
- `className`: string - CSS classes

---

### 5. HoverSound
Plays subtle UI sound on hover using Web Audio API.

```tsx
import { HoverSound } from '@/components/landing/effects';

<HoverSound pitch={800} volume={0.03} duration={0.05}>
  <button>Click me</button>
</HoverSound>
```

**Props:**
- `children`: ReactNode - Content to add sound to
- `pitch`: number (default: 800) - Frequency in Hz
- `volume`: number (default: 0.03) - Volume level (0-1)
- `duration`: number (default: 0.05) - Duration in seconds
- `className`: string - CSS classes

---

### 6. GlitchText
Text component with brief glitch effect on hover.

```tsx
import { GlitchText } from '@/components/landing/effects';

<GlitchText className="text-xl font-semibold">
  Disruptive Design
</GlitchText>
```

**Props:**
- `children`: string - Text to glitch
- `className`: string - CSS classes

---

### 7. ScrollVelocityText
Infinite marquee that speeds up/slows based on scroll velocity.

```tsx
import { ScrollVelocityText } from '@/components/landing/effects';

<ScrollVelocityText
  text="Scroll for speed • "
  baseSpeed={-5}
  velocityMultiplier={0.01}
  className="text-lg font-bold"
/>
```

**Props:**
- `text`: string - Text to loop
- `baseSpeed`: number (default: -5) - Base scroll speed
- `velocityMultiplier`: number (default: 0.01) - Velocity sensitivity
- `className`: string - CSS classes

---

### 8. TiltCard
3D tilt card that rotates based on mouse position.

```tsx
import { TiltCard } from '@/components/landing/effects';

<TiltCard maxRotation={12} perspective={1000}>
  <div className="p-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
    Premium Content
  </div>
</TiltCard>
```

**Props:**
- `children`: ReactNode - Card content
- `maxRotation`: number (default: 12) - Maximum rotation in degrees
- `perspective`: number (default: 1000) - CSS perspective value
- `className`: string - CSS classes

---

### 9. useSmoothScroll Hook
Enhanced hook for smooth scrolling with easing animations.

```tsx
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

function Component() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollTo } = useSmoothScroll(scrollRef, 0.08);

  return (
    <div ref={scrollRef} className="scroll-container">
      <button onClick={() => scrollTo(500, { easing: 'easeOutCubic' })}>
        Scroll to 500px
      </button>
    </div>
  );
}
```

**Hook Returns:**
- `scrollTo(target: number, options?: ScrollToOptions)` - Smooth scroll function

**ScrollToOptions:**
- `duration`: number (default: 800) - Animation duration in ms
- `easing`: 'linear' | 'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad' | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic' (default: 'easeInOutCubic')

---

## Combining Effects

Create stunning landing pages by combining multiple effects:

```tsx
import {
  MagneticElement,
  ParallaxLayer,
  TextRevealByChar,
  TiltCard,
  HoverSound
} from '@/components/landing/effects';

export function HeroSection() {
  return (
    <ParallaxLayer speedY={0.3}>
      <TextRevealByChar
        text="Disruptive Technology"
        effect="rise"
        as="h1"
        className="text-5xl font-bold mb-8"
      />

      <HoverSound>
        <MagneticElement strength={0.7}>
          <TiltCard maxRotation={15}>
            <button className="premium-button">
              Experience Now
            </button>
          </TiltCard>
        </MagneticElement>
      </HoverSound>
    </ParallaxLayer>
  );
}
```

---

## Performance Notes

- All components use framer-motion for optimal performance
- Effects use spring physics for smooth, natural motion
- No external audio files or large assets needed
- HoverSound uses Web Audio API with minimal overhead
- Components are memoized where appropriate
- Safe to use multiple effects together

---

## Browser Support

- Chrome 90+
- Firefox 87+
- Safari 14+
- Edge 90+

Web Audio API (HoverSound) may not work in some browsers - gracefully degrades.

---

## File Locations

```
src/components/landing/effects/
├── MagneticElement.tsx
├── ParallaxLayer.tsx
├── TextRevealByChar.tsx
├── DepthBlur.tsx
├── HoverSound.tsx
├── GlitchText.tsx
├── ScrollVelocityText.tsx
├── TiltCard.tsx
└── index.ts

src/hooks/
└── useSmoothScroll.ts (enhanced)
```
