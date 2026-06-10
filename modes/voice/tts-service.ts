import fs from "node:fs";
import { EdgeTTS } from "edge-tts-universal";
import { loadConfig } from "../../config/config.ts";

export interface SynthesizeOptions {
  text: string;
  outputPath: string;
}

export class TtsService {
  constructor() {}

  public async synthesize(options: SynthesizeOptions): Promise<void> {
    const config = loadConfig();
    const provider = config.textToSpeechProvider || "edge-tts";

    if (provider === "none") {
      return;
    }

    if (provider === "edge-tts") {
      const tts = new EdgeTTS(options.text, "en-US-AndrewMultilingualNeural");
      const result = await tts.synthesize();
      const buffer = Buffer.from(await result.audio.arrayBuffer());
      fs.writeFileSync(options.outputPath, buffer);
      return;
    }

    if (provider === "openai") {
      const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OpenAI API key not configured for TTS.");
      }

      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "tts-1",
          input: options.text,
          voice: "alloy"
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI TTS request failed: ${response.status} - ${errText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      fs.writeFileSync(options.outputPath, Buffer.from(arrayBuffer));
      return;
    }

    if (provider === "elevenlabs") {
      const apiKey = config.elevenlabsApiKey || process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        throw new Error("ElevenLabs API key not configured for TTS.");
      }

      // Rachel voice as default
      const voiceId = "21m00Tcm4TlvDq8ikWAM";
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: options.text,
          model_id: "eleven_monolingual_v1"
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ElevenLabs TTS request failed: ${response.status} - ${errText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      fs.writeFileSync(options.outputPath, Buffer.from(arrayBuffer));
      return;
    }

    if (provider === "azure") {
      const apiKey = config.azureApiKey || process.env.AZURE_SPEECH_KEY;
      const region = config.azureRegion || process.env.AZURE_SPEECH_REGION;
      if (!apiKey || !region) {
        throw new Error("Azure Speech key or region not configured for TTS.");
      }

      const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
          "User-Agent": "VorexisClaw"
        },
        body: `<speak version='1.0' xml:lang='en-US'><voice xml:lang='en-US' name='en-US-AndrewMultilingualNeural'>${options.text}</voice></speak>`
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Azure TTS request failed: ${response.status} - ${errText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      fs.writeFileSync(options.outputPath, Buffer.from(arrayBuffer));
      return;
    }

    throw new Error(`Unknown Text-To-Speech provider: ${provider}`);
  }
}
