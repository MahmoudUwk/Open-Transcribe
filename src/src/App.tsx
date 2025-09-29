import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { PROMPT_PRESETS, DEFAULT_MODEL } from "./constants/config";
import { useAudioRecorder } from "./hooks/useAudioRecorder";
import {
  createPreferencesManager,
  type Preferences,
  type PreferencesManager,
} from "./services/preferences";
import { transcribeRecording as defaultTranscribeRecording } from "./services/transcriptionClient";
import type { RecorderAdapter, RecordingResult, AudioRecorderState } from "./services/audioRecorder";

export type AppProps = {
  recorderAdapter?: RecorderAdapter;
  preferencesManager?: PreferencesManager;
  transcribe?: typeof defaultTranscribeRecording;
};

export function App({
  recorderAdapter,
  preferencesManager: preferencesManagerProp,
  transcribe: transcribeProp,
}: AppProps = {}) {
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [prompt, setPrompt] = useState(PROMPT_PRESETS[0]?.id ?? "");
  const [transcription, setTranscription] = useState("");
  const [lastRecording, setLastRecording] = useState<RecordingResult | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [manualError, setManualError] = useState<string | undefined>();
  const [apiKey, setApiKey] = useState("");
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [prefsError, setPrefsError] = useState<string | undefined>();
  const [prefsMessage, setPrefsMessage] = useState<string | null>(null);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState<string | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | undefined>();
  const [isEditingApiKey, setIsEditingApiKey] = useState(true);

  const { snapshot, start, stop, reset, error: hookError } = useAudioRecorder({
    adapter: recorderAdapter,
  });

  const preferencesManagerInstance = useMemo<PreferencesManager>(() => {
    return preferencesManagerProp ?? createPreferencesManager();
  }, [preferencesManagerProp]);

  const transcribeFn = useMemo(
    () => transcribeProp ?? defaultTranscribeRecording,
    [transcribeProp]
  );

  const recordingState = snapshot.state as AudioRecorderState;
  const { text: statusText, emoji: statusEmoji } = getRecorderIndicator(recordingState);
  const isBusy = recordingState === "requesting-permission" || recordingState === "stopping";
  const isRecording = recordingState === "recording";
  const recorderError = manualError ?? snapshot.error ?? hookError;

  const selectedPrompt = useMemo(() => {
    return (
      PROMPT_PRESETS.find((preset) => preset.id === prompt) ?? PROMPT_PRESETS[0]
    );
  }, [prompt]);

  const selectedPromptDescription = selectedPrompt?.description ?? "";

  useEffect(() => {
    if (!lastRecording) {
      if (playbackUrl) {
        URL.revokeObjectURL(playbackUrl);
      }
      setPlaybackUrl(null);
      return;
    }

    if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
      setPlaybackUrl(null);
      return;
    }

    const url = URL.createObjectURL(lastRecording.blob);
    setPlaybackUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [lastRecording]);

  useEffect(() => {
    let active = true;

    setPreferencesLoaded(false);

    preferencesManagerInstance
      .load()
      .then((prefs) => {
        if (!active) {
          return;
        }
        if (prefs) {
          if (prefs.model) {
            setModel(prefs.model);
          }
          if (prefs.prompt) {
            setPrompt(prefs.prompt);
          }
          if (prefs.apiKey) {
            setApiKey(prefs.apiKey);
            setApiKeyDraft(prefs.apiKey);
          }
        }
        setIsEditingApiKey(!(prefs?.apiKey));
      })
      .catch((error) => {
        if (active) {
          setPrefsError(toErrorMessage(error));
        }
      })
      .finally(() => {
        if (active) {
          setPreferencesLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, [preferencesManagerInstance]);

  const persistPreferences = useCallback(
    async (partial: Partial<Preferences>, options: { showMessage?: boolean } = {}) => {
      if (!preferencesLoaded) {
        return;
      }

      setIsSavingPrefs(true);
      const payload: Preferences = {
        model: partial.model ?? model,
        prompt: partial.prompt ?? prompt,
        apiKey: partial.apiKey ?? apiKey,
      };

      try {
        await preferencesManagerInstance.save(payload);
        setPrefsError(undefined);
        setPrefsMessage(options.showMessage ? "Preferences saved" : null);
      } catch (error) {
        const message = toErrorMessage(error);
        setPrefsError(message);
        if (options.showMessage) {
          setPrefsMessage(null);
        }
      } finally {
        setIsSavingPrefs(false);
      }
    },
    [apiKey, model, preferencesManagerInstance, preferencesLoaded, prompt]
  );

  const handleResetRecorder = (options?: { keepTranscription?: boolean }) => {
    reset();
    setLastRecording(null);
    setManualError(undefined);
    if (playbackUrl) {
      URL.revokeObjectURL(playbackUrl);
    }
    setPlaybackUrl(null);
    setTranscriptionStatus(null);
    setTranscriptionError(undefined);
    setIsTranscribing(false);
    if (!options?.keepTranscription) {
      setTranscription("");
    }
  };

  const handleToggleRecording = async () => {
    setManualError(undefined);

    try {
      if (recordingState === "idle") {
        setLastRecording(null);
        setTranscriptionStatus("Recording in progress...");
        setTranscriptionError(undefined);
        setTranscription("");
        await start();
      } else if (recordingState === "recording") {
        const result = await stop();
        setLastRecording(result);
        setTranscriptionStatus("Recording captured. Ready to transcribe.");
      } else if (recordingState === "error") {
        handleResetRecorder({ keepTranscription: true });
        await start();
      }
    } catch (error) {
      setManualError(toErrorMessage(error));
    }
  };

  const onToggleRecording = () => {
    void handleToggleRecording();
  };

  const recordingButtonLabel = isRecording
    ? "Stop Recording"
    : recordingState === "error"
    ? "Retry Recording"
    : "Start Recording";

  const handleModelChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setModel(value);
    setPrefsMessage(null);
    void persistPreferences({ model: value });
  };

  const handlePromptChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setPrompt(value);
    setPrefsMessage(null);
    void persistPreferences({ prompt: value });
  };

  const handleSaveApiKey = () => {
    const trimmed = apiKeyDraft.trim();
    setApiKey(trimmed);
    setPrefsMessage(null);
    void persistPreferences({ apiKey: trimmed }, { showMessage: true });
    setIsEditingApiKey(trimmed === "");
  };

  const handleClearApiKey = () => {
    setApiKey("");
    setApiKeyDraft("");
    setPrefsMessage(null);
    void persistPreferences({ apiKey: "" }, { showMessage: true });
    setIsEditingApiKey(true);
  };

  const handleTranscribeRecording = async () => {
    if (!lastRecording) {
      return;
    }
    if (!apiKey) {
      setTranscriptionError("Add your Gemini API key to transcribe audio.");
      return;
    }

    setTranscriptionError(undefined);
    setTranscriptionStatus("Sending audio to Gemini...");
    setIsTranscribing(true);

    try {
      const result = await transcribeFn(lastRecording, {
        apiKey,
        model,
        prompt: selectedPrompt?.prompt ?? "",
      });
      setTranscription(result.text);
      setTranscriptionStatus("Transcription complete.");
    } catch (error) {
      setTranscriptionError(toErrorMessage(error));
      setTranscriptionStatus(null);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleClearAll = () => {
    handleResetRecorder();
  };

  const handleBeginEditApiKey = () => {
    setApiKeyDraft(apiKey);
    setPrefsMessage(null);
    setIsEditingApiKey(true);
  };

  const handleCancelApiKeyEdit = () => {
    setApiKeyDraft(apiKey);
    setPrefsMessage(null);
    setIsEditingApiKey(false);
  };

  const handleCopyTranscription = async () => {
    if (!transcription) {
      return;
    }
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setTranscriptionError("Clipboard API is unavailable in this environment.");
      return;
    }
    try {
      await navigator.clipboard.writeText(transcription);
      setTranscriptionStatus("Transcript copied to clipboard.");
    } catch (error) {
      setTranscriptionError(
        `Unable to copy transcript: ${toErrorMessage(error)}`
      );
    }
  };

  const transcribeDisabled =
    !lastRecording || !apiKey || isTranscribing || recordingState === "recording";
  const isApiKeyPresent = apiKey.trim().length > 0;
  const showApiKeyForm = !isApiKeyPresent || isEditingApiKey;

  return (
    <div className="page">
      <header className="header">
        <div className="branding">
          <span className="logo" aria-hidden="true">
            🎙️
          </span>
          <div className="branding-copy">
            <h1>
              Open-Transcribe
              <a
                className="brand-link"
                href="https://github.com/MahmoudUwk/Open-Transcribe.git"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Open-Transcribe GitHub repository"
              >
                <svg className="brand-github" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 0C5.37 0 0 5.37 0 12a12 12 0 0 0 8.21 11.44c.6.11.82-.26.82-.58 0-.29-.01-1.06-.02-2.07-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.35-1.76-1.35-1.76-1.1-.75.08-.74.08-.74 1.22.09 1.86 1.26 1.86 1.26 1.08 1.85 2.83 1.32 3.52 1 .11-.78.42-1.32.76-1.62-2.67-.3-5.48-1.33-5.48-5.91 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.05.14 3 .4 2.3-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.59-2.81 5.61-5.49 5.91.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .32.22.7.83.58A12 12 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
                </svg>
              </a>
              <span className="status status-header" aria-live="polite" role="status" aria-label="Recording status">
                <span className="status-dot" aria-hidden="true">
                  {statusEmoji}
                </span>
                <span className="status-label">{statusText}</span>
              </span>
            </h1>
            <p>AI-Powered Audio Transcription</p>
          </div>
        </div>
        <div className="header-meta">
          <span className="version-tag">vNext (Tauri)</span>
          <a
            className="header-link"
            href="https://github.com/MahmoudUwk/Open-Transcribe.git"
            target="_blank"
            rel="noreferrer noopener"
          >
            GitHub
          </a>
          <span className="author-credit">
            Made by
            <a
              className="header-link"
              href="https://www.linkedin.com/in/mahmoudsallam7/"
              target="_blank"
              rel="noreferrer noopener"
            >
              Mahmoud Sallam
            </a>
          </span>
          <a
            className="header-link linkedin"
            href="https://www.linkedin.com/in/mahmoudsallam7/"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Mahmoud Sallam on LinkedIn"
          >
            <svg className="linkedin-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.329-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.937v5.669H9.352V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.604 0 4.268 2.372 4.268 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.121 20.452H3.553V9h3.568v11.452z"></path>
            </svg>
            <span className="sr-only">LinkedIn</span>
          </a>
        </div>
      </header>

      <main className="main">
        <section className="controls" aria-label="Recording controls">
          <div className="controls-content">
            <div className="controls-actions">
              <button type="button" onClick={onToggleRecording} disabled={isBusy}>
                {recordingButtonLabel}
              </button>
              <button
                type="button"
                onClick={handleTranscribeRecording}
                disabled={transcribeDisabled}
              >
                {isTranscribing ? "Processing…" : "Run"}
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={
                  transcription.length === 0 && !lastRecording && !transcriptionStatus
                }
              >
                Clear Recording
              </button>
            </div>

            <div className="controls-row">
              <div className="control-field">
                <label htmlFor="model-input">Model</label>
                <input
                  id="model-input"
                  name="model"
                  aria-label="Model"
                  value={model}
                  onChange={handleModelChange}
                  placeholder="gemini-2.5-flash"
                />
              </div>

              <div className="control-field">
                <label htmlFor="prompt-select">Prompt Preset</label>
                <select
                  id="prompt-select"
                  name="prompt"
                  aria-label="Prompt preset"
                  value={prompt}
                  onChange={handlePromptChange}
                >
                  {PROMPT_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="playback" role="region" aria-label="Recording playback">
              <p className="playback-summary">
                {lastRecording
                  ? `Last capture: ${formatRecordingSummary(lastRecording)}`
                  : "Record audio to enable playback."}
              </p>
              <audio
                className="recording-preview"
                src={playbackUrl ?? undefined}
                controls
                aria-disabled={playbackUrl ? undefined : true}
              />
              {transcriptionStatus && (
                <p className="status-note">{transcriptionStatus}</p>
              )}
            </div>

            <section className="preferences-panel" aria-label="Gemini API configuration">
              {isSavingPrefs && (
                <span className="status-note" role="status" aria-live="polite">
                  Saving…
                </span>
              )}
              {showApiKeyForm ? (
                <>
                  <div className="control-field">
                    <label htmlFor="api-key-input">Gemini API Key</label>
                    <input
                      id="api-key-input"
                      name="api-key"
                      aria-label="Gemini API Key"
                      type="password"
                      value={apiKeyDraft}
                      onChange={(event) => {
                        setApiKeyDraft(event.target.value);
                        setPrefsMessage(null);
                      }}
                      placeholder="Enter your Gemini API key"
                    />
                  </div>
                  <div className="preferences-actions">
                    <button
                      type="button"
                      onClick={handleSaveApiKey}
                      disabled={!preferencesLoaded || isSavingPrefs}
                    >
                      Save API Key
                    </button>
                    <button
                      type="button"
                      onClick={handleClearApiKey}
                      disabled={!preferencesLoaded || (apiKeyDraft === "" && !isApiKeyPresent)}
                    >
                      Remove
                    </button>
                    {isApiKeyPresent && (
                      <button
                        type="button"
                        onClick={handleCancelApiKeyEdit}
                        disabled={isSavingPrefs}
                      >
                        Cancel
                      </button>
                    )}
                    <a
                      className="header-link get-key"
                      href="https://aistudio.google.com/api-keys"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Get a free Gemini Key
                    </a>
                  </div>
                </>
              ) : (
                <div className="preferences-actions">
                  <button
                    type="button"
                    onClick={handleBeginEditApiKey}
                    disabled={!preferencesLoaded || isSavingPrefs}
                  >
                    Change API Key
                  </button>
                  <button
                    type="button"
                    onClick={handleClearApiKey}
                    disabled={!preferencesLoaded || isSavingPrefs}
                  >
                    Remove
                  </button>
                  <a
                    className="header-link get-key"
                    href="https://aistudio.google.com/api-keys"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Get a free Gemini Key
                  </a>
                </div>
              )}
              {recorderError && (
                <div className="alert error" role="alert">
                  <strong>Recording failed</strong>
                  <span>
                    {recorderError === "Error"
                      ? "Microphone access was denied or not available. Check OS permissions and ensure your input device is working."
                      : recorderError}
                  </span>
                  <p className="status-note">
                    Check microphone permissions for Open-Transcribe and ensure you have an input device available.
                  </p>
                </div>
              )}
              {prefsMessage && !prefsError && (
                <div className="alert success" role="status">
                  {prefsMessage}
                </div>
              )}
            </section>
          </div>
        </section>

        <section className="transcription" aria-labelledby="transcription-heading">
          <div className="transcription-header">
            <h2 id="transcription-heading">Output</h2>
            <div className="transcription-actions">
              <button
                type="button"
                onClick={handleCopyTranscription}
                disabled={transcription.length === 0}
              >
                Copy
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={
                  transcription.length === 0 && !lastRecording && !transcriptionStatus
                }
              >
                Clear
              </button>
            </div>
          </div>
          <div className="transcription-content">
            <textarea
              aria-label="Transcription output"
              value={transcription}
              onChange={(event) => setTranscription(event.target.value)}
              placeholder="Transcriptions will appear here once processing completes."
            />
            {transcriptionError && (
              <div className="alert error" role="alert">
                {transcriptionError}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>Powered by Google Gemini AI</span>
        <span>© {new Date().getFullYear()} Open-Transcribe</span>
      </footer>
    </div>
  );
}
function getRecorderIndicator(state: AudioRecorderState): { text: string; emoji: string } {
  switch (state) {
    case "recording":
      return { text: "Recording", emoji: "🔴" };
    case "requesting-permission":
      return { text: "Requesting microphone", emoji: "🟡" };
    case "stopping":
      return { text: "Processing", emoji: "🟣" };
    case "error":
      return { text: "Error", emoji: "⚠️" };
    case "idle":
    default:
      return { text: "Ready", emoji: "🟢" };
  }
}

function formatRecordingSummary(recording: RecordingResult): string {
  const duration = formatDuration(recording.durationMs);
  return `${duration} · ${recording.format}`;
}

function formatDuration(durationMs: number | null): string {
  if (durationMs == null || Number.isNaN(durationMs)) {
    return "Unknown length";
  }
  if (durationMs < 1000) {
    return "<1s";
  }
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function toErrorMessage(value: unknown): string {
  if (value instanceof Error) {
    return value.message;
  }
  if (typeof value === "string") {
    return value;
  }
  return "Recording failed";
}
