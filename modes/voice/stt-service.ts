import fs from "node:fs";
import { execSync } from "node:child_process";
import { loadConfig } from "../../config/config.ts";

export interface TranscribeOptions {
  filePath: string;
}

export class SttService {
  constructor() {}

  public async transcribe(options: TranscribeOptions): Promise<string> {
    const config = loadConfig();
    const provider =
      !config.speechToTextProvider || config.speechToTextProvider === "browser"
        ? "whisper"
        : config.speechToTextProvider;

    if (provider === "whisper") {
      const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OpenAI API key not configured for STT Whisper.");
      }

      const formData = new FormData();
      formData.append("file", Bun.file(options.filePath));
      formData.append("model", "whisper-1");

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`OpenAI Whisper request failed: ${response.status}`);
      }

      const data = await response.json() as { text: string };
      return data.text || "";
    }

    if (provider === "deepgram") {
      const apiKey = config.deepgramApiKey || process.env.DEEPGRAM_API_KEY;
      if (!apiKey) {
        throw new Error("Deepgram API key not configured for STT.");
      }

      const fileBuffer = fs.readFileSync(options.filePath);
      const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true", {
        method: "POST",
        headers: {
          "Authorization": `Token ${apiKey}`,
          "Content-Type": "audio/wav"
        },
        body: fileBuffer
      });

      if (!response.ok) {
        throw new Error(`Deepgram request failed: ${response.status}`);
      }

      const data = await response.json() as any;
      return data.results?.channels[0]?.alternatives[0]?.transcript || "";
    }

    if (provider === "assemblyai") {
      const apiKey = config.assemblyaiApiKey || process.env.ASSEMBLYAI_API_KEY;
      if (!apiKey) {
        throw new Error("AssemblyAI API key not configured for STT.");
      }

      const fileBuffer = fs.readFileSync(options.filePath);

      // Step 1: Upload
      const uploadResponse = await fetch("https://api.assemblyai.com/v2/upload", {
        method: "POST",
        headers: {
          "Authorization": apiKey,
          "Content-Type": "application/octet-stream"
        },
        body: fileBuffer
      });

      if (!uploadResponse.ok) {
        throw new Error(`AssemblyAI upload failed: ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json() as { upload_url: string };
      const uploadUrl = uploadData.upload_url;

      // Step 2: Transcribe
      const transcriptResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST",
        headers: {
          "Authorization": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ audio_url: uploadUrl })
      });

      if (!transcriptResponse.ok) {
        throw new Error(`AssemblyAI transcription request failed: ${transcriptResponse.status}`);
      }

      let transcriptData = await transcriptResponse.json() as { id: string; status: string; text?: string; error?: string };
      const transcriptId = transcriptData.id;

      // Step 3: Poll
      while (transcriptData.status === "queued" || transcriptData.status === "processing") {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: { "Authorization": apiKey }
        });
        transcriptData = await pollResponse.json() as any;
      }

      if (transcriptData.status === "completed") {
        return transcriptData.text || "";
      } else {
        throw new Error(`AssemblyAI transcription failed: ${transcriptData.error}`);
      }
    }

    if (provider === "whisper.cpp") {
      try {
        const outputTxtPath = options.filePath.replace(/\.[^/.]+$/, "");
        execSync(`whisper-cli -m ggml-base.en.bin -f "${options.filePath}" -otxt -of "${outputTxtPath}"`, { stdio: "ignore" });
        const txtFile = `${outputTxtPath}.txt`;
        if (fs.existsSync(txtFile)) {
          const text = fs.readFileSync(txtFile, "utf-8").trim();
          fs.unlinkSync(txtFile);
          return text;
        }
        throw new Error("Whisper.cpp output file not generated.");
      } catch (e: any) {
        throw new Error(`Whisper.cpp failed: ${e.message}`);
      }
    }

    throw new Error(`Unknown Speech-To-Text provider: ${provider}`);
  }
}
