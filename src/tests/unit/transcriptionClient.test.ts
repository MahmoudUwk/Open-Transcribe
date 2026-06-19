import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TranscriptionError } from "../../src/services/transcriptionClient";
import type { RecordingResult } from "../../src/services/audioRecorder";
import type { ModelInfo } from "../../src/constants/config";

const TEST_MODELS: ModelInfo[] = [
  { id: "model-a", label: "Model A", rpd: 500 },
  { id: "model-b", label: "Model B", rpd: 20 },
];

function makeRecording(): RecordingResult {
  const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
  return {
    blob: new Blob([buffer], { type: "audio/webm" }),
    format: "audio/webm",
    durationMs: 5000,
  };
}

const mockResponses: { text?: string; error?: Error }[] = [];
const mockGenerateContent = vi.fn(async () => {
  const response = mockResponses.shift();
  if (!response) throw new Error("No mock response configured");
  if (response.error) throw response.error;
  return { text: response.text ?? "transcribed text" };
});

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = {
      generateContent: mockGenerateContent,
    };
  },
}));

describe("transcribeRecording", () => {
  let transcribeRecording: typeof import("../../src/services/transcriptionClient").transcribeRecording;

  beforeEach(async () => {
    mockResponses.length = 0;
    mockGenerateContent.mockClear();
    const mod = await import("../../src/services/transcriptionClient");
    transcribeRecording = mod.transcribeRecording;
  });

  it("throws if no API key provided", async () => {
    await expect(
      transcribeRecording(makeRecording(), {
        apiKey: "",
        prompt: "test",
        modelPool: TEST_MODELS,
      })
    ).rejects.toThrow(TranscriptionError);
  });

  it("returns transcription on first model success", async () => {
    mockResponses.push({ text: "Hello world" });

    const result = await transcribeRecording(makeRecording(), {
      apiKey: "test-key",
      prompt: "transcribe",
      modelPool: TEST_MODELS,
    });

    expect(result.text).toBe("Hello world");
    expect(result.modelUsed).toBe("model-a");
    expect(result.attempts).toBe(1);
  });

  it("falls back to second model on rate limit", async () => {
    mockResponses.push(
      { error: new Error("429 rate limit exceeded") },
      { text: "Hello from fallback" },
    );

    const result = await transcribeRecording(makeRecording(), {
      apiKey: "test-key",
      prompt: "transcribe",
      modelPool: TEST_MODELS,
    });

    expect(result.text).toBe("Hello from fallback");
    expect(result.modelUsed).toBe("model-b");
    expect(result.attempts).toBe(2);
  });

  it("throws TranscriptionError when all models exhaust", async () => {
    mockResponses.push(
      { error: new Error("429 rate limit") },
      { error: new Error("429 quota exceeded") },
    );

    await expect(
      transcribeRecording(makeRecording(), {
        apiKey: "test-key",
        prompt: "transcribe",
        modelPool: TEST_MODELS,
      })
    ).rejects.toThrow("All models exhausted");
  });

  it("does not retry on non-retryable errors", async () => {
    mockResponses.push({ error: new Error("401 Unauthorized") });

    await expect(
      transcribeRecording(makeRecording(), {
        apiKey: "test-key",
        prompt: "transcribe",
        modelPool: TEST_MODELS,
      })
    ).rejects.toThrow("401 Unauthorized");
  });

  it("calls onRouterChange callback", async () => {
    mockResponses.push({ text: "done" });

    const onRouterChange = vi.fn();
    await transcribeRecording(makeRecording(), {
      apiKey: "test-key",
      prompt: "transcribe",
      modelPool: TEST_MODELS,
      onRouterChange,
    });

    expect(onRouterChange).toHaveBeenCalled();
    const lastCall = onRouterChange.mock.calls.at(-1)![0];
    expect(lastCall.entries).toBeDefined();
  });

  it("uses default prompt when empty string provided", async () => {
    mockResponses.push({ text: "transcribed" });

    await transcribeRecording(makeRecording(), {
      apiKey: "test-key",
      prompt: "  ",
      modelPool: TEST_MODELS,
    });

    const calls = mockGenerateContent.mock.calls as Array<Array<{ contents: Array<{ text: string }> }>>;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0].contents[0].text).toBe("Provide a transcript of this audio clip.");
  });
});
