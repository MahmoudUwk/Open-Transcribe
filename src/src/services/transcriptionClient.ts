import type { RecordingResult } from "./audioRecorder";
import type { ModelInfo } from "../constants/config";
import { createRouter, isRetryableError, type RouterState } from "./modelRouter";

export type TranscriptionOptions = {
  apiKey: string;
  prompt: string;
  modelPool: ModelInfo[];
  onRouterChange?: (state: RouterState) => void;
};

export type TranscriptionResult = {
  text: string;
  modelUsed: string;
  attempts: number;
};

export class TranscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranscriptionError";
  }
}

export async function transcribeRecording(
  recording: RecordingResult,
  options: TranscriptionOptions
): Promise<TranscriptionResult> {
  const { apiKey, prompt, modelPool, onRouterChange } = options;

  if (!apiKey) {
    throw new TranscriptionError("A Gemini API key is required");
  }

  const router = createRouter(modelPool);
  const notify = () => onRouterChange?.(router.getState());

  let audioBase64: string;
  try {
    audioBase64 = await blobToBase64(recording.blob);
  } catch (error) {
    throw new TranscriptionError(
      error instanceof Error ? error.message : "Failed to prepare recording for Gemini"
    );
  }

  const mimeType = recording.format || recording.blob.type || "audio/webm";
  const promptText = prompt?.trim() || "Provide a transcript of this audio clip.";
  const contents = [
    { text: promptText },
    { inlineData: { mimeType, data: audioBase64 } },
  ];

  notify();

  const { GoogleGenAI } = await import("@google/genai");
  const client = new GoogleGenAI({ apiKey });

  const errors: string[] = [];
  let triedAll = false;

  while (!triedAll) {
    const model = router.current();
    const state = router.getState();

    try {
      const response = await client.models.generateContent({ model: model.id, contents });
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
      const msg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`${model.label}: ${msg}`);

      if (isRetryableError(error)) {
        const next = router.advance(msg);
        notify();
        if (!next) {
          triedAll = true;
        }
      } else {
        throw new TranscriptionError(msg);
      }
    }
  }

  throw new TranscriptionError(
    `All models exhausted.\n${errors.join("\n")}`
  );
}

function extractTextFromResponseSync(response: any): string | undefined {
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
  const arrayBuffer = await blob.arrayBuffer();

  if (typeof Buffer !== "undefined") {
    return Buffer.from(arrayBuffer).toString("base64");
  }

  let binary = "";
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  if (typeof btoa === "function") {
    return btoa(binary);
  }
  throw new Error("Unable to convert audio to base64");
}
