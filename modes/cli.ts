import { runSession } from "../tui/session.ts";

/** @deprecated Use runSession() — v2 single-prompt architecture */
export async function runCliMode(): Promise<void> {
  await runSession();
}
