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
      "Polished transcription with auto-language detection. Removes stutters and filler while preserving exact meaning.",
    prompt:
      "You are an expert transcription engine. Transcribe the supplied audio accurately, detecting the language automatically. Remove filler words (um, uh, like, you know), stutters, repeated phrases, false starts, and verbal hiccups — but do NOT alter the speaker's meaning or add any words they did not intend. Output the result in Markdown format. Use a single clean paragraph or appropriate structure based on the content.",
  },
  {
    id: "transcribe-plan",
    label: "Transcribe and Plan (Action items from audio)",
    description:
      "Full transcript with a structured action plan. Captures tasks, decisions, and deadlines exactly as spoken.",
    prompt:
      "You are an expert transcription and planning assistant. First, transcribe the supplied audio accurately, removing filler words, stutters, and false starts. Then add a section titled 'Plan'. Format the entire response in Markdown. The 'Plan' section must: (1) use a ## Plan heading, (2) extract only concrete tasks, decisions, or steps mentioned — do NOT invent anything, (3) use bullet points, (4) preserve any mentioned priorities. If no action items exist, write '*No action items found*' under the Plan heading.",
  },
  {
    id: "instruction-assistant",
    label: "Instruction Assistant (Do what you hear)",
    description:
      "Direct execution of spoken commands. Write code, draft emails, or get answers without needing a transcript.",
    prompt:
      "The supplied audio contains a spoken instruction or request from the user. Execute it precisely. Format your entire response in rich Markdown (using headings, bold text, code blocks, or lists where appropriate). Treat the audio as a voice command directed at you — respond with the requested output directly. Do NOT transcribe the audio unless the speaker explicitly asks for a transcription.",
  },
  {
    id: "meeting-notes",
    label: "Meeting Notes",
    description:
      "Transcribe audio, then restructure as organized meeting notes with agenda, discussion summary, decisions, action items, and next steps.",
    prompt:
      "You are an expert meeting note-taker. First, accurately transcribe the supplied audio. Then, restructure the content into well-organized meeting notes in Markdown format with the following sections: ## Meeting Notes, ### Agenda / Key Topics, ### Discussion Summary, ### Decisions Made, ### Action Items (with owners if mentioned, use bullet points), ### Next Steps. Be concise but comprehensive. Do not invent information not present in the audio. Skip any preamble — output the meeting notes directly.",
  },
];
