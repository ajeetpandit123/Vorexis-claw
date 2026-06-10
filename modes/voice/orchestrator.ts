import chalk from "chalk";
import { select, isCancel } from "@clack/prompts";
import readline from "node:readline";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

import { AudioRecorder } from "./audio-recorder.ts";
import { AudioPlayer } from "./audio-player.ts";
import { SttService } from "./stt-service.ts";
import { TtsService } from "./tts-service.ts";

import { runAsk } from "../ask/orchestrator.ts";
import { runPlan } from "../plan/orchestrator.ts";
import { runAgent } from "../agent/orchestrator.ts";
import { loadConfig, resolveApiKey, showOnboardingError } from "../../config/config.ts";

type ActiveState = "idle" | "listening" | "processing" | "speaking";

function normalizeSttProvider(provider: string | undefined): string {
  if (!provider || provider === "browser") {
    return "whisper";
  }
  return provider;
}

function shouldSpeakResponse(config: ReturnType<typeof loadConfig>): boolean {
  if (config.voiceOutput === false) return false;
  return (config.textToSpeechProvider || "edge-tts") !== "none";
}

export async function runVoiceMode() {
  const config = loadConfig();

  if (config.voiceEnabled === false) {
    console.log(chalk.yellow("\n[!] Voice Mode is disabled. Enable it in settings: vorexis-claw settings\n"));
    return;
  }

  if (!resolveApiKey()) {
    showOnboardingError();
    return;
  }

  const subMode = await select({
    message: "Select Voice Sub-Mode to run:",
    options: [
      { value: "ask", label: "Ask Mode - codebase questions" },
      { value: "plan", label: "Plan Mode - step-by-step goals" },
      { value: "agent", label: "Agent Mode - autonomous execution" },
      { value: "back", label: "Back to CLI Menu" }
    ]
  });

  if (isCancel(subMode) || subMode === "back") return;

  const sttProvider = normalizeSttProvider(config.speechToTextProvider);
  const recorder = new AudioRecorder();
  const player = new AudioPlayer();
  const stt = new SttService();
  const tts = new TtsService();

  const tempMicPath = path.join(os.tmpdir(), "vorexis_claw_mic.wav");
  const tempTtsPath = path.join(os.tmpdir(), "vorexis_claw_tts.mp3");

  let exitRequested = false;
  let activeState: ActiveState = "idle";
  let isRecording = false;
  let keypressTimeout: ReturnType<typeof setTimeout> | null = null;

  console.log(chalk.hex("#5b4d9e").bold("\n🎙 Voice Mode Activated\n"));
  console.log(chalk.cyan(`Speech-To-Text: ${sttProvider.toUpperCase()}`));
  console.log(
    chalk.cyan(
      `Voice Output: ${shouldSpeakResponse(config) ? (config.textToSpeechProvider || "edge-tts").toUpperCase() : "OFF"}`
    )
  );
  console.log();
  console.log("Press ENTER to start recording");
  console.log("Hold SPACE or V to push-to-talk");
  console.log("Press ESC to cancel");
  console.log("Press CTRL+C to exit");
  console.log();

  const cleanup = () => {
    exitRequested = true;
    if (keypressTimeout) {
      clearTimeout(keypressTimeout);
      keypressTimeout = null;
    }
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.removeAllListeners("keypress");
    process.stdin.pause();
  };

  const speakText = async (textToSpeak: string) => {
    if (!shouldSpeakResponse(config)) return;

    activeState = "speaking";
    try {
      await tts.synthesize({ text: textToSpeak, outputPath: tempTtsPath });
      await player.play(tempTtsPath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`[TTS Error] Could not speak response: ${message}`));
    } finally {
      activeState = "idle";
    }
  };

  const runSubMode = async (prompt: string): Promise<string> => {
    if (subMode === "ask") {
      return runAsk(prompt);
    }
    if (subMode === "plan") {
      return runPlan(prompt, async () => true);
    }
    return runAgent(prompt, async () => true);
  };

  const processPrompt = async (prompt: string) => {
    if (!prompt.trim() || exitRequested) return;

    activeState = "processing";
    console.log(chalk.hex("#e8dcf8")(`\nYou said:\n${chalk.bold(prompt)}\n`));

    try {
      const aiResponse = await runSubMode(prompt);

      console.log(chalk.hex("#5b4d9e")("─".repeat(50)));
      console.log(aiResponse);
      console.log(chalk.hex("#5b4d9e")("─".repeat(50)));

      await speakText(aiResponse);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.log(chalk.red(`[AI Error] ${message}`));
      await speakText("Sorry, an error occurred during execution.");
    } finally {
      activeState = "idle";
    }
  };

  const cancelRecording = async () => {
    if (!isRecording) return;

    isRecording = false;
    activeState = "idle";
    if (keypressTimeout) {
      clearTimeout(keypressTimeout);
      keypressTimeout = null;
    }

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

    console.log(chalk.dim("\nRecording cancelled.\n"));
  };

  const startRecording = async () => {
    if (isRecording || activeState !== "idle") return false;

    isRecording = true;
    activeState = "listening";
    process.stdout.write(chalk.red("\n🎙 Recording... "));

    try {
      await recorder.start({ outputPath: tempMicPath });
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`\nRecording failed: ${message}\n`));
      isRecording = false;
      activeState = "idle";
      return false;
    }
  };

  const stopAndTranscribe = async (): Promise<string | null> => {
    if (!isRecording) return null;

    isRecording = false;
    if (keypressTimeout) {
      clearTimeout(keypressTimeout);
      keypressTimeout = null;
    }

    process.stdout.write(chalk.yellow("Transcribing...\n"));
    activeState = "processing";

    try {
      await recorder.stop();

      const prompt = await stt.transcribe({ filePath: tempMicPath });

      if (fs.existsSync(tempMicPath)) {
        try {
          fs.unlinkSync(tempMicPath);
        } catch {
          // Ignore cleanup errors
        }
      }

      activeState = "idle";
      return prompt.trim() || null;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`\nTranscription failed: ${message}\n`));
      activeState = "idle";
      return null;
    }
  };

  const showListeningPrompt = () => {
    if (exitRequested) return;
    console.log(chalk.green("\n🎙 Listening...\n"));
    console.log(chalk.dim("ENTER to record · Hold SPACE/V · ESC to cancel · CTRL+C to exit"));
  };

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();

  const waitForKeyAction = (): Promise<"recorded" | "cancelled" | "exit"> => {
    return new Promise((resolve) => {
      let settled = false;

      const finish = (result: "recorded" | "cancelled" | "exit") => {
        if (settled) return;
        settled = true;
        process.stdin.removeListener("keypress", onKeypress);
        resolve(result);
      };

      const onKeypress = async (_str: string, key: readline.Key) => {
        if (exitRequested) {
          cleanup();
          finish("exit");
          return;
        }

        if (key.ctrl && key.name === "c") {
          cleanup();
          console.log(chalk.yellow("\nVoice Mode ended.\n"));
          finish("exit");
          return;
        }

        if (key.name === "escape") {
          if (isRecording) {
            await cancelRecording();
            finish("cancelled");
          }
          return;
        }

        if (key.name === "return") {
          if (activeState !== "idle" && activeState !== "listening") return;

          if (!isRecording) {
            await startRecording();
            return;
          }

          const transcript = await stopAndTranscribe();
          if (transcript) {
            await processPrompt(transcript);
            finish("recorded");
          } else {
            console.log(chalk.dim("No speech detected.\n"));
            finish("cancelled");
          }
          return;
        }

        if (key.name === "space" || key.name === "v") {
          if (activeState !== "idle" && activeState !== "listening") return;

          if (!isRecording) {
            await startRecording();
          }

          if (keypressTimeout) {
            clearTimeout(keypressTimeout);
          }

          keypressTimeout = setTimeout(async () => {
            if (!isRecording) return;

            keypressTimeout = null;

            const transcript = await stopAndTranscribe();
            if (transcript) {
              await processPrompt(transcript);
              finish("recorded");
            } else {
              console.log(chalk.dim("No speech detected.\n"));
              finish("cancelled");
            }
          }, 500);
        }
      };

      process.stdin.on("keypress", onKeypress);
    });
  };

  const continuous = config.autoListen !== false;

  try {
    while (!exitRequested) {
      showListeningPrompt();
      const result = await waitForKeyAction();
      if (result === "exit") break;
      if (!continuous && result === "recorded") break;
    }
  } finally {
    cleanup();
  }
}
