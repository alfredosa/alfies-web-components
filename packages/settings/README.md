# @alfiexco/settings

Typed React settings runtime migrated from Inksight's standalone settings
package. It creates a provider/hook pair for a settings schema and can persist
to `localStorage`.

```tsx
import { createSettings } from "@alfiexco/settings";

type AppSettings = {
  theme: "light" | "dark";
  rain: { intensity: number };
};

const appSettings = createSettings<AppSettings>({
  defaultSettings: {
    theme: "dark",
    rain: { intensity: 0.65 },
  },
  storageKey: "app-settings",
  getStyle: (settings) => ({
    "--rain-intensity": String(settings.rain.intensity),
  }),
});

export const SettingsProvider = appSettings.SettingsProvider;
export const useSettings = appSettings.useSettings;
```

Use `normalize` when stored settings need validation, clamping, migration, or
deep merging with nested defaults.

## API

- `createSettings({ defaultSettings })` returns `SettingsProvider` and
  `useSettings`.
- `storageKey` enables browser `localStorage` persistence.
- `getStyle` maps settings into inherited CSS variables or inline styles.
- `normalize` converts partially trusted stored data into a full settings
  object.
- The hook exposes `settings`, `setSettings`, `update`, `patch`, and `reset`.
