# @alfiexco/animated-sprite

Generic version of the Inksight `Orc` canvas component. The package supplies the
autonomous idle/walk/action behavior; the host app supplies sprite sheets.

```tsx
import { AnimatedSprite } from "@alfiexco/animated-sprite";

<AnimatedSprite
  style={{ height: 280 }}
  animations={{
    idle: { src: "/sprites/Orc_Idle.png", frames: 6, fps: 8 },
    walk: { src: "/sprites/Orc_Walk.png", frames: 8, fps: 10 },
    action: { src: "/sprites/Orc_Attack01.png", frames: 6, fps: 14 },
  }}
/>
```

Any horizontal sprite sheet works as long as all frames are evenly sized.

## Props

- `animations.idle` is required.
- `animations.walk` enables autonomous movement between idle periods.
- `animations.action` enables click-triggered action playback inside the
  component bounds.
- `size`, `speedPxPerSecond`, `idleMinMs`, and `idleMaxMs` tune behavior.
- `mouseAttractionRadius` and `mouseAttractionChance` tune how often the sprite
  wanders toward the cursor.
- `onLoadError` receives sprite loading failures.

The sprite uses the bounds of its parent element, so set a stable height on the
component or a parent container.
