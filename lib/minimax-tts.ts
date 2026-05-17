import { MiniMaxError } from "@/lib/minimax";

const MINIMAX_TTS_URL =
  process.env.MINIMAX_TTS_URL?.trim() ?? "https://api.minimax.io/v1/t2a_v2";
const MINIMAX_TTS_VOICE =
  process.env.MINIMAX_TTS_VOICE?.trim() ?? "English_expressive_narrator";

const TTS_MODEL_BY_QUALITY = {
  hd: "speech-2.8-hd",
  turbo: "speech-2.8-turbo",
} as const;

export type TtsQuality = keyof typeof TTS_MODEL_BY_QUALITY;

const MAX_TTS_CHARS = 5000;

function resolveTtsModel(quality: TtsQuality): string {
  const envOverride = process.env.MINIMAX_TTS_MODEL?.trim();
  if (envOverride) return envOverride;
  return TTS_MODEL_BY_QUALITY[quality];
}

interface T2aV2Response {
  data?: {
    audio?: string;
    status?: number;
  };
  base_resp?: {
    status_code?: number;
    status_msg?: string;
  };
}

function getApiKey(): string {
  const apiKey = process.env.MINIMAX_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("MINIMAX_API_KEY is not configured");
  }
  return apiKey;
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
  const groupId = process.env.MINIMAX_GROUP_ID?.trim();
  if (groupId) {
    headers["Group-Id"] = groupId;
  }
  return headers;
}

/**
 * MiniMax synchronous text-to-speech (t2a_v2). Returns MP3 bytes.
 * @param quality `hd` → speech-2.8-hd (Text to Speech · HD)
 */
export async function synthesizeSpeech(
  text: string,
  quality: TtsQuality = "hd",
): Promise<Buffer> {
  const trimmed = text.trim().slice(0, MAX_TTS_CHARS);
  if (!trimmed) {
    throw new Error("No text to synthesize");
  }

  if (process.env.MINIMAX_USE_MOCK === "true") {
    return Buffer.alloc(0);
  }

  const res = await fetch(MINIMAX_TTS_URL, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      model: resolveTtsModel(quality),
      text: trimmed,
      stream: false,
      language_boost: "auto",
      output_format: "hex",
      voice_setting: {
        voice_id: MINIMAX_TTS_VOICE,
        speed: 1,
        vol: 1,
        pitch: 0,
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: "mp3",
        channel: 1,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `MiniMax TTS HTTP ${res.status}: ${body.slice(0, 300) || res.statusText}`,
    );
  }

  const data = (await res.json()) as T2aV2Response;

  if (data.base_resp && data.base_resp.status_code !== 0) {
    throw new MiniMaxError(
      data.base_resp.status_code ?? -1,
      data.base_resp.status_msg ?? "TTS failed",
    );
  }

  const hex = data.data?.audio;
  if (!hex || typeof hex !== "string") {
    throw new Error("MiniMax TTS response missing audio data");
  }

  return Buffer.from(hex, "hex");
}
