import { spawn, execSync } from "node:child_process";
import os from "node:os";
import fs from "node:fs";

export class AudioPlayer {
  constructor() {}

  /**
   * Plays an audio file (.mp3 or .wav) and resolves when playback is complete.
   */
  public play(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filePath)) {
        return reject(new Error(`Audio file not found: ${filePath}`));
      }

      const platform = os.platform();

      if (platform === "win32") {
        // Run inline PowerShell to play the sound
        const psCommand = `
          Add-Type -AssemblyName PresentationCore
          $player = New-Object System.Windows.Media.MediaPlayer
          $player.Open('${filePath.replace(/'/g, "''")}')
          $player.Play()
          $count = 0
          while ($player.NaturalDuration.HasTimeSpan -eq $false -and $count -lt 100) {
            Start-Sleep -Milliseconds 50
            $count++
          }
          if ($player.NaturalDuration.HasTimeSpan) {
            Start-Sleep -Milliseconds ($player.NaturalDuration.TimeSpan.TotalMilliseconds + 100)
          } else {
            # Fallback sleep if duration loading timed out
            Start-Sleep -Seconds 5
          }
          $player.Close()
        `;

        const child = spawn("powershell.exe", [
          "-NoProfile",
          "-ExecutionPolicy",
          "Bypass",
          "-Command",
          psCommand
        ]);

        child.on("exit", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`PowerShell audio playback exited with code ${code}`));
          }
        });

        child.on("error", reject);
      } else if (platform === "darwin") {
        // afplay is pre-installed on macOS
        const child = spawn("afplay", [filePath]);

        child.on("exit", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`afplay playback exited with code ${code}`));
          }
        });

        child.on("error", reject);
      } else if (platform === "linux") {
        // Try common Linux audio players
        let playerCmd = "";
        let playerArgs: string[] = [];

        if (this.commandExists("paplay") && filePath.endsWith(".wav")) {
          playerCmd = "paplay";
          playerArgs = [filePath];
        } else if (this.commandExists("aplay") && filePath.endsWith(".wav")) {
          playerCmd = "aplay";
          playerArgs = [filePath];
        } else if (this.commandExists("mpg123")) {
          playerCmd = "mpg123";
          playerArgs = [filePath];
        } else if (this.commandExists("ffplay")) {
          playerCmd = "ffplay";
          playerArgs = ["-nodisp", "-autoexit", filePath];
        } else if (this.commandExists("play")) {
          // SoX play
          playerCmd = "play";
          playerArgs = [filePath];
        } else {
          return reject(new Error("No suitable Linux audio player found (install paplay, aplay, mpg123, ffplay, or play)."));
        }

        const child = spawn(playerCmd, playerArgs);

        child.on("exit", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Linux player ${playerCmd} exited with code ${code}`));
          }
        });

        child.on("error", reject);
      } else {
        reject(new Error(`Audio playback not supported on platform: ${platform}`));
      }
    });
  }

  private commandExists(cmd: string): boolean {
    try {
      execSync(`which ${cmd}`, { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }
}
