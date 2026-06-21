import {
  createContext,
  createElement,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from "react";

export type SettingsStyleMapper<TSettings extends object> = (
  settings: TSettings,
) => CSSProperties;

export type SettingsNormalizer<TSettings extends object> = (
  storedSettings: Partial<TSettings>,
  defaultSettings: TSettings,
) => TSettings;

export type CreateSettingsOptions<TSettings extends object> = {
  defaultSettings: TSettings;
  storageKey?: string;
  getStyle?: SettingsStyleMapper<TSettings>;
  normalize?: SettingsNormalizer<TSettings>;
};

export type SettingsProviderProps = PropsWithChildren;

export type SettingsContextValue<TSettings extends object> = {
  settings: TSettings;
  setSettings: Dispatch<SetStateAction<TSettings>>;
  update: <K extends keyof TSettings>(key: K, value: TSettings[K]) => void;
  patch: (settings: Partial<TSettings>) => void;
  reset: () => void;
};

export function createSettings<TSettings extends object>({
  defaultSettings,
  storageKey,
  getStyle,
  normalize = defaultNormalizeSettings,
}: CreateSettingsOptions<TSettings>) {
  const settingsContext =
    createContext<SettingsContextValue<TSettings> | null>(null);

  function SettingsProvider({ children }: SettingsProviderProps) {
    const [settings, setSettingsState] = useState<TSettings>(() =>
      storageKey
        ? readStoredSettings(storageKey, defaultSettings, normalize)
        : defaultSettings,
    );

    const value = useMemo<SettingsContextValue<TSettings>>(() => {
      const commit = (nextSettings: TSettings) => {
        setSettingsState(nextSettings);

        if (storageKey && typeof window !== "undefined") {
          window.localStorage.setItem(storageKey, JSON.stringify(nextSettings));
        }
      };

      return {
        settings,
        setSettings: (nextSettings) => {
          const resolvedSettings =
            typeof nextSettings === "function"
              ? (nextSettings as (current: TSettings) => TSettings)(settings)
              : nextSettings;

          commit(resolvedSettings);
        },
        update: (key, value) => {
          commit({ ...settings, [key]: value });
        },
        patch: (partialSettings) => {
          commit({ ...settings, ...partialSettings });
        },
        reset: () => {
          commit(defaultSettings);
        },
      };
    }, [defaultSettings, settings, storageKey]);

    return createElement(
      settingsContext.Provider,
      { value },
      createElement("div", { style: getStyle?.(settings) }, children),
    );
  }

  function useSettings() {
    const value = useContext(settingsContext);

    if (!value) {
      throw new Error("useSettings must be used inside SettingsProvider");
    }

    return value;
  }

  return {
    SettingsProvider,
    useSettings,
  };
}

function readStoredSettings<TSettings extends object>(
  storageKey: string,
  defaultSettings: TSettings,
  normalize: SettingsNormalizer<TSettings>,
) {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return defaultSettings;
    }

    return normalize(JSON.parse(raw) as Partial<TSettings>, defaultSettings);
  } catch {
    return defaultSettings;
  }
}

function defaultNormalizeSettings<TSettings extends object>(
  storedSettings: Partial<TSettings>,
  defaultSettings: TSettings,
) {
  return {
    ...defaultSettings,
    ...storedSettings,
  };
}
