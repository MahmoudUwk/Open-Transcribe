import type { RecordingResult } from "./audioRecorder";
import type { ModelInfo } from "../constants/config";
import { createRouter, type RouterState } from "./modelRouter";
import type { ThinkingLevel as SdkThinkingLevel } from "@google/genai";

export type ThinkingLevel = "low" | "medium" | "high";

export type TranscriptionOptions = {
  apiKey: string;
  prompt: string;
  modelPool: ModelInfo[];
  onRouterChange?: (state: RouterState) => void;
  /**
   * When set, enables Gemini's reasoning/thinking at the given level and
   * reorders the model pool to try thinking-capable models first.
   * Used by Meeting Notes to force internal transcription before output.
   */
  thinking?: ThinkingLevel;
};

export type TranscriptionResult = {
  text: string;
  modelUsed: string;
  attempts: number;
};

/**
 * High-level, UI-actionable error categories.
 * Derived from the runtime shape of @google/genai's ApiError, whose `message`
 * is JSON.stringify(errorBody) and whose `status` is the HTTP status code.
 */
export type TranscriptionErrorKind =
  | "api-key-invalid" // 400 INVALID_ARGUMENT + reason API_KEY_INVALID (the original reported error)
  | "api-key-permission" // 403 PERMISSION_DENIED
  | "rate-limited" // 429 / RESOURCE_EXHAUSTED (retryable across model pool)
  | "model-not-found" // 404 / NOT_FOUND (model name wrong)
  | "request-too-large" // 413 payload too large
  | "safety-blocked" // finishReason SAFETY / PROHIBITED_CONTENT
  | "network" // fetch failed, offline, CORS, DNS
  | "server" // 500 / 503 (retryable)
  | "unknown";

export type ClassifiedError = {
  kind: TranscriptionErrorKind;
  message: string;
  retryable: boolean;
  technical: string;
};

export class TranscriptionError extends Error {
  readonly kind: TranscriptionErrorKind;
  readonly technical: string | undefined;
  constructor(
    message: string,
    options?: { kind?: TranscriptionErrorKind; technical?: string }
  ) {
    super(message);
    this.name = "TranscriptionError";
    this.kind = options?.kind ?? "unknown";
    this.technical = options?.technical;
  }
}

type GoogleErrorBody = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: Array<{
      "@type"?: string;
      reason?: string;
      domain?: string;
      metadata?: Record<string, string>;
    }>;
  };
};

/**
 * Inspect an error thrown by the Gemini SDK and return a structured kind.
 *
 * The SDK throws `ApiError` (name === "ApiError") with:
 *   - `status`: HTTP status code (number)
 *   - `message`: JSON.stringify(googleErrorBody)
 *
 * For non-SDK errors (network, plain Error), we fall back to string inspection.
 */
