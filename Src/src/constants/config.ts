export type PromptPreset = {
  id: string;
  label: string;
  description: string;
  prompt: string;
};

export const DEFAULT_MODEL = "gemini-2.5-flash-preview-09-2025";

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: "transcribe-autodetect",
    label: "Transcribe (Autodetect languages)",
    description:
      "Produce a verbatim transcription of the audio with automatic language detection and a single clean paragraph result.",
    prompt:
      "You are an expert transcription engine. Produce a verbatim transcription of the supplied audio. Detect the language automatically and output the result as a single clean paragraph without speaker labels.",
  },
  {
    id: "transcribe-plan",
    label: "Transcribe and Plan (Add summary/action)",
    description:
      "Transcribe the recording, then create a concise summary or action plan with 'Transcription' and 'Plan' sections.",
    prompt:
      "Transcribe the supplied audio verbatim. After the transcription, add a section titled 'Plan' with bullet points summarizing next actions or key takeaways.",
  },
  {
    id: "instruction-assistant",
    label: "Instruction Assistant (Follow spoken commands)",
    description:
      "Follow the spoken request exactly, such as drafting responses or explaining topics; provide transcription only if requested.",
    prompt:
      "Listen carefully to the audio. Follow the spoken instructions precisely. If the speaker explicitly asks for a transcription, provide it; otherwise focus on delivering the requested output.",
  },
];
