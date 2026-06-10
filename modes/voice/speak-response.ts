import os from "node:os";
import path from "node:path";

import { loadConfig } from "../../config/config.ts";
import { TtsService } from "./tts-service.ts";
import { AudioPlayer } from "./audio-player.ts";

function truncateForSpeech(text: string, maxChars = 800): string {
  const cleaned = text.replace(/[#*`_~[\]]/g, " ").replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxChars) return cleaned;
  return `${cleaned.slice(0, maxChars)}...`;
}

export async function speakResponse(text: string): Promise<void> {
  const config = loadConfig();
  if (config.voiceOutput === false) return;
  if ((config.textToSpeechProvider || "edge-tts") === "none") return;

  const tempPath = path.join(os.tmpdir(), "vorexis_claw_tts.mp3");
  const tts = new TtsService();
  const player = new AudioPlayer();

  try {
    await tts.synthesize({ text: truncateForSpeech(text), outputPath: tempPath });
    await player.play(tempPath);
  } catch {
    // Voice output is optional; failures should not interrupt the session.
  }
}
