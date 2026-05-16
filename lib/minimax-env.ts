/**
 * MiniMax credentials from .env.local only (loaded by Next.js at runtime).
 */

export interface MiniMaxEnvConfig {
  apiKey: string;
  groupId: string | null;
  model: string;
  apiUrl: string;
}

const DEFAULT_API_URL = "https://api.minimax.io/v1/text/chatcompletion_v2";
const DEFAULT_MODEL = "MiniMax-M2.7";

export function getMiniMaxEnvConfig(): MiniMaxEnvConfig {
  const apiKey = process.env.MINIMAX_API_KEY?.trim() ?? "";
  if (!apiKey) {
    throw new Error(
      "MINIMAX_API_KEY is not configured. Add it to .env.local and restart the dev server.",
    );
  }

  const groupId = process.env.MINIMAX_GROUP_ID?.trim() || null;
  const model = process.env.MINIMAX_MODEL?.trim() || DEFAULT_MODEL;
  const apiUrl = process.env.MINIMAX_API_URL?.trim() || DEFAULT_API_URL;

  return { apiKey, groupId, model, apiUrl };
}

/** Dev-only: log config presence without secrets. */
export function logMiniMaxEnvStatus(context: string): void {
  if (process.env.NODE_ENV === "production") return;
  const hasKey = Boolean(process.env.MINIMAX_API_KEY?.trim());
  const hasGroup = Boolean(process.env.MINIMAX_GROUP_ID?.trim());
  const model = process.env.MINIMAX_MODEL?.trim() || DEFAULT_MODEL;
  const url =
    process.env.MINIMAX_API_URL?.trim() || DEFAULT_API_URL;
  console.log(
    `[MiniMax ${context}] url=${url} model=${model} apiKey=${hasKey ? "set" : "missing"} groupId=${hasGroup ? "set" : "missing"}`,
  );
}
