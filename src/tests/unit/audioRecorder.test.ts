import { describe, it, expect } from "vitest";
import { pickRecorderMimeType, toBaseMimeType } from "../../src/services/audioRecorder";

describe("pickRecorderMimeType", () => {
  it("prefers audio/webm;codecs=opus when supported (Chrome/Android Chrome)", () => {
    const supported = new Set([
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
    ]);
    const pick = (m: string) => supported.has(m);
    expect(pickRecorderMimeType(pick)).toBe("audio/webm;codecs=opus");
  });

  it("falls back to audio/mp4 variants on iOS Safari (no webm support)", () => {
    const supported = new Set(["audio/mp4;codecs=mp4a.40.2", "audio/mp4"]);
    const pick = (m: string) => supported.has(m);
    expect(pickRecorderMimeType(pick)).toBe("audio/mp4;codecs=mp4a.40.2");
  });

  it("falls back to audio/mp4 (base) when only base mp4 is supported", () => {
    const supported = new Set(["audio/mp4"]);
    const pick = (m: string) => supported.has(m);
    expect(pickRecorderMimeType(pick)).toBe("audio/mp4");
  });

  it("returns empty string when nothing is supported (browser default)", () => {
    expect(pickRecorderMimeType(() => false)).toBe("");
  });

  it("skips candidates that throw in isTypeSupported without crashing", () => {
    let calls = 0;
    const pick = (m: string) => {
      calls++;
      if (m === "audio/webm;codecs=opus") throw new Error("boom");
      return m === "audio/webm";
    };
    expect(pickRecorderMimeType(pick)).toBe("audio/webm");
    expect(calls).toBeGreaterThanOrEqual(2);
  });

  it("respects priority order: webm/opus > webm > mp4/codec > mp4 > ogg/opus > ogg", () => {
    // Only mp4 family supported
    expect(pickRecorderMimeType((m) => m.startsWith("audio/mp4"))).toBe(
      "audio/mp4;codecs=mp4a.40.2"
    );
    // Only ogg family supported
    expect(pickRecorderMimeType((m) => m.startsWith("audio/ogg"))).toBe(
      "audio/ogg;codecs=opus"
    );
  });
});

describe("toBaseMimeType", () => {
  it("strips codec parameters", () => {
    expect(toBaseMimeType("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(toBaseMimeType("audio/mp4;codecs=mp4a.40.2")).toBe("audio/mp4");
    expect(toBaseMimeType("audio/ogg; codecs=opus")).toBe("audio/ogg");
  });

  it("returns the base type unchanged when already normalized", () => {
    expect(toBaseMimeType("audio/webm")).toBe("audio/webm");
    expect(toBaseMimeType("audio/mp4")).toBe("audio/mp4");
  });

  it("lowercases the result for consistent Gemini lookup", () => {
    expect(toBaseMimeType("AUDIO/WEBM;CODECS=OPUS")).toBe("audio/webm");
  });

  it("defaults to audio/webm for undefined/empty input", () => {
    expect(toBaseMimeType(undefined)).toBe("audio/webm");
    expect(toBaseMimeType("")).toBe("audio/webm");
  });

  it("handles whitespace around codecs", () => {
    expect(toBaseMimeType("audio/webm ; codecs=opus")).toBe("audio/webm");
  });
});
