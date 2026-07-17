import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { i18n } from "../../lib/i18n";

export type ThemePreference = "dark" | "light" | "system";
export type AppPreferences = {
  birthdayVisibility: boolean;
  dashboardCompact: boolean;
  language: "es" | "en";
  notifyApprovals: boolean;
  notifyBirthdays: boolean;
  notifyRequests: boolean;
  theme: ThemePreference;
};

const STORAGE_KEY = "xignis.preferences:v1";
const defaults: AppPreferences = { birthdayVisibility: true, dashboardCompact: false, language: "es", notifyApprovals: true, notifyBirthdays: true, notifyRequests: true, theme: "system" };
type Value = { preferences: AppPreferences; updatePreferences: (patch: Partial<AppPreferences>) => void };
const PreferencesContext = createContext<Value | null>(null);

function readPreferences() {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") } as AppPreferences; } catch { return defaults; }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AppPreferences>(readPreferences);
  const updatePreferences = (patch: Partial<AppPreferences>) => setPreferences((current) => ({ ...current, ...patch }));
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); }, [preferences]);
  useEffect(() => { void i18n.changeLanguage(preferences.language); }, [preferences.language]);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => { const dark = preferences.theme === "dark" || (preferences.theme === "system" && media.matches); document.documentElement.dataset.theme = dark ? "dark" : "light"; document.documentElement.style.colorScheme = dark ? "dark" : "light"; };
    apply(); media.addEventListener("change", apply); return () => media.removeEventListener("change", apply);
  }, [preferences.theme]);
  const value = useMemo(() => ({ preferences, updatePreferences }), [preferences]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
export function usePreferences() { const value = useContext(PreferencesContext); if (!value) throw new Error("usePreferences debe usarse dentro de PreferencesProvider."); return value; }