export function classifyError(error: unknown): ClassifiedError {
  const technical = toTechnicalString(error);

  if (!(error instanceof Error)) {
    return { kind: "unknown", message: technical, retryable: false, technical };
  }

  const httpStatus = readHttpStatus(error);

  const body = tryParseGoogleErrorBody(error.message);
  const gStatus = body?.error?.status?.toUpperCase();
  const reasons = (body?.error?.details ?? [])
    .map((d) => d.reason)
    .filter((r): r is string => typeof r === "string")
    .map((r) => r.toUpperCase());
  const text = (body?.error?.message ?? error.message ?? "").toLowerCase();

  // 1. API key invalid / dormant-blocked (the originally reported error)
  if (
    reasons.includes("API_KEY_INVALID") ||
    gStatus === "INVALID_ARGUMENT" && (text.includes("api key") || text.includes("api_key")) ||
    text.includes("api key not valid") ||
    text.includes("api_key_invalid")
  ) {
    // Distinguish "dormant blocked" (since May 7 2026) from plain invalid
    const dormant =
      text.includes("blocked") ||
      text.includes("dormant") ||
      text.includes("has been blocked");
    return {
      kind: "api-key-invalid",
      message: dormant
        ? "Your API key has been blocked by Google (likely dormant). Create a new one in Google AI Studio."
        : "Your Gemini API key is invalid or restricted. Create a fresh key in Google AI Studio.",
      retryable: false,
      technical,
    };
  }

  // 2. Permission denied
  if (httpStatus === 403 || gStatus === "PERMISSION_DENIED") {
    return {
      kind: "api-key-permission",
      message: "Your API key doesn't have permission to use this model. Check your Google AI Studio project.",
      retryable: false,
      technical,
    };
  }

  // 3. Rate limited / quota
  if (
    httpStatus === 429 ||
    gStatus === "RESOURCE_EXHAUSTED" ||
    /\b429\b|rate\s*limit|quota|too many requests|resource_exhausted/.test(text)
  ) {
    return {
      kind: "rate-limited",
      message: "Daily quota or rate limit reached for this model.",
      retryable: true,
      technical,
    };
  }

  // 4. Model not found
  if (
    httpStatus === 404 ||
    gStatus === "NOT_FOUND" ||
    text.includes("model not found") ||
    text.includes("not found") && text.includes("model")
  ) {
    return {
      kind: "model-not-found",
      message: "The model name is not available. Update the app or pick another.",
      retryable: false,
      technical,
    };
  }

  // 5. Request too large
  if (httpStatus === 413 || gStatus === "FAILED_PRECONDITION" && text.includes("too large")) {
    return {
      kind: "request-too-large",
      message: "The audio file is too large to send in one request.",
      retryable: false,
      technical,
    };
  }

  // 6. Safety blocked
  if (
    gStatus === "SAFETY" ||
    /\b(safety|prohibited_content|blocked)\b/.test(text)
  ) {
    return {
      kind: "safety-blocked",
      message: "The model blocked the response for safety reasons.",
      retryable: false,
      technical,
    };
  }

  // 7. Network (fetch failed, CORS, offline)
  if (
    error.name === "TypeError" ||
    text.includes("failed to fetch") ||
    text.includes("networkerror") ||
    text.includes("load failed")
  ) {
    return {
      kind: "network",
      message: "Couldn't reach Google's servers. Check your internet connection.",
      retryable: true,
      technical,
    };
  }

  // 8. Server-side (5xx, 503 overloaded)
  if (
    (httpStatus !== undefined && httpStatus >= 500) ||
    gStatus === "UNAVAILABLE" ||
    /\b(503|500|overloaded|internal error|unavailable)\b/.test(text)
  ) {
    return {
      kind: "server",
      message: "Google's servers are temporarily unavailable. Try again shortly.",
      retryable: true,
      technical,
    };
  }

  return { kind: "unknown", message: error.message || technical, retryable: false, technical };
}

/** Backwards-compatible predicate used by the model router loop. */
export function isRetryableError(error: unknown): boolean {
  return classifyError(error).retryable;
}

function tryParseGoogleErrorBody(message: string): GoogleErrorBody | null {
  if (!message) return null;
  // SDK sets message = JSON.stringify(body). Streaming errors prepend
  // "got status: X. " before the JSON — handle both.
  const jsonStart = message.indexOf("{");
  if (jsonStart === -1) return null;
  const candidate = message.slice(jsonStart);
  try {
    return JSON.parse(candidate) as GoogleErrorBody;
  } catch {
    return null;
  }
}

