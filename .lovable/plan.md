
# Fix: Landing Page Not Scrolling

## Problem
The landing page shows only the nav bar and background effects. All content (hero, problem, solution, pricing, etc.) exists but is invisible because the page cannot scroll.

## Root Cause
In `src/index.css` (lines 127-141), both `html` and `body` have:
```css
overflow: hidden;
height: 100vh;
```
This prevents any scrolling. The app's internal pages use their own scroll containers (sidebars, scroll areas), but the landing page relies on natural page scroll which is blocked.

## Solution
Make the landing page container a self-contained scrollable area that fills the viewport, instead of relying on body scroll.

### File: `src/pages/LandingPage.tsx`
- Change the root `div` from `min-h-screen` to `h-screen overflow-y-auto` so it creates its own scroll context within the locked body
- This approach avoids touching the global CSS (which other pages depend on)

### File: `src/components/landing/LandingHero.tsx`
- The hero uses `useScroll()` which tracks window scroll by default -- this won't work inside a container
- Pass a scroll container ref from `LandingPage` to `LandingHero`, or remove the parallax scroll effect (which causes the hero to fade out on scroll)
- Simplest fix: use `useScroll({ container: ref })` with a ref from the parent, OR remove the scroll-linked transforms entirely since they add complexity and can cause the hero to appear invisible

### Approach
1. In `LandingPage.tsx`: wrap everything in a `div` with `h-screen overflow-y-auto` and create a `ref` for it
2. Pass that ref to `LandingHero` so `useScroll` tracks the container scroll instead of window scroll
3. All other sections use `whileInView` which works fine with any scroll container

### Technical Details

**LandingPage.tsx changes:**
- Add `useRef` for the scroll container
- Change className to `h-screen overflow-y-auto` (replaces `min-h-screen`)
- Pass `scrollContainerRef` to `LandingHero`

**LandingHero.tsx changes:**
- Accept optional `scrollContainerRef` prop
- Update `useScroll({ container: scrollContainerRef })` so parallax works correctly within the container

No other files need changes -- all other landing sections use `whileInView` with `viewport={{ once: true }}` which works with any scrollable ancestor.
