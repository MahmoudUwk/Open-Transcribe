import type { ModelInfo } from "../constants/config";

const STORAGE_KEY = "open-transcribe-usage";

export type UsageCounts = Record<string, number>;

export type UsageData = {
  resetDate: string;
  counts: UsageCounts;
};

export type UsageEntry = {
  used: number;
  limit: number;
};

function getEdtHour(now: Date = new Date()): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    hour12: false,
  });
  return parseInt(formatter.format(now), 10);
}

export function computeResetDate(now: Date = new Date()): string {
  const edtHour = getEdtHour(now);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;

  if (edtHour >= 3) {
    return `${year}-${month}-${day}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yParts = formatter.formatToParts(yesterday);
  const yYear = yParts.find((p) => p.type === "year")!.value;
  const yMonth = yParts.find((p) => p.type === "month")!.value;
  const yDay = yParts.find((p) => p.type === "day")!.value;
  return `${yYear}-${yMonth}-${yDay}`;
}

export function isUsageStale(data: UsageData, now: Date = new Date()): boolean {
  const currentResetDate = computeResetDate(now);
  return data.resetDate !== currentResetDate;
}

export function loadUsage(): UsageData {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return { resetDate: computeResetDate(), counts: {} };
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { resetDate: computeResetDate(), counts: {} };
    }
    const parsed: UsageData = JSON.parse(raw);
    if (isUsageStale(parsed)) {
      const fresh: UsageData = { resetDate: computeResetDate(), counts: {} };
      saveUsage(fresh);
      return fresh;
    }
    return parsed;
  } catch {
    return { resetDate: computeResetDate(), counts: {} };
  }
}

export function saveUsage(data: UsageData): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    return;
  }
}

export function incrementUsage(modelId: string): UsageData {
  const data = loadUsage();
  data.counts[modelId] = (data.counts[modelId] ?? 0) + 1;
  saveUsage(data);
  return data;
}

export function getUsageForModel(modelId: string, data: UsageData): number {
  return data.counts[modelId] ?? 0;
}

export function getUsageMap(pool: ModelInfo[], data: UsageData): Map<string, UsageEntry> {
  const map = new Map<string, UsageEntry>();
  for (const model of pool) {
    map.set(model.id, {
      used: data.counts[model.id] ?? 0,
      limit: model.rpd,
    });
  }
  return map;
}

export function resetUsage(): UsageData {
  const fresh: UsageData = { resetDate: computeResetDate(), counts: {} };
  saveUsage(fresh);
  return fresh;
}
