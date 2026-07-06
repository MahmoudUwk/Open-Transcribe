export type PromptPreset = {
  id: string;
  label: string;
  description: string;
  prompt: string;
  /**
   * When set, enables Gemini's reasoning/thinking at the given level for this
   * preset. Used by Meeting Notes to force internal transcription before
   * note generation. Only effective on thinking-capable models.
   */
  thinking?: "low" | "medium" | "high";
};

export type ModelInfo = {
  id: string;
  label: string;
  rpd: number;
  /**
   * Whether this model supports Gemini's thinking/reasoning feature.
   * Flash-Lite variants do NOT think; Flash/Pro variants do.
   * When a preset requests `thinking`, thinking-capable models are tried first.
   */
  thinkingCapable?: boolean;
};

export const MODEL_POOL: ModelInfo[] = [
  { id: "gemini-3.1-flash-lite", label: "3.1 Flash-Lite", rpd: 500, thinkingCapable: false },
  { id: "gemini-3.5-flash", label: "3.5 Flash", rpd: 20, thinkingCapable: true },
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
    label: "Meeting Notes (raw audio → notes)",
    description:
      "Sends raw audio directly. The model transcribes internally in its reasoning, then outputs only structured notes — no transcript in the output. Uses a thinking-capable model automatically.",
    thinking: "high",
    prompt:
      `You are a professional meeting scribe.

STEP 1 — INTERNAL (do NOT include in your response): In your reasoning, produce a complete, accurate verbatim transcript of the audio. This internal transcript is for your own reference only and must NOT appear in your output. It is the sole source you may use for Step 2.

STEP 2 — OUTPUT: Using ONLY your internal transcript from Step 1, produce a concise, structured Meeting Report. Output ONLY the report below — never include the raw transcript, a "Transcription" section, or any verbatim copy of what was said.

Format your output exactly according to this template:

## ⚡ Executive Summary
- [1-2 sentences summarizing the main outcome of the meeting.]

## 🔍 Key Discussions & Nuances
- For each major topic discussed, use this inline format:
  * **[Topic Name]**: [Core consensus or main point]. *Nuance:* [1-2 sentences detailing the debates, divergent viewpoints, or alternatives discussed].

## ⚖️ Decisions & Rationales
- List decisions inline:
  1. **[Decision]** — *Rationale:* [Short explanation of why this was chosen over alternatives].

## 📋 Action Items
- Provide a markdown table:
  | Task | Owner | Deadline |
  | :--- | :--- | :--- |
  | [Task description] | [Name or 'Unassigned'] | [Date or 'TBD'] |

## ➡️ Next Steps & Open Questions
* **Next Steps**: [Immediate follow-up actions]
* **Open Questions**: [Tabled items or issues requiring further research]

Strict Guidelines:
1. **No Transcript**: The raw transcript must stay in your reasoning. The output starts directly with the '## ⚡ Executive Summary' heading.
2. **Grounded Only**: Everything in the report must be derived from what was actually said in the audio. Do NOT invent content.
3. **Inline Density**: Pack debates/nuances strictly into the '*Nuance:*' inline sentence — no nested bullet lists under topics.
4. **Non-Meeting Audio**: If the audio is not a meeting or contains no meeting-worthy content, output exactly: "No meeting content detected in this audio."`,
  },
];
