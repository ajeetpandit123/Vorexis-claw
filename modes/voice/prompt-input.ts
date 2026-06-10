import chalk from "chalk";
import readline from "node:readline";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { text, isCancel } from "@clack/prompts";

import { loadConfig } from "../../config/config.ts";
import { AudioRecorder } from "./audio-recorder.ts";
import { SttService } from "./stt-service.ts";
import { friendlyVoiceError, isSilentRecording } from "./voice-errors.ts";

export interface PromptWithVoiceOptions {
  message: string;
  placeholder?: string;
}

export function isVoiceEnabled(): boolean {
  const config = loadConfig();
  return config.voiceEnabled !== false;
}

export function printVoiceBanner(): void {
  if (!isVoiceEnabled()) return;
  console.log(chalk.cyan("🎤 Voice Available"));
  console.log(chalk.dim("V → Start recording · ENTER → Stop & submit · ESC → Cancel recording"));
  console.log();
}

export async function promptWithVoice(
  options: PromptWithVoiceOptions
): Promise<string | null> {
  if (!isVoiceEnabled()) {
    const result = await text({
      message: options.message,
      placeholder: options.placeholder,
    });
    if (isCancel(result) || !result.trim()) return null;
    return result.trim();
  }

  console.log(chalk.bold(options.message));
  if (options.placeholder) {
    console.log(chalk.dim(options.placeholder));
  }
  process.stdout.write(chalk.dim("> "));

  if (!process.stdin.isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
      rl.on("line", (line) => {
        rl.close();
        resolve(line.trim() || null);
      });
    });
  }

  const recorder = new AudioRecorder();
  const stt = new SttService();
  const tempMicPath = path.join(os.tmpdir(), "vorexis_claw_mic.wav");

  let buffer = "";
  let isRecording = false;

  readline.emitKeypressEvents(process.stdin);
  const wasRaw = process.stdin.isRaw;
  process.stdin.setRawMode(true);
  process.stdin.resume();

  return new Promise((resolve) => {
    const cleanup = () => {
      process.stdin.removeListener("keypress", onKeypress);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(wasRaw ?? false);
      }
    };

    const finish = (result: string | null) => {
      cleanup();
      console.log();
      resolve(result);
    };

    const cancelRecording = async () => {
      if (!isRecording) return;
      isRecording = false;
      try {
        await recorder.stop();
      } catch {
        // Ignore stop errors when cancelling
      }
      if (fs.existsSync(tempMicPath)) {
        try {
          fs.unlinkSync(tempMicPath);
        } catch {
          // Ignore cleanup errors
        }
      }
      process.stdout.write(chalk.dim("\nRecording cancelled.\n> "));
    };

    const startRecording = async () => {
      if (isRecording) return;
      isRecording = true;
      buffer = "";
      process.stdout.write(chalk.red("\n🎙 Recording... (ENTER to stop, ESC to cancel)\n"));
      try {
        await recorder.start({ outputPath: tempMicPath });
      } catch {
        isRecording = false;
        process.stdout.write(chalk.yellow("\nCould not start recording. Try again or type your prompt.\n> "));
      }
    };

    const cleanupMicFile = () => {
      if (fs.existsSync(tempMicPath)) {
        try {
          fs.unlinkSync(tempMicPath);
        } catch {
          // Ignore cleanup errors
        }
      }
    };

    const stopAndTranscribe = async (): Promise<string | null> => {
      if (!isRecording) return null;
      isRecording = false;

      try {
        await recorder.stop();
      } catch {
        cleanupMicFile();
        process.stdout.write(chalk.yellow("\nCould not process recording. Try again or type your prompt.\n> "));
        return null;
      }

      if (isSilentRecording(tempMicPath)) {
        cleanupMicFile();
        process.stdout.write(chalk.dim("\nNo speech detected.\n> "));
        return null;
      }

      process.stdout.write(chalk.yellow("Transcribing...\n"));
      try {
        const transcript = (await stt.transcribe({ filePath: tempMicPath })).trim();
        cleanupMicFile();
        if (!transcript) {
          process.stdout.write(chalk.dim("\nNo speech detected.\n> "));
          return null;
        }
        return transcript;
      } catch (err: unknown) {
        cleanupMicFile();
        process.stdout.write(chalk.yellow(`\n${friendlyVoiceError(err)}\n> `));
        return null;
      }
    };

    const onKeypress = async (_str: string, key: readline.Key) => {
      if (key.ctrl && key.name === "c") {
        finish(null);
        return;
      }

      if (key.name === "escape") {
        if (isRecording) {
          await cancelRecording();
        }
        return;
      }

      if (isRecording) {
        if (key.name === "return") {
          const transcript = await stopAndTranscribe();
          if (transcript) {
            console.log(chalk.hex("#e8dcf8")(`You said: ${chalk.bold(transcript)}`));
            finish(transcript);
          }
        }
        return;
      }

      if (key.name === "v" && buffer === "") {
        await startRecording();
        return;
      }

      if (key.name === "return") {
        finish(buffer.trim() || null);
        return;
      }

      if (key.name === "backspace") {
        if (buffer.length > 0) {
          buffer = buffer.slice(0, -1);
          process.stdout.write("\b \b");
        }
        return;
      }

      if (_str && !key.ctrl && !key.meta && key.name !== "tab") {
        buffer += _str;
        process.stdout.write(_str);
      }
    };

    process.stdin.on("keypress", onKeypress);
  });
}
