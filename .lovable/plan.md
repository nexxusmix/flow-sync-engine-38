
# Fix: Overview Cards Dark/Glow Bug

## Problem
The Overview dashboard cards appear overly dark and have a distracting blue glow effect. Multiple CSS layers are conflicting.

## Root Causes

1. **MetricCard inline glow**: The `MetricCard` component has a `whileHover` with `boxShadow: "0 20px 50px -20px rgba(0, 163, 211, 0.3)"` creating a huge blue glow on hover.
2. **Duplicate CSS hover rule**: At lines 1167-1171 of `index.css`, there's a generic `.glass-card:hover` rule adding `box-shadow: 0 16px 40px -16px hsl(var(--primary) / 0.12)` which stacks on top of the component-level styles.
3. **Card backgrounds too transparent**: `rgba(255, 255, 255, 0.02)` on a black background makes cards nearly invisible -- they need slightly higher opacity (around 0.03-0.04) to be readable.
4. **`--shadow-deep` variable**: Still defined with heavy values at line 116 (`0 0 15px rgba(0, 0, 0, 0.8), inset 0 0 10px ...`), potentially used elsewhere.

## Changes

### 1. `src/components/dashboard/MetricCard.tsx`
- Remove the heavy `boxShadow` from the `whileHover` prop (the `"0 20px 50px..."` blue glow)
- Keep the subtle scale/translate hover effects

### 2. `src/index.css`
- Increase `.dark .glass-card` background from `0.02` to `0.035` for better visibility
- Tone down the generic `.glass-card:hover` box-shadow at line 1171 to a much subtler value
- Clean up `--shadow-deep` variable to remove inset glow

### 3. `src/pages/Dashboard.tsx`
- The Visual Board `glass-card` container (line 209) has inline `transformStyle: "preserve-3d"` which can amplify the depth effect -- will keep but ensure shadows are clean

## Result
Cards will be slightly more visible against the dark background, with no distracting blue glow on hover. Clean, cinema-grade glass aesthetic preserved.
