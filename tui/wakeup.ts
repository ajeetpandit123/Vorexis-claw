import { runSession } from "./session.ts";

export async function runWakeup(): Promise<void> {
  await runSession();
}
