import React from "react";
import { useCurrentFrame } from "remotion";
import { RemotionApp, type RemotionAppProps } from "../components/RemotionApp";
import { Cursor } from "../components/Cursor";
import { CursorTooltip } from "../components/CursorTooltip";
import { ScreenshotOverlay } from "../components/ScreenshotOverlay";
import { DropdownOverlay } from "../components/DropdownOverlay";

const SCENE_6_FULL = `The quarterly review meeting is scheduled for next Tuesday at 2 PM. We need to finalize the budget proposal before Friday. Sarah will handle the vendor outreach.`;

const SCENE_7_FULL = `The quarterly review meeting is scheduled for next Tuesday at 2 PM. We need to finalize the budget proposal before Friday. Sarah will handle the vendor outreach.

## Plan
- Finalize budget proposal — deadline: Friday
- Sarah: handle vendor outreach`;

const SCENE_8_FULL = `\`\`\`typescript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));
\`\`\``;

function typewriter(fullText: string, localFrame: number, speed = 3): string {
  const chars = Math.floor(localFrame * speed);
  return fullText.slice(0, chars);
}

// Cursor timeline: frame → {x, y}
// Positions calibrated for 1920×1080 — x/y land on the center of target elements
const CURSOR_TIMELINE = [
  { frame: 0, x: 1850, y: 60 },       // offscreen top-right
  { frame: 20, x: 1850, y: 60 },      // still offscreen
  { frame: 40, x: 400, y: 636 },      // move to "Get a free Gemini Key"
  { frame: 70, x: 400, y: 636 },      // hover get key
  { frame: 85, x: 960, y: 540 },      // move to center (screenshot)
  { frame: 115, x: 960, y: 540 },     // center for screenshot
  { frame: 130, x: 485, y: 580 },     // move to API key input
  { frame: 145, x: 485, y: 580 },     // at input
  { frame: 160, x: 130, y: 640 },     // move to Save button
  { frame: 175, x: 130, y: 640 },     // at save
  { frame: 190, x: 186, y: 188 },     // move to Start Recording
  { frame: 205, x: 186, y: 188 },     // at start recording
  { frame: 250, x: 186, y: 188 },     // still there (recording)
  { frame: 295, x: 186, y: 188 },     // still there (stop)
  { frame: 310, x: 485, y: 188 },     // move to Run
  { frame: 340, x: 485, y: 188 },     // at run
  { frame: 475, x: 485, y: 188 },     // still at run (processing + transcription)
  { frame: 490, x: 605, y: 280 },     // move to prompt select
  { frame: 645, x: 605, y: 280 },     // at prompt select (dropdown + presets)
  { frame: 660, x: 1850, y: 60 },     // offscreen
  { frame: 690, x: 1850, y: 60 },     // offscreen
];

function getCursorPosition(frame: number): { x: number; y: number } {
  const tl = CURSOR_TIMELINE;
  if (frame <= tl[0].frame) return { x: tl[0].x, y: tl[0].y };
  if (frame >= tl[tl.length - 1].frame)
    return { x: tl[tl.length - 1].x, y: tl[tl.length - 1].y };

  for (let i = 0; i < tl.length - 1; i++) {
    if (frame >= tl[i].frame && frame < tl[i + 1].frame) {
      const t =
        (frame - tl[i].frame) / (tl[i + 1].frame - tl[i].frame);
      return {
        x: tl[i].x + (tl[i + 1].x - tl[i].x) * t,
        y: tl[i].y + (tl[i + 1].y - tl[i].y) * t,
      };
    }
  }
  return { x: tl[tl.length - 1].x, y: tl[tl.length - 1].y };
}

