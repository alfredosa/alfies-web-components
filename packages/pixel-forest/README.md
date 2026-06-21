# @alfiexco/pixel-forest

Animated pixel forest canvas migrated from Biomehub's dashboard tree scene.

```tsx
import { PixelForest } from "@alfiexco/pixel-forest";

<PixelForest fullscreen density={1.1} windStrength={0.8} />
```

Set `fullscreen={false}` to make it fill a parent element. Pass `palettes`,
`skyTop`, `skyMiddle`, `skyBottom`, `mistColor`, and `groundColor` to theme the
scene without editing canvas code.

## Props

- `seed`: deterministic forest layout input.
- `density`: tree spacing multiplier.
- `windStrength`: animation intensity.
- `fullscreen`: fixed full-viewport canvas when true, parent-sized canvas when
  false.
- `respectReducedMotion`: freezes animation when the user prefers reduced
  motion.
- `palettes`: tree color palettes with leaf and trunk colors.
