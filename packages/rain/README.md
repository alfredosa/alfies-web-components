# @alfiexco/rain

A framework-neutral React canvas rain and lightning effect, migrated from
Inksight's `RainEffect`.

```tsx
import { RainEffect } from "@alfiexco/rain";

<div style={{ position: "fixed", inset: 0 }}>
  <RainEffect color="#d7c08d" intensity={0.7} size={1.1} />
</div>
```

The component fills its parent. Use a fixed parent for a full-screen background
or a regular positioned parent for a contained effect. `Rain` is exported as an
alias for `RainEffect`.

## Props

- `color`: rain stroke color.
- `intensity`: `0` to `1` drop and lightning intensity.
- `size`: stroke and drop length multiplier.
- `maxDrops`: upper bound for active drops.
- `windX`: horizontal drift.
- `lightning`: toggles bolt and flash rendering.
- `lightningMinDelayMs` and `lightningMaxDelayMs`: randomized bolt cadence.