const PHASE_TEXT: { start: number; end: number; text: string }[] = [
  { start: 0, end: 20, text: "Open-Transcribe — Browser-based voice AI" },
  { start: 20, end: 70, text: "Get your free Gemini API key" },
  { start: 70, end: 115, text: "Create one at aistudio.google.com" },
  { start: 115, end: 145, text: "Paste it in the settings" },
  { start: 145, end: 190, text: "Save your key" },
  { start: 190, end: 220, text: "API ready — start recording" },
  { start: 220, end: 250, text: "Click Start Recording" },
  { start: 250, end: 295, text: "Recording your voice..." },
  { start: 295, end: 340, text: "Stop when you're done" },
  { start: 340, end: 370, text: "Hit Run to transcribe" },
  { start: 370, end: 415, text: "Gemini processes your audio..." },
  { start: 415, end: 475, text: "Clean transcription — no fillers" },
  { start: 475, end: 520, text: "Switch between 3 presets" },
  { start: 520, end: 580, text: "Transcribe & Plan — action items" },
  { start: 580, end: 645, text: "Instruction Assistant — voice to code" },
  { start: 645, end: 690, text: "open-transcribe.netlify.app" },
];

function getPhaseText(frame: number): string {
  for (const phase of PHASE_TEXT) {
    if (frame >= phase.start && frame < phase.end) {
      return phase.text;
    }
  }
  return "";
}

const baseProps: RemotionAppProps = {
  recordingState: "idle",
  apiKey: "",
  isEditingApiKey: true,
  promptId: "transcribe-autodetect",
  transcription: "",
  transcriptionStatus: null,
  transcriptionError: null,
  lastRecording: null,
  isTranscribing: false,
  routerState: null,
  usageCounts: {},
  showRaw: false,
};