/** Extract the HTTP status code the SDK attaches to ApiError instances. */
function readHttpStatus(error: Error): number | undefined {
  const status = (error as unknown as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

function toTechnicalString(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export async function transcribeRecording(
  recording: RecordingResult,
  options: TranscriptionOptions
): Promise<TranscriptionResult> {
  const { apiKey, prompt, modelPool, onRouterChange, thinking } = options;

  if (!apiKey) {
    throw new TranscriptionError("A Gemini API key is required", {
      kind: "api-key-invalid",
    });
  }

  // When thinking is requested, try thinking-capable models first so the
  // reasoning-driven flow (e.g. internal transcription for meeting notes) runs
  // on a model that actually supports it. Flash-Lite variants can't think.
  const orderedPool = thinking
    ? [...modelPool].sort((a, b) => {
        const aCap = a.thinkingCapable ? 1 : 0;
        const bCap = b.thinkingCapable ? 1 : 0;
        return bCap - aCap;
      })
    : modelPool;
  const router = createRouter(orderedPool);
  const notify = () => onRouterChange?.(router.getState());

  const mimeType = recording.format || recording.blob.type || "audio/webm";
  const promptText = prompt?.trim() || "Provide a transcript of this audio clip.";

  const { GoogleGenAI, ThinkingLevel: SdkThinkingLevelValue } = await import("@google/genai");
  const client = new GoogleGenAI({ apiKey });

  // Map our lowercase preset values to the SDK's enum (Gemini 3 models use
  // thinkingLevel; the enum's string values are the uppercase API values).
  const thinkingLevelByPreset: Record<ThinkingLevel, SdkThinkingLevel> = {
    low: SdkThinkingLevelValue.LOW,
    medium: SdkThinkingLevelValue.MEDIUM,
    high: SdkThinkingLevelValue.HIGH,
  };

  // Threshold of 20 MB. Files larger than this will be uploaded via the Files API
  // to avoid V8 string allocation limits (allocation size overflow) and Gemini's 20MB payload limit.
  const UPLOAD_THRESHOLD = 20 * 1024 * 1024;
  const isLargeFile = recording.blob.size > UPLOAD_THRESHOLD;

  let contents: Array<
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
    | { fileData: { fileUri: string; mimeType: string } }
  >;
  let uploadedFile: { uri: string; mimeType: string; name: string } | null = null;

  try {
    if (isLargeFile) {
      try {
        const fileName = recording.blob instanceof File
          ? recording.blob.name
          : `audio.${mimeType.split("/")[1] || "webm"}`;

        const fileToUpload = new File([recording.blob], fileName, { type: mimeType });

        const uploaded = await client.files.upload({
          file: fileToUpload,
          config: { mimeType },
        });

        // The SDK types mark these as optional, but for a successful upload
        // they are always present. Validate to give a clear error if not.
        if (!uploaded.uri || !uploaded.name) {
          throw new Error("Upload succeeded but the file URI/name was missing in the response.");
        }
        uploadedFile = {
          uri: uploaded.uri,
          mimeType: uploaded.mimeType ?? mimeType,
          name: uploaded.name,
        };

        contents = [
          { text: promptText },
          {
            fileData: {
              fileUri: uploadedFile.uri,
              mimeType: uploadedFile.mimeType,
            },
          },
        ];
      } catch (error) {
        const classified = classifyError(error);
        throw new TranscriptionError(
          `Failed to upload audio file: ${classified.message}`,
          { kind: classified.kind, technical: classified.technical }
        );
      }
    } else {
      let audioBase64: string;
      try {
        audioBase64 = await blobToBase64(recording.blob);
      } catch (error) {
        const classified = classifyError(error);
        throw new TranscriptionError(
          `Failed to prepare recording for Gemini: ${classified.message}`,
          { kind: classified.kind, technical: classified.technical }
        );
      }
      contents = [
        { text: promptText },
        { inlineData: { mimeType, data: audioBase64 } },
      ];
    }

    notify();

    const errors: string[] = [];
    let triedAll = false;

    // Gemini 3 models use thinkingLevel; pass it only when requested so
    // non-thinking presets aren't affected. Note: the model errors if both
    // thinkingLevel and thinkingBudget are set, so we never set both.
    const generateConfig = thinking
      ? { thinkingConfig: { thinkingLevel: thinkingLevelByPreset[thinking] } }
      : undefined;

    while (!triedAll) {
      const model = router.current();
      const state = router.getState();

      try {
        const response = await client.models.generateContent(
          generateConfig
            ? { model: model.id, contents, config: generateConfig }
            : { model: model.id, contents }
        );
        const text = response.text ?? extractTextFromResponseSync(response);

        if (!text) {
          throw new TranscriptionError(`No transcript returned from ${model.label}`);
        }

        return {
          text,
          modelUsed: model.id,
          attempts: state.attempts + 1,
        };
      } catch (error) {
        const classified = classifyError(error);
        errors.push(`${model.label}: ${classified.message}`);

        if (classified.retryable) {
          const next = router.advance(classified.message);
          notify();
          if (!next) {
            triedAll = true;
          }
        } else {
          throw new TranscriptionError(classified.message, {
            kind: classified.kind,
            technical: classified.technical,
          });
        }
      }
    }

    throw new TranscriptionError(
      `All models exhausted. ${errors.join(" | ")}`,
      { kind: "rate-limited" }
    );
  } finally {
    if (uploadedFile) {
      try {
        await client.files.delete({ name: uploadedFile.name });
      } catch (deleteError) {
        console.warn("Failed to delete temporary audio file:", deleteError);
      }
    }
  }
}

type GenerateContentResponse = {
  text?: string;
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

function extractTextFromResponseSync(response: GenerateContentResponse): string | undefined {
  if (!response) return undefined;

  if (typeof response.text === "string" && response.text.trim()) {
    return response.text.trim();
  }

  for (const candidate of response.candidates ?? []) {
    for (const part of candidate?.content?.parts ?? []) {
      if (typeof part?.text === "string" && part.text.trim()) {
        return part.text.trim();
      }
    }
  }

  return undefined;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // result is "data:audio/webm;base64,..."
      const base64 = result.split(",")[1];
      if (base64) {
        resolve(base64);
      } else {
        reject(new Error("Failed to extract base64 from audio data"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
