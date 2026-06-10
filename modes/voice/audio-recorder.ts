import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const SWIFT_RECORDER_CODE = `
import Foundation
import AVFoundation

guard CommandLine.arguments.count > 1 else {
    print("Error: Missing output file path")
    exit(1)
}
let filePath = CommandLine.arguments[1]
let fileURL = URL(fileURLWithPath: filePath)

let settings: [String: Any] = [
    AVFormatIDKey: Int(kAudioFormatLinearPCM),
    AVSampleRateKey: 16000.0,
    AVNumberOfChannelsKey: 1,
    AVLinearPCMBitDepthKey: 16,
    AVLinearPCMIsBigEndianKey: false,
    AVLinearPCMIsFloatKey: false
]

do {
    let recorder = try AVAudioRecorder(url: fileURL, settings: settings)
    if !recorder.prepareToRecord() {
        print("Error: Failed to prepare recorder")
        exit(1)
    }
    recorder.record()
    print("RECORDING_STARTED")
    fflush(stdout)
    
    // Wait for input to stop
    _ = readLine()
    
    recorder.stop()
    exit(0)
} catch {
    print("Error: \\(error)")
    exit(1)
}
`;

const POWERSHELL_RECORDER_CODE = `
$code = @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class AudioRecorder {
    [DllImport("winmm.dll", CharSet = CharSet.Auto)]
    public static extern int mciSendString(string lpstrCommand, StringBuilder lpstrReturnString, int uReturnLength, IntPtr hwndCallback);
}
"@
Add-Type -TypeDefinition $code -Language CSharp -ErrorAction SilentlyContinue

$filePath = $args[0]
[AudioRecorder]::mciSendString("open new type waveaudio alias recsound", $null, 0, [IntPtr]::Zero)
[AudioRecorder]::mciSendString("set recsound bitspersample 16 channels 1 samplespersec 16000 bytespersec 32000 alignment 2", $null, 0, [IntPtr]::Zero)
[AudioRecorder]::mciSendString("record recsound", $null, 0, [IntPtr]::Zero)
Write-Output "RECORDING_STARTED"

# Wait for stdin to stop
[Console]::ReadLine()

[AudioRecorder]::mciSendString("stop recsound", $null, 0, [IntPtr]::Zero)
[AudioRecorder]::mciSendString("save recsound \`"$filePath\`"", $null, 0, [IntPtr]::Zero)
[AudioRecorder]::mciSendString("close recsound", $null, 0, [IntPtr]::Zero)
`;

export interface RecorderOptions {
  outputPath: string;
}

export class AudioRecorder {
  private process: ChildProcess | null = null;
  private tempScriptPath: string | null = null;

  constructor() {}

  /**
   * Starts recording audio.
   * Resolves when the recording process has successfully started.
   */
  public start(options: RecorderOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const platform = os.platform();
      const outputDir = path.dirname(options.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // If output file already exists, delete it
      if (fs.existsSync(options.outputPath)) {
        fs.unlinkSync(options.outputPath);
      }

      if (platform === "win32") {
        this.tempScriptPath = path.join(os.tmpdir(), "vorexis_win_record.ps1");
        fs.writeFileSync(this.tempScriptPath, POWERSHELL_RECORDER_CODE, "utf-8");

        this.process = spawn("powershell.exe", [
          "-NoProfile",
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          this.tempScriptPath,
          options.outputPath
        ]);
      } else if (platform === "darwin") {
        this.tempScriptPath = path.join(os.tmpdir(), "vorexis_mac_record.swift");
        fs.writeFileSync(this.tempScriptPath, SWIFT_RECORDER_CODE, "utf-8");

        this.process = spawn("swift", [this.tempScriptPath, options.outputPath]);
      } else if (platform === "linux") {
        // Linux uses arecord directly
        this.process = spawn("arecord", [
          "-f",
          "S16_LE",
          "-c",
          "1",
          "-r",
          "16000",
          options.outputPath
        ]);
      } else {
        return reject(new Error(`Unsupported platform for local audio recording: ${platform}`));
      }

      let started = false;
      const onData = (data: Buffer) => {
        const text = data.toString();
        if (text.includes("RECORDING_STARTED")) {
          started = true;
          resolve();
        }
      };

      if (platform === "linux") {
        // arecord doesn't output "RECORDING_STARTED", it starts immediately
        setTimeout(() => {
          started = true;
          resolve();
        }, 300);
      } else {
        this.process.stdout?.on("data", onData);
      }

      this.process.stderr?.on("data", (data) => {
        const text = data.toString().trim();
        // Check for mic permission errors
        if (text.toLowerCase().includes("permission") || text.toLowerCase().includes("privacy")) {
          reject(new Error(`Microphone permission error: ${text}`));
        }
      });

      this.process.on("error", (err) => {
        reject(err);
      });

      // Timeout if it takes too long to start
      setTimeout(() => {
        if (!started) {
          this.cleanup();
          reject(new Error("Audio recording failed to start (timeout)."));
        }
      }, 5000);
    });
  }

  /**
   * Stops recording audio and saves to path.
   * Resolves when the file is ready.
   */
  public stop(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.process) {
        return reject(new Error("No recording process running."));
      }

      const platform = os.platform();

      this.process.on("exit", (code) => {
        this.cleanup();
        if (code === 0 || platform === "linux") {
          resolve("Audio file saved successfully");
        } else {
          reject(new Error(`Recording process exited with code ${code}`));
        }
      });

      if (platform === "linux") {
        // arecord stops on SIGINT/SIGTERM
        this.process.kill("SIGTERM");
      } else {
        // Windows/macOS scripts stop when writing a newline to stdin
        if (this.process.stdin && !this.process.stdin.destroyed) {
          this.process.stdin.write("\n");
          this.process.stdin.end();
        } else {
          this.process.kill("SIGTERM");
        }
      }
    });
  }

  private cleanup(): void {
    this.process = null;
    if (this.tempScriptPath && fs.existsSync(this.tempScriptPath)) {
      try {
        fs.unlinkSync(this.tempScriptPath);
      } catch (e) {}
    }
    this.tempScriptPath = null;
  }
}
