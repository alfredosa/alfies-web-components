# @alfiexco/layered-object

Customizable React version of the stacked object frame from Biomehub.

```tsx
import { LayeredObject } from "@alfiexco/layered-object";

<LayeredObject
  offset="lg"
  primaryColor="#ffffff"
  primaryBorderColor="#0ea5e9"
  secondaryColor="#e0f2fe"
  secondaryBorderColor="rgba(14, 165, 233, 0.3)"
>
  <img src="/preview.png" alt="" />
</LayeredObject>
```

## Props

- `offset`: `"sm"`, `"md"`, `"lg"`, or a pixel number.
- `primaryColor`, `primaryBorderColor`, `primaryBorderWidth`: front layer.
- `secondaryColor`, `secondaryBorderColor`, `secondaryBorderWidth`: back layer.
- `radius`: shared border radius.
- `style`, `frontLayerStyle`, `backLayerStyle`, and class names let a host app
  integrate its own styling system.
