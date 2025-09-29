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
    const format = this.handle?.mimeType ?? "audio/webm";
    const blob = new Blob(this.chunks, { type: format });

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

      const recorder = new MediaRecorder(stream);
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

function asError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  return new Error(typeof value === "string" ? value : "Unknown error");
}
