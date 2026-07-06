import { describe, it, expect } from "vitest";
import {
  TranscriptionError,
  classifyError,
  type TranscriptionErrorKind,
} from "../../src/services/transcriptionClient";

/**
 * Mimics the @google/genai SDK's ApiError: `name === "ApiError"`,
 * `status` = HTTP code, `message` = JSON.stringify(googleErrorBody).
 */
function apiError(httpStatus: number, body: unknown): Error {
  const err = new Error(JSON.stringify(body));
  err.name = "ApiError";
  Object.defineProperty(err, "status", { value: httpStatus, enumerable: true });
  return err;
}

describe("classifyError — API key (the originally reported error)", () => {
  it("classifies API_KEY_INVALID with INVALID_ARGUMENT status as api-key-invalid", () => {
    // Exact shape reported by the user
    const err = apiError(400, {
      error: {
        code: 400,
        message: "API key not valid. Please pass a valid API key.",
        status: "INVALID_ARGUMENT",
        details: [
          {
            "@type": "type.googleapis.com/google.rpc.ErrorInfo",
            reason: "API_KEY_INVALID",
            domain: "googleapis.com",
            metadata: { service: "generativelanguage.googleapis.com" },
          },
          {
            "@type": "type.googleapis.com/google.rpc.LocalizedMessage",
            locale: "en-US",
            message: "API key not valid. Please pass a valid API key.",
          },
        ],
      },
    });

    const result = classifyError(err);
    expect(result.kind).toBe("api-key-invalid");
    expect(result.retryable).toBe(false);
    expect(result.message).toMatch(/api key/i);
    expect(result.message).toMatch(/aistudio\.google\.com|ai studio/i);
  });

  it("detects dormant-blocked key wording", () => {
    const err = apiError(400, {
      error: {
        code: 400,
        message: "API key has been blocked because it was dormant.",
        status: "INVALID_ARGUMENT",
        details: [{ reason: "API_KEY_INVALID" }],
      },
    });
    expect(classifyError(err).kind).toBe("api-key-invalid");
    expect(classifyError(err).message).toMatch(/blocked|dormant/i);
  });

  it("classifies plain 'API key not valid' string errors (no JSON)", () => {
    const err = new Error("API key not valid. Please pass a valid API key.");
    expect(classifyError(err).kind).toBe("api-key-invalid");
  });
});

describe("classifyError — permission", () => {
  it("classifies 403 PERMISSION_DENIED", () => {
    const err = apiError(403, {
      error: { code: 403, status: "PERMISSION_DENIED", message: "not authorized" },
    });
    expect(classifyError(err).kind).toBe("api-key-permission");
  });
});

describe("classifyError — rate limiting (retryable across model pool)", () => {
  it("classifies 429 RESOURCE_EXHAUSTED as retryable", () => {
    const err = apiError(429, {
      error: { code: 429, status: "RESOURCE_EXHAUSTED", message: "Quota exceeded" },
    });
    const r = classifyError(err);
    expect(r.kind).toBe("rate-limited");
    expect(r.retryable).toBe(true);
  });

  it("classifies legacy plain-text 429 errors (router compat)", () => {
    expect(classifyError(new Error("429 rate limit exceeded")).kind).toBe("rate-limited");
    expect(classifyError(new Error("Rate limit exceeded")).retryable).toBe(true);
  });
});

describe("classifyError — model / payload / safety", () => {
  it("classifies 404 NOT_FOUND as model-not-found", () => {
    const err = apiError(404, {
      error: { code: 404, status: "NOT_FOUND", message: "model not found" },
    });
    expect(classifyError(err).kind).toBe("model-not-found");
  });

  it("classifies 413 as request-too-large", () => {
    const err = apiError(413, {
      error: { code: 413, status: "FAILED_PRECONDITION", message: "request too large" },
    });
    expect(classifyError(err).kind).toBe("request-too-large");
  });

  it("classifies SAFETY status", () => {
    const err = apiError(400, {
      error: { code: 400, status: "SAFETY", message: "blocked for safety" },
    });
    expect(classifyError(err).kind).toBe("safety-blocked");
  });
});

describe("classifyError — network / server", () => {
  it("classifies TypeError 'Failed to fetch' as network (retryable)", () => {
    const err = new TypeError("Failed to fetch");
    const r = classifyError(err);
    expect(r.kind).toBe("network");
    expect(r.retryable).toBe(true);
  });

  it("classifies 503 UNAVAILABLE as server (retryable)", () => {
    const err = apiError(503, {
      error: { code: 503, status: "UNAVAILABLE", message: "overloaded" },
    });
    const r = classifyError(err);
    expect(r.kind).toBe("server");
    expect(r.retryable).toBe(true);
  });
});

describe("classifyError — unknown", () => {
  it("falls back to unknown for unstructured errors", () => {
    const r = classifyError(new Error("something weird"));
    expect(r.kind).toBe("unknown");
    expect(r.retryable).toBe(false);
  });

  it("handles non-Error throws", () => {
    const r = classifyError({ random: "object" });
    expect(r.kind).toBe("unknown");
  });
});

describe("TranscriptionError carries kind", () => {
  it("exposes kind and technical fields", () => {
    const err = new TranscriptionError("boom", {
      kind: "api-key-invalid" as TranscriptionErrorKind,
      technical: "raw detail",
    });
    expect(err.kind).toBe("api-key-invalid");
    expect(err.technical).toBe("raw detail");
    expect(err.name).toBe("TranscriptionError");
    expect(err).toBeInstanceOf(Error);
  });

  it("defaults kind to unknown when not provided", () => {
    const err = new TranscriptionError("boom");
    expect(err.kind).toBe("unknown");
    expect(err.technical).toBeUndefined();
  });
});
