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
  return loadFromLocalStorage();
}

export async function savePreferences(preferences: Preferences): Promise<void> {
  saveToLocalStorage(preferences);
}

export function createPreferencesManager(): PreferencesManager {
  return {
    load: loadPreferences,
    save: savePreferences,
  };
}
