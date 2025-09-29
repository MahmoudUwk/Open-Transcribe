import { invoke } from "@tauri-apps/api/tauri";

export type Preferences = {
  model: string;
  prompt: string;
  apiKey: string;
};

export type PreferencesManager = {
  load: () => Promise<Preferences | null>;
  save: (preferences: Preferences) => Promise<void>;
};

const STORAGE_KEY = "open-transcribe.preferences";

function shouldFallback(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return error.message.includes("__TAURI_IPC__") || error.message.includes("tauri") || error.message.includes("IPC");
}

function loadFromLocalStorage(): Preferences | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Preferences;
    return parsed;
  } catch {
    return null;
  }
}

function saveToLocalStorage(preferences: Preferences): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // ignore
  }
}

export async function loadPreferences(): Promise<Preferences | null> {
  try {
    const result = await invoke<Preferences | null>("load_preferences");
    if (result) {
      return result;
    }
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error;
    }
  }
  return loadFromLocalStorage();
}

export async function savePreferences(preferences: Preferences): Promise<void> {
  try {
    await invoke("save_preferences", { preferences });
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error;
    }
  }
  saveToLocalStorage(preferences);
}

export function createPreferencesManager(): PreferencesManager {
  return {
    load: loadPreferences,
    save: savePreferences,
  };
}
