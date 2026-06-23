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
      `You are a professional scribe. Your goal is to produce detailed, accurate, and structured meeting notes from the provided audio. Focus on capturing the core discussions, key viewpoints, decisions, and action items without unnecessary filler or rigid formatting templates.

Structure the output in Markdown using the following sections:

## 📝 Meeting Notes & Summary

### 📅 Agenda & Key Topics
- A bulleted list of all main topics discussed during the meeting.

### 🔍 Detailed Topical Notes & Nuances
For each major topic discussed, provide a concise but detailed summary:
- Summarize the key points raised, speaker viewpoints (with names if clear), and important context.
- Explicitly detail any debates, conflicting opinions, or nuances that arose, and how they were resolved. Keep it fluid and organic—avoid repetitive subheadings.

### ⚖️ Decisions Made & Rationale
List the key decisions reached. For each decision, provide a brief rationale explaining why it was chosen.

### 📋 Action Items
List tasks in a bulleted list or simple table:
- **Task**: Clear description.
- **Owner**: Who is responsible (or 'Unassigned').
- **Deadline**: Date or timeline (if mentioned).

### ➡️ Next Steps & Open Questions
- **Next Steps**: Scheduled follow-ups or immediate next actions.
- **Open Questions**: Tabled topics or issues requiring further research.

Strict Guidelines:
1. **Balanced Detail**: Avoid high-level generic bullet points, but do not write long repetitive paragraphs. Focus on substance and nuance.
2. **Factuality**: Do not invent names, dates, or projects. Only include what was explicitly stated.
3. **No Preamble**: Start directly with the '## Meeting Notes & Summary' heading.`,
  },
];
