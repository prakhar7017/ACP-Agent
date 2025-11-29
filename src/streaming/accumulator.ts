// src/streaming/accumulator.ts
// Accumulates streaming message chunks into complete messages

export interface StreamAccumulator {
  content: string;
  isComplete: boolean;
  lastUpdate: number;
}

export class StreamingAccumulator {
  private accumulators: Map<string, StreamAccumulator> = new Map();
  private defaultTimeout = 5000; // 5 seconds of inactivity before considering stream dead

  /**
   * Accumulate a chunk of content for a given stream ID
   */
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

    // Clean up if done
    if (done) {
      // Keep for a short time after completion for final access
      setTimeout(() => {
        this.accumulators.delete(streamId);
      }, 1000);
    }

    return accumulator.content;
  }

  /**
   * Get current accumulated content for a stream
   */
  getContent(streamId: string): string {
    const accumulator = this.accumulators.get(streamId);
    return accumulator?.content || "";
  }

  /**
   * Check if a stream is complete
   */
  isComplete(streamId: string): boolean {
    const accumulator = this.accumulators.get(streamId);
    return accumulator?.isComplete || false;
  }

  /**
   * Reset a stream accumulator
   */
  reset(streamId: string): void {
    this.accumulators.delete(streamId);
  }

  /**
   * Clear all accumulators
   */
  clear(): void {
    this.accumulators.clear();
  }

  /**
   * Clean up stale accumulators (inactive for more than timeout)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [id, acc] of this.accumulators.entries()) {
      if (now - acc.lastUpdate > this.defaultTimeout && !acc.isComplete) {
        this.accumulators.delete(id);
      }
    }
  }

  /**
   * Generate a unique stream ID for a message
   */
  static generateStreamId(): string {
    return `stream-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

