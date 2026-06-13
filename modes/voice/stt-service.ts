import fs from "node:fs";
import { execSync } from "node:child_process";
import { loadConfig, type VorexisConfig } from "../../config/config.ts";

export interface TranscribeOptions {
  filePath: string;
}

export function whisperCppAvailable(): boolean {
  try {
    if (process.platform === "win32") {
      execSync("where whisper-cli", { stdio: "ignore" });
    } else {
      execSync("which whisper-cli", { stdio: "ignore" });
    }
    return true;
  } catch {
    return false;
  }
}

export function resolveSttProvider(config: VorexisConfig = loadConfig()): string {
  let provider =
    !config.speechToTextProvider || config.speechToTextProvider === "browser"
      ? "whisper"
      : config.speechToTextProvider;

  if (provider === "whisper") {
    const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey && whisperCppAvailable()) {
      return "whisper.cpp";
    }
  }

  return provider;
}

export function getSttReadiness(config: VorexisConfig = loadConfig()): {
  ok: boolean;
  provider: string;
  message?: string;
} {
  const provider = resolveSttProvider(config);

  if (provider === "whisper") {
    const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        provider,
        message:
          "OpenAI API key required for Whisper STT. Run: vorexis-claw settings (pick whisper.cpp for local, or add openaiApiKey).",
      };
    }
  }

  if (provider === "deepgram" && !(config.deepgramApiKey || process.env.DEEPGRAM_API_KEY)) {
    return { ok: false, provider, message: "Deepgram API key not configured. Run: vorexis-claw settings" };
  }

  if (provider === "assemblyai" && !(config.assemblyaiApiKey || process.env.ASSEMBLYAI_API_KEY)) {
    return { ok: false, provider, message: "AssemblyAI API key not configured. Run: vorexis-claw settings" };
  }

  if (provider === "whisper.cpp" && !whisperCppAvailable()) {
    return {
      ok: false,
      provider,
      message: "whisper-cli not found on PATH. Install whisper.cpp or switch STT in: vorexis-claw settings",
    };
  }

  return { ok: true, provider };
}

export class SttService {
  public async transcribe(options: TranscribeOptions): Promise<string> {
    const config = loadConfig();
    const readiness = getSttReadiness(config);
    if (!readiness.ok) {
      throw new Error(readiness.message || "Speech-to-text is not configured.");
    }

    const provider = readiness.provider;

    if (provider === "whisper") {
      const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY!;

      const formData = new FormData();
      formData.append("file", Bun.file(options.filePath));
      formData.append("model", "whisper-1");

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OpenAI Whisper request failed: ${response.status}`);
      }

      const data = (await response.json()) as { text: string };
      return data.text || "";
    }

    if (provider === "deepgram") {
      const apiKey = config.deepgramApiKey || process.env.DEEPGRAM_API_KEY!;

      const fileBuffer = fs.readFileSync(options.filePath);
      const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true", {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "audio/wav",
        },
        body: fileBuffer,
      });

      if (!response.ok) {
        throw new Error(`Deepgram request failed: ${response.status}`);
      }

      const data = (await response.json()) as {
        results?: { channels: { alternatives: { transcript: string }[] }[] };
      };
      return data.results?.channels[0]?.alternatives[0]?.transcript || "";
    }

    if (provider === "assemblyai") {
      const apiKey = config.assemblyaiApiKey || process.env.ASSEMBLYAI_API_KEY!;

      const fileBuffer = fs.readFileSync(options.filePath);

      const uploadResponse = await fetch("https://api.assemblyai.com/v2/upload", {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/octet-stream",
        },
        body: fileBuffer,
      });

      if (!uploadResponse.ok) {
        throw new Error(`AssemblyAI upload failed: ${uploadResponse.status}`);
      }

      const uploadData = (await uploadResponse.json()) as { upload_url: string };

      const transcriptResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ audio_url: uploadData.upload_url }),
      });

      if (!transcriptResponse.ok) {
        throw new Error(`AssemblyAI transcription request failed: ${transcriptResponse.status}`);
      }

      let transcriptData = (await transcriptResponse.json()) as {
        id: string;
        status: string;
        text?: string;
        error?: string;
      };

      while (transcriptData.status === "queued" || transcriptData.status === "processing") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const pollResponse = await fetch(
          `https://api.assemblyai.com/v2/transcript/${transcriptData.id}`,
          { headers: { Authorization: apiKey } }
        );
        transcriptData = (await pollResponse.json()) as typeof transcriptData;
      }

      if (transcriptData.status === "completed") {
        return transcriptData.text || "";
      }

      throw new Error(`AssemblyAI transcription failed: ${transcriptData.error}`);
    }

    if (provider === "whisper.cpp") {
      try {
        const outputTxtPath = options.filePath.replace(/\.[^/.]+$/, "");
        execSync(
          `whisper-cli -m ggml-base.en.bin -f "${options.filePath}" -otxt -of "${outputTxtPath}"`,
          { stdio: "ignore" }
        );
        const txtFile = `${outputTxtPath}.txt`;
        if (fs.existsSync(txtFile)) {
          const text = fs.readFileSync(txtFile, "utf-8").trim();
          fs.unlinkSync(txtFile);
          return text;
        }
        throw new Error("Whisper.cpp output file not generated.");
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        throw new Error(`Whisper.cpp failed: ${message}`);
      }
    }

    throw new Error(`Unknown Speech-To-Text provider: ${provider}`);
  }
}
