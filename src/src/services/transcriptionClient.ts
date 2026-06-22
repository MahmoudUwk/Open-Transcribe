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

  const mimeType = recording.format || recording.blob.type || "audio/webm";
  const promptText = prompt?.trim() || "Provide a transcript of this audio clip.";

  const { GoogleGenAI } = await import("@google/genai");
  const client = new GoogleGenAI({ apiKey });

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
        const fileToUpload = recording.blob instanceof File
          ? recording.blob
          : new File([recording.blob], `audio.${mimeType.split("/")[1] || "webm"}`, { type: mimeType });

        uploadedFile = await client.files.upload({
          file: fileToUpload,
          mimeType,
        });

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
        throw new TranscriptionError(
          error instanceof Error ? `Failed to upload audio file: ${error.message}` : "Failed to upload audio file"
        );
      }
    } else {
      let audioBase64: string;
      try {
        audioBase64 = await blobToBase64(recording.blob);
      } catch (error) {
        throw new TranscriptionError(
          error instanceof Error ? error.message : "Failed to prepare recording for Gemini"
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
