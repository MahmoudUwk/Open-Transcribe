import type { ModelInfo } from "../constants/config";

export type RouterStatus = "active" | "available" | "failed";

export type RouterEntry = ModelInfo & {
  status: RouterStatus;
};

export type RouterState = {
  entries: RouterEntry[];
  currentIndex: number;
  lastError: string | null;
  lastFailedModel: string | null;
  attempts: number;
};

export function createRouter(models: ModelInfo[]): {
  getState: () => RouterState;
  current: () => ModelInfo;
  advance: (reason: string) => ModelInfo | null;
  reset: () => void;
} {
  let entries: RouterEntry[] = models.map((m) => ({ ...m, status: "active" as RouterStatus }));
  let currentIndex = 0;
  let lastError: string | null = null;
  let lastFailedModel: string | null = null;
  let attempts = 0;

  function getState(): RouterState {
    const allFailed = entries.every((e) => e.status === "failed");
    return {
      entries: entries.map((e, i) => ({
        ...e,
        status: allFailed
          ? "failed"
          : i === currentIndex
            ? "active"
            : e.status === "failed"
              ? "failed"
              : "available",
      })),
      currentIndex,
      lastError,
      lastFailedModel,
      attempts,
    };
  }

  function current(): ModelInfo {
    return entries[currentIndex];
  }

  function advance(reason: string): ModelInfo | null {
    const failedId = entries[currentIndex].id;
    entries[currentIndex].status = "failed";
    lastFailedModel = failedId;
    lastError = reason;
    attempts++;

    const allFailed = entries.every((e) => e.status === "failed");
    if (allFailed) {
      return null;
    }

    for (let i = 1; i <= entries.length; i++) {
      const next = (currentIndex + i) % entries.length;
      if (entries[next].status !== "failed") {
        currentIndex = next;
        entries[currentIndex].status = "active";
        return entries[currentIndex];
      }
    }

    return null;
  }

  function reset(): void {
    entries = models.map((m) => ({ ...m, status: "active" as RouterStatus }));
    currentIndex = 0;
    lastError = null;
    lastFailedModel = null;
    attempts = 0;
  }

  return { getState, current, advance, reset };
}

export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("rate") ||
    msg.includes("quota") ||
    msg.includes("503") ||
    msg.includes("overloaded") ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("too many requests")
  );
}
