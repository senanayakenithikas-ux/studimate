/** Strip markdown so text-to-speech sounds natural. */
export function stripForSpeech(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^[-*•]\s+/gm, "")
    .replace(/^\d+[.)]\s+/gm, "")
    .replace(/^tip:\s*/gim, "Tip. ")
    .replace(/\n\n+/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export const VOICE_SILENCE_MS = 4000;

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    window.SpeechRecognition ?? window.webkitSpeechRecognition,
  );
}

export function getSpeechRecognitionCtor():
  | (new () => SpeechRecognition)
  | null {
  if (typeof window === "undefined") return null;
  const ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  return ctor ?? null;
}

let currentAudio: HTMLAudioElement | null = null;
let audioUnlocked = false;

/** Call from a user gesture (Send / mic) so later async playback is allowed. */
export function unlockAudioPlayback(): void {
  if (typeof window === "undefined" || audioUnlocked) return;
  const audio = new Audio();
  audio.volume = 0.01;
  audio.src =
    "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjEwMAAAAAAAAAAAAAAA//uQxAAAAAANIAAAAAExBTUUzLjEwMA==";
  void audio.play().then(
    () => {
      audioUnlocked = true;
    },
    () => {
      audioUnlocked = true;
    },
  );
}

function stopHtmlAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  stopHtmlAudio();
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Play MP3 from base64 (MiniMax TTS). Uses blob URLs for large responses. */
export function playAudioBase64(
  base64: string,
  mime = "audio/mpeg",
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Audio playback requires a browser"));
      return;
    }

    stopHtmlAudio();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    let objectUrl: string | null = null;
    const audio = new Audio();

    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    };

    try {
      const bytes = base64ToBytes(base64);
      const blob = new Blob([bytes], { type: mime });
      objectUrl = URL.createObjectURL(blob);
      audio.src = objectUrl;
    } catch {
      audio.src = `data:${mime};base64,${base64}`;
    }

    currentAudio = audio;
    audio.onended = () => {
      cleanup();
      currentAudio = null;
      resolve();
    };
    audio.onerror = () => {
      cleanup();
      currentAudio = null;
      reject(new Error("Failed to play tutor audio"));
    };
    void audio.play().catch((err) => {
      cleanup();
      currentAudio = null;
      reject(err);
    });
  });
}

/** Browser fallback when MiniMax TTS is unavailable. */
function speakWithBrowser(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      reject(new Error("Speech synthesis not supported"));
      return;
    }

    stopHtmlAudio();
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.lang = "en-US";

    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang.startsWith("en") && !v.localService) ??
      voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => resolve();
    utterance.onerror = (ev) => {
      const code = (ev as SpeechSynthesisErrorEvent).error ?? "";
      if (code === "interrupted" || code === "canceled") {
        resolve();
        return;
      }
      reject(new Error("Speech playback failed"));
    };

    const speak = () => window.speechSynthesis.speak(utterance);
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        speak();
      };
    }
    requestAnimationFrame(() => requestAnimationFrame(speak));
  });
}

export async function playTutorSpeech(
  spokenText: string,
  audioBase64: string | null | undefined,
  audioMime = "audio/mpeg",
): Promise<void> {
  const text = spokenText.trim();
  if (!text) return;

  if (audioBase64) {
    try {
      await playAudioBase64(audioBase64, audioMime);
      return;
    } catch {
      // fall through to browser TTS
    }
  }

  try {
    await speakWithBrowser(text);
  } catch {
    // Text reply still visible; avoid crashing the UI if audio fails
  }
}
