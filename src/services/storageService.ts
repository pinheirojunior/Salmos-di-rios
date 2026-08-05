import { Preferences } from "@capacitor/preferences";

/**
 * Unified Storage Service supporting Capacitor Preferences (Android/iOS)
 * and LocalStorage (Web) for data persistence across app updates and reboots.
 */
class StorageService {
  public async getItem(key: string): Promise<string | null> {
    try {
      // Primary: Capacitor Preferences
      const { value } = await Preferences.get({ key });
      if (value !== null) {
        return value;
      }
    } catch (e) {
      console.warn(`Capacitor Preferences get error for key [${key}], falling back to localStorage:`, e);
    }

    // Fallback: Web LocalStorage
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.error(`LocalStorage getItem error for key [${key}]:`, e);
      }
    }
    return null;
  }

  public getItemSync(key: string): string | null {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.error(`LocalStorage getItemSync error for key [${key}]:`, e);
      }
    }
    return null;
  }

  public async setItem(key: string, value: string): Promise<void> {
    // Write to both Capacitor Preferences and LocalStorage for max safety
    try {
      await Preferences.set({ key, value });
    } catch (e) {
      console.warn(`Capacitor Preferences set error for key [${key}]:`, e);
    }

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        console.error(`LocalStorage setItem error for key [${key}]:`, e);
      }
    }
  }

  public setItemSync(key: string, value: string): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        console.error(`LocalStorage setItemSync error for key [${key}]:`, e);
      }
    }
    Preferences.set({ key, value }).catch(() => {});
  }

  public async removeItem(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch (e) {
      console.warn(`Capacitor Preferences remove error for key [${key}]:`, e);
    }

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        console.error(`LocalStorage removeItem error for key [${key}]:`, e);
      }
    }
  }

  public async getJson<T>(key: string, defaultValue: T): Promise<T> {
    const raw = await this.getItem(key);
    if (!raw) return defaultValue;
    try {
      return JSON.parse(raw) as T;
    } catch (e) {
      console.error(`Failed to parse JSON for key [${key}]:`, e);
      return defaultValue;
    }
  }

  public getJsonSync<T>(key: string, defaultValue: T): T {
    const raw = this.getItemSync(key);
    if (!raw) return defaultValue;
    try {
      return JSON.parse(raw) as T;
    } catch (e) {
      console.error(`Failed to parse JSON sync for key [${key}]:`, e);
      return defaultValue;
    }
  }

  public async setJson<T>(key: string, value: T): Promise<void> {
    const jsonStr = JSON.stringify(value);
    await this.setItem(key, jsonStr);
  }
}

export const storageService = new StorageService();
