import React from "react";
import Markdown from "markdown-to-jsx";

const APP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
  --bg-page: #0b0f14;
  --bg-card: rgba(17, 25, 36, 0.7);
  --accent-cyan: #00e5ff;
  --accent-cyan-dim: rgba(0, 229, 255, 0.12);
  --accent-cyan-glow: 0 0 15px rgba(0, 229, 255, 0.4);
  --accent-cyan-glow-intense: 0 0 25px rgba(0, 229, 255, 0.6);
  --accent-teal: #14b8a6;
  --accent-purple: #8b5cf6;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --border-dim: rgba(56, 68, 85, 0.5);
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  background-color: var(--bg-page);
  color: var(--text-primary);
}

* { box-sizing: border-box; }

.page {
  display: grid;
  grid-template-rows: auto 1fr;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 20px;
  gap: 16px;
  background:
    radial-gradient(circle at 50% -20%, rgba(0, 229, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 0% 100%, rgba(139, 92, 246, 0.08) 0%, transparent 40%),
    #0b0f14;
}

.api-status {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  align-self: center;
}

.api-status.status-ready {
  background: rgba(16, 185, 129, 0.15);
  color: var(--color-success);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.api-status.status-missing {
  background: rgba(245, 158, 11, 0.15);
  color: var(--color-warning);
  border: 1px solid rgba(245, 158, 11, 0.3);
  animation: pulse-amber 2s infinite ease-in-out;
}

@keyframes pulse-amber {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(0.98); }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(17, 25, 36, 0.85);
  border: 1px solid var(--border-dim);
  border-radius: 20px;
  padding: 18px 32px;
  backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  min-height: 90px;
}

.branding {
  display: flex;
  align-items: center;
  gap: 18px;
  width: 100%;
}

.branding-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.branding-copy h1 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 32px;
  color: var(--text-primary);
}

.status-header {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #0f172a;
  padding: 6px 16px;
  border-radius: 99px;
  border: 1px solid rgba(16, 185, 129, 0.3);
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.1);
}

.status-label {
  color: #34d399;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.status-dot {
  font-size: 16px;
}

.brand-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-cyan);
  text-decoration: none;
  transition: color 0.2s ease;
}

.brand-github {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

.logo {
  font-size: 36px;
  line-height: 1;
}

.header p {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 16px;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.header-icons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.meta-icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

.author-credit {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
}

.header-link {
  color: var(--accent-cyan);
  font-weight: 600;
  text-decoration: none;
}

.main {
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr 1fr;
  align-items: start;
  width: 100%;
  min-height: 0;
}

.main > * {
  min-height: 0;
}

.controls,
.transcription {
  background: linear-gradient(145deg, rgba(23, 32, 47, 0.8), rgba(15, 23, 42, 0.8));
  border: 1px solid var(--border-dim);
  border-radius: 20px;
  padding: 22px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
}

.controls-content,
.transcription-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1 1 auto;
  overflow: hidden;
  min-height: 0;
}

.controls-header,
.transcription-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.controls-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.controls-row .model-pool {
  flex: 0 1 auto;
}

.controls-row .control-field {
  flex: 1 1 360px;
}

.controls-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
  padding-top: 10px;
  margin-top: -4px;
}

.controls-actions button {
  flex: 1 1 180px;
}

.preferences-panel {
  margin-top: 10px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid var(--border-dim);
  background: rgba(30, 41, 59, 0.3);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
  display: grid;
  gap: 8px;
}

button {
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border-dim);
  color: #cbd5e1;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
}

.controls-actions button:first-child {
  background: rgba(0, 229, 255, 0.05);
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
  box-shadow: var(--accent-cyan-glow);
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.3);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.3;
  box-shadow: none !important;
  border-color: var(--border-dim) !important;
  color: var(--text-secondary) !important;
}

button:not(:disabled):hover {
  background: var(--accent-cyan-dim);
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
  box-shadow: var(--accent-cyan-glow-intense);
  transform: translateY(-2px);
}

