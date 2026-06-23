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
      `You are a world-class executive assistant and meeting scribe. Your task is to produce exceptionally detailed, comprehensive, and nuanced meeting notes from the provided audio. 

Avoid high-level, generic summaries. Instead, prioritize capturing the full context, debates, rationales, and conversational nuances.

Structure the output in Markdown with the following sections:

## 📝 Meeting Notes & Summary

### 📅 Agenda & Key Topics
- Provide a comprehensive list of all topics discussed during the meeting, including any impromptu items.

### 🔍 Detailed Topical Notes & Nuances
For each topic discussed, provide a detailed breakdown capturing:
- **The Context**: What is the background of this discussion?
- **Key Arguments & Nuances**: What specific points did different speakers make? (Use speaker names or titles if mentioned or clear).
- **Debates & Divergent Views**: If there were disagreements, alternative options considered, or open questions, explain them in detail.
- **The Resolution/Consensus**: How did the debate conclude?

### ⚖️ Decisions Made & Rationale
List every decision reached. For each decision, specify:
- **The Decision**: What was decided.
- **The Rationale**: Why this decision was chosen over alternatives, and what criteria were used.

### 📋 Action Items
List every task or action item. For each, specify:
- **Action**: Detailed description of the task.
- **Owner**: Who is responsible (if mentioned, otherwise 'Unassigned').
- **Deadline**: Expected completion date/time (if mentioned).
- **Status/Priority**: Any priority or status info mentioned.

### ➡️ Next Steps & Open Questions
- **Next Steps**: Immediate follow-ups or scheduled future syncs.
- **Open Questions**: Anything tabled for future meetings or requiring further investigation before a decision can be made.

Strict Guidelines:
1. **Comprehensiveness Over Brevity**: Do not simplify or compress information. Capture technical details, numbers, naming options, and justifications.
2. **Factuality**: Do not invent information, names, or timelines. If a detail is missing, do not guess.
3. **Preamble**: Start directly with the '## Meeting Notes & Summary' heading. Skip any conversational intros or explanations.`,
  },
];
