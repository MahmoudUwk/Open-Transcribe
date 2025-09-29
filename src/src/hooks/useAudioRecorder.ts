import { useEffect, useMemo, useRef, useState } from "react";
import {
  AudioRecorder,
  AudioRecorderError,
  AudioRecorderSnapshot,
  RecorderAdapter,
  RecordingResult,
  createBrowserRecorderAdapter,
} from "../services/audioRecorder";

export interface UseAudioRecorderOptions {
  adapter?: RecorderAdapter;
}

export interface UseAudioRecorderResult {
  snapshot: AudioRecorderSnapshot;
  start: () => Promise<void>;
  stop: () => Promise<RecordingResult>;
  reset: () => void;
  error?: string;
}

export function useAudioRecorder(
  options: UseAudioRecorderOptions = {}
): UseAudioRecorderResult {
  const adapterRef = useRef<RecorderAdapter>();
  const [snapshot, setSnapshot] = useState<AudioRecorderSnapshot>({ state: "idle" });
  const recorderRef = useRef<AudioRecorder>();

  if (!adapterRef.current) {
    adapterRef.current = options.adapter ?? createBrowserRecorderAdapter();
  }

  if (!recorderRef.current) {
    recorderRef.current = new AudioRecorder(adapterRef.current);
  }

  const recorder = recorderRef.current;

  useEffect(() => {
    const unsubscribe = recorder.subscribe((next) => {
      setSnapshot(next);
    });
    return () => {
      unsubscribe();
      recorder.dispose();
    };
  }, [recorder]);

  const actions = useMemo(
    () => ({
      async start() {
        await recorder.start();
      },
      async stop() {
        return recorder.stop();
      },
      reset() {
        recorder.dispose();
      },
    }),
    [recorder]
  );

  return {
    snapshot,
    start: actions.start,
    stop: actions.stop,
    reset: actions.reset,
    error: snapshot.error,
  };
}

export class BrowserRecordingUnsupportedError extends AudioRecorderError {
  constructor() {
    super("Media recording is not supported in this environment");
  }
}