.control-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

input,
select,
textarea {
  border-radius: 12px;
  border: 1px solid var(--border-dim);
  padding: 12px 14px;
  background: #0b0f14;
  color: var(--text-primary);
  font-size: 15px;
  font-family: inherit;
  transition: all 0.2s ease;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.15);
  background: #0f172a;
}

textarea {
  min-height: 220px;
  resize: vertical;
}

.prompt-description {
  margin-top: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  font-style: italic;
  opacity: 0.85;
}

.status-note {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.model-pool {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.model-pool-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.model-pool-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.model-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid var(--border-dim);
  background: rgba(30, 41, 59, 0.4);
  color: var(--text-secondary);
  white-space: nowrap;
}

.model-badge small {
  font-weight: 500;
  opacity: 0.7;
  font-size: 12px;
}

.model-badge.model-active {
  background: rgba(139, 92, 246, 0.15);
  border-color: var(--accent-purple);
  color: #a78bfa;
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.25);
}

.model-badge.model-failed {
  border-color: rgba(248, 113, 113, 0.3);
  background: rgba(127, 29, 29, 0.1);
  color: #f87171;
  text-decoration: line-through;
  opacity: 0.6;
}

.alert.success {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
  padding: 12px 16px;
  border-radius: 12px;
  margin-top: 10px;
  font-size: 15px;
}

.alert.error {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
  color: var(--color-error);
  padding: 12px 16px;
  border-radius: 12px;
  margin-top: 10px;
  font-size: 15px;
}

.playback {
  margin-top: 6px;
}

.playback-summary {
  margin: 0;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #bbf7d0;
  font-size: 15px;
}

.recording-preview {
  width: 100%;
  margin-top: 8px;
  outline: none;
  height: 44px;
}

.transcription-actions {
  display: flex;
  gap: 8px;
  padding-top: 10px;
  margin-top: -4px;
}

.btn-toggle {
  background: rgba(30, 41, 59, 0.4);
  border-color: var(--border-dim);
  color: var(--text-secondary);
  box-shadow: none;
}

.btn-toggle:not(:disabled):hover {
  background: rgba(48, 54, 61, 0.6);
  border-color: var(--accent-cyan);
  color: var(--text-primary);
}

.markdown-preview {
  flex: 1;
  min-height: 220px;
  padding: 18px;
  background: #0b0f14;
  border: 1px solid var(--border-dim);
  border-radius: 12px;
  overflow-y: auto;
  color: var(--text-primary);
  line-height: 1.6;
  font-size: 16px;
}

.markdown-preview h1,
.markdown-preview h2,
.markdown-preview h3 {
  color: var(--accent-cyan);
  margin-top: 1em;
  margin-bottom: 0.4em;
  border-bottom: 1px solid var(--border-dim);
  padding-bottom: 0.2em;
}

.markdown-preview h1 { font-size: 1.4rem; }
.markdown-preview h2 { font-size: 1.25rem; }
.markdown-preview h3 { font-size: 1.1rem; }

.markdown-preview p {
  margin-bottom: 0.8em;
}

.markdown-preview ul,
.markdown-preview ol {
  margin-bottom: 1em;
  padding-left: 1.5em;
}

.markdown-preview li {
  margin-bottom: 0.3em;
}

.markdown-preview code {
  background: rgba(139, 92, 246, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9em;
  color: #a78bfa;
}

.markdown-preview pre {
  background: #0f172a;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  border: 1px solid var(--border-dim);
  margin-bottom: 1em;
}

.markdown-preview pre code {
  background: transparent;
  padding: 0;
  color: #f8fafc;
}

.placeholder-text {
  color: var(--text-secondary);
  font-style: italic;
  opacity: 0.7;
}

.preferences-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 10px;
  margin-top: -4px;
  align-items: center;
}

