import chalk from "chalk";
import readline from "node:readline";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { text, isCancel } from "@clack/prompts";

import { loadConfig } from "../../config/config.ts";
import { AudioRecorder } from "./audio-recorder.ts";
import { SttService, getSttReadiness } from "./stt-service.ts";
import { friendlyVoiceError, isSilentRecording } from "./voice-errors.ts";
import { getComposerModelLabel, printComposer } from "./composer-ui.ts";

export interface PromptWithVoiceOptions {
  message?: string;
  placeholder?: string;
  continuation?: boolean;
}

export function isVoiceEnabled(): boolean {
  const config = loadConfig();
  return config.voiceEnabled !== false;
}

export function printVoiceBanner(): void {
  if (!isVoiceEnabled()) return;

  const readiness = getSttReadiness();
  if (readiness.ok) {
    console.log(chalk.dim(`Composer · Tab → 🎤 voice · STT: ${readiness.provider}`));
  } else {
    console.log(chalk.yellow(`Voice STT: ${readiness.message}`));
    console.log(chalk.dim("Type in composer · run: vorexis-claw settings"));
  }
  console.log();
}

function waitForRecordingStop(): Promise<boolean> {
  return new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin);
    const wasRaw = process.stdin.isRaw;
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const cleanup = () => {
      process.stdin.removeListener("keypress", onKeypress);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(wasRaw ?? false);
      }
    };

    const onKeypress = (_str: string, key: readline.Key) => {
      if (key.name === "return") {
        cleanup();
        resolve(true);
        return;
      }
      if (key.name === "escape" || (key.ctrl && key.name === "c")) {
        cleanup();
        resolve(false);
      }
    };

    process.stdin.on("keypress", onKeypress);
  });
}

async function promptWithComposer(options: PromptWithVoiceOptions): Promise<string | null> {
  const placeholder =
    options.placeholder ??
    (options.continuation
      ? "Continue — plan, build, fix..."
      : "Plan, Build, fix, understand, or plan...");

  if (options.message) {
    console.log(chalk.hex("#e8dcf8").bold(options.message));
    console.log();
  }

  printComposer({ placeholder, modelLabel: getComposerModelLabel() });
  process.stdout.write(`${chalk.dim(">")} `);

  if (!process.stdin.isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
      rl.on("line", (line) => {
        rl.close();
        resolve(line.trim() || null);
      });
    });
  }

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

    const startRecording = async () => {
      if (isRecording) return;

      const readiness = getSttReadiness();
      if (!readiness.ok) {
        process.stdout.write(chalk.yellow(`\n${readiness.message}\n> `));
        return;
      }

      isRecording = true;
      buffer = "";
      process.stdout.write(chalk.red("\n🎙 Recording… ENTER stop · ESC cancel\n"));

      const tempMicPath = path.join(os.tmpdir(), "vorexis_claw_mic.wav");
      const rec = new AudioRecorder();

      try {
        await rec.start({ outputPath: tempMicPath });
      } catch {
        isRecording = false;
        process.stdout.write(chalk.yellow("\nMic unavailable.\n> "));
        return;
      }

      const stopped = await waitForRecordingStop();
      isRecording = false;

      if (!stopped) {
        try {
          await rec.stop();
        } catch {
          // ignore
        }
        if (fs.existsSync(tempMicPath)) fs.unlinkSync(tempMicPath);
        process.stdout.write(chalk.dim("\nCancelled.\n> "));
        return;
      }

      try {
        await rec.stop();
      } catch {
        process.stdout.write(chalk.yellow("\nRecording failed.\n> "));
        return;
      }

      if (isSilentRecording(tempMicPath)) {
        if (fs.existsSync(tempMicPath)) fs.unlinkSync(tempMicPath);
        process.stdout.write(chalk.dim("\nNo speech detected.\n> "));
        return;
      }

      process.stdout.write(chalk.yellow("\nTranscribing... "));
      try {
        const stt = new SttService();
        const transcript = (await stt.transcribe({ filePath: tempMicPath })).trim();
        if (fs.existsSync(tempMicPath)) fs.unlinkSync(tempMicPath);
        if (!transcript) {
          process.stdout.write(chalk.dim("\nNo speech detected.\n> "));
          return;
        }
        console.log(chalk.hex("#e8dcf8")(`\n🎤 ${chalk.bold(transcript)}\n`));
        finish(transcript);
      } catch (err: unknown) {
        if (fs.existsSync(tempMicPath)) fs.unlinkSync(tempMicPath);
        process.stdout.write(chalk.yellow(`\n${friendlyVoiceError(err)}\n> `));
      }
    };

    const onKeypress = async (_str: string, key: readline.Key) => {
      if (key.ctrl && key.name === "c") {
        finish(null);
        return;
      }

      if (isRecording) return;

      if (key.name === "tab") {
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

export async function promptWithVoice(
  options: PromptWithVoiceOptions = {}
): Promise<string | null> {
  if (!isVoiceEnabled()) {
    const result = await text({
      message: options.message || "What would you like to build, fix, understand, or plan?",
      placeholder: options.placeholder,
    });
    if (isCancel(result) || !result.trim()) return null;
    return result.trim();
  }

  const message =
    options.message ||
    (options.continuation
      ? undefined
      : "What would you like to build, fix, understand, or plan?");

  return promptWithComposer({ ...options, message });
}
