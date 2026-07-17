import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import type { SupportedStorage } from "@supabase/supabase-js";

const memory = new Map<string, string>();
const webStorage = typeof localStorage === "undefined" ? null : localStorage;

export const authStorage: SupportedStorage = {
  async getItem(key) { if (!Capacitor.isNativePlatform()) return webStorage?.getItem(key) ?? memory.get(key) ?? null; return (await Preferences.get({ key })).value; },
  async removeItem(key) { if (!Capacitor.isNativePlatform()) { webStorage?.removeItem(key); memory.delete(key); return; } await Preferences.remove({ key }); },
  async setItem(key, value) { if (!Capacitor.isNativePlatform()) { if (webStorage) webStorage.setItem(key, value); else memory.set(key, value); return; } await Preferences.set({ key, value }); },
};