.preferences-actions .get-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  border-radius: 10px;
  border: 1px solid var(--accent-cyan);
  background: var(--accent-cyan-dim);
  color: var(--accent-cyan);
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.preferences-actions .get-key:hover {
  background: var(--accent-cyan);
  color: #000;
}

.hover-glow {
  animation: glow-pulse 1s infinite ease-in-out;
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 8px rgba(0, 229, 255, 0.3); }
  50% { box-shadow: 0 0 20px rgba(0, 229, 255, 0.6); }
}
`;

export type RemotionAppProps = {
  recordingState: "idle" | "recording" | "stopping" | "error";
  apiKey: string;
  isEditingApiKey: boolean;
  promptId: string;
  transcription: string;
  transcriptionStatus: string | null;
  transcriptionError: string | null;
  lastRecording: { durationMs: number; format: string } | null;
  isTranscribing: boolean;
  routerState: {
    currentId: string;
    attempts: number;
    entries?: { id: string; status: string }[];
  } | null;
  usageCounts: Record<string, number>;
  showRaw: boolean;
  showDropdown?: boolean;
  hoveredButton?: string | null;
};

const MODEL_POOL = [
  { id: "gemini-3.1-flash-lite", label: "3.1 Flash-Lite", rpd: 500 },
  { id: "gemini-3-flash-preview", label: "3 Flash Preview", rpd: 20 },
];

const PROMPT_PRESETS = [
  {
    id: "transcribe-autodetect",
    label: "Transcribe (Autodetect languages)",
    description:
      "Polished transcription with auto-language detection. Removes stutters and filler while preserving exact meaning.",
  },
  {
    id: "transcribe-plan",
    label: "Transcribe and Plan (Action items from audio)",
    description:
      "Full transcript with a structured action plan. Captures tasks, decisions, and deadlines exactly as spoken.",
  },
  {
    id: "instruction-assistant",
    label: "Instruction Assistant (Do what you hear)",
    description:
      "Direct execution of spoken commands. Write code, draft emails, or get answers without needing a transcript.",
  },
];

function getRecorderIndicator(
  state: string
): { text: string; emoji: string } {
  switch (state) {
    case "recording":
      return { text: "Recording", emoji: "\u{1F534}" };
    case "requesting-permission":
      return { text: "Requesting microphone", emoji: "\u{1F7E1}" };
    case "stopping":
      return { text: "Processing", emoji: "\u{1F7E3}" };
    case "error":
      return { text: "Error", emoji: "\u{26A0}\u{FE0F}" };
    case "idle":
    default:
      return { text: "Ready", emoji: "\u{1F7E2}" };
  }
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

function formatRecordingSummary(recording: {
  durationMs: number;
  format: string;
}): string {
  const duration = formatDuration(recording.durationMs);
  return `${duration} · ${recording.format}`;
}

export const RemotionApp: React.FC<RemotionAppProps> = (props) => {
  const {
    recordingState,
    apiKey,
    isEditingApiKey,
    promptId,
    transcription,
    transcriptionStatus,
    transcriptionError,
    lastRecording,
    isTranscribing,
    routerState,
    usageCounts,
    showRaw,
    hoveredButton,
  } = props;

  const { text: statusText, emoji: statusEmoji } =
    getRecorderIndicator(recordingState);
  const isRecording = recordingState === "recording";
  const recordingButtonLabel = isRecording
    ? "Stop Recording"
    : recordingState === "error"
    ? "Retry Recording"
    : "Start Recording";
  const isBusy = recordingState === "stopping";

  const isApiKeyPresent = apiKey.trim().length > 0;
  const showApiKeyForm = !isApiKeyPresent || isEditingApiKey;

  const transcribeDisabled =
    !lastRecording || !apiKey || isTranscribing || recordingState === "recording";

  const selectedPrompt =
    PROMPT_PRESETS.find((p) => p.id === promptId) ?? PROMPT_PRESETS[0];

  const totalQuota = MODEL_POOL.reduce((s, m) => s + m.rpd, 0);
  const totalUsed = Object.values(usageCounts).reduce((s, u) => s + u, 0);

  const apiStatusBadge = (
    <span
      className={`api-status ${
        isApiKeyPresent ? "status-ready" : "status-missing"
      }`}
    >
      {isApiKeyPresent ? "API: Configured" : "API: Required"}
    </span>
  );

  const brandGithubPath =
    "M12 0C5.37 0 0 5.37 0 12a12 12 0 0 0 8.21 11.44c.6.11.82-.26.82-.58 0-.29-.01-1.06-.02-2.07-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.35-1.76-1.35-1.76-1.1-.75.08-.74.08-.74 1.22.09 1.86 1.26 1.86 1.26 1.08 1.85 2.83 1.32 3.52 1 .11-.78.42-1.32.76-1.62-2.67-.3-5.48-1.33-5.48-5.91 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.05.14 3 .4 2.3-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.59-2.81 5.61-5.49 5.91.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .32.22.7.83.58A12 12 0 0 0 24 12c0-6.63-5.37-12-12-12Z";

  const linkedInPath =
    "M20.447 20.452h-3.554v-5.569c0-1.329-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.937v5.669H9.352V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.604 0 4.268 2.372 4.268 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.121 20.452H3.553V9h3.568v11.452z";

  const resumePath =
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm2-6h8v1.5H8V14zm0 3h8v1.5H8V17zm0-6h3v1.5H8V11zm4-7l4 4h-4V4z";

  const getButtonClass = (buttonName: string) => {
    if (hoveredButton === buttonName) {
      return "hover-glow";
    }
    return "";
  };

  return (
    <div className="page">
      <style>{APP_CSS}</style>
      <header className="header">
        <div className="branding">
          <span className="logo" aria-hidden="true">
            {"🎙️"}
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
                <svg
                  className="brand-github"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d={brandGithubPath} />
                </svg>
              </a>
              <span
                className="status status-header"
                aria-live="polite"
                role="status"
                aria-label="Recording status"
              >
                <span className="status-dot" aria-hidden="true">
                  {statusEmoji}
                </span>
                <span className="status-label">{statusText}</span>
              </span>
            </h1>
            <p>Configure free API → Record → Run → Get Output.</p>
          </div>
        </div>
        <div className="header-meta">
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
          <div className="header-icons">
            <a
              className="header-link icon-link"
              href="https://github.com/MahmoudUwk/Open-Transcribe.git"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Open-Transcribe on GitHub"
            >
              <svg className="meta-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d={brandGithubPath} />
              </svg>
            </a>
            <a
              className="header-link icon-link"
              href="https://www.linkedin.com/in/mahmoudsallam7/"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Mahmoud Sallam on LinkedIn"
            >
              <svg className="meta-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d={linkedInPath} />
              </svg>
            </a>
            <a
              className="header-link icon-link"
              href="https://mahmoudresume.netlify.app/"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Mahmoud Sallam Resume"
            >
              <svg className="meta-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d={resumePath} />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <main className="main">
        <section className="controls" aria-label="Recording controls">
          <div className="controls-content">
            <div className="controls-actions">
              <button
                type="button"
                disabled={isBusy}
                className={getButtonClass("startRecording")}
              >
                {recordingButtonLabel}
              </button>
              <button
                type="button"
                disabled={transcribeDisabled}
                className={getButtonClass("run")}
              >
                {isTranscribing ? "Processing…" : "Run"}
              </button>
              <button
                type="button"
                disabled={
                  transcription.length === 0 &&
                  !lastRecording &&
                  !transcriptionStatus
                }
              >
                Clear Recording
              </button>
            </div>

            <div className="controls-row">
              <div className="model-pool" aria-label="Model pool">
                <span className="model-pool-label">
                  Models ({totalUsed}/{totalQuota} Free Daily Quota)
                </span>
                <div className="model-pool-list">
                  {MODEL_POOL.map((m) => {
                    const entry = routerState?.entries?.find(
                      (e: { id: string }) => e.id === m.id
                    );
                    const status = entry?.status ?? "available";
                    const usage = usageCounts[m.id] ?? 0;
                    return (
                      <span
                        key={m.id}
                        className={`model-badge model-${status}`}
                        aria-label={`${m.label} — ${status}, ${usage} of ${m.rpd} used`}
                      >
                        {status === "active"
                          ? "●"
                          : status === "failed"
                          ? "✗"
                          : "○"}{" "}
                        {m.label}{" "}
                        <small>
                          ({usage}/{m.rpd})
                        </small>
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="control-field">
                <label htmlFor="prompt-select">Prompt Preset</label>
                <select
                  id="prompt-select"
                  name="prompt"
                  aria-label="Prompt preset"
                  value={promptId}
                >
                  {PROMPT_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
                <p className="prompt-description">
                  {selectedPrompt.description}
                </p>
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
                controls
                aria-disabled={lastRecording ? undefined : true}
              />
              {transcriptionStatus && (
                <p className="status-note">{transcriptionStatus}</p>
              )}
            </div>

            <section
              className="preferences-panel"
              aria-label="Gemini API configuration"
            >
              {showApiKeyForm ? (
                <>
                  <div className="control-field">
                    <label htmlFor="api-key-input">Gemini API Key</label>
                    <input
                      id="api-key-input"
                      name="api-key"
                      aria-label="Gemini API Key"
                      type="password"
                      value={apiKey}
                      placeholder="Enter your Gemini API key"
                      readOnly
                    />
                  </div>
                  <div className="preferences-actions">
                    <button
                      type="button"
                      disabled={!isApiKeyPresent}
                      className={getButtonClass("saveApiKey")}
                    >
                      Save API Key
                    </button>
                    <button type="button">Remove</button>
                    {isApiKeyPresent && (
                      <button type="button">Cancel</button>
                    )}
                    <a
                      className={`header-link get-key ${getButtonClass(
                        "getGeminiKey"
                      )}`}
                      href="https://aistudio.google.com/api-keys"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Get a free Gemini Key
                    </a>
                    {apiStatusBadge}
                  </div>
                </>
              ) : (
                <div className="preferences-actions">
                  <button type="button">Change API Key</button>
                  <button type="button">Remove</button>
                  <a
                    className={`header-link get-key ${getButtonClass(
                      "getGeminiKey"
                    )}`}
                    href="https://aistudio.google.com/api-keys"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Get a free Gemini Key
                  </a>
                  {apiStatusBadge}
                </div>
              )}
            </section>
          </div>
        </section>

        <section
          className="transcription"
          aria-labelledby="transcription-heading"
        >
          <div className="transcription-header">
            <h2 id="transcription-heading">Output</h2>
            <div className="transcription-actions">
              <button
                type="button"
                disabled={transcription.length === 0}
                className="btn-toggle"
              >
                {showRaw ? "Preview" : "Raw"}
              </button>
              <button type="button" disabled={transcription.length === 0}>
                Copy
              </button>
              <button
                type="button"
                disabled={
                  transcription.length === 0 &&
                  !lastRecording &&
                  !transcriptionStatus
                }
              >
                Clear
              </button>
            </div>
          </div>
          <div className="transcription-content">
            {showRaw ? (
              <textarea
                aria-label="Transcription output"
                value={transcription}
                placeholder="Transcriptions will appear here once processing completes."
                readOnly
              />
            ) : (
              <div
                className="markdown-preview"
                tabIndex={0}
                aria-live="polite"
              >
                {transcription ? (
                  <Markdown>{transcription}</Markdown>
                ) : (
                  <p className="placeholder-text">
                    Transcriptions will appear here once processing completes.
                  </p>
                )}
              </div>
            )}
            {transcriptionError && (
              <div className="alert error" role="alert">
                {transcriptionError}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
