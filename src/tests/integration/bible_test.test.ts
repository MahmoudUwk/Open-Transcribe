import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, beforeAll } from "vitest";
import { GoogleGenAI } from "@google/genai";
import { MODEL_POOL } from "../../src/constants/config";

const MP3_PATH = resolve(__dirname, "../../../Integration_test/bible_test.mp3");
const ENV_PATH = resolve(__dirname, "../../../.env");

function loadEnv(): Record<string, string> {
  try {
    const raw = readFileSync(ENV_PATH, "utf-8");
    const env: Record<string, string> = {};
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      env[key] = val;
    }
    return env;
  } catch {
    return {};
  }
}

function mp3ToBase64(filePath: string): string {
  const buffer = readFileSync(filePath);
  return buffer.toString("base64");
}

describe("Bible integration test", () => {
  let apiKey: string | undefined;
  let audioBase64: string;

  beforeAll(() => {
    const env = loadEnv();
    apiKey = env["Gemini_APY_Key"] || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn(
        "[bible_test] No Gemini API key found. Set Gemini_APY_Key in .env or GEMINI_API_KEY in environment."
      );
    }

    audioBase64 = mp3ToBase64(MP3_PATH);
  });

  it("transcribes bible_test.mp3 using the Gemini API", { timeout: 30_000 }, async () => {
    if (!apiKey) {
      console.warn("[bible_test] Skipping — no API key.");
      return;
    }

    const client = new GoogleGenAI({ apiKey });

    const response = await client.models.generateContent({
      model: MODEL_POOL[0].id,
      contents: [
        { text: "Provide a verbatim transcription of this audio clip." },
        { inlineData: { mimeType: "audio/mp3", data: audioBase64 } },
      ],
    });

    const text = response.text;

    expect(text).toBeTruthy();
    expect(text!.toLowerCase()).toContain("hello");
    expect(text!.toLowerCase()).toContain("open");
    expect(text!.toLowerCase()).toContain("transcribe");

    console.log("[bible_test] Transcription:", text);
  });
});