export const PromoVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { x: cursorX, y: cursorY } = getCursorPosition(frame);
  const tooltipText = getPhaseText(frame);

  // Determine hovered button based on cursor proximity and phase
  let hoveredButton: string | null = null;
  if (frame >= 40 && frame < 70) hoveredButton = "getGeminiKey";
  else if (frame >= 160 && frame < 175) hoveredButton = "saveApiKey";
  else if (frame >= 190 && frame < 295) hoveredButton = "startRecording";
  else if (frame >= 310 && frame < 475) hoveredButton = "run";

  // Determine app state
  let props = { ...baseProps };
  let showScreenshot = false;
  let showDropdown = false;

  if (frame < 20) {
    // Intro — empty state
  } else if (frame < 70) {
    // Hover get key
    props.apiKey = "";
    props.isEditingApiKey = true;
    props.transcriptionStatus = "API: Required";
  } else if (frame < 130) {
    // Screenshot shown
    showScreenshot = true;
    props.apiKey = "";
    props.isEditingApiKey = true;
    props.transcriptionStatus = "API: Required";
  } else if (frame < 145) {
    // Cursor to input
    props.apiKey = "";
    props.isEditingApiKey = true;
    props.transcriptionStatus = "API: Required";
  } else if (frame < 190) {
    // API key filled
    props.apiKey = "AIzaSy••••••••••••••••";
    props.isEditingApiKey = true;
    props.transcriptionStatus = "API: Required";
  } else if (frame < 220) {
    // Save clicked, API configured
    props.apiKey = "AIzaSy••••••••••••••••";
    props.isEditingApiKey = false;
    props.transcriptionStatus = "API: Configured";
    props.usageCounts = { "gemini-3.1-flash-lite": 0 };
  } else if (frame < 250) {
    // Cursor to start recording
    props.apiKey = "AIzaSy••••••••••••••••";
    props.isEditingApiKey = false;
    props.transcriptionStatus = "API: Configured";
    props.usageCounts = { "gemini-3.1-flash-lite": 0 };
  } else if (frame < 295) {
    // Recording
    props.apiKey = "AIzaSy••••••••••••••••";
    props.isEditingApiKey = false;
    props.recordingState = "recording";
    props.transcriptionStatus = "🔴 Recording";
    props.usageCounts = { "gemini-3.1-flash-lite": 0 };
  } else if (frame < 340) {
    // Stop, capture shown
    props.apiKey = "AIzaSy••••••••••••••••";
    props.isEditingApiKey = false;
    props.recordingState = "idle";
    props.lastRecording = { durationMs: 5200, format: "webm" };
    props.transcriptionStatus = "Recording captured. Ready to transcribe.";
    props.usageCounts = { "gemini-3.1-flash-lite": 0 };
  } else if (frame < 370) {
    // Cursor to run
    props.apiKey = "AIzaSy••••••••••••••••";
    props.isEditingApiKey = false;
    props.recordingState = "idle";
    props.lastRecording = { durationMs: 5200, format: "webm" };
    props.transcriptionStatus = "Recording captured. Ready to transcribe.";
    props.usageCounts = { "gemini-3.1-flash-lite": 0 };
  } else if (frame < 415) {
    // Processing
    props.apiKey = "AIzaSy••••••••••••••••";
    props.isEditingApiKey = false;
    props.recordingState = "idle";
    props.lastRecording = { durationMs: 5200, format: "webm" };
    props.isTranscribing = true;
    props.transcriptionStatus = "Sending audio to Gemini…";
    props.usageCounts = { "gemini-3.1-flash-lite": 0 };
  } else if (frame < 475) {
    // Transcription result
    const localFrame = frame - 415;
    props.apiKey = "AIzaSy••••••••••••••••";
    props.isEditingApiKey = false;
    props.recordingState = "idle";
    props.lastRecording = { durationMs: 5200, format: "webm" };
    props.promptId = "transcribe-autodetect";
    props.transcription = typewriter(SCENE_6_FULL, localFrame, 4);
    props.transcriptionStatus = "Done via 3.1 Flash-Lite.";
    props.usageCounts = { "gemini-3.1-flash-lite": 1 };
    props.showRaw = false;
  } else if (frame < 520) {
    // Dropdown open
    props.apiKey = "AIzaSy••••••••••••••••";
    props.isEditingApiKey = false;
    props.recordingState = "idle";
    props.lastRecording = { durationMs: 5200, format: "webm" };
    props.promptId = "transcribe-autodetect";
    props.transcription = SCENE_6_FULL;
    props.transcriptionStatus = "Done via 3.1 Flash-Lite.";
    props.usageCounts = { "gemini-3.1-flash-lite": 1 };
    props.showRaw = false;
    showDropdown = true;
  } else if (frame < 580) {
    // Plan preset
    const localFrame = frame - 520;
    props.apiKey = "AIzaSy••••••••••••••••";
    props.isEditingApiKey = false;
    props.recordingState = "idle";
    props.lastRecording = { durationMs: 5200, format: "webm" };
    props.promptId = "transcribe-plan";
    props.transcription = typewriter(SCENE_7_FULL, localFrame, 5);
    props.transcriptionStatus = "Done via 3.1 Flash-Lite.";
    props.usageCounts = { "gemini-3.1-flash-lite": 2 };
    props.showRaw = false;
  } else if (frame < 645) {
    // Instruction preset
    const localFrame = frame - 580;
    props.apiKey = "AIzaSy••••••••••••••••";
    props.isEditingApiKey = false;
    props.recordingState = "idle";
    props.lastRecording = { durationMs: 5200, format: "webm" };
    props.promptId = "instruction-assistant";
    props.transcription = typewriter(SCENE_8_FULL, localFrame, 3);
    props.transcriptionStatus = "Done via 3.1 Flash-Lite.";
    props.usageCounts = { "gemini-3.1-flash-lite": 3 };
    props.showRaw = false;
  } else {
    // Outro
    props.apiKey = "AIzaSy••••••••••••••••";
    props.isEditingApiKey = false;
    props.recordingState = "idle";
    props.lastRecording = { durationMs: 5200, format: "webm" };
    props.promptId = "instruction-assistant";
    props.transcription = SCENE_8_FULL;
    props.transcriptionStatus = "Done via 3.1 Flash-Lite.";
    props.usageCounts = { "gemini-3.1-flash-lite": 3 };
    props.showRaw = false;
  }

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: "#0b0f14",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <RemotionApp {...props} hoveredButton={hoveredButton} />

      {showScreenshot && (
        <ScreenshotOverlay visible={true} startFrame={70} />
      )}

      {showDropdown && (
        <DropdownOverlay visible={true} startFrame={475} />
      )}

      <Cursor x={cursorX} y={cursorY} />

      <CursorTooltip x={cursorX} y={cursorY} text={tooltipText} />
    </div>
  );
};
