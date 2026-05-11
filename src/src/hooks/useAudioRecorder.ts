import { useEffect, useMemo, useRef, useState } from "react";
import {
  AudioRecorder,
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
  const adapterRef = useRef<RecorderAdapter | undefined>(undefined);
  const [snapshot, setSnapshot] = useState<AudioRecorderSnapshot>({ state: "idle" });
  const recorderRef = useRef<AudioRecorder | undefined>(undefined);

  let adapter = adapterRef.current;
  if (!adapter) {
    adapter = options.adapter ?? createBrowserRecorderAdapter();
    adapterRef.current = adapter;
  }

  let recorder = recorderRef.current;
  if (!recorder) {
    recorder = new AudioRecorder(adapter);
    recorderRef.current = recorder;
  }

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
