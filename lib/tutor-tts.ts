import { synthesizeSpeech, type TtsQuality } from "@/lib/minimax-tts";
import { stripForSpeech } from "@/lib/tutor-voice";

export interface TutorSpeechPayload {
  spokenText: string;
  audioBase64: string | null;
  audioMime: string;
}

/**
 * Generates MiniMax TTS audio for a tutor reply (text shown + speech played).
 */
export async function buildTutorSpeechPayload(
  replyText: string,
  quality: TtsQuality = "hd",
): Promise<TutorSpeechPayload> {
  const spokenText = stripForSpeech(replyText);
  let audioBase64: string | null = null;

  if (spokenText) {
    try {
      const audioBuffer = await synthesizeSpeech(spokenText, quality);
      if (audioBuffer.length > 0) {
        audioBase64 = audioBuffer.toString("base64");
      }
    } catch (error) {
      console.error("MiniMax TTS failed:", error);
    }
  }

  return {
    spokenText,
    audioBase64,
    audioMime: "audio/mpeg",
  };
}
