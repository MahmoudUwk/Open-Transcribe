import { dbSet, dbDelete } from "./db";

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
  start(timeslice?: number): void;
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
  private wakeLock: { release(): Promise<void> } | null = null;

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

    // Clear any leftover backup keys
    await dbDelete("active_chunks");
    await dbDelete("active_metadata");

    try {
      const stream = await this.adapter.requestStream();
      this.handle = this.adapter.createRecorder(stream, {
        onData: async (chunk) => {
          if (chunk.size > 0) {
            this.chunks.push(chunk);
            // Save chunks immediately to IndexedDB
            await dbSet("active_chunks", this.chunks);
          }
        },
        onError: (error) => {
          void this.handleError(error);
        },
        onStop: () => {
          void this.handleStop();
        },
      });
      this.startedAt = this.now();
      
      const mimeType = this.handle.mimeType ?? "audio/webm";
      await dbSet("active_metadata", { startedAt: this.startedAt, mimeType });
      
      // Request Wake Lock to prevent system sleep
      if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
        try {
          this.wakeLock = await (navigator as unknown as { wakeLock: { request(type: string): Promise<{ release(): Promise<void> }> } }).wakeLock.request("screen");
        } catch (err) {
          console.warn("AudioRecorder: Failed to acquire screen wake lock:", err);
        }
      }

      // Start recording in 5-second slices for durability
      this.handle.start(5000);
      this.updateSnapshot({ state: "recording" });
    } catch (error) {
      await this.handleError(asError(error));
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
        void this.handleError(err);
        reject(err);
      }
    });
  }

  dispose(): void {
    try {
      this.releaseWakeLock();
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

  private releaseWakeLock(): void {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch (err) {
        console.warn("AudioRecorder: Failed to release screen wake lock:", err);
      }
      this.wakeLock = null;
    }
  }

  private async handleStop(): Promise<void> {
    this.releaseWakeLock();
    const duration = this.startedAt ? this.now() - this.startedAt : null;
    const rawMimeType = this.handle?.mimeType ?? "audio/webm";
    const blob = new Blob(this.chunks, { type: rawMimeType });
    const format = toBaseMimeType(rawMimeType);

    this.chunks = [];
    this.startedAt = null;

    this.handle?.dispose();
    this.handle = null;

    // Clear active session from IndexedDB
    await dbDelete("active_chunks");
    await dbDelete("active_metadata");

    const result: RecordingResult = {
      blob,
      format,
      durationMs: duration,
    };

    // Save final recording result to IndexedDB
    await dbSet("last_recording", result);

    this.updateSnapshot({ state: "idle" });

    if (this.pendingStop) {
      this.pendingStop.resolve(result);
      this.pendingStop = undefined;
    }
  }

  private async handleError(error: Error): Promise<void> {
    this.releaseWakeLock();
    const duration = this.startedAt ? this.now() - this.startedAt : null;
    const rawMimeType = this.handle?.mimeType ?? "audio/webm";

    let result: RecordingResult | null = null;
    if (this.chunks.length > 0) {
      const blob = new Blob(this.chunks, { type: rawMimeType });
      const format = toBaseMimeType(rawMimeType);
      result = {
        blob,
        format,
        durationMs: duration,
      };
      // Backup recovered audio to last_recording
      await dbSet("last_recording", result);
    }

    this.chunks = [];
    this.startedAt = null;
    if (this.handle) {
      this.handle.dispose();
      this.handle = null;
    }

    // Clear active session from IndexedDB
    await dbDelete("active_chunks");
    await dbDelete("active_metadata");

    this.updateSnapshot({ state: "error", error: error.message });

    if (this.pendingStop) {
      if (result) {
        this.pendingStop.resolve(result);
      } else {
        this.pendingStop.reject(error);
      }
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

      // Listen for tracks ending (e.g., unplugged hardware)
      const trackEndedHandler = () => {
        if (recorder.state === "recording") {
          handlers.onError(new Error("Audio input device disconnected"));
        }
      };

      stream.getTracks().forEach((track) => {
        track.addEventListener("ended", trackEndedHandler);
      });

      return {
        mimeType: recorder.mimeType,
        start(timeslice) {
          recorder.start(timeslice);
        },
        stop() {
          recorder.stop();
        },
        dispose() {
          stream.getTracks().forEach((track) => {
            track.removeEventListener("ended", trackEndedHandler);
            track.stop();
          });
        },
      };
    },
  };
}

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
