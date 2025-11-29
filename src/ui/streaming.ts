// src/ui/streaming.ts
// Incremental content display for streaming messages

import chalk from "chalk";
import { stdout } from "process";

export class StreamingDisplay {
  private currentStreamId: string | null = null;
  private lastContent: string = "";
  private lastLineCount: number = 0;
  private isActive: boolean = false;

  /**
   * Start displaying a new stream
   */
  start(streamId: string, initialContent: string = ""): void {
    this.currentStreamId = streamId;
    this.lastContent = initialContent;
    this.isActive = true;
    this.lastLineCount = initialContent.split("\n").length;

    // Display initial content if any
    if (initialContent) {
      this.update(initialContent);
    } else {
      // Start with model message header
      process.stdout.write("\n" + chalk.blue.bold("🤖 Model:") + "\n");
    }
  }

  /**
   * Update the displayed content incrementally
   */
  update(content: string): void {
    if (!this.isActive || !this.currentStreamId) return;

    // Calculate what's new
    const newContent = content.slice(this.lastContent.length);
    
    if (newContent.length > 0) {
      // Write new content
      process.stdout.write(newContent);
      this.lastContent = content;
      
      // Update line count for cleanup purposes
      this.lastLineCount = content.split("\n").length;
    }
  }

  /**
   * Complete the stream and finalize display
   */
  complete(finalContent: string = ""): void {
    if (!this.isActive) return;

    const contentToShow = finalContent || this.lastContent;
    
    // Ensure we end on a newline
    if (contentToShow && !contentToShow.endsWith("\n")) {
      process.stdout.write("\n");
    }

    // Clear any partial lines and reset
    this.isActive = false;
    this.currentStreamId = null;
    this.lastContent = "";
    this.lastLineCount = 0;
    
    // Write final newline for spacing
    process.stdout.write("\n");
  }

  /**
   * Cancel/clear the current stream
   */
  cancel(): void {
    if (!this.isActive) return;
    
    // Clear the current line
    stdout.write("\r\x1b[K");
    
    this.isActive = false;
    this.currentStreamId = null;
    this.lastContent = "";
    this.lastLineCount = 0;
  }

  /**
   * Check if a stream is currently active
   */
  isStreaming(): boolean {
    return this.isActive;
  }

  /**
   * Get the current stream ID
   */
  getCurrentStreamId(): string | null {
    return this.currentStreamId;
  }
}

// Singleton instance for global streaming display
export const streamingDisplay = new StreamingDisplay();

// Character-by-character streaming (slower, more visual)
export class CharacterStreamDisplay {
  private currentStreamId: string | null = null;
  private accumulatedContent: string = "";
  private displayContent: string = "";
  private interval: NodeJS.Timeout | null = null;
  private isActive: boolean = false;
  private charDelay: number = 10; // ms between characters

  start(streamId: string): void {
    if (this.isActive) {
      this.cancel();
    }

    this.currentStreamId = streamId;
    this.accumulatedContent = "";
    this.displayContent = "";
    this.isActive = true;

    process.stdout.write("\n" + chalk.blue.bold("🤖 Model:") + "\n");
    
    // Start character streaming interval
    this.interval = setInterval(() => {
      this.tick();
    }, this.charDelay);
  }

  append(content: string): void {
    if (!this.isActive) return;
    this.accumulatedContent += content;
  }

  private tick(): void {
    if (!this.isActive || this.accumulatedContent.length === this.displayContent.length) {
      return;
    }

    // Display next character(s) - can display multiple for better performance
    const remaining = this.accumulatedContent.slice(this.displayContent.length);
    const toDisplay = remaining.slice(0, 3); // Display up to 3 chars per tick
    
    if (toDisplay.length > 0) {
      process.stdout.write(toDisplay);
      this.displayContent += toDisplay;
    }
  }

  complete(finalContent?: string): void {
    if (!this.isActive) return;

    // Clear interval
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    // Display any remaining content immediately
    const final = finalContent || this.accumulatedContent;
    const remaining = final.slice(this.displayContent.length);
    if (remaining.length > 0) {
      process.stdout.write(remaining);
    }

    // Ensure newline
    process.stdout.write("\n\n");

    // Reset
    this.isActive = false;
    this.currentStreamId = null;
    this.accumulatedContent = "";
    this.displayContent = "";
  }

  cancel(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    this.isActive = false;
    this.currentStreamId = null;
    this.accumulatedContent = "";
    this.displayContent = "";
    
    stdout.write("\r\x1b[K");
  }
}

