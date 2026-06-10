export interface MemoryTurn {
  role: "user" | "assistant";
  content: string;
  intent?: string;
  timestamp: number;
}

export class SessionMemory {
  private turns: MemoryTurn[] = [];
  private readonly maxTurns: number;

  constructor(maxTurns = 20) {
    this.maxTurns = maxTurns;
  }

  addUser(content: string, intent?: string): void {
    this.turns.push({
      role: "user",
      content: content.trim(),
      intent,
      timestamp: Date.now(),
    });
    this.trim();
  }

  addAssistant(content: string): void {
    this.turns.push({
      role: "assistant",
      content: content.trim(),
      timestamp: Date.now(),
    });
    this.trim();
  }

  wrapPrompt(prompt: string): string {
    const recent = this.turns.slice(-6);
    if (recent.length === 0) return prompt.trim();

    const history = recent
      .map((turn) => `${turn.role === "user" ? "User" : "Assistant"}: ${turn.content}`)
      .join("\n");

    return [
      "Session context from earlier in this conversation:",
      history,
      "",
      "Current request:",
      prompt.trim(),
    ].join("\n");
  }

  getHistory(): MemoryTurn[] {
    return [...this.turns];
  }

  clear(): void {
    this.turns = [];
  }

  isEmpty(): boolean {
    return this.turns.length === 0;
  }

  private trim(): void {
    if (this.turns.length > this.maxTurns) {
      this.turns = this.turns.slice(-this.maxTurns);
    }
  }
}
