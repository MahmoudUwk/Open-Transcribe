export type AudioRecorderState =
  | "idle"
  | "requesting-permission"
  | "recording"
  | "stopping"
  | "error";

export interface RecordingResult {
  blob: Blob;
  format: string;
  durationMs: number | null;
}

export interface AudioRecorderSnapshot {
  state: AudioRecorderState;
  error?: string;
}

export interface RecorderHandle {
  start(): void;
  stop(): void;
  dispose(): void;
  readonly mimeType?: string;
}

export interface RecorderAdapter {
  requestStream(): Promise<MediaStream>;
  createRecorder(
    stream: MediaStream,
    handlers: {
      onData: (chunk: Blob) => void;
      onError: (error: Error) => void;
      onStop: () => void;
    }
  ): RecorderHandle;
}

export class AudioRecorderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AudioRecorderError";
  }
}

export class AudioRecorder {
  private snapshot: AudioRecorderSnapshot = { state: "idle" };
  private handle: RecorderHandle | null = null;
  private chunks: Blob[] = [];
  private listeners = new Set<(snapshot: AudioRecorderSnapshot) => void>();
  private pendingStop?: {
    resolve: (result: RecordingResult) => void;
    reject: (error: Error) => void;
  };
  private startedAt: number | null = null;

  constructor(
    private readonly adapter: RecorderAdapter,
    private readonly now: () => number = () => Date.now()
  ) {}

  get state(): AudioRecorderState {
    return this.snapshot.state;
  }

  get currentSnapshot(): AudioRecorderSnapshot {
    return this.snapshot;
  }

  subscribe(listener: (snapshot: AudioRecorderSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async start(): Promise<void> {
    if (this.snapshot.state !== "idle") {
      throw new AudioRecorderError("Recorder must be idle to start");
    }

    this.updateSnapshot({ state: "requesting-permission", error: undefined });
    this.chunks = [];

    try {
      const stream = await this.adapter.requestStream();
      this.handle = this.adapter.createRecorder(stream, {
        onData: (chunk) => {
          if (chunk.size > 0) {
            this.chunks.push(chunk);
          }
        },
        onError: (error) => this.handleError(error),
        onStop: () => this.handleStop(),
      });
      this.startedAt = this.now();
      this.handle.start();
      this.updateSnapshot({ state: "recording" });
    } catch (error) {
      this.handleError(asError(error));
      throw error;
    }
  }

  async stop(): Promise<RecordingResult> {
    if (this.snapshot.state !== "recording" || !this.handle) {
      throw new AudioRecorderError("Recorder is not currently recording");
    }

    this.updateSnapshot({ state: "stopping" });

    return new Promise<RecordingResult>((resolve, reject) => {
      this.pendingStop = { resolve, reject };
      try {
        this.handle?.stop();
      } catch (error) {
        const err = asError(error);
        this.handleError(err);
        reject(err);
      }
    });
  }

  dispose(): void {
    try {
      if (this.handle) {
        this.handle.dispose();
      }
    } finally {
      this.handle = null;
      this.chunks = [];
      this.startedAt = null;
      if (this.snapshot.state !== "idle") {
        this.updateSnapshot({ state: "idle" });
      }
    }
  }

  private handleStop(): void {
    const duration = this.startedAt ? this.now() - this.startedAt : null;
    const rawMimeType = this.handle?.mimeType ?? "audio/webm";
    const blob = new Blob(this.chunks, { type: rawMimeType });
    // Gemini accepts only the base MIME type (no codec params), so normalize
    // the format we expose while keeping the full type on the blob itself.
    const format = toBaseMimeType(rawMimeType);

    this.chunks = [];
    this.startedAt = null;

    this.handle?.dispose();
    this.handle = null;

    this.updateSnapshot({ state: "idle" });

    const result: RecordingResult = {
      blob,
      format,
      durationMs: duration,
    };

    if (this.pendingStop) {
      this.pendingStop.resolve(result);
      this.pendingStop = undefined;
    }
  }

  private handleError(error: Error): void {
    this.chunks = [];
    this.startedAt = null;
    if (this.handle) {
      this.handle.dispose();
      this.handle = null;
    }

    this.updateSnapshot({ state: "error", error: error.message });

    if (this.pendingStop) {
      this.pendingStop.reject(error);
      this.pendingStop = undefined;
    }
  }

  private updateSnapshot(partial: Partial<AudioRecorderSnapshot>): void {
    this.snapshot = {
      ...this.snapshot,
      ...partial,
    };
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.snapshot);
    }
  }
}

export function createBrowserRecorderAdapter(): RecorderAdapter {
  return {
    async requestStream() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new AudioRecorderError("Media recording is not supported in this environment");
      }
      try {
        return await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        throw new AudioRecorderError(
          error instanceof Error ? error.message : "Failed to acquire microphone access"
        );
      }
    },
    createRecorder(stream, handlers) {
      if (typeof MediaRecorder === "undefined") {
        throw new AudioRecorderError("MediaRecorder API is not available");
      }

      const mimeType = pickRecorderMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size > 0) {
          handlers.onData(event.data);
        }
      });
      recorder.addEventListener("stop", () => handlers.onStop());
      recorder.addEventListener("error", (event) => {
        const errorEvent = event as Event & { error?: DOMException };
        const err = errorEvent.error ?? new Error("Recording error");
        handlers.onError(err);
      });

      return {
        mimeType: recorder.mimeType,
        start() {
          recorder.start();
        },
        stop() {
          recorder.stop();
        },
        dispose() {
          recorder.stream?.getTracks().forEach((track) => track.stop());
        },
      };
    },
  };
}

/**
 * Codec candidates in priority order. Each entry is a mimeType the browser
 * MIGHT be able to record. We pick the first one MediaRecorder.isTypeSupported
 * accepts. webm/opus is preferred because Opus is purpose-built for speech and
 * is the default on Chrome/Firefox/Android Chrome; the mp4 entries cover iOS
 * Safari 14.3+; ogg is a Firefox alternative. Returns "" to let the browser
 * pick its default as a last resort.
 *
 * Note: Gemini accepts only the BASE type (no `;codecs=` suffix), so callers
 * must normalize via toBaseMimeType() before sending audio to the API.
 */
const RECORDER_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

export function pickRecorderMimeType(
  isTypeSupported: (mime: string) => boolean = (m) =>
    typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)
): string {
  for (const candidate of RECORDER_MIME_CANDIDATES) {
    try {
      if (isTypeSupported(candidate)) {
        return candidate;
      }
    } catch {
      // Some browsers throw on isTypeSupported for weird inputs; just skip.
    }
  }
  return "";
}

/**
 * Strip parameters (e.g. `;codecs=opus`) from a mimeType to get the base type
 * that Gemini accepts. Falls back to the input if it's already base form.
 */
export function toBaseMimeType(mimeType: string | undefined): string {
  if (!mimeType) return "audio/webm";
  const base = mimeType.split(";")[0].trim().toLowerCase();
  return base || "audio/webm";
}

function asError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  return new Error(typeof value === "string" ? value : "Unknown error");
}
