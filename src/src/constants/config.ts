export type PromptPreset = {
  id: string;
  label: string;
  description: string;
  prompt: string;
};

export type ModelInfo = {
  id: string;
  label: string;
  rpd: number;
};

export const MODEL_POOL: ModelInfo[] = [
  { id: "gemini-3.1-flash-lite", label: "3.1 Flash-Lite", rpd: 500 },
  { id: "gemini-3-flash-preview", label: "3 Flash Preview", rpd: 20 },
];

export const DEFAULT_MODEL = MODEL_POOL[0].id;

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: "transcribe-autodetect",
    label: "Transcribe (Autodetect languages)",
    description:
      "Accurate transcription with automatic language detection. Removes filler words, stutters, and false starts while preserving the speaker's exact meaning.",
    prompt:
      "You are an expert transcription engine. Transcribe the supplied audio accurately, detecting the language automatically. Remove filler words (um, uh, like, you know), stutters, repeated phrases, false starts, and verbal hiccups — but do NOT alter the speaker's meaning or add any words they did not intend. Output the result as a single clean paragraph without speaker labels.",
  },
  {
    id: "transcribe-plan",
    label: "Transcribe and Plan (Action items from audio)",
    description:
      "Transcribe the recording, then extract a structured action plan with only what was said — no added suggestions or assumptions.",
    prompt:
      "You are an expert transcription and planning assistant. First, transcribe the supplied audio accurately, removing filler words, stutters, and false starts. Then add a section titled 'Plan'. The plan must: (1) extract only concrete tasks, decisions, or steps the speaker actually mentioned — do NOT invent, suggest, or assume anything the speaker did not say, (2) be formatted as bullet points, (3) preserve any priorities, deadlines, or assignments the speaker specified. If the speaker did not mention any actionable items, write 'No action items found' under the Plan heading instead of making them up.",
  },
  {
    id: "instruction-assistant",
    label: "Instruction Assistant (Do what you hear)",
    description:
      "Execute whatever the speaker asks — write code, draft text, explain concepts, plan projects. The audio is a voice command, not a thing to transcribe.",
    prompt:
      "The supplied audio contains a spoken instruction or request from the user. Execute it precisely. Common examples: write or debug code, draft an email or message, explain a concept, create a plan or outline, answer a question. Treat the audio as a voice command directed at you — respond with the requested output directly. Do NOT transcribe the audio unless the speaker explicitly asks for a transcription.",
  },
];
