export interface StreamAccumulator {
  content: string;
  isComplete: boolean;
  lastUpdate: number;
}

export class StreamingAccumulator {
  private accumulators: Map<string, StreamAccumulator> = new Map();
  private defaultTimeout = 5000;

  
  accumulate(streamId: string, chunk: string, done: boolean = false): string {
    const now = Date.now();
    
    if (!this.accumulators.has(streamId)) {
      this.accumulators.set(streamId, {
        content: "",
        isComplete: false,
        lastUpdate: now,
      });
    }

    const accumulator = this.accumulators.get(streamId)!;
    accumulator.content += chunk;
    accumulator.lastUpdate = now;
    accumulator.isComplete = done;

    if (done) {

      setTimeout(() => {
        this.accumulators.delete(streamId);
      }, 1000);
    }

    return accumulator.content;
  }

  
  getContent(streamId: string): string {
    const accumulator = this.accumulators.get(streamId);
    return accumulator?.content || "";
  }

  
  isComplete(streamId: string): boolean {
    const accumulator = this.accumulators.get(streamId);
    return accumulator?.isComplete || false;
  }

  
  reset(streamId: string): void {
    this.accumulators.delete(streamId);
  }

  
  clear(): void {
    this.accumulators.clear();
  }

  
  cleanup(): void {
    const now = Date.now();
    for (const [id, acc] of this.accumulators.entries()) {
      if (now - acc.lastUpdate > this.defaultTimeout && !acc.isComplete) {
        this.accumulators.delete(id);
      }
    }
  }

  
  static generateStreamId(): string {
    return `stream-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

