import type { RecordingResult } from "./audioRecorder";

export type TranscriptionOptions = {
  apiKey: string;
  model: string;
  prompt: string;
};

export type TranscriptionResult = {
  text: string;
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
  const { apiKey, model, prompt } = options;

  if (!apiKey) {
    throw new TranscriptionError("A Gemini API key is required");
  }

  const { GoogleGenAI } = await import("@google/genai");
  const client = new GoogleGenAI({ apiKey });

  let audioBase64: string;
  try {
    audioBase64 = await blobToBase64(recording.blob);
  } catch (error) {
    throw new TranscriptionError(
      error instanceof Error ? error.message : "Failed to prepare recording for Gemini"
    );
  }

  const mimeType = recording.format || recording.blob.type || "audio/webm";

  const promptText = prompt?.trim() ?? "";
  const contents = [
    {
      role: "user",
      parts: [
        {
          text: promptText.length > 0 ? promptText : "Provide a transcript of this audio clip.",
        },
        {
          inlineData: {
            mimeType,
            data: audioBase64,
          },
        },
      ],
    },
  ];

  let response: any;
  try {
    response = await client.models.generateContent({
      model,
      contents,
    });
  } catch (error) {
    throw new TranscriptionError(
      error instanceof Error ? error.message : "Gemini request failed"
    );
  }

  const text = await extractTextFromResponse(response);

  if (!text) {
    const debugMessage = summarizeResponseForDebug(response);
    if (typeof console !== "undefined") {
      console.warn("[transcription] Gemini returned no transcript", {
        response: safeDebugObject(response),
        summary: debugMessage,
      });
    }
    throw new TranscriptionError(
      `Gemini returned no transcript. ${debugMessage}`.trim()
    );
  }

  return { text };
}

async function extractTextFromResponse(response: any): Promise<string | undefined> {
  const resolveMaybeString = async (value: unknown): Promise<string | undefined> => {
    if (!value) {
      return undefined;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    if (typeof (value as Promise<unknown>)?.then === "function") {
      try {
        const resolved = await (value as Promise<unknown>);
        if (typeof resolved === "string") {
          const trimmed = resolved.trim();
          return trimmed.length > 0 ? trimmed : undefined;
        }
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  if (!response) {
    return undefined;
  }

  if (typeof response.text === "function") {
    const maybe = await resolveMaybeString(response.text());
    if (maybe) {
      return maybe;
    }
  }

  if (typeof response.response?.text === "function") {
    const maybe = await resolveMaybeString(response.response.text());
    if (maybe) {
      return maybe;
    }
  }

  const candidates =
    response.response?.candidates
      ?? response.candidates
      ?? [];

  for (const candidate of candidates) {
    const parts = candidate?.content?.parts ?? candidate?.parts ?? [];
    for (const part of parts) {
      if (typeof part?.text === "string") {
        const trimmed = part.text.trim();
        if (trimmed.length > 0) {
          return trimmed;
        }
      }
    }
  }

  return undefined;
}

function summarizeResponseForDebug(response: any): string {
  try {
    const candidates =
      response?.response?.candidates
        ?? response?.candidates
        ?? [];
    const candidateCount = Array.isArray(candidates) ? candidates.length : 0;
    const topParts = Array.isArray(candidates) && candidates.length > 0
      ? (candidates[0]?.content?.parts ?? candidates[0]?.parts ?? [])
          .map((part: any) => {
            if (typeof part?.text === "string") {
              return part.text.slice(0, 120);
            }
            if (part?.fileData) {
              return `[fileData:${part.fileData.mimeType ?? "unknown"}]`;
            }
            return `[part:${typeof part}]`;
          })
          .filter(Boolean)
          .slice(0, 3)
      : [];

    const snippet = topParts.length > 0 ? topParts.join(" | ") : "";
    return `Debug: candidates=${candidateCount}${snippet ? `, topParts=${snippet}` : ""}`;
  } catch (error) {
    return `Debug: unable to summarize response (${error instanceof Error ? error.message : "unknown error"})`;
  }
}

function safeDebugObject(value: unknown): unknown {
  try {
    return JSON.parse(
      JSON.stringify(value, (_key, val) => {
        if (val instanceof Blob) {
          return { __type: "Blob", size: val.size, type: val.type };
        }
        if (val instanceof File) {
          return { __type: "File", name: val.name, size: val.size, type: val.type };
        }
        if (val instanceof ArrayBuffer) {
          return { __type: "ArrayBuffer", byteLength: val.byteLength };
        }
        return val;
      })
    );
  } catch {
    return "[unserialisable]";
  }
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
