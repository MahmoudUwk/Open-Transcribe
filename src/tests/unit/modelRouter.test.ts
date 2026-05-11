import { describe, it, expect } from "vitest";
import { createRouter, isRetryableError } from "../../src/services/modelRouter";
import type { ModelInfo } from "../../src/constants/config";

const TEST_MODELS: ModelInfo[] = [
  { id: "model-a", label: "Model A", rpd: 500 },
  { id: "model-b", label: "Model B", rpd: 20 },
];

describe("createRouter", () => {
  it("starts with first model active", () => {
    const router = createRouter(TEST_MODELS);
    expect(router.current().id).toBe("model-a");

    const state = router.getState();
    expect(state.currentIndex).toBe(0);
    expect(state.entries[0].status).toBe("active");
    expect(state.entries[1].status).toBe("available");
  });

  it("advance moves to next available model", () => {
    const router = createRouter(TEST_MODELS);
    const next = router.advance("rate limited");

    expect(next).not.toBeNull();
    expect(next!.id).toBe("model-b");

    const state = router.getState();
    expect(state.currentIndex).toBe(1);
    expect(state.entries[0].status).toBe("failed");
    expect(state.entries[1].status).toBe("active");
    expect(state.lastError).toBe("rate limited");
    expect(state.lastFailedModel).toBe("model-a");
    expect(state.attempts).toBe(1);
  });

  it("advance returns null when all models are exhausted", () => {
    const router = createRouter(TEST_MODELS);
    router.advance("error 1");
    const result = router.advance("error 2");

    expect(result).toBeNull();

    const state = router.getState();
    expect(state.entries.every((e) => e.status === "failed")).toBe(true);
    expect(state.attempts).toBe(2);
  });

  it("does not infinite loop when all models fail", () => {
    const router = createRouter(TEST_MODELS);
    const first = router.advance("error 1");
    const second = router.advance("error 2");

    expect(first).not.toBeNull();
    expect(second).toBeNull();

    const third = router.advance("should still be null");
    expect(third).toBeNull();
  });

  it("reset restores router to initial state", () => {
    const router = createRouter(TEST_MODELS);
    router.advance("error");
    router.reset();

    expect(router.current().id).toBe("model-a");
    const state = router.getState();
    expect(state.entries[0].status).toBe("active");
    expect(state.entries[1].status).toBe("available");
    expect(state.lastError).toBeNull();
    expect(state.lastFailedModel).toBeNull();
    expect(state.attempts).toBe(0);
  });

  it("getState reflects current model as active and others as available", () => {
    const router = createRouter(TEST_MODELS);
    const state = router.getState();

    expect(state.entries[0].status).toBe("active");
    expect(state.entries[1].status).toBe("available");
  });

  it("works with a single model pool", () => {
    const single: ModelInfo[] = [{ id: "only", label: "Only", rpd: 100 }];
    const router = createRouter(single);

    expect(router.current().id).toBe("only");

    const result = router.advance("failed");
    expect(result).toBeNull();

    const state = router.getState();
    expect(state.entries[0].status).toBe("failed");
  });
});

describe("isRetryableError", () => {
  it("detects 429 errors", () => {
    expect(isRetryableError(new Error("Got 429 rate limit"))).toBe(true);
  });

  it("detects 503 errors", () => {
    expect(isRetryableError(new Error("503 Service Unavailable"))).toBe(true);
  });

  it("detects rate limit messages", () => {
    expect(isRetryableError(new Error("Rate limit exceeded"))).toBe(true);
    expect(isRetryableError(new Error("Quota exceeded for quota metric"))).toBe(true);
    expect(isRetryableError(new Error("too many requests"))).toBe(true);
    expect(isRetryableError(new Error("Resource has been exhausted (high demand)"))).toBe(true);
    expect(isRetryableError(new Error("Service overloaded"))).toBe(true);
  });

  it("rejects non-retryable errors", () => {
    expect(isRetryableError(new Error("400 Bad Request"))).toBe(false);
    expect(isRetryableError(new Error("401 Unauthorized"))).toBe(false);
    expect(isRetryableError(new Error("403 Forbidden"))).toBe(false);
    expect(isRetryableError(new Error("Invalid API key"))).toBe(false);
  });

  it("handles non-Error values", () => {
    expect(isRetryableError("some string")).toBe(false);
    expect(isRetryableError(null)).toBe(false);
    expect(isRetryableError(undefined)).toBe(false);
    expect(isRetryableError(429)).toBe(false);
  });
});
