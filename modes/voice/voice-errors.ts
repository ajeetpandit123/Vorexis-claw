import fs from "node:fs";

const MIN_AUDIO_BYTES = 1500;

export function isSilentRecording(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return true;
  return fs.statSync(filePath).size < MIN_AUDIO_BYTES;
}

export function friendlyVoiceError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  if (
    lower.includes("401") ||
    lower.includes("invalid_api_key") ||
    lower.includes("api key not configured") ||
    lower.includes("incorrect api key")
  ) {
    return "Voice transcription unavailable. Check your STT API key in settings (vorexis-claw settings).";
  }

  if (lower.includes("403") || lower.includes("permission")) {
    return "Voice transcription denied. Check your STT provider permissions.";
  }

  if (lower.includes("timeout") || lower.includes("network") || lower.includes("fetch")) {
    return "Voice transcription timed out. Try again or type your prompt.";
  }

  if (lower.includes("not configured")) {
    return "Voice transcription not configured. Run: vorexis-claw settings";
  }

  return "Could not transcribe audio. Try again or type your prompt.";
}
