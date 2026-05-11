// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  computeResetDate,
  isUsageStale,
  incrementUsage,
  getUsageForModel,
  getUsageMap,
  resetUsage,
  type UsageData,
} from "../../src/services/usageCounter";
import type { ModelInfo } from "../../src/constants/config";

const TEST_MODELS: ModelInfo[] = [
  { id: "model-a", label: "Model A", rpd: 500 },
  { id: "model-b", label: "Model B", rpd: 20 },
];

function createMockStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
}

describe("computeResetDate", () => {
  it("returns today's date when EDT hour >= 3", () => {
    const now = new Date("2025-05-10T15:00:00-04:00");
    const result = computeResetDate(now);
    expect(result).toBe("2025-05-10");
  });

  it("returns yesterday's date when EDT hour < 3", () => {
    const now = new Date("2025-05-10T02:59:00-04:00");
    const result = computeResetDate(now);
    expect(result).toBe("2025-05-09");
  });

  it("handles midnight EDT correctly", () => {
    const now = new Date("2025-05-10T00:00:00-04:00");
    const result = computeResetDate(now);
    expect(result).toBe("2025-05-09");
  });

  it("handles exactly 3 AM EDT", () => {
    const now = new Date("2025-05-10T03:00:00-04:00");
    const result = computeResetDate(now);
    expect(result).toBe("2025-05-10");
  });
});

describe("isUsageStale", () => {
  it("returns false for same reset date", () => {
    const now = new Date("2025-05-10T15:00:00-04:00");
    const data: UsageData = { resetDate: computeResetDate(now), counts: {} };
    expect(isUsageStale(data, now)).toBe(false);
  });

  it("returns true for different reset date", () => {
    const now = new Date("2025-05-10T15:00:00-04:00");
    const data: UsageData = { resetDate: "2025-05-08", counts: {} };
    expect(isUsageStale(data, now)).toBe(true);
  });
});

describe("loadUsage / incrementUsage", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = createMockStorage();
    vi.stubGlobal("localStorage", storage);
  });

  it("returns empty counts on first load", async () => {
    const { loadUsage } = await import("../../src/services/usageCounter");
    const data = loadUsage();
    expect(data.counts).toEqual({});
    expect(data.resetDate).toBeTruthy();
  });

  it("increments usage for a model", async () => {
    const { incrementUsage } = await import("../../src/services/usageCounter");
    const data = incrementUsage("model-a");
    expect(data.counts["model-a"]).toBe(1);

    const data2 = incrementUsage("model-a");
    expect(data2.counts["model-a"]).toBe(2);
  });

  it("persists to storage", async () => {
    const { incrementUsage, loadUsage } = await import("../../src/services/usageCounter");
    incrementUsage("model-a");
    incrementUsage("model-a");
    incrementUsage("model-b");

    const loaded = loadUsage();
    expect(loaded.counts["model-a"]).toBe(2);
    expect(loaded.counts["model-b"]).toBe(1);
  });

  it("resets stale data on load", async () => {
    const stale: UsageData = { resetDate: "2020-01-01", counts: { "model-a": 100 } };
    storage.setItem("open-transcribe-usage", JSON.stringify(stale));

    const { loadUsage } = await import("../../src/services/usageCounter");
    const data = loadUsage();
    expect(data.counts["model-a"]).toBeUndefined();
  });
});

describe("getUsageForModel", () => {
  it("returns 0 for unused model", () => {
    expect(getUsageForModel("model-a", { resetDate: "2025-05-10", counts: {} })).toBe(0);
  });

  it("returns count for used model", () => {
    expect(
      getUsageForModel("model-a", { resetDate: "2025-05-10", counts: { "model-a": 5 } })
    ).toBe(5);
  });
});

describe("getUsageMap", () => {
  it("returns map with used/limit for each model", () => {
    const data: UsageData = { resetDate: "2025-05-10", counts: { "model-a": 10 } };
    const map = getUsageMap(TEST_MODELS, data);

    expect(map.get("model-a")).toEqual({ used: 10, limit: 500 });
    expect(map.get("model-b")).toEqual({ used: 0, limit: 20 });
  });
});

describe("resetUsage", () => {
  it("clears all counts", () => {
    incrementUsage("model-a");
    incrementUsage("model-b");

    const fresh = resetUsage();
    expect(fresh.counts).toEqual({});
    expect(fresh.resetDate).toBeTruthy();
  });
});
